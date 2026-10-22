import { describe, expect, mock, test } from 'claude-code/testing'
import type { Engine, MockClock } from 'claude-code/testing'
import type { On } from 'claude-code'

import { LOG_ENTRIES, LOG_ENTRY_CHARS, appendLog, cleanName, meter } from '../hooks/logic'

const PLUGIN = 'clean-view'
const PLAN = 'mcp__clean-view__plan_steps'
const PROGRESS = 'mcp__clean-view__report_progress'
const PRESENTATION = { isFullscreen: false, columns: 120 }
const SURFACES = ['terminal', 'desktop'] as const
const BAND = (columns = 80) => ({
  plugin: PLUGIN,
  component: 'AbovePrompt' as const,
  props: {
    hasSurvey: false,
    isWorking: true,
    maxRows: 20,
    bodyColumns: columns,
    scroll: { offset: 0, bodyRows: 19, totalRows: 0 },
    view: {},
  },
  viewport: { columns: columns + 5, rows: 30 },
})

const DETAILS = 'clean-view-details'
const PANE = {
  plugin: PLUGIN,
  component: 'Pane' as const,
  requestId: DETAILS,
  props: {
    title: 'Task details',
    isFocused: true,
    bodyColumns: 80,
    placement: 'inline' as const,
    scroll: { offset: 0, bodyRows: 12, totalRows: 0 },
    view: {},
  },
  viewport: { columns: 85, rows: 30 },
}

type Agent ={ id: string; description: string; type: string; status: string }
type Opened = { id: string; title?: string; focus?: true; closeOnEscape?: true; holdToasts?: true }
type World = {
  toasts: string[]
  ran: string[]
  clock: MockClock
  verdict: 'allow' | 'ask'
  failText?: string
  agents: Agent[]
  opened: Opened[]
  aborted: string[]
  asked: number
}

/** The engine beneath the mod: store, clock, tools that succeed, panes that open, and a counter for unexpected model requests. */
function world(on: On): World {
  const w: World = { toasts: [], ran: [], clock: mock.clock(on), verdict: 'allow', agents: [], opened: [], aborted: [], asked: 0 }
  on('ui.open', ($, e) => {
    w.opened.push(e)
    return { value: { isPlaced: true as const } }
  })
  on('ui.close', () => ({ value: undefined }))
  on('turn.abort', ($, e) => {
    w.aborted.push(e.turnId)
    return { value: undefined }
  })
  on('agent.list', () => ({ value: w.agents as never }))
  mock.store(on)
  on('session.start', ($, e) => ({ cwd: e.cwd }))
  on('command.register', ($, e) => ({ value: { command: e.name } }))
  on('tool.register', ($, e) => ({ value: { tool: `mcp__${PLUGIN}__${e.name}` } }))
  on('ui.toast', ($, e) => {
    w.toasts.push(e.text)
    return { value: undefined }
  })
  on('model.complete', () => ({
    value: {
      isAnswered: true as const,
      text: (w.asked++, 'Build my landing page'),
      usage: { input_tokens: 1, output_tokens: 1, cache_creation_input_tokens: 0, cache_read_input_tokens: 0 },
    },
  }))
  on('prompt.submit', ($, e) => ({ text: e.text }))
  on('prompt.compose', () => ({ sections: [] }))
  on('turn.start', ($, e) => ({ turnId: e.turnId }))
  on('turn.complete', ($, e) => ({ text: e.answer }))
  on('classic.Notification', () => ({}))
  on('classic.UserPromptSubmit', () => ({}))
  on('classic.PermissionDenied', () => ({}))
  on('turn.step', async function* ($, e) {
    yield { kind: 'thinking' as const, index: 0, text: 'Checking ' }
    yield { kind: 'thinking' as const, index: 0, text: 'the branch.' }
    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: null, usage: null }
  })
  on('tool.check', () => ({ decision: w.verdict }))
  on('tool.call', ($, e) => {
    w.ran.push(String(e.tool))
    if (w.failText !== undefined) return { result: w.failText, isError: true, text: w.failText }
    return { result: 'ok' }
  })
  return w
}

async function start($: Engine) {
  await $.session.start({ cwd: '/tmp', surface: 'terminal', isInteractive: true })
}

async function prompt($: Engine, text: string) {
  await $.turn.start({ text, turnId: 'turn-1' })
}

/** Sends one model request of the turn, reading its stream to the end. */
async function step($: Engine, agentId?: string) {
  for await (const _ of $.turn.step({ turnId: 'turn-1', index: 1, model: 'claude-opus-5-5', messageCount: 3, agentId }));
}

