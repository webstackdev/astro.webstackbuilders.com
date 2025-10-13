/**
 * Test helper utilities for setting up Navigation component DOM in tests
 * Creates minimal DOM structure needed for testing navigation JavaScript behavior
 */

/**
 * Generates Menu HTML with navigation items
 * @param path - The current path for active menu highlighting
 * @returns string - The HTML for the navigation menu
 */
function getMenuHTML(path: string = '/'): string {
  const navigationItems = [
    { url: '/about/', text: 'About' },
    { url: '/articles/', text: 'Articles' },
    { url: '/case-studies/', text: 'Case Studies' },
    { url: '/services/', text: 'Services' },
    { url: '/contact/', text: 'Contact' },
  ]

  const activeMenuItem = (itemUrl: string) => {
    return path.startsWith(itemUrl) ? 'aria-current="page"' : ''
  }

  const menuItems = navigationItems
    .map(
      ({ url, text }) => `
    <li>
      <a href="${url}" ${activeMenuItem(url)} tabindex="0">${text}</a>
    </li>`
    )
    .join('')

  return `
    <nav id="main-nav" class="main-nav" role="navigation" aria-label="Main">
      <ul class="main-nav-menu">
        ${menuItems}
      </ul>
    </nav>
  `
}

/**
 * Generates NavToggle HTML with button and SVG icon
 * @returns string - The HTML for the toggle button
 */
function getNavToggleHTML(): string {
  return `
    <span id="header__nav-icon" class="nav-toggle-wrapper">
      <button
        class="nav-toggle-btn"
        type="button"
        aria-label="Toggle navigation menu"
        aria-controls="main-nav"
        aria-expanded="false"
      >
        <svg class="nav-toggle-svg" viewBox="0 0 100 100" aria-hidden="true">
          <line class="nav-toggle-bar nav-toggle-bar--top" x1="20" y1="30" x2="80" y2="30" />
          <line class="nav-toggle-bar nav-toggle-bar--middle" x1="20" y1="50" x2="80" y2="50" />
          <line class="nav-toggle-bar nav-toggle-bar--bottom" x1="20" y1="70" x2="80" y2="70" />
          <line class="nav-toggle-bar nav-toggle-bar--x" x1="20" y1="50" x2="80" y2="50" />
          <circle class="nav-toggle-circle" cx="50" cy="50" r="48" />
        </svg>
      </button>
    </span>
  `
}

/**
 * Generates the full navigation HTML structure for testing
 * @param path - The current path for active menu highlighting
 * @returns string - The complete HTML including header wrapper
 */
function getFullNavigationHTML(path: string = '/'): string {
  return `
    <body>
      <header id="header" class="header">
        <div id="mobile-splash" class="mobile-splash"></div>
        <span id="header__main-nav">
          ${getMenuHTML(path)}
        </span>
        ${getNavToggleHTML()}
      </header>
    </body>
  `
}

/**
 * Sets up the navigation DOM structure in the test document
 * @param path - The current path for active menu highlighting
 */
export function setupNavigationDOM(path: string = '/'): void {
  document.body.innerHTML = getFullNavigationHTML(path)
}
