import type { IconName } from '@components/Icon/@types/icons'

export type ButtonVariant = 'primary' | 'secondary' | 'twitter' | 'success' | 'warning' | 'icon'
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonType = 'button' | 'submit' | 'reset'
export type IconPosition = 'left' | 'right' | 'only'

type Optional<T> = T | undefined

export interface ButtonProps {
  text?: Optional<string>
  variant?: Optional<ButtonVariant>
  size?: Optional<ButtonSize>
  type?: Optional<ButtonType>
  disabled?: Optional<boolean>
  class?: Optional<string>
  id?: Optional<string>
  ariaLabel?: Optional<string>
  onClick?: Optional<string>
  icon?: Optional<IconName>
  iconPosition?: Optional<IconPosition>
  iconSize?: Optional<number | string>
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
  variant?: Optional<ButtonVariant>
  size?: Optional<ButtonSize>
  additionalClasses?: Optional<string>
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
  text?: Optional<string>
  ariaLabel?: Optional<string>
  icon?: Optional<IconName>
  iconPosition?: Optional<IconPosition>
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

function humanizeIconName(icon: IconName): string {
  return icon
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}
