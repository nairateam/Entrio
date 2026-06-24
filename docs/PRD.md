# Visitor Management System — Product Requirements Document

**Version:** 1.1
**Status:** Draft for Review
**Platform:** Web application

---

## 1. Overview

### 1.1 Purpose
This system replaces manual sign-in logs at the front desk with a digital Visitor Management System (VMS). It manages the full visitor lifecycle — pre-registration, check-in, host notification, check-out — while giving Security, Hosts, and Admins the right level of control and visibility for their role.

> **Note on "Security":** The Security role covers both physical front-desk staff and any frontend/web interface operators performing check-in and check-out duties.

### 1.2 Problem Statement
Manual visitor logs are slow, insecure, and give no real-time visibility into who is in the building. There's no reliable way to flag risky visitors, enforce working hours, notify hosts automatically, or produce an audit trail for compliance and emergency response.

### 1.3 Goals
- Replace paper sign-in with a fast, searchable digital check-in/check-out flow
- Give Security a live view of who is in the building at all times
- Automatically notify hosts when their visitor arrives
- Enforce working-hours access, with a controlled override path
- Maintain a blocklist for denied entry, plus a softer host-level restriction
- Produce a full, immutable audit trail for every action
- Support reporting/export for Admins
- Be ready for multi-facility expansion later, without a redesign

### 1.4 Non-Goals (for this version)
- Native mobile app (web app only — mobile browsers supported)
- Multi-facility support (data model allows for it later, not built now)
- Visitor self-service kiosk / self-check-in (out of scope unless added later)
- Integration with physical turnstiles / access control hardware

---

## 2. Roles & Permissions

| Role | Description |
|---|---|
| **Security** | Front-desk staff and frontend operators. Performs check-in/check-out, searches visitors, flags suspicious visitors. Cannot block. |
| **Host** | Staff member receiving visitors. Pre-registers visitors, gets arrival notifications, can restrict a visitor from visiting them specifically. |
| **Admin** | Manages working hours, blocklist, flagged visitors, override approvals, reporting/export, and system-level configuration. |

### 2.1 Permission Matrix

| Action | Security | Admin | Host |
|---|---|---|---|
| Check in / check out a visitor | ✅ | ✅ | ❌ |
| Search visitor by name/phone | ✅ | ✅ | ❌ |
| Pre-register a visitor | ❌ | ✅ | ✅ |
| Flag a visitor for review | ✅ | ✅ | ❌ |
| Block a visitor (building-wide) | ❌ | ✅ | ❌ |
| Remove a block | ❌ | ✅ | ❌ |
| View blocklist | ❌ | ✅ | ❌ |
| View flagged visitors | ❌ | ✅ | ❌ |
| Restrict a visitor from visiting me | ❌ | ❌ | ✅ |
| Approve/deny working-hours override | ❌ | ✅ | ❌ |
| Edit working hours / blackout dates | ❌ | ✅ | ❌ |
| Configure overstay threshold | ❌ | ✅ | ❌ |
| View live board ("who's inside") | ✅ | ✅ | Own visitors only |
| Run reports / export | ❌ | ✅ | ❌ |
| View audit logs | ❌ | ✅ | ❌ |

---

## 3. Data Model

### 3.1 Core Tables

**users** — Anyone with a login (Security, Host, Admin).
- `id`, `full_name`, `email` (unique), `phone`, `role` (enum: security, host, admin), `department`, `is_active` (soft delete), `created_at`, `updated_at`

**visitors** — A person who visits the facility, reused across multiple visits.
- `id`, `full_name`, `phone`, `email` (optional), `photo_url`, `is_blocked`, `block_reason`, `blocked_by` (FK → users), `blocked_at`, `created_at`
- `is_flagged`, `flagged_by` (FK → users), `flagged_at`, `flag_note`
- **Unique constraint:** `(full_name, phone)` — prevents accidental duplicates while allowing two different people to share a name

**visits** — One visitor, one check-in event. Most-queried table in the system.
- `id`, `visitor_id` (FK), `host_id` (FK → users, must be host role), `checked_in_by` (FK → users, must be security role), `checked_out_by` (FK), `purpose`, `status` (enum: expected, checked_in, checked_out, no_show, denied), `check_in_time`, `check_out_time`, `expected_time`, `is_override`, `override_approved_by` (FK), `notes`, `created_at`

**working_hours** — When the facility is open.
- `id`, `day_of_week`, `open_time`, `close_time`, `is_active`, `updated_by` (FK), `updated_at`

**blackout_dates** — Holidays/closures that override working hours.
- `id`, `date`, `reason`, `created_by` (FK), `created_at`

**notifications** — Log of every notification sent.
- `id`, `visit_id` (FK), `recipient_id` (FK), `type` (enum: arrival_alert, override_request, override_approved, overstay_alert), `channel` (enum: sms, email, in_app), `status` (enum: sent, delivered, failed), `sent_at`

**audit_logs** — Immutable record of every action. Never edited or deleted.
- `id`, `actor_id` (FK), `action`, `target_type`, `target_id`, `meta` (JSONB), `created_at`

**host_visitor_restrictions** — Host-specific "do not send to me" list (distinct from a building-wide block).
- `id`, `host_id` (FK → users), `visitor_id` (FK → visitors), `reason` (private, Admin-visible only), `created_at`, `is_active`

### 3.2 Relationships
```
users ──────── visits (as host)
users ──────── visits (as checked_in_by)
users ──────── visits (as override_approved_by)
visitors ────── visits
visits ──────── notifications
visits ──────── audit_logs
users ──────── audit_logs (as actor)
users ──────── working_hours (as updated_by)
users ──────── host_visitor_restrictions (as host)
visitors ────── host_visitor_restrictions
```

