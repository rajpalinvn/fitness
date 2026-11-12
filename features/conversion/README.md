# Convert to Client

> **Real app rule:** the person becomes a client **only when payment succeeds**
> ("money taken = client", decision #3). The mockup converts on
> "Proceed to Payment" because Payment is a later module (decision #48).

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Convert to Client stepper (Sell mode in the profile drawer) | `shared/convert.js` → `App.Convert.open(personId)` (uses `App.DrawerMode`) | Turns an open lead into a client, or books a free trial (stays a lead). |
| Bill summary | right column of Sell mode (below the steps on tablet) | Checkout-style, sticky, updates live on every step (decision #65). |
| Done screen | same drawer | "<name> is now a client (CL-1003)" + payment note + pending items. |

Steps: **1 Details · 2 Package · 3 Sale & start · 4 Corporate entry · 5 Summary**.
Step 4 "**Corporate entry: FF ID & key fob**" only appears for a Paid **Membership** package (decisions #13, #20, #67).

Layout (decision #65): steps on the LEFT, sticky **Bill summary** on the RIGHT:
person (name, mobile, branch) · package line (price) · discount + reason (+ "Package after discount") ·
free items (Free, with Issued / Pending issue / Skipped) · key fob deposit (or "Key fob · Pending") ·
**GST included** (price is incl. GST; package tax category rate, deposit at the Key fob item's rate) · **Total to pay**.
Before a package is chosen: "Choose a package to see the bill." Tablet: the bill moves below the steps.

## 2. Flow
- Profile drawer (open lead) → **Convert to Client** → the drawer itself switches to wide
  **Sell mode** (decision #64): header "<Name> › Convert to client" with **Back**; width = the
  larger of the user's drawer width and 80% (tablet 92%). Not a modal.
  Lost leads have no button (re-open first). Clients have no button (upgrade / renewal later).
- Previous / Next move between steps; Next validates the current step. Back (header),
  Cancel (step 1), Esc or outside click return to the profile with the toast
  "Conversion not saved"; nothing is saved.
- **Free trial** → "Book free trial" → stays a **Lead**, stage Trial, timeline
  "Free trial booked · 1 day from today · 3rd free trial". If the lead has no open
  follow-up, the shared "Set next follow-up" modal opens (type Visit planned).
- **Paid trial / Paid** → "Proceed to Payment" →
  - person `kind` = Client, stage Converted, next client no (CL-1003, CL-1004 …),
    home branch = lead branch, joined today;
  - membership line saved with package, sale type, start, end, price, discount + reason,
    final price, sales rep;
  - key fob (if picked) → status Assigned, branch stock −1;
  - open follow-ups → **Closed by system · Client converted**, owners notified (decision #37);
  - timeline: "Converted to Client · Annual Membership · ₹21,600 (₹2,400 off: Diwali offer) · key fob KF-S31-0013 · sales rep Priya";
  - unassigned lead → converting user becomes owner (owner history kept);
  - done screen → **Done · back to profile**. The drawer leaves Sell mode and shows the client view on the Membership tab,
    link becomes `#client-<name>`, the row leaves the Leads list, counts and badges update.
- After a Paid membership: NEXT STEP shows **FF ID pending** and **Key fob pending**
  separately until filled (decision #40). Paid trial shows neither.

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
| Package | cards in accordions (+ / −) Free trial / Paid trial / Membership / Personal training, count per group; first group with packages open | Yes | No | none | Only active packages sold at the lead's branch with audience New or Both; no Add-ons (#57). Price = current price from the price history. PT disabled: "PT needs an active membership" (#20). Couple package converts this person only (partner later). Free trial again → warning "This is their Nth free trial" (#39, warning only). Card shows "Free: T-shirt, Gym towel"; a "Once per client" item the person already got shows "(already received)" and is Skipped in the bill. |
| Price | read-only | — | — | package price | Locked (#14). |
| Discount | % or ₹ chips + number | No | No | 0, % | Not shown for free packages. Can't be negative or more than the price. **Limit by role — PLACEHOLDER:** Sales Executive 10%, Sales Manager 20%, others no limit (admin settings later). Over the limit: "Your limit is 10%." |
| Discount reason | text | When discount > 0 | No | — | "A reason is needed for a discount." |
| Sales rep (`salesRepUserId`) | select | Yes (paid packages) | No | lead owner (or you if unassigned) | One rep per sale line (#36). Staff of the lead's branch: Sales Executive, Sales Manager, Club Manager. |

### Step 3 · Sale & start
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Sale type | derived from package | — | — | — | Free trial (stays a Lead) / Paid trial (becomes a Client, no fob) / Paid (becomes a Client; next step Corporate entry). |
| Start date | date | Yes | No | today | Today up to 30 days ahead; no back dates (#41). |
| Ends | derived | — | — | — | Start + days − 1 ("365 days, start day included"). Overlap check (#41) applies to clients; a lead has no membership yet. |

### Step 4 · Corporate entry: FF ID & key fob (Paid membership only)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| FF ID | text | No (here) | Yes, company-wide | lead FF ID | From the corporate software; usually added later. Empty → "FF ID pending". Duplicate: same branch "Already used by <name>"; other branch "Already exists in <branch> · Owner: <first name>" + Request access. |
| Key fob | chips from the lead branch's stock + "Add later" | No (here) | Yes | Add later | Shows "<branch> stock: N in stock". No stock → message and the conversion can finish; "Key fob pending" shows. |

### Step 5 · Summary
Read-only list: person, package, sale type, start – end, sales rep, discount reason,
Corporate entry (FF ID / key fob or "Pending"), owner (if it was unassigned), and how many open
follow-ups will be closed by system. All money (price, discount, free items, ₹1,200 key fob deposit as its own
refundable line, GST included, Total to pay) is in the bill summary. Button: **Proceed to Payment** or **Book free trial**.

## 4. States
- **Validation**: "Choose a gender.", "Check the email format.", duplicate messages,
  "Choose a package.", "Your limit is N%.", "A reason is needed for a discount.",
  "Discount can't be more than the price.", "Back dates are not allowed.",
  "Start can be at most 30 days ahead."
- **Empty**: no fobs in stock → warning callout, finish without fob.
- **Loading / error**: none in the mockup (real app: payment in progress / payment failed
  are handled by the Payment module; the lead stays a lead on failure).
- **Success**: done screen + toast "<name> is now a client (CL-1003)"; free trial toast
  "Free trial booked for <name>".

### Dummy edge cases
| Person | Shows |
|---|---|
| Aarav Patel (overdue) | Paid Annual with 10% discount + fob KF-S31-0013; overdue follow-up closed by system; FF ID pending. |
| Sneha Reddy (no email) | WhatsApp-receipts hint; Aarav's email or FF-20431 blocked; Trial Paid 7 Days → client, no fob step. |
| Ishaan Singh (free trial, 2 before) | Free trial again → "This is their 3rd free trial"; stays a Lead. |
| Fatima Shaikh (Meta, unassigned) | Gender required; converting user becomes owner; external ID kept; FF ID + Key fob pending. |
| Nisha Agarwal (Sec 65) | Only 1 fob in Sec 65 stock. |
| Simran Kaur (Golf Course) | Fobs from Golf Course stock. |
| Rajesh Kumar (Lost) | No Convert button. |
| Ananya / Vivaan (clients) | No Convert button. |

## 5. Status
Ready for review
