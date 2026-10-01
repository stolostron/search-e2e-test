# search-e2e-test

End-to-end Jest tests for the Open Cluster Management Search component. The tests
exercise the Search API against a configured hub cluster and, when available, an
imported managed cluster.

## Commands

Install JavaScript dependencies:

```bash
npm install
```

Check JavaScript formatting:

```bash
npm run lint
```

Run the complete local test flow. This requires `oc`, `yq`, cluster credentials,
and either `resources/options.yaml` or the required `OPTIONS_*` environment variables:

```bash
npm run test
```

Run only the Jest Search API tests after the cluster setup is complete:

```bash
npm run test:api
```

Run the flow with debug logging or remove generated reports:

```bash
npm run test:debug
npm run test:clean-reports
```

Build or run the containerized test image:

```bash
make build-test-image
make run-test-image
```

The test flow reads `resources/options.yaml` when present. Start from
`resources/options.yaml.template`; do not commit cluster credentials. The hub
requires `OPTIONS_HUB_BASEDOMAIN`, `OPTIONS_HUB_USER`, and
`OPTIONS_HUB_PASSWORD`. Managed-cluster variables are optional when managed
cluster tests are skipped.

## Repository Layout

- `tests/api/` contains Jest API scenarios and global setup/teardown.
- `tests/common-lib/` contains cluster, Search API, WebSocket, and validation helpers.
- `config/` contains runtime configuration loading.
- `start-tests.sh` performs cluster discovery, kubeconfig setup, Search pod readiness
  checks, and starts Jest.
- `build/` and `scripts/` contain container and CI support scripts.

## Conventions

JavaScript is formatted with Prettier using `.prettierrc.json` (no semicolons and
single quotes). Jest uses `tests/api` as its root directory and writes JUnit output
under `results/`. Cluster-facing tests require an accessible OpenShift API and
should not be run without the required credentials and test configuration.

## Tool Integrations

The `gh` and `jira` CLIs are not available in this environment. GitHub operations
for `stolostron` use the GitHub MCP server, and Jira operations use the Jira MCP
server. If credentials, an assignee, or a project key are needed, read the personal
configuration described below first.

## Personal configuration

Read personal config at the start of any task that needs an assignee, email, or project key.
Canonical path: ~/.config/user.local.md (tool-agnostic, global).
If the file does not exist, fall back to agent memory (`user-config`), then placeholders.
Run `make personalize` to generate or update the file (if this repo uses Fleet Engineering tooling).

## Fleet Engineering Skills

Fetch and apply the relevant skill when the task matches its domain.

| Skill | When to use |
|---|---|
| [bug-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/bug-specialist/SKILL.md) | Bug triage, reproduction steps, and fix planning |
| [epic-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/epic-specialist/SKILL.md) | Multi-sprint epics with outcomes |
| [feature-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/feature-specialist/SKILL.md) | Large customer-facing capabilities |
| [initiative-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/initiative-specialist/SKILL.md) | Multi-team strategic programs |
| [jira-create](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/jira-create/SKILL.md) | Interactive issue creation with specialist delegation |
| [jira-qe-readiness](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/jira-qe-readiness/SKILL.md) | Check whether a Jira ticket has enough QE verification detail |
| [jira-report](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/jira-report/SKILL.md) | Jira portfolio reports and issue quality reviews |
| [jira-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/jira-specialist/SKILL.md) | General Jira triage, search, linking, and transitions |
| [jira-type-audit](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/jira-type-audit/SKILL.md) | Audit and correct Jira issue types across the hierarchy |
| [outcome-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/outcome-specialist/SKILL.md) | Strategic outcomes tied to OKRs |
| [release-dod](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/release-dod/SKILL.md) | Release Definition of Done checklists |
| [risk-report](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/risk-report/SKILL.md) | Automated risk signal reports |
| [risk-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/risk-specialist/SKILL.md) | Risk register and mitigation planning |
| [spike-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/spike-specialist/SKILL.md) | Time-boxed research and proof of concepts |
| [story-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/story-specialist/SKILL.md) | User stories and acceptance criteria |
| [task-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/task-specialist/SKILL.md) | Internal technical tasks |
| [ticket-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/ticket-specialist/SKILL.md) | Stakeholder request intake and triage |
| [backlog-grooming](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/backlog-grooming/SKILL.md) | Jira backlog readiness and grooming |
| [breaking-changes](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/breaking-changes/SKILL.md) | Detect breaking API, config, or behavior changes |
| [ci-triage](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/ci-triage/SKILL.md) | Diagnose failing pull-request checks |
| [coderabbit-sync](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/coderabbit-sync/SKILL.md) | Maintain the Fleet reference CodeRabbit configuration |
| [cve-sustaining-handoff](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/cve-sustaining-handoff/SKILL.md) | Resolve and hand off CVE trackers |
| [vulnerability-slack-report](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/vulnerability-slack-report/SKILL.md) | Report overdue vulnerability issues |
| [diagnosing-bugs](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/diagnosing-bugs/SKILL.md) | Structure debugging and reproduction work |
| [finish-work](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/finish-work/SKILL.md) | Commit, push, open a PR, and update Jira |
| [github-org-access](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/github-org-access/SKILL.md) | Modify GitHub organization access configuration |
| [init-context-docs](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/init-context-docs/SKILL.md) | Assess and bootstrap repository context documentation |
| [opencode-setup](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/opencode-setup/SKILL.md) | Configure OpenCode and its integrations |
| [org-repo-audit](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/org-repo-audit/SKILL.md) | Audit organization repositories for SDLC readiness |
| [pr-fix](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/pr-fix/SKILL.md) | Fix merge conflicts, CI failures, or review comments |
| [pr-hygiene](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/pr-hygiene/SKILL.md) | Manage stale pull-request lifecycle |
| [pr-review](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/pr-review/SKILL.md) | Review GitHub pull requests with inline findings |
| [pr-review-detailed](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/pr-review-detailed/SKILL.md) | Run layered checklist-based code analysis |
| [pr-review-fix](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/pr-review-fix/SKILL.md) | Iteratively review and fix local changes before commit |
| [release-notes](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/release-notes/SKILL.md) | Generate categorized release notes |
| [renovate-prs](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/renovate-prs/SKILL.md) | Manage dependency update pull requests |
| [repo-content-audit](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/repo-content-audit/SKILL.md) | Find unlinked or orphaned repository content |
| [repo-setup](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/repo-setup/SKILL.md) | Onboard repositories to the Fleet Engineering Agentic SDLC |
| [rhacm-addon-wizard](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/rhacm-addon-wizard/SKILL.md) | Guide RHACM add-on development |
| [scored-code-review](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/scored-code-review/SKILL.md) | Deprecated code review workflow |
| [session-summary](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/session-summary/SKILL.md) | Summarize sessions against Jira and GitHub |
| [start-work](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/start-work/SKILL.md) | Create a Jira sub-task for a work session |
| [test-coverage-gap](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/test-coverage-gap/SKILL.md) | Analyze risk-prioritized coverage gaps |
| [f2f-daily-summary](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/f2f-daily-summary/SKILL.md) | Capture daily face-to-face meeting notes |
| [f2f-epic-specialist](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/f2f-epic-specialist/SKILL.md) | Create and manage face-to-face meeting epics |
| [presentation-task](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/presentation-task/SKILL.md) | Log delivered presentations as Jira tasks |
| [scrum-status](https://raw.githubusercontent.com/OpenShift-Fleet/agentic-sdlc/main/skills/scrum-status/SKILL.md) | Capture scrum notes and generate status reports |
