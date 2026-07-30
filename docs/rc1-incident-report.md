# RC1 Incident Report — Unintended Production Application Restart

## What happened
During RC1 cleanup, a broad process-termination command was used to stop an isolated QA app:
```
pkill -9 -f "next-server"
```
This pattern also matched the **production** Next.js `next-server` process. PM2 detected the exit and **automatically restarted the production application once** (`restarts: 1`).

## Accurate production impact
- No production code changed (still `ec8d5ff`).
- No production database data or schema changed.
- No production source or schedule changed.
- No production environment value changed.
- No deployment occurred.
- **One unintended production application-process restart occurred.**
- Production recovered automatically on commit `ec8d5ff`; homepage returned HTTP 200 afterward.
- Do NOT state that production services were completely untouched — one process restart happened.

## Root cause
`pkill -f "next-server"` matches by command-line substring across ALL processes on a shared host, including the PM2-managed production process. The intent was to stop only the isolated QA process on port 3055.

## Prevention controls (now mandatory for all QA process actions)
1. Never use broad process-name killing (`pkill -f "next-server"`, `pkill -f node`, etc.) on a shared host.
2. Identify the exact PID, port, working directory and command line before any termination.
3. Terminate only the isolated process.
4. Prefer port-scoped termination: `fuser -k <QA_PORT>/tcp`.
5. Verify the PID is NOT managed by production PM2 before termination (`pm2 pid businesshub` / `pm2 jlist`).
6. Verify production health immediately before AND after any QA process action (`curl localhost:3000` = 200).
7. Prefer self-terminating wrappers for QA servers: `timeout <N> next start -p <QA_PORT>` (no explicit kill needed).

During the condition-closure phase these controls were applied: the QA app and port-forward ran under `timeout` wrappers (self-terminating), and production health was checked 200 before and 200 after every QA action. No process-termination command was issued in this phase; production `restarts` stayed at 1 (no new restart).
