import type { AstroIntegration, AstroConfig } from 'astro'
import { z } from 'astro/zod'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { BuildError } from '../../lib/errors/BuildError'

const TestimonialsLengthWarningOptionsSchema = z
  .object({
    /**
     * Minimum character count (after whitespace normalization).
     * Testimonial text that's too short will cause layout problems.
     * @default 350
     */
    min: z.number().int().nonnegative().default(350),

    /**
     * Maximum character count (after whitespace normalization).
     * Testimonial text that's too long will cause layout problems for other testimonials.
     * @default 400
     */
    max: z.number().int().positive().default(400),
  })
  .refine(options => options.min <= options.max, {
    message: '`min` must be less than or equal to `max`',
  })

export type TestimonialsLengthWarningOptions = z.infer<typeof TestimonialsLengthWarningOptionsSchema>

export type TestimonialsLengthWarningOptionsInput = z.input<
  typeof TestimonialsLengthWarningOptionsSchema
>

export function stripFrontmatter(raw: string): string {
  const trimmed = raw.trimStart()

  if (!trimmed.startsWith('---')) {
    return raw
  }

  const lines = trimmed.split('\n')
  if (lines.length < 3) {
    return raw
  }

  // Find the closing frontmatter delimiter.
  let endIndex = -1
  for (let index = 1; index < lines.length; index += 1) {
    if (lines[index]?.trim() === '---') {
      endIndex = index
      break
    }
  }

  if (endIndex === -1) {
    return raw
  }

  return lines.slice(endIndex + 1).join('\n').trim()
}

export function getVisibleCharacterCount(rawBody: string): number {
  // Keep it simple: match what we store in `testimonial.body` today.
  // Normalize whitespace so trailing newlines don’t inflate counts.
  return rawBody.replace(/\s+/g, ' ').trim().length
}

const isMarkdownFile = (fileName: string): boolean => fileName.endsWith('.md') || fileName.endsWith('.mdx')

async function getTestimonialContentFiles(contentRoot: string): Promise<string[]> {
  const testimonialsRoot = join(contentRoot, 'testimonials')

  const orgDirs = await readdir(testimonialsRoot, { withFileTypes: true })
  const testimonialFiles: string[] = []

  for (const dirEntry of orgDirs) {
    if (!dirEntry.isDirectory()) {
      continue
    }

    const orgDir = join(testimonialsRoot, dirEntry.name)
    const orgChildren = await readdir(orgDir, { withFileTypes: true })

    for (const childEntry of orgChildren) {
      if (!childEntry.isFile()) {
        continue
      }

      if (!isMarkdownFile(childEntry.name)) {
        continue
      }

      testimonialFiles.push(join(orgDir, childEntry.name))
    }
  }

  return testimonialFiles
}

export function testimonialsLengthWarning(
  options: TestimonialsLengthWarningOptionsInput = {}
): AstroIntegration {
  const resolvedOptions = TestimonialsLengthWarningOptionsSchema.parse(options)

  let astroConfig: AstroConfig
  let projectRoot: string

  return {
    name: 'testimonials-length-warning',
    hooks: {
      'astro:config:setup': ({ config }) => {
        astroConfig = config
        projectRoot = fileURLToPath(config.root)
      },
      'astro:build:start': async ({ logger }) => {
        const contentRoot = fileURLToPath(new URL('./src/content', astroConfig.root))
        const { min, max } = resolvedOptions

        let testimonialFiles: string[]
        try {
          testimonialFiles = await getTestimonialContentFiles(contentRoot)
        } catch (error) {
          logger.warn(
            `Testimonials Length Warning: Could not scan testimonial content files: ${error instanceof Error ? error.message : String(error)}`
          )
          return
        }

        const tooShort: Array<{ filePath: string; length: number }> = []
        const tooLong: Array<{ filePath: string; length: number }> = []

        for (const absolutePath of testimonialFiles) {
          try {
            const raw = await readFile(absolutePath, 'utf8')
            const body = stripFrontmatter(raw)
            const length = getVisibleCharacterCount(body)

            const relativePath = relative(projectRoot, absolutePath)

            if (length < min) {
              tooShort.push({ filePath: relativePath, length })
            }

            if (length > max) {
              tooLong.push({ filePath: relativePath, length })
            }
          } catch (error) {
            logger.warn(
              `Testimonials Length Warning: Could not read ${relative(projectRoot, absolutePath)}: ${error instanceof Error ? error.message : String(error)}`
            )
          }
        }

        if (tooShort.length > 0 || tooLong.length > 0) {
          const lines: string[] = []

          lines.push(
            `Testimonials length validation failed (min: ${min}, max: ${max}).`
          )
          lines.push('')

          if (tooShort.length > 0) {
            lines.push(
              `Too short (${tooShort.length}): Testimonial text that's too short will cause layout problems.`
            )
            for (const entry of tooShort) {
              lines.push(`- ${entry.filePath}: ${entry.length} characters (min: ${min})`)
            }
            lines.push('')
          }

          if (tooLong.length > 0) {
            lines.push(
              `Too long (${tooLong.length}): Testimonial text that's too long will cause layout problems for other testimonials.`
            )
            for (const entry of tooLong) {
              lines.push(`- ${entry.filePath}: ${entry.length} characters (max: ${max})`)
            }
            lines.push('')
          }

          throw new BuildError(lines.join('\n'), {
            phase: 'validation',
            tool: 'testimonials-length-warning',
          })
        }
      },
    },
  }
}
