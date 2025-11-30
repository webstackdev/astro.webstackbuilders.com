import type { CollectionEntry } from 'astro:content'
import { mockTestimonials } from '@components/Testimonials/client/__fixtures__/mockData'

export type TestimonialCollectionEntry = CollectionEntry<'testimonials'>

type MinimalTestimonialEntry = Pick<TestimonialCollectionEntry, 'id' | 'body' | 'data' | 'collection'> & {
  slug: string
}

const collectionFixture: MinimalTestimonialEntry[] = mockTestimonials.map((testimonial, index) => ({
  id: testimonial.id,
  slug: testimonial.id,
  body: testimonial.content,
  collection: 'testimonials',
  data: {
    name: testimonial.author,
    organization: testimonial.company ?? testimonial.role,
    publishDate: new Date(2024, index, 1),
    tags: ['testimonials'],
    avatar: testimonial.avatar
      ? {
          src: testimonial.avatar,
          alt: `${testimonial.author} avatar`,
        }
      : undefined,
    active: true,
    isDraft: false,
  },
}))

export default collectionFixture as TestimonialCollectionEntry[]
