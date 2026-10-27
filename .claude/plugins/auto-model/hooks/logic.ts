import type { AutoModelLevel } from '../types'

export const LEVELS: readonly AutoModelLevel[] = ['trivial', 'moderate', 'complex', 'frontier']

// The four model lines, smallest first, as the /config model row names them.
// Aliases, not dated ids, so they follow whatever this install ships.
export const LINES = ['haiku', 'sonnet', 'opus', 'fable'] as const

export const CLASSIFIER_SYSTEM = [
  'Sort the request into exactly one tier. Answer with the one word only.',
  'Classify the immediate action requested in this turn, not broader project goals mentioned as background.',
  'Words that only name a command, file or tool are not the task: "update the skill\'s review subcommand" is moderate.',
  'trivial: quick, mechanical jobs and short writing. Commit, branch, summarize, sort, extract, rename, translate, reformat, small wording-only instruction edits, small README or doc updates (such as adding an entry to a table or list), a short factual answer, a repo-state check (is a commit, branch or slice merged, what changed, who touched a file), an email, a post, a PR body, a ticket, a small edit.',
  'moderate: the default for hands-on work. Building or changing software, debugging, fixing tests, audits of code quality or behaviour, long documents, anything touching several files; also targeted documentation lookups and bounded troubleshooting before codifying a fix as a reusable instruction.',
  'complex: project planning and big-picture thinking. Specs, plans, slices, task lists, open-ended research, architecture, substantial architectural decisions, code or security review (including updating a spec, plan, slice, or task list to cover how a feature will be implemented or tested).',
  'frontier: only the very hardest thinking. Redesigning a whole codebase or system, planning a very large migration, deep research that runs for hours.',
  'Examples: "Pi shows unclickable links; how can we codify a fix?" -> moderate; "design a new terminal rendering architecture" -> complex; "apply this exact wording to AGENTS.md and commit" -> trivial; "can you update the README.md with the new skill" -> trivial.',
  'When unsure between moderate and complex, say moderate.',
].join('\n')

/** Reads the classifier's one-word answer; undefined when it named no tier. */
export function parseLevel(text: string): AutoModelLevel | undefined {
  const word = text.toLowerCase().match(/\b(trivial|moderate|complex|frontier)\b/)
  return word ? (word[1] as AutoModelLevel) : undefined
}

const ACKS = new Set([
  'yes', 'y', 'yep', 'yeah', 'ok', 'okay', 'k', 'sure', 'no', 'nope', 'thanks',
  'thank you', 'go', 'go ahead', 'go on', 'continue', 'keep going', 'do it',
  'proceed', 'proceed with edits', 'proceed with the edits',
  'proceed with updates', 'proceed with the updates',
  'proceed with changes', 'proceed with the changes',
  'apply', 'implement', 'approve', 'approved',
  'lgtm', 'sounds good', 'looks good', 'carry on', 'ship it',
  'yes please', 'please do', 'next',
  'show a diff', 'show the diff', 'show full diff', 'show the full diff',
  'show a full diff', 'show proposed diff', 'show the proposed diff',
  'show a proposed diff',
])

/** A slash command (`/compact`, `/commit args`), not a leading file path (`/var/folders/...`). */
export function isSlashCommand(text: string): boolean {
  return /^\/[a-zA-Z0-9:_-]+(?:\s|$)/.test(text.trimStart())
}

/** A reply to what Claude just said: a plain go-ahead, or under four words after a turn. */
export function isShortReply(text: string, hasPriorTurn = true): boolean {
  const plain = text.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim()
  if (plain === '') return true
  if (ACKS.has(plain)) return true
  if (!hasPriorTurn) return false
  return plain.split(' ').length < 4
}

