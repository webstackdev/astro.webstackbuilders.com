import type { CollectionEntry } from 'astro:content'
import rawContactData from '@content/contact.json'

export type ContactData = CollectionEntry<'contactData'>['data']
export type CompanyContactData = ContactData['company']

export const contactData: ContactData = rawContactData
export const companyContactData: CompanyContactData = contactData.company
