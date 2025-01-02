import { EngineOptions } from './engine'

export const defineConfig = (options: Partial<EngineOptions>): EngineOptions =>
  EngineOptions.withDefault(options)
