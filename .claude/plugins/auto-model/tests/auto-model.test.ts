import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'
import type { CommandInfo, ConfigRow, On } from 'claude-code'

import { candidatesFor, clampEffort, clampEffortArgs, guessLevel, isShortReply, isSlashCommand, parseLevel, requestText, skillPaths, tierFromFrontmatter, tierPath } from '../hooks/logic'

const OPTIONS = ['default', 'sonnet', 'opus', 'haiku', 'fable', 'best', 'opusplan']
const IDS: Record<string, string> = {
  haiku: 'claude-haiku-5-5',
  sonnet: 'claude-sonnet-5-5',
  opus: 'claude-opus-5-5',
  fable: 'claude-fable-5-1',
}
const PRESENTATION = { isFullscreen: false, columns: 120 }
const HOME = '/home/me'
// The prompt that wrongly routed to Opus: it only names a `review` subcommand.
const FIRST_PROMPT = [
  'can you update the hunk skill to make dealing with all my latest comment replies easier?',
  '',
  'so for example, in Pi, I used the hunk skill (with the `review` subcommand) after already commenting on a `hunk diff` in a separate shell.',
  '',
  '````',
  ' All 9 existing Hunk notes now have replies. I preserved and refreshed the uncommitted diff, found no additional findings.',
  '````',
  '',
  'it would be nice to not have to manually say that all the time? maybe there is a subcommand in the hunk skill already to do that sort of thing, if not can you suggest something we could add',
].join('\n')
const TMPDIR = '/var/tmp-me/'
const SESSION = 'session-1'
const TIER_FILE = '/var/tmp-me/claude-auto-model/session-1'
const TRIVIAL_SKILL = '---\nname: commit\ndescription: >-\n  Create git commits.\nmetadata:\n  model-tier: trivial\n---\n# Commit\n'
const COMPLEX_SKILL = '---\nname: commit\nmetadata:\n  model-tier: complex\n---\n'
const COMMANDS: CommandInfo[] = [
  { name: 'compact', description: 'Clear history but keep a summary', source: 'builtin' },
  { name: 'commit', description: 'Create git commits with intelligent file grouping', source: 'user' },
  { name: 'git-commit', description: 'Write a commit message and commit', source: 'user' },
  { name: 'automodel', description: 'Auto Model: pick the model', source: 'plugin', plugin: 'auto-model' },
]

