# Follow-ups

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Shared follow-up form | `shared/followup.js` → `App.Followup.mountForm` | The ONE add-follow-up form (decision #7). Used in the add modal, the drawer composer and the "next follow-up" step. |
| Add follow-up modal | `App.Followup.openAdd(personId)` | From list "+ Follow-up", drawer quick action, NEXT STEP "Add follow-up", after Re-open. |
| Log outcome modal | `App.Followup.openOutcome(followUpId)` | From NEXT STEP and Upcoming items in the timeline. |
| Cancel follow-up modal | `App.Followup.cancel(followUpId)` | From Upcoming items. Cancelled, never deleted. |
| Mark as Lost modal | `App.Lead.markLost(personId)` | From drawer "More", or the "Mark as Lost?" step of Log outcome. |
| Re-open modal | `App.Lead.reopen(personId)` | From the drawer on a Lost lead. |
| Assign / change owner modal | `App.Lead.assign(personId)` | From list "Assign" and drawer owner. |
| Follow-ups list screen | — | Not built yet (later screen). |

## 2. Flow
- **Log outcome**: outcome chips → Save →
  - "Not interested" (open lead) → **"Mark as Lost?"** → *Yes* → reason → Lost (open follow-ups **Closed by system · Lead lost**, owners notified; decision #37) · *No, keep as lead* → next follow-up step.
  - Any other outcome → **Next follow-up** step (required; no skip). If another open follow-up already exists, it is shown with "Done".
  - Lead lost or person is a client → no next step.
- **Re-open** → confirm → stage back, reason cleared, timeline "Re-opened by …" → **Set next follow-up** modal ("Later" closes it; NEXT STEP then shows red).
- Follow-ups are assigned to the lead owner (`ownerUserId`). Changing the owner moves open follow-ups too and adds an `ownerHistory` entry.
- **Statuses** (decision #37): Open · Done (staff did it) · Cancelled (staff, optional reason) · Closed by system (Client converted / Lead lost / Client transferred). The system never marks Done. Closed-by-system items are struck through in the timeline ("Call on Mon 9 Nov closed by system · lead lost") and each owner gets a notification.

## 3. Field table

### Add follow-up (shared form)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Type | chips | Yes | No | Call (next step: same type as the finished one) | FIXED code list (#119), not a master: Call (CALL), WhatsApp (WHATSAPP), Visit planned (VISIT_PLANNED), Free trial planned (FREE_TRIAL_PLANNED), Payment expected (PAYMENT_EXPECTED) |
| When (`dueDate`) | chips | Yes | No | Tomorrow | Tomorrow, In 3 days, In 1 week, Custom (date picker, not in the past). Stored as "YYYY-MM-DD". |
| Time (`dueTime`) | time | No | No | 11:00 | Clear it for "any time" (stored null). Status is by date only (decision #24). |
| Note | text area | **Yes** (#127) | No | — | "Add a note: what is this follow-up about?" |
| Assigned to (`ownerUserId`) | staff (shown, not editable) | — | — | Lead owner | |

### Log outcome
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Outcome | chips | Yes | No | none | Interested, No answer, Call later, Will visit, Not interested |
| Note | text area | **Yes** (#127) | No | — | Added to the follow-up's note. "Add a note: what did they say?" |

### Cancel follow-up
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Reason | text | No | No | — | Shown struck through in the timeline. |

### Mark as Lost
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Reason | chips | Yes | No | none ("Not interested" when coming from Log outcome) | Lost reasons list |
| Other reason | text | When reason = Other | No | — | Stored as "Other: <text>" |

## 4. States
- **Validation**: "Choose an outcome.", "Pick a date.", "The date can't be in the past.", "Choose a reason.", "Please describe the reason."
- **Success**: toasts ("Outcome saved · Interested", "Follow-up set for … · <date>", "… marked as Lost").
- **Blocked**: add follow-up on a Lost lead → toast "Re-open the lead first to add a follow-up". On an Unassigned lead (#119) → every "Add follow-up" button is disabled with the reason "Take or assign this lead first".
- **Closed by system** notice (#119): to the lead's owner AND the follow-up's assignee if different.

## Ownership flows (c4, decisions #97–#100) — all in shared/followup.js

### Screens / modals
- **Add follow-up → "Assigned to"** (#97): who does the follow-up. Shown only with grid row `leads.assignFollowUp` on a lead I OWN (SE Own; SM / CM / RM Branch; CEO All). Otherwise the hint "Assigned to <owner> (lead owner)".
- **Owner change dialog** (`App.Owner.change(ids, newOwnerId)`, #99): ONE flow for single assign / reassign (profile Owner "Change" / "Assign", More › Change owner), bulk "Change owner" on Leads, a client's owner change, and re-opening someone else's lost lead.
- **Move to another branch** (`App.Lead.move`, #98): profile More menu.
- **Pick the follow-up person** (`App.Lead.pickPerson`, #98): for a "Transferred in" lead (profile box, Today row).
- **Take this lead** (`App.Lead.take`, #100): no modal; Leads owner cell, Today Unassigned row, profile Owner row.

### Field table
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Assigned to (`assignedToUserId`) | staff dropdown (App.enhanceSelect) | Yes (when shown) | No | Lead owner | Staff of ANY branch whose role has `leads.view` (SE, SM, CM, RM, CEO by default). Label "Name · Role · Branch". The assignee sees the full lead while the follow-up is Open; the owner never changes. Timeline "Priya set a follow-up for Arjun Nair · Call". |
| Owner dialog: Open follow-ups and tasks (N) | radio, 3 choices | Yes | — | Move to the new owner | (1) Move: same dates, now the new owner's. (2) Close them: "Closed by system · Owner changed" + ONE new follow-up (Call) for the new owner. (3) Keep with the old owner: they keep them and still see the lead while open. N counts ONLY open follow-ups / tasks assigned to the OLD owner; follow-ups other staff hold stay with them. |
| New follow-up due (choice 2) | date | Yes | — | Earliest open due of the old owner's items | Editable for one lead. Bulk: each lead gets its own earliest due (not editable). |
| Owner dialog with N = 0 | plain confirm | — | — | — | "No open follow-ups or tasks to hand over." Assigning an unassigned lead / re-open with nothing open: no dialog at all. |
| Move: New branch | dropdown | Yes | — | — | Other branches only. |
| Move: Remark | text | Yes | No | — | "Add a remark: why is the lead moving?" Timeline "Moved Sec 31 → Golf Course by Priya · <remark>". |
| Move: Follow-up person | dropdown (new branch SEs) | Yes (when shown) | No | — | Only with `leads.movePickPerson` and an owned lead. That SE gets a follow-up now (Call, "Transferred in · first call"). |
| Move: Follow-up due | date | Yes (when shown) | — | Tomorrow | Not in the past. |
| Pick person: Sales Executive | dropdown (lead's branch SEs) | Yes | — | — | Needs `leads.assign` Branch or All. Clears `transferredIn`, creates the follow-up. |
| Pick person: Follow-up due | date | Yes | — | Tomorrow | |

### Flow rules
- Move: branch changes, OWNER STAYS, owner's open follow-ups stay. Without the pick row the lead gets `transferredIn {from, by, at}` and badge "Transferred in"; the new branch's CM (RM / CEO by scope) sees it in Leads (filter) and Today. An unassigned lead moved stays unassigned (no flag).
- Take: unassigned (not lost) lead + `leads.take` scope → taker = owner, branch unchanged, timeline "Taken by Arjun".
- Re-open someone else's lost lead (`leads.reopen` scope): you become owner; dialog if the old owner has open items; then "Set next follow-up".
- Close reasons added: "Owner changed", "Released (inactive)" (tasks too).
- History, notes, timeline and trial approvals never move.

### States
- Validation errors inline (red text, field outlined). Toasts on success ("Kiran Joshi moved to Golf Course", "You own Yash Arora now").

- Q32 (#103): owner dialog choice 2 — if the earliest open due date has already passed, the new follow-up is due TODAY (bulk too).

- Transferred-in pick (#109): "Make them owner" (ticked by default) runs the owner change rules (#99), event OwnerChanged · TransferPick. Person list = branch staff with `leads.own`.

## 5. Status
Ready for review (shared components). Follow-ups list screen: Draft.
