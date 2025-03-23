/**
 * @jest-environment-options {"JSDOM_QUIET_MODE": true}
 *
 * Tests for navigation menu script
 */
import { describe, expect, test } from '@jest/globals'
import { mockIntersectionObserver } from 'jsdom-testing-mocks'
import { addScript, getCurriedFixturePath } from '../../../../../test/jest/helpers'
import { imageLazyload } from '../__fixtures__/lazyload_image_lazy'

const io = mockIntersectionObserver()
const getFixturePath = getCurriedFixturePath(__dirname)

describe(`Lazyload class works`, () => {
  test(`Constructor initializes`, async () => {
    const body = document.querySelector(`body`)!
    body.innerHTML = imageLazyload
    await addScript(getFixturePath(`lazyload_1.ts`), document)
    const imgElement = document.querySelector(`.lazy-picture > img`)! as HTMLImageElement
    expect(imgElement.src).toMatch(`/images/avatars/test-red-dot-24w.jpeg`)
    io.enterNode(imgElement)
    expect(imgElement.src).toMatch(
      `http://localhost:${process.env['ELEVENTY_DEV_SERVER_PORT']}/images/avatars/test-red-dot-550w.jpeg`
    )
  })
})
