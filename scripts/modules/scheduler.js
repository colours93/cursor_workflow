import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { loadTasks, saveTasks } from './tasks.js';
import dotenv from 'dotenv';

dotenv.config();

// Default values
const DEFAULT_PRIORITY = process.env.DEFAULT_PRIORITY || 'medium';

/**
 * Schedule tasks based on priority, dependencies, and estimated time
 * @param {Object} options - Command options
 */
export async function scheduleTasks(options = {}) {
  const tasksFile = options.file || 'tasks/tasks.json';
  const outputFile = options.output || 'tasks/schedule.json';
  
  console.log(chalk.cyan('Scheduling tasks...'));
  
  // Load tasks
  const tasks = loadTasks(tasksFile);
  
  if (!tasks || tasks.length === 0) {
    console.log(chalk.yellow('No tasks found to schedule.'));
    return;
  }
  
  // Prepare tasks for scheduling
  const prioritizedTasks = prioritizeTasks(tasks);
  
  // Create schedule
  const schedule = generateSchedule(prioritizedTasks, options);
  
  // Save schedule
  fs.ensureDirSync(path.dirname(outputFile));
  fs.writeJSONSync(outputFile, schedule, { spaces: 2 });
  
  console.log(chalk.green(`Task schedule created and saved to ${outputFile}`));
  
  displaySchedule(schedule);
  
  return schedule;
}

/**
 * Prioritize tasks based on various factors
 * @param {Array} tasks - List of tasks
 * @returns {Array} Prioritized tasks
 */
function prioritizeTasks(tasks) {
  // Skip completed tasks
  const activeTasks = tasks.filter(task => task.status !== 'done');
  
  // Calculate priority score for each task
  const scoredTasks = activeTasks.map(task => {
    const score = calculatePriorityScore(task, activeTasks);
    return { ...task, priorityScore: score };
  });
  
  // Sort by priority score (descending)
  return scoredTasks.sort((a, b) => b.priorityScore - a.priorityScore);
}

/**
 * Calculate a numeric priority score for a task
 * @param {Object} task - The task to score
 * @param {Array} allTasks - All active tasks
 * @returns {number} Priority score
 */
function calculatePriorityScore(task, allTasks) {
  let score = 50; // Base score
  
  // Adjust based on explicit priority
  switch (task.priority) {
    case 'critical':
      score += 40;
      break;
    case 'high':
      score += 30;
      break;
    case 'medium':
      score += 15;
      break;
    case 'low':
      score += 5;
      break;
    default:
      // Use default priority if not specified
      const defaultPriorityBoost = DEFAULT_PRIORITY === 'high' ? 30 : 
                                  DEFAULT_PRIORITY === 'medium' ? 15 : 5;
      score += defaultPriorityBoost;
  }
  
  // Adjust based on dependencies
  // Tasks that are dependencies for other tasks get higher priority
  if (allTasks.some(t => t.dependencies && t.dependencies.includes(task.id))) {
    score += 10;
    
    // Count how many tasks depend on this one
    const dependentCount = allTasks.filter(t => 
      t.dependencies && t.dependencies.includes(task.id)
    ).length;
    
    // Additional boost based on number of dependent tasks
    score += Math.min(20, dependentCount * 5);
  }
  
  // Adjust based on estimated time (if available)
  // Shorter tasks get a slight boost for quick wins
  if (task.estimatedHours && task.estimatedHours <= 2) {
    score += 5;
  }
  
  // Adjust based on due date (if available)
  if (task.dueDate) {
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) {
      // Overdue tasks get highest priority
      score += 50;
    } else if (daysUntilDue <= 1) {
      // Due today or tomorrow
      score += 40;
    } else if (daysUntilDue <= 3) {
      // Due within 3 days
      score += 30;
    } else if (daysUntilDue <= 7) {
      // Due within a week
      score += 20;
    }
  }
  
  // Adjust based on status
  if (task.status === 'in_progress') {
    // Boost in-progress tasks to maintain focus
    score += 15;
  }
  
  // Cap the score at 100
  return Math.min(100, score);
}

/**
 * Generate a schedule based on prioritized tasks
 * @param {Array} prioritizedTasks - Sorted tasks by priority
 * @param {Object} options - Command options
 * @returns {Object} Schedule
 */
