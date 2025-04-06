import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import * as globModule from 'glob';
import { v4 as uuidv4 } from 'uuid';
import { loadTasks } from './tasks.js';
import { loadRules } from './rules.js';

const SUGGESTIONS_FILE = 'tasks/rule-suggestions.json';

const glob = globModule.glob;

// Analyze completed tasks for patterns
export function analyzeEvolution(options) {
  const tasks = loadTasks();
  
  // Filter tasks based on options
  let tasksToAnalyze;
  
  if (options.completedTasks) {
    tasksToAnalyze = tasks.filter(task => task.status === 'done' || task.status === 'completed');
  } else if (options.last) {
    const count = parseInt(options.last, 10);
    tasksToAnalyze = tasks.slice(-count);
  } else {
    tasksToAnalyze = tasks;
  }
  
  if (tasksToAnalyze.length === 0) {
    console.log(chalk.yellow('No tasks to analyze.'));
    return;
  }
  
  console.log(chalk.cyan(`Analyzing ${tasksToAnalyze.length} tasks for patterns...`));
  
  // Load existing rules
  const rules = loadRules();
  
  // In a real implementation, this would use AI/NLP to analyze task patterns
  // For this demo, we'll create a simple analysis based on task attributes
  const taskPatterns = analyzeTaskPatterns(tasksToAnalyze);
  
  // Compare patterns with existing rules
  const rulePatterns = analyzeRulePatterns(rules);
  
  // Generate suggestions based on differences
  const suggestions = generateSuggestions(taskPatterns, rulePatterns, rules);
  
  // Save suggestions to file
  saveSuggestions(suggestions);
  
  // Display summary
  console.log(chalk.green(`\nAnalysis complete. Generated ${suggestions.length} rule update suggestions.`));
  console.log(`Run ${chalk.cyan('node scripts/dev.js suggest')} to view suggestions.\n`);
}

// Suggest rule updates based on analysis
export function suggestRuleUpdates() {
  const suggestions = loadSuggestions();
  
  if (suggestions.length === 0) {
    console.log(chalk.yellow('No rule update suggestions found.'));
    console.log(`Run ${chalk.cyan('node scripts/dev.js analyze')} to generate suggestions.\n`);
    return;
  }
  
  console.log(chalk.bold('\nRule Update Suggestions:'));
  console.log('---------------------------');
  
  suggestions.forEach((suggestion, index) => {
    const suggestionId = suggestion.id || index + 1;
    
    // Display differently based on suggestion type
    if (suggestion.type === 'create') {
      console.log(`\n${chalk.green(`[${suggestionId}]`)} ${chalk.bold('Create New Rule:')} ${suggestion.title}`);
      console.log(`  Confidence: ${formatConfidence(suggestion.confidence)}`);
      console.log('  Sections:');
      
      suggestion.sections.forEach(section => {
        console.log(`    - ${section.title}`);
      });
    } else if (suggestion.type === 'update') {
      console.log(`\n${chalk.blue(`[${suggestionId}]`)} ${chalk.bold('Update Existing Rule:')} ${suggestion.ruleId}`);
      console.log(`  Confidence: ${formatConfidence(suggestion.confidence)}`);
      console.log('  Changes:');
      
      suggestion.changes.forEach(change => {
        console.log(`    - Add to section "${change.section}": ${change.guideline}`);
      });
    } else if (suggestion.type === 'deprecate') {
      console.log(`\n${chalk.yellow(`[${suggestionId}]`)} ${chalk.bold('Consider Deprecating:')} ${suggestion.ruleId}`);
      console.log(`  Confidence: ${formatConfidence(suggestion.confidence)}`);
      console.log(`  Reason: ${suggestion.reason}`);
    }
  });
  
  console.log('\n---------------------------');
  console.log(`Total: ${suggestions.length} suggestions\n`);
  console.log(`Apply a suggestion with ${chalk.cyan('node scripts/dev.js apply-suggestion --id=<id>')}\n`);
}

