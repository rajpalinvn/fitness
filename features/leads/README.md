# Leads list

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Leads list | `index.html` + `leads.js` | Main working list. Staff see every open lead and, above all, when the next follow-up is due. |
| Pipeline cards | (in list) | Counts per group; click = filter the list, click again = clear. Order: **Needs attention** (first), New, Contacted, Trial, Negotiation, Lost. |
| Profile drawer | `shared/profile.js` | Opens on row click. Spec: `features/profile/README.md`. |
| Assign owner modal | `shared/followup.js` | Opens from "Assign" in the Owner cell of an unassigned lead. |
| Add follow-up modal | `shared/followup.js` | Opens from "+ Follow-up" (disabled on Lost rows: "Re-open the lead first"). Spec: `features/followups/README.md`. |
| Quick lead modal | — | Top-bar "+ Lead" (the only one on the page) / "Create lead with this number" show a toast for now (later screen). |

App shell (sidebar, top bar, branch/role menus, Ctrl+K palette) comes from `shared/shell.js` — see decisions #22–23.

## 2. Flow
- Sidebar **Leads** → list (loads with a short skeleton).
- Pipeline card click → sets the stage filter (or the "Needs attention" filter); card is outlined and a "Filtered by" tag appears. Tag X removes that filter.
- Filter dropdowns (stage, owner, source, branch and the "More filters" ones) are styled dropdowns (`App.enhanceSelect`); a filter that is set shows as a highlighted pill.
- Row click → profile drawer; ‹ › step through the current list order. Esc / click outside / close (X) closes it; list stays behind and updates live.
- Ctrl+K palette → Enter on a recent lead → same profile drawer.
- Row actions (max 3; clicking them does NOT open the drawer):
  - Call (phone icon) → toast "Calling …" (mockup)
  - WhatsApp (message icon) → toast (mockup)
  - + Follow-up → add follow-up modal → Save → row, cards and sidebar badges update, toast
- Owner cell "Assign" (unassigned leads only) → assign modal → Assign → row updates, toast.
- No results + search looks like a phone number → "Create lead with this number" (toast for now; later opens quick lead modal prefilled).
- Top-bar branch switcher changes the list's branch filter. "View as role" changes what is visible (placeholder rules below).

## 3. Field table

### List columns
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Name | text | Yes | No | — | Bold. "Meta" badge if the lead was synced (`synced` / `externalId`). Pinned left when the table scrolls. |
| Mobile | country code + number | Yes | Yes (company-wide) | +91 | Shown under name as "+91 90000 01234". |
| NEXT FOLLOW-UP | date-time + derived status | — (system) | No | — | **Most prominent column**, pinned left. Earliest *Open* follow-up of the lead. Status badge (colour + words): **Overdue · N days** (red), **Due today · time** (amber), **Scheduled · Tomorrow / weekday / date** (green), **Not set yet** (red). Follow-up type shown below. Lost leads show "— (lost lead)". |
| Stage | list (configurable) + fixed Converted/Lost | Yes (system) | No | New | Badge. Converted leads are Clients and are not listed. Extra tag "Re-opened" if re-opened. Lost shows "Reason: …". Free trial shows "Free trial · ends in N days". |
| Temperature | Hot / Warm / Cold (fixed) | Yes | No | Warm | Badge with word. |
| Source | list (configurable) | Yes | No | — | |
| Owner (`ownerUserId`) | staff | Yes (except synced leads) | No | Creator (`createdByUserId`, never changes) | Unassigned → amber "Unassigned" badge + **Assign** button. |
| Branch | branch | Yes | No | Current branch | Column shown only when "All branches" is selected. |
| Last activity | date-time (system) | — | No | Created date | Relative: Today / Yesterday / N days ago. |

### Filters
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Search ("Filter: name, mobile, email") | text | No | — | empty | Filters this list only (global search = top bar). Name, email, or mobile. Mobile matches with or without +91 or leading 0 (decision #11). |
| Stage | select | No | — | "Open leads (all stages)" | Default hides Lost. Lost only via Lost card or this filter. |
| Owner | select | No | — | All owners | Includes "Unassigned". |
| Source | select | No | — | All sources | |
| Branch | select | No | — | Top-bar branch | "All branches" shows the Branch column. |
| Temperature | select (More filters) | No | — | Any | |
| Follow-up | select (More filters) | No | — | Any | Overdue / Due today / Scheduled / No follow-up set. |
| Created from / to | date (More filters) | No | — | empty | |
| Synced leads only | checkbox (More filters) | No | — | off | |

"Needs attention" = open lead whose follow-up is overdue or not set (decision #5).
Pipeline card counts use role + branch only (they ignore search and other filters), so "Needs attention" always equals the sidebar Today badge when the list branch matches the top-bar branch (decision #22). Sort: overdue (oldest first) → not set → due today → scheduled (soonest first); Lost by last activity.

### Assign owner modal
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Staff member | select | Yes | No | none | Staff of the lead's branch with role Sales Executive, Sales Manager or Club Manager (assumption). Open follow-ups move to the new owner. |

### Add follow-up modal (placeholder)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Type | chips | Yes | No | none | Follow-up types list. |
| Date | date | Yes | No | tomorrow | |
| Time | time | No | No | 11:00 | `dueTime`, optional. See docs/data-model.md. |
| Note | text | No | No | empty | |
| Assigned to | staff (hidden) | — | — | Lead owner | Decision #7. |

## 4. States
- **Loading:** skeleton rows for ~400 ms on open, and on Retry.
- **Empty (no leads at all):** "No leads yet" + "+ Lead".
- **Nothing visible for role:** Trainer / MXM → "No leads assigned to you".
- **No results:** "No leads match these filters" + "Clear filters"; plus "Create lead with this number" when the search looks like a phone number.
- **Error:** red banner "Couldn't load leads" + Retry.
- **Success:** toasts after Assign and Save follow-up.
- Test toggle for Loading / Empty / Error appears only with `?debug` in the URL (`index.html?debug`).

### Role view (display-only placeholder until the permission matrix)
| View as | Sees |
|---|---|
| Sales Executive (Priya Sharma, Sec 31) | Own leads only |
| Sales Manager / Club Manager (Sec 31) | Leads in their branch |
| Regional Manager (Sec 31 + Sec 65) | Leads in their branches |
| CEO / SuperAdmin | All branches |
| Trainer / MXM | No leads |

### Dummy edge cases (set "View as" CEO + "All branches" to see all)
| Lead | Shows |
|---|---|
| Aarav Patel | Overdue follow-up (red) |
| Sneha Reddy | No follow-up set (red "Not set yet") |
| Kavya Menon | Re-opened tag |
| Ishaan Singh | Free trial, stays a Lead |
| Aditya Bose | Due today (amber) |
| Nisha Agarwal, Simran Kaur | Scheduled (green) |
| Rajesh Kumar | Lost · Price high (Lost card / filter only) |
| Fatima Shaikh | Meta badge + Unassigned + Assign button |

## 5. Status
Ready for review
