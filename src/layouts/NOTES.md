# Notes

## Test for the current layout:

```nunjucks
{%- if layout == 'layouts/articles/item' -%}
  ...
{%- endif -%}
```

Output from the `layouts` variable in `base.njk`:

```bash
layouts/articles/list
layouts/articles/item
layouts/case-studies/list
layouts/case-studies/item
layouts/services/list
layouts/services/item

layouts/about.njk
layouts/contact.njk
layouts/cookies.njk
layouts/home.njk
layouts/offline.njk
layouts/privacy.njk
layouts/404.njk
```
