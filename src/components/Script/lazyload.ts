import type { ScriptInit } from '../@types/general'
import { isImageElement } from '../utils/assertions/elements'

/** Create config object: `rootMargin` and threshold` are exposed by the interface */
const config = {
  rootMargin: '0px 0px 50px 0px',
  threshold: 0,
}

/** Copies the `data-src` attribute to the `src` attribute on <img> elements. */
const preloadImage = (img: Element) => {
  if (!isImageElement(img)) return
  const src = img.getAttribute('data-src')
  if (src) img.src = src
}

export const initImagesLazyLoad: ScriptInit = () => {
  /** Register the config object with an instance of `intersectionObserver` */
  const observer = new IntersectionObserver(function (entries, self) {
    /** Iterate over each entry to preload if in view */
    entries.forEach(entry => {
      /**
       * Process just the images that are intersecting. `isIntersecting` is a
       * property exposed by the interface.
       */
      if (entry.isIntersecting) {
        /** Custom function that copies the path to the img, from `data-src` to `src` */
        preloadImage(entry.target)
        /** The image is now in place, stop watching */
        self.unobserve(entry.target)
      }
    })
  }, config)

  /** Lazy-load images have their `data-src` attribute set to the real URL */
  const images = document.querySelectorAll('[data-src]')
  /** Add all of the lazy load images as observables to the intersection observer */
  images.forEach(image => {
    observer.observe(image)
  })
}
