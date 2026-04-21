import { describe, expect, it } from 'vitest'
import { ensureUppyGeneratedAccessibility } from '@components/Pages/Contact/client/upload'
import { withJsdomEnvironment } from '@test/unit/helpers/litRuntime'

const flushMutations = async () => {
  await Promise.resolve()
  await Promise.resolve()
}

describe('Contact upload accessibility', () => {
  it('adds a landmark role to the generated Uppy dashboard when it has an aria-label', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      Object.assign(globalThis, { MutationObserver: window.MutationObserver })

      const root = window.document.createElement('div')
      root.innerHTML = `
        <div
          class="uppy-Dashboard"
          aria-label="Uppy Dashboard"
          aria-hidden="false"
          aria-disabled="false"
        ></div>
      `

      const observer = ensureUppyGeneratedAccessibility(root)
      const dashboard = root.querySelector('.uppy-Dashboard')

      expect(dashboard?.getAttribute('role')).toBe('region')

      observer.disconnect()
    })
  })

  it('patches dynamically added Uppy dashboard markup and unlabeled text inputs', async () => {
    await withJsdomEnvironment(async ({ window }) => {
      Object.assign(globalThis, { MutationObserver: window.MutationObserver })

      const root = window.document.createElement('div')
      const observer = ensureUppyGeneratedAccessibility(root)

      const wrapper = window.document.createElement('div')
      wrapper.innerHTML = `
        <div class="uppy-Dashboard" aria-label="Uppy Dashboard"></div>
        <input type="text" placeholder="Paste a remote URL" />
      `

      root.append(wrapper)
      await flushMutations()

      const dashboard = root.querySelector('.uppy-Dashboard')
      const input = root.querySelector('input[type="text"]')

      expect(dashboard?.getAttribute('role')).toBe('region')
      expect(input?.getAttribute('aria-label')).toBe('Paste a remote URL')

      observer.disconnect()
    })
  })
})
