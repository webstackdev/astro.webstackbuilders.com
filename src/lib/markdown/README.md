<!-- markdownlint-disable -->

# Markdown Pipeline Testing Strategy

┌─────────────────────────────────────────────────┐
│  Unit Tests (Isolated)                          │
│  • NPM PACKAGES ONLY (upstream regression tests)│
│  • Test ONE plugin at a time                    │
│  • Minimal pipeline (no GFM, no Astro settings) │
│  • Purpose: Catch breaking changes from upgrades│
│  • Location: __tests__/units/                   │
│  • Speed: Milliseconds                          │
│  • Run: On every save                           │
│  • Example: remark-emoji.spec.ts                │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  Unit Tests with Astro Defaults                 │
│  • Test ONE plugin at a time                    │
│  • Full Astro settings (GFM + smartypants)      │
│  • Purpose: Verify plugin works with Astro      │
│  • Location: __tests__/units_with_default_astro/│
│  • Speed: Seconds                               │
│  • Run: Before commits                          │
│  • Fail-fast: Identifies WHICH plugin breaks    │
│                                                 │
│  Pipeline per plugin:                           │
│  remark → GFM → [single plugin] →               │
│  remarkRehype(config) → rehypeStringify         │
│                                                 │
│  Import from markdown.ts:                       │
│  • remarkAttributesConfig                       │
│  • rehypeAutolinkHeadingsConfig                 │
│  • remarkRehypeConfig                           │
└─────────────────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────┐
│  E2E Component Rendering Tests                  │
│  • Test markdown rendering through Astro        │
│  • Component-based validation with fixtures     │
│  • Purpose: E2E validation with accessibility   │
│  • Location: __tests__/e2e/                     │
│  • Speed: Seconds                               │
│  • Run: Before commits / CI                     │
│  • Tools: Vitest + Testing Library + Axe        │
│                                                 │
│  Test Architecture:                             │
│  • Fixtures → Test Component (Astro) →          │
│    Full Pipeline → HTML → Accessibility Check   │
│                                                 │
│  Test Component (src/components/Test):          │
│  • Accepts markdown content as prop             │
│  • Processes through production pipeline        │
│  • Returns rendered HTML                        │
│                                                 │
│  Accessibility Testing (vitest-axe):            │
│  ✅ Every test validates with Axe library       │
│  ✅ Ensures WCAG compliance                     │
│  ✅ Validates ARIA attributes                   │
│  ✅ Checks semantic HTML structure              │
└─────────────────────────────────────────────────┘
