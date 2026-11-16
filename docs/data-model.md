# Data names (for the build team)

Screen text stays the same; these are the names used in `shared/data.js`
and expected in the API. Renamed in round 6.

| Old name | New name | Notes |
|---|---|---|
| `person.type` | `person.kind` | "Lead" \| "Client". One record per person (decision #2). |
| `ownerId` | `ownerUserId` | On person and follow-up. Changes keep `ownerHistory` [{ from, to, at, by }]. |
| — | `createdByUserId` | Never changes. `null` = created by a sync (Meta). |
| `assignedTo` | `assignedUserId` | On WorkTask. |
| `Task` / `tasks` | `WorkTask` / `workTasks` | Data name only; the screen still says "Tasks". |
| follow-up `dueAt` | `dueDate` + `dueTime` | `dueDate` "YYYY-MM-DD" required; `dueTime` "HH:MM" optional (null = any time). Status is by date (decision #24). WorkTask keeps `dueAt`. |

## New fields
| Entity | Field | Notes |
|---|---|---|
| Follow-up | `status` | Open / Done / Cancelled / Closed by system (decision #37). |
| Follow-up | `closeReason`, `closedAt` | Only for Closed by system: Client converted / Lead lost / Client transferred. |
| Person | `freeTrialCount` | Free trials taken (decision #39). |
| Membership (sale line) | `discount`, `discountReason`, `finalPrice`, `salesRepUserId` | One sales rep per line (decision #36). |
| Package | `category`, `subType`, `isTrial`, `people`, `days`, `sessions` | Membership / PT / Add-on. Locked after the first sale (`soldCount` > 0). |
| Package | `priceHistory` [{ `price`, `from` }] | Price incl. GST from a date (`from` "YYYY-MM-DD"). |
| Package | `taxCategoryId`, `requiresMembership`, `branchIds`, `audience`, `active`, `soldCount` | Audience New / Renewal / Both. |
| Package | `freeItems` [{ `itemId`, `qty`, `rule` }] | Rule "Once per client" / "Every sale". |
| Package (derived) | `price`, `saleType`, `type` | Worked out from category, trial and current price. Never typed by hand. |
| Membership (sale line) | `freeItems` [{ `itemId`, `name`, `qty`, `status` }] | Issued / Pending issue / Skipped (Waived later). |
| Person | `freeItemsReceived` [itemId] | For "Once per client". |

## Masters
| Entity | Fields | Notes |
|---|---|---|
| TaxCategory | `id`, `name`, `rate`, `active` | GST rate %. Prices incl. GST. |
| Item | `id`, `name`, `kind` (Accessory / Key fob), `costPrice`, `sellingPrice`, `taxCategoryId`, `active` | One list. Key fob `sellingPrice` = refundable deposit. Return policy fields reserved. |
| ItemStock | `itemId`, `branchId`, `qty` | Accessories only. |
| StockMove | `itemId`, `branchId`, `qty` (+/−), `at`, `by`, `note` | History. |
| KeyFob | `no`, `branchId`, `status`, `personId`, `deposit` { `amount`, `refunded`, `refundReason` }, `history` [{ `at`, `text`, `by` }] | Status In stock / Assigned / Lost / Returned. |

## Sales and payments — real app (decision #88)
The mockup keeps payments on the person (`membership.payment`, `pt.payment`) to stay simple.
**The real app should use separate tables:**

| Table | Fields | Notes |
|---|---|---|
| **Sale** (one checkout) | `id`, `personId`, `branchId`, `soldAt`, `soldByUserId`, `status` (Open / Paid / Partly paid / Cancelled), `totalAmount`, `paidAmount`, `balanceDue`, `balanceDueDate` | One Sell mode = one Sale. A lead becomes a client when the first Payment of its first Sale is saved (#79). |
| **SaleLine** | `id`, `saleId`, `lineType` (Package / Accessory / KeyFobDeposit / AddOn), `packageId` \| `itemId` \| `keyFobNo`, `qty`, `unitPrice`, `discountType` (% / ₹), `discountValue`, `discountAmount`, `discountReason`, `netAmount`, `taxCategoryId`, `gstRate`, `gstAmount` (snapshot), `salesRepUserId`, `isComplimentary`, `complimentaryReason`, `startDate`, `endDate`, `sessions` | GST rate and amount are **snapshots** at sale time (#78). Discount only on Package lines (#77). Free package items can be lines with `isComplimentary` or a child table. |
| **Payment** (receipt) | `id`, `saleId`, `receiptNo` (unique per branch, e.g. S31-000124), `paidAt`, `receivedByUserId`, `totalAmount` | One Sale can have many Payments (first payment + installments via Collect payment). |
| **PaymentRow** | `id`, `paymentId`, `methodId`, `amount`, `reference`, `slipFileId` | Split payment = several rows in one receipt. Reference required unless the method says not (#81). |
| **PaymentAllocation** | `paymentId`, `saleLineId`, `amount` | Allocation order: accessories, then key fob deposit, then the package (#85). PT sessions unlocked = floor(allocated to the PT line / per-session price) (#83). |
| **PaymentMethod** | `id`, `name`, `requiresReference`, `active`, `isDefault` | Settings → Payment methods (#80). |
| **SalesRule** | `minFirstPaymentPct`, discount limit per role (`roleId`, `maxDiscountPct`) | Settings → Sales rules (#77, #85). |
| **ReceiptSequence** | `branchId`, `prefix`, `lastNumber` | Next receipt no. per branch (#81; reset rule open: Q18). |

Mockup mapping: `membership` / `pt` ≈ one Package SaleLine; `membership.items` ≈ Accessory lines;
key fob `deposit` ≈ KeyFobDeposit line; `payment.receipts[].rows` ≈ Payment + PaymentRow; allocation is worked out on screen.
Dates are stored as ISO (`YYYY-MM-DD` or full ISO time) and shown as "12 Nov 2026" (#86).

## Roles, permissions and lead flow (decisions #92–#101)
Mockup names (`shared/data.js`) expected in the API. Not built yet; the screens come with the roadmap items "Roles & permissions" and "Lead flow update".

| Entity | Fields | Notes |
|---|---|---|
| Role (`roles`) | `key` (SUPER_ADMIN … FINANCE), `name`, `short`, `reportsTo` (role key or null), `multiBranch` (bool) | Seeded, locked rows (#95). Code and the grid use `key`, never the row id. |
| Staff (user) | `roleKey` (exactly one), `branchIds` [branchId] (exactly 1 for single-branch roles), `trainerTypeId` (Trainer only) | One role per staff (#95). |
| TrainerType (`trainerTypes`) | `id`, `name`, `short` (GT / PT / GT-PT), `canTakePt` (default true), `active` | Admin master list (#95). PT session / sale line stores `trainerTypeId` + `trainerTypeShort` as a snapshot. |
| Permission (`permissions`) | `roleKey` × `key` (dotted, e.g. `leads.view`, `leads.assign`, `trials.book`) → `scope` (None / Own / Branch / All) or `value` (number, e.g. max discount %) or `allowed` (bool) | Settings → Roles & permissions (#96). Changes go to the audit log (who, when, old → new). |
| Setting (`settings`) | `key` → `value` | `freeTrialsPerPerson` 2, `freeTrialsPerBranch` 1, `paidTrialAdjustBufferDays` 7, `inactivityReleaseDays` 7, `releaseWarnDaysBefore` 1, `newLeadAssignment` Manual / RoundRobin (#96). |
| Package | `category` adds **Premium PT**; `referenceMembershipPrice` (required for Premium PT) | At sale a Premium PT splits into a membership line (= reference price) and a PT line (= the rest) (#92). |
| Trial sale line | `approvalStatus` (Pending / Approved / Rejected), `approverUserId`, `approvalComment` (booking comment), `approvalRemark`, `approvedAt` | Trial approval = pending reference (#94). Paid trial adjust: `adjustedTrialLineId` on the membership line. |
| Follow-up | `assigneeUserId` | Can differ from the lead's `ownerUserId` (#97). Default = owner. |
| Lead (person) | `unassignedReason` (New / Released, null when owned), `releaseWarnedAt` | Unassigned when `ownerUserId` is null (#100). |
| Follow-up / WorkTask | `closeReason` adds "Owner changed", "Released (inactive)" | #99, #100. |

