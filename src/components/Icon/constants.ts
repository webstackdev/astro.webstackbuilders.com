export const colorClasses = {
  default: 'text-content fill-content',
  muted: 'text-content-active fill-content-active',
  primary: 'text-primary fill-primary',
  'primary-inverse': 'text-primary-inverse fill-primary-inverse',
  accent: 'text-accent fill-accent',
  info: 'text-info fill-info',
  success: 'text-success fill-success',
  warning: 'text-warning fill-warning',
  danger: 'text-danger fill-danger',
  inherit: 'text-inherit fill-inherit',
  custom: '',
} as const

export type IconVariant = keyof typeof colorClasses
