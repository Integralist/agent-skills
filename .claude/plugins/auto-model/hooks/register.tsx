import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { AutoModelLevel } from '../types'
import {
  CLASSIFIER_SYSTEM,
  availableLines,
  candidatesFor,
  clampEffort,
  clampEffortArgs,
  displayName,
  guessLevel,
  isShortReply,
  lineOf,
  parseLevel,
} from './logic'

const COMMAND = 'automodel'
const STORE_ON = 'isOn'
const STORE_PREVIOUS = 'previousModel'
const TOAST_MS = 10_000

const GOLD = '#F2C46D'
const SLATE = '#262B33'
const INK = '#0D1117'
const TEXT = '#E6EDF3'
const MUTED = '#7D8590'

const isOn = atom({ plugin: 'auto-model', key: 'isOn' } as const, false)
const pendingModel = atom({ plugin: 'auto-model', key: 'pendingModel' } as const, null)

type $ = EngineInterface

async function modelRow($: $) {
  return (await $.config.list()).find(row => row.key === 'model')
}

async function classify($: $, text: string, smallest: string): Promise<AutoModelLevel> {
  try {
    const reply = await $.model.complete({
      model: smallest,
      system: CLASSIFIER_SYSTEM,
      prompt: text,
      maxTokens: 8,
      timeoutMs: 4000,
    })
    return (reply.isAnswered ? parseLevel(reply.text) : undefined) ?? guessLevel(text)
  } catch {
    return guessLevel(text)
  }
}

/** Switches to the best line for `level` the plan accepts; quiet when already there. */
async function switchTo($: $, level: AutoModelLevel, current: string, lines: readonly string[]) {
  for (const line of candidatesFor(level, lines)) {
    if (lineOf(current) === line) return
    const set = await $.config.set({ key: 'model', value: line })
    if (set.deny !== undefined) continue
    const model = await $.session.model()
    await update($, pendingModel, () => model)
    $.ui.toast(`Auto Model: ${displayName(model)} (${level})`, { timeoutMs: TOAST_MS })
    return
  }
}

async function turnOn($: $): Promise<string> {
  if (await read($, isOn)) return 'Auto Model is already on.'
  const row = await modelRow($)
  await $.store.set(STORE_PREVIOUS, row?.value ?? null)
  await $.store.set(STORE_ON, true)
  await update($, isOn, () => true)
  return 'Auto Model is on. Each new prompt picks its model.'
}

/** Turns it off; `restore` puts back the model in use before it was turned on. */
async function turnOff($: $, restore: boolean): Promise<string> {
  if (!(await read($, isOn))) return 'Auto Model is already off.'
  await $.store.set(STORE_ON, false)
  await update($, isOn, () => false)
  await update($, pendingModel, () => null)
  const previous = await $.store.get(STORE_PREVIOUS)
  await $.store.delete(STORE_PREVIOUS)
  if (!restore || typeof previous !== 'string') return 'Auto Model is off.'
  let set = await $.config.set({ key: 'model', value: previous })
  const line = lineOf(previous)
  if (set.deny !== undefined && line !== undefined) {
    set = await $.config.set({ key: 'model', value: line })
  }
  return set.deny === undefined
    ? `Auto Model is off. Model is back to ${displayName(previous)}.`
    : `Auto Model is off. Could not restore ${previous}: ${set.deny}`
}

