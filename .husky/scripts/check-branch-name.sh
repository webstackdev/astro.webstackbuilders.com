#!/bin/sh

# Get current branch name
branch=$(git symbolic-ref --short HEAD)

# Define valid branch name patterns
valid_patterns="^(bugfix|hotfix|feature|infrastructure|content|maintenance)\/[a-z0-9-]+$"

# Allow main and develop branches (for merges)
if [ "$branch" = "main" ] || [ "$branch" = "develop" ]; then
  exit 0
fi

# Check if branch name matches valid patterns
if ! echo "$branch" | grep -Eq "$valid_patterns"; then
  echo "❌ Invalid branch name: $branch"
  echo ""
  echo "Branch names must follow one of these patterns:"
  echo "  - bugfix/<description>     (e.g., bugfix/fix-navigation-menu)"
  echo "  - hotfix/<description>     (e.g., hotfix/critical-security-patch)"
  echo "  - feature/<description>    (e.g., feature/add-contact-form)"
  echo "  - infrastructure/<desc>    (e.g., infrastructure/setup-ci)"
  echo "  - maintenance/<desc>       (e.g., maintenance/update-dependencies)"
  echo "  - content/<description>    (e.g., content/update-about-page)"
  echo ""
  echo "Use lowercase letters, numbers, and hyphens only."
  echo ""
  exit 1
fi

exit 0
