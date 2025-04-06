import fs from 'fs';
import chalk from 'chalk';
import { loadTasks, saveTasks } from './tasks.js';
import { findRulesForTask } from './rules.js';

// Expand a task with subtasks
export function expandTask(options) {
  if (!options.id) {
    console.log(chalk.red('Error: --id is required.'));
    return;
  }
  
  const tasks = loadTasks();
  const taskIndex = tasks.findIndex(t => t.id.toString() === options.id.toString());
  
  if (taskIndex === -1) {
    console.log(chalk.red(`Task with ID ${options.id} not found.`));
    return;
  }
  
  const task = tasks[taskIndex];
  
  // Check if task already has subtasks
  if (task.subtasks && task.subtasks.length > 0) {
    console.log(chalk.yellow(`Task #${options.id} already has ${task.subtasks.length} subtasks.`));
    console.log(chalk.yellow('Use --force to regenerate subtasks.\n'));
    
    if (!options.force) {
      console.log('Current subtasks:');
      task.subtasks.forEach(subtask => {
        const subtaskStatus = subtask.status || 'pending';
        const statusColor = getStatusColor(subtaskStatus);
        console.log(`  ${chalk.bold(`[${subtask.id}]`)} ${subtask.title} - ${statusColor(subtaskStatus)}`);
      });
      return;
    }
  }
  
  // Get applicable rules
  const applicableRules = findRulesForTask({ taskId: options.id });
  
  // Determine number of subtasks to generate
  const subtaskCount = options.num ? parseInt(options.num, 10) : getDefaultSubtaskCount(task);
  
  console.log(chalk.cyan(`Generating ${subtaskCount} subtasks for Task #${options.id}...`));
  
  // In a real implementation, you would use AI to generate subtasks based on the task and applicable rules
  // For this demo, we'll create simple placeholder subtasks
  const subtasks = generateSubtasks(task, subtaskCount, applicableRules);
  
  // Update task with subtasks
  task.subtasks = subtasks;
  tasks[taskIndex] = task;
  
  // Save updated tasks
  saveTasks(tasks);
  
  console.log(chalk.green(`\nGenerated ${subtasks.length} subtasks for Task #${options.id}:`));
  subtasks.forEach(subtask => {
    console.log(`  ${chalk.bold(`[${subtask.id}]`)} ${subtask.title}`);
    console.log(`    ${chalk.gray(subtask.description)}`);
  });
  
  // Regenerate task files
  regenerateTaskFile(task);
}

