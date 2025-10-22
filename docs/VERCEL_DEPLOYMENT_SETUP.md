# Vercel Deployment Setup Guide

This guide explains how to configure GitHub Actions to deploy to Vercel only after CI tests pass, and how to prevent Vercel from automatically deploying on every push.

## Overview

The CI workflow (`.github/workflows/build-and-test.yml`) is configured with three jobs:

1. **build-and-test** - Runs lint, unit tests, build, and Playwright E2E tests
2. **deployment-ready** - Gate that only runs on `main` branch after tests pass
3. **deploy-to-vercel** - Deploys to Vercel production only after deployment gate succeeds

This ensures Vercel deployments only occur when:
- Push is to the `main` branch
- All tests pass
- Build succeeds

## Step 1: Get Vercel Credentials

You need three values from your Vercel account:

### 1.1 Get Vercel Token

1. Go to [Vercel Account Settings → Tokens](https://vercel.com/account/tokens)
2. Click **Create Token**
3. Name it something like `GitHub Actions Deploy`
4. Set scope to your organization/account
5. Set expiration (recommend 1 year, then rotate)
6. Copy the token immediately (it won't be shown again)
7. Save this as `VERCEL_TOKEN`

### 1.2 Get Project ID

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **General**
3. Scroll to **Project ID**
4. Copy the value (format: `prj_xxxxxxxxxxxxxxxxxxxx`)
5. Save this as `VERCEL_PROJECT_ID`

### 1.3 Get Organization ID

1. Go to your Vercel organization settings
2. Navigate to **Settings** → **General**
3. Look for **Organization ID** or **Team ID**
4. Copy the value (format: `team_xxxxxxxxxxxxxxxxxxxx` or similar)
5. Save this as `VERCEL_ORG_ID`

**Alternative method using Vercel CLI:**

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link to your project (run in project root)
vercel link

# View project settings (will show IDs)
vercel project ls
```

The `.vercel/project.json` file created by `vercel link` will contain both `projectId` and `orgId`.

## Step 2: Add Secrets to GitHub Repository

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each of these three secrets:

| Secret Name | Value |
|-------------|-------|
| `VERCEL_TOKEN` | Token from step 1.1 |
| `VERCEL_PROJECT_ID` | Project ID from step 1.2 |
| `VERCEL_ORG_ID` | Organization ID from step 1.3 |

**Important:**
- Secret names must match exactly (case-sensitive)
- Values should be pasted as-is, no quotes or extra whitespace
- After saving, you cannot view the values again (only update them)

## Step 3: Configure Vercel to Prevent Auto-Deploy

You must disable Vercel's automatic GitHub deployments to rely exclusively on the GitHub Action.

### Option A: Disable Automatic Deployments (Recommended)

This option gives you complete control — only the GitHub Action will trigger deployments.

To disable all automatic deployments from Git, you can set the deploymentEnabled option to false in your vercel.json configuration file. This will prevent future Git pushes from triggering deployments.

With this configuration:

- Vercel will NOT deploy on every push
- Only the `deploy-to-vercel` GitHub Action job will trigger deployments
- Deployments only happen when CI passes on `main` branch

### Option B: Use Required Status Checks (Alternative)

If you want Vercel to remain connected but wait for CI:

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Git**
3. Enable **Wait for Checks to Complete** or similar setting (varies by Vercel UI version)
4. This tells Vercel to wait for GitHub status checks before deploying

**Then configure GitHub branch protection:**

1. Go to GitHub repository **Settings** → **Branches**
2. Add a branch protection rule for `main`
3. Check **Require status checks to pass before merging**
4. Select the `CI - Build & Test` workflow (or specific job names)
5. Save the rule

**Note:** Option B may result in duplicate deployments (one from Vercel auto-deploy, one from GitHub Action). **Option A is recommended** for cleaner control.

## Step 4: Verify Configuration

### Test the Deployment Flow

1. Make a small change to a file (e.g., update a comment)
2. Commit and push to `main`:

   ```bash
   git add .
   git commit -m "Test CI-gated deployment"
   git push origin main
   ```

3. Go to GitHub **Actions** tab
4. Watch the workflow run:
   - `build-and-test` should run first (lint, tests, build, E2E)
   - `deployment-ready` should run after tests pass
   - `deploy-to-vercel` should run last and deploy to Vercel production

### Check Vercel Dashboard

1. Go to your Vercel project **Deployments** page
2. You should see a deployment triggered by the GitHub Action
3. The deployment source should reference the GitHub Action workflow

### Troubleshooting

**If deployment fails with authentication error:**
- Verify secrets are set correctly in GitHub (names match exactly)
- Check token hasn't expired
- Ensure token has correct scope/permissions

**If deployment doesn't trigger:**
- Verify push is to `main` branch
- Check that `deployment-ready` job succeeded
- Look at GitHub Actions logs for errors

**If tests pass but deployment skipped:**
- Check the `if: github.ref == 'refs/heads/main' && success()` condition
- Ensure previous jobs succeeded (not just "completed")

**If Vercel still auto-deploys:**
- Double-check Step 3 settings in Vercel dashboard
- May need to disconnect and reconnect Git integration
- Contact Vercel support if setting persists

## Step 5: Optional - Set Up Branch Protection

For additional safety, configure branch protection on `main`:

1. Go to GitHub **Settings** → **Branches**
2. Add branch protection rule for `main`
3. Enable these options:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
     - Select: `build-and-test` (or `CI - Build & Test` job)
   - ✅ **Require conversation resolution before merging**
   - ✅ **Do not allow bypassing the above settings**
4. Save changes

This ensures:
- No direct pushes to `main` (requires PR)
- CI must pass before merge
- Forces code review workflow

## Maintenance

### Rotating Vercel Token

Tokens should be rotated periodically (recommend yearly):

1. Create a new token in Vercel (Step 1.1)
2. Update the `VERCEL_TOKEN` secret in GitHub
3. Test deployment
4. Delete the old token from Vercel

### Monitoring Deployments

- Check GitHub Actions regularly for failed deployments
- Set up notifications in GitHub for workflow failures
- Monitor Vercel dashboard for deployment health

### Updating the Workflow

If you modify `.github/workflows/build-and-test.yml`:
- Ensure job dependencies remain correct (`needs: ...`)
- Keep the `if: github.ref == 'refs/heads/main'` conditions
- Test in a feature branch first before merging to `main`

## Security Best Practices

1. **Never commit secrets to the repository** (use GitHub Secrets only)
2. **Use organization/team tokens** rather than personal tokens when possible
3. **Set token expiration** and rotate regularly
4. **Limit token scope** to only the necessary permissions
5. **Use branch protection** to prevent accidental deployments
6. **Review GitHub Actions logs** regularly for suspicious activity
7. **Enable 2FA** on both GitHub and Vercel accounts

## Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Vercel Deployment Protection](https://vercel.com/docs/security/deployment-protection)
- [GitHub Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
