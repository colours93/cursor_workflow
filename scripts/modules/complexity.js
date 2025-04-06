import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { loadTasks, saveTasks } from './tasks.js';
import dotenv from 'dotenv';

dotenv.config();

// Default values
const DEFAULT_OUTPUT = 'scripts/task-complexity-report.json';
const DEFAULT_THRESHOLD = 5;

/**
 * Analyze task complexity using AI or heuristics
 * @param {Object} options - Command options
 */
export async function analyzeComplexity(options = {}) {
  const outputPath = options.output || DEFAULT_OUTPUT;
  const threshold = options.threshold || DEFAULT_THRESHOLD;
  const tasksFile = options.file || 'tasks/tasks.json';
  
  console.log(chalk.cyan('Analyzing task complexity...'));
  
  // Load tasks
  const tasks = loadTasks(options.file);
  
  if (!tasks || tasks.length === 0) {
    console.log(chalk.yellow('No tasks found to analyze.'));
    return;
  }
  
  // Analyze each task
  const results = [];
  
  for (const task of tasks) {
    if (task.status === 'done') {
      continue; // Skip completed tasks
    }
    
    const complexity = await analyzeTaskComplexity(task);
    const recommendedSubtasks = calculateRecommendedSubtasks(complexity);
    const expansionPrompt = generateExpansionPrompt(task, complexity);
    
    results.push({
      taskId: task.id,
      title: task.title,
      status: task.status,
      complexity: complexity,
      hasSubtasks: task.subtasks && task.subtasks.length > 0,
      subtaskCount: task.subtasks ? task.subtasks.length : 0,
      recommended: {
        subtaskCount: recommendedSubtasks,
        needsExpansion: complexity >= threshold,
        expansionPrompt: expansionPrompt,
        expansionCommand: `cursor-workflow expand --id=${task.id} --num=${recommendedSubtasks}`
      }
    });
  }
  
  // Calculate statistics
  const stats = calculateComplexityStats(results);
  
  // Create final report
  const report = {
    timestamp: new Date().toISOString(),
    stats: stats,
    tasks: results.sort((a, b) => b.complexity - a.complexity) // Sort by complexity (highest first)
  };
  
  // Save report
  fs.ensureDirSync(path.dirname(outputPath));
  fs.writeJSONSync(outputPath, report, { spaces: 2 });
  
  console.log(chalk.green(`Complexity analysis complete. Report saved to ${outputPath}`));
  console.log(`Found ${chalk.yellow(stats.highComplexity)} high complexity tasks.`);
  
  return report;
}

/**
 * Display a formatted complexity report
 * @param {Object} options - Command options
 */
export async function displayComplexityReport(options = {}) {
  const filePath = options.file || DEFAULT_OUTPUT;
  
  if (!fs.existsSync(filePath)) {
    console.log(chalk.yellow(`No complexity report found at ${filePath}.`));
    console.log('Run cursor-workflow analyze-complexity to generate a report.');
    
    const generateNow = await promptYesNo('Would you like to generate a report now?');
    if (generateNow) {
      return analyzeComplexity(options);
    }
    return;
  }
  
  const report = fs.readJSONSync(filePath);
  
  // Display report header
  console.log(chalk.cyan.bold('\nTask Complexity Report'));
  console.log(chalk.gray(`Generated: ${new Date(report.timestamp).toLocaleString()}\n`));
  
  // Display statistics
  console.log(chalk.white.bold('Complexity Distribution:'));
  console.log(`${chalk.green('■')} Low Complexity (1-3): ${report.stats.lowComplexity} tasks`);
  console.log(`${chalk.yellow('■')} Medium Complexity (4-7): ${report.stats.mediumComplexity} tasks`);
  console.log(`${chalk.red('■')} High Complexity (8-10): ${report.stats.highComplexity} tasks`);
  console.log(`${chalk.gray('■')} Average Complexity: ${report.stats.averageComplexity.toFixed(1)}\n`);
  
  // Display tasks by complexity category
  console.log(chalk.white.bold('Tasks Needing Expansion:'));
  
  const complexTasks = report.tasks.filter(task => task.recommended.needsExpansion);
  
  if (complexTasks.length === 0) {
    console.log(chalk.gray('No tasks found that need expansion.'));
  } else {
    for (const task of complexTasks) {
      const colorFn = task.complexity >= 8 ? chalk.red : chalk.yellow;
      console.log(`${colorFn('■')} Task ${task.taskId}: ${task.title}`);
      console.log(`  Complexity: ${colorFn(task.complexity)}/10`);
      console.log(`  Recommended Subtasks: ${task.recommended.subtaskCount}`);
      console.log(`  ${chalk.gray(`Run: ${task.recommended.expansionCommand}`)}`);
      console.log('');
    }
  }
  
  console.log(chalk.white.bold('All Tasks by Complexity:'));
  for (const task of report.tasks) {
    let complexityColor;
    if (task.complexity <= 3) complexityColor = chalk.green;
    else if (task.complexity <= 7) complexityColor = chalk.yellow;
    else complexityColor = chalk.red;
    
    console.log(`Task ${task.taskId}: ${complexityColor(task.complexity)}/10 - ${task.title}`);
  }
}

