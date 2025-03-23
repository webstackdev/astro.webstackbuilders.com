/**
 * Submit XHR call to lambda
 */
import { getInvalidFormText } from './error'
import type { ContactFormSelectors } from './selectors'

const url = 'https://{id}.execute-api.{region}.amazonaws.com/{stage}/email/send'

export const initSubmitHandler = (selector: ContactFormSelectors) => {
  selector.contactForm.addEventListener('submit', (event) => {
    event.preventDefault()
    const isEmailInvalid = !selector.emailInputElement.checkValidity()
    const isMessageInvalid = !selector.messageInputElement.checkValidity()
    const isNameInvalid = !selector.nameInputElement.checkValidity()

    if (isEmailInvalid || isMessageInvalid || isNameInvalid) {
      selector.formErrorWrapper.classList.add(`error`)
      selector.formErrorWrapper.innerText = getInvalidFormText()
    }

    selector.submitButton.disabled = true

    fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: selector.nameInputElement.value,
        email: selector.emailInputElement.value,
        message: selector.messageInputElement.value,
      }),
    })
      .then(res => res.json())
      .then(res => {
        selector.submitButton.disabled = false
        console.log(res)
      })
      .catch(reason => {
        selector.submitButton.disabled = false
        selector.submitButton.blur()
        selector.nameInputElement.focus()
        selector.nameInputElement.value = ''
        selector.emailInputElement.value = ''
        selector.messageInputElement.value = ''
        console.log(reason)
      })
  })
}
// noUnusedLocals to false in tsconfig.json