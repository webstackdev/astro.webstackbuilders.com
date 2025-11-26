/// <reference types="react" />
/**
 * Make JSX namespace available globally for MDX compatibility
 * This fixes the "Cannot find namespace 'JSX'" error from `@types/mdx`
 */
import * as React from 'react'

declare global {
  namespace JSX {
    type Element = React.JSX.Element
    type ElementClass = React.JSX.ElementClass
    type IntrinsicElements = React.JSX.IntrinsicElements
  }
}
