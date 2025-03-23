/**
 * Embed Youtube as shortcode in markdown by video ID. Usage:
 * {% youtube 'ix5mPa6D7ZA' %}
 */
const outdent = require('outdent')

// @TODO: Need to add computed data with `meta` tag for the JSON-LD schema generator
//        plugin and make sure this runs before it does somehow
//        https://github.com/quasibit/eleventy-plugin-schema/blob/master/demo/video.njk

exports.youtubeShortcode = (_, id) => {
  const output = `
<style>
.video-wrapper {
  position: relative;
  padding-bottom: 56.25%;
}

.video-wrapper iframe {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
<div class="video-wrapper">
  <iframe src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"></iframe>
</div>
  `
  return outdent.string(output)
}
