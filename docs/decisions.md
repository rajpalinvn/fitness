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
25. Log outcome: outcome chips Interested, No answer, Call later, Will visit,
    Not interested. "Not interested" asks "Mark as Lost?". After saving an
    outcome the next follow-up is always asked (quick picks Tomorrow /
    3 days / 1 week / custom), unless the lead was marked Lost or is a
    client. If another open follow-up already exists, it is shown instead
    of asking again. There is no "skip": every open lead needs a follow-up.
    One shared component (shared/followup.js) is used by the list
    "+ Follow-up", the drawer quick action, the NEXT STEP button and the
    timeline composer.
26. Lost leads: notes allowed; follow-ups only after re-opening (buttons are
    disabled with "Re-open the lead first"). Marking a lead Lost needs a
    reason from the lost reasons list; "Other" requires text (stored as
    "Other: <text>"). Marking Lost cancels the lead's open follow-ups
    (status Cancelled, reason "Lead marked as Lost"; never deleted).
27. Client NEXT STEP: green when more than 15 days left on the membership;
    amber "Renewal due soon" at 15 days or fewer; red when expired.
28. Docs tab: upload placeholder with a type picker: ID proof,
    Waiver/consent form, Medical form, Photo, Other.
29. Re-open: the lead returns to the stage it had before it was lost
    (fallback Contacted), the old lost reason is cleared, "Re-opened by
    <name>" is added to the timeline, and the next follow-up is asked
    straight away.
30. Key fob actions on a client: Return (fob status Returned), Lost (fob
    status Lost), Replace (pick why: old fob Lost or Damaged/returned, then
    pick a new fob from the home branch stock; stock goes down by one).
    A Paid client without a fob can "Assign from stock". Trial Paid never
    shows a fob.
31. Client profiles hide the stage and temperature badges. They show
    "Client" plus a membership status badge: Active (> 15 days left),
    Renewal due (15 or fewer), Expired, the same rule as NEXT STEP (#27).
32. The timeline section for open follow-ups (including overdue ones) is
    called "Open follow-ups".
33. Linkable profiles: opening a drawer sets the URL hash to
    #lead-<firstname> or #client-<firstname> (plus -<id> if two people share
    a first name). Opening a page with that hash opens the drawer; a lead
    link still works after the person becomes a client. Closing the drawer
    clears the hash. Works on every page that loads the profile drawer.
34. Search is inline: click or Ctrl+K expands the same top-bar field in place
    (smooth width animation) with results attached directly below. Esc or
    outside click collapses it. No separate command palette. Animations
    respect the reduced-motion setting.
35. Settings → Display holds per-user preferences (session storage in the
    mockup, per-user settings in the real app), as presets only: drawer
    width 60/70/80/92% (default 70%), density Compact/Comfortable/Spacious,
    text size Small/Medium/Large, search bar width Narrow/Medium/Wide,
    sidebar default Expanded/Collapsed, plus "Reset to default". They are
    applied as data attributes on <html> that switch token values, so pages
    need no changes. On tablet the drawer is always at least 92%. Other
    Settings sections show as "Coming soon" until built.
36. Lead people. CreatedBy (`createdByUserId`) never changes. Owner
    (`ownerUserId`) is who brought / handles the lead: required at creation,
    defaults to the creator, changeable, with an owner-change history
    (`ownerHistory`). Sales rep (`salesRepUserId`) gets the credit per SALE
    LINE, exactly one rep per line. Default, can change: the sales rep
    defaults to the lead owner and can be changed at sale.
37. Follow-up statuses: Open, Done (staff did it), Cancelled (by staff, with a
    reason), Closed by system (reason: Client converted / Lead lost / Client
    transferred). The system never marks a follow-up Done. Owners of
    follow-ups closed by the system get a notification. This replaces
    "cancelled when lost" in #26 and the plan for conversion.
38. Mobile is required and unique company-wide. Email is optional and unique
    when given (no email: receipts go by WhatsApp only).
39. Free trial can be taken many times; show a warning "This is their 3rd
    free trial". Capping comes later from admin.
