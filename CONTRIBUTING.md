# Contributing guide

## Workflow

1. Every task starts as an **issue** and lives on the project board.
2. Create a branch from `develop` named `type/number-short-description`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feat/12-parking-admin-role
   ```
3. Make small commits using the format below.
4. Open a **Pull Request** into `develop`, link the issue (`Closes #12`), and request a review.
5. With at least one approval, merge it. `main` only receives stable releases from `develop`.

## Branches

| Branch | Use |
| --- | --- |
| `main` | Stable release |
| `develop` | Team integration |
| `feat/*`, `fix/*`, `docs/*`, `refactor/*` | Individual work |

## Commits ([Conventional Commits](https://www.conventionalcommits.org/))

```text
type(scope): short lowercase description
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

Examples:

```text
feat(parking): add parking administrator role
fix(payments): correct amount calculation by hours
docs(readme): document environment variables
```

## Pull Requests

- One PR = one change with a clear purpose.
- Fill in the template: what changes, why, and how to test it.
- If you change routes, models, or environment variables, update `README.md`, `docs/ARCHITECTURE.md`, or `.env.example` in the same PR.
- Add a line to `CHANGELOG.md` under *Unreleased*.

## Language

All documentation, commit messages, issues, and Pull Requests are written in **English**.

## Security

- Never commit `.env`, API keys, or passwords.
- If a credential is exposed, **revoke it and generate a new one**; deleting it from history is not enough.
