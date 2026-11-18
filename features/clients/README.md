# Clients list

This list works like Leads: the user stays on the list (decision #91). It uses the shared drawer and modals and adds no new forms.

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Clients list | `index.html` + `clients.js` | All clients the user may see: pipeline cards, filters, table. |
| Profile drawer | `shared/profile.js` | A row click opens it on the **Membership** tab. ‹ › move through the current list order. |
| Collect payment modal | `shared/profile.js` → `App.collectPayment(personId, "membership" \| "pt")` | Row action when the client has a balance. |
| Add follow-up modal | `shared/followup.js` → `App.Followup.openAdd` | Row action when the client has no balance. |

## 2. Flow
- Sidebar **Clients** opens this page. On Today, **View all** under "Clients with pending items" opens `?view=attention` with Needs attention selected.
- **Pipeline cards**: a click filters the list, a second click clears it. Counts use only the role and the top-bar branch.

### Status rules
There are two levels of status:
- **Client level** uses the LAST package end, which is the later of the membership end and the PT end (add-ons are ignored; #31, #103 Q25).
  - Active: the last end has not passed.
  - Expired: the last end passed fewer than N days ago. The client still counts in renewals.
  - Ex-client: the last end passed N or more days ago. N is the Settings value "Ex-client after" (default 30 days, CEO only).
- **Package level**: each package (membership, PT) has its own status: Active (more than 15 days left), Renewal due (15 days or fewer), Expired (its end has passed) (#27).
- **PT needs an active membership** (#42, #83). If the membership has expired while PT still runs, the PT is "on hold": its unlocked sessions stay, but 0 are usable. The PT end date keeps running; a freeze is parked (P2).

### Cards
| Card | Rule |
|---|---|
| Needs attention (first) | Any pending item: Payment due, FF ID pending, Key fob pending, Pending issue. It uses the same helper as Today (`App.profilePending`, #61, #67, #82), so the number matches Today's "Clients with pending items". |
| Active | Client Active and no package needs renewal. |
| Renewal due | Client still Active (not Expired, not Ex-client) with ANY package that has 15 days or fewer left OR has already expired (`App.packagesNeedingRenewal`). The badges say which package: "Membership renewal due · 12 days", "PT renewal due · 3 days", "Membership expired · PT on hold", "PT expired". |
| Expired | Client level Expired: the last package ended fewer than N days ago. Counts in renewals. |
| Ex-client | Client level Ex-client: no active package for N or more days. Not in the default list and not in renewals. |

- **Default view** shows Active + Renewal due. Expired and Ex-client appear only through their card or the status filter (like Lost on Leads, #21).
- **Sort**: Needs attention first, then fewest days left.
- **Row click** (anywhere except a button) opens the profile drawer on the Membership tab.
- **Row actions** (max 3; they don't open the drawer):
  - Call
  - WhatsApp
  - **Collect payment** when the client has a balance (membership first, then PT); otherwise **+ Follow-up**.
- After any action, the list, the cards, Today and the sidebar all update together.
- Renewal itself (the "Renew" action, renewal follow-ups) is NOT on this screen. It comes next in the roadmap.

### Columns
| Column | Shows |
|---|---|
| Name & mobile (pinned) | Name, a Meta badge if synced, mobile · client no. |
| ENDS ON (pinned, most prominent) | Last package end ("12 Nov 2026", #86) plus a badge: "N days left" / "Ends today" / the per-package renewal badges / "Expired N days ago" / "Ex-client · ended N days ago". When membership and PT end on different days, a second line shows "Membership 6 Dec 2026 · PT 4 Feb 2027". |
| Membership | Package name. Premium PT clients show "<package> · Membership (included)". |
| PT | "PT 12 Sessions" + "5 of 12 unlocked · 5 usable now" (#83). On hold: "PT on hold · membership expired · 12 of 12 unlocked". No PT: "—". |
| Balance due | "₹6,600 by 17 Nov 2026" (with "· PT" for a PT balance), or "—". |
| Pending | One small badge per pending item: FF ID pending, Key fob pending, Pending issue · item, Payment due. |
| Sales rep | Sales rep of the membership line (#36). |
| Branch | Shown only when "All branches" is selected. |
| Actions | Call · WhatsApp · Collect payment or + Follow-up. |

### Who sees what (grid row `clients.view`, decision #96)
- Scope comes from Settings → Roles & permissions. Defaults:
  - CEO: All.
  - SE / SM / CM / RM: Branch (their own branches).
  - Trainer / MXM / Finance: None. They see "Clients aren't part of your role".
- The Collect payment row action and pending items follow `clients.collectPayment`.
- All defaults are in docs/permissions.md.

## 3. Field table (filters)
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Search | text | No | — | empty | Name, mobile (digits only; +91 and a leading 0 are ignored, #11), email, client no, FF ID, key fob no. |
| Status | select | No | — | Active + Renewal due | Needs attention, Active, Renewal due, Expired, Ex-client. Same rules as the cards. |
| Sales rep | select | No | — | All | Users who are the sales rep on a membership. |
| Branch | select | No | — | top-bar branch | Follows the top-bar branch switcher. |
| Owner (More filters) | select | No | — | All owners | `ownerUserId`. Lists users who own at least one client (same rule as the Leads owner filter). No new column. |
| Pending item (More filters) | select | No | — | Any | FF ID pending / Key fob pending / Pending issue / Payment due. |
| Joined from / to (More filters) | date ("12 Nov 2026") | No | — | — | By `joinedAt`. |
| Has PT (More filters) | checkbox | No | — | off | Clients with a PT line. |
| Balance due (More filters) | checkbox | No | — | off | Membership or PT balance above 0. |

## 4. States
- **Normal**: cards + table. On tablet the sidebar shows icons only, Sales rep and Branch move into More filters, and the table scrolls inside its own box.
- **Empty** (`?debug` → Empty): "No clients yet · Clients appear here when a lead is converted and the first payment is saved."
- **No results**: "No clients match these filters" + Clear filters.
- **Loading**: skeleton rows (400 ms in the mockup).
- **Error** (`?debug`): "Couldn't load clients." + Retry.
- **No access**: Trainer / MXM / Finance (`clients.view` = None) see "Clients aren't part of your role".

### Dummy edge cases
| Client | Shows |
|---|---|
| Divya Nair (Sec 31) | Renewal due · "Membership renewal due · 3 days". |
| Sameer Khan (Sec 65) | Renewal due · 12 days. |
| Kabir Malhotra (p18, Sec 31) | Renewal due · "Membership renewal due · 12 days"; PT runs longer and is active. PT 5 of 12 unlocked, PT balance ₹6,500 → Collect payment. |
| Nikhil Arora (p40) | Membership ended 5 days ago, PT runs 40 more days. Client Active; in Renewal due with "Membership expired · PT on hold"; PT on hold · 12 of 12 unlocked, 0 usable. |
| Pallavi Rao (p21, Golf Course) | Expired 5 days ago. Expired card only. |
| Tarun Mehra (p22, Sec 31) | Ex-client · ended 60 days ago. |
| Rekha Chawla (p39) | Ex-client · ended 45 days ago. |
| Zoya Siddiqui (Golf Course) | PT 24 Sessions, 12 of 24 unlocked, PT balance ₹11,000. |
| Vivaan Joshi | Membership balance ₹6,600 by date. |
| Rohit Verma | FF ID + Key fob + Pending issue · T-shirt. |
| Ananya Desai, Ira Kapoor (Sec 65) | NOT on this list: they are leads on a paid trial (running / ended); see Leads. |

## 5. Status
Ready for review
