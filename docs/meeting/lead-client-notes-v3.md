# GYM-OS · Lead & Client — notes v3 (16 Nov 2026)

**Big change in v3:** "who can do what" is no longer a question. It goes into a **Roles & permissions** settings grid with defaults. Only "what happens" questions (rules) are left.

---

## 1. Locked rules

### Lead vs Client
- **Client = bought a Membership or Premium PT.** Free / paid trial = Lead.
- **4 package categories:** Membership, PT, **Premium PT**, Add-on.
- Trials give nothing extra: no accessories, no free items, no FF ID, no key fob, **no discount**.
- Paid trial is paid in full, at once.
- Lead has two buttons: **Book trial** (trial packages only) and **Convert to Client** (Membership / Premium PT only; PT disabled).
- Convert to Client: **FF ID mandatory**; key fob can be Pending; free items follow #67.
- Membership = access to **all branches**. PT = home branch only (other branch needs a transfer).

### Premium PT
- One package = membership + PT. Fields: membership days, PT sessions, price, **reference membership price** (required).
- At sale it **splits into 2 lines**: membership line (= reference price) + PT line (= rest). Client status, renewal, session unlock and incentives reuse the existing rules.
- Incentive split (membership part to sales person or excluded) is set in the **incentive scheme**, not on the package.
- **No trial** for Premium PT.
- "Premium" membership sub-type label and the dummy "Annual + PT Premium Combo" package are removed.