// Apply suggested rule updates
export function applyRuleUpdates(options) {
  if (!options.id) {
    console.log(chalk.red('Error: --id is required.'));
    return;
  }
  
  const suggestions = loadSuggestions();
  
  if (suggestions.length === 0) {
    console.log(chalk.yellow('No rule update suggestions found.'));
    return;
  }
  
  // Find the suggestion by ID
  const suggestion = suggestions.find(s => s.id === options.id || s.id === parseInt(options.id));
  
  if (!suggestion) {
    console.log(chalk.red(`Suggestion with ID ${options.id} not found.`));
    return;
  }
  
  console.log(chalk.cyan(`Applying suggestion #${options.id}...`));
  
  // Apply the suggestion based on its type
  if (suggestion.type === 'create') {
    applyCreateSuggestion(suggestion);
  } else if (suggestion.type === 'update') {
    applyUpdateSuggestion(suggestion);
  } else if (suggestion.type === 'deprecate') {
    applyDeprecateSuggestion(suggestion);
  } else {
    console.log(chalk.red(`Unknown suggestion type: ${suggestion.type}`));
    return;
  }
  
  // Remove the applied suggestion from the list
  const updatedSuggestions = suggestions.filter(s => s.id !== suggestion.id);
  saveSuggestions(updatedSuggestions);
  
  console.log(chalk.green('Suggestion applied successfully.'));
}

// Analyze tasks for patterns
function analyzeTaskPatterns(tasks) {
  // Extract common keywords and patterns from tasks
  const patterns = {
    keywords: {},
    fileTypes: {},
    technologies: {},
    categories: {}
  };
  
  // Technologies to detect
  const techKeywords = {
    typescript: ['typescript', 'ts', 'interface', 'type'],
    react: ['react', 'component', 'hook', 'jsx', 'tsx'],
    supabase: ['supabase', 'database', 'auth', 'storage'],
    testing: ['test', 'jest', 'cypress', 'unit test', 'integration test']
  };
  
  // Categories to detect
  const categoryKeywords = {
    ui: ['ui', 'component', 'interface', 'styling', 'css', 'tailwind'],
    data: ['data', 'model', 'schema', 'database', 'query'],
    auth: ['auth', 'authentication', 'login', 'register', 'user'],
    testing: ['test', 'testing', 'jest', 'cypress', 'coverage']
  };
  
  // Analyze each task
  tasks.forEach(task => {
    // Combine all text from the task
    const taskText = [
      task.title,
      task.description,
      task.details,
      task.testStrategy
    ].filter(Boolean).join(' ').toLowerCase();
    
    // Extract and count keywords
    const words = taskText.split(/\W+/).filter(word => word.length > 3);
    words.forEach(word => {
      patterns.keywords[word] = (patterns.keywords[word] || 0) + 1;
    });
    
    // Detect file types mentioned
    if (taskText.includes('.ts')) patterns.fileTypes['.ts'] = (patterns.fileTypes['.ts'] || 0) + 1;
    if (taskText.includes('.tsx')) patterns.fileTypes['.tsx'] = (patterns.fileTypes['.tsx'] || 0) + 1;
    if (taskText.includes('.js')) patterns.fileTypes['.js'] = (patterns.fileTypes['.js'] || 0) + 1;
    if (taskText.includes('.jsx')) patterns.fileTypes['.jsx'] = (patterns.fileTypes['.jsx'] || 0) + 1;
    if (taskText.includes('.css')) patterns.fileTypes['.css'] = (patterns.fileTypes['.css'] || 0) + 1;
    if (taskText.includes('.html')) patterns.fileTypes['.html'] = (patterns.fileTypes['.html'] || 0) + 1;
    if (taskText.includes('.json')) patterns.fileTypes['.json'] = (patterns.fileTypes['.json'] || 0) + 1;
    
    // Detect technologies
    for (const [tech, keywords] of Object.entries(techKeywords)) {
      if (keywords.some(keyword => taskText.includes(keyword))) {
        patterns.technologies[tech] = (patterns.technologies[tech] || 0) + 1;
      }
    }
    
    // Detect categories
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => taskText.includes(keyword))) {
        patterns.categories[category] = (patterns.categories[category] || 0) + 1;
      }
    }
  });
  
  return patterns;
}

