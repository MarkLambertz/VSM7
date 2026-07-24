# VSM7 Git Collaboration Contract

This contract coordinates Mark, Claude, and Codex when working with the local
Git repository and its GitHub remote.

## Repository Facts

- Canonical local project: `/Users/mark/Documents/VSM7`
- GitHub remote: `https://github.com/MarkLambertz/VSM7.git`
- Integration branch: `main`
- `main` is the stable integration line, not a shared scratch branch.
- `VSM7-Workspaces/` contains workshop/project data and must never be committed.
- Installed dependencies, test output, operating-system files, and local agent
  permissions remain ignored.
- A GitHub push happens only when Mark explicitly requests it.

## Default Ownership

Claude owns the front-end design asset lane:

- `design-previews/**`
- `asset-tests/**`
- Standalone visual assets such as `vsm.html`,
  `e2e-robustness-check.html`, and `channel-variety-check.html`

Codex owns the application and integration lane:

- `src/**`
- `tests/**`
- `scripts/**`
- `index.html`
- `start.command`
- Cache-label coordination
- Git integration, merges, and release verification

Shared Markdown handover and briefing files may be updated by either agent, but
each agent should append clearly attributed sections instead of rewriting the
other agent's record.

Claude may edit Codex-owned UI files, and Codex may edit Claude-owned assets,
only when Mark explicitly authorizes that exception. Cross-lane edits must be
isolated in a focused commit and named in the handover.

## Parallel Work

True parallel work requires separate Git worktrees.

- Codex branches use `codex/<short-task-name>`.
- Claude branches use `claude/<short-task-name>`.
- Never switch branches inside another agent's worktree.
- Never let two agents edit from `/Users/mark/Documents/VSM7` at the same time.
- If no dedicated worktree has been assigned, work serially and hand over before
  the other agent starts.
- Codex integrates reviewed feature commits into `main`.

The preferred layout is:

```text
/Users/mark/Documents/VSM7          main integration worktree
/Users/mark/Documents/VSM7-Codex    Codex feature worktree
/Users/mark/Documents/VSM7-Claude   Claude feature worktree
```

Do not create these additional worktrees until Mark asks to enable parallel Git
work. Their creation does not change the application folder structure.

## Before Editing

Every agent must first report:

```text
Working directory:
Branch:
HEAD commit:
Working tree status:
Files intended for this task:
```

Then apply these rules:

- Read `AGENTS.md` and this contract.
- Inspect `git status --short --branch`.
- Stop if an intended file contains uncommitted work from the other agent.
- Never discard, overwrite, or silently absorb another agent's changes.
- Agree ownership before touching a file outside the default lane.

## Commits

- Make small commits with one clear intent.
- Commit only files that belong to the stated task.
- Do not mix Claude and Codex work in one commit.
- Run the relevant tests before committing.
- For behavior changes, Codex runs `npm test`.
- For Claude-owned visual assets, Claude runs the relevant asset tests.
- Record cache-label changes explicitly.
- Keep the working tree clean at handover whenever practical.

Use descriptive commit messages, for example:

```text
fix(step7): persist role FTE
ui(step7): refine org-chart gap spotlight
test(export): cover Safari overlay contract
docs(collab): record Step VII bridge handover
```

## Safety Rules

- Never use `git reset --hard`, `git clean`, force-push, or destructive checkout
  commands unless Mark explicitly requests and approves the exact operation.
- Never rewrite published history.
- Never push directly while the other agent has unintegrated work.
- Never commit `VSM7-Workspaces/`, secrets, local permissions, or generated
  dependency folders.
- Do not use `git stash` as a collaboration mechanism. Commit focused work or
  hand it over explicitly.
- Do not claim a push, merge, or test succeeded without verifying it.

## Handover Format

Every Git handover should contain:

```text
Agent:
Worktree:
Branch:
Commit SHA(s):
Purpose:
Files changed:
Tests run and result:
Cache label:
Cross-lane edits:
Uncommitted files:
Open decisions / next owner:
Safe integration instruction:
```

If a change is not committed, list every affected file and explain why. The next
agent must not infer ownership from an unexplained dirty working tree.

## Integration Sequence

1. Feature owner commits and hands over a clean branch.
2. The other agent reviews only the contract and affected interfaces.
3. Codex integrates the commit into `main`.
4. Codex runs the host tests; Claude runs asset tests when its assets changed.
5. Mark performs real Safari, Word, or PowerPoint checks when those applications
   are part of the acceptance criteria.
6. Only after verification may Mark request a GitHub push.