async function simple($: Engine, args: string) {
  return $.command.run({ command: 'simple', args, origin: { kind: 'composer' }, presentation: PRESENTATION })
}

async function rows($: Engine, surface: (typeof SURFACES)[number], columns = 80) {
  const ui = await $.ui.mount({ ...BAND(columns), surface })
  const texts = (await ui.findAll({ type: 'Text' })).map(one => one.text)
  await ui.unmount()
  return texts
}

describe('plain names', () => {
  test('strips code, paths and file names, and trims long names', () => {
    expect(cleanName('Build the pricing section in `src/Pricing.tsx`')).toBe('Build the pricing section in')
    expect(cleanName('update src/app/main.go handler')).toBe('Update handler')
    expect(cleanName('fix the header in index.html quickly')).toBe('Fix the header in quickly')
    const long = cleanName('Write a very long description of everything that the landing page should contain')
    expect(long.length).toBeLessThanOrEqual(40)
    expect(long.endsWith('…')).toBe(true)
    expect(cleanName('`npm test`')).toBe('Working on it')
  })
})

describe('meter', () => {
  test('a reported step pulses the next cell between reports', () => {
    const one = { id: 'step-0', name: 'Read the files', status: 'active' as const, percent: 60, hasReported: true }
    expect(meter(one, 0)).toBe('██████░░░░')
    expect(meter(one, 1)).toBe('██████▒░░░')
    expect(meter(one, 2)).toBe('██████░░░░')
    expect(meter({ ...one, percent: 100 }, 1)).toBe('██████████')
  })
})

describe('raw log', () => {
  test('pieces of one block join, new blocks add an entry, and the oldest entries and longest texts are cut', () => {
    let log = appendLog([], 'thinking', 'b0', 'Let me ')
    log = appendLog(log, 'thinking', 'b0', 'think.')
    log = appendLog(log, 'call', 'b1', 'Read ')
    expect(log).toEqual([
      { kind: 'thinking', key: 'b0', text: 'Let me think.' },
      { kind: 'call', key: 'b1', text: 'Read ' },
    ])

    for (let i = 0; i < LOG_ENTRIES + 5; i++) log = appendLog(log, 'result', `r${i}`, 'ok')
    expect(log).toHaveLength(LOG_ENTRIES)
    expect(log[0].key).toBe('r5')

    const long = appendLog([], 'result', 'r', 'x'.repeat(LOG_ENTRY_CHARS + 50))[0].text
    expect(long).toHaveLength(LOG_ENTRY_CHARS + 1)
    expect(long.endsWith('…')).toBe(true)
  })
})

