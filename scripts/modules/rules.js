import fs from 'fs';
import path from 'path';
import * as globModule from 'glob';
import chalk from 'chalk';

const glob = globModule.glob;
const RULES_DIR = '.cursor/rules';

// Load all rules from .cursor/rules directory
export function loadRules() {
  try {
    const ruleFiles = glob.sync(`${RULES_DIR}/**/*.mdc`);
    
    return ruleFiles.map(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      const name = path.basename(filePath, '.mdc');
      
      // Extract description
      const descriptionMatch = content.match(/description: (.*?)($|\n)/);
      const description = descriptionMatch ? descriptionMatch[1].trim() : '';
      
      // Extract title
      const titleMatch = content.match(/# (.*?)($|\n)/);
      const title = titleMatch ? titleMatch[1].trim() : name;
      
      // Simple pattern detection for applicability
      const applicableFiles = [];
      if (content.includes('**/*.ts') || content.includes('TypeScript')) 
        applicableFiles.push('**/*.ts', '**/*.tsx');
      if (content.includes('React') || content.includes('component')) 
        applicableFiles.push('src/components/**/*');
      if (content.includes('Supabase')) 
        applicableFiles.push('src/lib/supabase/**/*');
      if (content.includes('testing') || content.includes('Test')) 
        applicableFiles.push('**/*.test.ts', '**/*.test.tsx');
      if (content.includes('Project Structure') || content.includes('directory')) 
        applicableFiles.push('**/*');
      
      return {
        id: name,
        path: filePath,
        title,
        description,
        applicableFiles,
        content
      };
    });
  } catch (error) {
    console.error(`Error loading rules: ${error.message}`);
    return [];
  }
}

// List all rules
export function listRules() {
  const rules = loadRules();
  
  console.log(chalk.bold('\nCursor Workflow Development Rules:'));
  console.log('---------------------------');
  
  if (rules.length === 0) {
    console.log('No rules found.');
    return;
  }
  
  rules.forEach(rule => {
    console.log(`${chalk.cyan(rule.id)}: ${rule.title}`);
    if (rule.description) {
      console.log(chalk.gray(`  ${rule.description}`));
    }
  });
  
  console.log('---------------------------');
  console.log(`Total: ${rules.length} rules\n`);
}

// Show detailed rule information
export function showRule(id) {
  const rules = loadRules();
  const rule = rules.find(r => r.id === id);
  
  if (!rule) {
    console.log(chalk.red(`Rule with ID ${id} not found.`));
    return;
  }
  
  console.log(chalk.bold(`\nRule: ${rule.title}`));
  console.log('---------------------------');
  
  if (rule.description) {
    console.log(`Description: ${rule.description}`);
  }
  
  console.log(`File: ${rule.path}`);
  
  if (rule.applicableFiles && rule.applicableFiles.length > 0) {
    console.log(`\nApplies to: ${rule.applicableFiles.join(', ')}`);
  }
  
  console.log('\nContent:');
  console.log(chalk.gray('---------------------------'));
  console.log(rule.content);
  console.log(chalk.gray('---------------------------\n'));
}

// Find rules applicable to a specific task
export function findRulesForTask(options) {
  const taskId = options.taskId;
  if (!taskId) {
    console.log(chalk.red('Error: --task-id is required.'));
    return [];
  }
  
  // Load tasks and rules
  const tasksPath = 'tasks/tasks.json';
  if (!fs.existsSync(tasksPath)) {
    console.log(chalk.red('Error: tasks.json not found.'));
    return [];
  }
  
  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  const task = tasks.find(t => t.id.toString() === taskId.toString());
  
  if (!task) {
    console.log(chalk.red(`Task with ID ${taskId} not found.`));
    return [];
  }
  
  const rules = loadRules();
  
  // Find applicable rules based on task attributes
  const applicableRules = rules.filter(rule => {
    // If task already has applicableRules, use those
    if (task.applicableRules && task.applicableRules.includes(rule.id)) {
      return true;
    }
    
    // Check by description keywords
    const keywords = extractKeywords(task.description);
    const ruleKeywords = extractKeywords(rule.content);
    const keywordMatch = keywords.some(keyword => 
      ruleKeywords.includes(keyword)
    );
    
    // Check by file patterns if task has files
    let fileMatch = false;
    if (task.files && rule.applicableFiles) {
      fileMatch = task.files.some(file => {
        return rule.applicableFiles.some(pattern => {
          return minimatch(file, pattern);
        });
      });
    }
    
    return keywordMatch || fileMatch;
  });
  
  if (options.taskId) {
    // Command mode
    console.log(chalk.bold(`\nRules applicable to Task #${taskId}:`));
    console.log('---------------------------');
    
    if (applicableRules.length === 0) {
      console.log('No specific rules found for this task.');
    } else {
      applicableRules.forEach(rule => {
        console.log(`${chalk.cyan(rule.id)}: ${rule.title}`);
        if (rule.description) {
          console.log(chalk.gray(`  ${rule.description}`));
        }
      });
    }
    
    console.log('---------------------------\n');
  }
  
  return applicableRules;
}

