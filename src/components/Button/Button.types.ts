/**
 * Button component types and interfaces
 */

export type ButtonVariant = 'primary' | 'secondary' | 'twitter' | 'success' | 'warning'
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonType = 'button' | 'submit' | 'reset'

export interface ButtonProps {
  /** Button text content */
  text?: string
  /** Button variant style */
  variant?: ButtonVariant
  /** Button size */
  size?: ButtonSize
  /** Button type attribute */
  type?: ButtonType
  /** Whether button is disabled */
  disabled?: boolean
  /** Additional CSS classes */
  class?: string
  /** Button ID attribute */
  id?: string
  /** ARIA label for accessibility */
  ariaLabel?: string
  /** Click handler function name (for client-side scripts) */
  onClick?: string
}