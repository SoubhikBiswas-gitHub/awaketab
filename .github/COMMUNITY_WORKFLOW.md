# AwakeTab contribution workflow

[Project board](https://github.com/users/SoubhikBiswas-gitHub/projects/2) · [Issue forms](https://github.com/SoubhikBiswas-gitHub/awaketab/issues/new/choose)

## From an idea to production

1. A contributor submits a bug, feature or documentation issue.
2. Only `SoubhikBiswas-gitHub` may apply `approved`. The workflow verifies who last added that label using issue-event history. Approval from another account is removed and creates no task.
3. The approved issue is added to the board as **Approved**. The owner can use `ready`, `in-progress`, `blocked`, `needs-information` or `not-planned` to change its stage.
4. Contributors open focused PRs against `play`, linking approved issues using `Closes #123` or `Tracks: #123`. A draft means **In Progress**, a ready PR means **In review**, and owner-requested revisions mean **Changes requested**.
5. A PR merged into `play` means **In testing**. The owner promotes tested changes from `play` to `main`; the promotion PR must list every delivered issue. Production merge means **Merged**.
6. A successful production deployment for that exact merge revision means **Deployed**. Preview deployment, skipped deployment and passing validation alone cannot complete a task. Failure means **Deployment failed**.

The complete board vocabulary is Inbox, Needs information, Approved, Ready, In Progress, In review, Changes requested, Blocked, In testing, Merged, Deploying, Deployment failed, Deployed and Not planned. Owners may use Inbox for triage; unapproved issues are not automatically added to the board. Removing `approved` returns an existing task to Inbox and stops subsequent automatic updates until the owner approves it again.

## Connect the board

The repository variable `PROJECT_NUMBER` must be `2`. Set a repository Actions secret named `PROJECTS_TOKEN` using an owner credential with Projects write access and access to this repository. For user-owned Projects, GitHub documents a classic token with `project` and `repo` scopes. Store it only as an Actions secret, never in a source file, issue or PR. Rotate it before its expiry. GitHub's repository-scoped `GITHUB_TOKEN` cannot write user Projects.

The workflow checks out only the default branch, disables persisted checkout credentials and treats issue/PR bodies as data. It never checks out or executes contributor code with the Projects credential. Only the owner can run manual reconciliation. Built-in board rules that mark closed issues or merged PRs as done must remain disabled.

## Deployment evidence

AwakeTab accepts the **Cloudflare Pages** check from the `cloudflare-workers-and-pages` app only when its check suite identifies `main`. Passlore accepts the **Deploy** job from the **Passlore checks and deployment** workflow only on a `main` push and only when that job succeeds. Both also accept production deployment-status events for `main`. The revision must belong to `main` and be the merge commit of a linked production PR.

Passlore's deployment job is conditional on deployment configuration; when it is skipped, work remains Merged. A docs-only change may therefore remain Merged, which accurately records that no application deployment was needed.

## Verify or troubleshoot

Run `python3 -m unittest discover -s .github/scripts -p 'test_*.py' -v` for the lifecycle contract tests. Review the **Contribution lifecycle** Actions run when a task does not move. Missing credentials or statuses fail visibly; they do not imply successful synchronization. The owner can use **Run workflow** to reconcile already approved open issues. The workflow is event-driven, so it does not silently start implementation or merge a PR.
