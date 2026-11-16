# Settings

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Settings page | `index.html` + `settings.js` | Sidebar → Settings. Display preferences (live) and Club setup. |
| Display | (in page) | Per-user preferences. Applied by `shared/shell.js` on every page (decision #35). |
| Club setup cards | (in page) | **Live:** Packages, Items & stock, Key fobs, Tax categories, Sales rules, Payment methods, Roles & permissions (links). **Coming soon:** Lead sources, Follow-up types, Lost reasons, Lead stages. |
| Packages | `packages.html` + `packages.js` | See "Packages" below. |
| Items & stock | `items.html` + `items.js` (`?tab=items`, `stock`, `fobs`, `tax`) | See "Items & stock" below. |
| Shared admin helpers | `admin.js` | Form drawer, access banner, debug states. |

## 2. Flow
- Click a preset → applies immediately (all pages, this session) → toast. "Reset to default" restores all presets.
- "Preview a profile" opens Aarav's profile drawer to check the drawer width.
- How it works: `App.setPref(key, value)` stores the choice and sets `data-drawer`, `data-density`, `data-text`, `data-search` on `<html>`; `tokens.css` switches token values for each preset. Pages need no changes.
- Sidebar default: used when the page loads, unless the sidebar was toggled this session. Changing it applies right away on desktop.

## 3. Field table
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Drawer width | preset | Yes | — | 70% | 60% / 70% / 80% / 92%. Tablet always ≥ 92%. |
| Density | preset | Yes | — | Comfortable | Compact / Comfortable / Spacious (switches the spacing tokens). |
| Text size | preset | Yes | — | Medium | Small / Medium / Large (switches the font-size tokens). |
| Search bar width | preset | Yes | — | Medium | Narrow 300px / Medium 440px / Wide 580px; expands +220px when open. |
| Sidebar default | preset | Yes | — | Expanded | Expanded / Collapsed (desktop). Tablet always starts collapsed. |

Storage: session storage key `mock.prefs` in the mockup; per-user settings in the real app.

## 4. States
- **Normal**: current preset highlighted (colour + "(default)" label on the default option).
- **Success**: toast after each change and after reset.
- **Empty / loading / error**: not applicable (local presets). Club setup sections show "Coming soon".

## 5. Status
Display: Ready for review. Packages, Items & stock: Ready for review. Other club setup: Draft (coming soon).

---

# Packages (decisions #20, #45–#47, #49–#52, #56)

## 1. Screens
| Screen / part | Purpose |
|---|---|
| Packages list | Tabs All / Membership / PT / Add-on with counts; filter by name, branch, status. |
| Package form drawer | Create, edit, view (managers) or "Copy as new". |

## 2. Flow
- Settings → **Packages** card. Breadcrumb "Settings / Packages" goes back.
- **+ Package** (SuperAdmin, CEO) → empty form, category = current tab.
- Row click or **Edit** → form. Managers see **View** and a read-only form.
- **Copy as new** (row icon, or the link inside a sold package) → form prefilled, name "… (copy)", sold count 0; nothing is saved until Save.
- Save → drawer closes, toast (a future price says "new price ₹8,500 from <date>"), list updates.
- Esc, X, Cancel or outside click close the drawer without saving.

## 3. Field table
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Category | Membership / PT / Add-on | Yes | No | current tab (Membership) | Locked after the first sale. |
| Sub-type / Add-on kind | select | Add-on only | No | Not set (Add-on: Transfer) | Membership: Regular, Student, Corporate, Premium; PT: One-on-one, Group (admin lists). Add-on kinds fixed in code. |
| Name | text | Yes | Yes | — | "A package with this name already exists." |
| Trial | Yes / No | Yes (not Add-on) | No | No | Locked after the first sale. |
| People | Single / Couple | PT | No | Single | Couple PT: both must be clients with an active membership (#43). Locked after the first sale. |
| Days | number ≥ 1 | Yes (not Add-on) | No | — | Locked after the first sale. |
| Sessions | number ≥ 1 | PT | No | — | Locked after the first sale. |
| Price incl. GST | money ≥ 0 | Yes | No | — | Hint "Includes GST ₹50 (5%) · base ₹1,000". 0 only for a trial or an Add-on. |
| GST category | select (tax master) | Yes | No | Gym services | Active categories only. |
| Price effective from | date | Yes | No | today | A new price can't start in the past. Price history table (Current / Upcoming / Past). |
| Audience | New / Renewal / Both | Yes | No | Both (default, can change) | Renewal-only packages are not offered when converting a lead. |
| Branches | multi-select chips | Yes (≥ 1) | No | all branches | |
| Requires active membership | checkbox | — | — | on for PT | Always on for PT. |
| Free items | rows: accessory + qty + rule | No | item once per package | — | Rule "Once per client" (default) / "Every sale" (default, can change). Not for Add-ons. |
| Active | checkbox | — | — | on | Inactive packages can't be sold. |
| Result | derived box | — | — | — | Free trial · stays a Lead (amber) / Paid trial · becomes a Client / Paid · becomes a Client (green) / "Not allowed · A price of 0 is only allowed for a trial." (red). |

## 4. States
- **Loading**: skeleton rows (`?debug` → Loading). **Error**: "Couldn't load this list" + Retry. **Empty**: "No packages yet" + Package button. **No results**: "No packages match these filters" + Clear filters.
- **View only** (managers): banner "View only … Placeholder"; no + Package, no Copy, read-only form.
- **No access** (other roles): "You don't have access to packages".
- **Locked** (sold): amber callout "Sold N times. … are locked" + Copy as new; locked fields disabled with "Locked: sold".
- **Validation**: "Enter a name.", "Enter the number of days (1 or more).", "Enter the number of sessions.", "Enter a price (0 or more).", "A price of 0 is only allowed for a trial.", "A new price can't start in the past.", "Choose at least one branch.", "Each free item can be added once."

### Dummy edge cases
| Package | Shows |
|---|---|
| Annual Membership | Sold 8 times (locked); free items T-shirt (once per client; out of stock at Sec 31 → Pending issue) + Gym towel (every sale). |
| Monthly Membership | Upcoming price ₹3,300 from 20 days ahead; 3-entry price history. |
| Student Monthly | Never sold → fully editable; New clients only; Sec 31 + Sec 65. |
| Summer Monthly 2025 | Inactive. |
| Couple PT 12 Sessions | PT · Couple · Needs membership. |
| Branch transfer | Add-on · Transfer · free. |
| Renewal Annual Offer | Renewals only (hidden in Convert). |

## 5. Status
Ready for review

---

# Items & stock (decisions #49, #53–#56)

## 1. Screens
| Tab | Purpose |
|---|---|
| Items | ONE list: accessories, free items and the key fob. Form drawer. |
| Accessory stock | Quantity per accessory per branch; Stock in; History. |
| Key fobs | Fob numbers per branch, status, client, deposit; Add fobs, History, Refund deposit. |
| Tax categories | GST rates used by packages and items. Modal form. |

## 2. Flow
- Settings cards open a tab directly (`items.html?tab=fobs`); tabs keep the URL in sync.
- Branch scope for stock and fobs = top-bar branch, limited to the branches the role manages; with several branches a Branch column shows.
- Items: **+ Item** / Edit (admin) or View → drawer. Stock: **Stock in** (header or row) → modal; **History** → modal. Key fobs: **Add fobs** → modal (one number / range, live preview); **History** → modal; **Refund deposit** (Returned fobs with deposit left) → modal; client name → profile drawer. Tax: **+ Tax category** / Edit → modal.

## 3. Field table

### Item
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Name | text | Yes | Yes | — | |
| Kind | read-only | — | — | Accessory | One Key fob item exists; new items are accessories. |
| Cost price | money ≥ 0 | Yes | No | — | |
| Selling price incl. GST (Key fob: Refundable deposit) | money > 0 | Yes | No | — | Admin only (others see "Admin only"). Warning "Selling below cost." |
| GST category | select (tax master) | Yes | No | Goods 18% | |
| Active | checkbox | — | — | on | |
| Return / refund policy | reserved | — | — | Not set yet | Disabled, "Reserved · not used yet". |

### Stock in
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Item | select (active accessories) | Yes | — | row item | |
| Branch | select (your branches) | Yes | — | row branch | |
| Quantity received | whole number ≥ 1 | Yes | — | — | |
| Note | text | No | — | "Stock in" | Shown in History. |

### Add key fobs
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Branch | select (your branches) | Yes | — | first in scope | |
| Add | One number / A range | Yes | — | A range | |
| From / Fob number, To | text | Yes | Yes, company-wide | — | Same prefix, digits at the end, up to 500. Preview "9 fobs will be added · 2 already exist and will be skipped: …". |

### Refund deposit
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Refund | Full / Partial | Yes | — | Full | Full = what is left. |
| Amount | money | Partial | — | — | At most what is left. |
| Reason | text | Yes | — | — | Goes to the fob history. |

### Tax category
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Name | text | Yes | Yes | — | |
| GST rate (%) | number 0–100 | Yes | No | — | Changing it changes only the GST split; prices incl. GST stay. |
| Active | checkbox | — | — | on | Inactive stays on existing packages/items, not offered for new ones. |

## 4. States
- **Loading / Error / Empty** via `?debug` on every tab. Empty: "No items yet", "No accessories yet", "No fobs at this branch", "No tax categories yet". No results (fobs filter): "No fobs match" + Clear filters.
- **No access**: masters (Items, Tax) for non-managers; stock and fobs below Club Manager. "None of your branches is selected" when the top-bar branch isn't one of yours.
- **Stock**: 0 → red "Out of stock" (colour + words).
- **Success**: toasts ("T-shirt: +10 at Sec 31 · now 10", "9 fobs added to Golf Course · 2 skipped", "Refunded ₹600 · KF-S65-0102").

### Dummy edge cases
| Data | Shows |
|---|---|
| T-shirt at Sec 31, Shaker bottle at Sec 65 | Out of stock. |
| Gym bag | Inactive item. |
| KF-S31-0009 | Lost, deposit forfeited (no refund). |
| KF-S65-0102 | Returned, ₹600 of ₹1,200 refunded ("Strap damaged"), ₹600 left to refund. |
| KF-S31-0012 | Assigned to Vivaan, deposit held. |
| Range KF-GC-0195 → KF-GC-0205 | 2 overlap existing (0201, 0202) → skipped. |

## 5. Status
Ready for review

---

# Settings → Sales rules (`sales.html`)
Decisions #77, #80 (Default, can change). Placeholder access (#56): SuperAdmin and CEO edit; Regional Manager,
Club Manager, Sales Manager view only; others "You don't have access to sales rules".

## 1. Screens
| Screen | File | Purpose |
|---|---|---|
| Discount limits tab | `sales.html?tab=limits` + `sales.js` | Max discount % per role, used by Sell mode. |
| Payment methods tab | `sales.html?tab=methods` | Methods offered in the Payment step. |

## 2. Flow
Settings → card "Sales rules · Discount limits" or "Payment methods" → tab. Limits save on change (toast).
Methods: **+ Payment method** opens an inline form (name, reference required); the switch enables / disables a method.

## 3. Field table
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Minimum first payment on packages | number % | Yes | — | 30 | 0–100. At conversion: accessories + fob deposit in full + this % of the package after discount (#85). Not used for later installments. |
| Max discount (per role) | number % | Yes | — | SE 10, SM 20, Club Manager 30, Regional Manager 50, CEO 50, SuperAdmin 100, Trainer 0, MXM 0 | 0–100 ("Max discount must be between 0 and 100%."). "Changed" badge when it differs from the default. Package only. |
| Payment method name | text | Yes | Yes (case-insensitive) | Cash, UPI, Net banking, Card | "Enter a name." / "This method already exists." |
| Reference no. required | switch | — | — | On (Cash: off) | Payment step asks for a reference when on. |
| Active | switch | — | — | On (Cheque: off, dummy) | At least one method stays active. Online payment (gateway) later. |

## 4. States
Normal; view only; no access; `?debug` loading / empty / error (same bar as other Settings pages).

## 5. Status
Ready for review

---

# Settings → Roles & permissions (`roles.html`)
Decisions #95, #96, #102. Source of every row, default and rule: `docs/meeting/lead-client-notes-v3.md` §2a / §2; key list: `docs/permissions.md`.
Access: **CEO only** (grid row `settings.rolesPermissions`, locked). Everyone else sees "You don't have access".

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Permissions tab | `roles.html?tab=permissions` + `roles.js` | The grid: 24 actions grouped by module (Leads, Trials, Sales, Clients, Settings) × 8 tenant roles (CEO, RM, CM, SM, SE, MXM, TR, FIN). |
| Settings values tab | `?tab=values` | 6 numbers / choices (free-trial limits, adjust buffer, inactivity days, warning days, new-lead assignment). |
| Roles tab | `?tab=roles` | Read-only: the 8 fixed tenant roles, short, key, reports to, single / multi branch, staff count. |
| Trainer types tab | `?tab=trainers` | Admin master list (GT, PT, GT-PT); add / edit in the shared form drawer. |
| Audit log tab | `?tab=audit` | Every saved change: who, when, tab, what, old → new; newest first; filter by tab. |
| Shared helpers | `shared/app.js` → `App.Perm`, `App.can(key)`, `App.setting(key)` | Defaults from `DUMMY.permissionDefs` / `settingDefs` + session-storage overrides (`mock.perms`, `mock.settings`, `mock.trainerTypes`, `mock.audit`), same pattern as Display prefs. |

## 2. Flow
- Settings → card **Roles & permissions** → Permissions tab.
- **Cell** = compact chip with the current value ("Branch", "✓ Yes", "20%", "—" for None / No). Click, Enter or Space opens a small popover
  (scope list, Yes / No, or a number input + OK); Esc or outside click closes it. Changed cells are highlighted; a sticky bar shows
  "N changes · Discard · Save". **Save** opens a confirm listing role · action · old → new, then a short "Saving…" state, toast, audit entries.
- **Locked cells** (lock icon + tooltip, cannot change): the whole CEO column ("CEO has every permission"); the row "Roles & permissions"
  for every role ("Only CEO can edit"); in `leads.view` the option None is disabled for CEO / RM / CM / SM / SE ("an owner can always
  see and log follow-ups on their own leads"). CEO max discount 100% is locked with the column (placeholder, Q31).
- **Validation**: at least one role besides CEO keeps `leads.assign` (inline error in the bar, Save disabled); discount = whole number 0–100.
- **Reset all to defaults** (confirm) clears the session overrides and logs each reverted cell.
- **Settings values**: each field shows "Default N · Changed by: <roles that have the grid row>" (values with no grid row: "CEO").
  Validation on input: whole numbers; per person 0–10; per branch 0–10 and ≤ per person; adjust buffer 0–30 days; inactivity 1–90 days;
  warning 0–89 and < inactivity days. Round-robin is shown disabled "Later" (Q10). Same save bar / confirm / audit as the grid.
- **Trainer types**: + Trainer type / Edit open the shared form drawer (name*, short code*, can take PT sessions, active). Name and short
  are unique. A type in use (a trainer has it) has no Delete, only Deactivate / Activate; an unused type can be deleted (confirm).
- **Audit log** records Permissions, Settings values and Trainer types changes. "Who" = the View-as demo user; session only.
- Existing screens are NOT rewired to `App.can` yet (roadmap: Lead flow update). Hard-coded role checks still live in:
  `shared/app.js` (`App.access.*`, `App.canSee`), `shared/profile.js` (`canWaive`), `features/today/today.js` (`pendingRole`),
  `features/leads/leads.js` (Trainer / MXM check), `features/clients/clients.js` (`noLeadsRole`), `features/settings/sales.js` /
  `packages.js` / `items.js` (via `App.access`), plus `DUMMY.discountLimits` on the Sales rules page (duplicate of `sales.discountMax`).

## 3. Field table
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Permission cell (scope) | chip → popover: None / Own / Branch / All | Yes | — | docs/permissions.md | CEO locked All; `leads.view` floor Own for lead-owning roles. |
| Permission cell (tick) | chip → Yes / No | Yes | — | docs/permissions.md | CEO locked Yes; `settings.rolesPermissions` locked for all. |
| Max discount % | chip → number 0–100 | Yes | — | CEO 100, RM 50, CM 30, SM 20, SE 10, others 0 | "Enter a whole number between 0 and 100." |
| Search actions | text | No | — | empty | Filters rows by label or key. |
| Free trials per person | number 0–10 | Yes | — | 2 | Whole number. |
| Free trials per branch | number 0–10 | Yes | — | 1 | ≤ per person: "Per branch can't be more than per person (N)." |
| Paid trial adjust buffer | number 0–30 days | Yes | — | 7 | Changed by CEO. |
| Inactivity release after | number 1–90 days | Yes | — | 7 | Changed by roles with `settings.editInactivity`. |
| Warn the owner before release | number 0–89 days | Yes | — | 1 | < inactivity days: "Must be less than the inactivity days (N)." |
| New-lead assignment | Manual / Round-robin | Yes | — | Manual | Round-robin disabled "Later" (Q10). |
| Trainer type name | text | Yes | Yes (case-insensitive) | — | "Enter a name." / "This name already exists." |
| Trainer type short code | text ≤ 8 | Yes | Yes | — | Stored upper-case. |
| Can take PT sessions | switch | — | — | On | Type only changes the payout (#95). |
| Active | switch | — | — | On | In-use types can only be deactivated. |

## 4. States
- Normal; **no access** (every role but CEO); `?debug` → loading skeleton, error + Retry.
- Saving ("Saving…" in the bar) → saved toast "Saved · N changes"; validation errors inline (bar + field); no results for the action search;
  empty audit log "No changes yet"; empty trainer types.
- Tablet (900px): the grid scrolls inside its own box (sticky first column + header); the page has no sideways scroll.

### Dummy edge cases
| Case | Shows |
|---|---|
| CEO column | Every cell locked, All / Yes / 100%. |
| Finance (Nisha Bhatia, Sec 65) | Column of "—" (None), editable; appears in View as. |
| Trainer types in use | PT (Deepak), GT-PT (Sanjay): no Delete. GT unused: Delete allowed. |
| Audit "who" | Anita Kapoor (CEO) when viewing as CEO. |

## 5. Status
Ready for review

