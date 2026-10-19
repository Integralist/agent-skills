import type { AutoModelLevel } from '../types'

export const LEVELS: readonly AutoModelLevel[] = ['trivial', 'moderate', 'complex', 'frontier']

// The four model lines, smallest first, as the /config model row names them.
// Aliases, not dated ids, so they follow whatever this install ships.
export const LINES = ['haiku', 'sonnet', 'opus', 'fable'] as const

export const CLASSIFIER_SYSTEM = [
  'Sort the request into exactly one tier. Answer with the one word only.',
  'trivial: quick, mechanical jobs and short writing. Commit, branch, summarize, sort, extract, rename, translate, reformat, a short factual answer, an email, a post, a PR body, a ticket, a small edit.',
  'moderate: the default for hands-on work. Building or changing software, debugging, fixing tests, analysis, long documents, anything touching several files or tools.',
  'complex: project planning and big-picture thinking. Specs, plans, research, architecture, design decisions, code or security review.',
  'frontier: only the very hardest thinking. Redesigning a whole codebase or system, planning a very large migration, deep research that runs for hours.',
  'When unsure, say moderate.',
].join('\n')

/** Reads the classifier's one-word answer; undefined when it named no tier. */
export function parseLevel(text: string): AutoModelLevel | undefined {
  const word = text.toLowerCase().match(/\b(trivial|moderate|complex|frontier)\b/)
  return word ? (word[1] as AutoModelLevel) : undefined
}

const ACKS = new Set([
  'yes', 'y', 'yep', 'yeah', 'ok', 'okay', 'k', 'sure', 'no', 'nope', 'thanks',
  'thank you', 'go', 'go ahead', 'go on', 'continue', 'keep going', 'do it',
  'proceed', 'lgtm', 'sounds good', 'looks good', 'carry on', 'ship it',
  'yes please', 'please do', 'next',
])

/** A reply to what Claude just said: fewer than four words, or a plain go-ahead. */
export function isShortReply(text: string): boolean {
  const plain = text.toLowerCase().replace(/[^\p{L}\p{N}\s']/gu, ' ').replace(/\s+/g, ' ').trim()
  if (plain === '') return true
  if (ACKS.has(plain)) return true
  return plain.split(' ').length < 4
}

const FRONTIER = /\b(migrat\w*|deep research|for hours|entire (codebase|repo\w*|system)|whole (codebase|repo\w*)|large[- ]scale|re-?architect\w*|ground[- ]up|from scratch)\b/i
const COMPLEX = /\b(research|analy[sz]\w*|plan\w*|design\w*|architect\w*|review\w*|spec|strateg\w*|roadmap|trade-?offs?)\b/i
const MODERATE = /\b(build|implement\w*|refactor\w*|debug\w*|fix\w*|bug|code|test\w*|investigat\w*|deploy\w*|feature|function|module|files|repo\w*|pr|diff|doc(ument)?s?)\b/i
const TRIVIAL = /\b(summari[sz]e|tl;?dr|sort|extract|rename|translate|reformat|format|convert|list|spell\w*|define|what is|who is|when (is|was)|email|e-mail|post|tweet|slack|message|draft|letter|reply|edit|tweak|chart|graph|explain|what does|how do)\b/i

/** The word-based guess used when the quick check fails; moderate when in doubt. */
export function guessLevel(text: string): AutoModelLevel {
  if (FRONTIER.test(text)) return 'frontier'
  if (COMPLEX.test(text)) return 'complex'
  if (MODERATE.test(text)) return 'moderate'
  if (TRIVIAL.test(text)) return 'trivial'
  return 'moderate'
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
