/**
 * Tests for navigation template
 */
import { describe, expect, test } from '@jest/globals'
import { resolve } from 'path'
//import { screen } from '@testing-library/dom'
import { loadDom } from '../../../test/jest/helpers'

describe(`Navigation template works`, () => {
  test(`navigation template renders`, async () => {
    const templatePath = resolve(process.cwd(), `src/_layouts/components/navigation.njk`)
    await loadDom(templatePath, document)
    expect(document.querySelector(`.main-nav`)).toBeTruthy()
    //expect(screen.getByRole('button')).toMatchInlineSnapshot()

    expect(document.querySelector(`body`)!.innerHTML).toMatchInlineSnapshot(`
      "<nav class="main-nav" role="navigation">
        <div class="main-nav__content">
          
        </div>
        <button class="icon-btn main-nav__toggleBtn" aria-expanded="false" aria-controls="nav-menu" aria-label="toggle menu">
          <span class="main-nav__menu-icon">
            <span class="main-nav__menuicon-bar"></span>
            <span class="main-nav__menuicon-bar"></span>
            <span class="main-nav__menuicon-bar"></span>
            <span class="main-nav__menuicon-bar"></span>
          </span>
        </button>
        <div class="main-nav__bg">
            <div class="main-nav__bg-circle"></div>
        </div>
      </nav>"
    `)
  })
})
