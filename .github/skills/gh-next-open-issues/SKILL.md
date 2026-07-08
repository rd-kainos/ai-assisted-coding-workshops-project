---
name: gh-next-open-issues
description: "Fetch the next open GitHub issue(s) with gh, prioritizing ready-to-do tickets. Use when users ask to implement next open issue, implement ticket#n, fetch ready to do tickets, or pick next task from GitHub issues."
argument-hint: "Provide optional ticket number, limit, and any label overrides."
---

# GitHub Next Open Issues

## What This Skill Produces
- A deterministic shortlist of actionable open issues from:
  - https://github.com/KainosSoftwareLtd/ai-assisted-coding-workshops-project/issues
- A direct issue lookup result when the user specifies `ticket#n`.
- A clear explanation of filters used and why the chosen issue is next.

## When to Use
- The user asks for the next issue to implement.
- The user references `implement ticket#n` and expects issue details first.
- The user asks to fetch ready-to-do tickets from GitHub.

## Default Behavior (Primary)
- Repository: `KainosSoftwareLtd/ai-assisted-coding-workshops-project`
- Source: open issues only
- Ready filter: label `ready-to-do`
- Exclude: issues labeled `blocked` when possible
- Ordering for next issue: oldest created first
- Default list size when not specified: 5

## Inputs
Collect these inputs if missing:
- Requested mode:
  - Specific ticket (`ticket#n`)
  - Next open ticket(s)
- Optional list size (default 5)
- Optional label override (default `ready-to-do`)

Ask concise follow-up questions only when needed to disambiguate.

## Procedure
1. Identify request mode.
- If prompt includes `ticket#n`, run the specific ticket path.
- Otherwise run the next-open path.

2. Specific ticket path (`ticket#n`).
- Extract numeric ticket id from user text.
- Fetch exact issue details first.
- If issue is closed or missing, return status and suggest next-open fallback.

3. Next-open path (ready queue).
- Query open issues in the target repository.
- Filter to label `ready-to-do`.
- Exclude `blocked` label when present.
- Sort by creation date ascending to define next.
- Return top N items.

4. Fallback path when ready queue is empty.
- Query open issues excluding `blocked`.
- Return top N oldest open issues.
- Mark response as fallback and explain why.

5. Error handling.
- If `gh` auth fails, return: authentication required and exact next command to run (`gh auth login`).
- If repository access fails, return: verify repo permissions and organization access.
- If no issues match filters, return: no actionable tickets found and suggest relaxing filters.

## gh CLI Command Patterns
Use these command patterns as defaults.

Specific ticket:
```bash
gh issue view <number> --repo KainosSoftwareLtd/ai-assisted-coding-workshops-project
```

Next ready-to-do tickets:
```bash
gh issue list \
  --repo KainosSoftwareLtd/ai-assisted-coding-workshops-project \
  --state open \
  --label ready-to-do \
  --limit <N>
```

Fallback open non-blocked tickets:
```bash
gh issue list \
  --repo KainosSoftwareLtd/ai-assisted-coding-workshops-project \
  --state open \
  --search "-label:blocked" \
  --limit <N>
```

If sorting control is needed beyond defaults, use `--json` output and sort deterministically by `createdAt`.

## Output Format
Always respond with:
- `Status`: success, fallback, or blocked
- `Mode`: specific-ticket or next-open
- `Applied filters`: repo, state, labels, exclusions, limit
- `Selected issue(s)`: number, title, url, labels, created date
- `Why this is next`: one concise rationale
- `Next action`: implement now or adjust filters

## Completion Checks
Mark done only when all are true:
- Trigger intent was correctly recognized.
- Correct path was executed (`ticket#n` or next-open).
- Ready filter `ready-to-do` was applied for next-open path.
- Output includes actionable issue data and rationale.
- Any failure includes concrete recovery steps.

## Failure Output Format
If unresolved, return:
- `Status: blocked`
- `Reason:` exact failure cause
- `Tried:` command path attempted
- `Next action:` shortest fix path

## Example Prompts
- `Use gh-next-open-issues and find the next open issue to implement.`
- `Implement ticket#42. Fetch issue details first.`
- `Fetch ready to do tickets and pick the next one.`
- `Pick next task from GitHub issues with a limit of 3.`
