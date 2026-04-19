# Markdown and Mermaid references

Use these files as the baseline references for Markdown and Mermaid behavior in this repo:

- `docs/MERMAID.md`
- `docs/DEPLOYMENT_SETUP.md`
- `src/lib/config/mermaid.ts`
- `src/lib/config/markdown.ts`
- `src/lib/markdown/__tests__/integration/rehype-mermaid-astro.spec.ts`
- `test/e2e/specs/04-components/markdown.spec.ts`

Key repo-specific constraints already enforced by code and tests:

- Mermaid is rendered to inline SVG at build time.
- Mermaid blocks are excluded from the standard Shiki code-block path.
- Build and test coverage already exist for Mermaid rendering, so new syntax should stay close to existing supported patterns.
