export type CleanViewTaskStatus = 'done' | 'active' | 'upcoming'

export type CleanViewActivity = {
  summary: string
  at: number
  inProgress: boolean
}

export type CleanViewTask = {
  id: string
  name: string
  status: CleanViewTaskStatus
  percent: number
  hasReported: boolean
}

export type CleanViewPhase = 'idle' | 'working' | 'needsYou' | 'stuck' | 'stopped' | 'waiting' | 'ended' | 'done'

export type CleanViewChecklist = {
  title: string
  phase: CleanViewPhase
  tasks: CleanViewTask[]
  activity: CleanViewActivity | null
  needsYouReason: string | null
  stuckReason: string | null
  startedAt: number
  finishedAt: number | null
  isCollapsed: boolean
  /** Background agents still at work when the turn ended (phase `waiting`). */
  waitingOn?: number
}

declare module 'claude-code' {
  interface PluginState {
    'clean-view': {
      cleanViewEnabled: boolean
      checklist: CleanViewChecklist
      selectedTaskId: string | null
      tick: number
    }
  }
}
