# 4. Security, Privacy, Consent & Retention

## 4.1 Threats and controls

| Threat | Control | Phase |
|--------|---------|-------|
| Stolen or guessed passwords | Argon2id hashing. Minimum 10 characters and not the username. Lockout for 15 min after 10 failures. Login rate limit of 5/min per IP+username. Generic "invalid credentials" message. | 2 |
| Token theft | 15‑min access JWT kept **in memory** (not localStorage). Opaque refresh token in an `HttpOnly; SameSite=Strict; Path=/api/v1/auth` cookie (`Secure` in production). Rotation with reuse detection. Logout revokes the session. A password change invalidates older tokens. | 2 |
| CSRF on the refresh endpoint | SameSite=Strict, plus a required `X-Requested-With` header. All other endpoints use the Authorization header, which browsers do not send automatically. | 2 |
| Broken access control | Every route declares `require_permission("…")`. Response models are chosen by permission (contact fields omitted without `people.contact.read`). API tests cover each role against each endpoint. | 2–3 |
| SQL injection | SQLAlchemy bound parameters only. Sort and filter fields come from an allowlist, never raw column names from the client. | 3 |
| Malicious uploads | Size cap enforced while streaming. Content sniffed with Pillow (`JPEG`/`PNG` only). `Image.MAX_IMAGE_PIXELS` bound against decompression bombs. Images are re-decoded, never served back as uploaded. Random file IDs, stored outside the web root. Photos are served only through an authorised endpoint with `Content-Type` forced and `nosniff`. | 4 |
| Scan endpoint abuse / brute force | Per-user rate limits (frames: 4/s, uploads: 10/min). Every decision is logged in scan_events. | 4 |
| Theft of the DB or a backup | Templates and photos are AES‑256‑GCM encrypted. Keys live only in environment variables, never in the DB or git. `key_id` columns allow key rotation. | 4 |
| Data in transit | HTTPS in any non-localhost deployment. Browsers only allow camera access on HTTPS or `localhost`, so a LAN kiosk needs TLS (Phase 7 covers a TLS reverse proxy such as Caddy). HSTS and security headers (CSP, `X-Frame-Options: DENY`, `Referrer-Policy`). | 6–7 |
| Insider misuse | Audit log for every admin action, profile change, face enrollment or deletion, attendance correction, settings change, and failed login. Admin-only audit viewer. | 6 |
| CSV/Excel formula injection | Cells starting with `= + - @` (or tab/CR) are prefixed with `'` on export. | 6 |
| Verbose errors | Generic 500 responses with a `request_id`. Stack traces only in server logs. | 2 |

**Honest limit:** encrypting templates protects them against stolen DB dumps and backups. It does
not protect against an attacker who controls the running server, because that server holds the keys
in memory to perform matching. Revocable ("cancellable") biometric templates are out of scope for
this project.

## 4.2 Purpose limitation

- The gallery contains **only** people who were enrolled with recorded consent. Scans are compared
  against that gallery and nothing else.
- No external APIs, no web or social-media search, no clustering or "find similar faces" across
  unknown scans.
- Unknown faces are **not stored**: no image and no embedding. They cannot be identified later.
- Face data is never used to train or fine-tune models.

## 4.3 Consent management

1. Before enrollment, HR records consent: method, privacy-notice version, and an evidence reference
   such as a signed form number. The Settings page holds the privacy-notice text in English and
   Khmer.
2. Enrollment endpoints refuse to run without a current `GRANTED` consent.
3. **Withdrawal** is one click (`consent.manage`). In a single transaction it inserts a `WITHDRAWN`
   row, deletes all of the person's face templates, removes them from the gallery, and writes an
   audit row. The person continues to use manual or ID attendance with no loss of service.
4. Consent history is append-only. It is kept as proof of what was agreed and when.
5. Declining consent must not disadvantage anyone. The UI wording and the README say so.

## 4.4 Retention (defaults are admin-configurable)

| Data | Default retention | Action at expiry |
|------|-------------------|------------------|
| Face templates of ARCHIVED people | 30 days after archiving | Hard delete |
| Scan events | 90 days | Hard delete. Daily aggregate counts are kept for charts. |
| Audit logs | 365 days | Hard delete |
| Attendance records | 3 years | Hard delete |
| Profile photos of ARCHIVED people | 30 days after archiving | Secure delete of the encrypted file |
| Consent records | Lifetime of the person record + attendance retention | Delete together with the person |

Retention runs from `python -m app.cli run-retention`, which can be scheduled daily with Windows Task
Scheduler, or from **Settings → Run retention now**. A **dry-run** mode shows the counts before
anything is deleted. Every run writes an audit row with the counts removed.

Adjust these periods to your school's or company's policy and to applicable local law. The defaults
are reasonable starting points, not legal advice.

## 4.5 Secure deletion ("erase person")

`POST /people/{id}/erase` (Admin, requires a typed confirmation and a reason):

1. Delete every `face_templates` row and evict the person from the gallery.
2. Delete the encrypted photo. Overwriting files is unreliable on SSDs, but anything recovered from
   the disk is only AES-GCM ciphertext and is useless without the key, which is never stored on disk
   next to the data.
3. Anonymise `people`: the name becomes `Erased person #<id>`, `name_km`/email/phone/photo are set
   to NULL, the status becomes ARCHIVED, and `erased_at` is set. Attendance rows stay attached to
   the anonymous ID, so historical headcounts remain correct.
4. Write an audit row (`person.erase`) with the reason, but **no** personal values in `before_data`.

Backups age out under the backup schedule. The Phase 7 docs recommend keeping backup retention no
longer than the shortest retention above.
