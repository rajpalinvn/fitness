# GYM-OS · Lead & Client flow — decided so far + open questions

**Repo:** https://github.com/rajpalinvn/fitness (mockup, last checked `1de65cf`)
**Purpose:** Combine everything decided in the latest meeting into one place, and get clear answers to the open questions before the mockup is changed.
**How to answer:** For each question, reply with its ID and the option (e.g. `T3: B`). Add one line of reason only if you pick something other than the default. If a question needs the client / business owner, write `ASK CLIENT`.

---

## Part 1 — Decided (do not re-open unless something breaks)

### 1.1 Lead vs Client

| Rule | Detail |
|---|---|
| R1. Client definition | **Client = a person who bought a Membership.** Everyone before that is a Lead, including people on a free trial or a **paid trial**. (Replaces old #3 "money taken = client".) |
| R2. Trials give nothing extra | Trial (free or paid) gives **no accessories, no free items, no FF ID, no key fob**. The "Add items" section is hidden for trial packages. |
| R3. Paid trial payment | Paid trial is paid **in full, at once**. No partial payment, no balance due on a lead. |
| R4. Two buttons on a lead | **Book trial** shows only trial packages (free + paid). **Convert to Client** shows only Membership packages (never trial packages; PT stays disabled, #89). |
| R5. Membership and PT sold separately | PT is sold later in Sell mode, only to a client with an active membership (#89). |
| R6. Convert to Client | FF ID and key fob are given at conversion. If out of stock, they can be "Pending" (as today). Free items follow #67 (out of stock = "Pending issue", manager can Waive). |

### 1.2 Trial

| Rule | Detail |
|---|---|
| T-R1. Trial stage is automatic | Sales staff never set "Trial" by hand. The Stage dropdown shows only **New, Contacted, Negotiation**. Booking a trial sets stage = Trial. |
| T-R2. Trial ends | Stage stays **Trial**, shown as "Trial · ended", and a follow-up is created for the lead owner. |
| T-R3. Convert during a trial | Allowed. The trial ends at that moment. |
| T-R4. Repeat-trial warning | Show the warning from the **2nd** trial (free and paid both). Old #39 said 3rd. |
| T-R5. Paid trial adjust on conversion | When a lead with a **running** paid trial clicks Convert to Client, the bill shows "Paid trial ₹X adjust? ☐". Ticked: trial price is subtracted, and the membership **start date = the trial's start date** (system-set; staff cannot edit it). The trial line stays in history; the new membership line is tagged "Paid trial adjusted". It is **not** an "Upgrade" (#44 is for client-to-bigger-package only). Trial already ended: no adjust, full price. |
| T-R6. Who sees Book trial | Uses the package checkbox **"Requires an active membership"** (already in package settings). **Lead** sees trial packages with the checkbox OFF (membership trials). **Active client** sees trial packages with the checkbox ON (PT trials). **Expired client** sees none, so the button is hidden. **Lost lead**: disabled, "Re-open the lead first" (#26). |
| T-R7. Trial approval (approval after booking) | Booking a trial needs a **mandatory comment** and an **approver** picked from a dropdown of that branch's higher roles (MXM, Sales Manager, Club Manager, Regional Manager, CEO). The trial is booked immediately; approval stays **Pending**. The approver gets a notification and marks **Approved / Rejected + remark**. |

### 1.3 Ownership, pool, branches

| Rule | Detail |
|---|---|
| O-R1. One owner | Every lead has exactly one owner, or it is **Unassigned (in the Pool)**. |
| O-R2. Visibility | Sales Executive sees: own leads + the **Pool of their region**. Managers see all leads of their branches. |
| O-R3. Assign | Only managers assign / reassign, **single or bulk**. |
| O-R4. Region | Each branch gets a **Region** (e.g. Jaipur = 3 branches). Used for filters and for the Pool. |
| O-R5. New leads from Meta / Excel import | Land Unassigned in the Pool. Per-branch setting: **Manual (manager assigns)** or **Round-robin**. |
| O-R6. Lost leads | Go to the Pool, visible to everyone in the region. Anyone can re-open one and take it. Manager can re-open and assign (single or bulk). Notes are allowed on lost leads; nothing else until re-opened (#26). |
| O-R7. Inactivity release | If the owner is inactive for N days (default 7), the lead goes back to the Pool, with a timeline entry. Managers can assign it again, or someone can take it. |
| O-R8. Branch transfer of a lead | The **owner or a manager** can move a lead to another branch, with a mandatory remark. It lands **Unassigned in the new branch's Pool**, with a filter "Transferred in". Whoever takes it first, or whoever the manager assigns, becomes the owner. Old open follow-ups are "Closed by system". |

### 1.4 Existing decisions this changes

| Old | Change |
|---|---|
| #3 | "Money taken = client" becomes "Membership bought = client". Paid trial stays a Lead. |
| #15, #63 | Sales Executive now sees the regional Pool (was: SE never sees unassigned leads). |
| #39 | Repeat-trial warning from the 2nd trial (was 3rd). |
| #66 | Convert to Client Package step: Membership only (Free trial / Paid trial accordions move to Book trial). |
| #72 | Paid trial no longer goes through Convert; no FF ID on any trial. |
| #76 | Branch transfer of a lead is allowed for the owner too (reassign stays managers only). |
| Q5, Q26 | Closed (paid trial is a lead; no "trial ended client"). |
| Q10 | Solved by the per-branch Manual / Round-robin setting. |
| Clients list (`1de65cf`) | The "Paid trial" card and the paid-trial dummy client (Ananya) must move to leads. |

---

## Part 2 — Open questions for the team (product / system)

Each question has a **default** that the mockup will use if there is no answer.

### A. Trial

| ID | Question | Options | Default |
|---|---|---|---|
| T1 | When is trial **approval** needed? | A) Every trial · B) Only from the 2nd trial (when the warning shows) · C) Only paid trials | **B** |
| T2 | Approver marks **Rejected** while the trial is running. What happens? | A) Trial keeps running; "Rejected" is recorded and shown in reports · B) Trial is cancelled immediately (paid trial would need a refund flow) | **A** |
| T3 | One approver list for all trials (MXM, SM, CM, RM, CEO)? Or MXM only for PT trials? | A) One list for all · B) PT trials: MXM first; membership trials: SM / CM first | **A** |
| T4 | Approval still Pending when the trial ends. Anything automatic? | A) Nothing, it stays Pending · B) Reminder notification to the approver · C) Auto-approved | **B** |
| T5 | After a trial ends, can staff move the stage from Trial to Negotiation / Contacted with the dropdown? (While the trial runs, the dropdown is locked.) | Yes / No | **Yes** |
| T6 | Paid trial adjust: is the **full** trial price subtracted? | A) Full price · B) Only for the unused days | **A** |

