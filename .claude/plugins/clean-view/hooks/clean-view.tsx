import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Timer } from 'claude-code'

import type { CleanViewActivity, CleanViewChecklist, CleanViewLogEntry, CleanViewTask } from '../types'
import {
  EMPTY,
  METER_CELLS,
  PLACEHOLDER_PREFIX,
  addTask,
  appendLog,
  asksPerson,
  clampPercent,
  duration,
  endsWithQuestion,
  errorSentence,
  fit,
  fromTodos,
  hasPlan,
  isRunning,
  isUserRejection,
  label,
  meter,
  newJob,
  planSteps,
  reportProgress,
  taskElapsed,
  updateTask,
} from './logic'

const PLUGIN = 'clean-view'
const COMMAND = 'simple'
const STORE_KEY = 'cleanViewEnabled'
const PLAN_TOOL = `mcp__${PLUGIN}__plan_steps`
const PROGRESS_TOOL = `mcp__${PLUGIN}__report_progress`
const FRAME_MS = 100
const COLLAPSE_MS = 5000
const FAILURES_TO_STUCK = 3
const PLACEHOLDER_TITLE = 'Your request'
const DETAILS_PANE = 'clean-view-details'
// Cells the `[ Details ]` button takes at the end of each task row.
const DETAILS_BUTTON_CELLS = 11
const ALWAYS_ALLOWED = new Set(['ToolSearch', 'TodoWrite', 'TaskCreate', 'TaskUpdate', 'AskUserQuestion', PLAN_TOOL, PROGRESS_TOOL])
// Tools that update the checklist directly.
const PLAN_UPDATERS = new Set([PLAN_TOOL, PROGRESS_TOOL, 'TodoWrite', 'TaskCreate', 'TaskUpdate'])

const NEEDS_OK = 'Claude needs your OK to continue'
const HAS_QUESTION = 'Claude has a question for you'
const WAITING = 'Claude is waiting for your reply'
const ASKED = 'Claude asked you a question above'
// Phases where a plan was left part way; its active step draws as Paused.
const PAUSED = new Set(['needsYou', 'stuck', 'stopped', 'waiting', 'ended'])
// An agent in one of these is still at work and will report back on its own.
const AGENT_AT_WORK = new Set(['pending', 'running', 'waiting'])
const SAID_NO = 'you said no to a step, so Claude paused'
const KEEPS_FAILING = 'a step keeps failing, Claude is trying another way'
const REFUSED = "Claude couldn't help with that request"

const enabled = atom({ plugin: 'clean-view', key: 'cleanViewEnabled' } as const, true)
const checklist = atom({ plugin: 'clean-view', key: 'checklist' } as const, EMPTY)
const selectedTaskId = atom({ plugin: 'clean-view', key: 'selectedTaskId' } as const, null as string | null)
const taskLogs = atom({ plugin: 'clean-view', key: 'taskLogs' } as const, {} as Record<string, CleanViewLogEntry[]>)
const logScroll = atom({ plugin: 'clean-view', key: 'logScroll' } as const, 0)
const tick = atom({ plugin: 'clean-view', key: 'tick' } as const, 0)

const SECTION = `# Clean View checklist

The person sees a plain checklist of your plan instead of your tool calls.

- For every request, even a quick question, call \`${PLAN_TOOL}\` first with a short job title and every step of the job, 1 to 8 short names in order. Only include steps that perform actual work; never add a filler final step like "Prepare next action" or "Summarize findings". Load it with ToolSearch if it is deferred. If this session has TodoWrite or TaskCreate, you may use your to-do list as the plan instead.
- Never spend a turn calling \`${PROGRESS_TOOL}\` or \`${PLAN_TOOL}\` alone. Always call them in the same response as your next real tool call.
- Call \`${PROGRESS_TOOL}\` with 100 when a step finishes (bundled with the first tool call of the next step), or alongside a tool call when a step has taken several tool calls. Only pass 100 after you have read a step's tool output and confirmed the step is done; when the final step is ready to answer, reply directly and Clean View completes it automatically.
- Keep internal reasoning before tool calls brief (1 to 2 sentences) so the checklist never sits idle on a long thinking pause.
- If the job grows past your plan (extra checks, cleanup, undoing changes, a new kind of work), call \`${PLAN_TOOL}\` again with the full updated list before you do it. Keep finished step names the same so they stay checked off.
- Write every step name in plain English a non-technical person understands, under 40 characters, starting with a verb, like "Build the pricing section".
- Never put file paths, file names, commands, code or tool names in a step name.`