describe('checklist', () => {
  test('shows activity and time before a plan instead of inventing a title', async ($, on) => {
    const w = world(on)
    await start($)
    await prompt($, "btw the links aren't clickable, so I approve the change")
    await w.clock.advance(9000)
    for (const surface of SURFACES) {
      const texts = (await rows($, surface)).join('\n')
      expect(texts).toContain('Thinking... · 9s')
      expect(texts).not.toContain('Build my landing page')
      expect(texts).not.toContain('Btw')
    }
  })

  test('starting a job makes no separate naming request', async ($, on) => {
    const w = world(on)
    await start($)
    await prompt($, 'Check the link targets')
    expect(w.asked).toBe(0)
  })

  test('the plan supplies the title and replanning retains or replaces it', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Check the links')
    await $.tool.call({ tool: PLAN, title: 'Fix local links', steps: ['Check the targets', 'Verify opening'] })
    expect((await rows($, 'terminal')).join('\n')).toContain('Fix local links · ')
    await $.tool.call({ tool: PROGRESS, task: 'Check the targets', percent: 100 })
    for (const title of [undefined, '', '   ']) {
      await $.tool.call({ tool: PLAN, title, steps: ['Check the targets', 'Verify opening'] })
      const texts = (await rows($, 'terminal')).join('\n')
      expect(texts).toContain('Fix local links · ')
      expect(texts).toMatch(/✓ Check the targets/)
    }
    await $.tool.call({ tool: PLAN, title: 'Verify web links', steps: ['Check the targets', 'Verify opening'] })
    expect((await rows($, 'terminal')).join('\n')).toContain('Verify web links · ')
  })

  test('the details pane shows a step\'s raw tool calls and results, newest first', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Check the config')
    await $.tool.call({ tool: PLAN, steps: ['Read the config', 'Report back'] })
    await $.tool.call({ tool: 'Read', file_path: 'a.ts' })
    await $.tool.call({ tool: 'Grep', pattern: 'port', agentId: 'agent-1' })
    await $.tool.call({ tool: 'Bash', command: 'git status' })

    const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
    const text = async () => (await pane.findAll({ type: 'Text' })).map(one => one.text).join('\n')
    const first = await text()
    expect(first).toContain('Step log · newest first')
    expect(first).toContain('→ Read {"file_path":"a.ts"}')
    expect(first).toContain('→ Bash {"command":"git status"}')
    expect(first).toContain('← ok')
    // A subagent's calls are its own work, not this step's.
    expect(first).not.toContain('Grep')
    expect(first.indexOf('Bash {')).toBeLessThan(first.indexOf('Read {'))

    await pane.press({ key: 'clean-view-details-next' })
    expect(await text()).toContain('Nothing recorded for this step yet')
    await pane.unmount()
  })

  test('the checklist prompt forbids standalone progress turns and waits for tool output before reporting 100%', async ($, on) => {
    world(on)
    await start($)
    const composed = await $.prompt.compose({
      model: 'claude-opus-5-5',
      promptModel: 'claude-opus-5-5',
      surfaces: ['terminal'],
      tools: [],
      outputStyle: null,
      traits: [],
    })
    const text = composed.sections.map(one => one.text).join('\n')
    expect(text).toContain('Never spend a turn calling `mcp__clean-view__report_progress` or `mcp__clean-view__plan_steps` alone')
    expect(text).toContain("read a step's tool output and confirmed the step is done")
  })

  test('the details pane counts the files read in the active step', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Open ten files and summarise them')
    await $.tool.call({ tool: PLAN, steps: ['Read the files', 'Summarise them'] })
    const activity = async () => {
      const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
      const texts = (await pane.findAll({ type: 'Text' })).map(one => one.text).join('\n')
      await pane.unmount()
      return texts
    }
    for (const file_path of ['a.ts', 'b.ts', 'c.ts']) await $.tool.call({ tool: 'Read', file_path })
    expect(await activity()).toContain('Read 3 files in this step')

    await $.tool.call({ tool: PROGRESS, task: 'Read the files', percent: 100 })
    await $.tool.call({ tool: 'Read', file_path: 'd.ts' })
    expect(await activity()).toContain('Read 1 file in this step')
  })

  test('a to-do list and a 60% report draw done, active, next and up-next rows', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.call({
      tool: 'TodoWrite',
      todos: [
        { content: 'Read your brand notes', status: 'completed', activeForm: 'Reading' },
        { content: 'Build the pricing section', status: 'in_progress', activeForm: 'Building' },
        { content: 'Add the contact form', status: 'pending', activeForm: 'Adding' },
        { content: 'Polish the footer', status: 'pending', activeForm: 'Polishing' },
      ],
    })
    await $.tool.call({ tool: PROGRESS, task: 'Build the pricing section', percent: 60 })
    for (const surface of SURFACES) {
      const texts = (await rows($, surface)).join('\n')
      expect(texts).toContain('✓')
      expect(texts).toMatch(/Read your brand notes\s+██████████\s+Done/)
      expect(texts).toMatch(/▶ Build the pricing section\s+██████░░░░\s+60%/)
      expect(texts).toMatch(/○ Add the contact form\s+░{10}\s+Next/)
      expect(texts).toMatch(/○ Polish the footer\s+░{10}\s+Up next/)
    }
  })

  test('plan_steps then a report at 100 checks off step one and starts step two', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Build my landing page')
    const planned = await $.tool.call({ tool: PLAN, steps: ['Read your brand notes', 'Build the pricing section'] })
    expect(planned.result).toBe('Planned 2 steps. The first one has started.')
    const noted = await $.tool.call({ tool: PROGRESS, task: 'Read your brand notes', percent: 140 })
    expect(noted.result).toBe('Progress noted: 100%.')
    const texts = (await rows($, 'terminal')).join('\n')
    expect(texts).toMatch(/✓ Read your brand notes\s+█{10}\s+Done/)
    expect(texts).toMatch(/▶ Build the pricing section\s+[█░]{10}\s+Working/)
  })

  test('a task row and its Details button fit on one line', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.call({ tool: PLAN, steps: ['Inspect every file in the whole project', 'Run the checks'] })
    for (const columns of [60, 80, 120]) {
      const ui = await $.ui.mount({ ...BAND(columns), surface: 'terminal' })
      const row = (await ui.findAll({ type: 'Text' })).map(one => one.text).find(text => text.includes('Working'))
      expect(row).toBeDefined()
      // The row text, a gap and the 11-cell `[ Details ]` button share the body width.
      expect(row!.length + 1 + 11).toBeLessThanOrEqual(columns)
      await ui.unmount()
    }
  })

  test('Details opens a live task pane that pages through tasks and can stop the run', async ($, on) => {
    const w = world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.call({ tool: PLAN, steps: ['Inspect the files', 'Run the checks'] })
    await $.tool.call({ tool: PROGRESS, task: 'Inspect the files', percent: 45 })

    const band = await $.ui.mount({ ...BAND(), surface: 'terminal' })
    await band.press({ key: 'clean-view-task-inspect-step-0-Inspect the files' })
    await band.unmount()
    expect(w.opened.at(-1)).toMatchObject({ id: DETAILS, focus: true, closeOnEscape: true, holdToasts: true })

    const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
    const text = async () => (await pane.findAll({ type: 'Text' })).map(one => one.text).join('\n')
    expect(await text()).toContain('Inspect the files')
    expect(await text()).toContain('1/2')
    expect(await text()).toMatch(/Progress\s+[█░]{10}\s+45% reported/)
    expect(await text()).toContain('Progress reported · 0s ago')

    await w.clock.advance(5000)
    await pane.redraw()
    expect(await text()).toMatch(/Elapsed\s+5s/)
    expect(await text()).toContain('Progress reported · 5s ago')

    await pane.press({ key: 'clean-view-details-next' })
    expect(await text()).toContain('Run the checks')
    expect(await text()).toContain('2/2')
    expect(await text()).toMatch(/Elapsed\s+Not started yet/)

    await $.tool.call({ tool: PROGRESS, task: 'Inspect the files', percent: 100 })
    await w.clock.advance(3000)
    await pane.redraw()
    // Step 2 has been active for 3s (while total run is 8s)
    expect(await text()).toMatch(/Elapsed\s+3s/)

    // Step 1 is done and stays frozen at 5s
    await pane.press({ key: 'clean-view-details-prev' })
    expect(await text()).toMatch(/Elapsed\s+5s/)

    await pane.press({ key: 'clean-view-details-stop' })
    expect(w.aborted).toEqual(['turn-1'])
    await pane.unmount()
  })

  test('a permission prompt shows Needs you', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await $.classic.Notification({ message: 'Claude needs your permission', notification_type: 'permission_prompt' })
    const texts = (await rows($, 'terminal')).join('\n')
    expect(texts).toContain('Needs you')
    expect(texts).toContain('Claude needs your OK to continue')
  })

  for (const [mode, shows] of [['default', true], ['auto', false], ['bypassPermissions', false], ['dontAsk', false]] as const) {
    test(`a permission ask in ${mode} mode ${shows ? 'shows' : 'does not show'} Needs you`, async ($, on) => {
      const w = world(on)
      w.verdict = 'ask'
      await start($)
      await prompt($, 'Build my landing page')
      await $.classic.UserPromptSubmit({ prompt: 'Build my landing page', permission_mode: mode })
      await $.tool.check({ tool: 'Bash', input: { command: 'make test' }, tool_use_id: 'toolu_1' })
      const texts = (await rows($, 'terminal')).join('\n')
      if (shows) expect(texts).toContain('Claude needs your OK to continue')
      else expect(texts).not.toContain('Needs you')
    })
  }

  test('a denied permission ask clears Needs you', async ($, on) => {
    const w = world(on)
    w.verdict = 'ask'
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.check({ tool: 'Bash', input: { command: 'make test' }, tool_use_id: 'toolu_1' })
    expect((await rows($, 'terminal')).join('\n')).toContain('Needs you')
    await $.classic.PermissionDenied({ tool_name: 'Bash', tool_input: { command: 'make test' }, tool_use_id: 'toolu_1', reason: 'blocked by the classifier' })
    expect((await rows($, 'terminal')).join('\n')).not.toContain('Needs you')
  })

  test('a new model step clears Needs you when a managed plugin hides the mode', async ($, on) => {
    const w = world(on)
    w.verdict = 'ask'
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.check({ tool: 'Bash', input: { command: 'make test' }, tool_use_id: 'toolu_1' })
    expect((await rows($, 'terminal')).join('\n')).toContain('Needs you')
    await step($)
    expect((await rows($, 'terminal')).join('\n')).not.toContain('Needs you')
  })

  test('a subagent step leaves Needs you up', async ($, on) => {
    const w = world(on)
    w.verdict = 'ask'
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.check({ tool: 'Bash', input: { command: 'make test' }, tool_use_id: 'toolu_1' })
    await step($, 'agent-1')
    expect((await rows($, 'terminal')).join('\n')).toContain('Needs you')
  })

  test('the band keeps a blank line above it, away from the spinner, open or collapsed', async ($, on) => {
    const w = world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.call({ tool: PLAN, steps: ['Build the page'] })
    for (const surface of SURFACES) {
      const ui = await $.ui.mount({ ...BAND(), surface })
      expect((await ui.find({ key: 'clean-view-band' }))?.props.marginTop).toBe(1)
      await ui.unmount()
    }
    await $.tool.call({ tool: PROGRESS, task: 'Build the page', percent: 100 })
    await $.turn.complete({ answer: 'Done.', durationMs: 1000, isAborted: false, turnId: 'turn-1', reason: 'answer' })
    await w.clock.advance(5000)
    const ui = await $.ui.mount({ ...BAND(), surface: 'terminal' })
    expect((await ui.find({ key: 'clean-view-band' }))?.props.marginTop).toBe(1)
    await ui.unmount()
  })

  test('the open band keeps a blank line between its title row and the task list', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.call({ tool: PLAN, steps: ['Build the page'] })
    for (const surface of SURFACES) {
      const ui = await $.ui.mount({ ...BAND(), surface })
      expect((await ui.find({ key: 'clean-view-header' }))?.props.marginBottom).toBe(1)
      await ui.unmount()
    }
  })

  test('finishing shows All done, then one line after 5 seconds', async ($, on) => {
    const w = world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.call({ tool: PLAN, title: 'Build my landing page', steps: ['Build the page'] })
    await $.tool.call({ tool: PROGRESS, task: 'Build the page', percent: 100 })
    await $.turn.complete({ answer: 'Done.', durationMs: 1000, isAborted: false, turnId: 'turn-1', reason: 'answer' })
    const before = (await rows($, 'terminal')).join('\n')
    expect(before).toMatch(/✓ All done · Build my landing page · took/)
    expect(before).toContain('Build the page')
    await w.clock.advance(5000)
    const after = (await rows($, 'terminal')).join('\n')
    expect(after).toMatch(/✓ All done/)
    expect(after).not.toContain('Build the page')
  })
})