// Analyze rules for patterns
function analyzeRulePatterns(rules) {
  // Extract patterns from existing rules
  const patterns = {
    keywords: {},
    fileTypes: {},
    technologies: {},
    categories: {}
  };
  
  // Technologies to detect
  const techKeywords = {
    typescript: ['typescript', 'ts', 'interface', 'type'],
    react: ['react', 'component', 'hook', 'jsx', 'tsx'],
    supabase: ['supabase', 'database', 'auth', 'storage'],
    testing: ['test', 'jest', 'cypress', 'unit test', 'integration test']
  };
  
  // Categories to detect
  const categoryKeywords = {
    ui: ['ui', 'component', 'interface', 'styling', 'css', 'tailwind'],
    data: ['data', 'model', 'schema', 'database', 'query'],
    auth: ['auth', 'authentication', 'login', 'register', 'user'],
    testing: ['test', 'testing', 'jest', 'cypress', 'coverage']
  };
  
  // Analyze each rule
  rules.forEach(rule => {
    const ruleText = rule.content.toLowerCase();
    
    // Extract and count keywords
    const words = ruleText.split(/\W+/).filter(word => word.length > 3);
    words.forEach(word => {
      patterns.keywords[word] = (patterns.keywords[word] || 0) + 1;
    });
    
    // Detect file types mentioned
    if (ruleText.includes('.ts')) patterns.fileTypes['.ts'] = (patterns.fileTypes['.ts'] || 0) + 1;
    if (ruleText.includes('.tsx')) patterns.fileTypes['.tsx'] = (patterns.fileTypes['.tsx'] || 0) + 1;
    if (ruleText.includes('.js')) patterns.fileTypes['.js'] = (patterns.fileTypes['.js'] || 0) + 1;
    if (ruleText.includes('.jsx')) patterns.fileTypes['.jsx'] = (patterns.fileTypes['.jsx'] || 0) + 1;
    if (ruleText.includes('.css')) patterns.fileTypes['.css'] = (patterns.fileTypes['.css'] || 0) + 1;
    if (ruleText.includes('.html')) patterns.fileTypes['.html'] = (patterns.fileTypes['.html'] || 0) + 1;
    if (ruleText.includes('.json')) patterns.fileTypes['.json'] = (patterns.fileTypes['.json'] || 0) + 1;
    
    // Detect technologies
    for (const [tech, keywords] of Object.entries(techKeywords)) {
      if (keywords.some(keyword => ruleText.includes(keyword))) {
        patterns.technologies[tech] = (patterns.technologies[tech] || 0) + 1;
      }
    }
    
    // Detect categories
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      if (keywords.some(keyword => ruleText.includes(keyword))) {
        patterns.categories[category] = (patterns.categories[category] || 0) + 1;
      }
    }
  });
  
  return patterns;
}

