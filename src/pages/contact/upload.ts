/**
 * File upload for the contact form
 */
import { Dashboard, DragDrop, Webcam } from 'uppy'
import { Uppy } from '@uppy/core'

const uppy = new Uppy({
  autoProceed: false,
  id: 'contact',
  debug: false,
  restrictions: {
    maxFileSize: undefined,
    minFileSize: undefined,
    maxTotalFileSize: undefined,
    maxNumberOfFiles: undefined,
    minNumberOfFiles: undefined,
    allowedFileTypes: undefined,
  },
  //onBeforeFileAdded: (currentFile, files) => true,
  //onBeforeUpload: files => true,
  //logger: debugLogger, // justErrorsLogger
})

uppy.setMeta({ username: 'Peter' }) // set or update meta for all files.
uppy.setFileMeta('myfileID', { resize: 1500 }) // set or update meta for specific file.
uppy.use(DragDrop, { target: 'body' })
uppy.use(Dashboard, { target: '#drag-drop-area', inline: true })
uppy.use(Webcam, {
  countdown: false,
  mirror: true,
  facingMode: 'user',
  target: Dashboard, // Webcam will be installed to the Dashboard
})

uppy.upload().then(result => {
  console.info('Successful uploads:', result.successful)

  if (result.failed.length > 0) {
    console.error('Errors:')
    result.failed.forEach(file => {
      console.error(file.error)
    })
  }
}).catch((reason) => console.log(reason))

uppy.on('file-added', file => {
  console.log(file.name)
})

uppy.on('complete', result => {
  console.log(result)
})
