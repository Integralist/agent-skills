import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine } from 'claude-code/testing'
import type { ConfigRow, On } from 'claude-code'

import { candidatesFor, clampEffort, clampEffortArgs, guessLevel, isShortReply, parseLevel } from '../hooks/logic'

const OPTIONS = ['default', 'sonnet', 'opus', 'haiku', 'fable', 'best', 'opusplan']
const IDS: Record<string, string> = {
  haiku: 'claude-haiku-5-5',
  sonnet: 'claude-sonnet-5-5',
  opus: 'claude-opus-5-5',
  fable: 'claude-fable-5-1',
}
const PRESENTATION = { isFullscreen: false, columns: 120 }

describe('logic', () => {
  test('reads the one-word answer', () => {
    expect(parseLevel('small')).toBe('small')
    expect(parseLevel(' Everyday.\n')).toBe('everyday')
    expect(parseLevel('STRONGEST')).toBe('strongest')
    expect(parseLevel('strong')).toBe('strong')
    expect(parseLevel('medium')).toBeUndefined()
  })

  test('spots a short reply', () => {
    expect(isShortReply('yes')).toBe(true)
    expect(isShortReply('ok!')).toBe(true)
    expect(isShortReply('keep going')).toBe(true)
    expect(isShortReply('Do it.')).toBe(true)
    expect(isShortReply('Refactor the auth module to use the new token client')).toBe(false)
  })

  test('falls back on the words, strong when in doubt', () => {
    expect(guessLevel('Summarize this paragraph for me please')).toBe('small')
    expect(guessLevel('Draft an email to the team about Friday')).toBe('everyday')
    expect(guessLevel('Implement retries in the HTTP client and add tests')).toBe('strong')
    expect(guessLevel('Migrate the entire codebase from Python 2 to Python 3')).toBe('strongest')
    expect(guessLevel('Thoughts on the weather tomorrow afternoon')).toBe('strong')
  })

  test('steps down to the next line that exists', () => {
    expect(candidatesFor('strongest', ['haiku', 'sonnet', 'opus', 'fable'])).toEqual(['fable', 'opus', 'sonnet', 'haiku'])
    expect(candidatesFor('strongest', ['haiku', 'sonnet', 'opus'])).toEqual(['opus', 'sonnet', 'haiku'])
    expect(candidatesFor('small', ['haiku', 'sonnet'])).toEqual(['haiku'])
  })

  test('never sends max effort', () => {
    expect(clampEffort('max')).toBe('xhigh')
    expect(clampEffort('high')).toBe('high')
    expect(clampEffortArgs('max')).toBe('xhigh')
    expect(clampEffortArgs('MAX')).toBe('xhigh')
  })
})

type World = { model: string; sets: string[]; toasts: string[]; level: string; refuse: string[] }

/** The engine beneath the mod: the model row, the session model, a classifier. */
function world(on: On, start: string, level = 'strong', refuse: string[] = []): World {
  const w: World = { model: start, sets: [], toasts: [], level, refuse }
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
  on('model.complete', () => ({
    value: {
      isAnswered: true as const,
      text: w.level,
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

async function type($: Engine, text: string, turnId?: string) {
  return $.prompt.submit({ text, wait: false, origin: { kind: 'composer' }, turnId })
}

describe('switching', () => {
  test('switches on a new prompt and shows a toast', async ($, on) => {
    const w = world(on, 'opus', 'small')
    await start($)
    await automodel($, 'on')
    await type($, 'Summarize the notes from this meeting into three bullets')
    expect(w.sets).toEqual(['haiku'])
    expect(w.toasts).toEqual(['Auto Model: Haiku 5.5 (small)'])
  })

  test('stays put on a short reply, a slash command and a mid-turn message', async ($, on) => {
    const w = world(on, 'opus', 'small')
    await start($)
    await automodel($, 'on')
    await type($, 'keep going')
    await type($, '/compact now please thanks')
    await type($, 'Summarize the notes from this meeting please', 'turn-1')
    expect(w.sets).toEqual([])
  })

  test('steps down when the plan refuses the pick', async ($, on) => {
    const w = world(on, 'haiku', 'strongest', ['fable'])
    await start($)
    await automodel($, 'on')
    await type($, 'Plan and run the migration of every service to the new platform')
    expect(w.sets).toEqual(['opus'])
  })

  test('goes back to the earlier model when turned off', async ($, on) => {
    const w = world(on, 'opus', 'small')
    await start($)
    await automodel($, 'on')
    await type($, 'Translate this paragraph into French for the newsletter')
    expect(w.model).toBe('haiku')
    const off = await automodel($, 'off')
    expect(w.model).toBe('opus')
    expect(off.text).toContain('back to')
  })

  test('picking a model by hand turns it off', async ($, on) => {
    const w = world(on, 'opus', 'small')
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