// Generate subtasks based on task and rules
function generateSubtasks(task, count, applicableRules) {
  const subtasks = [];
  
  // Use task description and applicable rules to determine subtask types
  const isSetupTask = task.description.toLowerCase().includes('setup') || 
                     task.description.toLowerCase().includes('initialize');
  
  const isUITask = task.description.toLowerCase().includes('ui') || 
                   task.description.toLowerCase().includes('component') ||
                   task.description.toLowerCase().includes('interface');
  
  const isDataTask = task.description.toLowerCase().includes('data') || 
                    task.description.toLowerCase().includes('database') ||
                    task.description.toLowerCase().includes('model');
  
  const isAuthTask = task.description.toLowerCase().includes('auth') || 
                    task.description.toLowerCase().includes('authentication') ||
                    task.description.toLowerCase().includes('login');
  
  const isTestTask = task.description.toLowerCase().includes('test') || 
                    task.description.toLowerCase().includes('testing');
  
  // Create appropriate subtasks based on task type
  let subtaskTypes = [];
  
  if (isSetupTask) {
    subtaskTypes = [
      { type: 'Research', desc: 'Research and gather requirements' },
      { type: 'Design', desc: 'Design the architecture and structure' },
      { type: 'Implementation', desc: 'Implement the core functionality' },
      { type: 'Configuration', desc: 'Configure the system' },
      { type: 'Documentation', desc: 'Document the setup process' }
    ];
  } else if (isUITask) {
    subtaskTypes = [
      { type: 'Design', desc: 'Design the UI component' },
      { type: 'Structure', desc: 'Create the component structure' },
      { type: 'Styling', desc: 'Style the component' },
      { type: 'Interaction', desc: 'Add user interactions' },
      { type: 'Testing', desc: 'Test the component' }
    ];
  } else if (isDataTask) {
    subtaskTypes = [
      { type: 'Schema', desc: 'Define the data schema' },
      { type: 'Model', desc: 'Create the data model' },
      { type: 'API', desc: 'Implement API endpoints' },
      { type: 'Integration', desc: 'Integrate with the database' },
      { type: 'Testing', desc: 'Test data operations' }
    ];
  } else if (isAuthTask) {
    subtaskTypes = [
      { type: 'Provider', desc: 'Set up authentication provider' },
      { type: 'Routes', desc: 'Create authentication routes' },
      { type: 'UI', desc: 'Implement authentication UI' },
      { type: 'Logic', desc: 'Implement authentication logic' },
      { type: 'Testing', desc: 'Test authentication flow' }
    ];
  } else if (isTestTask) {
    subtaskTypes = [
      { type: 'Plan', desc: 'Create test plan' },
      { type: 'Unit', desc: 'Implement unit tests' },
      { type: 'Integration', desc: 'Implement integration tests' },
      { type: 'E2E', desc: 'Implement end-to-end tests' },
      { type: 'Documentation', desc: 'Document test results' }
    ];
  } else {
    // Default subtask types
    subtaskTypes = [
      { type: 'Research', desc: 'Research and gather requirements' },
      { type: 'Design', desc: 'Design the solution' },
      { type: 'Implementation', desc: 'Implement the solution' },
      { type: 'Testing', desc: 'Test the implementation' },
      { type: 'Documentation', desc: 'Document the implementation' }
    ];
  }
  
  // Create subtasks up to the requested count
  for (let i = 0; i < count; i++) {
    const subtaskType = subtaskTypes[i % subtaskTypes.length];
    
    const subtask = {
      id: `${task.id}.${i + 1}`,
      title: `${subtaskType.type} ${task.title}`,
      description: `${subtaskType.desc} for ${task.title.toLowerCase()}`,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    // Add applicable rules to subtask if relevant
    if (applicableRules && applicableRules.length > 0) {
      // Filter applicable rules based on subtask type
      let relevantRules;
      
      if (subtaskType.type === 'Design' && applicableRules.some(r => r.id.includes('typescript'))) {
        relevantRules = applicableRules.filter(r => r.id.includes('typescript') || r.id.includes('project_structure'));
      } else if (subtaskType.type === 'Implementation' && applicableRules.some(r => r.id.includes('supabase'))) {
        relevantRules = applicableRules.filter(r => r.id.includes('supabase') || r.id.includes('typescript'));
      } else if (subtaskType.type === 'Testing' && applicableRules.some(r => r.id.includes('testing'))) {
        relevantRules = applicableRules.filter(r => r.id.includes('testing'));
      } else if (subtaskType.type === 'UI' && applicableRules.some(r => r.id.includes('ui'))) {
        relevantRules = applicableRules.filter(r => r.id.includes('ui') || r.id.includes('component'));
      } else {
        relevantRules = applicableRules;
      }
      
      subtask.applicableRules = relevantRules.map(r => r.id);
    }
    
    subtasks.push(subtask);
  }
  
  return subtasks;
}

// Determine default number of subtasks based on task complexity
function getDefaultSubtaskCount(task) {
  // Simple heuristic based on description length and priority
  const descriptionLength = task.description ? task.description.length : 0;
  const priorityMultiplier = task.priority === 'high' ? 1.5 : 
                             task.priority === 'medium' ? 1 : 0.75;
  
  // Calculate a complexity score (1-10)
  let complexity = Math.min(10, Math.max(1, Math.ceil(descriptionLength / 50) * priorityMultiplier));
  
  // Map complexity to subtask count (3-7)
  return Math.min(7, Math.max(3, Math.floor(complexity / 2) + 2));
}

// Regenerate task file
function regenerateTaskFile(task) {
  const fileName = `tasks/task-${task.id}.md`;
  
  let content = `# Task ID: ${task.id}\n`;
  content += `# Title: ${task.title}\n`;
  content += `# Status: ${task.status}\n`;
  
  if (task.dependencies && task.dependencies.length > 0) {
    content += `# Dependencies: ${task.dependencies.join(', ')}\n`;
  } else {
    content += `# Dependencies: none\n`;
  }
  
  content += `# Priority: ${task.priority || 'medium'}\n`;
  content += `# Description: ${task.description}\n\n`;
  
  if (task.details) {
    content += `# Details:\n${task.details}\n\n`;
  }
  
  if (task.testStrategy) {
    content += `# Test Strategy:\n${task.testStrategy}\n\n`;
  }
  
  if (task.applicableRules && task.applicableRules.length > 0) {
    content += `# Applicable Rules: ${task.applicableRules.join(', ')}\n\n`;
  }
  
  if (task.subtasks && task.subtasks.length > 0) {
    content += `# Subtasks:\n`;
    task.subtasks.forEach(subtask => {
      content += `## ${subtask.id}: ${subtask.title}\n`;
      content += `Status: ${subtask.status || 'pending'}\n`;
      content += `Description: ${subtask.description}\n`;
      
      if (subtask.applicableRules && subtask.applicableRules.length > 0) {
        content += `Applicable Rules: ${subtask.applicableRules.join(', ')}\n`;
      }
      
      content += `\n`;
    });
  }
  
  fs.writeFileSync(fileName, content);
}

// Helper functions
function getStatusColor(status) {
  switch (status) {
    case 'done':
    case 'completed':
      return chalk.green;
    case 'in-progress':
      return chalk.blue;
    case 'pending':
      return chalk.yellow;
    case 'deferred':
      return chalk.gray;
    default:
      return chalk.white;
  }
} 