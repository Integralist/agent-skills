export type AutoModelLevel = 'small' | 'everyday' | 'strong' | 'strongest'

declare module 'claude-code' {
  interface PluginState {
    'auto-model': {
      isOn: boolean
      pendingModel: string | null
    }
  }
}
