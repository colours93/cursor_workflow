#!/usr/bin/env node

/**
 * setup.js
 * BambiLand Workflow - Setup Script
 * 
 * This script helps users set up the BambiLand Workflow system.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.cyan('Setting up BambiLand Workflow System...'));

// Check if Node.js and npm are installed
try {
  const nodeVersion = execSync('node --version').toString().trim();
  const npmVersion = execSync('npm --version').toString().trim();
  
  console.log(`Node.js version: ${nodeVersion}`);
  console.log(`npm version: ${npmVersion}`);
} catch (error) {
  console.error(chalk.red('Error: Node.js or npm is not installed. Please install them first.'));
  process.exit(1);
}

// Install dependencies
console.log(chalk.cyan('\nInstalling dependencies...'));
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.error(chalk.red('Error installing dependencies. Please check package.json and try again.'));
  process.exit(1);
}

// Make dev.js executable
try {
  fs.chmodSync('scripts/dev.js', '755');
  console.log(chalk.green('Made scripts/dev.js executable'));
} catch (error) {
  console.warn(chalk.yellow('Warning: Could not make scripts/dev.js executable. You may need to run it with "node scripts/dev.js".'));
}

// Initialize the workflow system
console.log(chalk.cyan('\nInitializing workflow system...'));
try {
  execSync('node scripts/dev.js init', { stdio: 'inherit' });
} catch (error) {
  console.error(chalk.red('Error initializing workflow system.'));
  process.exit(1);
}

console.log(chalk.green('\nSetup complete!'));
console.log('You can now use the BambiLand Workflow System:');
console.log('  - Run ' + chalk.cyan('npm run workflow:list') + ' to list all tasks');
console.log('  - Run ' + chalk.cyan('npm run workflow:rules') + ' to list all rules');
console.log('  - Run ' + chalk.cyan('npm run workflow:next') + ' to show the next task to work on');
console.log('  - Run ' + chalk.cyan('npm run workflow:expand --id=<id>') + ' to expand a task with subtasks');
console.log('  - Run ' + chalk.cyan('npm run workflow:verify --task-id=<id> --path=<path>') + ' to verify task implementation against rules');
console.log('  - Run ' + chalk.cyan('npm run workflow:analyze') + ' to analyze tasks for patterns');
console.log('  - Run ' + chalk.cyan('npm run workflow:suggest') + ' to view rule update suggestions');
console.log();
console.log('For more information, check out the documentation in the README.md file.'); 