### B. Pool and taking a lead

| ID | Question | Options | Default |
|---|---|---|---|
| P1 | How does someone take a Pool lead? | A) Explicit **"Take this lead"** button · B) Automatically, on the first follow-up / activity | **A** (fewer accidents) |
| P2 | A Sales Executive takes a Pool lead that belongs to **another branch in the same region**. Does the lead move to the taker's branch? | A) Yes, auto branch change + timeline entry · B) No, it stays in its branch (taker works across branches) · C) Not allowed, own branch only | **A** |
| P3 | Is the **Unassigned new-lead** Pool (Meta / Excel) region-wide like lost leads, or branch-only? | A) Region-wide · B) Branch-only (lost leads region-wide) | **B** |
| P4 | Can a Sales Executive **re-open** a lost lead from the Pool by themselves? | Yes / No (managers only) | **Yes** (O-R6) |
| P5 | Limit on how many Pool leads one SE can hold? | A) No limit · B) Limit set by admin | **A**, ASK CLIENT |

### C. Inactivity release

| ID | Question | Options | Default |
|---|---|---|---|
| I1 | What counts as "inactive"? | A) Next follow-up **overdue or not set** for N days · B) No follow-up logged for N days · C) Not converted within N days | **A** |
| I2 | Does release apply to **all** leads, or only leads taken from the Pool / re-opened? | A) All leads · B) Only taken / re-opened leads | **A** (one rule) |
| I3 | Never release while a trial is running? | Yes / No | **Yes** |
| I4 | Warn the owner before release (e.g. 1 day before)? | Yes / No | **Yes** |
| I5 | Number of days N | Number | **7**, ASK CLIENT |
| I6 | On release, open follow-ups become "Closed by system (Released to pool)"? | Yes / No | **Yes** |

### D. Branch transfer and region

| ID | Question | Options | Default |
|---|---|---|---|
| B1 | Lead transfer to **any** branch, or only the same region? | A) Any branch · B) Same region only | **A** |
| B2 | Can a branch belong to only one region? | Yes / No | **Yes** |
| B3 | Is "Region" also a top-bar filter (like the branch switcher), for Regional Manager and above? | Yes / No | **Yes** |
| B4 | Round-robin: which users are in the rotation? | A) All active Sales Executives of the branch · B) A list the manager picks | **A** |

### E. Data model (for the build agent)

| ID | Question | Options | Default |
|---|---|---|---|
| D1 | Trial approval: new fields on the trial sale line (`approvalStatus`, `approverUserId`, `approvalRemark`, `approvedAt`) or a separate Approval table? | A) Fields on the sale line · B) Separate table | **A** |
| D2 | Pool: store as `ownerUserId = null` (Unassigned) plus a `pooledAt` / `poolReason` (New, Lost, Released, Transferred in)? | Yes / suggest other | **Yes** |
| D3 | Paid trial adjust: store as a negative "Adjustment" line on the conversion bill, linked to the trial sale line? | Yes / suggest other | **Yes** |
| D4 | Is a start date in the past (system-set, paid trial adjust only) OK for the API? | Yes / No | **Yes** |

---

## Part 3 — For the client meeting (business answers needed)

1. **Inactivity days:** "Rahul's lead has had an overdue follow-up for 7 days. Should it go back to the pool?" How many days?
2. **Round-robin:** Which branches use it? Skip people on leave? (Leave data does not exist in the system yet.)
3. **Paid trial adjust and GST:** Does the accountant treat the adjusted amount as a discount or as an adjustment / credit?
4. **Pool limit:** Max leads one Sales Executive can take from the pool?
5. **Sales credit:** Priya owned the lead, it was released for inactivity, Aman converted it. Is the credit only Aman's? (Today #36: credit goes to the sales rep of the sale.)
6. **Expired client and trial:** Confirm that an expired client never gets a trial (only renewal offers).

---

## Answer template (copy and fill)

```
T1:  T2:  T3:  T4:  T5:  T6:
P1:  P2:  P3:  P4:  P5:
I1:  I2:  I3:  I4:  I5:  I6:
B1:  B2:  B3:  B4:
D1:  D2:  D3:  D4:
Notes / anything that conflicts with Part 1:
```
