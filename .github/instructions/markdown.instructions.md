---
applyTo: "**/*.md"
---

# Markdown Linting Instructions

## General Guidelines

- For all Markdown files (`.md`), ensure that generated content adheres to the `markdownlint` rules configured for this project.
- List items should be correctly indented (`MD007`).
- No Multiple consecutive blank lines (`MD012`)
- Always use a blank line after a heading (`MD022`).
- Avoid using backslashes for line breaks; use two spaces instead (`MD030`).
- Ensure all inline code blocks are surrounded by backticks (`MD046`).
- Bullet lists should be consistent (e.g., use `*` or `-`, but not both) (`MD044`).
- Files should end with a single newline character (`MD047`).
- Bare URLs should be wrapped in angle brackets (`MD034`). For example, use `<https://example.com>` instead of `https://example.com`.
- Headings should not have trailing punctuation (`MD026`). Remove colons, periods, or other punctuation from the end of headings.
- No multiple consecutive blank lines (`MD012`)

## How to Apply These Rules

- If you are generating a new Markdown file, follow these rules from the beginning.
- If you are asked to refactor or fix a Markdown file, correct any issues that violate these guidelines. For example, if a list is inconsistently formatted, make it consistent.
- If a heading is missing a blank line after it, add one.
- In code reviews, flag any violations of these rules as a suggestion.
