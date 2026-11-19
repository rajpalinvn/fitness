# Lead lifecycle

Spec for the mockup team and the build team (.NET Core API + React). It covers how a lead moves through stages, who owns it, how changes are recorded, and who gets told. Decisions #104–#109; grid rows in docs/permissions.md.

## 1. Two dimensions
A lead has two independent states:

| Dimension | Values | Changed by |
|---|---|---|
| **Stage** | New, Contacted, Trial (automatic while a trial runs), Negotiation, Lost. **Converted** = the person becomes a Client (same record, badge Client). | Staff (New / Contacted / Negotiation), Book trial (Trial), Mark lost / Re-open, Convert. |
| **Ownership** | An owner (a user with `leads.own`), or **Unassigned** + a reason: `New`, `Released`. More reasons may be added later (e.g. "Released by owner"). | Assign / change owner (#99), Take (#100), Release (#100), Re-open (L22), transfer pick (#109), cross-branch takeover (#106). |

- Stage and ownership change independently: a Lost lead keeps its owner, and an Unassigned lead can be in any open stage.
- Clients will use the same ownership model for renewals later (owner = who renews them, the same reasons).
- The ownership clock starts when the current owner got the lead (assigned / taken / changed / re-opened / cross-branch takeover). This clock drives inactivity release (#100).

## 2. Events (rule)
**Every state change is an EVENT**, and the timeline is built from events in human language ("Priya (Sec 31) added a follow-up for themselves · walked in").

```
Event { id, personId, type, from, to, reason, remark, byUserId, at, branchId }
```
- `byUserId` = null for the system (release job, auto-close).
- `branchId` = the lead's branch at the time of the event (after the change for moves).
- Events are never edited or deleted.

| Type | from → to | reason (examples) | Timeline example |
|---|---|---|---|
| Created | — → New | source | "Lead created by Priya · Walk-in" |
| StageChanged | stage → stage | — | "Stage New → Contacted" |
| OwnerChanged | user / null → user / null | Assigned, Taken, Released, Reopened, TransferPick, CrossBranch, BulkChange | "Owner changed from Arjun to Priya by Sunita" |
| BranchMoved | branch → branch | Moved (remark), CrossBranch | "Moved Sec 65 → Sec 31 by Arjun · lives near Sec 31" |
| FollowUpAssigned | — → user | CrossBranch, TransferPick, Owner | "Follow-up person: Priya (Sec 31) · picked by Sunita" |
| FollowUpClosed | user → — | Done, Cancelled, System + remark "<why>" | "Call on Mon closed by system · taken over by Sec 31" |
| TrialBooked | — → trial | free / paid | "Free membership trial booked · 3 days" |
| TrialApproval | Pending → Approved / Rejected | — | "Trial approved by Karan" |
| Converted | stage → Client | package | "Converted to Client · Monthly Membership" |
| MarkedLost | stage → Lost | lost reason | "Marked lost · Price high" |
| Reopened | Lost → stage | — | "Re-opened by Priya" |
| SalesRepChanged | default rep → rep | — | "Sales rep changed from Karan to Priya by Karan" |
| QuoteRequested | — → asked user | note | "PT quote requested from Meera by Rahul · wants weight-loss PT" |
| QuoteCreated / QuoteUsed / QuoteExpired / QuoteCancelled | Open → Used / Expired / Cancelled | — | "PT quote by Sunita · Quarterly + 12 PT · trainer Deepak · ₹27,800 · valid till 25 Nov" |
| SellHereStarted / SellHereCancelled | — | remark | "Sell here started by Priya (Sec 31) · joins today" / "Sell here cancelled · nothing changed" |

**Mockup:** `App.Event.log(personId, {...})` writes the event into `DUMMY.events` and the human line into the timeline.
- New actions write events: owner change, take, release, branch move, transfer pick, cross-branch follow-up / takeover, Sell here, sales rep change, convert.
- The old dummy timelines stay as text (they were written before this rule).
- The build team writes events for every type in the table.

## 3. Assignment strategy (setting `newLeadAssignment`)
| Option | Status |
|---|---|
| Manual | **Now.** The creator picks the owner (default: themselves). |
| Round-robin | **Later.** Among users with `leads.own` in the branch. |
| Round-robin among on-shift staff | **Later.** Needs shift data (who is in today). |

## 4. Cross-branch work (#105, #106)
- **Finding the lead:** search by the FULL mobile number across all branches (like the duplicate check). This gives a read-only row. Other branches' leads never show in the normal list.
- **Read-only profile:** shows name, full mobile, owner ("Owner: Arjun Nair (Sec 65)"), branch, stage, source and timeline. No actions.
- **`leads.crossBranchFollowUp`:** "Add a follow-up for myself". It uses #97: an open follow-up assigned to me makes the lead "Own" for me (full profile and my role's actions: Book trial, Convert).
- **`sales.sellCrossBranch`:** "Sell here" = add my follow-up (remark required) and open Convert. It needs `leads.crossBranchFollowUp`.
- **Setting `crossBranchOwnerChange`** = On sale (default) / On first follow-up / Never.
  - On the trigger, four things happen, each with an event:
    - the lead moves to the staff member's branch;
    - the owner becomes that staff member;
    - the old owner's open follow-ups and tasks close as "Closed by system · Taken over by <branch>";
    - the inactivity clock restarts.
  - "On first follow-up" fires on the cross-branch follow-up AND on Sell here (it starts with a follow-up).
  - "Never": owner and branch stay; the seller is only the sales rep.
- **Cancelling Sell here** changes nothing; the only record is a SellHereCancelled event. The follow-up that was added stays.

## 5. Sales rep (#107)
- The default is the person creating the sale, everywhere (including Premium PT). The trainer picked in a PT quote is separate and is not the rep.
- The dropdown lists users with `sales.rep` in ANY branch.
- Every change from the default writes a SalesRepChanged event. There is no separate permission for changing the rep.

## 6. Notification rules (#108)
- Settings › Roles & permissions › **Notification rules**: a table of events × roles (RM, CM, SM; "Duplicate payment reference" may be ticked for any role, #117) with a checkbox per cell ("—" where a role can't be ticked). Only the CEO edits it, and each change is audited.

| Event | Default |
|---|---|
| Lead transferred in | CM |
| Lead released (inactive) | CM |
| Cross-branch work on a lead (follow-up / sale) | CM |
| Duplicate payment reference (#117; also drives the Today section "Flagged payments") | CEO |

- A ticked role is notified only for its own branch(es), i.e. the lead's branch.
- **Directly involved people are ALWAYS notified (locked):** the owner, the old owner and the approver.
- Notifications go to the bell (`toUserIds`). More events will come later (PT quote requested, Client assigned to you).

## 7. Who can do what (#104)
- Logic never checks a role name; it checks grid rows only:
  - Owner lists, follow-up person, release and pick lists → `leads.own`.
  - Sales rep list → `sales.rep`.
  - Trial approver list → `trials.approve` at **Branch** scope in the lead's branch. All-scope users (e.g. CEO) are never listed, but they can approve any trial.
- A trainer is a user with a trainer type, not a role name.
- We add new roles as needed (Marketing and HR added, #114); tenants don't create roles.

**Debt (demo-only role-name checks, left as they are):**
- The View-as demo user map (`roleDemoUser`).
- "CEO only" settings values and the Notification rules editor check `App.state.role === "CEO"`.
The build team maps these to grid rows or to the top tenant role.

## 7b. PT quotes (#110–#113)
- SE sells membership only. PT / Premium PT: SE "Request PT quote" → CM / MXM "Create PT quote" (trainer, price, discount within the creator's limit, valid N days) → SE bills it locked.
- **Request = Own rule (like #97):** an open request makes the person visible to the asked person, an Open quote to its creator, even with `leads.view` = None, but only view + quote actions. Access ends when the request closes (quote created) and when the quote is Used / Expired / Cancelled.
- Leads only for now (Premium PT, #89); the data model is person-agnostic for client PT quotes later (Renewals).

## 8. Later
Each later item fits on an existing mechanism, so nothing needs a rewrite.

| Later | Fits on |
|---|---|
| Round-robin, and round-robin among on-shift staff (shift data) | setting `newLeadAssignment` + grid row `leads.own` + event OwnerChanged (reason Assigned) |
| The old owner keeps seeing released leads | setting (e.g. "Old owner sees released leads: N days") + scope check |
| Lost leads go to the pool (Unassigned) | setting + event OwnerChanged (reason e.g. LostToPool) + Unassigned reason |
| SMS / WhatsApp channels for notifications | notification rule (a channel column per event) |
| CEO pending-work counts (per staff / branch) | events (counts by type / user) + grid row |
| Unassigned reason "Released by owner" | Unassigned reason list + event OwnerChanged (reason ReleasedByOwner) |
| Clients' ownership for renewals | the same ownership model + events on the client |
| Client PT quotes (PT only, client Sell mode) | the same quote model (personId) + events + notification rule "PT quote requested" |