describe('after the turn', () => {
  async function stopMidPlan($: Engine) {
    await prompt($, 'Build my landing page')
    await $.tool.call({ tool: PLAN, title: 'Build my landing page', steps: ['Build the page', 'Check it'] })
    await $.tool.call({ tool: PROGRESS, task: 'Build the page', percent: 100 })
    await $.turn.complete({ answer: 'Which colour?', durationMs: 1000, isAborted: false, turnId: 'turn-1', reason: 'answer' })
  }

  test('a plain reply with no plan clears the band', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'thanks')
    await $.turn.complete({ answer: 'You are welcome.', durationMs: 1000, isAborted: false, turnId: 'turn-1', reason: 'answer' })
    const texts = (await rows($, 'terminal')).join('\n')
    expect(texts).not.toContain('Needs you')
    expect(texts).not.toContain('Understand your request')
  })

  test('a new request shows Thinking instead of the completed checklist', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Finish the old task')
    await $.tool.call({ tool: PLAN, steps: ['Finish the old task'] })
    await $.tool.call({ tool: PROGRESS, task: 'Finish the old task', percent: 100 })
    await $.turn.complete({ answer: 'Done.', durationMs: 1000, isAborted: false, turnId: 'turn-1', reason: 'answer' })

    await $.turn.start({ text: 'Start a new task', turnId: 'turn-2' })
    const beforePlan = (await rows($, 'terminal')).join('\n')
    expect(beforePlan).toContain('Thinking...')
    expect(beforePlan).not.toContain('Finish the old task')
    expect(beforePlan).not.toContain('Understand your request')
    expect(beforePlan).not.toContain('Plan the steps')

    await $.tool.call({ tool: PLAN, steps: ['Start the new task'] })
    const afterPlan = (await rows($, 'terminal')).join('\n')
    expect(afterPlan).toContain('Start the new task')
    expect(afterPlan).not.toContain('Thinking...')
  })

  test('a plan stopped part way reads Paused, not Working', async ($, on) => {
    world(on)
    await start($)
    await stopMidPlan($)
    const texts = (await rows($, 'terminal')).join('\n')
    expect(texts).toContain('Needs you')
    expect(texts).toMatch(/‖ Check it\s+[█░]{10}\s+Paused/)
  })

  test('a turn that ends mid-plan without a question reads Ended, not Needs you', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.call({ tool: PLAN, title: 'Build my landing page', steps: ['Build the page', 'Check it', 'Publish it'] })
    await $.tool.call({ tool: PROGRESS, task: 'Build the page', percent: 100 })
    await $.turn.complete({ answer: 'Built the page.', durationMs: 1000, isAborted: false, turnId: 'turn-1', reason: 'answer' })
    const texts = (await rows($, 'terminal')).join('\n')
    expect(texts).not.toContain('Needs you')
    expect(texts).toMatch(/■ Ended · Build my landing page · 1 of 3 steps done/)
    expect(texts).toMatch(/‖ Check it\s+[█░]{10}\s+Paused/)
  })

  describe('after Esc or a pause', () => {
    async function halfDone($: Engine, end: { answer: string; reason: 'answer' | 'aborted' }) {
      await prompt($, 'Build my landing page')
      await $.tool.call({ tool: PLAN, title: 'Build my landing page', steps: ['Build the page', 'Check it', 'Publish it'] })
      await $.tool.call({ tool: PROGRESS, task: 'Build the page', percent: 100 })
      await $.turn.complete({ answer: end.answer, durationMs: 1000, isAborted: end.reason === 'aborted', turnId: 'turn-1', reason: end.reason })
    }

    test('Esc mid-plan reads Stopped, with the running step Paused, not Working', async ($, on) => {
      world(on)
      await start($)
      await halfDone($, { answer: '', reason: 'aborted' })
      const texts = (await rows($, 'terminal')).join('\n')
      expect(texts).toMatch(/■ Stopped · Build my landing page · you pressed Esc/)
      expect(texts).toMatch(/‖ Check it\s+[█░]{10}\s+Paused/)
      expect(texts).not.toContain('Working')
    })

    test('a late end of the Esc-stopped turn does not stop the turn that took over', async ($, on) => {
      world(on)
      await start($)
      await halfDone($, { answer: '', reason: 'aborted' })
      await $.turn.start({ text: 'Use blue for the buttons instead', turnId: 'turn-2' })
      await $.turn.complete({ answer: '', durationMs: 1000, isAborted: true, turnId: 'turn-1', reason: 'aborted' })
      const texts = (await rows($, 'terminal')).join('\n')
      expect(texts).not.toContain('Stopped')
      expect(texts).toMatch(/▶ Check it/)
    })

    test('an end that arrives after the next turn started does not stop it', async ($, on) => {
      world(on)
      await start($)
      await prompt($, 'Build my landing page')
      await $.tool.call({ tool: PLAN, steps: ['Build the page', 'Check it'] })
      await $.turn.start({ text: 'Use blue for the buttons instead', turnId: 'turn-2' })
      await $.turn.complete({ answer: '', durationMs: 1000, isAborted: true, turnId: 'turn-1', reason: 'aborted' })
      expect((await rows($, 'terminal')).join('\n')).not.toContain('Stopped')
    })

    for (const end of [{ answer: '', reason: 'aborted' }, { answer: 'Built the page.', reason: 'answer' }, { answer: 'Which colour?', reason: 'answer' }] as const) {
      test(`a typed prompt after ${end.reason === 'aborted' ? 'Esc' : end.answer} carries on with the same plan`, async ($, on) => {
        world(on)
        await start($)
        await halfDone($, end)
        await $.turn.start({ text: 'Use blue for the buttons instead', turnId: 'turn-2' })
        const texts = (await rows($, 'terminal')).join('\n')
        expect(texts).toMatch(/Build my landing page · /)
        expect(texts).toMatch(/✓ Build the page/)
        expect(texts).toMatch(/▶ Check it/)
        expect(texts).not.toMatch(/Stopped|Ended|Needs you|Understand your request/)
      })
    }

    test('a typed prompt after rejecting AskUserQuestion carries on with the same plan instead of wiping finished steps', async ($, on) => {
      const w = world(on)
      await start($)
      await prompt($, 'Build my landing page')
      await $.tool.call({ tool: PLAN, steps: ['Build the page', 'Check it', 'Publish it'] })
      await $.tool.call({ tool: PROGRESS, task: 'Build the page', percent: 100 })
      w.failText = "The user doesn't want to proceed with this tool use. The tool use was rejected."
      await $.tool.call({ tool: 'AskUserQuestion', questions: [] })
      w.failText = undefined
      await $.turn.complete({ answer: '', durationMs: 1000, isAborted: false, turnId: 'turn-1', reason: 'answer' })

      const paused = (await rows($, 'terminal')).join('\n')
      expect(paused).toContain('⚠ Stuck: you said no to a step, so Claude paused')
      expect(paused).toMatch(/‖ Check it\s+[█░]{10}\s+Paused/)

      await $.turn.start({ text: 'sorry I pressed ESC by accident, can you give me those options again', turnId: 'turn-2' })
      const resumed = (await rows($, 'terminal')).join('\n')
      expect(resumed).toMatch(/✓ Build the page/)
      expect(resumed).toMatch(/▶ Check it/)
      expect(resumed).not.toContain('Stuck')
      expect(resumed).not.toContain('Thinking...')
    })
  })

  describe('with background agents', () => {
    const running: Agent = { id: 'a1', description: 'Check the page', type: 'general-purpose', status: 'running' }
    const finished: Agent = { id: 'a2', description: 'Read the notes', type: 'general-purpose', status: 'completed' }

    async function endTurn($: Engine, answer: string) {
      await prompt($, 'Build my landing page')
      await $.tool.call({ tool: PLAN, title: 'Build my landing page', steps: ['Build the page', 'Check it'] })
      await $.tool.call({ tool: PROGRESS, task: 'Build the page', percent: 100 })
      await $.turn.complete({ answer, durationMs: 1000, isAborted: false, turnId: 'turn-1', reason: 'answer' })
    }

    test('a turn that ends while an agent runs reads Waiting, not Needs you or Ended', async ($, on) => {
      const w = world(on)
      w.agents = [running, finished]
      await start($)
      await endTurn($, 'I have started a check in the background.')
      const texts = (await rows($, 'terminal')).join('\n')
      expect(texts).toMatch(/⏳ Waiting on 1 background agent · Build my landing page/)
      expect(texts).not.toContain('Needs you')
      expect(texts).not.toContain('Ended')
    })

    test('a question still reads Needs you while an agent runs', async ($, on) => {
      const w = world(on)
      w.agents = [running]
      await start($)
      await endTurn($, 'Which colour?')
      const texts = (await rows($, 'terminal')).join('\n')
      expect(texts).toContain('Needs you')
    })

    test('the agent reporting back resumes the same checklist', async ($, on) => {
      const w = world(on)
      w.agents = [running]
      await start($)
      await endTurn($, 'I have started a check in the background.')
      w.agents = [{ ...running, status: 'completed' }]
      const note = '<task-notification>Check the page finished</task-notification>'
      await $.prompt.submit({ text: note, wait: false, origin: { kind: 'task-notification' } })
      await $.turn.start({ text: note, turnId: 'turn-2' })
      const texts = (await rows($, 'terminal')).join('\n')
      expect(texts).toMatch(/Build my landing page · /)
      expect(texts).toMatch(/✓ Build the page/)
      expect(texts).toMatch(/▶ Check it/)
      expect(texts).not.toContain('Waiting on')
    })
  })

  test('a slash command clears a band left waiting', async ($, on) => {
    world(on)
    await start($)
    await stopMidPlan($)
    await $.prompt.submit({ text: '/context', wait: false, origin: { kind: 'composer' }, command: { name: 'context', args: '' } })
    const texts = (await rows($, 'terminal')).join('\n')
    expect(texts).not.toContain('Needs you')
    expect(texts).not.toContain('Check it')
  })
})