// Generate rule update suggestions
function generateSuggestions(taskPatterns, rulePatterns, rules) {
  const suggestions = [];
  
  // Check for missing technology coverage
  for (const [tech, count] of Object.entries(taskPatterns.technologies)) {
    // If a technology is used in tasks but not covered by rules
    if (count > 2 && (!rulePatterns.technologies[tech] || rulePatterns.technologies[tech] < count / 2)) {
      // Suggest creating a new rule for this technology
      suggestions.push({
        id: uuidv4().substring(0, 8),
        type: 'create',
        title: `${tech.charAt(0).toUpperCase() + tech.slice(1)} Best Practices`,
        confidence: Math.min(0.9, count / 10),
        sections: [
          { title: 'Basic Patterns', guidelines: [] },
          { title: 'Advanced Usage', guidelines: [] },
          { title: 'Common Mistakes', guidelines: [] }
        ]
      });
    }
  }
  
  // Check for missing category coverage
  for (const [category, count] of Object.entries(taskPatterns.categories)) {
    // If a category is used in tasks but not covered by rules
    if (count > 2 && (!rulePatterns.categories[category] || rulePatterns.categories[category] < count / 2)) {
      // Suggest creating a new rule for this category
      suggestions.push({
        id: uuidv4().substring(0, 8),
        type: 'create',
        title: `${category.charAt(0).toUpperCase() + category.slice(1)} Guidelines`,
        confidence: Math.min(0.85, count / 12),
        sections: [
          { title: 'Best Practices', guidelines: [] },
          { title: 'Implementation Guidelines', guidelines: [] },
          { title: 'Examples', guidelines: [] }
        ]
      });
    }
  }
  
  // Check for rules that may need updates
  rules.forEach(rule => {
    const ruleText = rule.content.toLowerCase();
    let needsUpdate = false;
    let changes = [];
    
    // Check for missing file types
    for (const [fileType, count] of Object.entries(taskPatterns.fileTypes)) {
      if (count > 3 && !ruleText.includes(fileType)) {
        // If the file type is relevant to the rule subject
        if ((fileType === '.ts' || fileType === '.tsx') && rule.id.includes('typescript')) {
          changes.push({
            section: 'File Types',
            guideline: `Add support for ${fileType} files`,
            examples: []
          });
          needsUpdate = true;
        } else if ((fileType === '.css') && rule.id.includes('styling')) {
          changes.push({
            section: 'Styling',
            guideline: `Add guidelines for ${fileType} files`,
            examples: []
          });
          needsUpdate = true;
        }
      }
    }
    
    // Check for missing technology references
    for (const [tech, count] of Object.entries(taskPatterns.technologies)) {
      // If the technology is relevant and used frequently but not mentioned in the rule
      const techKeywords = {
        typescript: ['typescript', 'ts', 'interface', 'type'],
        react: ['react', 'component', 'hook', 'jsx', 'tsx'],
        supabase: ['supabase', 'database', 'auth', 'storage'],
        testing: ['test', 'jest', 'cypress', 'unit test', 'integration test']
      };
      
      if (count > 3 && 
          !techKeywords[tech].some(keyword => ruleText.includes(keyword)) &&
          (rule.id.includes('project_structure') || rule.id.includes('coding_standards'))) {
        changes.push({
          section: 'Technologies',
          guideline: `Add guidelines for ${tech} usage`,
          examples: []
        });
        needsUpdate = true;
      }
    }
    
    if (needsUpdate) {
      suggestions.push({
        id: uuidv4().substring(0, 8),
        type: 'update',
        ruleId: rule.id,
        confidence: 0.75,
        changes
      });
    }
    
    // Check for potentially deprecated rules
    let relevanceScore = 0;
    
    // Calculate relevance based on keyword overlap
    const ruleKeywords = Object.keys(extractKeywords(ruleText));
    const taskKeywords = Object.keys(taskPatterns.keywords).filter(k => taskPatterns.keywords[k] > 1);
    
    const overlap = ruleKeywords.filter(keyword => taskKeywords.includes(keyword));
    relevanceScore = overlap.length / ruleKeywords.length;
    
    // If a rule has low relevance to current tasks
    if (relevanceScore < 0.2 && ruleKeywords.length > 10) {
      suggestions.push({
        id: uuidv4().substring(0, 8),
        type: 'deprecate',
        ruleId: rule.id,
        reason: `Low relevance score (${(relevanceScore * 100).toFixed(1)}%) to current tasks`,
        confidence: 0.6
      });
    }
  });
  
  return suggestions;
}

