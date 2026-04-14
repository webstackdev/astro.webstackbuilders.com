import { getCollection, type CollectionEntry } from 'astro:content'
import { BuildError } from '@lib/errors/BuildError'

const CONTACT_DATA_FILE = 'src/lib/content/contactData.ts'

export type ContactData = CollectionEntry<'contactData'>['data']
export type CompanyContactData = ContactData['company']

const [contactDataEntry] = await getCollection('contactData')

if (!contactDataEntry) {
  throw new BuildError('Missing contact data entry', {
    filePath: CONTACT_DATA_FILE,
  })
}

export const contactData: ContactData = contactDataEntry.data
export const companyContactData: CompanyContactData = contactData.company
