---
name: pr-request-standards
description: "Create and validate PR/MR requests with DLSR branch naming checks, Jira/chore branching rules, strict Conventional Commits, atomic commit guidance, and completion-ready PR/MR text. Use when preparing a pull request or merge request for review."
argument-hint: "Provide branch name, change summary, linked Jira (if any), and test evidence."
---

# PR/MR Request Standards

## What This Skill Produces
- A pass/fail validation of branch naming against team rules.
- A pass/fail validation of commit quality and Conventional Commit format.
- A complete PR/MR draft:
  - title
  - summary
  - linked ticket context
  - change list
  - test evidence
  - risk and rollback notes
- A correction checklist when standards are not met.

## When to Use
- You are about to open a PR or MR.
- You want to check branch and commit compliance before pushing or requesting review.
- You need a structured, reviewer-friendly PR/MR description.

## Inputs
Provide as many of these as possible:
- Current branch name
- Commit list or commit summary
- Ticket context (Jira ID when applicable)
- Change summary
- Testing evidence (manual steps, screenshots, or command output)
- Risks and rollback notes

If any required input is missing, ask concise follow-up questions before producing the final PR/MR draft.

## Standards

### 1) Branch Naming Rules
Allowed prefixes:
- `feature`
- `bugfix`
- `hotfix`
- `chore`

#### Pattern A: feature/bugfix/hotfix
Required format:
- `<prefix>/DLSR-<jira-number>-<2-5-word-kebab-description>`

Validation:
- Prefix must be one of `feature`, `bugfix`, `hotfix`.
- Jira part must be numeric in this pattern.
- Description must contain 2 to 5 lowercase words separated by single dashes.

Regex:
- `^(feature|bugfix|hotfix)/DLSR-[0-9]+-[a-z0-9]+(?:-[a-z0-9]+){1,4}$`

Valid examples:
- `feature/DLSR-100-update-recovered`
- `bugfix/DLSR-42-fix-login-timeout`

Invalid examples:
- `feature/DLSR-update-recovered` (missing Jira number)
- `hotfix/DLSR-10-patch` (description has 1 word, minimum is 2)
- `feature/DLSR-10-this-description-has-too-many-words-here` (more than 5 words)

#### Pattern B: chore
Required format:
- `chore/DLSR-<2-5-word-kebab-description>`

Validation:
- Prefix must be `chore`.
- No Jira number in this pattern.
- Description must contain 2 to 5 lowercase words separated by single dashes.

Regex:
- `^chore/DLSR-[a-z0-9]+(?:-[a-z0-9]+){1,4}$`

Valid example:
- `chore/DLSR-fixing-typo-lost-stolen`

Invalid examples:
- `chore/DLSR-100-fixing-typo` (Jira number is not allowed here)
- `chore/DLSR-typo` (description has 1 word)

### 2) Commit Standards
All commits in the PR/MR should pass these checks:
- Atomic: one logical change per commit.
- Imperative subject: use command style, for example `Add`, `Fix`, `Refactor`.
- Subject length: maximum 50 characters.
- Conventional Commits type is required.
- Scope is optional.

Allowed types:
- `feat`
- `fix`
- `docs`
- `style`
- `refactor`
- `perf`
- `test`
- `chore`
- `build`
- `ci`
- `revert`

Preferred subject format:
- `<type>(<optional-scope>): <imperative subject <= 50 chars>`

Examples:
- `feat(auth): add token refresh`
- `fix: handle empty todo title`
- `refactor(ui): simplify filter rendering`

Reject examples:
- `added token refresh support` (not Conventional Commits)
- `feat: adding token refresh` (not imperative)
- `fix: this subject line is too long because it exceeds fifty chars` (too long)

## Procedure
1. Collect inputs.
2. Validate branch name against Pattern A or Pattern B:
- If valid, continue.
- If invalid, return exact mismatch reasons and one corrected branch suggestion.
3. Validate commit list:
- Check each commit for Conventional Commits type, imperative mood, and subject length <= 50.
- Check whether commit grouping appears atomic.
- If invalid, return a per-commit correction list.
4. Build PR/MR title:
- Prefer one concise line using Conventional Commit style adapted to the overall change.
5. Build PR/MR body using the template below.
6. Run completion checks.
7. If any check fails, do not output final-ready PR/MR text. Output fixes first.

## PR/MR Output Template

### Title
- `<type>(<optional-scope>): <summary <= 50 chars>`

### Body
- `## Summary`
  - What changed and why.
- `## Linked Context`
  - Jira: `DLSR-<number>` for `feature|bugfix|hotfix` branches.
  - For `chore`, state `No Jira required by branch policy`.
- `## Changes`
  - Bullet list of concrete changes.
- `## Testing`
  - Commands run and/or manual steps with outcomes.
- `## Risk`
  - Potential impact areas.
- `## Rollback`
  - Safe rollback steps.

## Completion Checks
Mark as done only when all are true:
- Branch name is valid for its prefix rule.
- Commits are atomic and compliant with Conventional Commits.
- Commit subjects are imperative and <= 50 characters.
- PR/MR title and body are complete and reviewer-ready.
- Testing evidence is provided.

## Failure Output Format
If standards are not met, output this structure:
- `Status: Changes required`
- `Branch issues:`
  - list each issue and provide one corrected branch name
- `Commit issues:`
  - list each failing commit and a corrected replacement
- `Missing PR/MR details:`
  - list missing sections or evidence
- `Next action:`
  - concise step-by-step fixes

## Example Prompts
- `Use pr-request-standards for branch feature/DLSR-100-update-recovered with these commits: ...`
- `Prepare an MR draft and validate my branch chore/DLSR-fixing-typo-lost-stolen.`
- `Check if my commits are atomic and Conventional Commit compliant, then draft PR text.`
