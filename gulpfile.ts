import { task } from 'gulp'

//import buildManifestIcons from './scripts/build/tasks/build:manifest-icons'
//import buildServiceworker from './scripts/build/tasks/build:service-worker'
//import buildSocialImages from './scripts/build/tasks/build:social-images'
//import buildSocialStyles from './scripts/build/tasks/build:social-styles'
import buildSprites from './scripts/build/tasks/build:sprites'

//task(`build:manifest-icons`, buildManifestIcons)
//task(`build:service-worker`, buildServiceworker)
//task(`build:social-images`, buildSocialImages)
//task(`build:social-styles`, buildSocialStyles)
task(`build:sprites`, buildSprites)