### 3.3 Indexing Strategy
| Table | Index On | Reason |
|---|---|---|
| visits | status | Live board filters by active visits |
| visits | check_in_time | All date-range queries |
| visits | host_id | Hosts query their own visits |
| visits | visitor_id | Repeat visitor detection |
| visitors | full_name | Search by name at check-in |
| visitors | phone | Search by phone at check-in |
| visitors | is_blocked | Blocklist check on every check-in |
| audit_logs | actor_id | Admin filtering by user |
| audit_logs | created_at | Time-range audit queries |

### 3.4 Photo Storage
- Photos are stored in cloud storage (Supabase Storage or S3) — never in the database
- Folder structure: `/headshots/{visitor_id}/{visit_id}.jpg`
- Each visit gets its own headshot, even for returning visitors
- Old photos are retained for audit purposes — never auto-deleted

---

## 4. Functional Requirements (User Flows)

### 4.1 Walk-in Visitor Check-in (Security)
1. Security searches visitor by name or phone — system returns **all** matches (handles same-name collisions)
2. Security confirms identity via phone number before selecting a record
3. If no match → new visitor record created
4. Working-hours check: if closed, check-in is blocked and override can be requested (§4.8)
5. Blocklist check: if blocked, check-in is silently denied (§4.7)
6. Host-restriction check: if the selected host has restricted this visitor, a neutral message is shown (§4.11) and security must pick another host or escalate
7. Headshot captured via browser camera
8. Check-in confirmed → host notified → visit status = `checked_in` → visitor appears on live board

### 4.2 Pre-registered Visitor Check-in (Security)
Same as 4.1, but the visitor record already exists with status `expected`. No new visitor record is created. Faster path.

### 4.3 Check-out (Security)
Security finds the visitor on Today's Board or searches by name/phone → confirms check-out → check-out time logged, duration calculated → status = `checked_out` → removed from live board → audit log updated.

### 4.4 Pre-registration (Host)
Host fills in visitor details + expected date/time → visit record created with status `expected` → visitor appears on Security's board as "Expected" ahead of arrival.

### 4.5 Host Arrival Notification & Response
On check-in, host is notified via SMS + in-app with visitor name, time, and headshot. Host can tap "On My Way," which updates the live board status for Security.

### 4.6 Overstay Alert
Background job runs every 30 minutes, flags visits where `check_in_time` exceeds the configurable threshold (default 4 hours) and status is still `checked_in`. Alerts Security + Admin. Logged in `notifications`.

### 4.7 Blocklist Flag at Check-in
If `visitors.is_blocked = true`: Security sees a discreet warning only, a silent alert fires to Admin, check-in is blocked, visit is recorded as `denied`, and the action is fully audit-logged.

### 4.8 Working-Hours Override Request
If the building is closed, check-in is blocked automatically. Security can request an override with a reason; Admin approves or denies. If approved, `is_override = true` and `override_approved_by` is set, and check-in resumes from the headshot step. If denied, visit is logged as `denied`.

### 4.9 Admin Reporting
Admin selects a date range and filters (department, host, purpose, status). Dashboard shows total visitors, peak-hour chart, visits per host/department, overstay incidents, override events, denied/blocked entries. Exportable as CSV or PDF.

### 4.10 Emergency / Evacuation
"Who's Inside Now?" queries `visits WHERE status = 'checked_in'` and returns a live roll-call list (visitor, host, check-in time, purpose) for Security/Admin to use during an incident.

### 4.11 Host-Level Visitor Restriction ("Don't send this visitor to me")
- A Host can mark a specific visitor as restricted **for themselves only** — not a building-wide block
- The reason is private and visible only to Admin
- At check-in, if the visitor names a restricted host, Security sees a neutral message: *"This host is not accepting this visitor. Please contact another host or Admin."*
- The visitor is never told why; the host is never notified of the attempt
- The visitor can still be received by any other host
- Host can lift the restriction later (`is_active = false`)

### 4.12 Visitor Flagging vs. Blocking
- **Flag** (Security's tool): "Something feels off, needs review" — does not block entry, escalates to Admin with a note
- **Block** (Admin's tool): permanent building-wide denial, with a logged reason
- Security cannot block directly — this prevents misuse of a consequential decision by operational staff

### 4.13 Same-Name Visitor Disambiguation
- Visitors are never matched by name alone
- Search returns all name matches with phone (last 4 digits), last visit date, and last headshot thumbnail
- Security verbally confirms the phone number with the visitor before selecting a record
- `(full_name, phone)` is enforced as a unique constraint to avoid accidental duplicate records
- Edge case: identical name *and* phone → treated as the same person; Admin can manually separate if proven otherwise

---

## 5. Technical Notes

### 5.1 Multi-Facility Readiness
The schema is designed so a `facility_id` column can be added later to `visits`, `visitors`, `working_hours`, and `blackout_dates` without restructuring existing tables.

---

## 6. Open Questions
1. **Override request routing** — does it go to *any* Admin, or a specific on-call person?
2. **Notification channel preferences** — can a host opt out of SMS and use in-app/email only?
3. **Flagged visitor resolution** — does a flag auto-expire if unresolved, or stay open indefinitely?
4. **Data retention policy** — how long are headshots and visit records retained before archival?
5. **Visitor self-service** — any future plan for a kiosk or pre-arrival self check-in via link?

---

## 7. Success Metrics
- Average check-in time (target: under 60 seconds for a walk-in)
- % of check-ins completed without security needing to fall back to phone search
- Host notification delivery rate and response time
- Number of overstay incidents resolved within 15 minutes of alert
- Zero unaudited actions (100% audit log coverage on state-changing actions)
