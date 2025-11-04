# GitHub Secrets Setup Guide

This document explains how to configure GitHub Secrets for CI/CD workflows.

## Required Secrets

The following secrets must be configured in your GitHub repository for the CI/CD pipelines to work:

### Required for Build & Deployment

- `CONVERTKIT_API_KEY` - ConvertKit API key for newsletter integration
- `CONVERTKIT_FORM_ID` - ConvertKit form ID (numeric value)
- `RESEND_API_KEY` - Resend API key for email functionality

### Required for Vercel Deployment

- `VERCEL_TOKEN` - Vercel deployment token
- `VERCEL_PROJECT_ID` - Your Vercel project ID
- `VERCEL_ORG_ID` - Your Vercel organization ID

### Optional but Recommended

- `SENTRY_AUTH_TOKEN` - Sentry authentication token (required for source map uploads)
- `PUBLIC_SENTRY_DSN` - Sentry DSN for error tracking
- `WEBMENTION_IO_TOKEN` - WebMention.io API token for webmentions

## How to Add Secrets to GitHub

1. Navigate to your repository on GitHub
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret:
   - **Name**: Exact name from the list above (case-sensitive)
   - **Value**: The actual secret value from your local `.env` file
   - Click **Add secret**

## Security Features

GitHub Actions automatically:
- ✅ **Masks secret values** in all log output
- ✅ **Prevents secrets from being printed** to console
- ✅ **Blocks secret exposure** in pull requests from forks
- ✅ **Encrypts secrets** at rest and in transit

### Example of Masked Output
If a secret contains `abc123xyz`, GitHub will show:
```
***
```

## Workflow Configuration

The secrets are injected as environment variables in the workflow files:

### build-and-test.yml
Secrets are available in these steps:
- TypeScript check
- Unit tests
- Build
- E2E tests

### type-check.yml
Secrets are available in:
- TypeScript check

## Local Development

For local development, create a `.env` file in the project root:

```bash
# Copy from .env.example or create manually
CONVERTKIT_API_KEY=your_key_here
CONVERTKIT_FORM_ID=123456
RESEND_API_KEY=your_key_here
SENTRY_AUTH_TOKEN=your_token_here
PUBLIC_SENTRY_DSN=your_dsn_here
WEBMENTION_IO_TOKEN=your_token_here
```

**Important**: `.env` files are gitignored and should NEVER be committed to the repository.

## Troubleshooting

### "Context access might be invalid" warnings
These YAML lint warnings appear before secrets are added to GitHub. They will disappear once you configure the secrets in your repository settings.

### Build fails with "environment variable is not set"
1. Verify the secret is added in GitHub Settings
2. Check the secret name matches exactly (case-sensitive)
3. Ensure the workflow file references the secret correctly: `${{ secrets.SECRET_NAME }}`

### Secret not available in job
- Secrets are not passed to workflows triggered by forks
- Check that the secret is configured at the repository level (not environment level)
- Verify the job has access to secrets (jobs inherit by default)

## Best Practices

1. **Rotate secrets regularly** - Update secrets periodically for security
2. **Use different secrets** for different environments (dev/staging/prod)
3. **Limit secret access** - Only add secrets that are necessary
4. **Document secret requirements** - Keep this file updated
5. **Test in PR** - Ensure workflows work before merging to main

## Reference

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Astro Environment Variables](https://docs.astro.build/en/guides/environment-variables/)
