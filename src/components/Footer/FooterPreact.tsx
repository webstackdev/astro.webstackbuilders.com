/**
 * Footer Component - Preact Version
 * For testing transition:persist with UI framework components
 */
import { useEffect, useState } from 'preact/hooks'
import type { FunctionalComponent } from 'preact'
import contactData from '@content/contact.json'
import { formatPhoneNumber } from '@components/Footer/server'

interface FooterProps {
  year: number
  siteUrl: string
  authorAvatar: string
}

const Footer: FunctionalComponent<FooterProps> = ({ year, siteUrl, authorAvatar }) => {
  const [hireMeText, setHireMeText] = useState<string>('')
  const [isVisible, setIsVisible] = useState<boolean>(false)

  useEffect(() => {
    // Set "Hire Me" text with current month/year
    const date = new Date()
    const monthDate = new Date(date)
    monthDate.setMonth(monthDate.getMonth() - 1)
    const month = monthDate.toLocaleString('en-US', { month: 'long' })
    const year = date.getFullYear()
    setHireMeText(`Available ${month}, ${year}. Hire Me Now`)
    setIsVisible(true)
  }, [])

  return (
    <footer
      class="bg-(--color-bg-offset) text-text w-full mt-6 pt-4"
      role="contentinfo"
      data-testid="footer-preact"
    >
      <div class="flex flex-col footer-grid mx-auto max-w-300 w-[90%] px-4 sm:px-6 lg:px-8 pb-3">
        {/* Contact Section */}
        <div class="footer-contact mt-3 sm:mt-0 sm:flex sm:items-center">
          <div class="flex items-center sm:block sm:mr-4 sm:w-[clamp(5em,25%,8em)]">
            <div class="mr-3 w-16 sm:mr-0 sm:w-full">
              <img src={authorAvatar} alt="Site author's avatar image" />
            </div>
            <h2 class="text-2xl font-bold sm:hidden">{contactData.company.name}</h2>
          </div>
          <address class="text-base mt-3 sm:mt-0">
            <h2 class="hidden sm:block text-2xl font-bold">{contactData.company.name}</h2>
            <div class="mt-2 sm:ml-1">
              <p>{contactData.company.address}</p>
              <p>
                {contactData.company.city}, {contactData.company.state} {contactData.company.index}
              </p>
            </div>
            <p class="hyphens-none">
              <a
                href={`mailto:${contactData.company.email}`}
                class="text-text underline decoration-dotted decoration-text underline-offset-4 hover:text-secondary hover:decoration-secondary focus:text-secondary focus:decoration-secondary focus:outline-none"
              >
                {contactData.company.email}
              </a>
            </p>
            <p itemprop="telephone">
              <a
                href={`tel:${contactData.company.telephoneTollFree}`}
                rel="nofollow"
                class="text-text underline decoration-dotted decoration-text underline-offset-4 hover:text-secondary hover:decoration-secondary focus:text-secondary focus:decoration-secondary focus:outline-none"
              >
                Toll Free {formatPhoneNumber(contactData.company.telephoneTollFree)}
              </a>
            </p>
            <p itemprop="telephone">
              <a
                href={`tel:${contactData.company.telephoneLocal}`}
                rel="nofollow"
                class="text-text underline decoration-dotted decoration-text underline-offset-4 hover:text-secondary hover:decoration-secondary focus:text-secondary focus:decoration-secondary focus:outline-none"
              >
                Local {formatPhoneNumber(contactData.company.telephoneLocal)}
              </a>
            </p>
          </address>
        </div>

        {/* Hire Me Section */}
        <div class="footer-hire-me hidden lg:block">
          {isVisible && (
            <a
              href="/contact"
              id="page-footer__hire-me-anchor"
              class="footer-hire-me-anchor inline-block uppercase text-text underline decoration-dotted decoration-text underline-offset-4 hover:text-secondary hover:decoration-secondary focus:text-secondary focus:decoration-secondary focus:outline-none after:content-['>']"
              aria-label="Available for hire, contact me"
            >
              {hireMeText}
            </a>
          )}
        </div>

        {/* Copyright */}
        <div class="footer-copyright flex justify-center py-4 sm:p-0 lg:mt-2">
          <span>&copy; 2018&ndash;{year}</span>
          <span class="ml-4">
            <a
              rel="me"
              href={siteUrl}
              class="text-text underline decoration-dotted decoration-text underline-offset-4 hover:text-secondary hover:decoration-secondary focus:text-secondary focus:decoration-secondary focus:outline-none"
            >
              {contactData.company.name}
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer
