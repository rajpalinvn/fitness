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
  | Expired | End date passed; includes a paid trial that ended ("Trial ended", Q26). |
  | Paid trial | Paid trial clients still running. |
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
| Membership | Package name + status badge Active / Renewal due / Expired / Trial ended. |
| PT | "PT 12 Sessions" + "5 of 12 unlocked" (#83) or "—". |
| Balance due | "₹6,600 by 17 Nov 2026" (· PT for a PT balance) or "—". |
| Pending | One small badge per pending item (FF ID pending, Key fob pending, Pending issue · item, Payment due). |
| Sales rep | Sales rep of the membership line (#36). |
| Branch | Only when "All branches" is selected. |
| Actions | Call · WhatsApp · Collect payment or + Follow-up. |

### Who sees what (placeholder, Q8; badge "Placeholder visibility" on the page)
| Role | Clients |
|---|---|
| Sales Executive | Clients of their branch (or where they are the sales rep), same as Today (#61, #62). |
| Sales Manager, Club Manager, Regional Manager | Their branches. |
| CEO, SuperAdmin | Top-bar branch (All = every branch). |
| Trainer, MXM | Hidden: "Clients aren't part of your role". |

## 3. Field table (filters)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Search | text | No | — | empty | Name, mobile (digits, +91 / leading 0 ignored, #11), email, client no, FF ID, key fob no. |
| Membership status | select | No | — | Active + Renewal due | Same as the cards: Needs attention, Active, Renewal due, Expired, Paid trial. |
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
| Ira Kapoor (Sec 65) | Paid trial ended without buying → "Trial ended", in the Expired card (Q26). |
| Ananya Desai (Sec 65) | Paid trial running → Paid trial card. |
| Kabir Malhotra (Sec 31) | PT 5 of 12 unlocked, PT balance ₹6,500 → Collect payment. |
| Zoya Siddiqui (Golf Course) | PT 24 Sessions, 12 of 24 unlocked, PT balance ₹11,000. |
| Vivaan Joshi | Membership balance ₹6,600 by date. |
| Rohit Verma | FF ID + Key fob + Pending issue · T-shirt. |

## 5. Status
Ready for review
