import Dashboard from '@uppy/dashboard'
import Uppy from '@uppy/core'
import Audio from '@uppy/audio'
import Webcam from '@uppy/webcam'

import type { ContactFormElements } from './@types'
import { queryUppyDashboardTarget } from './selectors'
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
    destroy: () => uppy.destroy(),
  }
}
