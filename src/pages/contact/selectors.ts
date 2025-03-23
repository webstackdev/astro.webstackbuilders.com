/**
 * Type-safe HTML element selectors
 */
import {
  isButtonElement,
  isDivElement,
  isFormElement,
  isInputElement,
  isLabelElement,
} from '../../utils/assertions/elements'

export const SELECTORS = {
  emailGroup: '.contact__form-email',
  formELement: '#contact__form',
  formError: '.contact__form-error',
  inputElement: '.contact__form-input-element',
  inputLabel: '.contact__form-input-label',
  messageGroup: '.contact__form-message',
  nameGroup: '.contact__form-name',
  submitButton: '.contact__form-submit-btn',
  validationError: '.contact__form-validation-error',
}

export const formControlGroupSelectors = [
  {
    labelElement: `emailInputLabel`,
    formControl: `emailInputElement`,
    errorMessageContainer: `emailValidationError`,
  },
  {
    labelElement: `messageInputLabel`,
    formControl: `messageInputElement`,
    errorMessageContainer: `messageValidationError`,
  },
  {
    labelElement: `nameInputLabel`,
    formControl: `nameInputElement`,
    errorMessageContainer: `nameValidationError`,
  },
] as const

type selectors = keyof typeof SELECTORS

export class ContactFormSelectors {
  /** Email form elements */
  private emailGroup: HTMLDivElement
  private _emailInputElement: HTMLInputElement | undefined
  private _emailInputLabel: HTMLLabelElement | undefined
  private _emailValidationError: HTMLDivElement | undefined

  /** Email form elements */
  private messageGroup: HTMLDivElement
  private _messageInputElement: HTMLInputElement | undefined
  private _messageInputLabel: HTMLLabelElement | undefined
  private _messageValidationError: HTMLDivElement | undefined

  /** Email form elements */
  private nameGroup: HTMLDivElement
  private _nameInputElement: HTMLInputElement | undefined
  private _nameInputLabel: HTMLLabelElement | undefined
  private _nameValidationError: HTMLDivElement | undefined

  /** Single form elements */
  private _submitButton: HTMLButtonElement | undefined
  private _formValidationError: HTMLDivElement | undefined

  constructor() {
    this.emailGroup = this.getFormGroup(`emailGroup`)
    this.messageGroup = this.getFormGroup(`messageGroup`)
    this.nameGroup = this.getFormGroup(`nameGroup`)
  }

  /**
   * Getters for email input form element on contact page
   */

  public get emailInputElement() {
    if (!this._emailInputElement) {
      this._emailInputElement = this.getInputElement(this.emailGroup)
    }
    return this._emailInputElement
  }

  public get emailInputLabel() {
    if (!this._emailInputLabel) {
      this._emailInputLabel = this.getLabelElement(this.emailGroup)
    }
    return this._emailInputLabel
  }

  public get emailValidationError() {
    if (!this._emailValidationError) {
      this._emailValidationError = this.getErrorValidationElement(this.emailGroup)
    }
    return this._emailValidationError
  }

  /**
   * Getters for message textarea form element on contact page
   */

  public get messageInputElement() {
    if (!this._messageInputElement) {
      this._messageInputElement = this.getInputElement(this.messageGroup)
    }
    return this._messageInputElement
  }

  public get messageInputLabel() {
    if (!this._messageInputLabel) {
      this._messageInputLabel = this.getLabelElement(this.messageGroup)
    }
    return this._messageInputLabel
  }

  public get messageValidationError() {
    if (!this._messageValidationError) {
      this._messageValidationError = this.getErrorValidationElement(this.messageGroup)
    }
    return this._messageValidationError
  }

  /**
   * Getters for name input form element on contact page
   */

  public get nameInputElement() {
    if (!this._nameInputElement) {
      this._nameInputElement = this.getInputElement(this.nameGroup)
    }
    return this._nameInputElement
  }

  public get nameInputLabel() {
    if (!this._nameInputLabel) {
      this._nameInputLabel = this.getLabelElement(this.nameGroup)
    }
    return this._nameInputLabel
  }

  public get nameValidationError() {
    if (!this._nameValidationError) {
      this._nameValidationError = this.getErrorValidationElement(this.nameGroup)
    }
    return this._nameValidationError
  }

  /**
   * Getter for the form element
   */
  public get contactForm(): HTMLFormElement {
    const formELement = document.querySelector(SELECTORS.formELement)
    if (!isFormElement(formELement)) {
      throw new Error(`Contact form is missing in document, selector: ${SELECTORS.formELement}`)
    }
    return formELement
  }

  /**
   * Getter for the submit button element
   */
  public get submitButton(): HTMLButtonElement {
    if (!this._submitButton) {
      const submitButton = document.querySelector(SELECTORS.submitButton)
      if (!isButtonElement(submitButton)) {
        throw new Error(
          `Contact form submit button is missing in document, selector: ${SELECTORS.submitButton}`
        )
      }
      this._submitButton = submitButton
    }
    return this._submitButton
  }

  /**
   * Getter for the error validation <div> in a form input group
   */
  public get formErrorWrapper(): HTMLDivElement {
    if (!this._formValidationError) {
      const errorValidationElement = document.querySelector(SELECTORS.formError)
      if (!isDivElement(errorValidationElement)) {
        throw new Error(`Contact form error wrapper is missing in document: ${SELECTORS.formError}`)
      }
      this._formValidationError = errorValidationElement
    }
    return this._formValidationError
  }

  /**
   * Getter for the <div> wrapping a form input element group
   */
  private getFormGroup(selector: selectors): HTMLDivElement {
    const elementSelector = SELECTORS[selector]
    const group = document.querySelector(elementSelector)
    if (!isDivElement(group)) {
      throw new Error(
        `Contact form input group wrapper <div> is missing in document, selector: ${elementSelector}`
      )
    }
    return group
  }

  /**
   * Getter for a form input element in a given group
   */
  private getInputElement(formGroup: HTMLDivElement): HTMLInputElement {
    const inputElement = formGroup.querySelector(SELECTORS.inputElement)
    if (!isInputElement(inputElement)) {
      throw new Error(
        `Contact form input element is missing in document for input group: ${formGroup['tagName']}`
      )
    }
    return inputElement
  }

  /**
   * Getter for the label element of a form input element group
   */
  private getLabelElement(formGroup: HTMLDivElement): HTMLLabelElement {
    const labelElement = formGroup.querySelector(SELECTORS.inputLabel)
    if (!isLabelElement(labelElement)) {
      throw new Error(
        `Contact form input group wrapper <div> is missing in document for input group: ${formGroup['tagName']}`
      )
    }
    return labelElement
  }

  /**
   * Getter for the error validation <div> in a form input group
   */
  private getErrorValidationElement(formGroup: HTMLDivElement): HTMLDivElement {
    const errorValidationElement = formGroup.querySelector(SELECTORS.validationError)
    if (!isDivElement(errorValidationElement)) {
      throw new Error(
        `Contact form input group wrapper <div> is missing in document for input group: ${formGroup['tagName']}`
      )
    }
    return errorValidationElement
  }
}
