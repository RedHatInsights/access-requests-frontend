# Chromatic Setup Guide

This guide explains how to set up automatic Storybook deployment to Chromatic using GitHub Actions.

## Overview

The GitHub Actions workflow (`chromatic.yml`) automatically:
- ✅ Builds and deploys Storybook to Chromatic on pushes to `master`
- ✅ Builds and deploys Storybook to Chromatic for PRs from users with **write/admin/maintain** access to the repository
- ✅ Works with PRs from forks when submitted by users with repository access
- ✅ Blocks deployment for PRs from users without sufficient repository permissions

## Required Setup

### 1. Chromatic Project Token

You need to add your Chromatic project token as a repository secret:

1. Go to [Chromatic](https://www.chromatic.com/) and find your project
2. Copy your project token from the project settings
3. In your GitHub repository, go to **Settings** → **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `CHROMATIC_PROJECT_TOKEN`
6. Value: Your Chromatic project token
7. Click **Add secret**

### 2. Repository Access

The workflow checks if PR authors have **write**, **admin**, or **maintain** access to the repository. Make sure:

- Team members have appropriate repository permissions (not just read access)
- Contributors who should trigger Chromatic builds are added as collaborators with write+ permissions

## How It Works

### For Master Branch
- **Trigger**: Push to `master`
- **Action**: Automatically builds Storybook and deploys to Chromatic
- **No restrictions**: All pushes to master are deployed

### For Pull Requests
- **Trigger**: PR opened/updated targeting `master`
- **Permission Check**: Uses GitHub API to verify if PR author has write/admin/maintain access to the repository
- **Authorized Users**: PRs from users with write+ repository access are automatically deployed to Chromatic
- **Non-Authorized Users**: PRs are blocked from deployment for security
- **Forks**: Works for authorized users even when submitting from forks

## Workflow Jobs

1. **`chromatic-deployment-push`**: Handles master branch deployments
2. **`check-permissions`**: Verifies repository access level for PRs
3. **`chromatic-deployment-pr`**: Handles PR deployments for authorized users

## Troubleshooting

### Workflow Not Running
- Check that the workflow file is in `.github/workflows/chromatic.yml`
- Verify the target branch is `master` (adjust if your default branch is different)

### Permission Denied Errors
- Ensure `CHROMATIC_PROJECT_TOKEN` is correctly set in repository secrets
- Verify repository access permissions for the PR author

### PR Not Deploying
- Check if the PR author has **write**, **admin**, or **maintain** access to the repository
- Users with only **read** access will not trigger Chromatic deployments
- External contributors need to be granted write access or have their PRs approved by maintainers

### Repository Access Check Failing
- The workflow uses the default `GITHUB_TOKEN` which has permissions to check repository collaborator levels
- If the check fails, deployment is blocked for security reasons

## Security Notes

- Uses `pull_request_target` for forks (runs in the context of the target repository)
- Only users with write+ repository access can trigger Chromatic deployments from PRs
- Secrets are only accessible to authorized workflows
- Permission checks fail securely (block deployment if unsure)

## Permission Levels

| Repository Permission | Chromatic Deployment | Notes |
|-----------------------|---------------------|--------|
| **Read** | ❌ No | External contributors, basic access |
| **Write** | ✅ Yes | Team members, trusted contributors |
| **Maintain** | ✅ Yes | Project maintainers |
| **Admin** | ✅ Yes | Repository administrators |

## Customization

You can modify the workflow by editing `.github/workflows/chromatic.yml`:

- **Change target branch**: Modify `branches: [master]` sections
- **Change permission levels**: Update the `['write', 'admin', 'maintain']` array in the permission check
- **Add build options**: Modify the `chromaui/action` step parameters

## Alternative Approaches

If you need more granular team-based permissions, you can:

1. **Use a Personal Access Token** with `read:org` scope instead of `GITHUB_TOKEN`
2. **Use GitHub App** with organization member permissions
3. **Maintain a list** of authorized users in the repository

The current approach (repository access check) is recommended for simplicity and security. 