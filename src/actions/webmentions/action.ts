import defaultAvatar from '@assets/images/avatars/webmention-avatar-default.svg'
import { defineAction } from 'astro:actions'
import { z } from 'astro/zod'
import { throwActionError } from '@actions/utils/errors'
import type { Webmention } from '@components/WebMentions/@types'
import { fetchWebmentions } from '@components/WebMentions/server'
import type { WebmentionDisplayItem, WebmentionsListResult } from './@types'

const listInputSchema = z.object({
  url: z.string().trim().url(),
})

const displayProperties = new Set(['mention-of', 'in-reply-to'])

const mapMentionToDisplayItem = (mention: Webmention): WebmentionDisplayItem => ({
  authorName: mention.author?.name?.trim() || 'Anonymous',
  authorUrl: mention.author?.url?.trim() || mention['wm-source'] || '#',
  avatarUrl: mention.author?.photo?.trim() || defaultAvatar.src,
  contentHtml: mention.content?.value?.trim() || '',
  id: mention['wm-id'],
  published: mention.published,
  sourceUrl: mention['wm-source'] || mention.author?.url?.trim() || '#',
})

export const webmentions = {
  list: defineAction({
    accept: 'json',
    input: listInputSchema,
    handler: async (input): Promise<WebmentionsListResult> => {
      try {
        const mentions = await fetchWebmentions(input.url)
        const displayMentions = mentions.filter(mention => displayProperties.has(mention['wm-property']))
        const likesCount = mentions.filter(mention => mention['wm-property'] === 'like-of').length
        const repostsCount = mentions.filter(mention => mention['wm-property'] === 'repost-of').length

        return {
          likesCount,
          mentions: displayMentions.map(mapMentionToDisplayItem),
          repostsCount,
        }
      } catch (error) {
        throwActionError(
          error,
          { route: '/_actions/webmentions/list', operation: 'list' },
          { fallbackMessage: 'Webmentions could not be loaded.' }
        )
      }
    },
  }),
}