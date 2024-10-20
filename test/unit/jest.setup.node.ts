/**
 * This file is called by `setupFilesAfterEnv`, which is executed before each test
 * file is executed but after the testing framework is installed in the environment.
 */
import { jest } from '@jest/globals'
import './utils/extendMatchers'

jest.setTimeout(30 * 1000)
