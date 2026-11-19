# Convert to Client

> **Real app rule:** the person becomes a client **only when the first payment of a Membership or Premium PT succeeds**
> (decisions #79, #92). Trials (free or paid) are never sold here: they are booked with **Book trial** (below) and the person stays a Lead (#93).

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Convert to Client stepper (Sell mode in the profile drawer) | `shared/convert.js` → `App.Convert.open(personId)` (uses `App.DrawerMode`) | Turns an open lead into a client with a Membership or a Premium PT (membership + PT). |
| Bill summary | right column of Sell mode (below the steps on tablet) | Checkout-style, sticky, updates live on every step (decision #65). |
| Done screen | same drawer | "<name> is now a client (CL-1003)" + payment note + pending items. |

Steps: **1 Details · 2 Package · 3 Sale & start · 4 Corporate entry · 5 Summary · 6 Payment**.
Step 4 "**Corporate entry: FF ID & key fob**": **FF ID is required** to convert (#93); the key fob can be "Add later" (Key fob pending) — decisions #13, #67, #93.
**Premium PT** (#92, changed by #103): a PT product; the membership inside it is an add-on (free or charged). The bill shows 2 lines, "Membership (included)" = reference membership price (may be ₹0: the line still shows, "free, no GST") and "PT" = price − reference; GST per line. The discount applies to the **PT line only**; the membership line always stays at the reference price. **One sales rep** for the whole package (default = lead owner); the membership line stores it only as a reference ("incentive by scheme"). The buyer becomes a Client with a membership AND a PT line (sessions unlock per #83).

Layout (decision #65): steps on the LEFT, sticky **Bill summary** on the RIGHT:
person (name, mobile, branch) · package line (price) · discount + reason (+ "Package after discount") ·
free items (Free; **Issue now / Later**, default Issue now when in stock, out of stock forced Later = Pending issue; Skipped (already received) as is — #70) ·
**+ Add item** (search active accessories; qty; price locked from the item master; branch stock shown; out of stock disabled; **Free** switch = complimentary, needs a reason — #71) ·
key fob deposit, "Key fob · Pending", or "Key fob · Complimentary ₹0" (#75) ·
totals: Package after discount, Accessories (paid), Key fob deposit, **GST included** (each line at its tax category), **Total to pay**.
Before a package is chosen: "Choose a package to see the bill." Tablet: the bill moves below the steps.

## 2. Flow
- Profile drawer (open lead) → **Convert to Client** → the drawer itself switches to wide
  **Sell mode** (decision #64): header "<Name> › Convert to client" with **Back**; width = the
  larger of the user's drawer width and 80% (tablet 92%). Not a modal.
  Lost leads have no button (re-open first). Clients have no button (upgrade / renewal later).
- Previous / Next move between steps; Next validates the current step. Back (header),
  Cancel (step 1), Esc or outside click return to the profile with the toast
  "Conversion not saved"; nothing is saved.
- Trials are **not** here: the Package step offers Membership and Premium PT only (PT listed but disabled, #89) and says
  'Trials are booked with "Book trial"' (see the Book trial section at the end of this README).
- **Paid trial adjust** (#94, step 3 "Paid trial adjust" + bill group "Paid trial adjusted"): a RUNNING paid membership trial →
  "Paid membership trial ₹800 adjusted" ticked and **locked**, bill −₹800, start date = the trial's start (read-only, "Set by system";
  the only back date, #41), the trial ends at conversion. Trial ENDED within the buffer (Settings value, default 7 days) and the
  user has `trials.adjustAfterEnd` → the checkbox is optional, start = today. Beyond the buffer or without the permission → no
  checkbox, one info line why. Free trials never. A running / ended paid **PT** trial is adjusted the same way only when the
  package is **Premium PT** (into the PT line). Saved as `trialAdjust { trialId, amount }` on the line; the trial gets `adjustedAt`.
- **Paid** → Summary **Next** → **Step 6 Payment** → **Save payment** (decision #79: "money taken = client";
  the person becomes a client when the first payment is saved) →
  - person `kind` = Client, stage Converted, next client no (CL-1003, CL-1004 …),
    home branch = lead branch, joined today;
  - membership line saved with package, sale type, start, end, price, discount + reason,
    final price, sales rep; Premium PT also saves `p.pt` (PT line: price − reference, its discount share, sessions, its
    own sales rep, its own payment totals) — allocation accessories → fob deposit → membership line → PT line (#93);
  - key fob (if picked) → status Assigned, branch stock −1;
  - payment saved on the membership: one receipt (auto no. per branch, e.g. S31-000124) with one row per method
    (split payment); total, paid, balance + due date. Balance → "Payment due" pending item (profile + Today) and a
    "Payment expected" follow-up on the due date. Timeline "Payment ₹16,200 received · Cash ₹10,000 + UPI ₹6,200 · receipt S31-000124 · balance ₹6,600 due Mon 17 Nov";
  - open follow-ups → **Closed by system · Client converted**, owners notified (decision #37);
  - timeline: "Converted to Client · Annual Membership · ₹21,600 (₹2,400 off: Diwali offer) · key fob KF-S31-0013 · sales rep Priya";
  - unassigned lead → converting user becomes owner (owner history kept);
  - done screen → **Done · back to profile**. The drawer leaves Sell mode and shows the client view on the Membership tab,
    link becomes `#client-<name>`, the row leaves the Leads list, counts and badges update.
- After conversion: NEXT STEP shows **Key fob pending** until a fob is assigned (FF ID can no longer be pending for a new client, #93).
- **Layout** (decision #84): stepper and steps column max ~760px; every step's content sits in cards with a
  heading (24px between cards, 16px inside); inputs max ~480px; bill fixed ~380px with grouped lines
  (package / free items / accessories / key fob / totals) and a highlighted **Total to pay**; footer buttons
  aligned to the right edge of the steps column. Tablet: one column, bill below, stepper wraps.

## 3. Field table

### Step 1 · Details
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Name, Mobile, Branch | read-only | — | Mobile: yes | from lead | Edit in the Details tab. |
| Email | email | No | Yes, company-wide when given | lead email | Empty → hint "No email: receipts go by WhatsApp only". Duplicate: same branch "Already used by <name>"; other branch "Already exists in <branch> · Owner: <first name>" + Request access (#19). |
| Gender | select | Yes | No | lead gender | Female / Male / Other. |
| Birth date | date | No | No | lead birth date | Not in the future. |

### Step 2 · Package
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Search packages | search text | No | — | empty | Filters by name across all groups; groups with matches open; none → "No packages match "<text>"" (decision #66). |
| Package | cards in accordions (+ / −) Membership / Premium PT (membership + PT) / Personal training, count per group; Membership open, others collapsed (#74) | Yes | No | none | Only active, non-trial packages sold at the lead's branch with audience New or Both; no Add-ons (#57, #93). Price = current price from the price history. PT disabled: "PT needs an active membership" (#89). Premium PT card shows "incl. membership ₹8,000 · PT ₹22,000". Couple package converts this person only (partner later). Card shows "Free: T-shirt, Gym towel"; a "Once per client" item the person already got shows "(already received)" and is Skipped in the bill. |
| PT quotes | cards | — | — | — | Open quotes (pick) / Expired (disabled). A picked quote shows its details LOCKED on step 3. |

The Package step only picks the package (c10).

### Step 3 · Sale & start (price & discount + sales rep first, then sale type, adjust, dates)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Price | read-only | — | — | package price | Locked (#14). |
| Discount | [% \| ₹] segmented + amount in one row; live line "Discount ₹2,400 · Final ₹21,600" | No | No | 0, % | Can't be negative or more than the line (Premium PT: "more than the PT part"). **Limit = the role's "% · max ₹" from the grid** (`sales.discountMax`, #77, #103): the LOWER of (% of the package line) and the ₹ cap applies; cap 0 = no cap; % 0 = no discount (field disabled, "no discount for your role"). Defaults: SE 10% · no cap, SM 20% · max ₹5,000, CM 30%, RM 50%, CEO 100% (set by the club). Hint "Your limit (role): 20% · max ₹5,000 · here up to ₹4,800". Applies to the **package line only**, never accessories or the fob deposit. Premium PT: % computed on the PT part (price − reference), the cap applies to the PT line. Over the limit: inline "Max 20% · ₹5,000 for your role (here up to ₹4,800)." while typing; Next blocked (#73). |
| Discount reason | select: Festive offer, Referral, Corporate, Staff family, Other | When discount > 0 | No | — | Shown as soon as the amount is above 0. "A reason is needed for a discount." |
| Other reason | text | When reason = Other | No | — | "Write the reason." |
| Sales rep (`salesRepUserId`) | select | Yes | No | **you, the person creating the sale** (#107) | One rep per sale line (#36). Users with `sales.rep` in ANY branch ("Name · Branch", you first). Every change from the default = SalesRepChanged event. Premium PT: ONE select for the whole package (#103); stored on the PT line and, as a reference only, on the membership line (`incentiveByScheme: true`). |
| Sale type | derived from package | — | — | — | Paid (becomes a Client; next step Corporate entry). Premium PT: "Paid · becomes a Client with membership + PT". |
| Paid trial adjust | checkbox per trial type | — | — | ticked + locked (running) / unticked (ended, in buffer, permitted) / absent | "Running paid membership trial · adjusted (locked) · membership start = trial start, set by system" / "ended N days ago · within the 7-day buffer" / "past the 7-day buffer, no adjust" / "only roles with 'Paid trial adjust after it ended' can adjust". |
| Start date | date | Yes | No | today (running paid trial: trial start, disabled) | #41 changed by #103: never in the future (max = today). Back date only within the CURRENT month and only with the grid row `sales.backDate` (CEO yes; others No by default). Hint: "Today. Back dates need the permission …" / "Today, or back to 1 Nov 2026 (this month only). No future dates." / on the 1st: "Back date only within this month (none today)." The running paid trial start is system-set and exempt. |
| Ends | derived | — | — | — | Start + days − 1 ("365 days, start day included"). Overlap check (#41) applies to clients; a lead has no membership yet. |

### Step 4 · Corporate entry: FF ID & key fob
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| FF ID | text | **Yes** (#93) | Yes, company-wide | lead FF ID | From the corporate software (enter the client there first). Empty → "FF ID is required to convert …" blocks Next and Save payment. Duplicate: same branch "Already used by <name>"; other branch "Already exists in <branch> · Owner: <first name>" + Request access. |
| Free (no deposit) | switch next to the fob picker | No | — | off | Shown when a fob is picked. On → bill "Key fob · Complimentary ₹0"; reason required ("A reason is needed for a free fob."). Saved as deposit ₹0, complimentary + reason (#75). |
| Key fob | chips from the lead branch's stock + "Add later" | No (here) | Yes | Add later | Shows "<branch> stock: N in stock". No stock → message and the conversion can finish; "Key fob pending" shows. |

### Step 5 · Summary
Read-only list: person, package (Premium PT: "2 lines: Membership (included) ₹8,000 + PT ₹22,000"), sale type, start – end,
sales rep (two for Premium PT), discount reason, Corporate entry (FF ID · key fob or "Pending"), owner (if it was unassigned), and how
many open follow-ups will be closed by system. All money is in the bill summary. Button: **Next** (to Payment).

### Step 6 · Payment (decisions #79–#83; all Default, can change)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Receipt no. | read-only | — | Yes, per branch | next number | `<branch prefix>-<6 digits>`, e.g. S31-000124 (Sec 31), S65-…, GC-…. Taken on save. |
| Method (per row) | select of **active** payment methods | Yes | No | first active (Cash) | Settings → Payment methods. Disabled methods are hidden. |
| Amount (per row) | number, 2 decimals | Yes (> 0) | No | row 1 = total to pay | "Enter an amount." |
| Reference (per row) | text | Yes, except Cash | No | Cash: the receipt no. (auto, read-only) | Label from the method (#116): UPI "UTR / transaction ID", Card "Approval code or last 4", Bank transfer "UTR", Cheque "Cheque number". Error "UTR / transaction ID is needed for UPI." |
| Bank name (Cheque only) | text | Yes for Cheque | No | — | "Enter the bank name." Cheque duplicate = same bank + number. |
| Duplicate reference confirm (per row) | checkbox + reason | Yes when the ref was used before | No | unticked | Same method + same ref anywhere in the company (#116). Warning, NOT a block: "This reference was used before. Used on 21 Oct in Divya Nair's payment (S31-000101)". "Tick the box to confirm this is a different payment." / "Enter a reason." Saved row gets `dup { usedOn, personId, reason, by, flagged }` → badge "Duplicate reference · flagged for Finance / CEO" on the profile receipt. Dummy: p22 (second receipt reuses p19's UPI ref). |
| Slip (per row) | upload | No | No | — | Mockup: toggles "Slip attached" (placeholder file). |
| + Add payment row | link | — | — | 1 row | Split payment (e.g. Cash + UPI). Rows can be removed (×). |
| Total · Paid now · Balance due | derived, live | — | — | — | Also in the bill (Paid now, Balance due). |
| Balance due date | date ("12 Nov 2026") | Yes when balance > 0 | No | — | **Shown only when Balance due > 0** (#87). After today. "Pick a due date for the balance." |
| Minimum first payment | derived, live | — | — | 30% (Settings → Sales rules) | = accessories in full + key fob deposit in full + 30% of the package after discount (#85). Below it **Save payment is disabled** and the line turns red: "Minimum ₹7,189 (accessories ₹349 + 30% of package)". |

Rules: Paid now can't be more than the total. **Allocation** (#85, #93): accessories → key fob deposit → membership line → PT line
(Premium PT); the bill shows "Paid in full" on a line only when it is covered, otherwise "Paid ₹X · Balance ₹Y" (e.g. ₹340 paid with a
₹349 accessory → "Paid ₹340 · Balance ₹9"). Collect payment later has no minimum. **Accessories and the key fob deposit are settled first and in full**.
**PT sessions** (#83): per-session price = (PT line − its discount) / sessions; unlocked = floor(paid towards the PT line / per-session
price). Premium PT bill shows "PT sessions unlocked 1 of 12" live (₹10,000 paid on ₹27,000: membership ₹7,200 first, ₹2,800 reaches PT).
Leads can't buy a PT-only package (needs an active membership), so that dummy case is on an existing client (Kabir Malhotra).
**GST** (#78): each line at its own tax category; bill shows "GST included ₹1,196.10" and a line per rate
("GST 5% ₹1,142.86", "GST 18% ₹53.24"), always 2 decimals.

### Bill · added items (decision #71)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Item | search + list of active accessories | Yes (per line) | No | — | Shows price and "<branch> stock N"; out of stock disabled. Key fob is not in this list. |
| Qty | number | Yes | No | 1 | At most the branch stock ("Only N in stock."). Picking the same item again adds 1. |
| Price | read-only | — | — | item selling price × qty | Locked from the item master (incl. GST). |
| Free (complimentary) | switch | No | — | off | On → line ₹0 and a reason is required ("A reason is needed for a free item."). |
| Issue now / Later (package free items) | segmented | — | — | Issue now (in stock) | Out of stock → forced Later. Later → "Pending issue" on the profile. |

## 4. States
- **Validation**: "Choose a gender.", "Check the email format.", duplicate messages,
  "Choose a package.", "FF ID is required to convert …", "Max 20% · ₹5,000 for your role (here up to ₹4,800).",
  "No discount for your role.", "A reason is needed for a discount.", "Discount can't be more than the price / the PT part (₹22,000).",
  "Start can't be in the future.", "Back date only within this month.", "You can't back-date a sale (needs \"Back-date a sale start\")."
- **Empty**: no fobs in stock → warning callout, finish without fob.
- **Loading / error**: none in the mockup (real app: payment in progress / payment failed
  are handled by the Payment module; the lead stays a lead on failure).
- **Success**: done screen + toast "<name> is now a client (CL-1003)".

### Dummy edge cases
| Person | Shows |
|---|---|
| Aarav Patel (overdue) | Paid Annual with 10% discount + fob KF-S31-0013; FF ID required; overdue follow-up closed by system. |
| Sneha Reddy (no email) | WhatsApp-receipts hint; Aarav's email or FF-20702 blocked; **Premium PT "Quarterly + 12 PT"** → 2 lines ₹8,000 + ₹22,000, 10% off split ₹800 / ₹2,200, two sales reps, client with membership + PT. |
| Ishaan Singh (free trial, 2 before) | T-shirt "(already received)"; no trial packages offered. |
| Ananya Desai (running paid trial) | Convert → adjust ticked + locked, −₹800, start = trial start (set by system), total ₹7,200 on Quarterly. |
| Ira Kapoor (paid trial ended 4 days ago) | CEO / Club Manager: optional adjust (within the 7-day buffer), start = today. Sales Manager: info line only. |
| Ishaan Singh (free trial running) | No adjust at all. |
| Fatima Shaikh (Meta, unassigned) | Gender required; converting user becomes owner; external ID kept; Key fob pending. |
| Nisha Agarwal (Sec 65) | Only 1 fob in Sec 65 stock. |
| Simran Kaur (Golf Course) | Fobs from Golf Course stock. |
| Rajesh Kumar (Lost) | No Convert button. |
| Vivaan / Divya (clients) | No Convert button. |

---

# Book trial (`shared/trial.js`, decision #94)
Work mode in the profile drawer (`App.DrawerMode`, key `trial`), like Convert. Button **Book trial** sits under Convert to Client on a lead and in the
action area of an active client. Permission `trials.book` (scope). Source of every rule: #94, notes v3 §1 Trial, L1–L7, L1b, L1c, L23–L24.

## 1. Screens
| Part | Purpose |
|---|---|
| Book trial mode: Package → Dates → Approval → Payment (paid trial only) → Done | Books one trial for the person; trial summary on the right. |
| Review modal (`App.Trial.review`) | Approver marks Approved / Rejected + remark. Opened from Today "Trial approvals pending". |
| Today section "Trial approvals pending" | For users with `trials.approve`: trials asked from them; CEO sees all (incl. "No approver available"). |
| Profile | Badges "Membership trial" / "PT trial" + approval, or "Trial ended"; NEXT STEP trial lines; Stage dropdown rules. |

## 2. Flow
- **Who gets which**: open lead = Membership trials + PT trials whose package has "Requires an active membership" OFF; active client = PT trials (ON and OFF);
  expired client = no button; lost lead = disabled "Re-open the lead first". Premium PT has no trial.
- **Package**: cards in two groups (Membership trials / PT trials); active trial packages sold at the person's branch. A card is disabled with the reason when a
  trial of that type is already running ("A membership trial is already running"), or the free limit is reached ("2 of 2 free membership trials used",
  "1 free membership trial already at Sec 31"). Limits = Settings values, per trial type, counted by mobile across all records / branches, same for every role,
  no override. Paid trials unlimited ("3rd membership trial"). From the 2nd trial of the same type: amber warning + trial history.
- **Dates**: start today..+30, end = start + days − 1.
- **Approval**: comment required + "Approval asked from" (SM / CM / RM of the person's branch whose role has `trials.approve`; never the CEO). No approver in the
  branch → booking not blocked, status "No approver available".
- **Payment** (paid trial only): full amount at once, method + reference (except Cash), receipt no.; no discount, items, partial or balance.
- **Book**: trial record added (`p.trials[]`, approval Pending), package sold count +1, lead stage = **Trial** (automatic), timeline
  "Paid membership trial booked · Trial Paid 7 Days · 7 days from today · ₹800 paid in full (UPI, receipt S31-000124) · approval asked from Karan",
  notification to the approver, then the shared "Set next follow-up" modal if the person has no open follow-up.
- **Approval**: Today → Review → Approve / Reject (remark required to reject) → recorded on the trial, timeline, notification to the booker. Rejected only
  recorded; the trial keeps running.
- **Trial ended**: badge "Trial ended"; the system creates the owner follow-up "Trial ended · discuss plans" on the end date (due any time) unless an open
  follow-up exists on / after that date. **Mockup-only: created on page load** (`App.Trial.ensureEndedFollowUps`), once per trial.
- **Stage dropdown** (Details tab): New / Contacted / Negotiation (Trial shown read-only while current); disabled while ANY trial runs; unlocked after it ends.
  Re-open (L24): previous stage Trial with no running trial → Negotiation.

## 3. Field table
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Trial package | cards | Yes | — | — | "Choose a trial package." Disabled cards carry the reason. |
| Start date | date | Yes | — | today | Today..+30 days; "Back dates are not allowed." |
| Comment | textarea | Yes | — | — | "A comment is required." |
| Approval asked from | select (SM / CM / RM of the branch with `trials.approve`) | Yes when any exists | — | the only one, if one | "Choose who approval is asked from." |
| Method / Reference | select / text | paid trial | — | first active method | Reference required unless the method says not. |
| Decision (review) | Approve / Reject | Yes | — | — | "Choose Approve or Reject." Remark required to reject. |

## 4. States
- Validation as above; no packages → "No trial packages are sold at <branch> for this person."; a running trial of the type → card disabled.
- Done screen with the approval badge; toast "<Type> trial booked for <name>"; cancel → toast "Trial not booked".
- Today section empty: "No trial approvals waiting".

### Dummy edge cases
| Person | Shows |
|---|---|
| Ishaan Singh (Sec 31) | 2nd free membership trial running, approval Pending (Karan); 1st was Rejected. Membership cards "already running"; PT trial still open. |
| Kunal Bose (Sec 31) | Membership AND PT trial running together (one per type). |
| Ritika Sen (Sec 31) | 2 of 2 free membership trials used (Sec 31 + Sec 65) → free membership trial disabled; paid ones and the free PT trial allowed. |
| Mohit Jain (Golf Course) | Paid 15-day trial, "No approver available" (no SM / CM / RM at Golf Course) → CEO's pending list. |
| Ananya Desai / Ira Kapoor (Sec 65) | Paid trial running / ended 4 days ago (approver Vikram, RM). |
| Divya Nair (client) | Used 2 membership free trials as a lead; can still book a free PT trial. |
| Vivaan Joshi (client) | Books PT trials incl. "PT Trial · 3 Sessions" (clients only). |

### GST with a paid trial adjust (#103, Q27)
GST is worked out on the NET line amount after the trial adjust: ₹20,000 package − ₹800 paid trial = ₹19,200 incl. GST
(GST 5% = ₹914.29). Dummy: Ananya (p6, running paid trial ₹800) + "Half-Yearly Membership" ₹20,000 (pk22).
Premium PT with a free membership: "Monthly + 8 PT (membership free)" (pk21, reference ₹0) → ₹0 membership line, GST only on PT.

### Cross-branch sale (c8, #106)
- Opened from **Sell here** (read-only profile of another branch's lead) or by a cross-branch follow-up holder. Setting "On sale": saving the sale first moves the lead to the seller's branch and makes the seller the owner (old owner's follow-ups closed "Taken over by <branch>"). "Never": owner / branch stay; the seller is the sales rep. Back without saving after Sell here = SellHereCancelled event only.

### PT quotes in Convert (c9, #110, #113)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Packages shown | accordion | — | — | — | Membership: `sales.sellMembership`. PT / Premium PT: only `sales.sellPTDirect` (CEO). Others: hint "ask the CM / MXM for a PT quote". |
| PT quotes | cards | — | — | — | This person's Open quotes (pick) and Expired ones (disabled, "Expired on <date>"). Needs `sales.sellFromQuote`. |
| Locked bill | read-only | — | — | from the quote | Package, Trainer (PT line), price (membership + PT), discount + reason, final, quote by / valid till. "Choose another" un-picks. Only payment, FF ID and key fob are entered. |
| Sales rep | select | Yes | No | you (creator) | Separate from the trainer. |
- Save: PT line `trainerUserId` = the quote's trainer (PT incentive; session trainer until a trainer change); quote → Used (event QuoteUsed). Paid PT trial adjust applies as before.

## 5. Status
Ready for review
