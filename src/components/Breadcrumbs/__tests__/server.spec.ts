/**
 * Unit tests for Breadcrumbs server utilities
 */
import { describe, expect, it } from 'vitest'
import { generateBreadcrumbs, generateBreadcrumbLabel } from '@components/Breadcrumbs/server'

describe('generateBreadcrumbLabel', () => {
  describe('Page Title Override', () => {
    it('should use provided page title when given', () => {
      const result = generateBreadcrumbLabel('some-slug', '/articles/some-slug', 'Custom Title')
      expect(result).toBe('Custom Title')
    })

    it('should prioritize page title over path mappings', () => {
      const result = generateBreadcrumbLabel('about', '/about', 'Custom About Title')
      expect(result).toBe('Custom About Title')
    })

    it('should handle empty string page title', () => {
      const result = generateBreadcrumbLabel('test', '/test', '')
      expect(result).toBe('')
    })
  })

  describe('Known Path Mappings', () => {
    it('should map /about to "About"', () => {
      const result = generateBreadcrumbLabel('about', '/about')
      expect(result).toBe('About')
    })

    it('should map /services to "Services"', () => {
      const result = generateBreadcrumbLabel('services', '/services')
      expect(result).toBe('Services')
    })

    it('should map /articles to "Articles"', () => {
      const result = generateBreadcrumbLabel('articles', '/articles')
      expect(result).toBe('Articles')
    })

    it('should map /case-studies to "Case Studies"', () => {
      const result = generateBreadcrumbLabel('case-studies', '/case-studies')
      expect(result).toBe('Case Studies')
    })

    it('should map /contact to "Contact"', () => {
      const result = generateBreadcrumbLabel('contact', '/contact')
      expect(result).toBe('Contact')
    })

    it('should map /privacy to "Privacy Policy"', () => {
      const result = generateBreadcrumbLabel('privacy', '/privacy')
      expect(result).toBe('Privacy Policy')
    })

    it('should map /cookies to "Cookie Policy"', () => {
      const result = generateBreadcrumbLabel('cookies', '/cookies')
      expect(result).toBe('Cookie Policy')
    })

    it('should map /tags to "Tags"', () => {
      const result = generateBreadcrumbLabel('tags', '/tags')
      expect(result).toBe('Tags')
    })
  })

  describe('Title Case Conversion', () => {
    it('should convert single word to title case', () => {
      const result = generateBreadcrumbLabel('blog', '/blog')
      expect(result).toBe('Blog')
    })

    it('should convert hyphenated words to title case with spaces', () => {
      const result = generateBreadcrumbLabel('my-article', '/articles/my-article')
      expect(result).toBe('My Article')
    })

    it('should handle multiple hyphens', () => {
      const result = generateBreadcrumbLabel('this-is-a-test', '/test/this-is-a-test')
      expect(result).toBe('This Is A Test')
    })

    it('should handle single character segments', () => {
      const result = generateBreadcrumbLabel('a', '/a')
      expect(result).toBe('A')
    })

    it('should handle already capitalized words', () => {
      const result = generateBreadcrumbLabel('API-Documentation', '/docs/API-Documentation')
      expect(result).toBe('API Documentation')
    })

    it('should handle numbers in segment', () => {
      const result = generateBreadcrumbLabel('article-123', '/articles/article-123')
      expect(result).toBe('Article 123')
    })

    it('should handle empty segment', () => {
      const result = generateBreadcrumbLabel('', '/test')
      expect(result).toBe('')
    })
  })

  describe('Edge Cases', () => {
    it('should handle segment with trailing hyphen', () => {
      const result = generateBreadcrumbLabel('test-', '/test-')
      expect(result).toBe('Test ')
    })

    it('should handle segment with leading hyphen', () => {
      const result = generateBreadcrumbLabel('-test', '/-test')
      expect(result).toBe(' Test')
    })

    it('should handle segment with consecutive hyphens', () => {
      const result = generateBreadcrumbLabel('test--article', '/test--article')
      expect(result).toBe('Test  Article')
    })
  })
})

