# Firestore security review — 9 August 2026

## Codebase findings

- The web app uses Firebase Authentication with email/password and Google.
- The app reads `users/{auth.uid}`, records a server `lastLogin`, and appends a
  login event to `auditLogs`.
- Superadmin creates and lists `admins/{uid}`, updates an admin's boolean
  status in both `admins` and `users`, and reads the latest 50 `auditLogs`.
- The client never lists the private `users` collection.
- The supplied Firestore document shows `users/{uid}` includes an email,
  role, `kd_role`, boolean status, and timestamp. Email is private data, so
  users must not read another user's document.
- The supplied rules identify `konten` as intentionally public guest content.

## Rule assumptions

- A trusted backend/Admin SDK provisions and changes user roles, statuses, and
  other user-profile fields.
- Only a superadmin may provision a profile with the fixed `admin` role and
  may activate/deactivate that admin. Client-side role promotion to
  `superadmin` is never allowed.
- Audit records are append-only. For independently verifiable, tamper-proof
  audit records, move log generation to a trusted Cloud Function.

## Devil's-advocate checks

| Attempt | Expected result | Rule outcome |
| --- | --- | --- |
| Anonymous collection query of `users` | Denied | `list` is denied. |
| User A reads User B's user document | Denied | UID must match document ID. |
| User A changes role, `kd_role`, status, or email | Denied | Only `lastLogin` may change. |
| User A adds arbitrary fields or a 1 MB value | Denied | Any changed field besides `lastLogin` fails validation. |
| User A replaces `lastLogin` with a string or custom time | Denied | It must be a timestamp equal to `request.time`. |
| User A creates a privileged profile | Denied | Client creates are denied. |
| User A deletes a profile | Denied | Client deletes are denied. |
| Guest reads `konten` | Allowed by existing guest-content requirement | Public read is explicitly limited to `konten`. |
| Guest writes `konten` | Denied | All client writes are denied. |
| Access to an unknown collection/subcollection | Denied | Default-deny catch-all applies. |
| Admin lists private `users` | Denied | `users` collection queries are denied. |
| Admin promotes itself to superadmin | Denied | Profile create/update only permits role `admin`. |
| Admin changes another admin status | Denied | Only `isSuperadmin()` can perform that update. |
| Any user rewrites an audit entry | Denied | Audit logs permit create only; update/delete are denied. |
