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
  href?: string
  icon?: string
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
}: ButtonClassOptions) {
  const classes = {
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
