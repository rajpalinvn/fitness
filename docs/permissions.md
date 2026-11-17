# Permission keys (decisions #95, #96, #102)

One list, used by the Roles & permissions screen (`shared/data.js` → `DUMMY.permissionDefs`) and expected by the API.
Keys are stable dotted strings; the grid stores role × key → value.

- **Scope** cells: `None` / `Own` / `Branch` / `All`. Own = leads I own + leads where I have an open follow-up (#97).
  Branch = the staff's branch (all their branches for a multi-branch role). All = every branch of the tenant.
- **Tick** cells: Yes / No. **Number** cells: whole number 0–100 (%).
- **Roles** (8 tenant roles, #102): CEO, RM (Regional Manager), CM (Club Manager), SM (Sales Manager), SE (Sales Executive),
  MXM, TR (Trainer), FIN (Finance). SuperAdmin is a platform role (creates tenants + the first CEO account) and has no column.
- **Locked**: CEO has every permission (whole column locked, top tenant role). `settings.rolesPermissions` is locked for every
  role (CEO only). `leads.view` can't go below Own for CEO / RM / CM / SM / SE ("an owner can always see and log follow-ups on
  their own leads"). Validation, not a lock: at least one role besides CEO keeps `leads.assign`.
- Trainer, MXM and Finance have no lead / sales access by default (PT and payment rows come later); their cells are editable.

| Key | Label | Module | Values | CEO | RM | CM | SM | SE | MXM | TR | FIN | Locked |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `leads.view` | View leads | Leads | scope | All | Branch | Branch | Branch | Own | None | None | None | CEO; floor Own for CEO–SE |
| `leads.viewUnassigned` | View unassigned leads (the "pool") | Leads | scope | All | Branch | Branch | None | None | None | None | None | CEO |
| `leads.take` | Take an unassigned lead ("Take this lead") | Leads | scope | All | Branch | Branch | None | None | None | None | None | CEO |
| `leads.viewLost` | View lost leads | Leads | scope | All | Branch | Branch | Branch | Own | None | None | None | CEO |
| `leads.create` | Create lead | Leads | tick | Yes | Yes | Yes | Yes | Yes | No | No | No | CEO |
| `leads.assign` | Assign / reassign / change owner (leads and clients) | Leads | scope | All | Branch | Branch | Branch | None | None | None | None | CEO; at least one other role keeps it |
| `leads.assignFollowUp` | Assign a follow-up to another staff (any branch) | Leads | scope | All | Branch | Branch | Branch | Own | None | None | None | CEO |
| `leads.markLost` | Mark lost | Leads | scope | All | Branch | Branch | Branch | Own | None | None | None | CEO |
| `leads.reopen` | Re-open lost lead | Leads | scope | All | Branch | Branch | Branch | Own | None | None | None | CEO |
| `leads.move` | Move lead to another branch | Leads | scope | All | Branch | Branch | Branch | Own | None | None | None | CEO |
| `leads.movePickPerson` | While moving, pick the follow-up person in the new branch directly | Leads | scope | All | Branch | Branch | None | None | None | None | None | CEO |
| `trials.book` | Book trial | Trials | scope | All | Branch | Branch | Branch | Own | None | None | None | CEO |
| `trials.editLimits` | Edit free-trial limit settings (per person, per branch) | Trials | tick | Yes | Yes | Yes | No | No | No | No | No | CEO |
| `trials.approve` | Can be picked as trial approver (approve / reject) | Trials | scope | All | Branch | Branch | Branch | None | None | None | None | CEO |
| `trials.adjustAfterEnd` | Paid trial adjust after it ended (7-day buffer) | Trials | scope | All | None | Branch | None | None | None | None | None | CEO |
| `sales.convert` | Convert to Client / Sell | Sales | scope | All | Branch | Branch | Branch | Own | None | None | None | CEO |
| `sales.discountMax` | Max discount % (#77) | Sales | number | 100 | 50 | 30 | 20 | 10 | 0 | 0 | 0 | CEO (100 = placeholder, Q31) |
| `clients.view` | View clients | Clients | scope | All | Branch | Branch | Branch | Branch | None | None | None | CEO |
| `clients.collectPayment` | Collect payment | Clients | scope | All | Branch | Branch | Branch | Branch | None | None | None | CEO |
| `clients.issueItems` | Issue FF ID / key fob / item on a client (pending items: add FF ID, assign fob, issue item) | Clients | scope | All | Branch | Branch | Branch | Branch | None | None | None | CEO |
| `clients.waive` | Waive pending item (#67) | Clients | scope | All | Branch | Branch | Branch | None | None | None | None | CEO |
| `settings.packages` | Packages | Settings | tick | Yes | No | No | No | No | No | No | No | CEO |
| `settings.viewMasters` | View Packages / Items / Tax / Sales rules (read-only) | Settings | scope | All | Branch | Branch | Branch | None | None | None | None | CEO |
| `settings.stock` | Accessory / key fob stock (#56) | Settings | scope | All | Branch | Branch | None | None | None | None | None | CEO |
| `settings.editInactivity` | Edit inactivity release days | Settings | tick | Yes | Yes | Yes | No | No | No | No | No | CEO |
| `settings.rolesPermissions` | Roles & permissions | Settings | tick | Yes | No | No | No | No | No | No | No | every cell (CEO only) |

Note on `trials.approve`: this is who CAN approve / reject a pending trial (CEO = All, locked). The "Approval asked from"
dropdown at booking (L1b, #94) is a separate rule: it lists only the SM, CM and RM of the lead's branch who have `trials.approve`.
The CEO never appears in that dropdown but can approve / reject any pending trial (e.g. from a pending approvals list).

## Settings values (numbers, not per role)
| Key | Label | Default | Range | Changed by |
|---|---|---|---|---|
| `freeTrialsPerPerson` | Free trials per person (all branches) | 2 | 0–10, whole | grid row `trials.editLimits` |
| `freeTrialsPerBranch` | Free trials per branch | 1 | 0–10, ≤ per person | grid row `trials.editLimits` |
| `paidTrialAdjustBufferDays` | Paid trial adjust buffer after it ends | 7 | 0–30 days | CEO |
| `inactivityReleaseDays` | Release inactive leads after | 7 | 1–90 days | grid row `settings.editInactivity` |
| `releaseWarnDaysBefore` | Warn the owner before release | 1 | 0–89, < inactivity days | grid row `settings.editInactivity` |
| `newLeadAssignment` | New-lead assignment | Manual | Manual (Round-robin later, Q10) | CEO |

Every saved change (permissions, settings values, trainer types) goes to the audit log: who, when, tab, what, old → new.

## How the ownership rows are used (c4, #97–#100)
- `leads.assign`: Change / Assign owner in the profile, bulk "Change owner" on Leads, a client's owner, and picking the
  follow-up person for a "Transferred in" lead (needs Branch or All). One dialog: `App.Owner.change` (#99).
- `leads.assignFollowUp`: the "Assigned to" field in the follow-up form. Here "Own" = leads I OWN only (not leads where I am
  just the assignee).
- `leads.move` / `leads.movePickPerson`: "Move to another branch" in the profile More menu; with the pick row the dialog also
  asks for the new branch's Sales Executive + due date.
- `leads.viewUnassigned` / `leads.take`: Unassigned leads (reason New / Released) in Leads and Today; "Take this lead".
- `leads.reopen`: re-opening someone else's lost lead makes you the owner (owner dialog if anything is open).
