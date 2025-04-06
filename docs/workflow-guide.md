# BambiLand Workflow System Guide

This guide explains how to use the BambiLand Workflow System for task-driven, rule-based development.

## Table of Contents

1. [Introduction](#introduction)
2. [System Overview](#system-overview)
3. [Getting Started](#getting-started)
4. [Working with Tasks](#working-with-tasks)
5. [Using Rules](#using-rules)
6. [Command Reference](#command-reference)
7. [Advanced Features](#advanced-features)
8. [Best Practices](#best-practices)

## Introduction

The BambiLand Workflow System is designed to provide a structured approach to software development, integrating task management with development rules. This system helps teams:

- Break complex projects into manageable tasks
- Maintain consistent code standards
- Document development decisions
- Track progress effectively
- Integrate AI assistance into the development process

## System Overview

The workflow system consists of three main components:

1. **Task Management System**: Handles task creation, tracking, and organization
2. **Rules System**: Provides development guidelines and standards
3. **Scripts and Commands**: Tools for interacting with tasks and rules

### Directory Structure

```
project/
├── .cursor/                # Cursor AI rules
│   └── rules/              # Development rules in markdown format
├── scripts/                # Workflow scripts
│   ├── dev.js              # Main workflow command
│   └── modules/            # Script modules
├── tasks/                  # Task definitions
│   ├── tasks.json          # Task database
│   └── task-*.md           # Individual task files
└── templates/              # Templates for tasks and rules
```

## Getting Started

### Initialization

To initialize the workflow system:

```bash
node scripts/dev.js init
```

This creates the necessary directory structure and an initial task file.

### Creating Tasks from a PRD

You can automatically generate tasks from a Product Requirements Document:

```bash
node scripts/dev.js parse-prd --input=your-prd.txt
```

### Basic Workflow

1. Start with `node scripts/dev.js list` to see available tasks
2. Choose a task to work on based on priority and dependencies
3. Review the task details and applicable rules
4. Expand complex tasks using `node scripts/dev.js expand --id=<id>`
5. Implement the task, following the associated rules
6. Update the task status when complete

## Working with Tasks

### Task Structure

Tasks are defined with the following attributes:

- **ID**: Unique identifier
- **Title**: Brief description
- **Description**: Summary of the task
- **Status**: Current state (pending, in-progress, done, deferred)
- **Priority**: Importance level (high, medium, low)
- **Dependencies**: Prerequisites that must be completed first
- **Details**: Implementation instructions
- **Test Strategy**: Verification approach
- **Applicable Rules**: Development rules to follow
- **Subtasks**: Smaller, more focused tasks

### Task Commands

- **List Tasks**: `node scripts/dev.js list`
- **Show Task Details**: `node scripts/dev.js show --id=<id>`
- **Update Task Status**: `node scripts/dev.js set-status --id=<id> --status=<status>`
- **Expand Tasks**: `node scripts/dev.js expand --id=<id> --num=<number>`
- **Generate Task Files**: `node scripts/dev.js generate`

### Task Expansion

Complex tasks can be broken down into subtasks:

```bash
node scripts/dev.js expand --id=5 --num=3
```

This will create three subtasks (5.1, 5.2, 5.3) for task 5.

### Task Dependencies

Tasks can depend on other tasks:

```bash
node scripts/dev.js add-dependency --id=3 --depends-on=2
```

This makes task 3 dependent on task 2 (task 2 must be completed before task 3).

## Using Rules

### Rule Structure

Rules are stored in markdown files with front matter metadata:

```markdown
---
description: When to apply this rule
globs: path/to/files/*.ext
alwaysApply: false
---

# Rule Title

## Critical Rules
- Specific rule to follow
- Another important guideline

## Examples
<example>
// Good example
</example>

<example type="invalid">
// Bad example
</example>
```

### Rule Organization

Rules are organized in directories:

- **core-rules/**: Fundamental rules
- **ts-rules/**: TypeScript-specific rules
- **ui-rules/**: UI development rules
- **tool-rules/**: Tool-specific rules
- **global-rules/**: Rules that apply to all files

### Rule Commands

- **List Rules**: `node scripts/dev.js rule-list`
- **Apply Rules**: Rules are automatically associated with tasks

## Command Reference

| Command | Description | Example |
|---------|-------------|---------|
| `list` | List all tasks | `node scripts/dev.js list` |
| `next` | Show next task | `node scripts/dev.js next` |
| `show` | Show task details | `node scripts/dev.js show --id=3` |
| `expand` | Create subtasks | `node scripts/dev.js expand --id=4 --num=5` |
| `set-status` | Update task status | `node scripts/dev.js set-status --id=3 --status=done` |
| `generate` | Create task files | `node scripts/dev.js generate` |
| `init` | Initialize workflow | `node scripts/dev.js init` |
| `add-dependency` | Add dependency | `node scripts/dev.js add-dependency --id=3 --depends-on=2` |
| `remove-dependency` | Remove dependency | `node scripts/dev.js remove-dependency --id=3 --depends-on=2` |
| `rule-list` | List rules | `node scripts/dev.js rule-list` |
| `analyze-complexity` | Analyze task complexity | `node scripts/dev.js analyze-complexity` |
| `clear-subtasks` | Remove subtasks | `node scripts/dev.js clear-subtasks --id=3` |

## Advanced Features

### Task Complexity Analysis

Analyze task complexity to determine how many subtasks to create:

```bash
node scripts/dev.js analyze-complexity
```

This generates a report with recommendations for task breakdown.

### Rule Suggestions

The system can suggest new rules based on coding patterns:

```bash
node scripts/dev.js suggest-rules
```

### AI Integration

The workflow system is designed to work with Cursor AI:

- AI can read task details to provide context-aware assistance
- AI can follow development rules specific to the current task
- AI can help break down complex tasks with `expand` command

## Best Practices

1. **Task Granularity**: Create tasks that can be completed in 1-2 days
2. **Rule Specificity**: Keep rules focused and actionable
3. **Dependencies**: Maintain clear dependency chains
4. **Documentation**: Keep task descriptions and details up to date
5. **Consistent Workflow**: Follow the same process for all tasks

## Conclusion

The BambiLand Workflow System provides a structured approach to development that combines task management with rule-based guidance. By following this workflow, teams can maintain high-quality code, track progress effectively, and integrate AI assistance into their development process. 