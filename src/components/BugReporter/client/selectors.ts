import { ClientScriptError } from '@components/scripts/errors'

export const getBugReporterTriggerElement = (triggerId: string): HTMLButtonElement | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const trigger = document.getElementById(triggerId)
  if (!trigger) {
    return null
  }

  return trigger instanceof HTMLButtonElement ? trigger : null
}

export const getBugReporterDialogElement = (dialogId: string): HTMLDialogElement => {
  if (typeof document === 'undefined') {
    throw new ClientScriptError('BugReporter: document is not available')
  }

  const dialog = document.getElementById(dialogId)
  // JSDOM does not expose `HTMLDialogElement` as a global constructor, so avoid `instanceof` checks here.
  if (!(dialog instanceof HTMLElement) || dialog.tagName !== 'DIALOG') {
    throw new ClientScriptError(`BugReporter: dialog element not found: ${dialogId}`)
  }

  return dialog as unknown as HTMLDialogElement
}

export const getBugReporterFormElement = (formId: string): HTMLFormElement | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const form = document.getElementById(formId)
  return form instanceof HTMLFormElement ? form : null
}

export const getBugReporterStatusElement = (statusId: string): HTMLElement | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const status = document.getElementById(statusId)
  return status instanceof HTMLElement ? status : null
}

export const getBugReporterCloseButtonElement = (closeButtonId: string): HTMLButtonElement | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const closeButton = document.getElementById(closeButtonId)
  return closeButton instanceof HTMLButtonElement ? closeButton : null
}

export const getBugReporterCancelButtonElement = (
  cancelButtonId: string,
): HTMLButtonElement | null => {
  if (typeof document === 'undefined') {
    return null
  }

  const cancelButton = document.getElementById(cancelButtonId)
  return cancelButton instanceof HTMLButtonElement ? cancelButton : null
}

export const queryBugReporterNameInput = (formId: string): HTMLInputElement | null => {
  const form = getBugReporterFormElement(formId)
  const input = form?.querySelector('input[name="name"]')
  return input instanceof HTMLInputElement ? input : null
}

export const queryBugReporterEmailInput = (formId: string): HTMLInputElement | null => {
  const form = getBugReporterFormElement(formId)
  const input = form?.querySelector('input[name="email"]')
  return input instanceof HTMLInputElement ? input : null
}

export const queryBugReporterMessageTextArea = (formId: string): HTMLTextAreaElement | null => {
  const form = getBugReporterFormElement(formId)
  const textarea = form?.querySelector('textarea[name="message"]')
  return textarea instanceof HTMLTextAreaElement ? textarea : null
}

export const queryBugReporterSubmitButton = (formId: string): HTMLButtonElement | null => {
  const form = getBugReporterFormElement(formId)
  const submitButton = form?.querySelector('button[type="submit"]')
  return submitButton instanceof HTMLButtonElement ? submitButton : null
}
