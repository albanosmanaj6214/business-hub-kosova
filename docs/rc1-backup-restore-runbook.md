# RC1 Backup & Restore Runbook (rehearsed)

All commands run on the DB host as the `postgres` role. Backups are written to a non-public, mode-700 directory (`/var/lib/postgresql/rc1_backup`), never a world-readable path. No DB contents or secrets are reproduced here. Temporary backups are deleted after the rehearsal.

## Backup (read-only on production)
```
install -d -o postgres -g postgres -m 700 /var/lib/postgresql/rc1_backup
sudo -u postgres pg_dump -Fc -d businesshub_db -f /var/lib/postgresql/rc1_backup/businesshub_db_<TS>.dump
sha256sum <dump>            # record checksum
```
**Rehearsal result:** format custom (`-Fc`); size **872992 bytes**; duration ~1 s; exit **0**; sha256 `6e13096d9a68ba4084846a12b1133ebebdba8b92796d69bd2652ab869cde1b03`. `pg_dump` does not modify production.

## Restore (into isolated clone)
```
sudo -u postgres psql -c "DROP DATABASE IF EXISTS businesshub_rc1qa WITH (FORCE);"
sudo -u postgres psql -c "CREATE DATABASE businesshub_rc1qa;"
sudo -u postgres pg_restore -d businesshub_rc1qa <dump>
```
**Rehearsal result:** restore completed with **no errors**. Verified representative counts post-restore = production baseline (Source 44, Grant 125, TradeFair 46, Opportunity 96, Company 24, User 28, Notification 114, ScrapeAttempt 695, SourceHealth 41). Referential integrity intact (0 invalid FKs).

## Production deploy backup (mandatory, at deploy time)
Take a fresh `pg_dump -Fc` of `businesshub_db` immediately before applying migrations; record size + sha256 + timestamp; store in the 700 dir; keep until the release is confirmed stable, then delete.

## Cleanup
Delete the temporary rehearsal dump and drop `businesshub_rc1qa` after verification (see cleanup section of the completion report).