type $ = EngineInterface

let ticker: Timer | undefined
let failures = 0
let enforcedForRun = true
let isNextTurnCommand = false
// The next turn is a background agent reporting back, not a new request.
let isNextTurnReport = false
// The session's permission mode, as the last classic hook carried it; unknown until one does.
let permissionMode: string | undefined
// The main loop's running turn, which the details pane's Stop ends.
let mainTurnId: string | undefined
// The pane button holding the focus ring; the per-frame redraw would otherwise reset it to Prev.
let focusedButton: string | undefined
// Files read during the active step, so the activity shows real progress the model hasn't reported.
let readsInStep = 0
let readsStepId: string | null = null
let logSeq = 0
let maxLogScroll = 0
let pendingPlanUpdate: Promise<unknown> = Promise.resolve()

function queuePlanUpdate<T>(fn: () => Promise<T>): Promise<T> {
  const next = pendingPlanUpdate.then(fn, fn)
  pendingPlanUpdate = next.then(() => undefined, () => undefined)
  return next
}

function countRead(list: CleanViewChecklist): string {
  const stepId = list.tasks.find(one => one.status === 'active')?.id ?? null
  if (stepId !== readsStepId) {
    readsStepId = stepId
    readsInStep = 0
  }
  readsInStep++
  return `Read ${readsInStep} file${readsInStep === 1 ? '' : 's'} in this step`
}

function startTicker($: $) {
  if (ticker !== undefined) return
  ticker = $.clock.every(FRAME_MS, () => {
    void update($, tick, n => (n ?? 0) + 1)
  })
}

function stopTicker() {
  ticker?.cancel()
  ticker = undefined
}

async function isOn($: $) {
  return read($, enabled)
}

async function edit($: $, fn: (list: CleanViewChecklist) => CleanViewChecklist) {
  await update($, checklist, list => fn(list ?? EMPTY))
}

async function recordActivity($: $, summary: string, inProgress: boolean, at?: number) {
  const timestamp = at ?? await $.clock.now()
  await edit($, list => ({ ...list, activity: { summary, at: timestamp, inProgress } }))
}

async function recordTaskLog($: $, kind: CleanViewLogEntry['kind'], text: string, streamKey?: string) {
  const stepId = (await read($, checklist)).tasks.find(one => one.status === 'active')?.id
  if (!stepId) return
  const key = streamKey ?? `${kind}-${++logSeq}`
  await update($, taskLogs, logs => {
    const current = logs?.[stepId] ?? []
    const piece = streamKey !== undefined && current.at(-1)?.key !== key ? `💭 ${text}` : text
    return { ...(logs ?? {}), [stepId]: appendLog(current, kind, key, piece) }
  })
}

async function openDetails($: $, taskId: string) {
  await update($, selectedTaskId, () => taskId)
  await update($, logScroll, () => 0)
  focusedButton = undefined
  await $.ui.open({ id: DETAILS_PANE, title: 'Task details', focus: true, closeOnEscape: true, holdToasts: true, rows: 24 })
}

async function pageDetails($: $, step: number) {
  const list = await read($, checklist)
  const id = await read($, selectedTaskId)
  const index = Math.max(0, list.tasks.findIndex(one => one.id === id))
  const next = list.tasks[Math.min(list.tasks.length - 1, Math.max(0, index + step))]
  if (next) {
    await update($, selectedTaskId, () => next.id)
    await update($, logScroll, () => 0)
  }
}

function toolActivity(tool: string, finished = false): string {
  switch (tool.toLowerCase()) {
    case 'bash': return finished ? 'Finished running a command' : 'Running a command'
    case 'read': return finished ? 'Finished reading a file' : 'Reading a file'
    case 'grep':
    case 'find':
    case 'ls': return finished ? 'Finished searching the project' : 'Searching the project'
    case 'edit':
    case 'write': return finished ? 'Finished updating files' : 'Updating files'
    case 'codemode': return finished ? 'Finished running a script' : 'Running a script'
    default: return finished ? 'Finished using a tool' : 'Using a tool'
  }
}

async function setEnabled($: $, value: boolean) {
  await update($, enabled, () => value)
  await $.store.set(STORE_KEY, value)
  $.ui.toast(value ? 'Clean View on: showing the plan, hiding the technical details' : 'Clean View off: showing everything')
}

