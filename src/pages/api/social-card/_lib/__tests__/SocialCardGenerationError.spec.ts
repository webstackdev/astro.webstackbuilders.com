import { describe, expect, it } from 'vitest'
import {
  getSocialCardErrorDetails,
  SocialCardGenerationError,
} from '@pages/api/social-card/_lib/SocialCardGenerationError'

describe('getSocialCardErrorDetails', () => {
  it('returns structured metadata for social-card generation errors', () => {
    const error = new SocialCardGenerationError(
      'load-fonts',
      'Failed to load a local font file for social card generation',
      {
        fontPath: '/tmp/title-font.ttf',
        candidateCount: 2,
      },
      {
        cause: new Error('ENOENT'),
      }
    )

    expect(getSocialCardErrorDetails(error)).toEqual({
      socialCardStage: 'load-fonts',
      socialCardMessage: 'Failed to load a local font file for social card generation',
      socialCardCause: 'ENOENT',
      socialCardDetails: {
        fontPath: '/tmp/title-font.ttf',
        candidateCount: 2,
      },
    })
  })

  it('returns an empty object for non-social-card errors', () => {
    expect(getSocialCardErrorDetails(new Error('boom'))).toEqual({})
  })
})