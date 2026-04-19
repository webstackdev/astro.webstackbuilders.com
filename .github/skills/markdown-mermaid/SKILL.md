---
name: markdown-mermaid
description: Use this skill when writing or editing Markdown or MDX, especially when Markdown linting, fenced code blocks, inline code safety, or Mermaid diagrams are involved. Triggers include .md, .mdx, markdownlint, mermaid, flowchart, graph TD, subgraph, and fenced code block formatting.
---

# Markdown and Mermaid skill

Use this skill for `.md` and `.mdx` authoring in this repository.

## Process

1. Apply the Markdown structure and linting rules first.
2. If the file contains Mermaid, apply the Mermaid-specific authoring constraints before finishing edits.
3. Reuse the existing Mermaid docs and tests when choosing diagram syntax.

## Markdown rules

- Add a blank line after headings.
- Add a blank line before and after lists.
- Use consistent list markers.
- End files with a single newline.
- Wrap inline code-like snippets in backticks.
- Use fenced code blocks with explicit language identifiers.
- Wrap bare URLs in angle brackets.
- Avoid raw `<` in prose when it could be parsed as HTML or JSX. Prefer `&lt;` or backticks.

## MDX and inline code safety

- Wrap code-y snippets in backticks so the parser does not treat them as HTML or JSX.
- This includes examples like `{ param, ... }`, `generic<T>`, `Array<string>`, and `T extends Foo`.

## Mermaid rules

- This repo renders Mermaid during builds, so invalid Mermaid syntax will fail `npm run build`.
- Prefer `flowchart TD` or `flowchart LR` for new flowchart-style diagrams.
- `graph TD` is acceptable when matching existing content, but treat it as legacy syntax.
- Do not use `quadrantChart`.
- Do not use quoted subgraph titles like `subgraph "Title"`.
- Prefer simple subgraph ids with plain labels like `subgraph myGroup[My Group]`.
- Avoid punctuation-heavy subgraph labels.
- Avoid double quotes inside node labels.
- Avoid `@` in node labels.

## Review rules

- If you are refactoring an existing Markdown file, fix formatting issues that violate these rules while you are there.
- In reviews, flag Markdown lint and Mermaid syntax issues explicitly.

## References

- See `.github/skills/markdown-mermaid/references/examples.md` for concrete repo examples.