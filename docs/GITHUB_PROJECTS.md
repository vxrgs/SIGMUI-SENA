# GitHub Projects guide

GitHub Projects is a board (Kanban style) connected to the repository's issues and Pull Requests.

## 1. Create the project

1. Go to <https://github.com/vxrgs/SIGMUI-SENA> → **Projects** tab → **New project**.
2. Choose the **Board** template and name it `SIGMUI — Development`.
3. *Status* columns: `Backlog` → `Ready` → `In progress` → `In review` → `Done`.

## 2. Recommended fields

In the project's `⋯` menu → **Settings** → **Custom fields**:

| Field | Type | Values |
| --- | --- | --- |
| Epic | Single select | Parking role, Organization, Maps, Payments, Documentation |
| Priority | Single select | High, Medium, Low |
| Size | Single select | S, M, L |
| Assignee | (native) | The issue's assignee |

## 3. Repository labels

In **Issues → Labels**, create: `feat`, `bug`, `docs`, `epic`, `backend`, `frontend`, `payments`, `maps`.

## 4. Create the tasks

1. Create one issue per epic in [ROADMAP.md](ROADMAP.md) with the `epic` label.
2. Split each epic into small issues (1–3 days) using the **Feature** template.
3. Link the child issues in the epic with a task list (`- [ ] #14`).
4. In the project, click **Add item** and add the issues.

## 5. Automations

In the project's **Settings → Workflows**, enable:

- *Item added to project* → `Backlog`
- *Pull request merged* → `Done`
- *Item closed* → `Done`

## 6. Team routine

1. Before starting: move the card to `In progress` and assign yourself the issue.
2. Create the branch `feat/<n>-short-description` (see [CONTRIBUTING.md](../CONTRIBUTING.md)).
3. When opening the PR, write `Closes #<n>` so the card moves to `Done` on merge.
4. Review the board at the start of each week and prioritize the `Backlog`.

## 7. Milestones

Use **Issues → Milestones** to group dated deliveries, for example `v1.1 — Parking administrator role`.