describe('plan first', () => {
  test('denies other tools before a plan and allows them after', async ($, on) => {
    const w = world(on)
    await start($)
    await prompt($, 'Build my landing page')
    const before = await $.tool.call({ tool: 'Bash', command: 'ls', description: 'list' })
    expect(before.deny).toContain('plan_steps')
    expect(w.ran).not.toContain('Bash')
    await $.tool.call({ tool: PLAN, steps: ['Look around', 'Build it'] })
    const after = await $.tool.call({ tool: 'Bash', command: 'ls', description: 'list' })
    expect(after.deny).toBeUndefined()
    expect(w.ran).toContain('Bash')
  })
})

describe('replanning', () => {
  const ls = { tool: 'Bash', command: 'ls', description: 'list' }

  test('plan_steps called again keeps finished steps done and starts the first unfinished one', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.call({ tool: PLAN, steps: ['Read your brand notes', 'Build the pricing section'] })
    await $.tool.call({ tool: PROGRESS, task: 'Read your brand notes', percent: 100 })
    const replanned = await $.tool.call({ tool: PLAN, steps: ['Read your brand notes', 'Build the pricing section', 'Tidy the formatting'] })
    expect(replanned.result).toBe('Planned 3 steps (1 already done). Active step: "Build the pricing section" — do not re-report finished steps.')
    const texts = (await rows($, 'terminal')).join('\n')
    expect(texts).toMatch(/✓ Read your brand notes\s+█{10}\s+Done/)
    expect(texts).toMatch(/▶ Build the pricing section\s+[█░]{10}\s+Working/)
    expect(texts).toMatch(/○ Tidy the formatting\s+░{10}\s+Next/)
  })

  test('batches plan_steps and report_progress with sibling tools in the same turn, excludes pause time, and auto-completes the final step', async ($, on) => {
    const w = world(on)
    await start($)
    await prompt($, 'Build my landing page')

    // Parallel tool calls in one assistant turn: plan_steps + Read
    const [planned, firstRead] = await Promise.all([
      $.tool.call({ tool: PLAN, title: 'Build my landing page', steps: ['Read your brand notes', 'Build the pricing section', 'Check the page'] }),
      $.tool.call({ tool: 'Read', file_path: 'notes.md' }),
    ])
    expect(planned.result).toBe('Planned 3 steps. The first one has started.')
    expect(firstRead.deny).toBeUndefined()

    // Parallel tool calls: report_progress(100) + Bash logs Bash under step 2
    await Promise.all([
      $.tool.call({ tool: PROGRESS, task: 'Read your brand notes', percent: 100 }),
      $.tool.call({ tool: 'Bash', command: 'npm test' }),
    ])

    // Pause after 4s of work, sit idle for 60s, then resume: timer excludes the 60s pause
    await w.clock.advance(4000)
    await $.turn.complete({ answer: 'Which colour?', durationMs: 4000, isAborted: false, turnId: 'turn-1', reason: 'answer' })
    await w.clock.advance(60000)
    await $.turn.start({ text: 'Use blue', turnId: 'turn-2' })
    expect((await rows($, 'terminal')).join('\n')).toContain('Build my landing page · 4s')

    // Advance to the final step; if it reported < 100% and stopped to confirm, it pauses instead of auto-completing
    await $.tool.call({ tool: PROGRESS, task: 'Build the pricing section', percent: 100 })
    await $.tool.call({ tool: PROGRESS, task: 'Check the page', percent: 50 })
    await $.turn.complete({ answer: 'Confirm to publish.', durationMs: 1000, isAborted: false, turnId: 'turn-2', reason: 'answer' })
    const midFinal = (await rows($, 'terminal')).join('\n')
    expect(midFinal).toContain('■ Ended · Build my landing page · 2 of 3 steps done')
    expect(midFinal).toMatch(/‖ Check the page\s+█{5}░{5}\s+Paused/)

    // Resuming carries on with the same 3-step plan, and finishing completes it
    await $.turn.start({ text: 'publish', turnId: 'turn-3' })
    await step($)
    await $.tool.call({ tool: PROGRESS, task: 'Check the page', percent: 100 })
    await w.clock.advance(3000)
    await $.turn.complete({ answer: 'All done.', durationMs: 3000, isAborted: false, turnId: 'turn-3', reason: 'answer' })
    const finalTexts = (await rows($, 'terminal')).join('\n')
    expect(finalTexts).toContain('✓ All done · Build my landing page · took 7s')
    expect(finalTexts).toMatch(/✓ Check the page\s+█{10}\s+Done/)

    const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
    await pane.press({ key: 'clean-view-details-next' })
    await pane.press({ key: 'clean-view-details-next' })
    const logText = (await pane.findAll({ type: 'Text' })).map(one => one.text).join('\n')
    expect(logText).toContain('💭 Checking the branch.')
    await pane.unmount()
  })

  test('does not block tool calls after a plan exists and does not enforce the plan gate when toggled on mid-run', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await $.tool.call({ tool: PLAN, steps: ['Read your brand notes', 'Build the pricing section'] })
    for (let i = 0; i < 20; i++) expect((await $.tool.call(ls)).deny).toBeUndefined()

    // Starting a turn while Clean View is off does not enforce the plan gate if toggled on mid-turn
    await simple($, 'off')
    await $.turn.start({ text: 'Second task started while off', turnId: 'turn-2' })
    await simple($, 'on')
    expect((await $.tool.call(ls)).deny).toBeUndefined()
  })
})

describe('turning it off', () => {
  test('/simple off leaves only the button, and is remembered', async ($, on) => {
    world(on)
    await start($)
    await prompt($, 'Build my landing page')
    await simple($, 'off')
    const texts = await rows($, 'terminal')
    expect(texts.join('\n')).not.toContain('Understand your request')
    await start($)
    const ui = await $.ui.mount({ ...BAND(), surface: 'terminal' })
    expect((await ui.find({ key: 'clean-view-toggle' }))?.text).toContain('Clean View: OFF')
    await ui.press({ key: 'clean-view-toggle' })
    expect((await ui.find({ key: 'clean-view-toggle' }))?.text).toContain('Clean View: ON')
    await ui.unmount()
  })
})
