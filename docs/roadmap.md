# Roadmap

Screens in the mockup. Status per screen lives in `index.html` and each
feature README. Rules: `docs/decisions.md`. Questions: `docs/open-questions.md`.

## Done (Ready for review)
- App shell: sidebar with badges, top bar, inline search box, "View as" role, branch switcher, Display preferences.
- Today: overdue or not set, due today, my tasks, unassigned leads, clients with pending items.
- Leads list: pipeline cards, filters, Needs attention.
- Clients list: cards (Needs attention, Active, Renewal due, Expired), ends-on, PT, balance, pending, Collect payment.
- Profile drawer: Timeline, Tasks, Details, Docs, Membership, NEXT STEP, pending items, linkable URLs.
- Follow-ups: add, log outcome, cancel, Closed by system, lost, re-open, assign.
- Convert to Client: Sell mode in the drawer (details, package, sale & start, key fob, summary).
- Settings: Display, Packages, Items & stock (items, accessory stock, key fobs, tax categories), Sales rules.
- Settings › Roles & permissions: grid (8 tenant roles × 24 actions), settings values, roles, trainer types, audit log (#95, #96, #102).
- Test runner: `bash tools/run-tests.sh`.

## Next
1. **Lead flow update** (#92–#101) — IN PROGRESS. Done (c2): Premium PT package, Convert = Membership / Premium PT only with FF ID required, trials out of Convert, Clients list without "Paid trial". Done (c3): Book trial (membership / PT trial groups by person type, free-trial limits per type, approval as a pending reference with Today "Trial approvals pending" + review modal, "Trial ended" + system follow-up, stage dropdown New / Contacted / Negotiation locked while a trial runs, re-open rule L24, paid trial adjust in Convert: locked / optional within the buffer / none). Remaining (c4+): owner change dialog, branch move, follow-up to others ("Follow-up from <owner>", "Own" scope incl. assignee), inactivity release + Unassigned reasons + Take this lead.
2. **Tasks**: my / team tasks, task modal (title, assigned to, due, priority, person), Open / Done / Cancelled.
3. **Follow-ups list**: all open follow-ups by date, owner, type; "View all" target for Due today.
4. **Renewals**: "Renew" action on Clients and the profile (drawer work mode), automatic renewal follow-ups, and a Today section "Expiring this week".
5. **Global search (real)**: search leads, clients, FF ID, key fob, mobile from the top bar with results grouped by type.

## Later
- **Upgrade** (membership and PT, #44), opens in the drawer work mode (#64).
- **Transfer** (first Add-on, #45), drawer work mode.
- **Payment** module: converts on payment success, deposits, refunds, receipts.
- **Data migration** from the old system (people, memberships, FF IDs, fobs).
- **Meta sync**: live lead sync and round-robin assignment (Q10, parked).
