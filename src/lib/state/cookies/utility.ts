export interface CookieValues {
  [key: string]: string
}

export interface CookieOptions {
  expires?: number | Date | string
  path?: string
  domain?: string
  secure?: boolean
  sameSite?: 'None' | 'Strict' | 'Lax'
}

type KeyValueTuple = [key: string, value: string]

function isString(input: unknown): input is string {
  return 'string' === typeof input
}

function isValidUriString(name: unknown): name is string {
  return isString(name) && name === encodeURIComponent(name)
}

export const getCookie = (name: string): string | undefined => {
  isValidUriString(name)
  const cookies: CookieValues = {}
  document.cookie.split('; ').forEach(keyValue => {
    const tuple: KeyValueTuple = keyValue.split('=') as KeyValueTuple
    cookies[tuple[0]] = decodeURIComponent(tuple[1])
  })
  if (!cookies[name]) return
  return decodeURIComponent(cookies[name]!)
}

export const setCookie = (name: string | CookieValues, value?: string) => {
  const expiresInDays = 60 * 60 * 24 * 180
  const cookieText = (name: string, value: string): string => {
    return `${name}=${encodeURIComponent(value)};Max-Age=${expiresInDays};SameSite=Strict;`
  }

  if ('object' === typeof name) {
    Object.keys(name).forEach(function (eachName) {
      isValidUriString(eachName)
      // @ts-ignore
      document.cookie = cookieText(eachName, name[eachName])
    })
  } else if (isValidUriString(name) && isString(value)) {
    document.cookie = cookieText(name, value)
  } else {
    throw new Error(`'name' parameter to setCookie() is not a string or an object: ${name}`)
  }
}

export const removeCookie = (name: string | string[]) => {
  const removeCookieText = (name: string) => {
    return `${name}=;Max-Age=-99999999;`
  }
  if (name instanceof Array) {
    name.forEach(function (eachName) {
      isValidUriString(eachName)
      document.cookie = removeCookieText(eachName)
    })
  } else if (isValidUriString(name)) {
    document.cookie = removeCookieText(name)
  } else {
    throw new Error(`'name' parameter to removeCookie() is not a string or an object: ${name}`)
  }
}
