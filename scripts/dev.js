#!/usr/bin/env node

/**
 * dev.js
 * BambiLand Workflow - Task and Rule Management
 * 
 * This is the entry point for the BambiLand Workflow system.
 * It provides a CLI for managing tasks and rules.
 */

// Add at the very beginning of the file
if (process.env.DEBUG === '1') {
  console.error('DEBUG - dev.js received args:', process.argv.slice(2));
}

import { runCLI } from './modules/commands.js';

// Run the CLI with the process arguments
runCLI(process.argv); 