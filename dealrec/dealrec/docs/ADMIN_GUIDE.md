# Admin guide

Admins can access `/admin`. The account is controlled by the `isAdmin` flag on the user record.

## What the admin area shows

- Counts for users, deals, executed deals, and active seals.
- Recent users with suspend/unsuspend controls.
- Recent deals and their status.
- Seal revocation with a required reason.
- Recent audit entries.
- Invitation revocation by invitation ID.

## Admin actions

- **Suspend a user:** blocks normal account use. Existing public verification remains available.
- **Unsuspend a user:** restores access.
- **Revoke a seal:** marks the seal revoked and records the reason. The verification page should then show a revoked state; the underlying record is not deleted.
- **Revoke an invitation:** prevents further use of that invitation token.
- **Audit log:** sensitive admin actions are written to `AdminAudit`.

## Safe operation

- Use named admin accounts where possible; do not share credentials.
- Record a clear reason for seal or invitation revocation.
- Do not edit `.storage` files by hand. Database hashes will no longer match.
- Do not delete audit rows to "clean up". The platform record depends on continuity.
- Investigate before revoking: the seal may already be in a counterparty's evidence ZIP.
- Keep backups. Admin actions are not a substitute for a legal process or law-enforcement request.

## Seeding and passwords

The seed creates `admin@dealrec.ng` with a development password. Change it immediately outside local development. For production, create a dedicated admin account and avoid seeding demo users.

## Escalation

If a record is disputed, preserve the database, `.storage`, logs, and any evidence ZIPs. dealrec can explain what it recorded, but it cannot decide legal rights or authenticate a person's civil identity.
