---
applyTo: "**/*.md"
---

# Markdown Linting Instructions

## General Guidelines

- For all Markdown files (`.md`), ensure that generated content adheres to the `markdownlint` rules configured for this project.
- List items should be correctly indented (`MD007`).
- No Multiple consecutive blank lines (`MD012`)
- Always use a blank line after a heading (`MD022`).
- Always add a blank line before and after lists (`MD032`).
- Avoid using backslashes for line breaks; use two spaces instead (`MD030`).
- Ensure all inline code blocks are surrounded by backticks (`MD046`).
- Bullet lists should be consistent (e.g., use `*` or `-`, but not both) (`MD044`).
- Files should end with a single newline character (`MD047`).
- Bare URLs should be wrapped in angle brackets (`MD034`). For example, use `<https://example.com>` instead of `https://example.com`.
- Headings should not have trailing punctuation (`MD026`). Remove colons, periods, or other punctuation from the end of headings.
- All fenced code blocks must have a language specified (`MD040`). Use appropriate languages like `js`, `typescript`, `yaml`, `json`, `text`, `bash`, etc.
- Fenced code blocks should be surrounded by blank lines (`MD031`).
- All fenced code blocks must have a language specified (`MD040`). Use appropriate languages like `js`, `typescript`, `yaml`, `json`, `text`, `bash`, etc. This rule is already mentioned above but bears repeating.
- Lists should be surrounded by blank lines (`MD032`). Always add a blank line before and after lists (both ordered and unordered).
- Ordered lists should use consistent numbering (`MD029`). Either use sequential numbering (1, 2, 3) or all ones (1, 1, 1). Do not mix styles (e.g., 1, 2, 3, 4 is correct; 1, 2, 3, 4 where one item is numbered 2 when it should be 3 is incorrect).
- No trailing spaces on lines (`MD009`), except when intentionally using two trailing spaces for a line break.

## How to Apply These Rules

- If you are generating a new Markdown file, follow these rules from the beginning.
- If you are asked to refactor or fix a Markdown file, correct any issues that violate these guidelines. For example, if a list is inconsistently formatted, make it consistent.
- If a heading is missing a blank line after it, add one.
- Always add blank lines before and after lists to ensure proper spacing.
- When creating fenced code blocks, always specify the appropriate language identifier.
- Ensure all files end with exactly one newline character.
- In code reviews, flag any violations of these rules as a suggestion.

## Code Block Language Guidelines

- Use `js` for JavaScript code
- Use `typescript` or `ts` for TypeScript code
- Use `yaml` for YAML configuration files
- Use `json` for JSON data
- Use `bash` or `shell` for terminal commands
- Use `text` for plain text output or file structures
- Use `astro` for Astro component code
- Use appropriate language identifiers for other code types
