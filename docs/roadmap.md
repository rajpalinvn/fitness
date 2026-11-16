# Roadmap

Screens in the mockup. Status per screen lives in `index.html` and each
feature README. Rules: `docs/decisions.md`. Questions: `docs/open-questions.md`.

## Done (Ready for review)
- App shell: sidebar with badges, top bar, inline search box, "View as" role, branch switcher, Display preferences.
- Today: overdue or not set, due today, my tasks, unassigned leads, clients with pending items.
- Leads list: pipeline cards, filters, Needs attention.
- Clients list: cards (Needs attention, Active, Renewal due, Expired, Paid trial), ends-on, PT, balance, pending, Collect payment.
- Profile drawer: Timeline, Tasks, Details, Docs, Membership, NEXT STEP, pending items, linkable URLs.
- Follow-ups: add, log outcome, cancel, Closed by system, lost, re-open, assign.
- Convert to Client: Sell mode in the drawer (details, package, sale & start, key fob, summary).
- Settings: Display, Packages, Items & stock (items, accessory stock, key fobs, tax categories).
- Test runner: `bash tools/run-tests.sh`.

## Next
1. **Settings › Roles & permissions** screen (fixed roles × actions, scopes None / Own / Branch / All, discount %, audit log) + Settings values (free-trial limits, paid trial adjust buffer, inactivity days, new-lead assignment). #95, #96.
2. **Lead flow update** (#92–#101): Book trial (who gets which trial, approval as pending reference, free-trial limits, "Trial ended"), Convert = Membership / Premium PT only (FF ID mandatory), Premium PT package (reference membership price, 2 lines at sale), owner change dialog, branch move, follow-up to others ("Follow-up from <owner>"), inactivity release + Unassigned reasons + Take this lead, stage dropdown (New / Contacted / Negotiation), and the Clients list fix (remove the "Paid trial" card; the paid-trial dummy client becomes a lead).
3. **Tasks**: my / team tasks, task modal (title, assigned to, due, priority, person), Open / Done / Cancelled.
4. **Follow-ups list**: all open follow-ups by date, owner, type; "View all" target for Due today.
5. **Renewals**: "Renew" action on Clients and the profile (drawer work mode), automatic renewal follow-ups, and a Today section "Expiring this week".
6. **Global search (real)**: search leads, clients, FF ID, key fob, mobile from the top bar with results grouped by type.

## Later
- **Upgrade** (membership and PT, #44), opens in the drawer work mode (#64).
- **Transfer** (first Add-on, #45), drawer work mode.
- **Payment** module: converts on payment success, deposits, refunds, receipts.
- **Data migration** from the old system (people, memberships, FF IDs, fobs).
- **Meta sync**: live lead sync and round-robin assignment (Q10, parked).
