/**
 * Button component types and exports
 */
import type { SpriteName } from '../Sprite/sprites'

export type ButtonVariant = 'primary' | 'secondary' | 'twitter' | 'success' | 'warning' | 'icon'
export type ButtonSize = 'small' | 'medium' | 'large'
export type ButtonType = 'button' | 'submit' | 'reset'
export type IconPosition = 'left' | 'right' | 'only'

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
  /** Icon name to display (from Sprite component) */
  icon?: SpriteName
  /** Icon position relative to text */
  iconPosition?: IconPosition
  /** Icon size in pixels */
  iconSize?: number | string
}

// Base button classes (converted from .btn SCSS)
export const baseClasses = [
  // Layout & positioning
  'inline-flex',
  'items-center',
  'justify-center',
  'text-center',
  'align-middle',

  // Typography
  'font-semibold',
  'text-sm',
  'uppercase',
  'tracking-wide',
  'whitespace-nowrap',

  // Styling
  'rounded',
  'border-2',
  'border-transparent',

  // Transitions
  'transition-all',
  'duration-200',
  'ease-in-out',

  // User interaction
  'select-none',

  // Disabled state
  'disabled:opacity-65',
  'disabled:cursor-not-allowed',
  'disabled:pointer-events-none',
].join(' ')

// Size variations
export const sizeClasses: Record<ButtonSize, string> = {
  small: 'px-4 py-2 text-xs',
  medium: 'px-6 py-3',
  large: 'px-8 py-4 text-base',
}

// Variant styles (converted from SCSS variants)
export const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    // Background & colors
    'bg-[var(--color-primary)]',
    'text-[var(--color-text)]',
    'border-transparent',

    // Shadow & transform effects
    'shadow-[0_4px_6px_rgba(50,50,93,0.11),0_1px_3px_rgba(0,0,0,0.08)]',
    'text-shadow-[0_1px_3px_rgba(0,0,0,0.15)]',
    'transform',
    'translate-y-0',

    // Hover states
    'hover:bg-[var(--color-primary-offset)]',
    'hover:text-[var(--color-text)]',
    'hover:shadow-[0_7px_14px_rgba(50,50,50,0.1),0_3px_6px_rgba(0,0,0,0.08)]',
    'hover:-translate-y-px',

    // Focus states
    'focus:bg-[var(--color-primary-offset)]',
    'focus:text-[var(--color-text)]',
    'focus:shadow-[0_7px_14px_rgba(50,50,50,0.1),0_3px_6px_rgba(0,0,0,0.08)]',
    'focus:-translate-y-px',
    'focus:outline-none',

    // Active states
    'active:bg-[var(--color-primary-offset)]',
    'active:shadow-[0_3px_12px_-2px_inset_rgba(50,50,50,0.25)]',
    'active:translate-y-px',
  ].join(' '),

  secondary: [
    // Background & colors
    'bg-[var(--color-secondary)]',
    'text-[var(--color-text)]',
    'border-transparent',

    // Shadow & transform effects
    'shadow-[0_4px_6px_rgba(50,50,93,0.11),0_1px_3px_rgba(0,0,0,0.08)]',
    'text-shadow-[0_1px_3px_rgba(0,0,0,0.15)]',
    'transform',
    'translate-y-0',

    // Hover states
    'hover:bg-[var(--color-secondary-offset)]',
    'hover:text-[var(--color-text)]',
    'hover:shadow-[0_7px_14px_rgba(50,50,50,0.1),0_3px_6px_rgba(0,0,0,0.08)]',
    'hover:-translate-y-px',

    // Focus states
    'focus:bg-[var(--color-secondary-offset)]',
    'focus:text-[var(--color-text)]',
    'focus:shadow-[0_7px_14px_rgba(50,50,50,0.1),0_3px_6px_rgba(0,0,0,0.08)]',
    'focus:-translate-y-px',
    'focus:outline-none',

    // Active states
    'active:bg-[var(--color-secondary-offset)]',
    'active:shadow-[0_3px_12px_-2px_inset_rgba(50,50,50,0.25)]',
    'active:translate-y-px',
  ].join(' '),

  twitter: [
    // Background & colors
    'bg-[var(--color-twitter)]',
    'border-[var(--color-twitter)]',
    'text-[var(--color-text)]',

    // Hover states
    'hover:bg-transparent',
    'hover:text-[var(--color-twitter)]',

    // Focus states
    'focus:bg-transparent',
    'focus:text-[var(--color-twitter)]',
    'focus:outline-none',
  ].join(' '),

  success: [
    // Background & colors
    'bg-[var(--color-success)]',
    'text-white',
    'border-transparent',

    // Shadow & transform effects
    'shadow-[0_4px_6px_rgba(50,50,93,0.11),0_1px_3px_rgba(0,0,0,0.08)]',
    'text-shadow-[0_1px_3px_rgba(0,0,0,0.15)]',
    'transform',
    'translate-y-0',

    // Hover states
    'hover:bg-[var(--color-success-offset)]',
    'hover:text-white',
    'hover:shadow-[0_7px_14px_rgba(50,50,50,0.1),0_3px_6px_rgba(0,0,0,0.08)]',
    'hover:-translate-y-px',

    // Focus states
    'focus:bg-[var(--color-success-offset)]',
    'focus:text-white',
    'focus:shadow-[0_7px_14px_rgba(50,50,50,0.1),0_3px_6px_rgba(0,0,0,0.08)]',
    'focus:-translate-y-px',
    'focus:outline-none',

    // Active states
    'active:bg-[var(--color-success-offset)]',
    'active:shadow-[0_3px_12px_-2px_inset_rgba(50,50,50,0.25)]',
    'active:translate-y-px',
  ].join(' '),

  warning: [
    // Background & colors
    'bg-[var(--color-warning)]',
    'text-[var(--color-text)]',
    'border-transparent',

    // Shadow & transform effects
    'shadow-[0_4px_6px_rgba(50,50,93,0.11),0_1px_3px_rgba(0,0,0,0.08)]',
    'text-shadow-[0_1px_3px_rgba(0,0,0,0.15)]',
    'transform',
    'translate-y-0',

    // Hover states
    'hover:bg-[var(--color-warning-offset)]',
    'hover:text-[var(--color-text)]',
    'hover:shadow-[0_7px_14px_rgba(50,50,50,0.1),0_3px_6px_rgba(0,0,0,0.08)]',
    'hover:-translate-y-px',

    // Focus states
    'focus:bg-[var(--color-warning-offset)]',
    'focus:text-[var(--color-text)]',
    'focus:shadow-[0_7px_14px_rgba(50,50,50,0.1),0_3px_6px_rgba(0,0,0,0.08)]',
    'focus:-translate-y-px',
    'focus:outline-none',

    // Active states
    'active:bg-[var(--color-warning-offset)]',
    'active:shadow-[0_3px_12px_-2px_inset_rgba(50,50,50,0.25)]',
    'active:translate-y-px',
  ].join(' '),

  icon: [
    // Background & colors - transparent background for icon-only buttons
    'bg-transparent',
    'text-[var(--color-text)]',
    'border-transparent',

    // Remove shadow for icon buttons
    'shadow-none',

    // Square aspect ratio for icon-only buttons
    'aspect-square',

    // Hover states
    'hover:bg-[var(--color-bg-offset)]',
    'hover:text-[var(--color-primary)]',

    // Focus states
    'focus:bg-[var(--color-bg-offset)]',
    'focus:text-[var(--color-primary)]',
    'focus:outline-none',

    // Active states
    'active:bg-[var(--color-bg-offset)]',
  ].join(' '),
}