const FENCED = /^(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1[ \t]*$/gm
const INLINE_CODE = /`[^`\n]+`/g
const QUOTED = /^>.*$/gm

/**
 * What the user wrote, without fenced blocks, inline code or `>` quotes, in one
 * line: a quoted word (`review`) names a thing, not the task. Pastes arrive
 * unmarked, so only fenced or quoted ones are left out. All quoted: as given.
 */
export function requestText(text: string): string {
  const own = text.replace(FENCED, ' ').replace(INLINE_CODE, ' ').replace(QUOTED, ' ').replace(/\s+/g, ' ').trim()
  return own === '' ? text : own
}

// How long the prompt cache keeps a conversation after its last request. A
// switch inside it re-sends the whole history uncached, so only a step up is
// worth that; once it has lapsed, a switch costs nothing extra.
export const WARM_MS = 60 * 60 * 1000

/** True while the last main-loop turn is recent enough for its cache to be warm. */
export function isWarm(lastTurnAt: number | null, now: number): boolean {
  return lastTurnAt !== null && now - lastTurnAt < WARM_MS
}

/** A line's place, smallest first; -1 for a model outside the four lines. */
export function rankOf(model: string): number {
  const line = lineOf(model)
  return line === undefined ? -1 : LINES.indexOf(line as (typeof LINES)[number])
}

/** The model lines this install offers, smallest first. */
export function availableLines(options: readonly string[] | undefined): string[] {
  return LINES.filter(line => options?.includes(line) ?? false)
}

/**
 * The lines to try for a level, best fit first, then each smaller one: the
 * step-down order when the plan refuses a model. A level whose own line is
 * missing starts at the nearest smaller line.
 */
export function candidatesFor(level: AutoModelLevel, lines: readonly string[]): string[] {
  const order = LINES.slice(0, LEVELS.indexOf(level) + 1).reverse()
  const found = order.filter(line => lines.includes(line))
  return found.length > 0 ? found : [...lines]
}

/** The line a model id or alias belongs to (`claude-opus-5-5` is `opus`). */
export function lineOf(model: string): string | undefined {
  const lower = model.toLowerCase()
  return LINES.find(line => lower === line || lower.includes(`-${line}`) || lower.startsWith(`${line}`))
}

/** `claude-opus-5-5` reads `Opus 5.5`; anything else is shown as given. */
export function displayName(model: string): string {
  const [, line, version] = model.match(/^claude-([a-z]+)-(\d+(?:-\d+)*)/i) ?? []
  if (line === undefined || version === undefined) return model
  return `${line.charAt(0).toUpperCase()}${line.slice(1)} ${version.replace(/-/g, '.')}`
}

/** Never send `max`: it becomes `xhigh`. Other values pass unchanged. */
export function clampEffort<T>(effort: T): T | 'xhigh' {
  return effort === 'max' ? 'xhigh' : effort
}

/** `/effort max` (in any case) is rewritten to `/effort xhigh`. */
export function clampEffortArgs(args: string): string {
  return args.replace(/\bmax\b/gi, 'xhigh')
}

/** The `metadata.model-tier` a SKILL.md declares; undefined when absent or unknown. */
export function tierFromFrontmatter(text: string): AutoModelLevel | undefined {
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
  const metadata = frontmatter?.match(/^metadata:[ \t]*\r?\n((?:[ \t]+.*(?:\r?\n|$))*)/m)?.[1]
  const value = metadata?.match(/^[ \t]+model-tier:[ \t]*["']?([A-Za-z]+)["']?[ \t]*$/m)?.[1]?.toLowerCase()
  return LEVELS.find(level => level === value)
}

/** Where a skill named `name` may live, project first; none for a non-plain name. */
export function skillPaths(name: string, cwd: string, home: string | undefined): string[] {
  if (!/^[A-Za-z0-9_-]+$/.test(name)) return []
  const file = `.claude/skills/${name}/SKILL.md`
  return home === undefined ? [`${cwd}/${file}`] : [`${cwd}/${file}`, `${home}/${file}`]
}

/**
 * Where the status line reads this session's tier. The temp folder, so the OS
 * clears files from ended sessions; none for a non-plain session id.
 */
export function tierPath(tmpdir: string | undefined, sessionId: string): string | undefined {
  if (tmpdir === undefined || !/^[A-Za-z0-9_-]+$/.test(sessionId)) return undefined
  return `${tmpdir.replace(/\/+$/, '')}/claude-auto-model/${sessionId}`
}
