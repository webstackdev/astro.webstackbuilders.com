# Icons

To add an icon to the project, add the SVG file to `src/assets/icons`. Example wrapper:

```html
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
  ...
</svg>
```

These images will be compiled to `public/images/site/icons.sprite.svg` by the `yarn build:sprites` task.

```bash
clear && yarn gulp build:sprites
```

Use as follows:

```astro
import Icon from '@components/Icon'
---

<Icon iconName="feed" />
```

The shortcode will generate content like this: `icon`

```
<svg class="icon icon--feed" role="img" aria-hidden="true" width="24" height="24">
  <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-feed"></use>
</svg>
```

## Resizing SVGs

To shrink the canvas to the largest dimension in the bounding box:

```bash
inkscape --batch-process --export-area-drawing --export-plain-svg --export-filename=src/assets/icons/output.svg src/assets/icons/paper-clip.svg
```

## How to resize without transforms in Inkscape

Do the transform using the "W:" and "H:" boxes in the top toolbar with the lock icon clicked to preserve aspect ratio.

Then, ungroup and then group.

## Available Icons

---
| Icon | Description |
| ---- | ----------- |
| ![alarm-clock](../src/assets/icons/alarm-clock.svg) | `alarm-clock` |
| ![arrow-down](../src/assets/icons/arrow-down.svg) | `arrow-down` |
| ![award](../src/assets/icons/award.svg) | `award` |
| ![arrow-down](../src/assets/icons/arrow-down.svg) | `arrow-down` |
| ![check](../src/assets/icons/check.svg) | `check` |
| ![close](../src/assets/icons/close.svg) | `close` |
| ![codepen](../src/assets/icons/codepen.svg) | `codepen` |
| ![external](../src/assets/icons/external.svg) | `external` |
| ![feed](../src/assets/icons/feed.svg) | `feed` |
| ![github](../src/assets/icons/github.svg) | `github` |
| ![heart](../src/assets/icons/heart.svg) | `heart` |
| ![info](../src/assets/icons/info.svg) | `info` |
| ![keybase](../src/assets/icons/keybase.svg) | `keybase` |
| ![lightbulb](../src/assets/icons/lightbulb.svg) | `lightbulb` |
| ![message](../src/assets/icons/message.svg) | `message` |
| ![pen-and-paper](../src/assets/icons/pen-and-paper.svg) | `pen-and-paper` |
| ![paper-clip](../src/assets/icons/paper-clip.svg) | `paper-clip` |
| ![question](../src/assets/icons/question.svg) | `question` |
| ![repost](../src/assets/icons/repost.svg) | `repost` |
| ![twitter](../src/assets/icons/twitter.svg) | `twitter` |
| ![warning](../src/assets/icons/warning.svg) | `warning` |

