# semantic-release-pr-fix

A wrapper for [commit-analyzer](https://github.com/semantic-release/commit-analyzer) and [release-notes-generator](https://github.com/semantic-release/release-notes-generator) that handles Azure DevOps PR merge commits.

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
      "commitAnalyzerConfig": {
        "preset": "angular",
        "parserOpts": {
          "noteKeywords": ["BREAKING CHANGE", "BREAKING CHANGES", "BREAKING"]
        }
      },
      "notesGeneratorConfig": {
        "preset": "angular",
        "writerOpts": {
          "commitsSort": ["subject", "scope"]
        }
      }
    }],
    "@semantic-release/npm",
    "@semantic-release/github"
  ]
}
```

This plugin replaces both `@semantic-release/commit-analyzer` and `@semantic-release/release-notes-generator` by wrapping them with Azure DevOps PR merge commit compatibility.

## Configuration

The plugin supports the following configuration options:

| Option | Description |
|--------|-------------|
| `commitAnalyzerConfig` | Configuration object passed directly to `@semantic-release/commit-analyzer`. See [commit-analyzer documentation](https://github.com/semantic-release/commit-analyzer#options) for available options. |
| `notesGeneratorConfig` | Configuration object passed directly to `@semantic-release/release-notes-generator`. See [release-notes-generator documentation](https://github.com/semantic-release/release-notes-generator#options) for available options. Set to `false` to disable release notes generation. |

### Disabling Release Notes Generation

If you want to use a different release notes generator plugin, you can disable the built-in notes generation:

```json
{
  "plugins": [
    ["semantic-release-pr-fix", {
      "commitAnalyzerConfig": {
        "preset": "angular"
      },
      "notesGeneratorConfig": false
    }],
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm"
  ]
}
```

## How it works

The plugin processes each commit message and removes the Azure DevOps PR merge prefix (`Merged PR xxxx:`) before passing the commits to the standard semantic-release plugins. This allows your semantic commit messages to be properly recognized even when they're part of merged PRs in Azure DevOps.

It handles both version determination (via `commit-analyzer`) and release notes generation (via `release-notes-generator`), ensuring consistent processing of PR merge commits throughout the semantic-release pipeline.
