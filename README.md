# Cursor Workflow System

A comprehensive task-driven development workflow system with rules-based guidance for software development projects.

## Features

- **Task Management**: Create, organize, and track development tasks
- **Task Complexity Analysis**: Analyze task complexity and suggest appropriate subtask breakdown
- **Task Scheduling**: Schedule tasks based on priority, dependencies, and estimated time
- **Task Expansion**: Break down complex tasks into manageable subtasks
- **Rules-Based Guidance**: Define and enforce development best practices
- **HTML Reports**: Generate visual dashboards and detailed task reports
- **Project Evolution**: Track and manage changes to your development approach

## Installation

### Local Installation

```bash
# Clone the repository
git clone https://github.com/colours93/cursor_workflow.git
cd cursor_workflow

# Install dependencies
npm install

# Run a command
npm run dev
```

### Global Installation

```bash
# Install globally
npm install -g cursor-workflow-system

# Now you can use the CLI from anywhere
cursor-workflow list
```

## Quick Start

```bash
# Initialize a new project
cursor-workflow init

# Or initialize with an existing PRD
cursor-workflow parse-prd --input=path/to/prd.md

# List tasks
cursor-workflow list

# Get the next task to work on
cursor-workflow next

# Analyze task complexity
cursor-workflow analyze-complexity

# Break down a complex task
cursor-workflow expand --id=1

# Schedule tasks based on priorities and dependencies
cursor-workflow schedule-tasks

# Generate HTML reports
cursor-workflow generate-report --id=1
cursor-workflow generate-dashboard
```

## Command Reference

### Task Management

- `list`: List all tasks with their status
- `show`: Show detailed information about a specific task
- `next`: Get the next task to work on based on priority and dependencies
- `set-status`: Update the status of a task
- `add-dependency`: Add a dependency between tasks
- `remove-dependency`: Remove a dependency between tasks

### Task Analysis and Expansion

- `analyze-complexity`: Analyze task complexity and generate recommendations
- `expand`: Break down a complex task into subtasks
- `complexity-report`: Display the task complexity analysis report

### Task Scheduling

- `schedule-tasks`: Generate a schedule based on task priorities and dependencies
- `set-due-date`: Set the due date for a task
- `set-estimated-hours`: Set the estimated hours for a task
- `set-priority`: Set the priority for a task

### Reporting

- `generate-report`: Generate an HTML report for a specific task
- `generate-dashboard`: Generate an HTML dashboard for all tasks

### Project Setup and Maintenance

- `init`: Initialize a new project
- `parse-prd`: Parse a PRD document and generate initial tasks
- `generate`: Generate individual task files from tasks.json
- `fix-dependencies`: Find and fix invalid dependencies
- `validate-dependencies`: Check for invalid dependencies

## Directory Structure

```
cursor_workflow/
├── scripts/           # Core scripts and modules
│   ├── modules/       # Functional modules
│   └── dev.js         # Main CLI entry point
├── tasks/             # Task files and data
│   ├── examples/      # Example tasks
│   └── tasks.json     # Task data store
├── templates/         # Templates for tasks and rules
├── reports/           # Generated HTML reports
├── docs/              # Documentation
└── .cursor/           # Cursor IDE configuration
    └── rules/         # Rules for development guidance
```

## Rules-Based Development

The Cursor Workflow System integrates with Cursor IDE's rules system to provide:

- Development best practices
- Code style guidelines
- Architecture patterns
- Testing standards
- Project-specific conventions

Rules can be defined in the `.cursor/rules/` directory and will be automatically applied by Cursor IDE when working on relevant files.

## Environment Variables

Create a `.env` file to customize your workflow:

```
# API Keys
ANTHROPIC_API_KEY=sk-ant-api03-...

# LLM Settings
MODEL=claude-3-7-sonnet-20250219
MAX_TOKENS=4000
TEMPERATURE=0.7

# Default Values
DEFAULT_SUBTASKS=3
DEFAULT_PRIORITY=medium
DEFAULT_ESTIMATED_HOURS=4

# Project Info
PROJECT_NAME=My Amazing Project
PROJECT_VERSION=1.0.0
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
