Entrio — Visitor Management System

PRD v2: Self-Service Check-In

Status: Draft for review
Supersedes: v1 (security-operated check-in)
Key change: Visitors check themselves in/out at a shared device (tablet, computer, or phone). QR codes are explicitly not used in this version — pre-registered visitors authenticate with a typed numeric code instead, since the check-in device may not have a usable camera.


1. Overview

1.1 What changed from v1

Entrio originally had Security operate check-in on behalf of every visitor. This version flips that: visitors self-serve at a shared device, and Security shifts from "operator" to "exception handler" — watching for alerts when something needs human judgment (a blocked visitor, a host restriction, an after-hours attempt).

This is a well-established industry pattern (self-service visitor kiosks are standard practice — Envoy, Greetly, Archie, Proxyclick, etc. all offer it), but every comparable product keeps staff available for exceptions rather than removing them entirely. Entrio follows the same hybrid model.

1.2 Goals


Let visitors check themselves in and out without requiring a staff member to operate the process
Preserve every existing safety control (blocklist, host restriction, working hours) by running them silently and automatically, rather than removing them
Work reliably regardless of which device is used at the front desk — tablet, laptop, desktop, or phone — without depending on a camera
Keep Security informed in real time when self-service hits an exception, so a human can step in
Simplify roles to three: Security, Host, Admin


1.3 Non-goals (this version)


QR code generation or scanning — explicitly removed
Fingerprint / biometric verification — deferred (hardware + regulatory complexity not justified yet)
Multi-facility support
Visitor accounts/login — visitors never authenticate as users; they are looked up/created as visitor records only



2. Roles & Permissions

Three roles only: Security, Host, Admin. (Supervisor and Super Admin from v1 are removed — Admin absorbs both sets of responsibilities.)

ActionSecurityAdminHostOperate the self-service device (fallback/manual entry)✅✅❌View live board / "Who's Inside Now"✅✅❌ (own visitors only)Receive self-service exception alerts (blocked/restricted/after-hours attempt)✅✅❌Flag a visitor for review✅✅❌Block / unblock a visitor❌✅❌Approve/deny working-hours override❌✅❌Edit working hours / blackout dates❌✅❌Manage kiosk/device credentials❌✅❌Pre-register a visitor❌✅✅Manage own host-visitor restrictions❌❌✅Receive arrival notifications❌❌✅Create/deactivate user accounts❌✅❌Run reports / export❌✅❌View audit logs❌✅❌

2.1 The kiosk/device "account"

The shared check-in device is not a human user and does not log in as one. It authenticates with a narrow, scoped device credential (a long random token), managed by Admin:

FieldNotesidInternal identifierlabele.g. "Main Lobby Device" — lets Admin tell devices apartapiTokenLong random secret the device sends with requestsisActiveAdmin can instantly revoke a single devicecreatedAt / lastUsedAtFor visibility into usage

This token grants access only to the self-service endpoints (search, check-in, check-out, photo upload) — never to admin, reporting, or user-management endpoints. If a device is lost or compromised, Admin revokes just that one credential.


3. The Self-Service Flow

3.1 Entry screen

"Welcome — Visitor Registration"
[ Check In ]      [ Check Out ]

3.2 Check-in flow

