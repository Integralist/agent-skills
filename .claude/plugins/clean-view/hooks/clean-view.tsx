import { atom, read, update } from 'claude-code'
import type { EngineInterface, On, Timer } from 'claude-code'

import type { CleanViewActivity, CleanViewChecklist, CleanViewTask } from '../types'
import {
  EMPTY,
  METER_CELLS,
  addTask,
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
// Tool calls the checklist may sit unchanged through before the next one is sent back.
const QUIET_CALLS = 8
const PLACEHOLDER_TITLE = 'Your request'
const ALWAYS_ALLOWED = new Set(['ToolSearch', 'TodoWrite', 'TaskCreate', 'TaskUpdate', 'AskUserQuestion', PLAN_TOOL, PROGRESS_TOOL])
// Tools that change the checklist, so a call to one restarts the quiet-call count.
const PLAN_UPDATERS = new Set([PLAN_TOOL, PROGRESS_TOOL, 'TodoWrite', 'TaskCreate', 'TaskUpdate'])

const NEEDS_OK = 'Claude needs your OK to continue'
const HAS_QUESTION = 'Claude has a question for you'
const WAITING = 'Claude is waiting for your reply'
const ASKED = 'Claude asked you a question above'
// Phases where a plan was left part way; its active step draws as Paused.
const PAUSED = new Set(['needsYou', 'stopped', 'waiting', 'ended'])
// An agent in one of these is still at work and will report back on its own.
const AGENT_AT_WORK = new Set(['pending', 'running', 'waiting'])
const SAID_NO = 'you said no to a step, so Claude paused'
const KEEPS_FAILING = 'a step keeps failing, Claude is trying another way'
const REFUSED = "Claude couldn't help with that request"

const enabled = atom({ plugin: 'clean-view', key: 'cleanViewEnabled' } as const, true)
const checklist = atom({ plugin: 'clean-view', key: 'checklist' } as const, EMPTY)
const selectedTaskId = atom({ plugin: 'clean-view', key: 'selectedTaskId' } as const, null as string | null)
const tick = atom({ plugin: 'clean-view', key: 'tick' } as const, 0)

const SECTION = `# Clean View checklist

The person sees a plain checklist of your plan instead of your tool calls.

- For every request, even a quick question, call \`${PLAN_TOOL}\` first with every step of the job, 2 to 8 short names in order. Load it with ToolSearch if it is deferred. If this session has TodoWrite or TaskCreate, you may use your to-do list as the plan instead.
- Call \`${PROGRESS_TOOL}\` as real progress happens, and with percent 100 the moment a step finishes.
- If the job grows past your plan (extra checks, cleanup, undoing changes, a new kind of work), call \`${PLAN_TOOL}\` again with the full updated list before you do it. Keep finished step names the same so they stay checked off.
- Write every step name in plain English a non-technical person understands, under 40 characters, starting with a verb, like "Build the pricing section".
- Never put file paths, file names, commands, code or tool names in a step name.`

type $ = EngineInterface

let ticker: Timer | undefined
let failures = 0
let quietCalls = 0
let isNextTurnCommand = false
// The next turn is a background agent reporting back, not a new request.
let isNextTurnReport = false
// The session's permission mode, as the last classic hook carried it; unknown until one does.
let permissionMode: string | undefined

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

async function toggleTaskInspector($: $, taskId: string | null) {
  await update($, selectedTaskId, current => (current === taskId ? null : taskId))
}

function toolActivity(tool: string, finished = false): string {
  switch (tool.toLowerCase()) {
    case 'bash': return finished ? 'Finished running a command' : 'Running a command'
    case 'read': return finished ? 'Finished reading files' : 'Reading files'
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
  await update($, selectedTaskId, () => null)
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
        'Lay out every step of the job up front so the person sees the plan: 2 to 8 short plain-English step names in order, each under 40 characters and starting with a verb. The first step starts right away. If the job grows past the plan, call it again with the full updated list and keep finished step names unchanged.',
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
    isNextTurnReport = e.origin.kind === 'task-notification' && e.turnId === undefined
    // A slash command's output would sit under a stale band; clear one left waiting.
    if (isNextTurnCommand) await edit($, list => (list.phase === 'working' ? list : { ...list, phase: 'idle' }))
    return next(e)
  }).catch(($, e, next) => next(e))

  on('turn.start', async ($, e, next) => {
    if (e.agentId === undefined) {
      const isCommand = isNextTurnCommand
      const isReport = isNextTurnReport
      isNextTurnCommand = false
      isNextTurnReport = false
      quietCalls = 0
      const list = await read($, checklist)
      // A plan left part way (Esc, a pause, a question, background work) carries on:
      // a typed prompt is usually a re-steer, and a report is the work coming back.
      const isPaused = PAUSED.has(list.phase) && hasPlan(list)
      const resumes = isReport ? list.phase === 'waiting' : !isCommand && e.text.trim() !== '' && isPaused
      if (resumes) {
        await edit($, current => ({ ...current, phase: 'working', finishedAt: null, needsYouReason: null, waitingOn: undefined }))
        startTicker($)
      } else if (!isCommand && e.text.trim() !== '') {
        await startJob($, e.text)
      }
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

    // Work the checklist doesn't show: after QUIET_CALLS calls with no plan or progress update, send one back.
    if (PLAN_UPDATERS.has(tool)) {
      quietCalls = 0
    } else if (isEnabled && isRunning(list) && hasPlan(list) && !ALWAYS_ALLOWED.has(tool) && ++quietCalls > QUIET_CALLS) {
      quietCalls = 0
      return {
        deny: `Clean View: the checklist hasn't changed in ${QUIET_CALLS} tool calls. If the work has grown past these steps, call ${PLAN_TOOL} with the full updated list; otherwise call ${PROGRESS_TOOL} for the current step. Then try again.`,
      }
    }

    await edit($, backToWork)
    if (!PLAN_UPDATERS.has(tool)) {
      await recordActivity($, tool === 'AskUserQuestion' ? 'Waiting for your answer' : toolActivity(tool), tool !== 'AskUserQuestion')
    }
    if (e.tool === 'TodoWrite') {
      const at = await $.clock.now()
      await edit($, current => ({ ...fromTodos(current, e.todos), activity: { summary: 'Task list updated', at, inProgress: false } }))
    }
    if (e.tool === 'TaskUpdate') {
      const at = await $.clock.now()
      await edit($, current => ({ ...updateTask(current, e.taskId, e.status, e.subject), activity: { summary: 'Task list updated', at, inProgress: false } }))
    }
    if (e.tool === 'AskUserQuestion') await edit($, needsYou(HAS_QUESTION))

    const ran = await next(e)

    await edit($, backToWork)
    if (tool === 'AskUserQuestion' && ran.deny === undefined) await recordActivity($, 'Answer received', false)
    if (!PLAN_UPDATERS.has(tool) && tool !== 'AskUserQuestion') {
      const summary = ran.isError === true ? 'A tool call failed' : toolActivity(tool, true)
      await recordActivity($, summary, false)
    }
    if (e.tool === 'TaskCreate' && ran.deny === undefined && ran.isError !== true) {
      const made = ran.result as { task?: { id?: string; subject?: string } } | undefined
      if (made?.task?.id !== undefined) {
        const at = await $.clock.now()
        await edit($, current => ({ ...addTask(current, made.task!.id!, made.task!.subject ?? e.subject), activity: { summary: 'Task list updated', at, inProgress: false } }))
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

  on('tool.call', { tool: PLAN_TOOL }, async ($, e) => {
    const steps = (e as { steps?: unknown }).steps
    const names = Array.isArray(steps) ? steps.filter((s): s is string => typeof s === 'string') : []
    await ensureJob($)
    const at = await $.clock.now()
    await edit($, list => ({ ...planSteps(list, names), activity: { summary: 'Plan updated', at, inProgress: false } }))
    await update($, selectedTaskId, () => null)
    const count = (await read($, checklist)).tasks.length
    return { result: `Planned ${count} steps. The first one has started.` }
  })

  on('tool.call', { tool: PROGRESS_TOOL }, async ($, e) => {
    const input = e as { task?: unknown; percent?: unknown }
    const name = typeof input.task === 'string' ? input.task : ''
    const percent = typeof input.percent === 'number' ? input.percent : Number(input.percent)
    await ensureJob($)
    const at = await $.clock.now()
    await edit($, list => ({ ...reportProgress(list, name, percent), activity: { summary: 'Progress reported', at, inProgress: false } }))
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
    const selectedId = await read($, selectedTaskId)
    const selectedTask = list.tasks.find(one => one.id === selectedId)
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
    const selectedIndex = selectedTask ? list.tasks.indexOf(selectedTask) : -1
    const selectedStatus = selectedTask ? label(selectedTask, selectedIndex === firstUpcoming, PAUSED.has(list.phase)) : ''
    const lastActivity = list.activity
      ? `${list.activity.summary} · ${list.activity.inProgress ? `for ${duration(now - list.activity.at)}` : `${duration(now - list.activity.at)} ago`}`
      : 'No visible activity recorded yet'
    const inspector = selectedTask ? (
      <Box key="clean-view-task-details" flexDirection="column" marginTop={1}>
        <Text bold>Task details · {selectedTask.name}</Text>
        <Text>Status: {selectedStatus} · Progress: {selectedTask.status === 'done' ? 'Complete' : selectedTask.hasReported ? `${selectedTask.percent}% reported` : 'No percentage reported yet'}</Text>
        <Text>Run elapsed: {took}</Text>
        <Text>Last visible activity: {lastActivity}</Text>
        <Text>Press Esc to stop the entire run; remaining tasks will not continue.</Text>
        <Button key="clean-view-task-details-close" label="Close details" onPress={() => void toggleTaskInspector($, selectedTask.id)} />
      </Box>
    ) : null

    // A blank line above the band keeps it clear of the spinner line.
    if ((list.phase === 'done' || list.phase === 'ended') && list.isCollapsed && !inspector) {
      return (
        <Box key="clean-view-band" marginTop={1} flexDirection="row" justifyContent="space-between">
          {header}
          {button}
        </Box>
      )
    }

    // icon + space, name, space, 10-cell meter, two spaces, 7-cell label
    const nameWidth = Math.max(8, e.props.bodyColumns - (2 + 1 + METER_CELLS + 2 + 7 + 8))
    return (
      <Box key="clean-view-band" marginTop={1} flexDirection="column">
        <Box key="clean-view-header" flexDirection="row" justifyContent="space-between" marginBottom={1}>
          {header}
          {button}
        </Box>
        {list.tasks.map((one, i) => (
          <Box key={`clean-view-task-row-${one.id}`} flexDirection="row" justifyContent="space-between">
            {row(one, i === firstUpcoming, PAUSED.has(list.phase), frame, nameWidth, Text)}
            <Button
              key={`clean-view-task-inspect-${one.id}`}
              label={selectedTask?.id === one.id ? 'Hide' : 'Details'}
              onPress={() => void toggleTaskInspector($, one.id)}
            />
          </Box>
        ))}
        {inspector}
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