describe('generateBreadcrumbs', () => {
  describe('Home Page / Root Path', () => {
    it('should return only Home breadcrumb for root path', () => {
      const result = generateBreadcrumbs('/')
      expect(result).toEqual([{ label: 'Home', href: '/', isCurrentPage: false }])
    })

    it('should return only Home breadcrumb for empty path', () => {
      const result = generateBreadcrumbs('')
      expect(result).toEqual([{ label: 'Home', href: '/', isCurrentPage: false }])
    })

    it('should handle multiple leading slashes', () => {
      const result = generateBreadcrumbs('///')
      expect(result).toEqual([{ label: 'Home', href: '/', isCurrentPage: false }])
    })

    it('should handle multiple trailing slashes', () => {
      const result = generateBreadcrumbs('///')
      expect(result).toEqual([{ label: 'Home', href: '/', isCurrentPage: false }])
    })
  })

  describe('Single Level Paths', () => {
    it('should generate breadcrumbs for /about', () => {
      const result = generateBreadcrumbs('/about')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'About', href: '/about', isCurrentPage: true },
      ])
    })

    it('should generate breadcrumbs for /services', () => {
      const result = generateBreadcrumbs('/services')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Services', href: '/services', isCurrentPage: true },
      ])
    })

    it('should handle path without leading slash', () => {
      const result = generateBreadcrumbs('about')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'About', href: '/about', isCurrentPage: true },
      ])
    })

    it('should handle path with trailing slash', () => {
      const result = generateBreadcrumbs('/about/')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'About', href: '/about', isCurrentPage: true },
      ])
    })
  })

  describe('Multi-Level Paths', () => {
    it('should generate breadcrumbs for /articles/my-post', () => {
      const result = generateBreadcrumbs('/articles/my-post')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Articles', href: '/articles', isCurrentPage: false },
        { label: 'My Post', href: '/articles/my-post', isCurrentPage: true },
      ])
    })

    it('should generate breadcrumbs for /case-studies/client-name/project', () => {
      const result = generateBreadcrumbs('/case-studies/client-name/project')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Case Studies', href: '/case-studies', isCurrentPage: false },
        { label: 'Client Name', href: '/case-studies/client-name', isCurrentPage: false },
        { label: 'Project', href: '/case-studies/client-name/project', isCurrentPage: true },
      ])
    })

    it('should generate breadcrumbs for deeply nested path', () => {
      const result = generateBreadcrumbs('/a/b/c/d/e')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'A', href: '/a', isCurrentPage: false },
        { label: 'B', href: '/a/b', isCurrentPage: false },
        { label: 'C', href: '/a/b/c', isCurrentPage: false },
        { label: 'D', href: '/a/b/c/d', isCurrentPage: false },
        { label: 'E', href: '/a/b/c/d/e', isCurrentPage: true },
      ])
    })
  })

  describe('Page Title Override', () => {
    it('should use page title for the last breadcrumb', () => {
      const result = generateBreadcrumbs('/articles/my-post', 'Amazing Article Title')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Articles', href: '/articles', isCurrentPage: false },
        { label: 'Amazing Article Title', href: '/articles/my-post', isCurrentPage: true },
      ])
    })

    it('should not use page title for intermediate breadcrumbs', () => {
      const result = generateBreadcrumbs('/articles/category/my-post', 'Custom Title')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Articles', href: '/articles', isCurrentPage: false },
        { label: 'Category', href: '/articles/category', isCurrentPage: false },
        { label: 'Custom Title', href: '/articles/category/my-post', isCurrentPage: true },
      ])
    })

    it('should handle empty page title', () => {
      const result = generateBreadcrumbs('/articles/my-post', '')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Articles', href: '/articles', isCurrentPage: false },
        { label: '', href: '/articles/my-post', isCurrentPage: true },
      ])
    })
  })

  describe('isCurrentPage Flag', () => {
    it('should mark only the last item as current page', () => {
      const result = generateBreadcrumbs('/articles/my-post')
      expect(result.length).toBe(3)
      expect(result[0]?.isCurrentPage).toBe(false) // Home
      expect(result[1]?.isCurrentPage).toBe(false) // Articles
      expect(result[2]?.isCurrentPage).toBe(true) // My Post
    })

    it('should mark single level path as current page', () => {
      const result = generateBreadcrumbs('/about')
      expect(result.length).toBe(2)
      expect(result[0]?.isCurrentPage).toBe(false) // Home
      expect(result[1]?.isCurrentPage).toBe(true) // About
    })

    it('should never mark Home as current page', () => {
      const result = generateBreadcrumbs('/')
      expect(result.length).toBe(1)
      expect(result[0]?.isCurrentPage).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle paths with special characters', () => {
      const result = generateBreadcrumbs('/articles/hello-world-2024')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Articles', href: '/articles', isCurrentPage: false },
        { label: 'Hello World 2024', href: '/articles/hello-world-2024', isCurrentPage: true },
      ])
    })

    it('should filter out empty segments from double slashes', () => {
      const result = generateBreadcrumbs('/articles//my-post')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Articles', href: '/articles', isCurrentPage: false },
        { label: 'My Post', href: '/articles/my-post', isCurrentPage: true },
      ])
    })

    it('should handle paths with mixed slashes', () => {
      const result = generateBreadcrumbs('//articles///my-post//')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Articles', href: '/articles', isCurrentPage: false },
        { label: 'My Post', href: '/articles/my-post', isCurrentPage: true },
      ])
    })
  })

  describe('Real-World Scenarios', () => {
    it('should handle article with hyphenated title', () => {
      const result = generateBreadcrumbs(
        '/articles/building-scalable-web-applications',
        'Building Scalable Web Applications: A Complete Guide'
      )
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Articles', href: '/articles', isCurrentPage: false },
        {
          label: 'Building Scalable Web Applications: A Complete Guide',
          href: '/articles/building-scalable-web-applications',
          isCurrentPage: true,
        },
      ])
    })

    it('should handle case study path', () => {
      const result = generateBreadcrumbs('/case-studies/acme-corp', 'ACME Corp Website Redesign')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Case Studies', href: '/case-studies', isCurrentPage: false },
        {
          label: 'ACME Corp Website Redesign',
          href: '/case-studies/acme-corp',
          isCurrentPage: true,
        },
      ])
    })

    it('should handle tag archive path', () => {
      const result = generateBreadcrumbs('/tags/javascript')
      expect(result).toEqual([
        { label: 'Home', href: '/', isCurrentPage: false },
        { label: 'Tags', href: '/tags', isCurrentPage: false },
        { label: 'Javascript', href: '/tags/javascript', isCurrentPage: true },
      ])
    })
  })
})
