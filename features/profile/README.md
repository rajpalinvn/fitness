# Profile drawer

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Profile drawer | `shared/profile.js` | One profile per person (Lead or Client). Opens from any page with `App.openProfile(id, { list })`. |
| Preview page | `index.html` + `preview.js` | One card per dummy person to review every edge case. `?debug` adds loading / error states. |
| Follow-up, outcome, cancel, lost, re-open, assign modals | `shared/followup.js` | Shared flows. See `features/followups/README.md`. |
| Key fob modal | `shared/profile.js` | Return / Lost / Replace / Assign from stock. |

## 2. Flow
- Leads list row click, search result, preview card, or a link with #lead-<name> / #client-<name> (decision #33) → drawer. The URL hash follows the open profile and clears on close. ‹ › step through the list it was opened from ("2 of 8").
- **Left column** (fixed, 300px; 260px on tablet):
  - Identity: initials avatar, name, mobile + copy, branch · created (or "Client since").
  - Badges: Lead = Lead, stage, temperature, source (or "Meta"), Re-opened. Client = Client + membership status (Active / Renewal due / Expired) + source; no stage or temperature (decision #31).
  - Quick actions: Call (toast + timeline "called (no outcome logged)"), WhatsApp (opens composer in WhatsApp mode), Email (disabled "No email yet"), Follow-up (disabled on Lost: "Re-open the lead first").
  - NEXT STEP box → "Log outcome" / "Add follow-up".
  - Owner (Change / Assign), source, campaign, external ID, last activity.
  - Bottom: open lead → **Convert to Client** (the drawer switches to wide **Sell mode**, see `features/conversion/README.md`) + **More** (Mark as lost, Change owner). Lost → **Re-open lead**. Client → none.
- **Tabs**: Lead = Timeline · Tasks · Details · Docs. Client adds **Membership**. Counts show on Tasks (open) and Docs.
- **Timeline**: "Open follow-ups" (incl. overdue) pinned on top (Log outcome / Cancel), then history grouped by day, newest first. Filter chips: All, Follow-ups, Notes, WhatsApp, Milestones. Cancelled and "Closed by system" follow-ups are struck through (decision #37).
- **Composer** (Timeline tab only): Note | Follow-up | WhatsApp. Follow-up mode is the shared form; disabled on Lost leads.
- Membership tab: one section **"Corporate entry: FF ID & key fob"** with FF ID (or "FF ID pending" + Add FF ID) and Key fob (or "Key fob pending" + Assign from stock), plus fob stock. NEXT STEP groups the two pending items under the same label (decision #67).
- Esc / outside click / X close. Esc closes the top layer first (menu → modal → drawer).
- **Work modes** (decision #64): `App.DrawerMode.open(personId, { key, title, onExit })` turns the drawer into a wide mode (the larger of the drawer width setting and 80%; tablet 92%) with header "<Name> › <title>" and **Back**. The profile is hidden, not closed; Back, Esc or outside click return to it. Used by Convert to Client; Renewal, Upgrade and Transfer will reuse it.
- **Pending items** (decision #62): NEXT STEP lists "FF ID pending", "Key fob pending" and "Pending issue · <item>" with Add FF ID / Assign fob / Issue item (same modals as Today: `App.addFfId`, `App.assignFob`, `App.issueItem`). The links only show for staff allowed to do them.

## 3. Field table

### NEXT STEP box
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Lead status | derived | — | — | — | Green "Next: <date, time>"; amber "Due today · <time>"; red "Overdue since <date>" or "No follow-up set" (decision #24). |
| Client status | derived | — | — | — | Green "Membership active · N days left" (> 15); amber "Renewal due soon" (≤ 15); red "Membership expired on <date>" (decision #27). Shows the next follow-up too, if any. |
| Pending items | derived | — | — | — | Paid membership: "FF ID pending" (→ Add FF ID modal) and "Key fob pending" (→ shared fob modal), separate badges until filled (decision #40). Any membership: "Pending issue · <item>" for free items not given yet (→ Issue item; Waive for Sales Manager and above). |
| Lost | derived | — | — | — | Grey "Lost · <reason>" + "Re-open the lead to follow up again." |

### Details tab (edit mode)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Name | text | Yes | No | — | |
| Country code + Mobile | select + tel | Yes | Yes, company-wide | +91 | 10 digits. Duplicate: same branch "Already exists: <name>" + Open profile; other branch "Already exists in <branch> · Owner: <first name>" + Request access (decision #19). |
| Email | email | No | Yes, company-wide | — | Format checked. |
| Gender | select | No | No | Not set yet | Female / Male / Other |
| Birth date | date | No | No | — | |
| FF ID | text | No | Yes, company-wide | — | ID from the other software. |
| Source | select | Yes | No | — | Lead sources list. |
| Temperature | select | Yes | No | Warm | Hot / Warm / Cold (fixed). |
| Stage | select | Yes | No | New | Configurable stages only; hidden for Lost and Clients (Converted/Lost set by actions). |
| Inquiry type | select | No | No | Not set yet | Call / Walk-in |
| Campaign | text | No | No | — | |
| Remarks | text area | No | No | — | |
| Owner, Branch, External ID, Created, Last activity | read-only | — | — | — | Owner changes via Change owner. |
| Client no, Home branch, Joined, Key fob, Photo | read-only (clients) | — | Client no / fob unique | — | |

Saving adds "<name> updated <fields>" to the timeline.

### Docs tab
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Document type | select | Yes | No | ID proof | ID proof, Waiver/consent form, Medical form, Photo, Other (decision #28). |
| File | file (placeholder) | Yes | No | — | Mockup adds "<type> (placeholder).pdf". |

### Membership tab (clients)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Package, Sale type, Start, End, Price, Discount + reason, Final price, Sales rep (`salesRepUserId`), Client no | read-only | — | — | — | Dates show the year. Price never editable (decision #14). End = start + days − 1 (start day included, #41). |
| FF ID | read-only | Paid only | Yes | — | "FF ID pending" + Add when missing on a Paid membership. |
| Days left | derived | — | — | — | Same thresholds as NEXT STEP. |
| Key fob | from branch stock | Paid only | Yes | — | Trial Paid: "No key fob · trial memberships don't get one". Actions Return / Lost / Replace; "Key fob pending" + Assign from stock when missing (decision #30, #40). |

## 4. States
- **Loading**: skeleton in both columns (~300 ms on open).
- **Error**: "Couldn't load this profile" + Retry (preview page `?debug`).
- **Empty**: "No history yet. Add a note below.", "No tasks yet.", "No documents yet.", "Nothing here yet." for an empty timeline filter.
- **Success**: toasts after every save; NEXT STEP, list row, pipeline cards and sidebar badges update together.

### Dummy edge cases (preview page)
| Person | Shows |
|---|---|
| Aarav Patel | Red "Overdue since …"; history: Interested call linked to next call, note, WhatsApp |
| Sneha Reddy | Red "No follow-up set"; cancelled follow-up struck through; Email disabled |
| Rajesh Kumar | Lost · Price high; Re-open; follow-up disabled; notes allowed |
| Kavya Menon | Re-opened badge; Lost → Re-opened history; amber Due today |
| Ishaan Singh | Trial stage, free trial milestone, stays a Lead; green next visit |
| Ananya Desai | Client, Trial Paid 7 Days, amber "Renewal due soon", no key fob, no pending items |
| Vivaan Joshi | Client, Annual Membership, green, key fob with Return / Lost / Replace, 1 doc |
| Fatima Shaikh | Meta badge, external ID, Unassigned + Assign, red no follow-up |
| Aditya Bose | Amber "Due today" |
| Nisha Agarwal, Simran Kaur | Green "Scheduled" |

## 5. Status
Ready for review