describe('logic', () => {
  test('reads the one-word answer', () => {
    expect(parseLevel('trivial')).toBe('trivial')
    expect(parseLevel(' Moderate.\n')).toBe('moderate')
    expect(parseLevel('FRONTIER')).toBe('frontier')
    expect(parseLevel('complex')).toBe('complex')
    expect(parseLevel('medium')).toBeUndefined()
  })

  test('spots a short reply', () => {
    expect(isShortReply('yes')).toBe(true)
    expect(isShortReply('ok!')).toBe(true)
    expect(isShortReply('keep going')).toBe(true)
    expect(isShortReply('Do it.')).toBe(true)
    expect(isShortReply('Proceed with the updates.')).toBe(true)
    expect(isShortReply('show the proposed diff')).toBe(true)
    expect(isShortReply('hello', false)).toBe(false)
    expect(isShortReply('hello', true)).toBe(true)
    expect(isShortReply('Refactor the auth module to use the new token client')).toBe(false)
  })

  test('falls back on the words, moderate when in doubt', () => {
    expect(guessLevel('Summarize this paragraph for me please')).toBe('trivial')
    expect(guessLevel('Draft an email to the team about Friday')).toBe('trivial')
    expect(guessLevel('Implement retries in the HTTP client and add tests')).toBe('moderate')
    expect(guessLevel('Update the hunk skill, that sort of thing')).toBe('moderate')
    expect(guessLevel('Plan the rollout for the new token service')).toBe('complex')
    expect(guessLevel('Update Slice 3 and the task list to cover how local tracing will be tested')).toBe('complex')
    expect(guessLevel('Migrate the entire codebase from Python 2 to Python 3')).toBe('frontier')
    expect(guessLevel('Thoughts on the weather tomorrow afternoon')).toBe('moderate')
  })

  test('reads a repo-state check as trivial, not as hands-on work', () => {
    expect(guessLevel('can you check projects/x/ and see if slice 3.1 has been merged into main')).toBe('trivial')
    expect(guessLevel('Is the PR merged yet?')).toBe('trivial')
    expect(guessLevel('Which branch has that commit?')).toBe('trivial')
    expect(guessLevel('Fix the merge conflict in the build script')).toBe('moderate')
  })

  test('keeps only what the user wrote, not quoted text or code', () => {
    expect(requestText('Fix the `review` step\n```\nreview the plan\n```\nthanks')).toBe('Fix the step thanks')
    expect(requestText('Tidy this\n````md\n```bash\nplan\n```\n````\n')).toBe('Tidy this')
    expect(requestText('Update the docs\n> please review the spec\nok')).toBe('Update the docs ok')
    expect(requestText('```\nonly code\n```')).toBe('```\nonly code\n```')
  })

  test('does not read a quoted command name as the task', () => {
    expect(guessLevel(requestText(FIRST_PROMPT))).toBe('moderate')
    expect(guessLevel(requestText('Please review this PR for security issues'))).toBe('complex')
  })

  test('steps down to the next line that exists', () => {
    expect(candidatesFor('frontier', ['haiku', 'sonnet', 'opus', 'fable'])).toEqual(['fable', 'opus', 'sonnet', 'haiku'])
    expect(candidatesFor('frontier', ['haiku', 'sonnet', 'opus'])).toEqual(['opus', 'sonnet', 'haiku'])
    expect(candidatesFor('trivial', ['haiku', 'sonnet'])).toEqual(['haiku'])
  })

  test('reads model-tier from a skill\'s metadata only', () => {
    expect(tierFromFrontmatter(TRIVIAL_SKILL)).toBe('trivial')
    expect(tierFromFrontmatter('---\nmetadata:\n  owner: me\n  model-tier: "Complex"\n---\n')).toBe('complex')
    expect(tierFromFrontmatter('---\nmodel-tier: trivial\n---\n')).toBeUndefined()
    expect(tierFromFrontmatter('---\nmetadata:\n  model-tier: medium\n---\n')).toBeUndefined()
    expect(tierFromFrontmatter('---\nname: x\n---\nmetadata:\n  model-tier: trivial\n')).toBeUndefined()
    expect(tierFromFrontmatter('no frontmatter at all')).toBeUndefined()
  })

  test('looks for a skill in the project, then the home folder, by a plain name only', () => {
    expect(skillPaths('commit', '/repo', '/home/me')).toEqual(['/repo/.claude/skills/commit/SKILL.md', '/home/me/.claude/skills/commit/SKILL.md'])
    expect(skillPaths('commit', '/repo', undefined)).toEqual(['/repo/.claude/skills/commit/SKILL.md'])
    expect(skillPaths('../secrets', '/repo', '/home/me')).toEqual([])
    expect(skillPaths('commit:commit', '/repo', '/home/me')).toEqual([])
  })

  test('keeps the tier file in the temp folder, by a plain session id only', () => {
    expect(tierPath('/var/tmp-me/', 'abc-123')).toBe('/var/tmp-me/claude-auto-model/abc-123')
    expect(tierPath('/tmp', 'abc-123')).toBe('/tmp/claude-auto-model/abc-123')
    expect(tierPath(undefined, 'abc-123')).toBeUndefined()
    expect(tierPath('/tmp', '../escape')).toBeUndefined()
  })

  test('never sends max effort', () => {
    expect(clampEffort('max')).toBe('xhigh')
    expect(clampEffort('high')).toBe('high')
    expect(clampEffortArgs('max')).toBe('xhigh')
    expect(clampEffortArgs('MAX')).toBe('xhigh')
  })
})

type World = {
  model: string
  sets: string[]
  toasts: string[]
  level: string
  refuse: string[]
  asked: number
  prompts: string[]
  logs: string[]
  files: Record<string, string>
  written: Record<string, string>
  clock: MockClock
}

