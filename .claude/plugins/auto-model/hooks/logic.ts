import type { AutoModelLevel } from '../types'

export const LEVELS: readonly AutoModelLevel[] = ['small', 'everyday', 'strong', 'strongest']

// The four model lines, smallest first, as the /config model row names them.
// Aliases, not dated ids, so they follow whatever this install ships.
export const LINES = ['haiku', 'sonnet', 'opus', 'fable'] as const

export const CLASSIFIER_SYSTEM = [
  'Sort the request into exactly one level. Answer with the one word only.',
  'small: quick, simple jobs. Summarize, sort, extract, rename, translate, reformat, a short factual answer.',
  'everyday: an email, a post, a short draft, a small edit, a simple question about one file, a quick chart.',
  'strong: the default for anything that matters. Building or changing software, multi-step projects, research, analysis, long documents, planning, anything touching several files or tools.',
  'strongest: only the very hardest. Deep research that runs for hours, a very large build or migration, a problem the strong model would likely fall short on.',
  'When unsure, say strong.',
].join('\n')

/** Reads the classifier's one-word answer; undefined when it named no level. */
export function parseLevel(text: string): AutoModelLevel | undefined {
  const word = text.toLowerCase().match(/\b(strongest|strong|everyday|small)\b/)
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

const STRONGEST = /\b(migrat\w*|deep research|for hours|entire (codebase|repo\w*|system)|whole (codebase|repo\w*)|large[- ]scale|re-?architect\w*|ground[- ]up|from scratch)\b/i
const STRONG = /\b(build|implement\w*|refactor\w*|debug\w*|fix\w*|bug|code|test\w*|research|analy[sz]\w*|plan\w*|design\w*|architect\w*|review\w*|investigat\w*|deploy\w*|feature|function|module|files|repo\w*|pr|diff|spec|doc(ument)?s?)\b/i
const EVERYDAY = /\b(email|e-mail|post|tweet|slack|message|draft|letter|reply|edit|tweak|chart|graph|explain|what does|how do)\b/i
const SMALL = /\b(summari[sz]e|tl;?dr|sort|extract|rename|translate|reformat|format|convert|list|spell\w*|define|what is|who is|when (is|was))\b/i

/** The word-based guess used when the quick check fails; strong when in doubt. */
export function guessLevel(text: string): AutoModelLevel {
  if (STRONGEST.test(text)) return 'strongest'
  if (STRONG.test(text)) return 'strong'
  if (EVERYDAY.test(text)) return 'everyday'
  if (SMALL.test(text)) return 'small'
  return 'strong'
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
