# BambiLand Workflow System

A task-driven development workflow system with rules-based guidance for AI-assisted software development.

## 🚀 Features

- Task management with subtasks, dependencies, and priorities
- Rule-based development guidelines
- Task complexity analysis and expansion
- Progress tracking and visualization
- AI-driven task breakdown
- Integration with Cursor editor

## 📋 System Components

### 1. Task Management

Tasks are stored in `tasks/tasks.json` and can be managed through various commands:

- **List tasks**: View all tasks and their status
- **Show task details**: Display details of a specific task
- **Update task status**: Mark tasks as pending, in-progress, or done
- **Expand tasks**: Break down complex tasks into manageable subtasks
- **Analyze complexity**: Evaluate task complexity and suggest breakdown strategies

### 2. Rules System

Development rules provide guidance on code standards, architecture, and best practices:

- Rules are stored in `.cursor/rules/`
- Tasks reference applicable rules to follow during implementation
- Rules can be organized in categories (core-rules, ts-rules, etc.)
- The system helps AI tools access relevant rules for specific tasks

### 3. Project Documentation

The workflow supports comprehensive project documentation:

- Architecture documents
- Product requirements
- User stories
- Task details
- Technical specifications

## 🛠️ Getting Started

### Installation

1. Clone this repository:
```
git clone https://github.com/colours93/cursor_workflow.git
cd cursor_workflow
```

2. Install dependencies:
```
npm install
```

3. Initialize the workflow system:
```
node scripts/dev.js init
```

### Basic Usage

- **List all tasks**:
```
node scripts/dev.js list
```

- **See the next task to work on**:
```
node scripts/dev.js next
```

- **Expand a task into subtasks**:
```
node scripts/dev.js expand --id=<task_id> --num=<number_of_subtasks>
```

- **Update task status**:
```
node scripts/dev.js set-status --id=<task_id> --status=<status>
```

- **Show task details**:
```
node scripts/dev.js show --id=<task_id>
```

- **Generate individual task files**:
```
node scripts/dev.js generate
```

## 📊 Workflow Process

1. **Initialize**: Set up the project structure and initial tasks
2. **Plan**: Break down complex tasks into subtasks
3. **Develop**: Implement features following applicable rules
4. **Track**: Update task status as work progresses
5. **Verify**: Test against acceptance criteria
6. **Document**: Create and update documentation

## 🔄 Development Cycle

The typical development cycle using this workflow is:

1. Run `list` to see available tasks
2. Select a task based on dependencies and priority
3. Use `expand` to break down complex tasks
4. Implement the task following relevant rules
5. Update status when complete
6. Verify against test criteria

## 📝 Task Structure

Tasks have the following structure:

```json
{
  "id": 1,
  "title": "Task Title",
  "description": "Brief description",
  "status": "pending",
  "priority": "high",
  "details": "Detailed implementation notes",
  "testStrategy": "Verification approach",
  "applicableRules": ["rule1", "rule2"],
  "subtasks": [...]
}
```

## 📚 Rules Format

Rules are stored in Markdown files with front matter:

```md
---
description: Clear description of when to apply this rule
globs: path/to/files/*.ext, other/path/**/*
alwaysApply: boolean
---

# Rule Title

## Critical Rules

- Concise, bulleted list of actionable rules

## Examples

<example>
Valid example
</example>

<example type="invalid">
Invalid example
</example>
```

## 🔧 Commands Reference

| Command | Description | Example |
|---------|-------------|---------|
| `list` | List all tasks | `node scripts/dev.js list` |
| `next` | Show next task to work on | `node scripts/dev.js next` |
| `expand` | Break down task into subtasks | `node scripts/dev.js expand --id=1 --num=5` |
| `set-status` | Update task status | `node scripts/dev.js set-status --id=1 --status=done` |
| `show` | Show task details | `node scripts/dev.js show --id=1` |
| `generate` | Generate task files | `node scripts/dev.js generate` |
| `init` | Initialize workflow | `node scripts/dev.js init` |

## 📑 License

MIT

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/colours93/cursor_workflow/issues). 
