#!/usr/bin/env node

import { program } from 'commander';
import { listTasks, showTask, setTaskStatus, nextTask, generateTaskFiles } from './tasks.js';
import { listRules, showRule, findRulesForTask, verifyTaskAgainstRules } from './rules.js';
import { expandTask } from './expand.js';
import { analyzeEvolution, suggestRuleUpdates, applyRuleUpdates } from './evolution.js';
import { initWorkflow } from './init.js';
import { analyzeComplexity } from './complexity.js';
import { scheduleTasks, setPriority, setEstimatedHours, setDueDate } from './scheduler.js';
import { generateTaskHtml, generateDashboard } from './reports.js';

export function runCLI(argv) {
  program
    .version('1.0.0')
    .description('Cursor Workflow Workflow - Task and Rule Management');

  // Task Commands
  program
    .command('list')
    .description('List all tasks')
    .option('-s, --status <status>', 'Filter by status')
    .option('--with-rules', 'Show applicable rules')
    .action(listTasks);

  program
    .command('show')
    .description('Show task details')
    .argument('<id>', 'Task ID')
    .option('--with-rules', 'Show applicable rules')
    .action(showTask);

  program
    .command('set-status')
    .description('Set task status')
    .option('--id <id>', 'Task ID')
    .option('--status <status>', 'New status value')
    .action(setTaskStatus);

  program
    .command('next')
    .description('Show next task to work on')
    .option('--with-rules', 'Show applicable rules')
    .action(nextTask);

  program
    .command('generate')
    .description('Generate task files')
    .action(generateTaskFiles);

  program
    .command('expand')
    .description('Expand task with subtasks')
    .option('--id <id>', 'Task ID')
    .option('--num <number>', 'Number of subtasks')
    .option('--research', 'Use research for better expansion')
    .action(expandTask);

  // Rule Commands
  program
    .command('rule-list')
    .description('List all rules')
    .action(listRules);

  program
    .command('rule-show')
    .description('Show rule details')
    .argument('<id>', 'Rule ID')
    .action(showRule);

  program
    .command('rule-find')
    .description('Find rules applicable to a task')
    .option('--task-id <taskId>', 'Task ID')
    .action(findRulesForTask);

  program
    .command('verify')
    .description('Verify task implementation against rules')
    .option('--task-id <taskId>', 'Task ID')
    .option('--path <path>', 'Path to implementation files')
    .action(verifyTaskAgainstRules);

  // Evolution Commands
  program
    .command('analyze')
    .description('Analyze completed tasks for patterns')
    .option('--completed-tasks', 'Analyze only completed tasks')
    .option('--last <count>', 'Number of recent tasks to analyze')
    .action(analyzeEvolution);

  program
    .command('suggest')
    .description('Suggest rule updates based on analysis')
    .action(suggestRuleUpdates);

  program
    .command('apply-suggestion')
    .description('Apply suggested rule updates')
    .option('--id <id>', 'Suggestion ID')
    .action(applyRuleUpdates);

  // Setup Command
  program
    .command('init')
    .description('Initialize the workflow system')
    .option('--import-rules <path>', 'Import rules from directory')
    .action(initWorkflow);

  // Complexity Analysis Commands
  program
    .command('complexity')
    .description('Analyze task complexity')
    .option('--id <id>', 'Task ID')
    .option('--file <file>', 'Task file path')
    .option('--output <output>', 'Output file for report')
    .action(analyzeComplexity);

  // Scheduler Commands
  program
    .command('schedule')
    .description('Generate task schedule')
    .option('--file <file>', 'Tasks file path')
    .option('--output <output>', 'Output schedule file')
    .action(scheduleTasks);

  program
    .command('set-priority')
    .description('Set task priority')
    .option('--id <id>', 'Task ID')
    .option('--priority <priority>', 'Priority level (low, medium, high, critical)')
    .action(setPriority);

  program
    .command('set-hours')
    .description('Set estimated hours for task')
    .option('--id <id>', 'Task ID')
    .option('--hours <hours>', 'Estimated hours')
    .action(setEstimatedHours);

  program
    .command('set-due')
    .description('Set due date for task')
    .option('--id <id>', 'Task ID')
    .option('--date <date>', 'Due date (YYYY-MM-DD)')
    .action(setDueDate);

  // Report Commands
  program
    .command('report')
    .description('Generate HTML report for a task')
    .option('--id <id>', 'Task ID')
    .option('--file <file>', 'Tasks file path')
    .option('--output <output>', 'Output HTML file')
    .action(generateTaskHtml);

  program
    .command('dashboard')
    .description('Generate HTML dashboard for all tasks')
    .option('--file <file>', 'Tasks file path')
    .option('--output <output>', 'Output HTML file')
    .action(generateDashboard);

  program.parse(argv);
}

// Direct execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runCLI(process.argv);
} 