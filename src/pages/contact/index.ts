/**
 * Script for the "Contact Us" form
 */

import { initLabelHandlers } from './labels'
import { initEmailValidationHandler } from './email'
import { initNameLengthHandler } from './name'
import { initMssgLengthHandler } from './message'
import { ContactFormSelectors } from './selectors'
import { initSubmitHandler } from './submit'

export class ContactForm {
  private selector: ContactFormSelectors

  constructor() {
    this.selector = new ContactFormSelectors()
    /**
     * Set opacity to 0 on the input labels when the user types something in the
     * input box so the label doesn't show while the user's typing, and set it
     * back to 0.5 if they clear the input.
     */
    initLabelHandlers(this.selector)
    /**
     * Event handler for the text area element to give a warning when close
     * to max limit but not at it when the error handling will take over.
     */
    initMssgLengthHandler(this.selector)
    /** Event handler for the name input element */
    initNameLengthHandler(this.selector)
    /** Event handler for the email input element */
    initEmailValidationHandler(this.selector)
    /** Submit handler */
    initSubmitHandler(this.selector)

    // File download
    // @TODO: 4. need to do file download script
    // @TODO: 5. need to do lambda function (1) to handle to s-3 bucket
  }
}

/**
 * Only initialize the contact page scripts if on the contact page. Set up a listener
 * to initialize the contact page scripts if users navigates to contact page.
 */
export const contactInit = () => {
  const isContactPage = () => window.location.pathname.startsWith(`/contact`)
  const setupContactPage = () => { return new ContactForm() }
  const contactPageRouteListener = () => { if (isContactPage()) setupContactPage() }
  isContactPage() ? setupContactPage() : window.addEventListener('popstate', contactPageRouteListener)
}