40. FF ID (permanent client ID from the corporate software) and key fob come
    only after the client is entered in the corporate software. Free trial:
    never. Paid trial: admin rule later. Paid membership: required. FF ID
    and key fob show as SEPARATE pending items ("FF ID pending", "Key fob
    pending") until filled. Both unique company-wide. A fob can be reissued.
41. Start date: today up to 30 days ahead (back dates: open question, not
    allowed for now). No overlapping membership and no overlapping PT for the
    same client on the same date. Expiry is by calendar days with the start
    day included (7 days from Mon ends Sun).
42. PT longer than the membership: allowed with a warning; the seller must
    tick an acknowledge checkbox.
43. Couple PT: both people must be clients with an active membership.
44. Upgrade (membership and PT): only to a higher price, validity from the
    ORIGINAL start date, full paid amount adjusted. PT upgrade payout: past
    session payouts are frozen; new rate = (new price - value used) /
    remaining sessions (remaining = new sessions - used). Trainer screens show
    a "Rate updated · upgrade" badge with this explanation. Upgrade UI later.
45. Transfer (first Add-on): permanent home branch change with history, fee
    as an Add-on sale line (free allowed), owner unchanged by default, open
    follow-ups "Closed by system" (Client transferred). Transfer UI later.
46. Free items in a package. Default, can change: rule per item "Once per
    client" (default; skipped if the client ever got this item free) or
    "Every sale". Out of stock: the sale continues, the line is "Pending
    issue", and a manager can "Waive" it with a reason.
47. Package audience: New / Renewal / Both. Default, can change: Both.
48. Conversion: the mockup converts on "Proceed to Payment". The real app
    converts only when payment succeeds (#3 "money taken = client"). PT
    packages are disabled for leads (#20). Price locked, discount needs a
    reason (#14). Discount limits by role are PLACEHOLDERS until admin
    settings exist: Sales Executive max 10%, Sales Manager max 20%, other
    roles no limit. Converting an unassigned lead makes the converting user
    the owner.
49. Tax categories are an admin master (Settings → Items & stock → Tax
    categories): name, GST rate, active. Prices are stored INCLUDING GST; GST
    is worked out backwards: GST = price × rate ÷ (100 + rate). No rate is
    hardcoded in logic. Dummy: Gym services 5%, Goods 18%, Goods 12%,
    Exempt 0%.
50. Packages (Settings → Packages): category Membership / PT / Add-on;
    sub-type optional from an admin list (Membership, PT); Add-on kinds are
    fixed in code (first: Transfer). Fields: name (unique), trial Yes/No,
    people Single/Couple (PT only for new packages), days, sessions (PT),
    price incl. GST, GST category, price effective from, requires active
    membership (always on for PT), branches, audience, free items, active.
    The result is derived, never typed: Free trial (trial + price 0, stays a
    Lead) / Paid trial / Paid. Price 0 without trial is an error, except an
    Add-on (a free Transfer is allowed, #45).
51. Price history: a price applies from its "effective from" date. A new
    price can't start in the past; the current price is the latest one on or
    before today; upcoming prices show on the list.
52. After the first sale a package's category, trial, people, days and
    sessions are locked ("Locked: sold"); "Copy as new" creates a new
    package with those fields open. Name, price (with a date), GST category,
    branches, audience, free items and active stay editable.
53. ONE item list for accessories, free items and the key fob: name (unique),
    cost price (required), selling price incl. GST (required, admin only),
    GST category, active. Return / refund policy fields are reserved, not
    used yet.
54. Accessory stock per branch: Stock in (quantity + note), current quantity,
    movement history. Free items given at a sale reduce stock; out of stock
    makes the line "Pending issue" (#46).
55. Key fob deposit: one amount = the Key fob item's selling price (dummy
    ₹1,200), not per branch or per fob, collected as its own line in the same
    sale. Refund full or partial with a reason (only once the fob is
    Returned). Replace: see #58. Fobs are
    added one number or a range (same prefix, up to 500 at a time); existing
    numbers are listed and skipped. Each fob keeps an assignment history.
56. Access, PLACEHOLDER until the permission matrix: packages and item
    masters (incl. tax categories) create/edit = SuperAdmin, CEO; view =
    managers (Regional, Club, Sales Manager). Selling prices are shown to
    SuperAdmin/CEO only. Accessory stock and key fobs = Club Manager and
    above, for their own branches. Others see "You don't have access".
57. Packages offered when converting a lead: active, sold at the lead's
    branch, audience New or Both, not Add-ons; PT stays disabled (#20).
58. Key fob deposit on Replace: if the old fob was damaged / returned, the
    deposit moves to the new fob. If the old fob was LOST, its deposit is
    forfeited and the new fob needs a NEW deposit (its own sale line).
    Refunds only once a fob is Returned; a Lost fob forfeits its deposit.
    Assigning a fob to a client without one collects a new deposit.
59. Couple packages are PT only. There is no couple membership package.
60. Confirmed: a free Add-on (price 0) is allowed (#45, #50); accessory
    stock is managed by Club Manager and above for their own branches (#56).
61. Today is the first screen staff see. Sections, each with a count, up to
    5 rows, ONE main action per row and "View all": "Overdue or not set"
    (overdue follow-ups AND open leads with no follow-up, so the page always
    matches the sidebar Today badge, #22; action Log outcome or Add
    follow-up), "Due today" (Log outcome), "My open tasks" (Mark done),
    "Unassigned new leads" incl. Meta synced (Assign), "Clients with pending
    items" (FF ID pending / Key fob pending / Pending issue; action for the
    first item: Add FF ID / Assign fob / Issue item). Empty sections say
    something positive ("All caught up", "Nothing due today"). Sections
    follow the "View as" role and the top-bar branch. Trainer and MXM see
    only My open tasks.
62. Add FF ID, Assign fob and Issue item: the client's sales rep, Sales
    Executives and Sales Managers of that branch (they are the front desk
    and do sales / billing), and managers above them. NOT MXM, not Trainer.
    Waiving a free item (#46) is for Sales Manager and above, with a reason.
63. Only managers assign leads. Sales Executives do not see unassigned
    leads. Auto-assign (round-robin) may come later with Meta sync (see
    docs/open-questions.md).
64. Bigger flows open IN the profile drawer as a wide work mode, never as a
    modal over the drawer. Convert to Client = "Sell mode": header
    "<Name> › Convert to client", "Back" returns to the profile, same steps.
    Width = the larger of the user's drawer width and 80% (tablet 92%).
    Esc or outside click also go back to the profile (nothing saved).
    Renewal, Upgrade and Transfer will reuse the same mode (App.DrawerMode).
