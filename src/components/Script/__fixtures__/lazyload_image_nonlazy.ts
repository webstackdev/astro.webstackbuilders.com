export const imageNonLazyload = `
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
    src="/images/avatars/test-red-dot-550w.jpeg"
    width="550"
    height="550"
    alt="test red dot alt text"
    class=""
  >
</picture>"
`
