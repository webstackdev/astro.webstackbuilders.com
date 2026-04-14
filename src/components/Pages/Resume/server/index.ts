import type { CollectionEntry } from 'astro:content'

export const getSocialEntries = (contactData: CollectionEntry<'contactData'>['data']) =>
  [...contactData.company.social]
    .sort((left, right) => left.order - right.order)
    .map(entry => ({
      label: entry.displayName,
      url: entry.url,
    }))

export const formatMonthYear = (date?: Date) =>
  date
    ? date.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Present'

export const formatDateContent = (date?: Date) => date?.toISOString().slice(0, 7) ?? ''

export const splitLocation = (location?: string) => {
  if (!location) {
    return { locality: '', region: '' }
  }

  const parts = location.split(',').map(part => part.trim())
  const locality = parts.shift() ?? ''

  return {
    locality,
    region: parts.join(', '),
  }
}