### Trial
- Trial stage is **automatic** (Book trial). Stage dropdown: New, Contacted, Negotiation.
- Lead = membership trials only. Active client = PT trials (package checkbox "Requires an active membership"). Expired client = no trial. Lost lead = "Re-open the lead first".
- Free trial **limits** are settings (default 2 per person, 1 per branch). Paid trials unlimited, count shown.
- Trial ends: stage stays Trial, status **"Trial ended"**, follow-up for the owner.
- Convert during a running paid trial: adjust checkbox **ticked and locked**; membership start = trial start date (**system-set**; staff can never back-date, #41).

### Ownership
- **One staff = one role. Roles are fixed** (8 tenant roles: SE, SM, CM, RM, CEO, Trainer, MXM, Finance). SuperAdmin is a **platform** role (creates tenants + the first CEO account), not a tenant role (#102).
- One owner per lead, or Unassigned. **No pool for now.**
- Each branch has a Region.
- New leads from Meta / Excel: Unassigned, manual assign (round-robin later).

---

## 2a. Roles (fixed)

| Key | Name | Short | Branches | Reports to |
|---|---|---|---|---|
| CEO | CEO | CEO | Multi | — (top role in the tenant) |
| REGIONAL_MANAGER | Regional Manager | RM | Multi | CEO |
| CLUB_MANAGER | Club Manager | CM | Single | RM |
| SALES_MANAGER | Sales Manager | SM | Single | CM |
| SALES_EXECUTIVE | Sales Executive | SE | Single | SM |
| MXM | MXM (fitness manager) | MXM | Single | CM |
| TRAINER | Trainer | TR | Single | MXM |
| FINANCE | Finance | FIN | Single | CM |

- **Platform role (#102):** SUPER_ADMIN (SA) is not a tenant role. It creates tenants and the tenant's first CEO account, has no tenant and no branches, and is not in the grid or "View as". Tenant data carries `tenantId`.
- **Storage:** DB table `roles`, seeded by migration, rows locked (no add / delete / rename from the UI). Code uses the stable `key` (enum mirror for type safety), never the row id. Permission grid rows reference the role key.
- **Trainer type is not a role, and not a fixed enum:** one role TRAINER + a **Trainer types master list** (DB table, admin-managed): name, short code, active, "Can take PT sessions" (default Yes). Seeded: **General Trainer (GT), Personal Trainer (PT), General + Personal (GT-PT)**. New types are added from Settings, no code change.
- Each trainer has exactly **one** `trainerTypeId`.
- **Any trainer type can take PT sessions** (GT too). The type changes only the **payout**: the incentive scheme sets the rate per trainer type.
- Every PT session / sale line **stores the trainer type at that time** (snapshot), so changing a trainer's type later does not change past payouts.
- Staff has `roleKey` (exactly one) and `branchIds[]` (exactly 1 for single-branch roles).
- Region is a **grouping / filter** of branches (and how branches are given to an RM), not a permission scope.

## 2. Roles & permissions (Settings grid)

**How it works:** fixed roles; each cell is a tick or a scope (**None / Own / Branch / All**; "Branch" = the staff's own branch, or all their branches for multi-branch roles like RM) or a number (discount %). Defaults ship pre-set. **CEO has every permission (locked)** and is the only editor; every change is logged (who, when, what). No per-user permissions, no custom roles, no conditions inside cells.

### Default grid

| Module | Action | SE | SM | CM | RM | CEO |
|---|---|---|---|---|---|---|
| Leads | View leads | Own | Branch | Branch | Branch | All |
| Leads | View unassigned leads (= the "pool") | — | — | Branch | Branch | All |
| Leads | Take an unassigned lead ("Take this lead" → I become owner) | — | — | Branch | Branch | All |
| Leads | View lost leads | Own | Branch | Branch | Branch | All |
| Leads | Create lead | ✓ | ✓ | ✓ | ✓ | ✓ |
| Leads | Assign / reassign / change owner (single + bulk) | — | Branch | Branch | Branch | All |
| Leads | Assign a follow-up to another staff (any branch) | Own | Branch | Branch | Branch | All |
| Leads | Mark lost | Own | Branch | Branch | Branch | All |
| Leads | Re-open lost lead | Own | Branch | Branch | Branch | All |
| Leads | Move lead to another branch | Own | Branch | Branch | Branch | All |
| Leads | While moving, pick the follow-up person in the new branch directly | — | — | Branch | Branch | All |
| Trials | Book trial | Own | Branch | Branch | Branch | All |
| Trials | Edit free-trial limit settings (per person total, per branch) | — | — | ✓ | ✓ | ✓ |
| Trials | Can be picked as trial approver (approve / reject) | — | Branch | Branch | Branch | All (locked, #102) |
| Trials | Paid trial adjust after it ended (7-day buffer) | — | — | Branch | — | All |
| Sales | Convert to Client / Sell | Own | Branch | Branch | Branch | All |
| Sales | Max discount % (#77) | 10% | 20% | 30% | 50% | 100% (placeholder, Q31) |
| Clients | View clients | Branch | Branch | Branch | Branch | All |
| Clients | Collect payment | Branch | Branch | Branch | Branch | All |
| Clients | Waive pending item (#67) | — | Branch | Branch | Branch | All |
| Settings | Packages | — | — | — | — | ✓ |
| Settings | Accessory / key fob stock (#56) | — | — | Branch | Branch | All |
| Settings | Edit inactivity release days | — | — | ✓ | ✓ | ✓ |
| Settings | Roles & permissions | — | — | — | — | ✓ |

Trainer, MXM, Finance: no lead / sales access by default (PT and payment rows come later). CEO: everything, locked (#102). The trial approver dropdown = SM, CM, RM of the branch (L1b); the CEO also has the permission because the CEO column is locked.
Discount % numbers follow #77 (CEO 100% = placeholder Q31; "no limit" never shows), placeholders until admin sets them.

### Locked (cannot be changed in the grid)
- CEO has every permission (top tenant role, #102).
- Only the CEO can edit Roles & permissions.
- At least one role must keep "Assign / reassign".
- An owner can always see and log follow-ups on their own leads.

### Settings values (numbers, not per role)

| Setting | Default | Who can change |
|---|---|---|
| Free trials per person (all branches) | 2 | grid row "Edit free-trial limit settings" |
| Free trials per branch | 1 | same |
| Paid trial adjust buffer after it ends | 7 days | CEO |
| Inactivity release after | 7 days | grid row "Edit inactivity release days" |
| Warn the owner before release | 1 day before | same |
| New-lead assignment | Manual (Round-robin later) | CEO |
| Max discount % per role (#77) | see grid | CEO |

### What this closes
O-R3, O-R5, O-R6, T-R7 (who approves), and **Q8** (permission matrix) everywhere the mockup says "Placeholder".

---

## 3. Decided by logic (say "no" only if wrong)

| ID | Decision |
|---|---|
| L1 | **No per-booking override.** Free-trial limits are **settings** (default: 2 per person, 1 per branch). Within the limit anyone allowed to book gives the free trial. Over the limit the button is disabled: "Free trial limit reached". To give more, a role with the permission changes the setting (even CEO does it through the setting). |
| L1b | **Trial approval = a pending reference, not a block.** Every trial booking needs a comment + "Approval asked from" (dropdown: SM, CM, RM of the branch, per the grid). Trial is booked at once; status Pending. The approver can mark Approved / Rejected + remark; Rejected is only recorded (trial keeps running). |
| L1c | Free-trial limits are the **same for every role** (a rule about the person, not the staff). More trials only by changing the setting. |
| L2 | **7-day buffer adjust:** whoever has the permission does the conversion; the adjust checkbox appears for them only, within 7 days after the trial ended. |
| L3 | Buffer adjust: membership start = **today** (not the trial start, or the client loses days). Full trial price subtracted. |
| L4 | Running-trial adjust: **full** trial price subtracted. |
| L5 | After the trial ends, the stage dropdown unlocks (Negotiation / Contacted). |
| L6 | Free-trial limits are counted by **mobile number across all branches**. |
| L7 | Status label: **"Trial ended"**. |
| L8 | Follow-up assignee (not the owner) sees the lead **while they have an open follow-up on it**. When it is Done / Cancelled / Closed by system, the lead leaves their Leads list (it stays in their follow-up history). |
| L9 | Scope **"Own" = leads I own + leads where I have an open follow-up.** So the assignee can call, WhatsApp, add notes, log their follow-up, Book trial and Convert (as allowed by the grid). Owner never changes by this. |
| L10 | If the assignee converts, they are the **sales rep** of that sale by default (#36: sales rep per sale line, changeable at sale). |
| L9b | The follow-up assignee (any branch) sees the **full lead profile** and can do every action their role allows on it. |
| L11 | Leads list shows a badge "Follow-up from <owner>" on leads the user does not own, so it is clear why they see it. |
| L12 | **Lead moved to another branch:** the lead's branch changes, **owner stays the same** (now a cross-branch owner). Remark mandatory. Timeline entry "Moved Sec 31 → Golf Course by Priya". |
| L13 | If the mover does **not** have the "pick directly" permission (SE by default): the lead appears for the **new branch's CM** in "Transferred in · needs follow-up person" (Leads filter + Today). The CM picks an SE of that branch, who gets a follow-up. |
| L14 | If the mover **has** that permission: a dropdown of the new branch's SEs appears in the move dialog, and that SE gets the follow-up right away. |
| L15 | The owner's own open follow-ups stay as they are (owner did not change). The new-branch SE converts → they are the sales rep by default (L10); any credit for the owner is decided in the incentive scheme. |
| L16 | **Owner change (single or bulk):** the dialog shows "Open follow-ups and tasks (N)" with 3 choices, default first: **(1) Move to the new owner** · (2) Close them ("Closed by system · Owner changed") and create **one** new follow-up for the new owner (due = earliest open due date, editable) · (3) Keep with the old owner (old owner keeps seeing the lead while they stay open, L8). In bulk, one choice applies to all. |
| L17 | Applies to **open follow-ups and open tasks**. Not moved: done / closed history, notes, timeline, and trial-approval requests (they stay a record of who asked whom). Same dialog for a client's owner change. |
| L18 | **Inactivity release (built now):** a lead is inactive when its next follow-up is **overdue or not set for N days** (setting, default 7). Then: owner removed → **Unassigned**, open follow-ups and tasks "Closed by system · Released (inactive)", timeline entry. Applies to all open leads. **Not** while a trial is running. Lost leads are never released (they are closed already). |
| L19 | The owner gets a warning **1 day before** (notification + "Releases tomorrow" badge on the lead). Any follow-up logged or scheduled resets the clock. |
| L20 | **"Pool" = Unassigned leads, controlled only by the grid.** Unassigned has a reason: New (Meta / Excel / manual unassigned), Released (inactive). Filter by reason. Default grid: only CM / RM / CEO see and take them. Giving SE "View" + "Take" (Branch) turns on the pool for SE, no new screen. |
| L21 | **Take this lead** = explicit button, no auto-claim by activity. Taker becomes owner; the lead's branch does **not** change (cross-branch owner, like L12). |
| L22 | **Lost leads** are not Unassigned; they keep their owner. Visibility by the grid row "View lost leads". Re-opening someone else's lost lead (allowed by scope) makes you the owner; the owner-change dialog (L16) appears if anything is open. |
| L23 | **Lead stages stay 5:** New, Contacted, Trial (auto), Negotiation, Lost. Converted = becomes a Client (not a stage). Situations are **badges, not stages**: Trial ended, Unassigned, Transferred in, Releases tomorrow, Re-opened, Follow-up from <owner>. Junk / wrong number / not interested = **Lost reasons**, not stages. |
| L24 | Re-open returns to the stage before Lost (#29); if that was Trial and no trial is running, it returns to **Negotiation**. |

---

## 4. Rule questions left (answer in order)

1. ~~Q-R1~~ **Answered: Yes** (see L8–L11).
2. ~~Q-R2~~ **Answered** (see L1, L1b).
3. ~~Q-R3~~ **Answered** (see L12–L15).
4. ~~Q-R4~~ **Answered** (see L16, L17).
5. ~~Q-R5~~ **Answered: build now** (see L18–L22). **All rule questions are answered.**

## 5. Parked
- Round-robin assignment (setting exists, Manual for now).
- Max leads one SE can take from Unassigned (add as a setting only if the client asks).

## 6. For the teammate (questions only)
The mockup's grid (section 2) is the source; the build will sync to it. Please confirm or correct:
1. Role keys as stable strings (SALES_EXECUTIVE …) in a seeded, locked `roles` table: OK?
2. Permission keys as stable dotted strings (`leads.view`, `leads.assign`, `trials.book` …), one list in `docs/permissions.md`: OK?
3. Each cell stored as role × permission → scope enum (None / Own / Branch / All) or a number (discount %): OK?
4. The API checks permissions server-side on every action (not only hiding buttons): already the case?
5. Settings values (section 2, numbers) as key → value rows, editable by permission: OK?
6. Permission and setting changes go to an audit log (who, when, old → new): exists already?
7. API accepts a system-set past start date (paid trial adjust only)?

## 7. Answers log
| ID | Answer | Date |
|---|---|---|
| A1 | Premium PT buyer becomes a Client. A2, A3 auto-Yes (Convert to Client; renewal like a membership). | 16 Nov 2026 |
| A4 | Premium PT has no trial. Lead = membership trials; PT trials = active clients. | 16 Nov 2026 |
| A5–A6 | 4 categories incl. Premium PT; splits into 2 lines; "Premium" sub-type label removed. | 16 Nov 2026 |
| A7 | Incentive split set in the incentive scheme. | 16 Nov 2026 |
| A8 | Membership = all branches; PT = home branch. | 16 Nov 2026 |
| B1 | Replaced by Q-R2 / L1: limits are settings, no per-booking override. | 16 Nov 2026 |
| Q-R1 | Follow-up can be assigned to staff other than the owner (any branch); they see the lead, owner unchanged. Details L8–L11. | 16 Nov 2026 |
| Q-R3 | Lead moved to another branch: owner stays; new-branch SE gets a follow-up. SE can only move; the new branch's CM picks the SE. A grid permission lets roles pick the SE directly. Details L12–L15. | 16 Nov 2026 |
| Q-R2 | Free trials within the limit: SE gives them. Limits are settings changed by CM / RM / CEO (CEO grants/revokes via the grid); no unlimited override. Approval = pending reference on every trial; approver picked from SM / CM / RM. | 16 Nov 2026 |
| L1c | Free-trial limit same for all roles. | 16 Nov 2026 |
| Q-R4 | Owner change: choice in the dialog (move / close + new one / keep with old), default move; follow-ups and tasks. | 16 Nov 2026 |
| Q-R5 | Inactivity release built now → Unassigned. Pool = Unassigned leads, controlled by the grid (L18–L22). | 16 Nov 2026 |
| T-TYPE | Trainer type = admin master list (GT, PT, GT-PT seeded, more later). All types can take PT sessions; type only changes payout (incentive scheme). Type snapshot stored on each session / sale line. | 16 Nov 2026 |
| M1 | Fixed roles, one role per staff, permissions in a settings grid with defaults (Level 2). | 16 Nov 2026 |
