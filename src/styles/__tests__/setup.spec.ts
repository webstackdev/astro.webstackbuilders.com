import { resolve } from 'path'
import { runSass } from 'sass-true'
import { sync } from 'glob'

describe('Sass test files using True framework', () => {
  const sassTestFiles = sync(resolve(process.cwd(), 'src/assets/scss/__tests__/**/*.spec.scss'))
  sassTestFiles.forEach(file => runSass({ file }, { describe, it }))
})
