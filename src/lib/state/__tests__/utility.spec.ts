import { describe, expect, test } from "vitest"
import { getCookie, setCookie, removeCookie } from "../cookies/utility"

const expiresInDays = 60 * 60 * 24 * 180

describe(`Consent cookies handlers work`, () => {
  test(`gets cookie by key`, () => {
    document.cookie = `test1=true;max-age=${expiresInDays};SameSite=Strict`
    document.cookie = `test2=false;max-age=${expiresInDays};SameSite=Strict`
    expect(getCookie(`test1`)).toMatch(/true/)
  })

  test(`sets cookie with string name and value`, () => {
    setCookie(`test1`, `true`)
    expect(document.cookie).toMatch(/test1=true/)
  })

  test(`sets cookie with object keyed by name`, () => {
    setCookie({ test1: `true`, test2: `false` })
    expect(document.cookie).toMatchInlineSnapshot(`"test1=true; test2=false"`)
  })

  test(`throws if cookie name is not URI safe`, () => {
    expect(() => setCookie(`in valid`)).toThrow()
  })

  test(`removes cookie with string name`, () => {
    document.cookie = `test1=true;max-age=${expiresInDays};SameSite=Strict`
    document.cookie = `test2=false;max-age=${expiresInDays};SameSite=Strict`
    removeCookie(`test1`)
    expect(document.cookie).toMatch(/test2=false/)
  })

  test(`removes cookie with array by name`, () => {
    document.cookie = `test1=true;max-age=${expiresInDays};SameSite=Strict`
    document.cookie = `test2=false;max-age=${expiresInDays};SameSite=Strict`
    removeCookie([`test1`, `test2`])
    expect(document.cookie).toBeFalsy()
  })
})
