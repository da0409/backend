import { createApiError } from '../contracts'

export interface RestOptions {
  baseUrl?: string
  fetcher?: typeof fetch
  session: Storage
  local: Storage
  onUnauthorized?: () => void
}

export function createClient(options: RestOptions) {
  const base = (options.baseUrl || '/v1').replace(/\/$/, '')
  const fetcher = options.fetcher || fetch
  const tokenKey = 'timecapsule.rest.token'
  function token() { return options.session.getItem(tokenKey) }
  function setToken(value?: string) {
    if (value) options.session.setItem(tokenKey, value)
    else options.session.removeItem(tokenKey)
  }
  async function send(path: string, init: RequestInit = {}) {
    const headers = new Headers(init.headers)
    if (token()) headers.set('Authorization', 'Bearer ' + token())
    if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json')
    let response: Response
    try { response = await fetcher(base + path, { ...init, headers, signal: AbortSignal.timeout(30000) }) }
    catch { throw createApiError('NETWORK_ERROR', '无法连接服务，请确认后端已启动后重试', undefined, true) }
    if (!response.ok) {
      const body = await response.json().catch(() => ({})) as { msg?: string }
      if (response.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/register')) {
        setToken()
        options.onUnauthorized?.()
      }
      const code = response.status === 401 || response.status === 403 ? 'FORBIDDEN'
        : response.status === 404 ? 'NOT_FOUND' : response.status === 409 ? 'CONFLICT'
        : response.status === 413 ? 'IMAGE_TOO_LARGE'
        : response.status === 400 || response.status === 422 ? 'VALIDATION_ERROR' : 'UNKNOWN_ERROR'
      throw createApiError(code, body.msg || '请求失败，请稍后重试', undefined, response.status >= 500)
    }
    return response
  }
  async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    const response = await send(path, { method, body: body === undefined ? undefined : JSON.stringify(body) })
    const envelope = await response.json() as { code: number; msg: string; data: T }
    if (envelope.code !== 1) throw createApiError('UNKNOWN_ERROR', envelope.msg || '服务响应异常')
    return envelope.data
  }
  async function all<T>(path: string): Promise<T[]> {
    const result: T[] = []
    for (let page = 1; ; page++) {
      const data = await request<{ total: number; rows: T[] }>(path + (path.includes('?') ? '&' : '?') + 'page=' + page + '&pageSize=100')
      result.push(...data.rows)
      if (result.length >= data.total) return result
      if (!data.rows.length || page >= 1000) throw createApiError('UNKNOWN_ERROR', '列表分页异常，请重试')
    }
  }
  return { token, setToken, send, request, all }
}
