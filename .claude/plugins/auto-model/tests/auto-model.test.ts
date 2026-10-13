import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { CommandInfo, ConfigRow, On } from 'claude-code'

import { candidatesFor, clampEffort, clampEffortArgs, guessLevel, isShortReply, parseLevel, skillPaths, tierFromFrontmatter } from '../hooks/logic'

const OPTIONS = ['default', 'sonnet', 'opus', 'haiku', 'fable', 'best', 'opusplan']
const IDS: Record<string, string> = {
  haiku: 'claude-haiku-5-5',
  sonnet: 'claude-sonnet-5-5',
  opus: 'claude-opus-5-5',
  fable: 'claude-fable-5-1',
}
const PRESENTATION = { isFullscreen: false, columns: 120 }
const HOME = '/home/me'
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
    expect(isShortReply('Refactor the auth module to use the new token client')).toBe(false)
  })

  test('falls back on the words, complex when in doubt', () => {
    expect(guessLevel('Summarize this paragraph for me please')).toBe('trivial')
    expect(guessLevel('Draft an email to the team about Friday')).toBe('moderate')
    expect(guessLevel('Implement retries in the HTTP client and add tests')).toBe('complex')
    expect(guessLevel('Migrate the entire codebase from Python 2 to Python 3')).toBe('frontier')
    expect(guessLevel('Thoughts on the weather tomorrow afternoon')).toBe('complex')
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
  files: Record<string, string>
}

/** The engine beneath the mod: the model row, the session model, a classifier, skill files. */
function world(on: On, start: string, level = 'complex', refuse: string[] = []): World {
  const w: World = { model: start, sets: [], toasts: [], level, refuse, asked: 0, files: {} }
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
  on('env.get', ($, e) => ({ value: e.name === 'HOME' ? HOME : undefined }))
  on('fs.read', ($, e) => {
    const text = w.files[e.path]
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  on('model.complete', () => ({
    value: {
      isAnswered: true as const,
      text: (w.asked++, w.level),
      usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    },
  }))
  on('ui.toast', ($, e) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('ui.log', () => ({ value: undefined }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('command.run', () => ({ text: 'engine ran it' }))
  return w
}

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
  test('switches on a new prompt and shows a toast', async ($, on) => {
    const w = world(on, 'opus', 'trivial')
    await start($)
    await automodel($, 'on')
    await type($, 'Summarize the notes from this meeting into three bullets')
    expect(w.sets).toEqual(['haiku'])
    expect(w.toasts).toEqual(['Auto Model: Haiku 5.5 (trivial)'])
  })

  test('stays put on a short reply, a slash command and a mid-turn message', async ($, on) => {
    const w = world(on, 'opus', 'trivial')
    await start($)
    await automodel($, 'on')
    await type($, 'keep going')
    await type($, '/compact now please thanks')
    await type($, 'Summarize the notes from this meeting please', 'turn-1')
    expect(w.sets).toEqual([])
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

  test('steps down when the plan refuses the pick', async ($, on) => {
    const w = world(on, 'haiku', 'frontier', ['fable'])
    await start($)
    await automodel($, 'on')
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
