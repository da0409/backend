// src/services/contracts/errors.ts
// 依据 docs/API.md 第 6 节定义结构化错误。
// 所有 Api 在失败时抛出 ApiError，页面按 code / field 展示。

import type { ApiError, ApiErrorCode } from './types'

export function createApiError(
  code: ApiErrorCode,
  message: string,
  field?: string,
  retryable: boolean = false,
): ApiError {
  return { code, message, field, retryable }
}

export function isApiError(value: unknown): value is ApiError {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.code === 'string' &&
    typeof v.message === 'string' &&
    typeof v.retryable === 'boolean'
  )
}

/** 常用错误快捷构造 */

export function validationError(message: string, field?: string): ApiError {
  return createApiError('VALIDATION_ERROR', message, field, false)
}

export function notFoundError(message: string, field?: string): ApiError {
  return createApiError('NOT_FOUND', message, field, false)
}

export function forbiddenError(message: string, field?: string): ApiError {
  return createApiError('FORBIDDEN', message, field, false)
}

export function conflictError(message: string, field?: string): ApiError {
  return createApiError('CONFLICT', message, field, false)
}

export function storageError(message: string, field?: string): ApiError {
  return createApiError('STORAGE_ERROR', message, field, true)
}

export function unsupportedImageError(message: string, field?: string): ApiError {
  return createApiError('UNSUPPORTED_IMAGE', message, field, false)
}

export function imageTooLargeError(message: string, field?: string): ApiError {
  return createApiError('IMAGE_TOO_LARGE', message, field, false)
}

export function unknownError(message: string, field?: string): ApiError {
  return createApiError('UNKNOWN_ERROR', message, field, false)
}