async function status($: $): Promise<string> {
  const on = await read($, isOn)
  const model = displayName(await $.session.model())
  const previous = await $.store.get(STORE_PREVIOUS)
  const before = on && typeof previous === 'string' ? ` It restores ${displayName(previous)} when turned off.` : ''
  return `Auto Model is ${on ? 'on' : 'off'}. Current model: ${model}.${before}`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    try {
      await update($, isOn, () => false)
      if ((await $.store.get(STORE_ON)) === true) await update($, isOn, () => true)
      await $.command.register({
        name: COMMAND,
        description: 'Auto Model: pick the model for each prompt (on, off, status)',
        argumentHint: 'on|off|status',
        immediate: true,
      })
    } catch (err) {
      $.ui.log(`auto-model: could not start: ${String(err)}`, { to: 'debug' })
    }
    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    try {
      const arg = e.args.trim().toLowerCase()
      if (arg === 'on') return { text: await turnOn($) }
      if (arg === 'off') return { text: await turnOff($, true) }
      if (arg === '' || arg === 'status') return { text: await status($) }
      return { text: 'Use /automodel on, /automodel off or /automodel status.' }
    } catch (err) {
      return { text: `Auto Model could not do that: ${String(err)}` }
    }
  }).catch(() => ({ text: 'Auto Model could not do that. Try again.' }))

  on('prompt.submit', async ($, e, next) => {
    try {
      const skip =
        !(await read($, isOn)) ||
        e.origin.kind !== 'composer' ||
        e.turnId !== undefined ||
        e.text.trimStart().startsWith('/') ||
        isShortReply(e.text)
      if (!skip) {
        const row = await modelRow($)
        const lines = availableLines(row?.options)
        if (lines.length > 0) {
          const level = await classify($, e.text, lines[0] ?? 'haiku')
          await switchTo($, level, await $.session.model(), lines)
        }
      }
    } catch (err) {
      $.ui.log(`auto-model: prompt.submit: ${String(err)}`, { to: 'debug' })
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // Picking a model by hand turns Auto Model off, so the two never fight.
  on('config.set', { key: 'model' }, async ($, e, next) => {
    try {
      if (e.origin.kind !== 'plugin' && (await read($, isOn))) await turnOff($, false)
    } catch (err) {
      $.ui.log(`auto-model: config.set: ${String(err)}`, { to: 'debug' })
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  on('command.run', { command: 'model' }, async ($, e, next) => {
    try {
      if (e.origin.kind !== 'plugin' && (await read($, isOn))) await turnOff($, false)
    } catch (err) {
      $.ui.log(`auto-model: /model: ${String(err)}`, { to: 'debug' })
    }
    return next(e)
  }).catch(($, e, next) => next(e))

  // Effort never goes above xhigh: `/effort max` is rewritten, and every
  // request (main loop and helper agents) is clamped on its way out.
  on('command.run', { command: 'effort' }, ($, e, next) =>
    next({ ...e, args: clampEffortArgs(e.args) }),
  ).catch(($, e, next) => next(e))

  on('turn.step', async function* ($, e, next) {
    let model = e.model
    if (e.agentId === undefined) {
      const pending = await read($, pendingModel)
      if (pending !== null) model = pending
    }
    return yield* next({ ...e, model, effort: clampEffort(e.effort) })
  })

  on('turn.complete', async ($, e, next) => {
    if (e.agentId === undefined) await update($, pendingModel, () => null)
    return next(e)
  })

  on('ui.render', { component: 'SessionMode' }, async ($, e, next) => {
    const enabled = await read($, isOn)
    const { Box, Text, Button } = $.ui.resolve(e)
    const columns = e.viewport?.columns ?? 80
    const state = enabled ? 'On' : 'Off'
    const label = columns < 60 ? `Auto: ${state}` : `Auto Model: ${state}`
    const modes = e.props.modes.join(' & ')
    return (
      <Box flexDirection="row">
        {modes !== '' && (
          <Text color={MUTED} wrap="truncate">
            {modes}{'  '}
          </Text>
        )}
        <Button
          key="auto-model-toggle"
          plain
          onPress={async () => {
            if (await read($, isOn)) await turnOff($, true)
            else await turnOn($)
          }}
        >
          <Text backgroundColor={enabled ? GOLD : SLATE} color={enabled ? INK : TEXT} bold={enabled}>
            {` ${label} `}
          </Text>
        </Button>
      </Box>
    )
  })
}
