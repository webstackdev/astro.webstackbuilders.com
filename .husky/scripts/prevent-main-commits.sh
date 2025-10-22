#!/bin/sh

# Get current branch name
branch=$(git symbolic-ref --short HEAD)

# Prevent direct commits to main
if [ "$branch" = "main" ]; then
  echo "❌ Direct commits to 'main' branch are not allowed!"
  echo ""
  echo "Please follow this workflow:"
  echo "  1. Create a new branch:"
  echo "     git checkout -b feature/your-feature-name"
  echo ""
  echo "  2. Make your changes and commit them"
  echo ""
  echo "  3. Push your branch and create a Pull Request:"
  echo "     git push -u origin feature/your-feature-name"
  echo ""
  echo "Valid branch prefixes: bugfix/, hotfix/, feature/, infrastructure/, content/"
  echo ""
  exit 1
fi

exit 0
