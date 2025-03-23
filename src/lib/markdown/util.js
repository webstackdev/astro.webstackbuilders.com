exports.slugifyTitleAnchors = value => {
  return encodeURIComponent(
    'h-' +
      String(value)
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/&/g, '-and-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
        .replace(/[.,\/#!$%\^\*;:{}=_`~()]/g, '')
  )
}
