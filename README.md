# semantic-release-pr-fix

A wrapper for [commit-analyzer](https://github.com/semantic-release/commit-analyzer) that handles Azure DevOps PR merge commits.

[![npm latest version](https://img.shields.io/npm/v/semantic-release-pr-fix/latest.svg)](https://www.npmjs.com/package/semantic-release-pr-fix)

## Problem

When using semantic-release with Azure DevOps repositories, merged PRs have a prefix added to the commit message: `Merged PR 1234: original message`. This prevents semantic-release from properly detecting release types because it expects semantic commit messages to start with prefixes like `feat:`, `fix:`, etc.

This wrapper strips the Azure DevOps PR prefix from commit messages before passing them to the commit-analyzer, allowing semantic-release to properly parse your commits.

## Install

```bash
npm install -D semantic-release-pr-fix
```

## Usage

In your `.releaserc.json` or `release.config.js` file:

```json
{
  "plugins": [
    ["semantic-release-pr-fix", {
      "preset": "angular",
      "parserOpts": {
        "noteKeywords": ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"]
      }
    }],
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github"
  ]
}
```

The plugin will take any configuration options and pass them to the underlying `@semantic-release/commit-analyzer` after processing the commit messages.

## How it works

The plugin processes each commit message and removes the Azure DevOps PR merge prefix (`Merged PR xxxx:`) before passing the commits to the standard semantic-release commit analyzer. This allows your semantic commit messages to be properly recognized even when they're part of merged PRs in Azure DevOps.
