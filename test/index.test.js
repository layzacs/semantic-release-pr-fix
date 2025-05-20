// Mock the @semantic-release/commit-analyzer module
const mockAnalyzeCommits = jest.fn().mockImplementation((pluginConfig, context) => {
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

// Mock the @semantic-release/release-notes-generator module
const mockGenerateNotes = jest.fn().mockImplementation((pluginConfig, context) => {
  if (context.commits && context.commits.length > 0) {
    const msg = context.commits[0].message.toLowerCase();
    if (msg.startsWith('feat:')) return 'Feature: ' + context.commits[0].message;
    if (msg.startsWith('fix:')) return 'Fix: ' + context.commits[0].message;
    if (msg.startsWith('breaking:')) return 'BREAKING CHANGE: ' + context.commits[0].message;
    return 'Other changes: ' + context.commits[0].message;
  }
  return 'No changes';
});

jest.mock('@semantic-release/commit-analyzer', () => ({
  analyzeCommits: mockAnalyzeCommits
}));

jest.mock('@semantic-release/release-notes-generator', () => ({
  generateNotes: mockGenerateNotes
}));

const { analyzeCommits, generateNotes } = require('../src/index');

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
    
    // Check that commit-analyzer was called with the transformed commits and empty config
    expect(mockAnalyzeCommits).toHaveBeenCalledWith({}, context);

    expect(result).toBe('minor');
  });
  
  test('should pass commitAnalyzerConfig to the analyzer', async () => {
    const context = {
      commits: [
        {
          message: 'Merged PR 1234: feat: add new feature',
          subject: 'Merged PR 1234: feat: add new feature'
        }
      ]
    };
    
    const pluginConfig = {
      commitAnalyzerConfig: {
        preset: 'angular',
        releaseRules: [
          {type: 'docs', scope: 'README', release: 'patch'}
        ]
      }
    };

    const result = await analyzeCommits(pluginConfig, context);
    
    // Check that the prefix was removed
    expect(context.commits[0].message).toBe('feat: add new feature');
    expect(context.commits[0].subject).toBe('feat: add new feature');
    
    // Check that commit-analyzer was called with the specific config
    expect(mockAnalyzeCommits).toHaveBeenCalledWith(pluginConfig.commitAnalyzerConfig, context);

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
    expect(mockAnalyzeCommits).toHaveBeenCalledWith({}, context);
    
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
          message: 'Merged PR 56789123: breaking: change API structure',
          subject: 'Merged PR 56789123: breaking: change API structure'
        }
      ]
    };

    await analyzeCommits({}, context);
    
    // Check that prefixes were removed only where they existed
    expect(context.commits[0].message).toBe('feat: add new feature');
    expect(context.commits[1].message).toBe('fix: resolve bug in login function');
    expect(context.commits[2].message).toBe('breaking: change API structure');
    
    expect(mockAnalyzeCommits).toHaveBeenCalledWith({}, context);
  });

  test('should handle empty or undefined commits', async () => {
    // Test with undefined commits
    const emptyContext = {};
    await analyzeCommits({}, emptyContext);
    expect(mockAnalyzeCommits).toHaveBeenCalledWith({}, emptyContext);
    
    // Test with empty commits array
    const contextWithEmptyCommits = { commits: [] };
    await analyzeCommits({}, contextWithEmptyCommits);
    expect(mockAnalyzeCommits).toHaveBeenCalledWith({}, contextWithEmptyCommits);
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
    
    expect(mockAnalyzeCommits).toHaveBeenCalledWith({}, context);
  });

  describe('generateNotes', () => {
    test('should process Azure DevOps PR commit message for release notes', async () => {
      const context = {
        commits: [
          {
            message: 'Merged PR 1234: feat: add new feature',
            subject: 'Merged PR 1234: feat: add new feature'
          }
        ]
      };

      const notes = await generateNotes({}, context);
      
      // Check that the prefix was removed
      expect(context.commits[0].message).toBe('feat: add new feature');
      expect(context.commits[0].subject).toBe('feat: add new feature');
      
      // Check that notes generator was called with the transformed commits and empty config
      expect(mockGenerateNotes).toHaveBeenCalledWith({}, context);
      
      // Our mock generator should return notes based on the first commit
      expect(notes).toBe('Feature: feat: add new feature');
    });
    
    test('should pass notesGeneratorConfig to the notes generator', async () => {
      const context = {
        commits: [
          {
            message: 'Merged PR 1234: feat: add new feature',
            subject: 'Merged PR 1234: feat: add new feature'
          }
        ]
      };
      
      const pluginConfig = {
        notesGeneratorConfig: {
          preset: 'angular',
          writerOpts: {
            commitsSort: ['subject', 'scope']
          }
        }
      };

      const notes = await generateNotes(pluginConfig, context);
      
      // Check that the prefix was removed
      expect(context.commits[0].message).toBe('feat: add new feature');
      expect(context.commits[0].subject).toBe('feat: add new feature');
      
      // Check that notes generator was called with the specific config
      expect(mockGenerateNotes).toHaveBeenCalledWith(pluginConfig.notesGeneratorConfig, context);
      
      // Our mock generator should return notes based on the first commit
      expect(notes).toBe('Feature: feat: add new feature');
    });
    
    test('should skip notes generation if notesGeneratorConfig is false', async () => {
      const context = {
        commits: [
          {
            message: 'Merged PR 1234: feat: add new feature',
            subject: 'Merged PR 1234: feat: add new feature'
          }
        ]
      };
      
      const pluginConfig = {
        notesGeneratorConfig: false
      };

      const notes = await generateNotes(pluginConfig, context);
      
      // Notes should be undefined
      expect(notes).toBeUndefined();
      
      // The notes generator should not be called
      expect(mockGenerateNotes).not.toHaveBeenCalled();
    });

    test('should handle commits without the Azure DevOps PR prefix when generating notes', async () => {
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
      
      const notes = await generateNotes({}, context);
      
      // Message should be unchanged
      expect(context.commits[0].message).toBe(originalMessage);
      expect(context.commits[0].subject).toBe(originalSubject);
      
      // Check that notes generator was called
      expect(mockGenerateNotes).toHaveBeenCalledWith({}, context);
      
      // Our mock generator should return notes based on the commit
      expect(notes).toBe('Fix: fix: resolve bug in login function');
    });

    test('should handle multiple commits with and without prefixes for release notes', async () => {
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
            message: 'Merged PR 56789123: breaking: change API structure',
            subject: 'Merged PR 56789123: breaking: change API structure'
          }
        ]
      };

      const notes = await generateNotes({}, context);
      
      // Check that prefixes were removed only where they existed
      expect(context.commits[0].message).toBe('feat: add new feature');
      expect(context.commits[1].message).toBe('fix: resolve bug in login function');
      expect(context.commits[2].message).toBe('breaking: change API structure');
      
      expect(mockGenerateNotes).toHaveBeenCalledWith({}, context);
      expect(notes).toBe('Feature: feat: add new feature');
    });
  });
});
