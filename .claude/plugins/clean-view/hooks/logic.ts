import type { CleanViewChecklist, CleanViewLogEntry, CleanViewTask } from '../types'

export const MAX_NAME = 40
export const METER_CELLS = 10
export const FALLBACK_NAME = 'Working on it'
export const PLACEHOLDER_PREFIX = 'placeholder-'

const CODE_FILE =
  /\.(tsx?|jsx?|mjs|cjs|mts|cts|py|go|rs|rb|java|kt|swift|c|cc|cpp|h|hpp|cs|php|sh|bash|zsh|json|ya?ml|toml|md|html?|css|scss|sql|lock|xml|ini|env|vue|svelte)[)\].,:;!?'"]*$/i

/** One plain name: no code, no paths, no file names, at most 40 characters. */
export function cleanName(raw: string): string {
  const words = raw
    .replace(/`[^`]*`/g, ' ')
    .replace(/`/g, ' ')
    .split(/\s+/)
    .filter(word => word !== '' && !/[/\\]/.test(word) && !CODE_FILE.test(word))
  let name = words.join(' ').trim()
  if (name === '') return FALLBACK_NAME
  name = name[0].toUpperCase() + name.slice(1)
  if (name.length <= MAX_NAME) return name
  const cut = name.slice(0, MAX_NAME - 1)
  const space = cut.lastIndexOf(' ')
  return `${(space > 0 ? cut.slice(0, space) : cut).trimEnd()}…`
}

export function clampPercent(percent: number): number {
  if (!Number.isFinite(percent)) return 0
  return Math.round(Math.min(100, Math.max(0, percent)))
}

export const EMPTY: CleanViewChecklist = {
  title: '',
  phase: 'idle',
  tasks: [],
  activity: null,
  needsYouReason: null,
  stuckReason: null,
  startedAt: 0,
  finishedAt: null,
  isCollapsed: false,
}

export function isRunning(list: CleanViewChecklist): boolean {
  return list.phase === 'working' || list.phase === 'needsYou' || (list.phase === 'stuck' && list.finishedAt === null)
}

export function hasPlan(list: CleanViewChecklist): boolean {
  return list.tasks.length > 0 && list.tasks.every(task => !task.id.startsWith(PLACEHOLDER_PREFIX))
}

function task(id: string, name: string, status: CleanViewTask['status'], at?: number): CleanViewTask {
  return {
    id,
    name,
    status,
    percent: status === 'done' ? 100 : 0,
    hasReported: false,
    ...(status !== 'upcoming' && at !== undefined ? { startedAt: at } : {}),
    ...(status === 'done' && at !== undefined ? { finishedAt: at } : {}),
  }
}

export function newJob(startedAt: number, title: string): CleanViewChecklist {
  return {
    ...EMPTY,
    title,
    phase: 'working',
    startedAt,
    activity: { summary: 'Thinking...', at: startedAt, inProgress: true },
    tasks: [task(`${PLACEHOLDER_PREFIX}thinking`, 'Thinking...', 'active', startedAt)],
  }
}

/** Lays out the plan: steps already done stay done, and the first unfinished one starts now. */
export function planSteps(list: CleanViewChecklist, steps: readonly string[], at = list.startedAt, title?: string): CleanViewChecklist {
  const kept = new Map(list.tasks.map(one => [one.name.toLowerCase(), one]))
  const names = steps.map(cleanName).slice(0, 8)
  let tasks = (names.length > 0 ? names : [FALLBACK_NAME]).map((name, i): CleanViewTask => {
    const before = kept.get(name.toLowerCase())
    if (before?.status === 'done') {
      return {
        ...task(`step-${i}-${name}`, name, 'done', at),
        startedAt: before.startedAt ?? at,
        finishedAt: before.finishedAt ?? at,
      }
    }
    return {
      ...task(`step-${i}-${name}`, name, 'upcoming'),
      ...(before?.startedAt !== undefined ? { startedAt: before.startedAt } : {}),
    }
  })
  const first = tasks.findIndex(one => one.status !== 'done')
  if (first !== -1) {
    tasks = tasks.map((one, i) => (i === first ? { ...one, status: 'active', startedAt: one.startedAt ?? at } : one))
  }
  const nextTitle = title?.trim() ? cleanName(title) : list.title
  return { ...list, title: nextTitle, tasks }
}

function same(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase()
}

/** Every step from `index` on: the one at `index` active, the rest upcoming unless done. */
function activate(tasks: CleanViewTask[], index: number, percent: number, hasReported: boolean, at: number): CleanViewTask[] {
  return tasks.map((one, i) => {
    if (i < index) {
      return {
        ...one,
        status: 'done',
        percent: 100,
        startedAt: one.startedAt ?? at,
        finishedAt: one.finishedAt ?? at,
      }
    }
    if (i === index) {
      return {
        ...one,
        status: 'active',
        percent,
        hasReported,
        startedAt: one.startedAt ?? at,
        finishedAt: undefined,
      }
    }
    return one.status === 'active' ? { ...one, status: 'upcoming', finishedAt: undefined } : one
  })
}

