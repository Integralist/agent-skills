export type AutoModelLevel = 'trivial' | 'moderate' | 'complex' | 'frontier'

declare module 'claude-code' {
  interface PluginState {
    'auto-model': {
      isOn: boolean
      pendingModel: string | null
      lastTurnAt: number | null
      hasRoutedTier: boolean
    }
  }
}
