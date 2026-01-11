export type ButtonVariant = 'primary' | 'secondary' | 'twitter' | 'success' | 'warning' | 'spotlight' | 'icon'
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
  iconSize?: number | string
}

const ICON_ONLY_POSITION: IconPosition = 'only'

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
  'no-underline ' +
  'border-2 border-solid border-transparent rounded-md ' +
  'font-semibold uppercase tracking-[0.08em] ' +
  'text-sm leading-5 ' +
  '[box-shadow:var(--shadow-sm)] [text-shadow:var(--shadow-text)] ' +
  'transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-in-out ' +
  'disabled:cursor-not-allowed disabled:opacity-[0.65] disabled:pointer-events-none ' +
  'aria-disabled:cursor-not-allowed aria-disabled:opacity-[0.65] aria-disabled:pointer-events-none'

const sizeClasses: Record<ButtonSize, string> = {
  small: 'text-xs leading-4 py-2 px-4',
  medium: 'py-3 px-6',
  large: 'text-base leading-6 py-4 px-8',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-content ' +
    'hover:bg-primary-offset hover:[box-shadow:var(--shadow-hover)] hover:-translate-y-px ' +
    'focus-visible:bg-primary-offset focus-visible:[box-shadow:var(--shadow-hover)] focus-visible:-translate-y-px ' +
    'active:bg-primary-offset active:[box-shadow:var(--shadow-active)] active:translate-y-px',
  secondary:
    'bg-secondary text-content ' +
    'hover:bg-secondary-offset hover:[box-shadow:var(--shadow-hover)] hover:-translate-y-px ' +
    'focus-visible:bg-secondary-offset focus-visible:[box-shadow:var(--shadow-hover)] focus-visible:-translate-y-px ' +
    'active:bg-secondary-offset active:[box-shadow:var(--shadow-active)] active:translate-y-px',
  twitter: 'bg-x border-x text-content hover:bg-transparent hover:text-x focus-visible:bg-transparent focus-visible:text-x',
  success:
    'bg-success text-white ' +
    'hover:bg-success-offset hover:[box-shadow:var(--shadow-hover)] hover:-translate-y-px ' +
    'focus-visible:bg-success-offset focus-visible:[box-shadow:var(--shadow-hover)] focus-visible:-translate-y-px ' +
    'active:bg-success-offset active:[box-shadow:var(--shadow-active)] active:translate-y-px',
  warning:
    'bg-warning text-content ' +
    'hover:bg-warning-offset hover:[box-shadow:var(--shadow-hover)] hover:-translate-y-px ' +
    'focus-visible:bg-warning-offset focus-visible:[box-shadow:var(--shadow-hover)] focus-visible:-translate-y-px ' +
    'active:bg-warning-offset active:[box-shadow:var(--shadow-active)] active:translate-y-px',
  spotlight:
    'bg-spotlight text-black ' +
    'hover:bg-spotlight-offset hover:[box-shadow:var(--shadow-hover)] hover:-translate-y-px ' +
    'focus-visible:bg-spotlight-offset focus-visible:[box-shadow:var(--shadow-hover)] focus-visible:-translate-y-px ' +
    'active:bg-spotlight-offset active:[box-shadow:var(--shadow-active)] active:translate-y-px',
  icon:
    'aspect-square bg-transparent text-content p-2 ![box-shadow:none] ' +
    'hover:bg-page-base-offset hover:text-primary ' +
    'focus-visible:bg-page-base-offset focus-visible:text-primary ' +
    'active:bg-page-base-offset',
}

export interface ButtonClassOptions {
  variant?: ButtonVariant
  size?: ButtonSize
  additionalClasses?: string
}

export function buildButtonClassList({
  variant = 'primary',
  size = 'medium',
  additionalClasses,
}: ButtonClassOptions) {
  const classList: ClassList = {}

  addClassNames(classList, baseButtonClasses)
  addClassNames(classList, sizeClasses[size])
  addClassNames(classList, variantClasses[variant])

  if (additionalClasses?.trim()) {
    addClassNames(classList, additionalClasses)
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