Step 1 — Visitor type
"Are you pre-registered, or is this a walk-in visit?"
→ [ I'm Pre-registered ] / [ Walk-in / New Visit ]

Step 2a — Pre-registered (no QR)
"Enter your code below" — a short numeric/alphanumeric code (the existing badge_code, repurposed here as an entry code rather than a scannable badge). Visitor types it on any keyboard/touchscreen — no camera dependency, works identically on phone, tablet, laptop, or desktop.
→ Looks up the expected visit by badge_code, pre-fills visitor/host/purpose, skips to Step 5.

Step 2b — Walk-in
"Let's find your details — enter your name or phone number"
→ Multiple matches found: show list (name + last-4 phone digits + last-visit photo thumbnail) for the visitor to confirm which record is theirs (solves the same-name disambiguation problem — see §6.1)
→ No match: proceed to Step 3 as a new visitor

Step 3 — Confirm or enter details
Returning visitor: "Is this you?" with pre-filled details to confirm.
New visitor: short form — full name, phone, email (optional).

Step 4 — Visit details
"Who are you here to see, and why?" — host search + purpose (free text or short list: Meeting, Delivery, Interview, Maintenance, Other).

(Silent step — no visitor-facing screen)
System automatically checks, in order:


Blocklist (visitors.isBlocked)
Host-visitor restriction (private, host-specific)
Working hours / blackout dates


If any check fails → jump to Step 8b. The visitor is never told which check failed or why — only that they need staff assistance. A real-time alert fires to Security/Admin with the actual reason, so staff already knows what's going on before the visitor reaches the desk.

If all checks pass → continue to Step 5.

Step 5 — Photo capture
"Let's take your photo" — camera viewfinder with a face-guide overlay, capture button.

Step 6 — Photo review
"How's this look?" — preview with [Retake] / [Looks good].

Step 7 — Consent (after photo, per product decision)
Site policy / safety terms shown, scrollable. Tap-to-agree checkbox ("I agree to the terms above") rather than a drawn signature pad for v1 — functionally equivalent to a click-wrap agreement, faster on touchscreens, and avoids drawn signatures providing false confidence as an identity check (they don't meaningfully verify identity; the photo + phone/name confirmation already does that job). A signature-pad widget may be added later as a presentation-layer upgrade without changing the underlying data model.

Step 8a — Success
"You're all set, [Visitor Name]! [Host Name] has been notified. Your code: ENT-XXXXXX. Please have a seat — they'll be right with you."
→ Visit status → checked_in. Host notified (push + in-app). Visitor appears on live board.

Step 8b — Redirect to staff (exception path)
"We're unable to complete your check-in right now. Please see the front desk for assistance."
→ No further detail shown to the visitor. Security/Admin already alerted with the real reason.

3.3 Check-out flow

Simpler than check-in — no gates apply on the way out.

"How would you like to check out?"
[ Enter name/phone ]      [ Enter your code ]
        ↓                          ↓
   Search → disambiguate    Look up by badge_code
   if multiple matches
        ↓                          ↓
        └────────────┬─────────────┘
                      ↓
        "Checking out [Name], visiting [Host],
         arrived [time]"
                      ↓
        [ Yes, check me out ]
                      ↓
        Check-out time logged, duration calculated
        Visit status → checked_out, removed from live board
        Audit log updated
                      ↓
        "Thanks for visiting! Have a great day."

No photo or re-verification needed at check-out — the visitor's identity and visit details already exist from check-in. If a visitor can't find their record, they're directed to staff, who retain a manual check-out action on the live board (already built) as a permanent fallback — self-service check-out is a convenience layer, never the only way to close out a visit.


4. Why QR codes are removed

The problem: the check-in device is explicitly not a dedicated kiosk stand — it may be a laptop, desktop, tablet, or phone. QR scanning assumes a forward-facing camera, positioned and angled for a visitor to hold something up to it. That assumption breaks down on:


A laptop webcam aimed at whoever's seated at it, not outward at a visitor
A desktop with no camera at all
A tablet lying flat rather than mounted upright


The decision: rather than building a feature that works inconsistently depending on hardware, pre-registered visitors authenticate with a typed code instead — universally reliable across any device with a keyboard or touchscreen, no camera dependency. The underlying badge_code field and lookup logic are unchanged from v1; only the delivery/input mechanism changes (typed instead of scanned).

This also simplifies delivery to the visitor: the code is communicated via email/SMS/whatever channel is used for pre-registration confirmation, as plain text — no QR image generation, no email attachment, no extra library dependency (jsQR/zxing-js are no longer needed anywhere in this product).


5. Data Model Changes from v1

5.1 Roles simplified

UserRole enum: security, host, admin only. supervisor and super_admin removed; any responsibilities they held now belong to admin.

5.2 New: Devices table

devices
  id            UUID (PK)
  label         VARCHAR        — e.g. "Main Lobby Device"
  apiToken      VARCHAR        — long random secret, hashed at rest
  isActive      BOOLEAN
  createdAt     TIMESTAMP
  lastUsedAt    TIMESTAMP

5.3 Visits table — consent fields added

visits
  ...(existing fields unchanged)...
  consentAcceptedAt   TIMESTAMP (nullable)
  consentVersion      VARCHAR (nullable)   — which version of the policy text was agreed to

No signatureUrl field in v1, since consent is a tap-to-agree checkbox, not a drawn signature. Add this field later only if a signature-pad widget is introduced.

5.4 badge_code — repurposed, not renamed

The existing badge_code field continues to serve the same role (a unique reference to a visit), now primarily entered by typing rather than scanned. No schema change required.

> **Implementation correction (v2 build):** `badge_code` does NOT still exist — it was dropped in the v1.1 migration `20260624110000_simplify_roles_remove_badge`. The v2 build therefore *re-added* the column as `visits.entry_code` (unique, format `ENT-XXXXXX`), generated at pre-registration and at walk-in self check-in. So this is a real (additive) schema change, not a no-op.

5.5 Removed


Any QR-generation or QR-scanning library dependency
SMS as a notification channel (per separate product decision — see §7)



6. Key Product Decisions & Reasoning

6.1 Same-name visitor disambiguation

Unchanged from v1: never match by name alone. Search returns all matches with last-4 phone digits and last-visit photo thumbnail; the visitor (now self-serving) confirms which record is theirs, same principle as the original security-operated flow, just self-administered.

6.2 Discretion preserved for blocklist & host restrictions

The visitor-facing message for any failed check is identical regardless of cause ("see the front desk for assistance") — this preserves the original design intent (a blocked or restricted visitor is never told why) while moving the decision point from a human operator's discretion to an automated, consistent system message. The real reason is still visible to staff via the real-time alert.

6.3 Hybrid model, not full automation

Per industry research, self-service is never deployed as a full replacement for staff — it handles the common case, with humans as the fallback for exceptions. Entrio follows this: Security's role shifts from operating check-in to monitoring an alerts feed and handling redirected visitors, not disappearing from the process.

6.4 Consent over signature

A tap-to-agree checkbox is treated as legally equivalent to a click-wrap agreement (standard and enforceable in most jurisdictions) and is faster/more reliable on a touchscreen than a finger-drawn signature, which provides weak identity assurance regardless. Photo + phone/name confirmation remains the actual identity-verification layer.

6.5 Fingerprint — deferred, not rejected

Biometric verification was considered and deferred: it requires dedicated scanner hardware (a touchscreen alone cannot read fingerprints), and biometric data carries materially stricter legal/compliance obligations (e.g. under Nigeria's NDPR) than name/phone/photo data. Worth revisiting only if a specific high-security deployment requires it.


7. Open Questions Carried Forward


Notification channels — SMS (Twilio) has been deprioritized in favor of in-app + Web Push, to avoid per-message cost. Web Push requires service worker registration, VAPID keys, and a stored push-subscription per host — larger lift than SMS, but no per-message cost. Final decision and implementation still pending.
Device provisioning UX — how does Admin actually set up a new physical device with its credential? (e.g. a setup screen that displays the token once, like a "pairing code.")
Idle/timeout behavior — after a failed check (Step 8b) or a successful one (Step 8a), how long does the screen stay before resetting for the next visitor?
Auto check-out — should overstay visits ever auto-check-out, or does check-out always require explicit action (self-service or staff)?
Early check-in restriction — should a visitor pre-registered for 3pm be blocked from checking in at 9am? (Noted as a feature in comparable products, not yet decided for Entrio.)
Custom screening questions — comparable products support configurable questionnaires at check-in (health screening, NDAs beyond the standard consent). Not in scope for this version, worth considering for v3.