/**
 * Use by the name of the file and the key: {{ author.avatar }}
 * Expects global site author set in package.json in this format:
 * Kevin Brown <kevin@webstackbuilders.com> (https://webstackbuilders.com/)
 */
import { author as libAuthor } from '../../package.json'

const author = () => {
  const match = libAuthor.match(/^(.*)<(.*)>/)
  if (!match || typeof match[0] === 'undefined' || typeof match[1] === 'undefined')
    throw new Error(`package.json should have 'author' key defined in 'Author Name <author@example.com>' format`)
  const name = match[1]
  const email = match[2]
  return {
    name,
    email,
    avatar: '/avatars/kevin-brown.webp',
    social: {
      twitter: {
        name: 'WebstackDev',
        url: 'https://twitter.com/WebstackDev',
      },
      github: {
        name: 'webstackdev',
        url: 'https://github.com/webstackdev',
      },
      linkedin: {
        name: 'kevin-brown-developer',
        url: 'https://www.linkedin.com/in/kevin-brown-developer/',
      },
    },
  }
}

export default author
