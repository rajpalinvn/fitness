# Clients list

List-first, like Leads (decision #91). Built on the same shared drawer and modals; no new forms.

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Clients list | `index.html` + `clients.js` | All clients the user may see: pipeline cards, filters, table. |
| Profile drawer | `shared/profile.js` | Row click opens it on the **Membership** tab, ‹ › through the current list order. |
| Collect payment modal | `shared/profile.js` → `App.collectPayment(personId, "membership" \| "pt")` | Row action when there is a balance. |
| Add follow-up modal | `shared/followup.js` → `App.Followup.openAdd` | Row action when there is no balance. |

## 2. Flow
- Sidebar **Clients** → this page. Today's "Clients with pending items" **View all** → `?view=attention` (Needs attention selected).
- **Pipeline cards** (click = filter, click again = clear). Counts follow role + top-bar branch only:
  | Card | Rule |
  |---|---|
  | Needs attention (first) | Any pending item: Payment due, FF ID pending, Key fob pending, Pending issue. Same helper as Today (`App.profilePending`, #61, #67, #82), so the number equals Today's "Clients with pending items". |
  | Active | More than 15 days left (#27, #31). |
  | Renewal due | 15 days or fewer left. |
  | Expired | End date passed. (Paid trials are leads, #92: they never appear on this list.) |
- **Default view**: Active + Renewal due. Expired only via its card or the status filter (like Lost on Leads, #21).
- **Sort**: Needs attention first, then fewest days left.
- **Row click** (not on a button) → profile drawer, Membership tab. **Row actions** (max 3, don't open the drawer): Call, WhatsApp,
  and **Collect payment** when the client has a balance (membership first, then PT), otherwise **+ Follow-up**.
- After any action the list, cards, Today and the sidebar update together.
- Renewal ("Renew", renewal follow-ups) is NOT on this screen; it comes next (roadmap).

### Columns
| Column | Shows |
|---|---|
| Name & mobile (pinned) | Name, Meta badge if synced, mobile · client no. |
| ENDS ON (pinned, most prominent) | "12 Nov 2026" (#86) + badge "N days left" / "Ends today" / "Expired N days ago" (colour + words). |
| Membership | Package name + status badge Active / Renewal due / Expired. Premium PT clients show "<package> · Membership (included)". |
| PT | "PT 12 Sessions" + "5 of 12 unlocked" (#83) or "—". |
| Balance due | "₹6,600 by 17 Nov 2026" (· PT for a PT balance) or "—". |
| Pending | One small badge per pending item (FF ID pending, Key fob pending, Pending issue · item, Payment due). |
| Sales rep | Sales rep of the membership line (#36). |
| Branch | Only when "All branches" is selected. |
| Actions | Call · WhatsApp · Collect payment or + Follow-up. |

### Who sees what (grid row `clients.view`, decision #96)
Scope from Settings → Roles & permissions: default SE / SM / CM / RM = Branch (their branches), CEO = All, Trainer / MXM / Finance = None
("Clients aren't part of your role"). Row actions Collect payment / pending items follow `clients.collectPayment`. Defaults: docs/permissions.md.

## 3. Field table (filters)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Search | text | No | — | empty | Name, mobile (digits, +91 / leading 0 ignored, #11), email, client no, FF ID, key fob no. |
| Membership status | select | No | — | Active + Renewal due | Same as the cards: Needs attention, Active, Renewal due, Expired. |
| Sales rep | select | No | — | All | Users who are a sales rep on a membership. |
| Branch | select | No | — | top-bar branch | Follows the top-bar branch switcher. |
| Has PT (More filters) | checkbox | No | — | off | Clients with a PT line. |
| Balance due (More filters) | checkbox | No | — | off | Membership or PT balance > 0. |
| Pending item (More filters) | select | No | — | Any | FF ID pending / Key fob pending / Pending issue / Payment due. |
| Joined from / to (More filters) | date ("12 Nov 2026") | No | — | — | By `joinedAt`. |

## 4. States
- **Normal**: cards + table; tablet: sidebar icons, Sales rep / Branch move into More filters, table scrolls in its own box.
- **Empty** (`?debug` → Empty): "No clients yet · Clients appear here when a lead is converted and the first payment is saved."
- **No results**: "No clients match these filters" + Clear filters.
- **Loading**: skeleton rows (400 ms in the mockup). **Error** (`?debug`): "Couldn't load clients." + Retry.
- **No access**: Trainer / MXM note.

### Dummy edge cases
| Client | Shows |
|---|---|
| Divya Nair (Sec 31) | Renewal due · 3 days left. |
| Sameer Khan (Sec 65) | Renewal due · 12 days left. |
| Pallavi Rao (Golf Course) | Expired 5 days ago. |
| Tarun Mehra (Sec 31) | Expired 60 days ago. |
| Ananya Desai, Ira Kapoor (Sec 65) | NOT on this list: leads on a paid trial (running / ended), see Leads. |
| Kabir Malhotra (Sec 31) | PT 5 of 12 unlocked, PT balance ₹6,500 → Collect payment. |
| Zoya Siddiqui (Golf Course) | PT 24 Sessions, 12 of 24 unlocked, PT balance ₹11,000. |
| Vivaan Joshi | Membership balance ₹6,600 by date. |
| Rohit Verma | FF ID + Key fob + Pending issue · T-shirt. |

### Expired vs Ex-client (#103, Q25)
- Status by the LAST package end = later of membership end and PT end (add-ons ignored): Active (> 15 days), Renewal due (<= 15),
  **Expired** for N days after it (counts in renewals), then **Ex-client** (own card "Ex-client · no active package" and status filter; out of the default list and renewals).
- N = Settings value "Ex-client after" (default 30 days, CEO only; Settings › Roles & permissions › Settings values).
- Ends-on column shows the last end; when membership and PT end on different days: "Membership 6 Dec 2026 · PT 4 Feb 2027". Ex-client badge: "Ex-client · ended 45 days ago".
- Dummy: p21 Pallavi Expired 5 days · p22 Tarun (60 days) and p39 Rekha (45 days) Ex-client · p40 Nikhil membership ended 5 days ago, PT runs 40 more → Active.

### Renewal per package, PT on hold (c6)
- "Renewal due" card / filter = clients with ANY package (membership or PT) <= 15 days; badges "Membership renewal due · 12 days" / "PT renewal due · N days". Expired / Ex-client stay client level (later end).
- PT column: "5 of 12 unlocked · 5 usable now"; membership expired while PT runs: "PT on hold · membership expired · 12 of 12 unlocked".
- Dummy: p18 Kabir (membership 12 days, PT longer), p40 Nikhil (membership expired, PT on hold).

## 5. Status
Ready for review