async function startJob($: $) {
  const startedAt = await $.clock.now()
  failures = 0
  await update($, selectedTaskId, () => null)
  await update($, taskLogs, () => ({}))
  await update($, logScroll, () => 0)
  await edit($, () => newJob(startedAt, PLACEHOLDER_TITLE))
  startTicker($)
}

/** Starts a job for a plan that arrives while none runs (a skill, a slash command). */
async function ensureJob($: $) {
  if (!isRunning(await read($, checklist))) await startJob($)
}

function needsYou(reason: string) {
  return (list: CleanViewChecklist): CleanViewChecklist =>
    isRunning(list) ? { ...list, phase: 'needsYou', needsYouReason: reason } : list
}

function backToWork(list: CleanViewChecklist): CleanViewChecklist {
  return list.phase === 'needsYou' && list.finishedAt === null ? { ...list, phase: 'working', needsYouReason: null } : list
}

function stuck(reason: string) {
  return (list: CleanViewChecklist): CleanViewChecklist =>
    isRunning(list) ? { ...list, phase: 'stuck', stuckReason: reason, needsYouReason: null } : list
}

function unstuck(list: CleanViewChecklist): CleanViewChecklist {
  return list.phase === 'stuck' && list.finishedAt === null ? { ...list, phase: 'working', stuckReason: null } : list
}

async function finish($: $, fn: (list: CleanViewChecklist, now: number) => CleanViewChecklist) {
  const now = await $.clock.now()
  stopTicker()
  await edit($, list => {
    if (list.phase === 'idle') return list
    const finished = fn({ ...list, finishedAt: now }, now)
    const summary = finished.phase === 'stopped' ? 'Run stopped' : finished.phase === 'stuck' ? 'Run needs attention' : finished.phase === 'waiting' ? 'Waiting for background work' : finished.phase === 'needsYou' ? 'Waiting for your reply' : finished.phase === 'ended' ? 'Run ended' : 'Run finished'
    return { ...finished, activity: { summary, at: now, inProgress: false } }
  })
}

