import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Timer } from 'claude-code'

import type { CleanViewChecklist, CleanViewTask } from '../types'
import {
  EMPTY,
  METER_CELLS,
  addTask,
  clampPercent,
  duration,
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
  updateTask,
} from './logic'

const PLUGIN = 'clean-view'
const COMMAND = 'simple'
const STORE_KEY = 'cleanViewEnabled'
const PLAN_TOOL = `mcp__${PLUGIN}__plan_steps`
const PROGRESS_TOOL = `mcp__${PLUGIN}__report_progress`
const FRAME_MS = 250
const COLLAPSE_MS = 5000
const FAILURES_TO_STUCK = 3
const PLACEHOLDER_TITLE = 'Your request'
const ALWAYS_ALLOWED = new Set(['ToolSearch', 'TodoWrite', 'TaskCreate', 'TaskUpdate', 'AskUserQuestion', PLAN_TOOL, PROGRESS_TOOL])

const NEEDS_OK = 'Claude needs your OK to continue'
const HAS_QUESTION = 'Claude has a question for you'
const WAITING = 'Claude is waiting for your reply'
const SAID_NO = 'you said no to a step, so Claude paused'
const KEEPS_FAILING = 'a step keeps failing, Claude is trying another way'
const REFUSED = "Claude couldn't help with that request"

const enabled = atom({ plugin: 'clean-view', key: 'cleanViewEnabled' } as const, true)
const checklist = atom({ plugin: 'clean-view', key: 'checklist' } as const, EMPTY)
const tick = atom({ plugin: 'clean-view', key: 'tick' } as const, 0)

const SECTION = `# Clean View checklist

The person sees a plain checklist of your plan instead of your tool calls.

- For every request, even a quick question, call \`${PLAN_TOOL}\` first with every step of the job, 2 to 8 short names in order. Load it with ToolSearch if it is deferred. If this session has TodoWrite or TaskCreate, you may use your to-do list as the plan instead.
- Call \`${PROGRESS_TOOL}\` as real progress happens, and with percent 100 the moment a step finishes.
- Write every step name in plain English a non-technical person understands, under 40 characters, starting with a verb, like "Build the pricing section".
- Never put file paths, file names, commands, code or tool names in a step name.`

type $ = EngineInterface

let ticker: Timer | undefined
let failures = 0
let isNextTurnCommand = false

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

async function setEnabled($: $, value: boolean) {
  await update($, enabled, () => value)
  await $.store.set(STORE_KEY, value)
  $.ui.toast(value ? 'Clean View on: showing the plan, hiding the technical details' : 'Clean View off: showing everything')
}

