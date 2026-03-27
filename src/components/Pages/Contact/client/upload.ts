import Dashboard from '@uppy/dashboard'
import Uppy from '@uppy/core'
import Audio from '@uppy/audio'
import Webcam from '@uppy/webcam'

import type { ContactFormElements } from './@types'
import {
  queryAccessibilityLabelTargets,
  queryUppyDashboardRoots,
  queryUppyDashboardTarget,
} from './selectors'
import { isUnitTest } from '@components/scripts/utils/environmentClient'

export interface UploadController {
  getFiles: () => File[]
  reset: () => void
  destroy: () => void
}

const MAX_FILES = 5
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

const allowedMimeTypes = [
  'application/msword',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/zip',
  'audio/mpeg',
  'audio/wav',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/webp',
  'text/plain',
  'video/mp4',
  'video/quicktime',
] as const

const toFile = (value: Blob | File, name: string): File => {
  if (value instanceof File) {
    return value
  }

  return new File([value], name, { type: value.type })
}

const isNonNullable = <T>(value: T | null | undefined): value is T => value != null

const UPPY_ACCESSIBILITY_FIELD_SELECTOR = 'input[type="text"], input[type="email"], textarea'
const UPPY_DASHBOARD_SELECTOR = '.uppy-Dashboard'

const applyUppyDashboardSemantics = (element: Element): void => {
  if (!(element instanceof HTMLElement)) return
  if (!element.matches(UPPY_DASHBOARD_SELECTOR)) return
  if (element.hasAttribute('role')) return
  if (!element.getAttribute('aria-label')) return

  element.setAttribute('role', 'region')
}

export const ensureUppyGeneratedAccessibility = (root: ParentNode & Node): MutationObserver => {
  const labelIfMissing = (element: Element): void => {
    if (!(element instanceof HTMLElement)) return
    if (!element.matches(UPPY_ACCESSIBILITY_FIELD_SELECTOR)) return

    const hasId = element.hasAttribute('id')
    const ariaLabel = element.getAttribute('aria-label')
    const ariaLabelledBy = element.getAttribute('aria-labelledby')
    if (hasId || ariaLabel || ariaLabelledBy) return

    const placeholder =
      element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement
        ? element.placeholder
        : ''
    const fallback = placeholder || element.getAttribute('name') || 'File upload'

    element.setAttribute('aria-label', fallback)
  }

  queryUppyDashboardRoots(root).forEach(applyUppyDashboardSemantics)
  queryAccessibilityLabelTargets(root).forEach(labelIfMissing)

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (!(node instanceof Element)) return
        if (node.matches(UPPY_DASHBOARD_SELECTOR)) {
          applyUppyDashboardSemantics(node)
        }

        if (node.matches(UPPY_ACCESSIBILITY_FIELD_SELECTOR)) {
          labelIfMissing(node)
        }

        if ('querySelectorAll' in node) {
          queryUppyDashboardRoots(node as ParentNode).forEach(applyUppyDashboardSemantics)
          queryAccessibilityLabelTargets(node as ParentNode).forEach(labelIfMissing)
        }
      })
    })
  })

  observer.observe(root, { childList: true, subtree: true })
  return observer
}

export const initUppyUpload = (elements: ContactFormElements): UploadController | null => {
  if (!elements.uppyContainer) {
    return null
  }

  const dashboardTarget = queryUppyDashboardTarget(elements.uppyContainer)
  if (!dashboardTarget) {
    return null
  }

  // Keep unit tests focused on form behavior; Uppy + Dashboard depend on browser APIs (e.g. ResizeObserver).
  if (isUnitTest()) {
    return {
      getFiles: () => [],
      reset: () => undefined,
      destroy: () => undefined,
    }
  }

  const uppy = new Uppy({
    autoProceed: false,
    restrictions: {
      maxNumberOfFiles: MAX_FILES,
      maxFileSize: MAX_FILE_SIZE_BYTES,
      allowedFileTypes: [...allowedMimeTypes],
    },
  })
    .use(Dashboard, {
      inline: true,
      target: dashboardTarget,
      proudlyDisplayPoweredByUppy: false,
      hideUploadButton: true,
      hideProgressDetails: false,
      showProgressDetails: true,
      note: `Maximum ${MAX_FILES} files. Each file up to ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.`,
    })
    .use(Audio)
    .use(Webcam)

  // Uppy renders several UI inputs dynamically and may also place auxiliary UI outside the
  // immediate dashboard target. Ensure any text/email inputs are given an accessible name.
  const ariaObserver = ensureUppyGeneratedAccessibility(document)

  const reset = (): void => {
    uppy.cancelAll()
    const fileIds = uppy.getFiles().map(file => file.id)
    if (fileIds.length > 0) {
      uppy.removeFiles(fileIds)
    }
  }

  return {
    getFiles: () => {
      return uppy
        .getFiles()
        .map(file => {
          if (!file.data) return null
          return toFile(file.data, file.name)
        })
        .filter(isNonNullable)
    },
    reset,
    destroy: () => {
      ariaObserver.disconnect()
      uppy.destroy()
    },
  }
}
