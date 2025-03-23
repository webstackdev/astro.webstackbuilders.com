export const imageLazyload = `
<picture class="lazy-picture" data-lazy-state="unseen">
  <source
    type="image/webp"
    srcset="/images/avatars/test-red-dot-24w.webp 24w"
    data-srcset="/images/avatars/test-red-dot-24w.webp 24w, /images/avatars/test-red-dot-400w.webp 400w, /images/avatars/test-red-dot-550w.webp 550w"
    sizes="100vw"
    class="lazy"
  >
  <source
    type="image/jpeg"
    srcset="/images/avatars/test-red-dot-24w.jpeg 24w"
    data-srcset="/images/avatars/test-red-dot-24w.jpeg 24w, /images/avatars/test-red-dot-400w.jpeg 400w, /images/avatars/test-red-dot-550w.jpeg 550w"
    sizes="100vw"
    class="lazy"
  >
  <img
    src="/images/avatars/test-red-dot-24w.jpeg"
    data-src="/images/avatars/test-red-dot-550w.jpeg"
    width="550"
    height="550"
    alt="test red dot alt text"
    class="lazy "
    loading="lazy"
  >
</picture>
<noscript>
  <picture>
    <source
      type="image/webp"
      srcset="/images/avatars/test-red-dot-24w.webp 24w, /images/avatars/test-red-dot-400w.webp 400w, /images/avatars/test-red-dot-550w.webp 550w"
      sizes="100vw"
    >
    <source
      type="image/jpeg"
      srcset="/images/avatars/test-red-dot-24w.jpeg 24w, /images/avatars/test-red-dot-400w.jpeg 400w, /images/avatars/test-red-dot-550w.jpeg 550w"
      sizes="100vw"
    >
    <img
      src="data:image/png;base64,/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAYABgDASIAAhEBAxEB/8QAGAABAQADAAAAAAAAAAAAAAAAAAYCAwf/xAAhEAABBAICAgMAAAAAAAAAAAABAAIDBBESBjIFIRMUUf/EABkBAAEFAAAAAAAAAAAAAAAAAAYBAwQFB//EACARAAEEAgIDAQAAAAAAAAAAAAEAAgMEBREGIRIUMVH/2gAMAwEAAhEDEQA/AOGcX8Ewwts2m5ceoKqvgj111Gv4sKRaasemMY9YW5DFid8khJK3PD4yvTqtawA7HZ/VJco8AwROs1G4I7NCKnuloqyF+Nce8op9W5IGaPaE85x+r7Pkw+Ox8UnxnkDIYxXuOwB1cqn71Yx7iZuqIlu1ow/YTfHc3aFcxkghvzaluTcgZKw1qhJB7OREVhDCxjAAEJ5LI2Ldh0kru1//2Q=="
      width="550"
      height="550"
      alt="test red dot alt text"
      class=""
    >
  </picture>
</noscript>
`
