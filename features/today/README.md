# Today

The first screen staff see every day (decisions #22, #24, #61–#63).

## 1. Screens
| Screen / part | File | Purpose |
|---|---|---|
| Today page | `index.html` + `today.js` | Greeting, a count strip and five sections of work. |
| Count strip | (in page) | One card per visible section: count + words; click scrolls to the section. 0 = green "All clear". |
| Sections | (in page) | Count, up to 5 rows, ONE main action per row, "View all (N)". |
| Shared modals used | `shared/followup.js`, `shared/profile.js` | Log outcome, Add follow-up, Assign owner, Add FF ID, Assign fob, Issue item / Waive. No new forms. |

## 2. Flow
| Section | Rows (order) | Row shows | Main action | View all |
|---|---|---|---|---|
| **Overdue or not set** | Overdue (oldest first), then no follow-up (oldest lead first) | Name (+ Meta) · type · due date · owner (managers) · red "Overdue · N days" / "No follow-up set" | **Log outcome** / **Add follow-up** | Leads `?view=attention` |
| **Due today** | By time, "Any time" last | Name · type · note · owner (managers) · amber time | **Log outcome** | Leads `?follow=Due today` |
| **My open tasks** | Overdue first, then priority, then due | Title · person · due · Overdue + priority badges | **Mark done** | Toast: Tasks screen comes next |
| **Unassigned new leads** (managers only) | Newest first | Name (+ Meta) · source · branch · received | **Assign** | Leads `?owner=none` |
| **Clients with pending items** | Oldest sale first | Name · client no · package · branch · joined · "Corporate entry: FF ID & key fob" + its badges, then free-item badges (decision #67) | First item: **Add FF ID** / **Assign fob** / **Issue item** | Toast: Clients list comes next |

- Row click (not the button) opens the profile drawer (tasks → Tasks tab, pending → Membership tab), with ‹ › through that section.
- After any action the row leaves its section; counts, sidebar badges and the Leads list update together.
- Numbers use the same helpers as the sidebar: "Overdue or not set" = Today badge, "Due today" = Follow-ups badge, "My open tasks" = Tasks badge.
- **Issue item**: in stock → Issue (stock −1, line Issued, timeline). Out of stock → Issue disabled ("Out of stock at Sec 31"); Sales Manager and above can **Waive** with a required reason.
- **Assign fob**: opens the profile on Membership with the shared fob modal; the ₹1,200 deposit is its own sale line.

### Who sees what (placeholder, decisions #15, #56, #62, #63)
| Role | Overdue / Due today | My tasks | Unassigned | Pending items |
|---|---|---|---|---|
| Sales Executive | Own leads | Own | Hidden | Clients of their branch (or where they are the sales rep) |
| Sales Manager, Club Manager | Their branches, owner shown | Own | Their branches | Their branches (Waive allowed) |
| Regional Manager | Their branches | Own | Their branches | Their branches |
| CEO, SuperAdmin | Top-bar branch (All = every branch) | Own | Top-bar branch | Top-bar branch |
| Trainer, MXM | Hidden | Own | Hidden | Hidden |

Everything also follows the top-bar branch. Trainer / MXM see the note "Leads and follow-ups aren't part of your role."

## 3. Field table
| Field | Type | Required | Unique | Default | Notes |
|---|---|---|---|---|---|
| Greeting | derived | — | — | — | "Good morning / afternoon / evening, <first name> · <weekday, date>". |
| Summary | derived | — | — | — | "N things need you today." or "All caught up. Nothing needs you right now." |
| Section count | derived | — | — | — | Total rows in the section (not just the 5 shown). |
| Add FF ID | text (modal) | Yes | Yes, company-wide | — | Duplicate: same branch "Already used by <name>"; other branch "Already exists in <branch> · Owner: <first name>". |
| Waive reason | text (Issue item modal) | Yes when waiving | — | — | Line becomes "Waived"; timeline "Free T-shirt waived · <reason>". |

## 4. States
- **Normal**: strip + sections (desktop two columns: Overdue / Unassigned, Due today / Pending, My tasks full width; tablet one column in the order Overdue, Due today, My tasks, Unassigned, Pending; strip wraps 3 + 2).
- **Section empty**: green check + "All caught up · every lead has a follow-up on time", "Nothing due today", "No open tasks", "Every new lead has an owner", "No pending items".
- **Everything empty**: one large "All caught up" card (`?debug` → All caught up).
- **Loading**: skeleton cards. **Error**: "Couldn't load Today" + Retry (`?debug`).
- **Long lists**: 5 rows + "+N more" + "View all (N)".

### Dummy edge cases
| Data | Shows |
|---|---|
| Aarav, Arnav (Priya), Manish (Sec 65), Ritika (Golf Course, 4 days) | Overdue rows; CEO sees 7 rows → 5 + "+2 more". |
| Sneha, Neha, Fatima | No follow-up set → "Add follow-up". |
| Kavya (4:00 pm), Aditya (Golf Course) | Due today. |
| Priya's tasks: Collect ID proof (overdue, High), Print welcome kit (today) | My open tasks. |
| Fatima (Meta, Golf Course), Neha (walk-in, Sec 31) | Unassigned new leads. |
| Rohit Verma (Sec 31) | FF ID pending + Key fob pending + Pending issue · T-shirt (Sec 31 stock 0). |
| Harsh Vardhan (Sec 65) | Only FF ID pending (has a fob). |

## 5. Status
Ready for review