/** Moves the plan forward for a report on `name`: earlier steps check off, 100 starts the next. */
export function reportProgress(list: CleanViewChecklist, name: string, percent: number, at = list.startedAt): CleanViewChecklist {
  const clean = cleanName(name)
  const p = clampPercent(percent)
  let tasks = list.tasks.filter(one => !one.id.startsWith(PLACEHOLDER_PREFIX))
  let index = tasks.findIndex(one => same(one.name, clean))
  if (index === -1) {
    const active = tasks.findIndex(one => one.status === 'active')
    index = active === -1 ? tasks.length : active
    tasks = [...tasks.slice(0, index), task(`step-x${tasks.length}-${clean}`, clean, 'upcoming'), ...tasks.slice(index)]
  }
  tasks = activate(tasks, index, p, true, at)
  if (p >= 100) {
    tasks = tasks.map((one, i) =>
      i === index
        ? { ...one, status: 'done', percent: 100, startedAt: one.startedAt ?? at, finishedAt: one.finishedAt ?? at }
        : one,
    )
    const next = tasks.findIndex((one, i) => i > index && one.status !== 'done')
    if (next !== -1) tasks = activate(tasks, next, 0, false, at)
  }
  return { ...list, tasks }
}

type TodoItem = { content: string; status: 'pending' | 'in_progress' | 'completed'; activeForm?: string }

/** A to-do list as the plan: completed rows done, the in-progress one active. */
export function fromTodos(list: CleanViewChecklist, todos: readonly TodoItem[], at = list.startedAt): CleanViewChecklist {
  const kept = new Map(list.tasks.map(one => [one.name.toLowerCase(), one]))
  let tasks = todos.map((todo, i): CleanViewTask => {
    const name = cleanName(todo.content)
    const before = kept.get(name.toLowerCase())
    if (todo.status === 'completed') {
      return {
        ...task(`todo-${i}-${name}`, name, 'done', at),
        startedAt: before?.startedAt ?? at,
        finishedAt: before?.finishedAt ?? at,
      }
    }
    if (todo.status === 'in_progress') {
      return {
        id: `todo-${i}-${name}`,
        name,
        status: 'active',
        percent: before?.percent ?? 0,
        hasReported: before?.hasReported ?? false,
        startedAt: before?.startedAt ?? at,
      }
    }
    return task(`todo-${i}-${name}`, name, 'upcoming')
  })
  if (!tasks.some(one => one.status === 'active')) {
    const first = tasks.findIndex(one => one.status === 'upcoming')
    if (first !== -1) {
      tasks = tasks.map((one, i) => (i === first ? { ...one, status: 'active', startedAt: one.startedAt ?? at } : one))
    }
  }
  return { ...list, tasks }
}

/** A task the TaskCreate tool made, added as an upcoming row (or the active one if none is). */
export function addTask(list: CleanViewChecklist, id: string, subject: string, at = list.startedAt): CleanViewChecklist {
  const tasks = list.tasks.filter(one => !one.id.startsWith(PLACEHOLDER_PREFIX))
  const status = tasks.some(one => one.status === 'active') ? 'upcoming' : 'active'
  return { ...list, tasks: [...tasks, task(`task-${id}`, cleanName(subject), status, at)] }
}

/** A TaskUpdate: its new status and subject on the matching row. */
export function updateTask(
  list: CleanViewChecklist,
  id: string,
  status: 'pending' | 'in_progress' | 'completed' | 'deleted' | undefined,
  subject: string | undefined,
  at = list.startedAt,
): CleanViewChecklist {
  const key = `task-${id}`
  const index = list.tasks.findIndex(one => one.id === key)
  if (index === -1) return list
  if (status === 'deleted') return { ...list, tasks: list.tasks.filter(one => one.id !== key) }
  let tasks = list.tasks.map(one => (one.id === key && subject !== undefined ? { ...one, name: cleanName(subject) } : one))
  if (status === 'in_progress') {
    tasks = tasks.map((one, i) =>
      i === index
        ? { ...one, status: 'active', startedAt: one.startedAt ?? at, finishedAt: undefined }
        : one.status === 'active'
          ? { ...one, status: 'upcoming', finishedAt: undefined }
          : one,
    )
  } else if (status === 'completed') {
    tasks = tasks.map((one, i) =>
      i === index
        ? { ...one, status: 'done', percent: 100, startedAt: one.startedAt ?? at, finishedAt: one.finishedAt ?? at }
        : one,
    )
    if (!tasks.some(one => one.status === 'active')) {
      const next = tasks.findIndex(one => one.status === 'upcoming')
      if (next !== -1) {
        tasks = tasks.map((one, i) => (i === next ? { ...one, status: 'active', startedAt: one.startedAt ?? at } : one))
      }
    }
  } else if (status === 'pending') {
    tasks = tasks.map((one, i) =>
      i === index ? { ...one, status: 'upcoming', percent: 0, startedAt: undefined, finishedAt: undefined } : one,
    )
  }
  return { ...list, tasks }
}

