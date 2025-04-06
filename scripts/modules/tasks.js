import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { findRulesForTask } from './rules.js';

const TASKS_FILE = 'tasks/tasks.json';

// Load tasks from JSON file
export function loadTasks() {
  try {
    if (!fs.existsSync(TASKS_FILE)) {
      return [];
    }
    const data = fs.readFileSync(TASKS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading tasks: ${error.message}`);
    return [];
  }
}

// Save tasks to JSON file
export function saveTasks(tasks) {
  try {
    const tasksDir = path.dirname(TASKS_FILE);
    if (!fs.existsSync(tasksDir)) {
      fs.mkdirSync(tasksDir, { recursive: true });
    }
    fs.writeFileSync(TASKS_FILE, JSON.stringify(tasks, null, 2));
  } catch (error) {
    console.error(`Error saving tasks: ${error.message}`);
  }
}

// List all tasks
export function listTasks(options) {
  const tasks = loadTasks();
  
  // Filter by status if provided
  const filteredTasks = options.status
    ? tasks.filter(task => task.status === options.status)
    : tasks;
  
  console.log(chalk.bold('\nCursor Workflow Tasks:'));
  console.log('------------------');
  
  if (filteredTasks.length === 0) {
    console.log('No tasks found.');
    return;
  }
  
  filteredTasks.forEach(task => {
    const statusColor = getStatusColor(task.status);
    console.log(`${chalk.bold(`[${task.id}]`)} ${task.title} - ${statusColor(task.status)}`);
    
    if (options.withRules && task.applicableRules && task.applicableRules.length > 0) {
      console.log(chalk.gray(`  Applicable Rules: ${task.applicableRules.join(', ')}`));
    }
  });
  
  console.log('------------------');
  console.log(`Total: ${filteredTasks.length} tasks\n`);
}

// Show detailed task information
export function showTask(id, options) {
  const tasks = loadTasks();
  const task = tasks.find(t => t.id.toString() === id.toString());
  
  if (!task) {
    console.log(chalk.red(`Task with ID ${id} not found.`));
    return;
  }
  
  const statusColor = getStatusColor(task.status);
  
  console.log(chalk.bold(`\nTask #${task.id}: ${task.title}`));
  console.log('------------------');
  console.log(`Status: ${statusColor(task.status)}`);
  console.log(`Priority: ${getPriorityColor(task.priority)(task.priority)}`);
  
  if (task.dependencies && task.dependencies.length > 0) {
    const deps = task.dependencies.map(depId => {
      const depTask = tasks.find(t => t.id.toString() === depId.toString());
      if (depTask) {
        const depStatusColor = getStatusColor(depTask.status);
        return `${depId} (${depStatusColor(depTask.status)})`;
      }
      return depId;
    });
    console.log(`Dependencies: ${deps.join(', ')}`);
  }
  
  console.log(`\nDescription: ${task.description}`);
  
  if (task.details) {
    console.log('\nDetails:');
    console.log(task.details);
  }
  
  if (task.testStrategy) {
    console.log('\nTest Strategy:');
    console.log(task.testStrategy);
  }
  
  if (task.subtasks && task.subtasks.length > 0) {
    console.log('\nSubtasks:');
    task.subtasks.forEach(subtask => {
      const subtaskStatusColor = getStatusColor(subtask.status || 'pending');
      console.log(`  ${chalk.bold(`[${subtask.id}]`)} ${subtask.title} - ${subtaskStatusColor(subtask.status || 'pending')}`);
    });
  }
  
  if (options.withRules) {
    const rules = findRulesForTask(task);
    if (rules.length > 0) {
      console.log('\nApplicable Rules:');
      rules.forEach(rule => {
        console.log(`  - ${chalk.cyan(rule.id)}: ${rule.title}`);
      });
    } else {
      console.log('\nNo specific rules apply to this task.');
    }
  }
  
  console.log('------------------\n');
}

// Set task status
export function setTaskStatus(options) {
  if (!options.id || !options.status) {
    console.log(chalk.red('Error: Both --id and --status are required.'));
    return;
  }
  
  const tasks = loadTasks();
  const taskIndex = tasks.findIndex(t => t.id.toString() === options.id.toString());
  
  if (taskIndex === -1) {
    console.log(chalk.red(`Task with ID ${options.id} not found.`));
    return;
  }
  
  const oldStatus = tasks[taskIndex].status;
  tasks[taskIndex].status = options.status;
  
  if (options.status === 'done' || options.status === 'completed') {
    tasks[taskIndex].completedAt = new Date().toISOString();
  }
  
  saveTasks(tasks);
  
  console.log(chalk.green(`Task #${options.id} status updated from "${oldStatus}" to "${options.status}".`));
}

// Show next task to work on
export function nextTask(options) {
  const tasks = loadTasks();
  
  // Find tasks that are pending and have all dependencies completed
  const availableTasks = tasks.filter(task => {
    if (task.status !== 'pending') return false;
    
    // Check dependencies
    if (task.dependencies && task.dependencies.length > 0) {
      const uncompletedDeps = task.dependencies.filter(depId => {
        const depTask = tasks.find(t => t.id.toString() === depId.toString());
        return !depTask || depTask.status !== 'done';
      });
      
      if (uncompletedDeps.length > 0) return false;
    }
    
    return true;
  });
  
  if (availableTasks.length === 0) {
    console.log(chalk.yellow('No available tasks found. All tasks may be completed or have unmet dependencies.'));
    return;
  }
  
  // Sort by priority and then by ID
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  availableTasks.sort((a, b) => {
    const aPriority = a.priority ? priorityOrder[a.priority] || 999 : 999;
    const bPriority = b.priority ? priorityOrder[b.priority] || 999 : 999;
    
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.id - b.id;
  });
  
  // Show the next task
  const nextTask = availableTasks[0];
  showTask(nextTask.id, options);
  
  // Suggest commands
  console.log(chalk.cyan('Suggested commands:'));
  console.log(`  Start working on this task: ${chalk.gray(`node scripts/dev.js set-status --id=${nextTask.id} --status=in-progress`)}`);
  console.log(`  Mark as completed: ${chalk.gray(`node scripts/dev.js set-status --id=${nextTask.id} --status=done`)}`);
  
  if (!nextTask.subtasks || nextTask.subtasks.length === 0) {
    console.log(`  Expand into subtasks: ${chalk.gray(`node scripts/dev.js expand --id=${nextTask.id}`)}`);
  }
}

// Generate task files from tasks.json
export function generateTaskFiles() {
  const tasks = loadTasks();
  
  if (tasks.length === 0) {
    console.log(chalk.yellow('No tasks found.'));
    return;
  }
  
  // Create tasks directory if it doesn't exist
  const tasksDir = 'tasks';
  if (!fs.existsSync(tasksDir)) {
    fs.mkdirSync(tasksDir, { recursive: true });
  }
  
  // Generate individual task files
  let generatedCount = 0;
  
  tasks.forEach(task => {
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
        content += `Description: ${subtask.description}\n\n`;
      });
    }
    
    fs.writeFileSync(fileName, content);
    generatedCount++;
  });
  
  console.log(chalk.green(`Generated ${generatedCount} task files in the tasks/ directory.`));
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

function getPriorityColor(priority) {
  switch (priority) {
    case 'high':
      return chalk.red;
    case 'medium':
      return chalk.yellow;
    case 'low':
      return chalk.green;
    default:
      return chalk.white;
  }
} 