function generateSchedule(prioritizedTasks, options = {}) {
  const today = new Date();
  const hoursPerDay = options.hoursPerDay || 6; // Default to 6 productive hours per day
  
  // Group tasks by priority category
  const criticalTasks = prioritizedTasks.filter(t => t.priorityScore >= 80);
  const highPriorityTasks = prioritizedTasks.filter(t => t.priorityScore >= 60 && t.priorityScore < 80);
  const mediumPriorityTasks = prioritizedTasks.filter(t => t.priorityScore >= 40 && t.priorityScore < 60);
  const lowPriorityTasks = prioritizedTasks.filter(t => t.priorityScore < 40);
  
  // Create schedule structure
  const schedule = {
    timestamp: new Date().toISOString(),
    totalTasks: prioritizedTasks.length,
    hoursPerDay,
    today: today.toISOString().split('T')[0], // YYYY-MM-DD format
    immediate: createTaskList(criticalTasks, 'Do these ASAP'),
    thisWeek: createTaskList(highPriorityTasks, 'Complete this week'),
    upcoming: createTaskList(mediumPriorityTasks, 'Tackle when immediate tasks are done'),
    backlog: createTaskList(lowPriorityTasks, 'Consider these after higher priorities'),
  };
  
  return schedule;
}

/**
 * Create a formatted task list for the schedule
 * @param {Array} tasks - Tasks for this section
 * @param {string} description - Section description
 * @returns {Object} Formatted task list
 */
function createTaskList(tasks, description) {
  let estimatedHours = 0;
  
  // Calculate total estimated hours
  tasks.forEach(task => {
    if (task.estimatedHours) {
      estimatedHours += task.estimatedHours;
    } else {
      // Default estimate if not specified
      estimatedHours += 2; // Assume 2 hours by default
    }
  });
  
  return {
    description,
    count: tasks.length,
    estimatedHours,
    tasks: tasks.map(task => ({
      id: task.id,
      title: task.title,
      priority: task.priority || DEFAULT_PRIORITY,
      priorityScore: task.priorityScore,
      status: task.status,
      estimatedHours: task.estimatedHours || 2,
      dueDate: task.dueDate || null,
      hasDependencies: task.dependencies && task.dependencies.length > 0,
      dependencies: task.dependencies || []
    }))
  };
}

/**
 * Display a formatted schedule in the console
 * @param {Object} schedule - Task schedule
 */
function displaySchedule(schedule) {
  // Display schedule header
  console.log(chalk.cyan.bold('\nTask Schedule'));
  console.log(chalk.gray(`Generated: ${new Date(schedule.timestamp).toLocaleString()}`));
  console.log(chalk.gray(`Today: ${schedule.today}`));
  console.log(chalk.gray(`Tasks: ${schedule.totalTasks} total`));
  console.log(chalk.gray(`Planning with ${schedule.hoursPerDay} productive hours per day\n`));
  
  // Display immediate tasks
  console.log(chalk.red.bold('Critical & Immediate:'));
  displayTaskGroup(schedule.immediate.tasks);
  
  // Display this week's tasks
  console.log(chalk.yellow.bold('\nThis Week:'));
  displayTaskGroup(schedule.thisWeek.tasks);
  
  // Display upcoming tasks
  console.log(chalk.blue.bold('\nUpcoming:'));
  displayTaskGroup(schedule.upcoming.tasks);
  
  // Display backlog tasks (optional)
  console.log(chalk.gray.bold('\nBacklog:'));
  console.log(chalk.gray(`${schedule.backlog.count} tasks (${schedule.backlog.estimatedHours} hours)`));
}

/**
 * Display a group of tasks in the console
 * @param {Array} tasks - Tasks to display
 */
function displayTaskGroup(tasks) {
  if (tasks.length === 0) {
    console.log(chalk.gray('  No tasks in this category.'));
    return;
  }
  
  tasks.forEach(task => {
    // Choose color based on status
    let statusColor;
    switch (task.status) {
      case 'in_progress':
        statusColor = chalk.yellow;
        break;
      case 'blocked':
        statusColor = chalk.red;
        break;
      default:
        statusColor = chalk.white;
    }
    
    // Format due date if present
    let dueString = '';
    if (task.dueDate) {
      const today = new Date();
      const dueDate = new Date(task.dueDate);
      const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
      
      if (daysUntilDue < 0) {
        dueString = chalk.red(`[OVERDUE by ${Math.abs(daysUntilDue)} days]`);
      } else if (daysUntilDue === 0) {
        dueString = chalk.yellow('[DUE TODAY]');
      } else if (daysUntilDue === 1) {
        dueString = chalk.yellow('[DUE TOMORROW]');
      } else {
        dueString = chalk.blue(`[Due in ${daysUntilDue} days]`);
      }
    }
    
    // Format task display
    const title = statusColor(task.title);
    const hours = task.estimatedHours ? `~${task.estimatedHours}h` : '';
    
    console.log(`  ${title} ${chalk.gray(hours)} ${dueString}`);
    
    // Show dependencies if any
    if (task.hasDependencies) {
      console.log(chalk.gray(`    Depends on: ${task.dependencies.join(', ')}`));
    }
  });
}