/** Asks Haiku for a short name for the job; drops the answer if a newer job started. */
async function nameJob($: $, text: string, startedAt: number) {
  const reply = await $.model.complete({
    model: 'haiku',
    effort: 'low',
    maxTokens: 20,
    timeoutMs: 8000,
    system: 'You name jobs for a non-technical person. Reply with the name only: 2 to 6 plain words, starting with a verb. No code, file names or punctuation.',
    prompt: text.slice(0, 2000),
  })
  if (!reply.isAnswered) return
  const words = reply.text.replace(/["'.`*]/g, '').trim().split(/\s+/).slice(0, 6).join(' ')
  if (words === '') return
  const title = words[0].toUpperCase() + words.slice(1)
  await edit($, list => (list.startedAt === startedAt ? { ...list, title } : list))
}

async function startJob($: $, text: string) {
  const startedAt = await $.clock.now()
  failures = 0
  await edit($, () => newJob(startedAt, PLACEHOLDER_TITLE))
  startTicker($)
  if (text !== '') void nameJob($, text, startedAt).catch(() => undefined)
}

/** Starts a job for a plan that arrives while none runs (a skill, a slash command). */
async function ensureJob($: $) {
  if (!isRunning(await read($, checklist))) await startJob($, '')
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
  await edit($, list => (list.phase === 'idle' ? list : fn({ ...list, finishedAt: now }, now)))
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
        'Lay out every step of the job up front so the person sees the plan: 2 to 8 short plain-English step names in order, each under 40 characters and starting with a verb. The first step starts right away.',
      inputSchema: {
        type: 'object',
        properties: { steps: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 8 } },
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
    // A slash command's output would sit under a stale band; clear one left waiting.
    if (isNextTurnCommand) await edit($, list => (list.phase === 'working' ? list : { ...list, phase: 'idle' }))
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      const isCommand = isNextTurnCommand
      isNextTurnCommand = false
      if (!isCommand && e.text.trim() !== '') await startJob($, e.text)
    }
    return next(e)
  })

  on('tool.call', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    const tool = String(e.tool)
    const list = await read($, checklist)
    const isEnabled = await isOn($)
    if (isEnabled && isRunning(list) && !hasPlan(list) && !ALWAYS_ALLOWED.has(tool)) {
      return { deny: `Clean View: call ${PLAN_TOOL} first to lay out the steps of this job (load it with ToolSearch if it is deferred), then try again.` }
    }

    await edit($, backToWork)
    if (e.tool === 'TodoWrite') await edit($, current => fromTodos(current, e.todos))
    if (e.tool === 'TaskUpdate') await edit($, current => updateTask(current, e.taskId, e.status, e.subject))
    if (e.tool === 'AskUserQuestion') await edit($, needsYou(HAS_QUESTION))

    const ran = await next(e)

    await edit($, backToWork)
    if (e.tool === 'TaskCreate' && ran.deny === undefined && ran.isError !== true) {
      const made = ran.result as { task?: { id?: string; subject?: string } } | undefined
      if (made?.task?.id !== undefined) await edit($, current => addTask(current, made.task!.id!, made.task!.subject ?? e.subject))
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

  // A permission dialog is about to open. classic.Notification says the same,
  // but does not reach a mod where an organization manages Claude Code.
  on('tool.check', async ($, e, next) => {
    const verdict = await next(e)
    if (verdict.decision === 'ask' && e.agentId === undefined && e.tool_use_id !== undefined) await edit($, needsYou(NEEDS_OK))
    return verdict
  }).catch(($, e, next) => next(e))

  on('tool.call', { tool: PLAN_TOOL }, async ($, e) => {
    const steps = (e as { steps?: unknown }).steps
    const names = Array.isArray(steps) ? steps.filter((s): s is string => typeof s === 'string') : []
    await ensureJob($)
    await edit($, list => planSteps(list, names))
    const count = (await read($, checklist)).tasks.length
    return { result: `Planned ${count} steps. The first one has started.` }
  })

  on('tool.call', { tool: PROGRESS_TOOL }, async ($, e) => {
    const input = e as { task?: unknown; percent?: unknown }
    const name = typeof input.task === 'string' ? input.task : ''
    const percent = typeof input.percent === 'number' ? input.percent : Number(input.percent)
    await ensureJob($)
    await edit($, list => reportProgress(list, name, percent))
    return { result: `Progress noted: ${clampPercent(percent)}%.` }
  })

  on('classic.Notification', async ($, e, next) => {
    if (e.notification_type === 'permission_prompt') await edit($, needsYou(NEEDS_OK))
    if (e.notification_type === 'elicitation_dialog') await edit($, needsYou(HAS_QUESTION))
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.complete', async ($, e, next) => {
    if (e.agentId !== undefined) return next(e)
    if (e.reason === 'error') {
      await finish($, list => ({ ...list, phase: 'stuck', stuckReason: errorSentence(e.answer), needsYouReason: null }))
    } else if (e.reason === 'refusal') {
      await finish($, list => ({ ...list, phase: 'stuck', stuckReason: REFUSED, needsYouReason: null }))
    } else if (e.reason === 'aborted') {
      await finish($, list => ({ ...list, phase: 'stopped', needsYouReason: null }))
    } else {
      await finish($, list => {
        if (list.phase === 'stuck') return list
        // No plan means no tools ran (the plan gate): a plain reply, nothing to track.
        if (!hasPlan(list)) return { ...list, phase: 'idle', needsYouReason: null }
        if (list.tasks.some(one => one.status !== 'done')) return { ...list, phase: 'needsYou', needsYouReason: WAITING }
        return { ...list, phase: 'done', needsYouReason: null }
      })
      const done = await read($, checklist)
      if (done.phase === 'done') {
        $.clock.after(COLLAPSE_MS, () => {
          void edit($, list => (list.startedAt === done.startedAt && list.phase === 'done' ? { ...list, isCollapsed: true } : list))
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

    if (list.phase === 'done' && list.isCollapsed) {
      return (
        <Box flexDirection="row" justifyContent="space-between">
          {header}
          {button}
        </Box>
      )
    }

    // icon + space, name, space, 10-cell meter, two spaces, 7-cell label
    const nameWidth = Math.max(8, e.props.bodyColumns - (2 + 1 + METER_CELLS + 2 + 7))
    const firstUpcoming = list.tasks.findIndex(one => one.status === 'upcoming')
    return (
      <Box flexDirection="column">
        <Box flexDirection="row" justifyContent="space-between">
          {header}
          {button}
        </Box>
        {list.tasks.map((one, i) => row(one, i === firstUpcoming, list.phase === 'needsYou', frame, nameWidth, Text))}
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
    case 'done':
      return (
        <Text>
          <Text color="green">✓ All done</Text> · {list.title} · took {took}
        </Text>
      )
    default:
      return (
        <Text>
          <Text bold>{list.title}</Text> · {took}
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
