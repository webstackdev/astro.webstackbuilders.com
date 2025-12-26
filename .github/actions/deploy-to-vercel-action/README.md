# Deploy to Vercel (local action)

This repository vendors a local GitHub Action at `.github/actions/deploy-to-vercel-action`.

It deploys the current workspace to Vercel using the Vercel CLI, and (optionally) creates a GitHub deployment and PR metadata (comment/labels) similar to the upstream `BetaHuhn/deploy-to-vercel-action`.

## Usage

```yml
- name: Install Vercel CLI
  run: npm install --global vercel@latest

- name: Deploy to Vercel
  uses: ./.github/actions/deploy-to-vercel-action
  with:
    GITHUB_TOKEN: ${{ github.token }}
    VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
    VERCEL_ORG_ID: ${{ vars.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ vars.VERCEL_PROJECT_ID }}
    PRODUCTION: false
```

## Notes

- This action expects `vercel` to be available on `PATH`.
- The `WORKING_DIRECTORY` input can be used if your project is not at the repo root.
