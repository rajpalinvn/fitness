# Decisions

1. Scope: Leads, Follow-ups, Tasks, Lead → Client conversion only.
   Payment/billing is a later module; conversion ends at a
   "Proceed to Payment" placeholder.
2. One person = one profile shared by lead and client.
3. Rule "money taken = client": Free Trial stays a Lead (shown as a timeline
   event). Trial Paid and Paid packages convert the lead to a Client.
4. Explicit "Convert to Client" step (stepper), separate from the sale.
5. Every open lead must have a next follow-up date. "No activity" means no
   follow-up set or follow-up overdue. No auto "new lead" or "no visit" tasks.
6. Follow-up and Task are separate. Follow-up = talking to the lead (call,
   WhatsApp, visit) with an outcome. Task = staff work with a due date.
7. Follow-up outcome is its own field. Choosing "Not interested" asks
   "Mark as Lost?" (never silent). Follow-ups are assigned to the lead owner
   by default. There is ONE add-follow-up flow used everywhere. Follow-ups
   are cancelled, never deleted.
8. Task statuses: Open, Done, Cancelled. Overdue is shown from the due date.
   No task categories (visibility comes from the permission matrix).
9. Lead stages are configurable; Converted and Lost are fixed system stages.
   Lost needs a reason. A lost lead can be re-opened (old reason cleared).
10. Short lead form: name + mobile required; owner and branch prefilled;
    temperature default Warm; everything else under "More details".
11. Mobile stored with country code (default +91). Unique company-wide.
    Search matches with or without +91 or a leading 0.
12. Email, FF ID (ID from another software, optional) and key fob are all
    unique company-wide.
13. Key fob: each branch has its own stock. A fob is assigned only on a Paid
    membership (never on any trial), picked from that branch's stock, and
    stock goes down. Statuses: In stock, Assigned, Lost, Returned.
    Profile actions: Return, Lost, Replace.
14. Package price is NOT editable at sale. Discount needs a reason.
    Sale types: Trial (free), Trial Paid, Paid. Special approval: later.
15. Roles: SuperAdmin, CEO, Regional Manager, Club Manager, Sales Manager,
    Sales Executive, Trainer, MXM. One clear permission matrix, no hidden
    exceptions. Matrix will be provided later; until then use simple
    placeholders (Sales Executive = own leads; managers = their branches).
    Mockups include a "View as role" switcher.
16. Multiple branches: a branch switcher in the top bar and a branch filter
    on lists.
17. Extensibility: every lead has a Source and an optional external ID, so
    future auto-sync (e.g. Meta/Facebook leads) adds a source, not a redesign.
    Synced leads show a badge and land in "Unassigned new leads".
18. Desktop + tablet only. Mobile app later.
19. Duplicate mobile check. Same branch: show the person's name +
    "Open profile". Another branch: always show that it exists, with branch
    and owner name only — "Already exists in Golf Course · Owner: Pooja" —
    plus a "Request access" button (mockup: toast only, no action yet).
20. Packages: types Trial, Trial Paid, Membership, PT. Membership and PT are
    sale type "Paid". PT-only packages never get a key fob (PT needs an
    active paid membership, so the client already has one).
21. Leads list default view = open leads only. Lost leads appear only via
    the Lost card or the Lost stage filter. "Needs attention" card is first.
22. Sidebar count badges (scoped to the "View as" role + top-bar branch):
    Today = overdue + no follow-up set (same rule and number as the
    "Needs attention" card); Follow-ups = open follow-ups due today;
    Tasks = the current user's open tasks. Hidden at 0, "99+" above 99.
23. App shell is shared by every page. "View as role" lives in the avatar
    menu and is shown as a "Demo · Viewing as" chip (demo tool only).
    Sidebar collapse is remembered per session; tablet starts collapsed and
    expanding it overlays the content.
24. Follow-up timing is by calendar date, not time. "Overdue" = due date
    before today (red). Anything due today is "Due today" (amber), even if
    its time has passed. Due after today = "Scheduled" (green). The same
    rule is used everywhere (list badge, NEXT STEP box, sidebar badges,
    "Needs attention"), so one follow-up is never counted as both.
