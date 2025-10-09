/**
 * File upload for the contact form
 * TODO: Install uppy dependencies when file upload feature is needed
 */
/**
 * File upload for the contact form
 * TODO: Install uppy dependencies and uncomment this code when file upload feature is needed
 */
// import { Dashboard, DragDrop, Webcam } from 'uppy'
// import { Uppy } from '@uppy/core'

/*
const uppy = new Uppy({
  autoProceed: false,
  id: 'contact',
  debug: false,
  meta: {
    username: 'john',
    license: 'Creative Commons',
  },
  restrictions: {
    maxFileSize: 1000000,
    maxNumberOfFiles: 3,
    minNumberOfFiles: 1,
    allowedFileTypes: ['image/*', 'video/*'],
  },
  onBeforeFileAdded: () => true,
  onBeforeUpload: () => true,
})

uppy.use(DragDrop, { target: 'body' })
uppy.use(Dashboard, { target: '#drag-drop-area', inline: true })
uppy.use(Webcam, {
  countdown: false,
  showRecordingLength: true,
  showVideoSourceDropdown: true,
  target: Dashboard, // Webcam will be installed to the Dashboard
})

uppy.upload().then(result => {
  console.info('Successful uploads:', result.successful)

  if (result.failed.length > 0) {
    result.failed.forEach(file => {
      console.error(file.error)
    })
  }
}).catch((reason) => console.log(reason))

uppy.on('file-added', file => {
  console.log('Added file', file)
})

uppy.on('complete', result => {
  console.log('Upload complete! We've uploaded these files:', result.successful)
})
*/

// Placeholder export to make this a valid module
export const uploadPlaceholder = 'TODO: Implement file upload with uppy'