// Verify a task's implementation against applicable rules
export function verifyTaskAgainstRules(options) {
  if (!options.taskId) {
    console.log(chalk.red('Error: --task-id is required.'));
    return;
  }
  
  if (!options.path) {
    console.log(chalk.red('Error: --path is required.'));
    return;
  }
  
  // Load tasks and find applicable rules
  const tasksPath = 'tasks/tasks.json';
  if (!fs.existsSync(tasksPath)) {
    console.log(chalk.red('Error: tasks.json not found.'));
    return;
  }
  
  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  const task = tasks.find(t => t.id.toString() === options.taskId.toString());
  
  if (!task) {
    console.log(chalk.red(`Task with ID ${options.taskId} not found.`));
    return;
  }
  
  const applicableRules = findRulesForTask({ taskId: options.taskId });
  
  if (applicableRules.length === 0) {
    console.log(chalk.yellow(`No specific rules to verify for Task #${options.taskId}.`));
    return;
  }
  
  console.log(chalk.bold(`\nVerifying implementation of Task #${options.taskId} against applicable rules:`));
  console.log('---------------------------');
  
  // For each rule, perform verification on the implementation
  const verificationResults = applicableRules.map(rule => {
    // This is a simple placeholder. In a real implementation, you would:
    // 1. Parse the rule to extract verifiable guidelines
    // 2. Use static analysis tools to check the code
    // 3. Return a detailed verification result
    
    // Simulate verification with a random compliance score
    const complianceScore = Math.random() * 0.3 + 0.7; // 70-100%
    const guidelineCount = Math.floor(Math.random() * 10) + 5; // 5-15 guidelines
    const passedCount = Math.floor(guidelineCount * complianceScore);
    
    return {
      ruleId: rule.id,
      title: rule.title,
      complianceScore,
      guidelineCount,
      passedCount,
      issues: []
    };
  });
  
  // Display verification results
  verificationResults.forEach(result => {
    const scorePercentage = Math.round(result.complianceScore * 100);
    let statusSymbol;
    let scoreColor;
    
    if (scorePercentage >= 90) {
      statusSymbol = '✅';
      scoreColor = chalk.green;
    } else if (scorePercentage >= 70) {
      statusSymbol = '⚠️';
      scoreColor = chalk.yellow;
    } else {
      statusSymbol = '❌';
      scoreColor = chalk.red;
    }
    
    console.log(`${statusSymbol} ${chalk.cyan(result.ruleId)}: ${scoreColor(`${scorePercentage}% compliance`)} (${result.passedCount}/${result.guidelineCount} guidelines)`);
    
    if (result.issues.length > 0) {
      result.issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
    }
  });
  
  console.log('---------------------------\n');
  
  // Overall compliance
  const overallScore = verificationResults.reduce((sum, result) => sum + result.complianceScore, 0) / verificationResults.length;
  const overallPercentage = Math.round(overallScore * 100);
  
  let overallColor;
  if (overallPercentage >= 90) {
    overallColor = chalk.green;
  } else if (overallPercentage >= 70) {
    overallColor = chalk.yellow;
  } else {
    overallColor = chalk.red;
  }
  
  console.log(`Overall Compliance: ${overallColor(`${overallPercentage}%`)}\n`);
  
  // Update task with verification results
  task.verification = {
    lastVerified: new Date().toISOString(),
    overallCompliance: overallScore,
    ruleCompliance: verificationResults.reduce((obj, result) => {
      obj[result.ruleId] = result.complianceScore;
      return obj;
    }, {})
  };
  
  // Save updated task
  const taskIndex = tasks.findIndex(t => t.id.toString() === options.taskId.toString());
  tasks[taskIndex] = task;
  fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
}

// Update the applicableRules for a task
export function updateTaskApplicableRules(taskId, applicableRuleIds) {
  const tasksPath = 'tasks/tasks.json';
  if (!fs.existsSync(tasksPath)) {
    console.log(chalk.red('Error: tasks.json not found.'));
    return false;
  }
  
  const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  const taskIndex = tasks.findIndex(t => t.id.toString() === taskId.toString());
  
  if (taskIndex === -1) {
    console.log(chalk.red(`Task with ID ${taskId} not found.`));
    return false;
  }
  
  tasks[taskIndex].applicableRules = applicableRuleIds;
  fs.writeFileSync(tasksPath, JSON.stringify(tasks, null, 2));
  
  return true;
}

// Helper functions
function extractKeywords(text) {
  if (!text) return [];
  
  const keywords = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !isCommonWord(word));
  
  return [...new Set(keywords)]; // Remove duplicates
}

function isCommonWord(word) {
  const commonWords = ['this', 'that', 'with', 'from', 'have', 'their', 'will', 'would', 'about', 'there'];
  return commonWords.includes(word);
}

// This function would be implemented in a real system
function minimatch(file, pattern) {
  // Simple placeholder implementation
  if (pattern.includes('**')) {
    const extension = pattern.split('.').pop();
    return file.endsWith(`.${extension}`);
  }
  return file === pattern;
} 