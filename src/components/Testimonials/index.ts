import Glide from '@glidejs/glide'
import { addDelayedExecutionScripts } from '@lib/utils/delayedLoader'

/**
 * Initialize Glide carousel for testimonials
 */
export function initTestimonialsCarousel(): void {
  const testimonialCarousel = document.querySelector('.glide') as HTMLElement

  if (testimonialCarousel) {
    new Glide(testimonialCarousel, {
      type: 'carousel',
      startAt: 0,
      perView: 1,
      autoplay: 5000,
      hoverpause: true,
      animationDuration: 600,
      gap: 0,
    }).mount()
  }
}

// Register carousel initialization with delayed loader
addDelayedExecutionScripts([initTestimonialsCarousel])
