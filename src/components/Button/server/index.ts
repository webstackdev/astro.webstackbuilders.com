export type ButtonVariant =
  | 'danger'
  | 'note'
  | 'primary'
  | 'secondary'
  | 'twitter'
  | 'success'
  | 'info'
  | 'warning'
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonType = 'button' | 'submit' | 'reset'
export type IconPosition = 'left' | 'right' | 'only'

export interface ButtonProps {
  text?: string
  variant?: ButtonVariant
  size?: ButtonSize
  type?: ButtonType
  disabled?: boolean
  class?: string
  id?: string
  ariaLabel?: string
  onClick?: string
  href?: string
  icon?: string
  iconPosition?: IconPosition
  iconSize?: number
  [key: `data-${string}`]: string | number | boolean | undefined
}

const ICON_ONLY_POSITION: IconPosition = 'only'
const iconOnlyClasses = 'aspect-square p-2'

type ClassList = Record<string, boolean>

function addClassNames(classList: ClassList, classNames: string) {
  classNames
    .split(/\s+/)
    .filter(Boolean)
    .forEach(className => {
      classList[className] = true
    })
}

const baseButtonClasses =
  'inline-flex items-center justify-center text-center align-middle whitespace-nowrap select-none ' +
  'no-underline hover:no-underline focus:no-underline focus-visible:no-underline decoration-transparent ' +
  'relative focus-visible:outline-none ' +
  "after:pointer-events-none after:absolute after:content-[''] after:inset-0 after:rounded-none after:border-2 after:border-transparent after:opacity-0 after:transition-opacity after:duration-150 after:ease-out " +
  'focus-visible:after:opacity-100 focus-visible:after:[inset:-6px] focus-visible:after:border-spotlight ' +
  'border-2 border-solid border-transparent rounded-md ' +
  'font-bold uppercase tracking-[0.08em] ' +
  'text-sm leading-5 ' +
  'transition-[color,background-color,border-color] duration-200 ease-in-out ' +
  'disabled:cursor-not-allowed disabled:opacity-[0.65] disabled:pointer-events-none ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-[0.65] aria-disabled:pointer-events-none'

const sizeClasses: Record<ButtonSize, string> = {
  small:
    'text-xs leading-4 py-1.5 px-3 sm:py-2 sm:px-4',
  medium:
    'text-xs leading-4 py-1.5 px-4 sm:py-3 sm:px-6 lg:px-5',
  large:
    'text-sm sm:text-base leading-5 sm:leading-6 py-3 px-7 sm:py-4 sm:px-8',
}

const variantClasses: Record<ButtonVariant, string> = {
  danger:
    'bg-danger text-white ' +
    'hover:bg-danger-offset ' +
    'focus-visible:bg-danger-offset ' +
    'active:bg-danger-offset',
  info:
    'bg-info text-white ' +
    'hover:bg-info-offset ' +
    'focus-visible:bg-info-offset ' +
    'active:bg-info-offset',
  note:
    'bg-note text-white ' +
    'hover:bg-note-offset ' +
    'focus-visible:bg-note-offset ' +
    'active:bg-note-offset',
  primary:
    'bg-primary text-primary-inverse ' +
    'hover:bg-primary-offset ' +
    'focus-visible:bg-primary-offset ' +
    'active:bg-primary-offset',
  secondary:
    'bg-secondary text-secondary-inverse ' +
    'hover:bg-secondary-offset ' +
    'focus-visible:bg-secondary-offset ' +
    'active:bg-secondary-offset',
  success:
    'bg-success text-white ' +
    'hover:bg-success-offset ' +
    'focus-visible:bg-success-offset ' +
    'active:bg-success-offset',
  twitter:
    'bg-x border-x text-white ' +
    'hover:bg-transparent hover:text-x ' +
    'focus-visible:bg-transparent ' +
    'focus-visible:text-x',
  warning:
    'bg-warning-offset text-white ' +
    'hover:bg-warning ' +
    'focus-visible:bg-warning ' +
    'active:bg-warning',
  }

export interface ButtonClassOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  additionalClasses?: string
  icon?: string
  iconPosition?: IconPosition
  text?: string
}

export function buildButtonClassList({
  variant = 'primary',
  size = 'medium',
  additionalClasses,
  icon,
  iconPosition,
  text,
}: ButtonClassOptions) {
  const classList: ClassList = {}
  const selectedVariant = variant as string

  if (!(selectedVariant in variantClasses)) {
    throw new Error(`Button: unsupported variant '${selectedVariant}'`)
  }

  addClassNames(classList, baseButtonClasses)
  addClassNames(classList, sizeClasses[size])
  addClassNames(classList, variantClasses[selectedVariant as ButtonVariant])

  if (additionalClasses?.trim()) {
    addClassNames(classList, additionalClasses)
  }

  if (icon && iconPosition === ICON_ONLY_POSITION && !text) {
    addClassNames(classList, iconOnlyClasses)
  }

  return classList
}

export interface ButtonLabelOptions {
  text?: string
  ariaLabel?: string
  icon?: string
  iconPosition?: IconPosition
}

export function isIconOnly({ icon, iconPosition, text }: ButtonLabelOptions) {
  return Boolean(icon && iconPosition === ICON_ONLY_POSITION && !text)
}

export function resolveAriaLabel({ text, ariaLabel, icon, iconPosition }: ButtonLabelOptions) {
  if (ariaLabel) {
    return ariaLabel
  }

  if (text) {
    return undefined
  }

  if (icon && iconPosition === ICON_ONLY_POSITION) {
    throw new Error('Button: icon-only buttons must provide ariaLabel')
  }

  return undefined
}
