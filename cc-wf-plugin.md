# Claude Workflow Quick Reference Card

## 🚀 Quick Start

```bash
claude-workflow init           # Initialize in project
claude-workflow research "task" # Start research phase
claude-workflow plan           # Create implementation plan
claude-workflow implement      # Begin coding
claude-workflow validate       # Test and validate
```

## 📊 Context Management (60% Rule)

```bash
claude-workflow context        # Check usage
claude-workflow reset          # Clear context
claude-workflow checkpoint     # Save state
claude-workflow restore NAME   # Restore checkpoint
```

## 🎯 The 4 Phases

### Phase 1: RESEARCH (0-30% context)

- Understand codebase
- Identify patterns
- Document constraints
- Find dependencies

### Phase 2: PLAN (30-40% context)

- Design architecture
- Break into <5 file chunks
- Identify risks
- Plan tests

### Phase 3: IMPLEMENT (40-55% context)

- Code in small iterations
- Write tests alongside
- Commit frequently
- Update docs

### Phase 4: VALIDATE (55-60% context)

- Run all tests
- Check coverage
- Security scan
- Final review

## 🛠️ Custom Commands

```bash
/new-component NAME       # Generate component
/api-endpoint RESOURCE    # Create REST endpoint
/security-audit          # Run security check
/generate-tests PATH     # Create test files
/refactor FILE           # Refactor code
/document PATH           # Generate docs
```

## 🤖 Agent Activation

```bash
claude-workflow agent research      # Research agent
claude-workflow agent planning      # Planning agent
claude-workflow agent testing       # Testing agent
claude-workflow agent review        # Review agent
```

## 🔗 Agent Chains

```bash
# Full feature development
claude-workflow chain "research -> plan -> implement -> test -> document"

# Quick bug fix
claude-workflow chain "research -> implement -> test"

# Refactoring
claude-workflow chain "research -> plan -> refactor -> test"
```

## 💡 Context Indicators

- 🟢 0-40%: Safe zone
- 🟡 40-50%: Caution zone
- 🔶 50-55%: Warning zone
- 🔴 55-60%: Danger zone
- ❌ >60%: Reset required

## 📁 Thoughts Directory

```bash
~/thoughts/
├── research/     # Research findings
├── plans/        # Implementation plans
├── implementations/ # Code progress
└── validations/  # Test results
```

## ⚡ Shortcuts

```bash
r  = research
p  = plan
i  = implement
v  = validate
c  = context
s  = status
```

## 🔍 Common Workflows

### New Feature

```bash
claude-workflow r "add user auth"
claude-workflow p
claude-workflow i
claude-workflow v
```

### Bug Fix

```bash
claude-workflow r "fix login bug"
claude-workflow i
claude-workflow v
```

### Refactoring

```bash
claude-workflow r "refactor database layer"
claude-workflow p
claude-workflow agent refactor
claude-workflow v
```

## 🚨 Emergency Commands

```bash
claude-workflow emergency-reset  # Force reset
claude-workflow recover         # Recover from crash
claude-workflow rollback        # Revert changes
```

## 📋 Best Practices

### DO ✅

- Clear context between phases
- Save to thoughts/ regularly
- Checkpoint before risky operations
- Keep implementations <5 files
- Write tests during implementation
- Update CLAUDE.md continuously

### DON'T ❌

- Exceed 60% context
- Skip planning phase
- Implement without research
- Ignore test failures
- Commit without validation
- Work without checkpoints

## 🔧 Configuration

```bash
~/.claude-workflow/config.json  # Main config
./CLAUDE.md                     # Project config
./.claude/commands/             # Custom commands
```

## 📊 Monitoring

```bash
tail -f ~/.claude-workflow/workflow.log  # Watch logs
claude-workflow metrics                  # View metrics
claude-workflow report                   # Generate report
```

## 🆘 Help

```bash
claude-workflow help           # General help
claude-workflow help COMMAND   # Command help
claude-workflow docs           # Open documentation
```

---

Remember: **Never exceed 60% context!** 🎯