/** The engine beneath the mod: the model row, the session model, a classifier, skill files. */
function world(on: On, start: string, level = 'complex', refuse: string[] = []): World {
  const clock = mock.clock(on, { now: Date.UTC(2026, 9, 19) })
  const w: World = { model: start, sets: [], toasts: [], level, refuse, asked: 0, prompts: [], logs: [], files: {}, written: {}, clock }
  mock.store(on)
  on('config.list', () => {
    const row: ConfigRow = {
      key: 'model',
      label: 'Model',
      kind: 'choice',
      value: w.model,
      options: OPTIONS,
      provider: { plugin: 'engine', tier: 'core' },
      isLocked: false,
    }
    return { value: [row] }
  })
  on('config.set', ($, e) => {
    if (typeof e.value !== 'string' || w.refuse.includes(e.value)) return { deny: 'not on this plan' }
    w.sets.push(e.value)
    w.model = e.value
    return { value: e.value }
  })
  on('session.model', () => ({ value: IDS[w.model] ?? w.model }))
  on('command.list', () => ({ value: COMMANDS }))
  on('session.cwd', () => ({ value: '/tmp' }))
  on('env.get', ($, e) => ({ value: e.name === 'HOME' ? HOME : e.name === 'TMPDIR' ? TMPDIR : undefined }))
  on('session.id', () => ({ value: SESSION }))
  on('fs.write', ($, e) => {
    w.written[e.path] = e.text
    return { value: undefined }
  })
  on('fs.read', ($, e) => {
    const text = w.files[e.path]
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  on('model.complete', ($, e) => ({
    value: {
      isAnswered: true as const,
      text: (w.asked++, w.prompts.push(e.prompt), w.level),
      usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    },
  }))
  on('ui.toast', ($, e) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.log', ($, e) => {
    w.logs.push(e.text)
    return { value: undefined }
  })
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('command.run', () => ({ text: 'engine ran it' }))
  on('turn.complete', () => ({ text: '' }))
  return w
}

/** A main-loop turn ends, so the prompt cache now holds the conversation. */
async function finishTurn($: Engine) {
  await $.turn.complete({ answer: 'done', durationMs: 1, isAborted: false, turnId: 'turn-0', reason: 'answer' })
}

const MINUTE = 60_000

async function start($: Engine) {
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
}

async function automodel($: Engine, args: string) {
  return $.command.run({ command: 'automodel', args, origin: { kind: 'composer' }, presentation: PRESENTATION })
}

async function run($: Engine, command: string, args = '') {
  return $.command.run({ command, args, origin: { kind: 'composer' }, presentation: PRESENTATION })
}

async function type($: Engine, text: string, turnId?: string) {
  return $.prompt.submit({ text, wait: false, origin: { kind: 'composer' }, turnId })
}

describe('switching', () => {
  test('asks the classifier about the user\'s own words only', async ($, on) => {
    const w = world(on, 'haiku', 'moderate')
    await start($)
    await automodel($, 'on')
    await type($, 'Rename the helper in this file please\n```\nplan review design\n```')
    expect(w.prompts).toEqual(['Rename the helper in this file please'])
  })

  test('logs what the classifier said', async ($, on) => {
    const w = world(on, 'haiku', 'complex')
    await start($)
    await automodel($, 'on')
    await type($, 'Plan the rollout for the new token service')
    expect(w.logs).toContain('auto-model: classifier said complex')
  })

  test('logs why it fell back on the words, and what they gave', async ($, on) => {
    const w = world(on, 'haiku', 'medium')
    await start($)
    await automodel($, 'on')
    await type($, 'Plan the rollout for the new token service')
    expect(w.logs).toContain('auto-model: classifier gave no tier (unreadable answer "medium"); keyword guess complex')
    expect(w.sets).toEqual(['opus'])
  })

  test('switches on a new prompt and shows a toast', async ($, on) => {
    const w = world(on, 'opus', 'trivial')
    await start($)
    await automodel($, 'on')
    await type($, 'Summarize the notes from this meeting into three bullets')
    expect(w.sets).toEqual(['haiku'])
    expect(w.toasts).toEqual(['Auto Model: Haiku 5.5 (trivial)'])
  })

  test('stays put on a short reply, a slash command and a mid-turn message, and classifies a short first prompt', async ($, on) => {
    const w = world(on, 'opus', 'trivial')
    await start($)
    await automodel($, 'on')
    await type($, 'keep going')
    await finishTurn($)
    expect(w.written[TIER_FILE]).toBe('')
    await type($, '/compact now please thanks')
    await type($, 'Summarize the notes from this meeting please', 'turn-1')
    expect(w.sets).toEqual([])
    await start($)
    await type($, 'hello')
    expect(w.sets).toEqual(['haiku'])
    expect(w.written[TIER_FILE]).toBe('trivial')
  })

  test('classifies a prompt that starts with an absolute file path', async ($, on) => {
    expect(isSlashCommand('/compact now')).toBe(true)
    expect(isSlashCommand('/var/folders/1k/tmp/Screenshot.png\n\nmake this fancier')).toBe(false)
    const w = world(on, 'opus', 'trivial')
    await start($)
    await automodel($, 'on')
    await type($, '/var/folders/1k/tmp/Screenshot\\ 2026-10-19.png\n\nSummarize this screenshot in three bullets')
    expect(w.sets).toEqual(['haiku'])
  })

  test('uses the skill\'s model-tier without asking the classifier', async ($, on) => {
    const w = world(on, 'opus', 'complex')
    w.files[`${HOME}/.claude/skills/commit/SKILL.md`] = TRIVIAL_SKILL
    await start($)
    await automodel($, 'on')
    await run($, 'commit', 'force')
    expect(w.sets).toEqual(['haiku'])
    expect(w.toasts).toEqual(['Auto Model: Haiku 5.5 (trivial)'])
    expect(w.asked).toBe(0)
  })

  test('prefers the project\'s copy of a skill over the home folder\'s', async ($, on) => {
    const w = world(on, 'haiku', 'trivial')
    w.files['/tmp/.claude/skills/commit/SKILL.md'] = COMPLEX_SKILL
    w.files[`${HOME}/.claude/skills/commit/SKILL.md`] = TRIVIAL_SKILL
    await start($)
    await automodel($, 'on')
    await run($, 'commit')
    expect(w.sets).toEqual(['opus'])
    expect(w.asked).toBe(0)
  })

  test('classifies a skill with no model-tier by its description, once', async ($, on) => {
    const w = world(on, 'opus', 'trivial')
    await start($)
    await automodel($, 'on')
    await run($, 'git-commit')
    await run($, 'git-commit', 'now')
    expect(w.sets).toEqual(['haiku'])
    expect(w.asked).toBe(1)
  })

  test('leaves the model alone for built-ins, unknown commands, its own command, or when off', async ($, on) => {
    const w = world(on, 'opus', 'trivial')
    await start($)
    await run($, 'commit')
    await automodel($, 'on')
    await run($, 'compact')
    await run($, 'not-listed')
    await automodel($, 'status')
    expect(w.sets).toEqual([])
    expect(w.asked).toBe(0)
  })

  test('steps down when the plan refuses the pick, and remembers the refused line', async ($, on) => {
    const w = world(on, 'haiku', 'frontier', ['fable'])
    await start($)
    await automodel($, 'on')
    await type($, 'Plan and run the migration of every service to the new platform')
    expect(w.sets).toEqual(['opus'])
    // Remove fable from w.refuse: switchTo should still stay on opus because fable was remembered as refused.
    w.refuse.length = 0
    await type($, 'Plan and run the migration of every service to the new platform')
    expect(w.sets).toEqual(['opus'])
  })

  test('goes back to the earlier model when turned off', async ($, on) => {
    const w = world(on, 'opus', 'trivial')
    await start($)
    await automodel($, 'on')
    await type($, 'Translate this paragraph into French for the newsletter')
    expect(w.model).toBe('haiku')
    const off = await automodel($, 'off')
    expect(w.model).toBe('opus')
    expect(off.text).toContain('back to')
  })

  test('keeps a bigger model for a smaller prompt while the cache is warm', async ($, on) => {
    const w = world(on, 'opus', 'trivial')
    await start($)
    await automodel($, 'on')
    await finishTurn($)
    await w.clock.advance(10 * MINUTE)
    await type($, 'Summarize the notes from this meeting into three bullets')
    expect(w.sets).toEqual([])
  })

  test('keeps a bigger model for a smaller skill while the cache is warm', async ($, on) => {
    const w = world(on, 'opus', 'complex')
    w.files[`${HOME}/.claude/skills/commit/SKILL.md`] = TRIVIAL_SKILL
    await start($)
    await automodel($, 'on')
    await finishTurn($)
    await run($, 'commit')
    expect(w.sets).toEqual([])
  })

  test('a skill steps down once the cache has gone cold', async ($, on) => {
    const w = world(on, 'opus', 'complex')
    w.files[`${HOME}/.claude/skills/commit/SKILL.md`] = TRIVIAL_SKILL
    await start($)
    await automodel($, 'on')
    await finishTurn($)
    await w.clock.advance(61 * MINUTE)
    await run($, 'commit')
    expect(w.sets).toEqual(['haiku'])
  })

  test('steps up while the cache is warm', async ($, on) => {
    const w = world(on, 'haiku', 'complex')
    await start($)
    await automodel($, 'on')
    await finishTurn($)
    await type($, 'Plan the rollout for the new token service')
    expect(w.sets).toEqual(['opus'])
  })

  test('steps down once the cache has gone cold', async ($, on) => {
    const w = world(on, 'opus', 'trivial')
    await start($)
    await automodel($, 'on')
    await finishTurn($)
    await w.clock.advance(61 * MINUTE)
    await type($, 'Summarize the notes from this meeting into three bullets')
    expect(w.sets).toEqual(['haiku'])
  })

  test('records the tier of the model in use for the status line', async ($, on) => {
    const w = world(on, 'haiku', 'complex')
    await start($)
    await automodel($, 'on')
    expect(w.written[TIER_FILE]).toBe('auto')
    w.written[TIER_FILE] = ''
    await start($)
    expect(w.written[TIER_FILE]).toBe('auto')
    await type($, 'Plan the rollout for the new token service')
    expect(w.written[TIER_FILE]).toBe('complex')
    await finishTurn($)
    w.level = 'trivial'
    await type($, 'Summarize the notes from this meeting into three bullets')
    expect(w.written[TIER_FILE]).toBe('complex')
    await automodel($, 'off')
    expect(w.written[TIER_FILE]).toBe('')
  })

  test('records the tier when the model already fits', async ($, on) => {
    const w = world(on, 'opus', 'complex')
    await start($)
    await automodel($, 'on')
    await type($, 'Plan the rollout for the new token service')
    expect(w.sets).toEqual([])
    expect(w.written[TIER_FILE]).toBe('complex')
  })

  test('picking a model by hand turns it off', async ($, on) => {
    const w = world(on, 'opus', 'trivial')
    await start($)
    await automodel($, 'on')
    await $.config.set({ key: 'model', value: 'sonnet', previous: 'opus', provider: { plugin: 'engine', tier: 'core' }, origin: { kind: 'composer' } })
    const status = await automodel($, 'status')
    expect(status.text).toContain('Auto Model is off')
    await type($, 'Summarize the notes from this meeting into three bullets')
    expect(w.sets).toEqual(['sonnet'])
  })
})

describe('status bar chip', () => {
  test('reads On or Off, flips on a press, fits narrow and wide', async ($, on) => {
    world(on, 'opus')
    await start($)
    for (const columns of [40, 160]) {
      const ui = await $.ui.mount({
        plugin: 'auto-model',
        surface: 'terminal',
        component: 'SessionMode',
        props: { modes: ['focus'] },
        viewport: { columns, rows: 30 },
      })
      const off = columns < 60 ? 'Auto: Off' : 'Auto Model: Off'
      const onLabel = columns < 60 ? 'Auto: On' : 'Auto Model: On'
      expect((await ui.find({ key: 'auto-model-toggle' }))?.text).toContain(off)
      await ui.press({ key: 'auto-model-toggle' })
      expect((await ui.find({ key: 'auto-model-toggle' }))?.text).toContain(onLabel)
      await ui.press({ key: 'auto-model-toggle' })
      await ui.unmount()
    }
  })
})