// Load suggestions from file
function loadSuggestions() {
  try {
    if (!fs.existsSync(SUGGESTIONS_FILE)) {
      return [];
    }
    
    const data = fs.readFileSync(SUGGESTIONS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading suggestions: ${error.message}`);
    return [];
  }
}

// Save suggestions to file
function saveSuggestions(suggestions) {
  try {
    const suggestionsDir = path.dirname(SUGGESTIONS_FILE);
    if (!fs.existsSync(suggestionsDir)) {
      fs.mkdirSync(suggestionsDir, { recursive: true });
    }
    
    fs.writeFileSync(SUGGESTIONS_FILE, JSON.stringify(suggestions, null, 2));
  } catch (error) {
    console.error(`Error saving suggestions: ${error.message}`);
  }
}

// Apply a suggestion to create a new rule
function applyCreateSuggestion(suggestion) {
  // Generate a file name for the new rule
  const ruleName = suggestion.title
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w]/g, '') + '.mdc';
  
  const rulePath = path.join('.cursor/rules', ruleName);
  
  // In a real implementation, this would generate a full rule file
  // For this demo, we'll create a simple template
  let content = `# ${suggestion.title}\n\n`;
  
  // Add sections
  suggestion.sections.forEach(section => {
    content += `## ${section.title}\n\n`;
    content += `- Add guidelines here\n\n`;
  });
  
  // Write the file
  fs.writeFileSync(rulePath, content);
  
  console.log(chalk.green(`Created new rule: ${rulePath}`));
}

// Apply a suggestion to update an existing rule
function applyUpdateSuggestion(suggestion) {
  // Find the rule file
  const rules = loadRules();
  const rule = rules.find(r => r.id === suggestion.ruleId);
  
  if (!rule) {
    console.log(chalk.red(`Rule ${suggestion.ruleId} not found.`));
    return;
  }
  
  // Load the rule content
  let content = fs.readFileSync(rule.path, 'utf8');
  
  // In a real implementation, this would intelligently modify the rule file
  // For this demo, we'll simply append the changes
  content += '\n\n## Updates\n\n';
  
  suggestion.changes.forEach(change => {
    content += `### ${change.section}\n\n`;
    content += `- ${change.guideline}\n\n`;
  });
  
  // Write the updated file
  fs.writeFileSync(rule.path, content);
  
  console.log(chalk.green(`Updated rule: ${rule.path}`));
}

// Apply a suggestion to deprecate a rule
function applyDeprecateSuggestion(suggestion) {
  // Find the rule file
  const rules = loadRules();
  const rule = rules.find(r => r.id === suggestion.ruleId);
  
  if (!rule) {
    console.log(chalk.red(`Rule ${suggestion.ruleId} not found.`));
    return;
  }
  
  // Load the rule content
  let content = fs.readFileSync(rule.path, 'utf8');
  
  // Mark the rule as deprecated by adding a comment at the top
  content = `# [DEPRECATED] ${content.replace(/^# /, '')}`;
  
  // Add deprecation notice
  content = content + '\n\n## Deprecation Notice\n\n';
  content += `This rule has been deprecated for the following reason: ${suggestion.reason}\n`;
  
  // Write the updated file
  fs.writeFileSync(rule.path, content);
  
  console.log(chalk.yellow(`Deprecated rule: ${rule.path}`));
}

// Helper function to format confidence percentage
function formatConfidence(confidence) {
  const percentage = Math.round(confidence * 100);
  let color = chalk.red;
  
  if (percentage >= 80) {
    color = chalk.green;
  } else if (percentage >= 50) {
    color = chalk.yellow;
  }
  
  return color(`${percentage}%`);
}

// Helper function to extract keywords
function extractKeywords(text) {
  if (!text) return {};
  
  const keywords = {};
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !isCommonWord(word));
  
  words.forEach(word => {
    keywords[word] = (keywords[word] || 0) + 1;
  });
  
  return keywords;
}

// Helper function to check for common words
function isCommonWord(word) {
  const commonWords = ['this', 'that', 'with', 'from', 'have', 'their', 'will', 'would', 'about', 'there'];
  return commonWords.includes(word);
} 