/**
 * Set priority for a specific task
 * @param {Object} options - Command options
 */
export async function setPriority(options = {}) {
  if (!options.id) {
    console.log(chalk.yellow('Task ID is required.'));
    return;
  }
  
  if (!options.priority) {
    console.log(chalk.yellow('Priority is required (critical, high, medium, low).'));
    return;
  }
  
  const tasksFile = options.file || 'tasks/tasks.json';
  
  // Validate priority
  const validPriorities = ['critical', 'high', 'medium', 'low'];
  if (!validPriorities.includes(options.priority)) {
    console.log(chalk.red(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`));
    return;
  }
  
  // Load tasks
  const tasks = loadTasks(tasksFile);
  
  if (!tasks || tasks.length === 0) {
    console.log(chalk.yellow('No tasks found.'));
    return;
  }
  
  // Find the task
  const taskIndex = tasks.findIndex(t => t.id === options.id);
  
  if (taskIndex === -1) {
    console.log(chalk.red(`Task with ID ${options.id} not found.`));
    return;
  }
  
  // Update task priority
  const oldPriority = tasks[taskIndex].priority || DEFAULT_PRIORITY;
  tasks[taskIndex].priority = options.priority;
  
  // Save updated tasks
  saveTasks(tasks, tasksFile);
  
  console.log(chalk.green(`Task ${options.id} priority updated from ${oldPriority} to ${options.priority}.`));
  
  // Optionally regenerate schedule
  if (options.updateSchedule) {
    return scheduleTasks(options);
  }
}

/**
 * Set estimated hours for a task
 * @param {Object} options - Command options
 */
export async function setEstimatedHours(options = {}) {
  if (!options.id) {
    console.log(chalk.yellow('Task ID is required.'));
    return;
  }
  
  if (!options.hours) {
    console.log(chalk.yellow('Hours are required.'));
    return;
  }
  
  const hours = parseFloat(options.hours);
  
  if (isNaN(hours) || hours <= 0) {
    console.log(chalk.red('Hours must be a positive number.'));
    return;
  }
  
  const tasksFile = options.file || 'tasks/tasks.json';
  
  // Load tasks
  const tasks = loadTasks(tasksFile);
  
  if (!tasks || tasks.length === 0) {
    console.log(chalk.yellow('No tasks found.'));
    return;
  }
  
  // Find the task
  const taskIndex = tasks.findIndex(t => t.id === options.id);
  
  if (taskIndex === -1) {
    console.log(chalk.red(`Task with ID ${options.id} not found.`));
    return;
  }
  
  // Update task estimated hours
  const oldHours = tasks[taskIndex].estimatedHours || 'unspecified';
  tasks[taskIndex].estimatedHours = hours;
  
  // Save updated tasks
  saveTasks(tasks, tasksFile);
  
  console.log(chalk.green(`Task ${options.id} estimated hours updated from ${oldHours} to ${hours}.`));
  
  // Optionally regenerate schedule
  if (options.updateSchedule) {
    return scheduleTasks(options);
  }
}

/**
 * Set a due date for a task
 * @param {Object} options - Command options
 */
export async function setDueDate(options = {}) {
  if (!options.id) {
    console.log(chalk.yellow('Task ID is required.'));
    return;
  }
  
  if (!options.date) {
    console.log(chalk.yellow('Due date is required (YYYY-MM-DD).'));
    return;
  }
  
  // Validate date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(options.date)) {
    console.log(chalk.red('Invalid date format. Use YYYY-MM-DD.'));
    return;
  }
  
  const tasksFile = options.file || 'tasks/tasks.json';
  
  // Load tasks
  const tasks = loadTasks(tasksFile);
  
  if (!tasks || tasks.length === 0) {
    console.log(chalk.yellow('No tasks found.'));
    return;
  }
  
  // Find the task
  const taskIndex = tasks.findIndex(t => t.id === options.id);
  
  if (taskIndex === -1) {
    console.log(chalk.red(`Task with ID ${options.id} not found.`));
    return;
  }
  
  // Update task due date
  const oldDate = tasks[taskIndex].dueDate || 'unspecified';
  tasks[taskIndex].dueDate = options.date;
  
  // Save updated tasks
  saveTasks(tasks, tasksFile);
  
  console.log(chalk.green(`Task ${options.id} due date updated from ${oldDate} to ${options.date}.`));
  
  // Optionally regenerate schedule
  if (options.updateSchedule) {
    return scheduleTasks(options);
  }
}
