/** Output from src/_layouts_components/navigation.njk */

export const navHtml = `
<body>
  <div id="mobile-splash" class="mobile-splash"></div>
  <header id="header" class="header" role="banner">
    <span class="header__brand">
      <a class="brand__anchor" href="/" rel="home" aria-label="Go To Homepage">
        <span class="brand__logo">
          <svg class="logo" title="Webstack Builders Company Logo" viewBox="0 0 88.360085 86.394562" width="88.360085" height="86.394562" xmlns="http://www.w3.org/2000/svg">
            <path class="logo-block-outer" d="M 0,14.625852 V 0 h 8.904504 8.904505 v 14.625852 14.62585 H 8.904504 0 Z" />
            <path class="logo-block-outer" d="M 24.658627,14.625852 V 0 h 20.206374 20.20638 v 14.625852 14.62585 H 44.865001 24.658627 Z" />
            <path class="logo-block-outer" d="M 70.551071,14.625852 V 0 h 8.90451 8.9045 v 14.625852 14.62585 h -8.9045 -8.90451 z" />
            <path class="logo-block-inner" d="m 0,43.197282 v -8.5034 h 20.548856 20.548855 v 8.5034 8.5034 H 20.548856 0 Z" />
            <path class="logo-block-inner" d="m 47.262371,43.197282 v -8.5034 h 20.54885 20.54886 v 8.5034 8.5034 h -20.54886 -20.54885 z" />
            <path class="logo-block-outer" d="m 0,71.768712 v -14.62585 h 8.904504 8.904505 v 14.62585 14.62585 H 8.904504 0 Z" id="path545" />
            <path class="logo-block-outer" d="m 24.658627,71.768712 v -14.62585 h 20.206374 20.20638 v 14.62585 14.62585 H 44.865001 24.658627 Z" />
            <path class="logo-block-outer" d="m 70.551071,71.768712 v -14.62585 h 8.90451 8.9045 v 14.62585 14.62585 h -8.9045 -8.90451 z" />
          </svg>
        </span>
        <span class="brand__wordmark">
          <span class="brand__wordmark-webstack">
            <svg class="wordmark__svg" viewBox="0 0 152.99162 23.424" xmlns="http://www.w3.org/2000/svg">
              <path class="wordmark__svg-path" d="M 27.936,0.96 22.432,19.168 16.832,0.96 H 14.208 L 8.608,19.168 3.104,0.96 H 0 l 7.04,22.08 h 2.976 L 15.488,5.248 20.96,23.04 h 2.976 l 7.04,-22.08 z" />
              <path class="wordmark__svg-path" d="m 47.6159,14.88 c 0,-4.896 -3.648,-8.544 -8.512,-8.544 -4.896,0 -8.576,3.648 -8.576,8.48 0,4.896 3.808,8.608 8.928,8.608 3.168,0 5.856,-1.376 7.488,-3.552 l -1.888,-1.632 c -1.056,1.504 -3.104,2.656 -5.504,2.656 -3.168,0 -5.504,-1.952 -6.048,-4.8 h 14.048 c 0.032,-0.384 0.064,-0.832 0.064,-1.216 z m -8.544,-6.016 c 2.88,0 5.12,1.92 5.632,4.736 h -11.232 c 0.512,-2.784 2.752,-4.736 5.6,-4.736 z" />
              <path class="wordmark__svg-path" d="m 60.22384,6.336 c -2.72,0 -4.96,1.28 -6.336,3.328 V 0 h -2.752 v 23.04 h 2.752 v -2.944 c 1.376,2.048 3.616,3.328 6.336,3.328 4.672,0 8.192,-3.68 8.192,-8.544 0,-4.864 -3.52,-8.544 -8.192,-8.544 z m -0.512,14.432 c -3.328,0 -5.824,-2.528 -5.824,-5.888 0,-3.36 2.496,-5.888 5.824,-5.888 3.36,0 5.856,2.528 5.856,5.888 0,3.36 -2.496,5.888 -5.856,5.888 z" />
              <path class="wordmark__svg-path" d="m 77.40781,23.424 c 3.68,0 6.592,-1.824 6.592,-5.056 0,-3.392 -3.136,-4.192 -5.824,-4.832 -2.176,-0.512 -4.032,-0.96 -4.032,-2.56 0,-1.408 1.568,-2.144 3.456,-2.144 1.792,0 3.328,0.704 4.416,1.76 l 1.536,-2.016 c -1.376,-1.248 -3.392,-2.24 -5.984,-2.24 -3.36,0 -6.24,1.632 -6.24,4.8 0,3.424 3.168,4.256 5.856,4.928 2.144,0.512 3.968,0.992 3.968,2.56 0,1.472 -1.632,2.304 -3.776,2.304 -2.112,0 -3.84,-0.8 -5.056,-2.048 l -1.536,1.984 c 1.504,1.44 3.744,2.56 6.624,2.56 z" />
              <path class="wordmark__svg-path" d="M 96.38374,9.216 V 6.72 h -4.896 V 2.336 h -2.752 V 6.72 h -2.944 v 2.496 h 2.944 v 9.472 c 0,3.008 1.632,4.736 4.8,4.736 1.152,0 2.016,-0.224 2.848,-0.672 V 20.16 c -0.672,0.352 -1.376,0.608 -2.272,0.608 -1.664,0 -2.624,-0.768 -2.624,-2.528 V 9.216 Z" />
              <path class="wordmark__svg-path" d="m 112.7677,6.72 v 2.944 c -1.376,-2.048 -3.616,-3.328 -6.336,-3.328 -4.672,0 -8.16,3.68 -8.16,8.544 0,4.864 3.488,8.544 8.16,8.544 2.72,0 4.96,-1.28 6.336,-3.328 v 2.944 h 2.752 V 6.72 Z m -5.824,14.048 c -3.36,0 -5.856,-2.528 -5.856,-5.888 0,-3.36 2.496,-5.888 5.856,-5.888 3.328,0 5.824,2.528 5.824,5.888 0,3.36 -2.496,5.888 -5.824,5.888 z" />
              <path class="wordmark__svg-path" d="m 127.83968,23.424 c 3.232,0 5.984,-1.6 7.456,-4.096 l -2.4,-1.44 c -0.992,1.728 -2.848,2.88 -5.056,2.88 -3.36,0 -5.856,-2.528 -5.856,-5.888 0,-3.36 2.496,-5.888 5.856,-5.888 2.208,0 4.064,1.152 5.056,2.88 l 2.4,-1.44 c -1.472,-2.496 -4.224,-4.096 -7.456,-4.096 -4.96,0 -8.704,3.68 -8.704,8.544 0,4.864 3.744,8.544 8.704,8.544 z" />
              <path class="wordmark__svg-path" d="m 149.34363,23.04 h 3.648 l -7.552,-8.608 7.328,-7.712 h -3.584 l -7.808,8.288 V 0 h -2.752 v 23.04 h 2.752 v -4.32 l 2.112,-2.24 z" />
            </svg>
          </span>
          <span class="brand__wordmark-builders">
            <svg class="wordmark__svg" viewBox="0 0 117.47175 23.615999" xmlns="http://www.w3.org/2000/svg">
              <path class="wordmark__svg-path" d="M 12.384,11.52 C 13.984,10.752 15.2,8.864 15.2,6.688 15.2,3.488 12.768,1.152 9.536,1.152 H 0 v 22.08 h 10.304 c 3.456,0 6.08,-2.528 6.08,-5.952 0,-2.752 -1.632,-5.088 -4,-5.76 z M 8.864,3.808 c 1.92,0 3.328,1.44 3.328,3.36 0,1.92 -1.504,3.36 -3.328,3.36 H 2.848 V 3.808 Z M 9.632,20.576 H 2.848 v -7.52 h 6.784 c 2.144,0 3.744,1.6 3.744,3.744 0,2.144 -1.6,3.776 -3.744,3.776 z" />
              <path class="wordmark__svg-path" d="m 26.78399,23.616 c 4.448,0 7.392,-2.72 7.392,-6.848 V 6.912 h -2.752 v 9.472 c 0,2.752 -1.856,4.576 -4.64,4.576 -2.784,0 -4.64,-1.824 -4.64,-4.576 V 6.912 h -2.752 v 9.856 c 0,4.128 2.944,6.848 7.392,6.848 z" />
              <path class="wordmark__svg-path" d="m 39.96796,3.648 c 1.024,0 1.824,-0.8 1.824,-1.824 0,-1.056 -0.8,-1.824 -1.824,-1.824 -1.056,0 -1.856,0.768 -1.856,1.824 0,1.024 0.8,1.824 1.856,1.824 z m -1.376,19.584 h 2.752 V 6.912 h -2.752 z" />
              <path class="wordmark__svg-path" d="m 45.98393,23.232 h 2.752 V 0.192 h -2.752 z" />
              <path class="wordmark__svg-path" d="m 66.8799,0.192 v 9.664 c -1.376,-2.048 -3.616,-3.328 -6.336,-3.328 -4.672,0 -8.16,3.68 -8.16,8.544 0,4.864 3.488,8.544 8.16,8.544 2.72,0 4.96,-1.28 6.336,-3.328 v 2.944 h 2.752 V 0.192 Z m -5.824,20.768 c -3.36,0 -5.856,-2.528 -5.856,-5.888 0,-3.36 2.496,-5.888 5.856,-5.888 3.328,0 5.824,2.528 5.824,5.888 0,3.36 -2.496,5.888 -5.824,5.888 z" />
              <path class="wordmark__svg-path" d="m 90.33588,15.072 c 0,-4.896 -3.648,-8.544 -8.512,-8.544 -4.896,0 -8.576,3.648 -8.576,8.48 0,4.896 3.808,8.608 8.928,8.608 3.168,0 5.856,-1.376 7.488,-3.552 l -1.888,-1.632 c -1.056,1.504 -3.104,2.656 -5.504,2.656 -3.168,0 -5.504,-1.952 -6.048,-4.8 h 14.048 c 0.032,-0.384 0.064,-0.832 0.064,-1.216 z m -8.544,-6.016 c 2.88,0 5.12,1.92 5.632,4.736 h -11.232 c 0.512,-2.784 2.752,-4.736 5.6,-4.736 z" />
              <path class="wordmark__svg-path" d="m 102.17582,6.656 c -2.432,0 -4.352,1.12 -5.568,3.072 V 6.912 h -2.752 v 16.32 h 2.752 v -8.16 c 0,-3.392 2.112,-5.568 5.568,-5.568 h 0.544 V 6.656 Z" />
              <path class="wordmark__svg-path" d="m 110.87975,23.616 c 3.68,0 6.592,-1.824 6.592,-5.056 0,-3.392 -3.136,-4.192 -5.824,-4.832 -2.176,-0.512 -4.032,-0.96 -4.032,-2.56 0,-1.408 1.568,-2.144 3.456,-2.144 1.792,0 3.328,0.704 4.416,1.76 l 1.536,-2.016 c -1.376,-1.248 -3.392,-2.24 -5.984,-2.24 -3.36,0 -6.24,1.632 -6.24,4.8 0,3.424 3.168,4.256 5.856,4.928 2.144,0.512 3.968,0.992 3.968,2.56 0,1.472 -1.632,2.304 -3.776,2.304 -2.112,0 -3.84,-0.8 -5.056,-2.048 l -1.536,1.984 c 1.504,1.44 3.744,2.56 6.624,2.56 z" />
            </svg>
          </span>
        </span>
      </a>
    </span>
    <span id="header__main-nav" class="header__main-nav">
      <nav id="main-nav" class="main-nav" role="navigation" aria-label="Main">
        <ul class="main-nav__menu" tabindex="-1" aria-label="main navigation" hidden>
          <li class="main-nav__item">
            <a href="/about/" class="main-nav__link">
              About
            </a>
          </li>
          <li class="main-nav__item">
            <a href="/articles/" class="main-nav__link">
              Articles
            </a>
          </li>
          <li class="main-nav__item">
            <a href="/case-studies/" class="main-nav__link">
              Case Studies
            </a>
          </li>
          <li class="main-nav__item">
            <a href="/services/" class="main-nav__link">
              Services
            </a>
          </li>
          <li class="main-nav__item main-nav__item--active">
            <a href="/contact/" class="main-nav__link">
              Contact
            </a>
          </li>
        </ul>
      </nav>
    </span>
    <span id="header__theme-icon" class="header__theme-icon">
      <button class="icon-btn themepicker-toggle__toggle-btn" type="button" aria-expanded="false" aria-owns="theme-menu" aria-label="toggle theme switcher" aria-haspopup="true">
      <svg class="icon icon--theme" role="img" aria-hidden="true" width="24" height="24">
        <use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#icon-theme" />
      </svg>
      </button>
    </span>
    <span id="header__nav-icon" class="header__nav-icon">
      <button class="nav-icon__toggle-btn" type="button" aria-expanded="false" aria-owns="main-nav" aria-label="toggle menu" aria-haspopup="true">
        <svg class="nav-icon__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50">
          <title>menu toggle</title>
          <g>
            <line class="nav-icon__bar" x1="13" y1="16.5" x2="37" y2="16.5" />
            <line class="nav-icon__bar" x1="13" y1="24.5" x2="37" y2="24.5" />
            <line class="nav-icon__bar" x1="13" y1="24.5" x2="37" y2="24.5" />
            <line class="nav-icon__bar" x1="13" y1="32.5" x2="37" y2="32.5" />
            <circle class="nav-icon__circle" r="23" cx="25" cy="25" />
          </g>
        </svg>
      </button>
    </span>
  </header>
</body>
`
