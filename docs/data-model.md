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
| Package | `sessions`, `people` | PT sessions; 2 = couple. |
