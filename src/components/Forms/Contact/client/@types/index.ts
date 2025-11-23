type TextInput = HTMLInputElement | HTMLTextAreaElement

export type FieldName = 'name' | 'email' | 'message'

export interface FieldElements<T extends TextInput> {
  input: T
  label: HTMLLabelElement
  feedback: HTMLElement
}

export interface ContactFormFields {
  name: FieldElements<HTMLInputElement>
  email: FieldElements<HTMLInputElement>
  message: FieldElements<HTMLTextAreaElement>
}

export interface ContactFormElements {
  form: HTMLFormElement
  messages: HTMLElement
  successMessage: HTMLElement
  errorMessage: HTMLElement
  errorText: HTMLElement
  submitBtn: HTMLButtonElement
  btnText: HTMLElement
  btnLoading: HTMLElement
  messageTextarea: HTMLTextAreaElement
  charCount: HTMLElement
  uppyContainer: HTMLElement | null
  formErrorBanner: HTMLElement
  fields: ContactFormFields
}

export interface ContactFormConfig {
  maxCharacters: number
  warningThreshold: number
  errorThreshold: number
  apiEndpoint: string
}
