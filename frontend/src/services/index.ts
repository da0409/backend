import type { AppServices } from './contracts'
import { mockServices } from './mock'
import { createRestServices } from './rest'

export const isRestMode = import.meta.env.VITE_SERVICE_MODE !== 'mock'
export const services: AppServices = isRestMode ? createRestServices({
  baseUrl: import.meta.env.VITE_API_BASE_URL || '/v1',
  session: window.sessionStorage,
  local: window.localStorage,
  onUnauthorized: () => window.dispatchEvent(new Event('session-expired')),
}) : mockServices

export type { AppServices } from './contracts'
export * from './contracts'
