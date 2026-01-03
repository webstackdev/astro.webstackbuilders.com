import { z } from 'astro/zod'
import type {
  ContactTimeline,
  RequiredStringOptions,
 } from '@actions/contact/@types'
import { isAllowedTimeline } from './responder'

export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, char => map[char] || char)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function parseBoolean(value: FormDataEntryValue | null): boolean {
  if (value === null) return false
  if (typeof value === 'string') return value === 'true'
  return false
}

export function readString(form: FormData, key: string): string {
  const value = form.get(key)
  return typeof value === 'string' ? value : ''
}

export const trimString = (value: unknown): unknown => (typeof value === 'string' ? value.trim() : value)

export const emptyStringToUndefined = (value: unknown): unknown => {
  if (value === null) return undefined
  if (typeof value !== 'string') return value
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

export const optionalTrimmedString = (maxLength?: number) => {
  const base = z.string()
  const limited = typeof maxLength === 'number' ? base.max(maxLength) : base
  return z.preprocess(emptyStringToUndefined, limited.optional())
}

export const requiredString = (options: RequiredStringOptions) => {
  return z.preprocess(
    emptyStringToUndefined,
    z
      .string({
        required_error: options.required_error,
        invalid_type_error: options.invalid_type_error,
      })
      .min(options.min.value, { message: options.min.message })
      .max(options.max.value, { message: options.max.message })
  )
}

export const isFile = (value: unknown): value is File => typeof File !== 'undefined' && value instanceof File


export const optionalFile = () => z.custom<File>(isFile).optional()

export const contactTimelineSchema = z.preprocess(
  emptyStringToUndefined,
  z
    .custom<ContactTimeline>(
      (value): value is ContactTimeline => typeof value === 'string' && isAllowedTimeline(value),
      { message: 'Invalid project timeline' }
    )
    .optional()
)

export const spamPatterns = ['viagra', 'cialis', 'casino', 'poker', 'lottery']

export const containsSpam = (text: string): boolean => {
  const normalized = text.toLowerCase()
  return spamPatterns.some(pattern => normalized.includes(pattern))
}
