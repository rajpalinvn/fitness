# Convert to Client

> **Real app rule:** the person becomes a client **only when the first payment of a Membership or Premium PT succeeds**
> (decisions #79, #92). Trials (free or paid) are never sold here: they are booked with **Book trial** (c3) and the person stays a Lead (#93).

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Convert to Client stepper (Sell mode in the profile drawer) | `shared/convert.js` → `App.Convert.open(personId)` (uses `App.DrawerMode`) | Turns an open lead into a client with a Membership or a Premium PT (membership + PT). |
| Bill summary | right column of Sell mode (below the steps on tablet) | Checkout-style, sticky, updates live on every step (decision #65). |
| Done screen | same drawer | "<name> is now a client (CL-1003)" + payment note + pending items. |

Steps: **1 Details · 2 Package · 3 Sale & start · 4 Corporate entry · 5 Summary · 6 Payment**.
Step 4 "**Corporate entry: FF ID & key fob**": **FF ID is required** to convert (#93); the key fob can be "Add later" (Key fob pending) — decisions #13, #67, #93.
**Premium PT** (#92): the bill shows 2 lines, "Membership (included)" = reference membership price and "PT" = price − reference; GST per line; the discount is split proportionally; one sales rep per line (both default to the lead owner). The buyer becomes a Client with a membership AND a PT line (sessions unlock per #83).

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
  'Trials are booked with "Book trial"'. **Until c3 there is no way to book a trial in the mockup.**
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
| Price | read-only | — | — | package price | Locked (#14). |
| Discount | [% \| ₹] segmented + amount in one row; live line "Discount ₹2,400 · Final ₹21,600" | No | No | 0, % | Can't be negative or more than the price. **Limit = the role's max % from the Roles & permissions grid** (`sales.discountMax`, #77, #96): SE 10%, SM 20%, CM 30%, RM 50%, CEO 100% (placeholder, Q31). Never "no limit". Applies to the **package only** (note under the row), never accessories or the fob deposit. Premium PT: split proportionally across the two lines ("split ₹800 / ₹2,200"). Over the limit: inline "Your limit is 10%." while typing; Next blocked (#73). |
| Discount reason | select: Festive offer, Referral, Corporate, Staff family, Other | When discount > 0 | No | — | Shown as soon as the amount is above 0. "A reason is needed for a discount." |
| Other reason | text | When reason = Other | No | — | "Write the reason." |
| Sales rep (`salesRepUserId`) | select | Yes | No | lead owner (or you if unassigned) | One rep per sale line (#36). Staff of the lead's branch: Sales Executive, Sales Manager, Club Manager. Premium PT shows two selects: "Sales rep · Membership line" and "Sales rep · PT line", both defaulting to the owner. |

### Step 3 · Sale & start
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Sale type | derived from package | — | — | — | Paid (becomes a Client; next step Corporate entry). Premium PT: "Paid · becomes a Client with membership + PT". |
| Start date | date | Yes | No | today | Today up to 30 days ahead; no back dates (#41). |
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
| Reference / transaction no. (per row) | text | Yes, except Cash | No | — | "Reference no. is needed for UPI." |
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
  "Choose a package.", "FF ID is required to convert …", "Your limit is N%.", "A reason is needed for a discount.",
  "Discount can't be more than the price.", "Back dates are not allowed.",
  "Start can be at most 30 days ahead."
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
| Ananya Desai / Ira Kapoor | Leads on a paid trial (running / ended): NEXT STEP "Paid trial · ends in N days", badge "Trial ended". Convert offered (adjust comes in c3). |
| Fatima Shaikh (Meta, unassigned) | Gender required; converting user becomes owner; external ID kept; Key fob pending. |
| Nisha Agarwal (Sec 65) | Only 1 fob in Sec 65 stock. |
| Simran Kaur (Golf Course) | Fobs from Golf Course stock. |
| Rajesh Kumar (Lost) | No Convert button. |
| Vivaan / Divya (clients) | No Convert button. |

## 5. Status
Ready for review · **Book trial comes in c3** (until then no trial can be booked in the mockup; the paid-trial adjust on Convert also comes in c3).
