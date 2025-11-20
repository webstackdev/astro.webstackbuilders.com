import type { SpriteName } from '@components/Sprite/sprites'

export type ButtonVariant = 'primary' | 'secondary' | 'twitter' | 'success' | 'warning' | 'icon'
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
  icon?: SpriteName
  iconPosition?: IconPosition
  iconSize?: number | string
}

export interface ButtonStyleModule {
  button: string
  sizeSmall: string
  sizeMedium: string
  sizeLarge: string
  variantPrimary: string
  variantSecondary: string
  variantTwitter: string
  variantSuccess: string
  variantWarning: string
  variantIcon: string
}

const sizeClassLookup: Record<ButtonSize, keyof ButtonStyleModule> = {
  small: 'sizeSmall',
  medium: 'sizeMedium',
  large: 'sizeLarge',
}

const variantClassLookup: Record<ButtonVariant, keyof ButtonStyleModule> = {
  primary: 'variantPrimary',
  secondary: 'variantSecondary',
  twitter: 'variantTwitter',
  success: 'variantSuccess',
  warning: 'variantWarning',
  icon: 'variantIcon',
}

const ICON_ONLY_POSITION: IconPosition = 'only'

export interface ButtonClassOptions {
  styles: ButtonStyleModule
  variant?: ButtonVariant
  size?: ButtonSize
  additionalClasses?: string
}

export function buildButtonClassList({
  styles,
  variant = 'primary',
  size = 'medium',
  additionalClasses,
}: ButtonClassOptions): Record<string, boolean> {
  const classes: Record<string, boolean> = {
    [styles.button]: true,
    [styles[sizeClassLookup[size]]]: true,
    [styles[variantClassLookup[variant]]]: true,
  }

  if (additionalClasses?.trim()) {
    additionalClasses
      .split(/\s+/)
      .filter(Boolean)
      .forEach((className) => {
        classes[className] = true
      })
  }

  return classes
}

export interface ButtonLabelOptions {
  text?: string
  ariaLabel?: string
  icon?: SpriteName
  iconPosition?: IconPosition
}

export function isIconOnly({ icon, iconPosition, text }: ButtonLabelOptions): boolean {
  return Boolean(icon && iconPosition === ICON_ONLY_POSITION && !text)
}

export function resolveAriaLabel({ text, ariaLabel, icon, iconPosition }: ButtonLabelOptions): string | undefined {
  if (ariaLabel) {
    return ariaLabel
  }

  if (text) {
    return undefined
  }

  if (icon && iconPosition === ICON_ONLY_POSITION) {
    return humanizeIconName(icon)
  }

  return undefined
}

function humanizeIconName(icon: SpriteName): string {
  return icon
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
