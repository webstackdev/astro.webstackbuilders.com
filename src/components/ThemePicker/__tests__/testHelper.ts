export const getThemePickerItemCard = (themeId: string = `default`) => {
  return `
<li class="themepicker__item">
  <button
    class="themepicker__selectBtn"
    aria-label="select color theme '${themeId.toUpperCase()}'"
    data-theme="${themeId}"
  >
    <span class="themepicker__name">${themeId.toUpperCase()}</span>
    <span class="themepicker__palette">
      <span class="themepicker__hue themepicker__hue--primary"></span>
      <span class="themepicker__hue themepicker__hue--secondary"></span>
      <span class="themepicker__hue themepicker__hue--border"></span>
      <span class="themepicker__hue themepicker__hue--textoffset"></span>
      <span class="themepicker__hue themepicker__hue--text"></span>
    </span>
  </button>
</li>
`
}
export const getHeader = () => {
  return `
<header id="header" class="header" role="banner">
  <span id="header__theme-icon" class="header__theme-icon">
    <button class="icon-btn themepicker-toggle__toggle-btn" type="button" aria-expanded="false" aria-owns="theme-menu" aria-label="toggle theme switcher" aria-haspopup="true">
      <svg class="icon icon--theme" role="img" aria-hidden="true" width="24" height="24">
        <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-theme" />
      </svg>
    </button>
  </span>
</header>
`
}
