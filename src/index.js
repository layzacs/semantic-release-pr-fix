const { analyzeCommits: semanticAnalyzeCommits } = require('@semantic-release/commit-analyzer');
const { generateNotes: semanticGenerateNotes } = require('@semantic-release/release-notes-generator');

/**
 * Parse a commit message to extract the PR prefix from Azure DevOps
 * 
 * @param {Object} commit Commit to parse
 * @returns {Object} Transformed commit with fixed message
 */
function processAzureDevOpsCommit(commit) {
  if (!commit) return commit;

  // Clone the commit to avoid modifying the original
  const processedCommit = { ...commit };
  
  // Check if it's an Azure DevOps PR merge commit (starts with "Merged PR xxx:")
  const azurePRRegex = /^Merged PR \d+:\s*(.*)/;
  const match = processedCommit.message?.match(azurePRRegex);
  
  if (match && match[1]) {
    // Extract the actual commit message after the PR prefix
    processedCommit.message = match[1].trim();
    
    // Also update the subject if available (often used by commit-analyzer)
    if (processedCommit.subject) {
      const subjectMatch = processedCommit.subject.match(azurePRRegex);
      if (subjectMatch && subjectMatch[1]) {
        processedCommit.subject = subjectMatch[1].trim();
      }
    }
  }
  
  return processedCommit;
}

/**
 * Analyze commits with semantic-release.
 *
 * @param {Object} pluginConfig The plugin configuration.
 * @param {Object} pluginConfig.commitAnalyzerConfig The configuration for the commit analyzer.
 * @param {Object} context The semantic-release context.
 * @param {Array<Object>} context.commits The commits to analyze.
 *
 * @returns {Promise<String|null>} The semantic release type, or `null` if no release has to be done.
 */
async function analyzeCommits(pluginConfig, context) {
  // Extract config for commit analyzer
  const { commitAnalyzerConfig } = pluginConfig || {};
  
  // Process each commit to handle Azure DevOps PR merge messages
  if (context.commits) {
    context.commits = context.commits.map(processAzureDevOpsCommit);
  }
  
  // Pass the modified context to the original commit analyzer with its config
  return semanticAnalyzeCommits(commitAnalyzerConfig ?? {}, context);
}

/**
 * Generate release notes for semantic-release.
 *
 * @param {Object} pluginConfig The plugin configuration.
 * @param {Object|boolean} pluginConfig.notesGeneratorConfig The configuration for the release notes generator.
 * @param {Object} context The semantic-release context.
 * @param {Array<Object>} context.commits The commits to analyze.
 *
 * @returns {Promise<String>} The release notes for the new release.
 */
async function generateNotes(pluginConfig, context) {
  // Extract config for notes generator
  const { notesGeneratorConfig } = pluginConfig || {};
  
  // If notes generation is disabled, return early
  if (notesGeneratorConfig === false) { 
    return; 
  }
  
  // Process each commit to handle Azure DevOps PR merge messages
  if (context.commits) {
    context.commits = context.commits.map(processAzureDevOpsCommit);
  }
  
  // Pass the modified context to the original notes generator with its config
  return semanticGenerateNotes(notesGeneratorConfig ?? {}, context);
}

module.exports = { analyzeCommits, generateNotes };
