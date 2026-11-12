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
