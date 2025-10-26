# Claude Code Workflow Plugin

Implements Ashley Ha’s structured 4-phase workflow inside Claude Code.

Installation:
npm i fs-extra chalk
npx humanlayer thoughts init

Usage:
/research_codebase → gather data
/create_plan → draft iterative plan
/implement_plan → apply code
/validate_plan → verify results

Hooks manage context, while thoughts/ holds persistent artifacts.