export function registerCleanView(on: On) {
  on('session.start', async ($, e, next) => {
    const saved = await $.store.get(STORE_KEY)
    await update($, enabled, () => (typeof saved === 'boolean' ? saved : true))
    await $.command.register({
      name: COMMAND,
      description: 'Clean View: hide tool details and show a plain checklist (on, off, or flip)',
      argumentHint: 'on|off',
    })
    await $.tool.register({
      name: 'plan_steps',
      description:
        'Lay out every step of the job up front so the person sees the plan: 1 to 8 short plain-English step names in order, each under 40 characters and starting with a verb. The first step starts right away. If the job grows past the plan, call it again with the full updated list and keep finished step names unchanged.',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string', description: 'Short 2 to 6 word plain-English job title starting with a verb, without code, file names or paths.' },
          steps: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 },
        },
        required: ['steps'],
      },
      isDeferred: false,
    })
    await $.tool.register({
      name: 'report_progress',
      description:
        'Report progress on the current step by its plain-English name, with a percent from 0 to 100. Report 100 the moment a step finishes; the next one then starts.',
      inputSchema: {
        type: 'object',
        properties: { task: { type: 'string' }, percent: { type: 'number', minimum: 0, maximum: 100 } },
        required: ['task', 'percent'],
      },
      isDeferred: false,
    })
    if (isRunning(await read($, checklist))) startTicker($)
    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    const arg = e.args.trim().toLowerCase()
    const value = arg === 'on' ? true : arg === 'off' ? false : !(await isOn($))
    await setEnabled($, value)
    return { text: value ? 'Clean View is on.' : 'Clean View is off.' }
  })

  on('prompt.compose', async ($, e, next) => {
    const composed = await next(e)
    if (!(await isOn($))) return composed
    return { sections: [...composed.sections, { id: `${PLUGIN}:checklist`, text: SECTION, scope: 'session' as const }] }
  })

  on('prompt.submit', async ($, e, next) => {
    isNextTurnCommand = e.command !== undefined
    isNextTurnReport = e.origin.kind === 'task-notification' && e.turnId === undefined
    // A slash command's output would sit under a stale band; clear one left waiting.
    if (isNextTurnCommand) await edit($, list => (list.phase === 'working' ? list : { ...list, phase: 'idle' }))
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      mainTurnId = e.turnId
      enforcedForRun = await isOn($)
      const isCommand = isNextTurnCommand
      const isReport = isNextTurnReport
      isNextTurnCommand = false
      isNextTurnReport = false
      const list = await read($, checklist)
      // A plan left part way (Esc, a pause, a question, background work) carries on:
      // a typed prompt is usually a re-steer, and a report is the work coming back.
      const isPaused = PAUSED.has(list.phase) && hasPlan(list)
      const resumes = isReport ? list.phase === 'waiting' : !isCommand && e.text.trim() !== '' && isPaused
      if (resumes) {
        const resumedAt = await $.clock.now()
        await edit($, current => {
          const pauseMs = current.finishedAt !== null ? Math.max(0, resumedAt - current.finishedAt) : 0
          return {
            ...current,
            phase: 'working',
            startedAt: current.startedAt + pauseMs,
            tasks: current.tasks.map(one =>
              one.status === 'active' && one.startedAt !== undefined
                ? { ...one, startedAt: one.startedAt + pauseMs }
                : one,
            ),
            activity: { summary: 'Resumed the task list', at: resumedAt, inProgress: true },
            finishedAt: null,
            isCollapsed: false,
            needsYouReason: null,
            stuckReason: null,
            waitingOn: undefined,
          }
        })
        startTicker($)
      } else if (!isCommand && e.text.trim() !== '') {
        await startJob($)
      }
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const tool = String(e.tool)
    if (tool === PLAN_TOOL || tool === PROGRESS_TOOL) {
      return queuePlanUpdate(async () => {
        await edit($, backToWork)
        return next(e)
      })
    }
    await pendingPlanUpdate
    const list = await read($, checklist)
    const isEnabled = await isOn($)
    if (enforcedForRun && isEnabled && isRunning(list) && !hasPlan(list) && !ALWAYS_ALLOWED.has(tool)) {
      return { deny: `Clean View: call ${PLAN_TOOL} first to lay out the steps of this job (load it with ToolSearch if it is deferred), then try again.` }
    }

    await edit($, backToWork)
    if (!PLAN_UPDATERS.has(tool)) {
      await recordActivity($, tool === 'AskUserQuestion' ? 'Waiting for your answer' : toolActivity(tool), tool !== 'AskUserQuestion')
    }
    if (!ALWAYS_ALLOWED.has(tool)) {
      const { tool: _t, tool_use_id: _id, agentId: _a, consent: _c, requestMeta: _m, ...input } = e as Record<string, unknown>
      await recordTaskLog($, 'call', `→ ${tool} ${JSON.stringify(input)}`)
    }
    if (e.tool === 'TodoWrite') {
      await queuePlanUpdate(async () => {
        const at = await $.clock.now()
        await edit($, current => ({ ...fromTodos(current, e.todos, at), activity: { summary: 'Task list updated', at, inProgress: false } }))
      })
    }
    if (e.tool === 'TaskUpdate') {
      await queuePlanUpdate(async () => {
        const at = await $.clock.now()
        await edit($, current => ({ ...updateTask(current, e.taskId, e.status, e.subject, at), activity: { summary: 'Task list updated', at, inProgress: false } }))
      })
    }
    if (e.tool === 'AskUserQuestion') await edit($, needsYou(HAS_QUESTION))

    const ran = await next(e)

    await edit($, backToWork)
    if (!ALWAYS_ALLOWED.has(tool) && ran.deny === undefined) {
      const out = ran.text ?? (typeof ran.result === 'string' ? ran.result : JSON.stringify(ran.result) ?? '')
      await recordTaskLog($, ran.isError === true ? 'error' : 'result', ran.isError === true ? `← error: ${out}` : `← ${out}`)
    }
    if (tool === 'AskUserQuestion' && ran.deny === undefined) await recordActivity($, 'Answer received', false)
    if (!PLAN_UPDATERS.has(tool) && tool !== 'AskUserQuestion') {
      const summary = ran.isError === true
        ? 'A tool call failed'
        : tool.toLowerCase() === 'read'
          ? countRead(await read($, checklist))
          : toolActivity(tool, true)
      await recordActivity($, summary, false)
    }
    if (e.tool === 'TaskCreate' && ran.deny === undefined && ran.isError !== true) {
      const made = ran.result as { task?: { id?: string; subject?: string } } | undefined
      if (made?.task?.id !== undefined) {
        const at = await $.clock.now()
        await edit($, current => ({ ...addTask(current, made.task!.id!, made.task!.subject ?? e.subject, at), activity: { summary: 'Task list updated', at, inProgress: false } }))
      }
    }
    if (ran.deny !== undefined) return ran
    if (ran.isError === true) {
      if (isUserRejection(ran.text)) {
        failures = 0
        await edit($, stuck(SAID_NO))
      } else if (++failures >= FAILURES_TO_STUCK) {
        await edit($, stuck(KEEPS_FAILING))
      }
    } else {
      failures = 0
      await edit($, unstuck)
    }
    return ran
  }).catch(($, e, next) => next(e))

  // A permission dialog is about to open, unless the mode settles the ask with
  // nobody asked (auto mode's classifier, a bypass). classic.Notification says
  // the same, but does not reach a mod where an organization manages Claude Code.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    const isMain = e.agentId === undefined && e.tool_use_id !== undefined
    if (verdict.decision === 'ask' && isMain && asksPerson(permissionMode)) {
      await edit($, needsYou(NEEDS_OK))
      await recordActivity($, 'Waiting for permission', false)
    }
    return verdict
  }).catch(($, e, next) => next(e))

  // Shift+Tab can change the mode mid-turn, so each prompt and each tool's end refreshes it.
  on('classic.UserPromptSubmit', async ($, e, next) => {
    if (e.permission_mode !== undefined) permissionMode = e.permission_mode
    return next(e)
  }).catch(($, e, next) => next(e))

  on('classic.PostToolUse', async ($, e, next) => {
    if (e.permission_mode !== undefined) permissionMode = e.permission_mode
    return next(e)
  }).catch(($, e, next) => next(e))

  // An ask the classifier refused never reaches tool.call, so nothing else clears Needs you.
  on('classic.PermissionDenied', async ($, e, next) => {
    await edit($, backToWork)
    return next(e)
  }).catch(($, e, next) => next(e))

  // A new model request means any ask was settled, even where a managed plugin
  // skips the classic hooks that carry the mode and the classifier's refusal.
  on('turn.step', async function* ($, e, next) {
    if (e.agentId === undefined) await edit($, backToWork)
    const stream = next(e)
    for await (const chunk of stream) {
      if (e.agentId === undefined && chunk.kind === 'thinking' && chunk.text !== '') {
        await recordTaskLog($, 'thinking', chunk.text, `thinking-${e.turnId}-${e.index}-${chunk.index}`)
      }
      yield chunk
    }
    return await stream.result
  })

  on('tool.call', { tool: PLAN_TOOL }, async ($, e) => {
    const input = e as { steps?: unknown; title?: unknown }
    const names = Array.isArray(input.steps) ? input.steps.filter((s): s is string => typeof s === 'string') : []
    const title = typeof input.title === 'string' ? input.title : undefined
    await ensureJob($)
    const at = await $.clock.now()
    await edit($, list => ({ ...planSteps(list, names, at, title), activity: { summary: 'Plan updated', at, inProgress: false } }))
    await update($, selectedTaskId, () => null)
    const updated = await read($, checklist)
    const activeTask = updated.tasks.find(one => one.status === 'active')
    const placeholderKey = `${PLACEHOLDER_PREFIX}thinking`
    if (activeTask) {
      await update($, taskLogs, logs => {
        const pre = logs?.[placeholderKey]
        if (!pre || pre.length === 0) return logs ?? {}
        const { [placeholderKey]: _, ...rest } = logs ?? {}
        return { ...rest, [activeTask.id]: [...pre, ...(rest[activeTask.id] ?? [])] }
      })
    }
    const doneCount = updated.tasks.filter(one => one.status === 'done').length
    const result =
      doneCount > 0 && activeTask
        ? `Planned ${updated.tasks.length} steps (${doneCount} already done). Active step: "${activeTask.name}" — do not re-report finished steps.`
        : `Planned ${updated.tasks.length} steps. The first one has started.`
    return { result }
  })

  on('tool.call', { tool: PROGRESS_TOOL }, async ($, e) => {
    const input = e as { task?: unknown; percent?: unknown }
    const name = typeof input.task === 'string' ? input.task : ''
    const percent = typeof input.percent === 'number' ? input.percent : Number(input.percent)
    await ensureJob($)
    const at = await $.clock.now()
    await edit($, list => ({ ...reportProgress(list, name, percent, at), activity: { summary: 'Progress reported', at, inProgress: false } }))
    return { result: `Progress noted: ${clampPercent(percent)}%.` }
  })

  on('classic.Notification', async ($, e, next) => {
    if (e.notification_type === 'permission_prompt') {
      await edit($, needsYou(NEEDS_OK))
      await recordActivity($, 'Waiting for permission', false)
    }
    if (e.notification_type === 'elicitation_dialog') {
      await edit($, needsYou(HAS_QUESTION))
      await recordActivity($, 'Waiting for your answer', false)
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    // An Esc-stopped turn can end after a queued prompt's turn started; it must not stop that one.
    if (mainTurnId !== undefined && e.turnId !== mainTurnId) return next(e)
    if (e.reason === 'error') {
      await finish($, list => ({ ...list, phase: 'stuck', stuckReason: errorSentence(e.answer), needsYouReason: null }))
    } else if (e.reason === 'refusal') {
      await finish($, list => ({ ...list, phase: 'stuck', stuckReason: REFUSED, needsYouReason: null }))
    } else if (e.reason === 'aborted') {
      await finish($, list => ({ ...list, phase: 'stopped', needsYouReason: null }))
    } else {
      const atWork = (await $.agent.list().catch(() => [])).filter(agent => AGENT_AT_WORK.has(agent.status)).length
      await finish($, list => {
        if (list.phase === 'stuck') return list
        // No plan means no tools ran (the plan gate): a plain reply, nothing to track.
        if (!hasPlan(list)) return { ...list, phase: 'idle', needsYouReason: null }
        // Steps left over need the person only when the turn ended on a question;
        // with agents still at work, Claude carries on when they report back.
        if (list.tasks.some(one => one.status !== 'done')) {
          if (endsWithQuestion(e.answer)) return { ...list, phase: 'needsYou', needsYouReason: ASKED }
          if (atWork > 0) return { ...list, phase: 'waiting', needsYouReason: null, waitingOn: atWork }
          const active = list.tasks.find(one => one.status === 'active')
          if (!list.tasks.some(one => one.status === 'upcoming') && !(active?.hasReported && active.percent < 100)) {
            const finishedAt = list.finishedAt ?? 0
            return {
              ...list,
              phase: 'done',
              tasks: list.tasks.map(one => ({
                ...one,
                status: 'done',
                percent: 100,
                startedAt: one.startedAt ?? finishedAt,
                finishedAt: one.finishedAt ?? finishedAt,
              })),
              needsYouReason: null,
            }
          }
          return { ...list, phase: 'ended', needsYouReason: null }
        }
        return { ...list, phase: 'done', needsYouReason: null }
      })
      const done = await read($, checklist)
      if (done.phase === 'done' || done.phase === 'ended') {
        $.clock.after(COLLAPSE_MS, () => {
          void edit($, list => (list.startedAt === done.startedAt && list.phase === done.phase ? { ...list, isCollapsed: true } : list))
        })
      }
    }
    return next(e)
  })

  for (const component of ['ToolUse', 'ToolResult', 'ToolGroup'] as const) {
    on('ui.render', { component }, async ($, e, next) => {
      if (!(await isOn($))) return next(e)
      const { Box } = $.ui.resolve(e)
      return <Box display="none" />
    })
  }

  on('ui.render', { component: 'ToolProgress' }, async ($, e, next) => {
    if (!(await isOn($))) return next(e)
    return next({ ...e, props: { ...e.props, hint: '' } })
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) return next(e)
    const { Box, Text, Button } = $.ui.resolve(e)
    const isEnabled = await isOn($)
    const button = (
      <Button
        key="clean-view-toggle"
        label={isEnabled ? '● Clean View: ON' : '○ Clean View: OFF'}
        onPress={() => setEnabled($, !isEnabled)}
      />
    )
    const list = await read($, checklist)
    if (!isEnabled || list.phase === 'idle') {
      return (
        <Box flexDirection="row" justifyContent="flex-end">
          {button}
        </Box>
      )
    }

    const isLive = isRunning(list)
    const frame = isLive ? await read($, tick) : 0
    const now = isLive ? await $.clock.now() : (list.finishedAt ?? list.startedAt)
    const took = duration(now - list.startedAt)
    const header = headerOf(list, took, Text)
    const firstUpcoming = list.tasks.findIndex(one => one.status === 'upcoming')

    // A blank line above the band keeps it clear of the spinner line.
    if ((list.phase === 'done' || list.phase === 'ended') && list.isCollapsed) {
      return (
        <Box key="clean-view-band" marginTop={1} flexDirection="row" justifyContent="space-between">
          {header}
          {button}
        </Box>
      )
    }

    // icon + space, name, space, 10-cell meter, two spaces, 7-cell label, a gap, the Details button
    const nameWidth = Math.max(8, e.props.bodyColumns - (2 + 1 + METER_CELLS + 2 + 7 + 1 + DETAILS_BUTTON_CELLS))
    return (
      <Box key="clean-view-band" marginTop={1} flexDirection="column">
        <Box key="clean-view-header" flexDirection="row" justifyContent="space-between" marginBottom={1}>
          {header}
          {button}
        </Box>
        {list.tasks.map((one, i) => (
          <Box key={`clean-view-task-row-${one.id}`} flexDirection="row" justifyContent="space-between">
            {row(one, i === firstUpcoming, PAUSED.has(list.phase), frame, nameWidth, Text)}
            <Button key={`clean-view-task-inspect-${one.id}`} label="Details" onPress={() => void openDetails($, one.id)} />
          </Box>
        ))}
      </Box>
    )
  })

  on('ui.focus', { requestId: DETAILS_PANE }, async ($, e, next) => {
    focusedButton = e.element
    return next(e)
  }).catch(($, e, next) => next(e))

  on('ui.scroll', { requestId: DETAILS_PANE }, async ($, e) => {
    await update($, logScroll, offset => Math.max(0, Math.min(maxLogScroll, (offset ?? 0) + e.by)))
    return {}
  }).catch(($, e, next) => next(e))

  on('ui.close', async ($, e, next) => {
    if (e.id === DETAILS_PANE) await update($, selectedTaskId, () => null)
    return next(e)
  })

  // Reading the tick redraws the pane each frame, so its times and progress stay live.
  on('ui.render', { component: 'Pane', requestId: DETAILS_PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const list = await read($, checklist)
    const id = await read($, selectedTaskId)
    const index = Math.max(0, list.tasks.findIndex(one => one.id === id))
    const task = list.tasks[index]
    if (!task) return <Text dimColor>No task to show.</Text>
    const logs = [...((await read($, taskLogs))[task.id] ?? [])].reverse()
    const lines = logs.flatMap(entry =>
      entry.text.split('\n').map((line, i) => ({ key: `${entry.key}-${i}`, kind: entry.kind, text: fit(line, Math.max(10, e.props.bodyColumns - 8)) })),
    )
    const innerRows = Math.max(4, Math.min(12, e.props.scroll.bodyRows - 18))
    maxLogScroll = Math.max(0, lines.length - innerRows)
    const offset = Math.min(await read($, logScroll), maxLogScroll)
    const visible = lines.slice(offset, offset + innerRows)

    const isLive = isRunning(list)
    if (isLive) await read($, tick)
    const now = isLive ? await $.clock.now() : (list.finishedAt ?? list.startedAt)
    const isPaused = PAUSED.has(list.phase)
    const tone = task.status === 'done' ? 'green' : task.status === 'upcoming' ? 'gray' : isPaused ? 'yellow' : 'cyan'
    const status = label(task, index === list.tasks.findIndex(one => one.status === 'upcoming'), isPaused)
    const progress = task.status === 'done' ? 'Complete' : task.hasReported ? `${task.percent}% reported` : 'No percentage reported yet'
    const activity = list.activity
      ? `${list.activity.summary} · ${list.activity.inProgress ? `for ${duration(now - list.activity.at)}` : `${duration(now - list.activity.at)} ago`}`
      : 'No visible activity recorded yet'
    const field = (name: string, value: string, color?: string) => (
      <Text key={`clean-view-details-${name}`}>
        <Text dimColor>{name.padEnd(10)}</Text>
        <Text color={color}>{value}</Text>
      </Text>
    )

    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text>
          <Text color={tone}>●</Text> <Text bold>{task.name}</Text>  <Text dimColor>{index + 1}/{list.tasks.length}</Text>
        </Text>
        <Text> </Text>
        {field('Status', status, tone)}
        <Text key="clean-view-details-Progress">
          <Text dimColor>{'Progress'.padEnd(10)}</Text>
          <Text color={tone}>{meter(task, 0)}</Text>  {progress}
        </Text>
        {field('Elapsed', taskElapsed(task, list.finishedAt ?? now))}
        {field('Activity', activity)}
        <Text> </Text>
        <Text>
          <Text bold>Step log · newest first</Text>
          {lines.length > innerRows && <Text dimColor>{`  ${offset + 1}-${offset + visible.length} of ${lines.length} (scroll to view)`}</Text>}
        </Text>
        <Box borderStyle="round" borderDimColor flexDirection="column" height={innerRows + 2} overflow="hidden" paddingX={1}>
          {visible.length === 0 ? (
            <Text dimColor>Nothing recorded for this step yet</Text>
          ) : (
            visible.map(line => (
              <Text key={`clean-view-log-${line.key}`} color={line.kind === 'error' ? 'red' : undefined} dimColor={line.kind === 'result'}>{line.text}</Text>
            ))
          )}
        </Box>
        <Text> </Text>
        <Box flexDirection="column">
          <Button key="clean-view-details-prev" label="Previous task" autoFocus={focusedButton === 'clean-view-details-prev' || undefined} onPress={() => void pageDetails($, -1)} />
          <Button key="clean-view-details-next" label="Next task" autoFocus={focusedButton === 'clean-view-details-next' || undefined} onPress={() => void pageDetails($, 1)} />
          {isLive && mainTurnId !== undefined && (
            <Button key="clean-view-details-stop" label="Stop entire run" autoFocus={focusedButton === 'clean-view-details-stop' || undefined} onPress={() => void $.turn.abort({ turnId: mainTurnId! })} />
          )}
          <Button key="clean-view-details-close" label="Close" autoFocus={focusedButton === 'clean-view-details-close' || undefined} onPress={() => void $.ui.close({ id: DETAILS_PANE })} />
        </Box>
        <Text dimColor>Stop ends the entire run · Esc closes this pane</Text>
      </Box>
    )
  })
}

