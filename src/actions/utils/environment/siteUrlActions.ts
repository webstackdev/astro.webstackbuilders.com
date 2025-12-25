import {
  getDevServerPort,
  isVercel
} from '@actions/utils/environment/environmentActions'

export const getSiteUrl = (): string => {
  if (isVercel()) {
    return `https://www.webstackbuilders.com`
  }

  return `http://localhost:${getDevServerPort()}`
}
