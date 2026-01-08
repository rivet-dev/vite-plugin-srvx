# GitHub Workflows

This directory contains automated workflows for CI/CD.

## Workflows

### CI (`ci.yml`)
Runs on every push to `main` and on pull requests:
- Installs dependencies
- Builds the plugin
- Builds the example app

### Preview Package (`preview.yml`)
Runs on pull requests and pushes to `main`:
- Builds the package
- Publishes a preview version via [pkg.pr.new](https://github.com/stackblitz-labs/pkg.pr.new)
- Adds a comment to PRs with installation instructions

### Publish to npm (`publish.yml`)
Runs when a GitHub release is created:
- Builds the package
- Publishes to npm with the `--access public` flag

## Setup

### For npm Publishing

1. Create an npm access token:
   - Go to https://www.npmjs.com/settings/YOUR_USERNAME/tokens
   - Click "Generate New Token" → "Automation"
   - Copy the token

2. Add the token to your GitHub repository:
   - Go to your repository Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `NPM_TOKEN`
   - Value: Paste your npm token
   - Click "Add secret"

3. Create a release:
   - Go to your repository → Releases → Draft a new release
   - Create a tag (e.g., `v0.1.0`)
   - Click "Publish release"
   - The workflow will automatically publish to npm

### For pkg.pr.new

No setup required! The workflow will automatically:
- Publish preview packages for every PR
- Comment on PRs with installation instructions
- Update the comment when new commits are pushed

## Testing Locally

Before creating a release, test the build:

```bash
pnpm install
pnpm build
cd example && pnpm build
```