/**
 * Analyze a single task's complexity
 * @param {Object} task - The task to analyze
 * @returns {number} Complexity score (1-10)
 */
async function analyzeTaskComplexity(task) {
  // This is a simplified heuristic approach - in a real system, this would use AI
  let complexity = 5; // Default medium complexity
  
  // Adjust based on description length
  const descriptionLength = task.description ? task.description.length : 0;
  if (descriptionLength > 500) complexity += 1;
  if (descriptionLength > 1000) complexity += 1;
  
  // Adjust based on details length
  const detailsLength = task.details ? task.details.length : 0;
  if (detailsLength > 1000) complexity += 1;
  if (detailsLength > 2000) complexity += 1;
  
  // Adjust based on dependencies
  const dependencyCount = task.dependencies ? task.dependencies.length : 0;
  if (dependencyCount > 2) complexity += 1;
  if (dependencyCount > 5) complexity += 1;
  
  // Adjust based on priority
  if (task.priority === 'high') complexity += 1;
  
  // Ensure within range
  return Math.max(1, Math.min(10, complexity));
}

/**
 * Calculate recommended number of subtasks based on complexity
 * @param {number} complexity - Complexity score (1-10)
 * @returns {number} Recommended subtask count
 */
function calculateRecommendedSubtasks(complexity) {
  const defaultSubtasks = parseInt(process.env.DEFAULT_SUBTASKS || '3', 10);
  
  if (complexity <= 3) return Math.max(1, defaultSubtasks - 1);
  if (complexity <= 6) return defaultSubtasks;
  if (complexity <= 8) return defaultSubtasks + 1;
  return defaultSubtasks + 2;
}

/**
 * Generate a tailored expansion prompt for a task
 * @param {Object} task - The task to expand
 * @param {number} complexity - Complexity score
 * @returns {string} Expansion prompt
 */
function generateExpansionPrompt(task, complexity) {
  if (complexity <= 3) {
    return `Break down this simple task into clear steps, focusing on implementation details.`;
  } else if (complexity <= 7) {
    return `Divide this moderately complex task into logical components, considering both implementation and testing.`;
  } else {
    return `Break down this highly complex task into manageable subtasks, addressing technical challenges, edge cases, and thorough testing.`;
  }
}

/**
 * Calculate statistics from complexity results
 * @param {Array} results - Complexity analysis results
 * @returns {Object} Statistics
 */
function calculateComplexityStats(results) {
  const totalTasks = results.length;
  
  // Skip tasks that are done
  const activeTasks = results.filter(task => task.status !== 'done');
  
  if (activeTasks.length === 0) {
    return {
      totalTasks,
      activeTasks: 0,
      lowComplexity: 0,
      mediumComplexity: 0,
      highComplexity: 0,
      averageComplexity: 0
    };
  }
  
  const lowComplexity = activeTasks.filter(task => task.complexity <= 3).length;
  const mediumComplexity = activeTasks.filter(task => task.complexity > 3 && task.complexity <= 7).length;
  const highComplexity = activeTasks.filter(task => task.complexity > 7).length;
  
  const totalComplexity = activeTasks.reduce((sum, task) => sum + task.complexity, 0);
  const averageComplexity = totalComplexity / activeTasks.length;
  
  return {
    totalTasks,
    activeTasks: activeTasks.length,
    lowComplexity,
    mediumComplexity,
    highComplexity,
    averageComplexity
  };
}

/**
 * Simple Yes/No prompt
 * @param {string} question - Question to ask
 * @returns {boolean} User response
 */
async function promptYesNo(question) {
  // In a real implementation, this would use a proper prompt library
  // For now, default to true
  console.log(`${question} (Y/n)`);
  return true;
}
