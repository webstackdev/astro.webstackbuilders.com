export interface NewsletterProps {
  /** Optional base id for internal aria relationships */
  id?: string
  /** Main heading for the newsletter signup */
  title?: string
  /** Supporting description text */
  description?: string
  /** Input placeholder text */
  placeholder?: string
  /** Submit button text */
  buttonText?: string
  /** Choose which variant to show */
  variant: 'article' | 'home' | 'page'
}
