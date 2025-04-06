#!/usr/bin/env node

import { program } from 'commander';
import dotenv from 'dotenv';
import { runCLI } from './modules/commands.js';

/**
 * dev.js
 * Cursor Workflow Workflow - Task and Rule Management
 * 
 * This is the entry point for the Cursor Workflow Workflow system.
 * It provides a CLI for managing tasks and rules.
 */

// Add at the very beginning of the file
if (process.env.DEBUG === '1') {
  console.error('DEBUG - dev.js received args:', process.argv.slice(2));
}

// Initialize environment variables
dotenv.config();

// Run the CLI with the process arguments
runCLI(process.argv); 