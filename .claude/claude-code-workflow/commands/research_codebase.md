# /research_codebase

Goal: Map the codebase and existing docs before implementation.
Usage:
/research_codebase + {feature or system area}

1. Spawn parallel sub-agents:
   - research_subagent.js → codebase locator
   - thoughts_sync.js → collect prior notes
2. Output thoughts/shared/research/<date>\_<topic>.md
3. If context > 60%, auto /clear
