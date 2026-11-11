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
| Type | chips | Yes | No | Call (next step: same type as the finished one) | Call, WhatsApp, Visit planned, Free trial planned, Payment expected |
| When (`dueDate`) | chips | Yes | No | Tomorrow | Tomorrow, In 3 days, In 1 week, Custom (date picker, not in the past). Stored as "YYYY-MM-DD". |
| Time (`dueTime`) | time | No | No | 11:00 | Clear it for "any time" (stored null). Status is by date only (decision #24). |
| Note | text area | No | No | — | |
| Assigned to (`ownerUserId`) | staff (shown, not editable) | — | — | Lead owner | |

### Log outcome
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Outcome | chips | Yes | No | none | Interested, No answer, Call later, Will visit, Not interested |
| Note | text area | No | No | — | Added to the follow-up's note. |

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
- **Blocked**: add follow-up on a Lost lead → toast "Re-open the lead first to add a follow-up".

## 5. Status
Ready for review (shared components). Follow-ups list screen: Draft.
