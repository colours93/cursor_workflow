import fs from 'fs';
import path from 'path';
import * as globModule from 'glob';
import chalk from 'chalk';
import { loadRules } from './rules.js';

const glob = globModule.glob;

// Initialize the workflow system
export function initWorkflow(options) {
  console.log(chalk.cyan('Initializing Cursor Workflow Workflow System...'));
  
  // Create necessary directories
  setupDirectories();
  
  // Create initial tasks.json if it doesn't exist
  setupTasksFile();
  
  // Import rules if specified
  if (options.importRules) {
    importRules(options.importRules);
  }
  
  // Create initial demo task if no tasks exist
  createInitialTask();
  
  // Setup package.json scripts
  setupPackageJsonScripts();
  
  console.log(chalk.green('\nInitialization complete!'));
  console.log('Run the workflow system with the following commands:');
  console.log(chalk.cyan('  node scripts/dev.js list') + ' - List all tasks');
  console.log(chalk.cyan('  node scripts/dev.js rule-list') + ' - List all rules');
  console.log(chalk.cyan('  node scripts/dev.js next') + ' - Show the next task to work on');
  console.log(chalk.cyan('  node scripts/dev.js expand --id=<id>') + ' - Expand a task with subtasks');
  console.log(chalk.cyan('  node scripts/dev.js verify --task-id=<id> --path=<path>') + ' - Verify task implementation against rules');
}

// Setup necessary directories
function setupDirectories() {
  const directories = [
    'tasks',
    '.cursor/rules'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// Setup initial tasks.json file
function setupTasksFile() {
  const tasksFile = 'tasks/tasks.json';
  
  if (!fs.existsSync(tasksFile)) {
    const initialTasks = [];
    fs.writeFileSync(tasksFile, JSON.stringify(initialTasks, null, 2));
    console.log(`Created empty tasks file: ${tasksFile}`);
  } else {
    console.log(`Tasks file already exists: ${tasksFile}`);
  }
}

// Import rules from a directory
function importRules(rulesDir) {
  if (!fs.existsSync(rulesDir)) {
    console.log(chalk.red(`Rules directory not found: ${rulesDir}`));
    return;
  }
  
  const ruleFiles = glob.sync(`${rulesDir}/**/*.mdc`);
  
  if (ruleFiles.length === 0) {
    console.log(chalk.yellow(`No rule files found in ${rulesDir}`));
    return;
  }
  
  let importCount = 0;
  
  ruleFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    const targetPath = path.join('.cursor/rules', fileName);
    
    // Skip if file already exists
    if (fs.existsSync(targetPath)) {
      console.log(chalk.yellow(`Rule already exists, skipping: ${fileName}`));
      return;
    }
    
    // Copy the file
    fs.copyFileSync(filePath, targetPath);
    importCount++;
  });
  
  console.log(chalk.green(`Imported ${importCount} rules from ${rulesDir}`));
}

// Create an initial demo task if no tasks exist
function createInitialTask() {
  const tasksFile = 'tasks/tasks.json';
  let tasks = [];
  
  if (fs.existsSync(tasksFile)) {
    tasks = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
  }
  
  if (tasks.length === 0) {
    // Create a demo task
    const demoTask = {
      id: 1,
      title: 'Set Up Project Structure',
      description: 'Initialize the project structure following the Cursor Workflow standards',
      status: 'pending',
      priority: 'high',
      createdAt: new Date().toISOString(),
      details: 'Create the initial project structure following the guidelines in the project_structure rule. This includes setting up directories, configuration files, and basic components.',
      testStrategy: 'Verify that all required directories and files exist and follow the naming conventions.',
      applicableRules: ['project_structure', 'typescript_standards']
    };
    
    tasks.push(demoTask);
    fs.writeFileSync(tasksFile, JSON.stringify(tasks, null, 2));
    
    // Create the task file
    const taskFilePath = 'tasks/task-1.md';
    let content = `# Task ID: 1\n`;
    content += `# Title: Set Up Project Structure\n`;
    content += `# Status: pending\n`;
    content += `# Dependencies: none\n`;
    content += `# Priority: high\n`;
    content += `# Description: Initialize the project structure following the Cursor Workflow standards\n\n`;
    content += `# Details:\n`;
    content += `Create the initial project structure following the guidelines in the project_structure rule. This includes setting up directories, configuration files, and basic components.\n\n`;
    content += `# Test Strategy:\n`;
    content += `Verify that all required directories and files exist and follow the naming conventions.\n\n`;
    content += `# Applicable Rules: project_structure, typescript_standards\n`;
    
    fs.writeFileSync(taskFilePath, content);
    
    console.log(chalk.green('Created initial demo task'));
  }
}

// Setup package.json scripts
function setupPackageJsonScripts() {
  const packageJsonPath = 'package.json';
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log(chalk.yellow('package.json not found, skipping script setup'));
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Add workflow scripts
    const workflowScripts = {
      'workflow:list': 'node scripts/dev.js list',
      'workflow:rules': 'node scripts/dev.js rule-list',
      'workflow:next': 'node scripts/dev.js next',
      'workflow:expand': 'node scripts/dev.js expand',
      'workflow:verify': 'node scripts/dev.js verify',
      'workflow:analyze': 'node scripts/dev.js analyze',
      'workflow:suggest': 'node scripts/dev.js suggest'
    };
    
    let scriptCount = 0;
    for (const [name, command] of Object.entries(workflowScripts)) {
      if (!packageJson.scripts[name]) {
        packageJson.scripts[name] = command;
        scriptCount++;
      }
    }
    
    if (scriptCount > 0) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
      console.log(chalk.green(`Added ${scriptCount} workflow scripts to package.json`));
    } else {
      console.log('Workflow scripts already exist in package.json');
    }
  } catch (error) {
    console.error(`Error updating package.json: ${error.message}`);
  }
}

// Analyze files for tasks
function analyzeProjectForTasks() {
  // Placeholder for more sophisticated analysis
  // In a real implementation, this would scan the project files
  // and suggest tasks based on the project structure
  
  const rules = loadRules();
  
  // Extract task-related information from rules
  const taskSuggestions = [];
  
  rules.forEach(rule => {
    // Look for "todo" or similar markers in rules
    const todoMatches = rule.content.match(/todo:?([^\n]+)/gi);
    if (todoMatches) {
      todoMatches.forEach(match => {
        taskSuggestions.push({
          title: `Implement ${match.replace(/todo:?\s*/i, '')}`,
          description: `Based on rule: ${rule.id}`,
          applicableRules: [rule.id]
        });
      });
    }
  });
  
  return taskSuggestions;
} 