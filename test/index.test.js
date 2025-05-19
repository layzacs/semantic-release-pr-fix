// Mock the @semantic-release/commit-analyzer module
jest.mock('@semantic-release/commit-analyzer', () => {
  return jest.fn().mockImplementation((pluginConfig, context) => {
    // Just return the type based on the first commit message for testing
    if (context.commits && context.commits.length > 0) {
      const msg = context.commits[0].message.toLowerCase();
      if (msg.startsWith('feat:')) return 'minor';
      if (msg.startsWith('fix:')) return 'patch';
      if (msg.startsWith('breaking:')) return 'major';
      return null;
    }
    return null;
  });
});

const { analyzeCommits } = require('../src/index');
const commitAnalyzer = require('@semantic-release/commit-analyzer');

describe('semantic-release-pr-fix', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should process Azure DevOps PR commit message by removing the prefix', async () => {
    const context = {
      commits: [
        {
          message: 'Merged PR 1234: feat: add new feature',
          subject: 'Merged PR 1234: feat: add new feature'
        }
      ]
    };

    const result = await analyzeCommits({}, context);
    
    // Check that the prefix was removed
    expect(context.commits[0].message).toBe('feat: add new feature');
    expect(context.commits[0].subject).toBe('feat: add new feature');
    
    // Check that commit-analyzer was called with the transformed commits
    expect(commitAnalyzer).toHaveBeenCalledWith({}, context);

    expect(result).toBe('minor');
  });

  test('should handle commits without the Azure DevOps PR prefix', async () => {
    const context = {
      commits: [
        {
          message: 'fix: resolve bug in login function',
          subject: 'fix: resolve bug in login function'
        }
      ]
    };

    const originalMessage = context.commits[0].message;
    const originalSubject = context.commits[0].subject;
    
    const result = await analyzeCommits({}, context);
    
    // Message should be unchanged
    expect(context.commits[0].message).toBe(originalMessage);
    expect(context.commits[0].subject).toBe(originalSubject);
    
    // Check that commit-analyzer was called
    expect(commitAnalyzer).toHaveBeenCalledWith({}, context);
    
    // Our mock analyzer should return 'patch' for a fix
    expect(result).toBe('patch');
  });

  test('should handle multiple commits with and without prefixes', async () => {
    const context = {
      commits: [
        {
          message: 'Merged PR 1234: feat: add new feature',
          subject: 'Merged PR 1234: feat: add new feature'
        },
        {
          message: 'fix: resolve bug in login function',
          subject: 'fix: resolve bug in login function'
        },
        {
          message: 'Merged PR 5678: breaking: change API structure',
          subject: 'Merged PR 5678: breaking: change API structure'
        }
      ]
    };

    await analyzeCommits({}, context);
    
    // Check that prefixes were removed only where they existed
    expect(context.commits[0].message).toBe('feat: add new feature');
    expect(context.commits[1].message).toBe('fix: resolve bug in login function');
    expect(context.commits[2].message).toBe('breaking: change API structure');
    
    expect(commitAnalyzer).toHaveBeenCalledWith({}, context);
  });

  test('should handle empty or undefined commits', async () => {
    // Test with undefined commits
    const emptyContext = {};
    await analyzeCommits({}, emptyContext);
    expect(commitAnalyzer).toHaveBeenCalledWith({}, emptyContext);
    
    // Test with empty commits array
    const contextWithEmptyCommits = { commits: [] };
    await analyzeCommits({}, contextWithEmptyCommits);
    expect(commitAnalyzer).toHaveBeenCalledWith({}, contextWithEmptyCommits);
  });

  test('should handle complex Azure DevOps PR messages', async () => {
    const context = {
      commits: [
        {
          message: 'Merged PR 9999: fix: bugfix with detailed explanation of what was fixed',
          subject: 'Merged PR 9999: fix: bugfix with detailed explanation of what was fixed'
        },
        {
          message: 'Merged PR 8888: This is a normal commit message without semantic prefix',
          subject: 'Merged PR 8888: This is a normal commit message without semantic prefix' 
        }
      ]
    };

    await analyzeCommits({}, context);
    
    expect(context.commits[0].message).toBe('fix: bugfix with detailed explanation of what was fixed');
    expect(context.commits[1].message).toBe('This is a normal commit message without semantic prefix');
    
    expect(commitAnalyzer).toHaveBeenCalledWith({}, context);
  });
});
