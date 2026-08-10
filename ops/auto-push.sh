#!/bin/bash
# auto-push: commits any uncommitted changes (respecting .gitignore) and pushes
set -u
REPO="${1:-}"
[ -z "$REPO" ] && exit 1
[ -d "$REPO/.git" ] || exit 0
cd "$REPO" || exit 1
LOG=/var/log/auto-push.log
ts() { date "+%Y-%m-%d %H:%M:%S"; }

git remote get-url origin >/dev/null 2>&1 || { echo "$(ts) [$REPO] no remote, skip" >> $LOG; exit 0; }
branch=$(git branch --show-current 2>/dev/null)
[ -z "$branch" ] && { echo "$(ts) [$REPO] no branch, skip" >> $LOG; exit 0; }

if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
  git add -A
  files=$(git diff --cached --name-only | wc -l)
  if git commit -m "auto: snapshot $(date +%Y-%m-%d\ %H:%M) (${files} files)" >> $LOG 2>&1; then
    echo "$(ts) [$REPO] committed ${files} files on $branch" >> $LOG
  fi
fi

if git rev-parse --abbrev-ref @{u} >/dev/null 2>&1; then
  unpushed=$(git log @{u}.. --oneline 2>/dev/null | wc -l)
  if [ "$unpushed" -gt 0 ]; then
    if git push >> $LOG 2>&1; then
      echo "$(ts) [$REPO] pushed $unpushed commit(s) on $branch" >> $LOG
    fi
  fi
else
  if git push -u origin "$branch" >> $LOG 2>&1; then
    echo "$(ts) [$REPO] pushed (set upstream) on $branch" >> $LOG
  fi
fi
exit 0

