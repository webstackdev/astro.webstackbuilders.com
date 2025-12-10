import type { ImageMetadata } from 'astro'

const createCover = (src: string, format: ImageMetadata['format'] = 'jpeg'): ImageMetadata => ({
  src,
  width: 1200,
  height: 675,
  format,
})

const sampleCollection = [
  {
    id: 'article-one',
    data: {
      title: 'Article One',
      description: 'First test entry',
      publishDate: new Date('2024-01-01'),
      featured: true,
      cover: createCover('/_astro/article-one.jpg'),
      coverAlt: 'Cover image for Article One',
    },
  },
  {
    id: 'article-two',
    data: {
      title: 'Article Two',
      description: 'Second test entry',
      publishDate: new Date('2024-02-01'),
      featured: true,
      cover: createCover('/_astro/article-two.jpg'),
      coverAlt: 'Cover image for Article Two',
    },
  },
  {
    id: 'article-three',
    data: {
      title: 'Article Three',
      description: 'Third test entry',
      publishDate: new Date('2024-03-01'),
      featured: false,
      cover: createCover('/_astro/article-three.jpg'),
      coverAlt: 'Cover image for Article Three',
    },
  },
  {
    id: 'article-four',
    data: {
      title: 'Article Four',
      description: 'Fourth test entry',
      publishDate: new Date('2024-04-01'),
      featured: false,
      cover: createCover('/_astro/article-four.jpg'),
      coverAlt: 'Cover image for Article Four',
    },
  },
]

export default sampleCollection
