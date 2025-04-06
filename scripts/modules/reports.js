import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { loadTasks } from './tasks.js';

/**
 * Generate an HTML report for a single task
 * @param {Object} task - The task to generate a report for
 * @param {Object} options - Options for the report
 */
export function generateTaskHtml(task, options = {}) {
  // Define output file path
  const outputFile = options.output || `reports/task-${task.id}.html`;
  
  console.log(chalk.cyan(`Generating HTML report for task ${task.id}...`));
  
  // Load all tasks if we need to reference dependencies
  let allTasks = [];
  if (task.dependencies && task.dependencies.length > 0) {
    allTasks = loadTasks(options.file || 'tasks/tasks.json');
  }
  
  // Generate the HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task ${task.id}: ${task.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      border-bottom: 1px solid #eee;
      padding-bottom: 20px;
      margin-bottom: 20px;
    }
    h1 {
      margin-top: 0;
      color: #2c3e50;
    }
    .meta {
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
      margin-bottom: 20px;
    }
    .meta-item {
      padding: 5px 10px;
      border-radius: 4px;
      font-size: 14px;
      background: #f5f5f5;
    }
    .status {
      font-weight: bold;
    }
    .status-pending { background: #f8f9fa; }
    .status-in_progress { background: #fff3cd; color: #856404; }
    .status-blocked { background: #f8d7da; color: #721c24; }
    .status-done { background: #d4edda; color: #155724; }
    
    .priority-critical { background: #f8d7da; color: #721c24; font-weight: bold; }
    .priority-high { background: #fff3cd; color: #856404; }
    .priority-medium { background: #e2f0fb; color: #0c5460; }
    .priority-low { background: #d4edda; color: #155724; }
    
    .description, .details {
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 10px;
      color: #2c3e50;
    }
    .dependencies, .subtasks {
      margin-bottom: 20px;
    }
    .dependency-item {
      margin-bottom: 5px;
      padding: 5px 10px;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 14px;
    }
    .subtask-item {
      display: flex;
      align-items: center;
      margin-bottom: 5px;
    }
    .checkbox {
      margin-right: 10px;
      width: 20px;
      height: 20px;
      display: inline-block;
      text-align: center;
      line-height: 20px;
      border-radius: 3px;
    }
    .checkbox.checked {
      background: #28a745;
      color: white;
    }
    .checkbox.unchecked {
      background: #eee;
      border: 1px solid #ccc;
    }
    .timestamps {
      margin-top: 30px;
      font-size: 12px;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <header>
    <h1>Task ${task.id}: ${task.title}</h1>
    <div class="meta">
      <div class="meta-item status status-${task.status}">
        ${capitalizeFirstLetter(task.status.replace('_', ' '))}
      </div>
      ${task.priority ? `<div class="meta-item priority-${task.priority}">${capitalizeFirstLetter(task.priority)}</div>` : ''}
      ${task.dueDate ? `<div class="meta-item">Due: ${task.dueDate}</div>` : ''}
      ${task.estimatedHours ? `<div class="meta-item">Est: ${task.estimatedHours} hours</div>` : ''}
    </div>
  </header>
  
  ${task.description ? `
  <div class="description">
    <div class="section-title">Description</div>
    <p>${formatText(task.description)}</p>
  </div>
  ` : ''}
  
  ${task.details ? `
  <div class="details">
    <div class="section-title">Details</div>
    <p>${formatText(task.details)}</p>
  </div>
  ` : ''}
  
  ${task.dependencies && task.dependencies.length > 0 ? `
  <div class="dependencies">
    <div class="section-title">Dependencies</div>
    ${task.dependencies.map(depId => {
      const depTask = allTasks.find(t => t.id === depId);
      return `<div class="dependency-item">${depId}: ${depTask ? depTask.title : 'Task not found'} ${depTask ? `(${depTask.status})` : ''}</div>`;
    }).join('\n')}
  </div>
  ` : ''}
  
  ${task.subtasks && task.subtasks.length > 0 ? `
  <div class="subtasks">
    <div class="section-title">Subtasks</div>
    ${task.subtasks.map((subtask, index) => `
      <div class="subtask-item">
        <div class="checkbox ${subtask.done ? 'checked' : 'unchecked'}">${subtask.done ? '✓' : ''}</div>
        <div>${index + 1}. ${subtask.title}</div>
      </div>
    `).join('\n')}
  </div>
  ` : ''}
  
  <div class="timestamps">
    <div>Created: ${formatDate(task.created)}</div>
    <div>Last Updated: ${formatDate(task.updated)}</div>
  </div>
</body>
</html>
  `;
  
  // Ensure directory exists
  fs.ensureDirSync(path.dirname(outputFile));
  
  // Write the HTML file
  fs.writeFileSync(outputFile, html);
  
  console.log(chalk.green(`Report saved to ${outputFile}`));
  
  return outputFile;
}

/**
 * Generate an HTML dashboard of all tasks
 * @param {Object} options - Options for the dashboard
 */
export function generateDashboard(options = {}) {
  const tasksFile = options.file || 'tasks/tasks.json';
  const outputFile = options.output || 'reports/dashboard.html';
  
  console.log(chalk.cyan('Generating task dashboard...'));
  
  // Load tasks
  const tasks = loadTasks(tasksFile);
  
  if (!tasks || tasks.length === 0) {
    console.log(chalk.yellow('No tasks found to display in dashboard.'));
    return;
  }
  
  // Group tasks by status
  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const blockedTasks = tasks.filter(t => t.status === 'blocked');
  const doneTasks = tasks.filter(t => t.status === 'done');
  
  // Calculate statistics
  const totalTasks = tasks.length;
  const completionRate = Math.round((doneTasks.length / totalTasks) * 100);
  
  // Generate the HTML content
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cursor Workflow Dashboard</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
      background-color: #f8f9fa;
    }
    header {
      text-align: center;
      margin-bottom: 30px;
    }
    h1 {
      margin-top: 0;
      color: #2c3e50;
    }
    .dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
    }
    .card-title {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 15px;
      color: #2c3e50;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .card-count {
      background: #e9ecef;
      color: #495057;
      border-radius: 20px;
      padding: 2px 10px;
      font-size: 14px;
    }
    .task-item {
      margin-bottom: 10px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 4px;
      border-left: 4px solid #dee2e6;
    }
    .task-item.priority-critical { border-left-color: #dc3545; }
    .task-item.priority-high { border-left-color: #fd7e14; }
    .task-item.priority-medium { border-left-color: #0d6efd; }
    .task-item.priority-low { border-left-color: #198754; }
    
    .task-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 5px;
    }
    .task-id {
      font-size: 12px;
      color: #6c757d;
    }
    .task-title {
      font-weight: 500;
    }
    .task-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: #6c757d;
    }
    .progress-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 20px;
    }
    .progress-card {
      text-align: center;
      padding: 15px;
      flex: 1;
    }
    .progress-value {
      font-size: 28px;
      font-weight: bold;
      color: #2c3e50;
    }
    .progress-label {
      font-size: 14px;
      color: #6c757d;
    }
    .progress-bar-container {
      height: 20px;
      background-color: #e9ecef;
      border-radius: 10px;
      margin: 15px 0;
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      background-color: #0d6efd;
      width: ${completionRate}%;
    }
    .task-list {
      max-height: 400px;
      overflow-y: auto;
    }
    a {
      color: #0d6efd;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .timestamps {
      text-align: center;
      margin-top: 30px;
      font-size: 12px;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <header>
    <h1>Cursor Workflow Dashboard</h1>
  </header>
  
  <div class="progress-section">
    <div class="progress-card">
      <div class="progress-value">${totalTasks}</div>
      <div class="progress-label">Total Tasks</div>
    </div>
    
    <div class="progress-card">
      <div class="progress-bar-container">
        <div class="progress-bar"></div>
      </div>
      <div class="progress-value">${completionRate}%</div>
      <div class="progress-label">Completion Rate</div>
    </div>
    
    <div class="progress-card">
      <div class="progress-value">${inProgressTasks.length}</div>
      <div class="progress-label">In Progress</div>
    </div>
    
    <div class="progress-card">
      <div class="progress-value">${blockedTasks.length}</div>
      <div class="progress-label">Blocked</div>
    </div>
  </div>
  
  <div class="dashboard">
    <div class="card">
      <div class="card-title">
        In Progress
        <span class="card-count">${inProgressTasks.length}</span>
      </div>
      <div class="task-list">
        ${inProgressTasks.length > 0 ? inProgressTasks.map(task => generateTaskItemHtml(task)).join('\n') : '<div class="empty-message">No tasks in progress</div>'}
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">
        Pending
        <span class="card-count">${pendingTasks.length}</span>
      </div>
      <div class="task-list">
        ${pendingTasks.length > 0 ? pendingTasks.map(task => generateTaskItemHtml(task)).join('\n') : '<div class="empty-message">No pending tasks</div>'}
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">
        Blocked
        <span class="card-count">${blockedTasks.length}</span>
      </div>
      <div class="task-list">
        ${blockedTasks.length > 0 ? blockedTasks.map(task => generateTaskItemHtml(task)).join('\n') : '<div class="empty-message">No blocked tasks</div>'}
      </div>
    </div>
    
    <div class="card">
      <div class="card-title">
        Completed
        <span class="card-count">${doneTasks.length}</span>
      </div>
      <div class="task-list">
        ${doneTasks.length > 0 ? doneTasks.slice(0, 5).map(task => generateTaskItemHtml(task)).join('\n') : '<div class="empty-message">No completed tasks</div>'}
        ${doneTasks.length > 5 ? `<div class="task-item"><a href="#">View all ${doneTasks.length} completed tasks</a></div>` : ''}
      </div>
    </div>
  </div>
  
  <div class="timestamps">
    <div>Generated: ${formatDate(new Date().toISOString())}</div>
  </div>
</body>
</html>
  `;
  
  // Ensure directory exists
  fs.ensureDirSync(path.dirname(outputFile));
  
  // Write the HTML file
  fs.writeFileSync(outputFile, html);
  
  console.log(chalk.green(`Dashboard saved to ${outputFile}`));
  
  return outputFile;
}

/**
 * Generate HTML for a task item in the dashboard
 * @param {Object} task - The task
 * @returns {string} HTML for the task item
 */
function generateTaskItemHtml(task) {
  return `
  <div class="task-item priority-${task.priority || 'medium'}">
    <div class="task-header">
      <span class="task-id">${task.id}</span>
      ${task.dueDate ? `<span class="task-due-date">Due: ${task.dueDate}</span>` : ''}
    </div>
    <div class="task-title">${task.title}</div>
    <div class="task-meta">
      ${task.priority ? `<span class="task-priority">${capitalizeFirstLetter(task.priority)}</span>` : ''}
      ${task.estimatedHours ? `<span class="task-hours">${task.estimatedHours}h</span>` : ''}
      ${task.subtasks ? `<span class="task-subtasks">${task.subtasks.filter(st => st.done).length}/${task.subtasks.length} subtasks</span>` : ''}
    </div>
  </div>
  `;
}

/**
 * Format a date string
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
function formatDate(dateString) {
  return new Date(dateString).toLocaleString();
}

/**
 * Format text for HTML display
 * @param {string} text - Text to format
 * @returns {string} Formatted text
 */
function formatText(text) {
  if (!text) return '';
  
  // Replace newlines with <br> tags
  return text.replace(/\n/g, '<br>');
}

/**
 * Capitalize the first letter of a string
 * @param {string} string - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}
