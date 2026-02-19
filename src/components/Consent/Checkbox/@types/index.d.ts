export interface ConsentCheckboxProps {
  /** Data processing purpose user is consenting to */
  purpose: string
  /** Custom consent text (overrides default) */
  customText?: string
  /** Link to Privacy Policy */
  privacyPolicyUrl?: string
  /** Link to Cookie Policy */
  cookiePolicyUrl?: string
  /** Input element name attribute */
  name?: string
  /** Input element ID attribute */
  id?: string
  /** Form identifier (for tracking in consent logs) */
  formId?: string
  /** Layout variants */
  variant: 'default' | 'newsletter-cta-home' | 'newsletter-cta-article' | 'download'
}
