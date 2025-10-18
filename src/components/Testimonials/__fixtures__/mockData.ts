/**
 * Mock data for testimonials component testing
 */

export interface TestimonialData {
  id: string
  content: string
  author: string
  role: string
  company?: string
  avatar?: string
}

/**
 * Mock testimonial data for testing
 */
export const mockTestimonials: TestimonialData[] = [
  {
    id: 'testimonial-1',
    content: 'Outstanding work on our website redesign. The team delivered beyond expectations.',
    author: 'Sarah Johnson',
    role: 'CEO',
    company: 'Tech Innovations Inc.',
    avatar: '/avatars/sarah.jpg',
  },
  {
    id: 'testimonial-2',
    content: 'Professional, reliable, and creative. They transformed our digital presence.',
    author: 'Mike Chen',
    role: 'Marketing Director',
    company: 'Growth Solutions',
    avatar: '/avatars/mike.jpg',
  },
  {
    id: 'testimonial-3',
    content: 'Exceptional quality and attention to detail. Highly recommended for any project.',
    author: 'Emma Rodriguez',
    role: 'Founder',
    company: 'Creative Studio',
    avatar: '/avatars/emma.jpg',
  },
]