/** The calm sentence for a turn an API error ended. */
export function errorSentence(answer: string): string {
  if (/rate.?limit|usage limit|\b429\b|quota/i.test(answer)) return 'you hit your usage limit, try again a little later'
  if (/overload|\b529\b|capacity/i.test(answer)) return "Claude's servers are busy, try again in a minute"
  if (/too long|context (window|length|limit)|maximum context/i.test(answer)) return 'type /compact and try again'
  if (/network|connection|econn|fetch failed|socket|offline|timed? ?out|dns/i.test(answer)) return 'the internet connection dropped'
  if (/auth|\b401\b|\b403\b|log ?in|api key|oauth|credential/i.test(answer)) return 'type /login'
  return 'something went wrong talking to Claude, try again'
}

export function isUserRejection(text: string | undefined): boolean {
  return text !== undefined && /doesn.t want to proceed|was rejected|user (denied|rejected|declined)/i.test(text)
}

export function duration(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function taskElapsed(one: CleanViewTask, now: number): string {
  if (one.status === 'upcoming' || one.startedAt === undefined) return 'Not started yet'
  return duration((one.finishedAt ?? now) - one.startedAt)
}

/** Ten cells: full, filled to the percent, a moving sweep, or empty. */
export function meter(one: CleanViewTask, frame: number): string {
  if (one.status === 'done') return '█'.repeat(METER_CELLS)
  if (one.status === 'upcoming') return '░'.repeat(METER_CELLS)
  if (!one.hasReported) {
    const at = frame % METER_CELLS
    return Array.from({ length: METER_CELLS }, (_, i) => ((i - at + METER_CELLS) % METER_CELLS < 3 ? '█' : '░')).join('')
  }
  const filled = Math.round(one.percent / 10)
  // Between reports the next cell pulses, so a step waiting on its next report still looks alive.
  if (filled >= METER_CELLS || frame % 2 === 0) return '█'.repeat(filled) + '░'.repeat(METER_CELLS - filled)
  return '█'.repeat(filled) + '▒' + '░'.repeat(METER_CELLS - filled - 1)
}

// Modes that settle a permission ask with nobody asked: a classifier, a bypass, a refusal.
const SETTLED_ALONE = new Set(['auto', 'bypassPermissions', 'dontAsk'])

/** True when an ask in this permission mode opens a dialog for the person; an unknown mode might. */
export function asksPerson(mode: string | undefined): boolean {
  return mode === undefined || !SETTLED_ALONE.has(mode)
}

/** True when a turn's last words put a question to the person. */
export function endsWithQuestion(answer: string): boolean {
  return answer.trim().endsWith('?')
}

export function label(one: CleanViewTask, isFirstUpcoming: boolean, isPaused = false): string {
  if (one.status === 'done') return 'Done'
  if (one.status === 'active' && isPaused) return 'Paused'
  if (one.status === 'active') return one.hasReported ? `${one.percent}%` : 'Working'
  return isFirstUpcoming ? 'Next' : 'Up next'
}

// The newest entries a step's raw log keeps, and the characters each summary line keeps.
export const LOG_ENTRIES = 200
export const LOG_ENTRY_CHARS = 160

const ANSI = /\x1b\[[0-?]*[ -/]*[@-~]|\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)/g
const CONTROL = /[\x00-\x08\x0b-\x1f\x7f-\x9f\ud800-\udfff\u{10eeee}]/gu

function sanitizeLog(text: string): string {
  return text.slice(0, LOG_ENTRY_CHARS * 4).replace(ANSI, '').replace(/[\r\n\t]+/g, ' ').toWellFormed().replace(CONTROL, '')
}

function clip(text: string): string {
  const clean = sanitizeLog(text)
  return clean.length <= LOG_ENTRY_CHARS ? clean : `${clean.slice(0, LOG_ENTRY_CHARS).toWellFormed()}…`
}

/**
 * Adds `text` to the last entry when it has the same `key` (a block streaming
 * in pieces), else a new entry at the end; keeps the newest LOG_ENTRIES.
 */
export function appendLog(log: readonly CleanViewLogEntry[], kind: CleanViewLogEntry['kind'], key: string, text: string): CleanViewLogEntry[] {
  const last = log.at(-1)
  if (last?.key === key) return [...log.slice(0, -1), { ...last, text: clip(last.text + text) }]
  return [...log, { kind, key, text: clip(text) }].slice(-LOG_ENTRIES)
}

/** A name sized to the column: cut with "…" when it would wrap, padded otherwise. */
export function fit(name: string, width: number): string {
  if (name.length <= width) return name.padEnd(width)
  return `${name.slice(0, Math.max(0, width - 1)).toWellFormed()}…`
}
