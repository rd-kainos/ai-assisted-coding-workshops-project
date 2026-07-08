# AGENTS.md

Agent operating guide for this repository.

## Purpose
- Keep agentic coding fast, safe, and consistent for this Chrome Extension workshop project.
- Preserve simple architecture and avoid accidental over-engineering.
- Learn continuously: after each meaningful turn, update this file with new high-signal lessons.

## Scope
- Applies to all coding agents working in this repository.
- Covers planning, implementation, bug fixing, and verification turns.

## Hard Constraints
- Stack is plain HTML5, vanilla JavaScript (ES2020+), and plain CSS.
- No frameworks, no TypeScript, no bundler, and no npm package additions unless explicitly requested.
- Persistence defaults to `chrome.storage.local`; `localStorage` fallback is allowed only when user explicitly requests direct-browser dual mode.
- Storage keys must be constants and use `kainos-todo:` prefix.
- Keep solutions simple and task-scoped; avoid broad refactors unless requested.

## Current File Contract (source of truth: workspace)
- Popup UI is currently `index.html`.
- Popup logic is `popup.js`.
- Settings UI is `options.html`.
- Settings logic is `options.js`.
- Existing custom agent definitions are under `.github/agents/`.
- Workspace skills are under `.github/skills/`.

## Architecture Rules
- Keep mutable app data in a single `state` object in popup logic.
- Render functions read state and update DOM; they should not contain business decisions.
- Event handlers update state, persist if needed, and then call `render()`.
- Use event delegation for todo row actions on `#todo-list`; do not attach item listeners in render functions.
- Keep functions short and single-purpose.

## Turn Workflow
1. Read relevant files and constraints before edits.
2. Implement only the requested change with minimal diffs.
3. Verify behavior changed as intended (logic + UI + persistence path where relevant).
4. Update the Learning sections in this file before ending the turn.

## Verification Checklist
- No forbidden tech introduced (frameworks, bundlers, external runtime dependencies).
- `chrome.storage.local` usage remains consistent.
- DOM IDs used by JS still exist in HTML.
- Filter/stats/list rendering remain coherent after state changes.
- Options link and settings flow still function.

## Learning Update Policy (mandatory every meaningful turn)
A meaningful turn is any turn that includes implementation, bug fixing, debugging, or a blocked attempt.

Required update actions:
1. Update `Learning Rules (living)` if a reusable lesson was found.
2. Replace `Rolling Turn Summary` with the latest compact summary.
3. Add or update `Drift Notes` if docs and code disagree.

Keep updates concise:
- Max 8 bullets in `Rolling Turn Summary`.
- Keep only high-signal lessons; remove superseded points.

## Learning Rules (living)
Always:
- Confirm current workspace files before applying documented assumptions.
- Prefer minimal, focused edits that preserve existing file responsibilities.
- Promote repeated mistakes into explicit Always/Never rules here.
- Keep skill folder names and `SKILL.md` frontmatter `name` identical.
- For issue-selection skills, define explicit default filters and deterministic fallback ordering.
- Verify live GitHub label names before assuming a documented label slug.

Never:
- Assume README naming is current without checking workspace structure.
- Introduce `localStorage` without explicit user request for dual-mode behavior.
- Add framework/tooling complexity unless explicitly requested.

## Rolling Turn Summary (overwrite each meaningful turn)
- Date: 2026-07-08
- Intent: Make active storage mode obvious while testing dual-mode persistence.
- Files touched: `index.html`, `popup.js`, `AGENTS.md`.
- Risks/problems observed: Caption-only mode feedback can be missed, causing confusion when users test refresh behavior.
- Decision/fix: Added a prominent header badge (`Extension` / `Browser tab` / `No storage`) and wired it to runtime storage-mode detection.
- Verification: Checked diagnostics for changed files after badge wiring.

## Drift Notes
- README project structure section references `popup.html` and `manifest.json`.
- Current workspace root includes `index.html` and no visible `manifest.json`.
- Until repo is reconciled, agents must treat current workspace files as source of truth and record future drift changes here.