type TextElement = ReturnType<EngineInterface['ui']['resolve']>['Text']

function headerOf(list: CleanViewChecklist, took: string, Text: TextElement) {
  switch (list.phase) {
    case 'needsYou':
      return (
        <Text>
          <Text bold color="black" backgroundColor="yellow">
            {' Needs you '}
          </Text>{' '}
          {list.needsYouReason ?? WAITING}
        </Text>
      )
    case 'stuck':
      return <Text color="yellow">⚠ Stuck: {list.stuckReason}</Text>
    case 'stopped':
      return <Text>■ Stopped · {list.title} · you pressed Esc</Text>
    case 'waiting':
      return (
        <Text>
          ⏳ Waiting on {list.waitingOn ?? 1} background agent{list.waitingOn === 1 ? '' : 's'} · {list.title}
        </Text>
      )
    case 'ended':
      return (
        <Text>
          ■ Ended · {list.title} · {list.tasks.filter(one => one.status === 'done').length} of {list.tasks.length} steps done
        </Text>
      )
    case 'done':
      return (
        <Text>
          <Text color="green">✓ All done</Text> · {list.title} · took {took}
        </Text>
      )
    default:
      return (
        <Text>
          <Text bold>{list.title === PLACEHOLDER_TITLE ? list.activity?.summary ?? 'Thinking...' : list.title}</Text> · {took}
        </Text>
      )
  }
}

function row(one: CleanViewTask, isFirstUpcoming: boolean, isPaused: boolean, frame: number, width: number, Text: TextElement) {
  const name = fit(one.name, width)
  const bar = meter(one, frame)
  const tag = label(one, isFirstUpcoming, isPaused)
  if (one.status === 'done') {
    return (
      <Text key={one.id}>
        <Text color="green">✓</Text> <Text dimColor>{name}</Text> <Text color="green">{bar}</Text>  <Text dimColor>{tag}</Text>
      </Text>
    )
  }
  if (one.status === 'active') {
    return (
      <Text key={one.id}>
        <Text color="cyan">{isPaused ? '‖' : '▶'}</Text> <Text bold>{name}</Text> <Text color="cyan">{bar}</Text>  {tag}
      </Text>
    )
  }
  return (
    <Text key={one.id} dimColor>
      ○ {name} {bar}  {tag}
    </Text>
  )
}
