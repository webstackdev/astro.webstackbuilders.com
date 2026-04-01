
import parsePhoneNumber from 'libphonenumber-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { buildTemplateStyles } from './styles.mjs'

const CONTACT_JSON = resolve('src/content/contact.json')
const KEVIN_BROWN_AVATAR = resolve('src/assets/images/avatars/kevin-brown.webp')
const BRAND_LOGO_COMPONENT = resolve('src/components/Brand/Logo.astro')
const BRAND_WORDMARK_WEBSTACK_COMPONENT = resolve('src/components/Brand/WordmarkWebstack.astro')
const BRAND_WORDMARK_BUILDERS_COMPONENT = resolve('src/components/Brand/WordmarkBuilders.astro')

const contact = JSON.parse(readFileSync(CONTACT_JSON, 'utf-8')).company
const kevinBrownAvatarDataUri = `data:image/webp;base64,${readFileSync(KEVIN_BROWN_AVATAR).toString('base64')}`

const extractInlineSvg = (filePath, rootClassName) => {
  const source = readFileSync(filePath, 'utf-8')
  const withoutFrontmatter = source.replace(/^---[\s\S]*?---\s*/, '')

  return withoutFrontmatter
    .replace(/class:list=\{\['[^']+', className\]\}/, `class="${rootClassName}"`)
    .replace(/\n\s*/g, ' ')
    .trim()
}

const logoSvg = extractInlineSvg(BRAND_LOGO_COMPONENT, 'logo')
const wordmarkWebstackSvg = extractInlineSvg(BRAND_WORDMARK_WEBSTACK_COMPONENT, 'wordmark__svg')
const wordmarkBuildersSvg = extractInlineSvg(BRAND_WORDMARK_BUILDERS_COMPONENT, 'wordmark__svg')

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const formatPhoneNumber = (phoneNumber) => {
  const parsedPhoneNumber = parsePhoneNumber(phoneNumber)
  return parsedPhoneNumber ? parsedPhoneNumber.format('NATIONAL') : phoneNumber
}

export const buildHeaderTemplate = (title) =>
  `${buildTemplateStyles()}
  <header class="pdf-header" role="banner">
    <div class="pdf-header__inner">
      <div class="pdf-brand" aria-label="Webstack Builders">
        <span class="pdf-brand__logo">${logoSvg}</span>
        <span class="pdf-brand__wordmarks" aria-hidden="true">
          <span class="pdf-brand__wordmark-row">${wordmarkWebstackSvg}</span>
          <span class="pdf-brand__wordmark-row">${wordmarkBuildersSvg}</span>
        </span>
      </div>
      <span class="pdf-header__title">${esc(title)}</span>
    </div>
  </header>`

export const footerTemplate =
`${buildTemplateStyles()}
<footer class="pdf-footer" role="contentinfo">
  <div class="pdf-footer__inner">
    <div class="pdf-layout-footer__left">
      <div class="pdf-layout-footer__avatar">
        <img class="pdf-layout-footer__avatar-img" src="${kevinBrownAvatarDataUri}" alt="Kevin Brown">
      </div>
      <address class="pdf-layout-footer__address">
        <h2 class="pdf-layout-footer__company-name">${esc(contact.name)}</h2>
        <p>${esc(contact.address)}</p>
        <p>${esc(contact.city)}, ${esc(contact.state)} ${esc(contact.index)}</p>
      </address>
    </div>

    <div class="pdf-layout-footer__center" aria-hidden="true">
      Page&nbsp;<span class="pageNumber"></span>&nbsp;of&nbsp;<span class="totalPages"></span>
    </div>

    <address class="pdf-layout-footer__right">
      <p>${esc(contact.email)}</p>
      <p>Toll Free ${esc(formatPhoneNumber(contact.telephoneTollFree))}</p>
      <p>Local ${esc(formatPhoneNumber(contact.telephoneLocal))}</p>
    </address>
  </div>
</footer>`
