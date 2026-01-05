export const colorClasses = {
  default: 'text-content fill-text',
  muted: 'text-text-offset fill-text-offset',
  primary: 'text-primary fill-primary',
  accent: 'text-accent fill-accent',
  info: 'text-info fill-info',
  success: 'text-success fill-success',
  warning: 'text-warning fill-warning',
  danger: 'text-danger fill-danger',
  inherit: 'text-inherit fill-inherit',
  custom: '',
} as const

export type IconVariant = keyof typeof colorClasses
