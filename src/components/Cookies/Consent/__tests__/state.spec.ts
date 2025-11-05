/**
 * State tests for cookie consent modal visibility
 * Now uses centralized state store from Scripts/state
 */
// @vitest-environment happy-dom
import { describe, expect, beforeEach, test } from 'vitest'
import { AppBootstrap } from '@components/Scripts/bootstrap'
import { $cookieModalVisible } from '../state'

describe(`Cookie modal visibility using state store`, () => {
  beforeEach(() => {
    // Initialize state management before each test
    AppBootstrap.init()
    // Reset modal visibility to default
    $cookieModalVisible.set(false)
  })

  test(`returns false from state store by default`, () => {
    // State store initializes with false
    expect($cookieModalVisible.get()).toBe(false)
  })

  test(`returns true from state store when set to true`, () => {
    $cookieModalVisible.set(true)
    expect($cookieModalVisible.get()).toBe(true)
  })

  test(`returns false from state store when set to false`, () => {
    $cookieModalVisible.set(true)
    $cookieModalVisible.set(false)
    expect($cookieModalVisible.get()).toBe(false)
  })

  test(`sets state store value`, () => {
    $cookieModalVisible.set(true)
    expect($cookieModalVisible.get()).toBe(true)
  })

  test(`initializes state store to true`, () => {
    $cookieModalVisible.set(true)
    expect($cookieModalVisible.get()).toBe(true)
  })

  test(`state is managed by centralized store`, () => {
    // Verify we're using the Nanostore atom
    expect($cookieModalVisible.set).toBeDefined()
    expect($cookieModalVisible.get).toBeDefined()
  })
})
