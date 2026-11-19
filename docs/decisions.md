# Decisions

1. Scope: Leads, Follow-ups, Tasks, Lead → Client conversion only.
   Payment/billing is a later module; conversion ends at a
   "Proceed to Payment" placeholder.
2. One person = one profile shared by lead and client.
3. Rule "money taken = client": Free Trial stays a Lead (shown as a timeline
   event). Trial Paid and Paid packages convert the lead to a Client.
    Changed by #92: client = bought a Membership or Premium PT; a paid trial stays a Lead.
4. Explicit "Convert to Client" step (stepper), separate from the sale.
5. Every open lead must have a next follow-up date. "No activity" means no
   follow-up set or follow-up overdue. No auto "new lead" or "no visit" tasks.
6. Follow-up and Task are separate. Follow-up = talking to the lead (call,
   WhatsApp, visit) with an outcome. Task = staff work with a due date.
7. Follow-up outcome is its own field. Choosing "Not interested" asks
   "Mark as Lost?" (never silent). Follow-ups are assigned to the lead owner
   by default. There is ONE add-follow-up flow used everywhere. Follow-ups
   are cancelled, never deleted.
    Changed by #97: a follow-up can be assigned to staff other than the owner (any branch); owner unchanged.
8. Task statuses: Open, Done, Cancelled. Overdue is shown from the due date.
   No task categories (visibility comes from the permission matrix).
9. Lead stages are configurable; Converted and Lost are fixed system stages.
   Lost needs a reason. A lost lead can be re-opened (old reason cleared).
    Changed by #101: stages are the fixed 5 (New, Contacted, Trial, Negotiation, Lost); Converted is not a stage.
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
    Changed by #92, #93: 4 package categories incl. Premium PT; trials get no discount; special approval = Roles & permissions grid (#96).
15. Roles: SuperAdmin, CEO, Regional Manager, Club Manager, Sales Manager,
    Sales Executive, Trainer, MXM. One clear permission matrix, no hidden
    exceptions. Matrix will be provided later; until then use simple
    placeholders (Sales Executive = own leads; managers = their branches).
    Mockups include a "View as role" switcher.
    Changed by #95, #96: roles are fixed (9 keys incl. Finance) and permissions come from the Settings grid; placeholders end.
    Changed by #102: SuperAdmin is a platform role, not a tenant role; the 8 tenant roles are CEO, RM, CM, SM, SE, MXM, Trainer, Finance.
16. Multiple branches: a branch switcher in the top bar and a branch filter
    on lists.
17. Extensibility: every lead has a Source and an optional external ID, so
    future auto-sync (e.g. Meta/Facebook leads) adds a source, not a redesign.
    Synced leads show a badge and land in "Unassigned new leads".
    Changed by #100: Unassigned leads carry a reason (New / Released); who sees and takes them comes from the grid.
18. Desktop + tablet only. Mobile app later.
19. Duplicate mobile check. Same branch: show the person's name +
    "Open profile". Another branch: always show that it exists, with branch
    and owner name only — "Already exists in Golf Course · Owner: Pooja" —
    plus a "Request access" button (mockup: toast only, no action yet).
20. Packages: types Trial, Trial Paid, Membership, PT. Membership and PT are
    sale type "Paid". PT-only packages never get a key fob (PT needs an
    active paid membership, so the client already has one).
    Changed by #92: package categories are Membership, PT, Premium PT, Add-on; trial is a flag on a package, not a type.
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
    Changed by #101: re-opening someone else's lost lead (allowed by scope) makes you the owner; owner-change dialog (#99) if anything is open.
27. Client NEXT STEP: green when more than 15 days left on the membership;
    amber "Renewal due soon" at 15 days or fewer; red when expired.
    Changed 17 Nov (c6): Renewal due / Expired is worked out PER PACKAGE (membership and PT each on their own, <= 15 days = renewal due). The Clients "Renewal due" card counts clients with ANY package renewal due; the badge says which ("Membership renewal due" / "PT renewal due"). The profile shows a badge per package; NEXT STEP shows the most urgent package ("Membership renews in 12 days").
28. Docs tab: upload placeholder with a type picker: ID proof,
    Waiver/consent form, Medical form, Photo, Other.
29. Re-open: the lead returns to the stage it had before it was lost
    (fallback Contacted), the old lost reason is cleared, "Re-opened by
    <name>" is added to the timeline, and the next follow-up is asked
    straight away.
    Changed by #101: if the stage before Lost was Trial and no trial is running, re-open returns to Negotiation.
30. Key fob actions on a client: Return (fob status Returned), Lost (fob
    status Lost), Replace (pick why: old fob Lost or Damaged/returned, then
    pick a new fob from the home branch stock; stock goes down by one).
    A Paid client without a fob can "Assign from stock". Trial Paid never
    shows a fob.
31. Client profiles hide the stage and temperature badges. They show
    "Client" plus a membership status badge: Active (> 15 days left),
    Renewal due (15 or fewer), Expired, the same rule as NEXT STEP (#27).
    Changed 17 Nov (c6, #103): the CLIENT-level status (Active / Expired / Ex-client) uses the LATER of membership end and PT end; the Expired card stays client level.
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
    Changed by #97, #98: when a follow-up assignee (or the new-branch SE) converts, they are the sales rep by default; the owner never changes by this.
    Changed by #107: the sales rep default = the person creating the sale (everywhere, incl. Premium PT); the dropdown lists users with `sales.rep` in any branch; every change = SalesRepChanged event.
37. Follow-up statuses: Open, Done (staff did it), Cancelled (by staff, with a
    reason), Closed by system (reason: Client converted / Lead lost / Client
    transferred). The system never marks a follow-up Done. Owners of
    follow-ups closed by the system get a notification. This replaces
    "cancelled when lost" in #26 and the plan for conversion.
    Changed by #99, #100: new system close reasons "Owner changed" and "Released (inactive)".
38. Mobile is required and unique company-wide. Email is optional and unique
    when given (no email: receipts go by WhatsApp only).
39. Free trial can be taken many times; show a warning "This is their 3rd
    free trial". Capping comes later from admin.
    Changed by #94: free-trial limits are settings (default 2 per person, 1 per branch), counted by mobile across branches; over the limit the button is disabled.
40. FF ID (permanent client ID from the corporate software) and key fob come
    only after the client is entered in the corporate software. Free trial:
    never. Paid trial: admin rule later. Paid membership: required. FF ID
    and key fob show as SEPARATE pending items ("FF ID pending", "Key fob
    pending") until filled. Both unique company-wide. A fob can be reissued.
    Changed by #93: FF ID is mandatory at Convert to Client (key fob may stay Pending); no trial ever gets an FF ID or fob.
41. Start date: today up to 30 days ahead (back dates: open question, not
    allowed for now). No overlapping membership and no overlapping PT for the
    same client on the same date. Expiry is by calendar days with the start
    day included (7 days from Mon ends Sun).
    Changed by #94: staff can never back-date; only the system sets a past start date, only for the running paid trial adjust (membership start = trial start).
    Changed by #103 (Q1): start = today by default; FUTURE start dates are NOT allowed at sale ("up to 30 days ahead" removed); back date only within the CURRENT month and only with the grid row `sales.backDate` (CEO yes, locked; others No, CEO can grant). The running paid trial adjust (system-set start, #94) is exempt. Trial booking dates unchanged.
42. PT longer than the membership: allowed with a warning; the seller must
    tick an acknowledge checkbox.
    Changed 17 Nov (c6): the warning now says "After the membership ends on <date>, PT sessions can't be used until the membership is renewed." (text in App.ptLongerWarning; shown when PT is sold on its own in the client Sell mode, built with Renewals). Premium PT: same rule if the membership part ends first.
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
    Changed by #92, #96, #100: client = Membership / Premium PT bought; discount limits live in the grid; taking an unassigned lead is the explicit "Take this lead" button.
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
    Changed by #92: category list is Membership / PT / Premium PT / Add-on; Premium PT adds a required reference membership price; the "Premium" sub-type label is removed.
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
    Changed by #96: access comes from the Roles & permissions grid (Packages = CEO; stock = CM / RM Branch, CEO All).
    Changed by #102: masters / selling prices / stock edit = CEO (grid), not "SuperAdmin / CEO".
57. Packages offered when converting a lead: active, sold at the lead's
    branch, audience New or Both, not Add-ons; PT stays disabled (#20).
    Changed by #93: Convert offers Membership and Premium PT packages only; trial packages move to Book trial.
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
    Changed by #100, #98: "Unassigned new leads" follows the grid row "View unassigned leads" (CM / RM / CEO by default) and shows the reason; Today also gets "Transferred in · needs follow-up person" for the CM.
62. Add FF ID, Assign fob and Issue item: the client's sales rep, Sales
    Executives and Sales Managers of that branch (they are the front desk
    and do sales / billing), and managers above them. NOT MXM, not Trainer.
    Waiving a free item (#46) is for Sales Manager and above, with a reason.
    Changed by #96: Collect payment and Waive pending item are grid rows (Waive = SM and above, Branch).
63. Only managers assign leads. Sales Executives do not see unassigned
    leads. Auto-assign (round-robin) may come later with Meta sync (see
    docs/open-questions.md).
    Changed by #96, #100: assign / reassign is a grid row (SM / CM / RM Branch, CEO All); SEs see unassigned leads only if the grid gives them View + Take.
64. Bigger flows open IN the profile drawer as a wide work mode, never as a
    modal over the drawer. Convert to Client = "Sell mode": header
    "<Name> › Convert to client", "Back" returns to the profile, same steps.
    Width = the larger of the user's drawer width and 80% (tablet 92%).
    Esc or outside click also go back to the profile (nothing saved).
    Renewal, Upgrade and Transfer will reuse the same mode (App.DrawerMode).
65. Sell mode is laid out like a checkout: steps on the left, a sticky Bill
    summary on the right (below the steps on tablet). It shows the person,
    every sale line (package, free items, key fob deposit), price, discount +
    reason, GST included and "Total to pay", and updates live. No separate
    "Final price" box.
66. Package step: packages in accordions by category (Free trial, Paid trial,
    Membership, Personal training) with a count; the first group with
    packages is open. Search by name across groups. Each card shows its free
    items; a "Once per client" item already received shows "(already
    received)" and is Skipped.
    Changed by #93: Free trial / Paid trial accordions move to Book trial; Convert shows Membership and Premium PT groups only.
67. FF ID and key fob are ONE section "Corporate entry: FF ID & key fob": a
    conversion step (Paid membership only, both optional, each pending until
    filled), a section on the profile Membership tab, and a group in NEXT STEP
    and Today's pending items. FF ID is no longer in the Details step.
    Changed by #93: FF ID is mandatory in the Corporate entry step; only the key fob can be Pending.
68. Quick lead opens in a drawer (not a modal) from "+ Lead" and "Create lead
    with this number". Fields: name, mobile (live duplicate check #19),
    source, temperature (Warm), owner (me, changeable), branch (top-bar);
    More details: email, gender, birth date, FF ID (optional, unique),
    inquiry type, campaign, remarks. (Updated: FF ID is back, as in the app
    brief.) Mobile comes first, then name (#74). After save the
    profile opens and asks for the first follow-up (#5).
69. The Drawer width setting applies to every drawer (profile, quick lead,
    package / item forms, fob and history drawers). Sell mode is at least
    80%; tablet is always 92%.
70. Free items in the bill: each line has "Issue now / Later". Default
    Issue now when in stock; out of stock is forced Later (Pending issue).
    "Skipped (already received)" stays as is (#46).
71. "+ Add item" in the bill: any active accessory (search), qty, price
    locked from the item master, branch stock shown, out of stock disabled.
    Each added line has a "Free" switch (complimentary) that needs a short
    reason. Stock goes down on conversion. Totals update live: package after
    discount, paid accessories, key fob deposit, GST included, Total to pay.
72. Paid trial: the Corporate entry step shows with an OPTIONAL FF ID (no
    key fob for trials). Left empty, nothing is pending; only a Paid
    membership creates FF ID / Key fob pending. Admin rule may come later.
    (Was Q16.)
    Changed by #92, #93: a paid trial is booked with Book trial, never through Convert; no FF ID on any trial.
73. Discount: [% | ₹] + amount in one row, live line "Discount ₹X · Final
    ₹Y", reason is a dropdown (Festive offer, Referral, Corporate, Staff
    family, Other; Other needs text) shown when the amount is above 0. The
    limit note sits under the row (placeholder); over the limit shows an
    inline error and blocks Next.
74. Polish: stepper on one line at desktop (wraps on tablet); Package step
    opens the Membership group, others collapsed; Quick lead asks Mobile
    first (duplicate check), then Name.
75. Key fob "Free (no deposit)" switch in Corporate entry: the bill shows the
    fob as Complimentary · ₹0 and a short reason is required; the fob is
    recorded with deposit ₹0, complimentary, and the reason.
76. Lead owner: at creation the creator can pick any owner (sales staff of
    the branch). Reassigning an existing lead is managers only (#63).
    (Was Q15.)
    Changed by #96, #98: moving a lead to another branch is a grid row (SE Own); assign / reassign stays a grid row for SM and above.
77. Discount limits: every role has a max discount % set by admin in
    Settings → Sales rules (SuperAdmin / CEO edit). Default, can change:
    Sales Executive 10%, Sales Manager 20%, Club Manager 30%, Regional
    Manager 50%, CEO 50%, SuperAdmin 100% (Trainer / MXM 0%). Sell mode uses
    the current role's limit; "no limit" never shows. The discount applies
    to the PACKAGE only, never accessories or the key fob deposit.
    Changed by #96: max discount % per role is a row in the Roles & permissions grid; the #77 numbers stay (SE 10, SM 20, CM 30, RM 50, CEO 50, SuperAdmin 100).
    Changed by #102: CEO max 100% (placeholder, Q31); SuperAdmin has no discount limit (platform role, sells nothing); edited by CEO only.
    Changed by #103 (Q22): never above the limit. Limit per role = % AND a ₹ cap per package line; the LOWER of (% of the line) and the cap applies (e.g. 5%, max ₹5,000). Cap 0 = no ₹ cap; % 0 = no discount. `sales.discountMax` = { pct, capRupees } per role. CEO limit set by the club in the grid (Q31).
78. GST: calculated per line with its own tax category (prices incl. GST),
    always shown with 2 decimals, and broken down by rate in the bill
    ("GST 5% ₹1,142.86 · GST 18% ₹53.24").
79. Payment is step 6 of Sell mode, after Summary. "Money taken = client":
    the person becomes a client when the first payment is saved. Free trial
    has no payment step.
    Changed by #92: the person becomes a client on the first payment of a Membership or Premium PT; a paid trial payment does not.
80. Payment methods are an admin list (Settings → Payment methods). Default,
    can change: Cash, UPI, Bank transfer (was Net banking, #116), Card; admin can add or disable;
    online payment comes later.
81. Payment rows: method, amount, reference / transaction no. (required
    except Cash), optional slip. Several rows = split payment. Receipt no. is
    automatic per branch, e.g. S31-000124 (read-only). Default, can change.
82. Partial payment only on main packages (Paid Membership, PT). Accessories
    and the key fob deposit are settled first and in full. The bill shows
    Total, Paid now, Balance due. A balance needs a due date; it creates a
    "Payment due" pending item (profile + Today, action Collect payment) and
    a "Payment expected" follow-up on that date. Paying the balance in full
    closes those follow-ups by system ("Payment received").
83. PT sessions unlock with payment: per-session price = (PT price −
    discount) / sessions; unlocked = floor(paid towards PT / per-session
    price). Shown as "Sessions unlocked 5 of 12" in the bill and profile.
    Changed 17 Nov (c6): PT sessions need an active membership. Two numbers, never merged: UNLOCKED (by payment, unchanged) and USABLE now (unlocked AND the membership is active that day). Membership ended while PT runs: "PT on hold · membership expired · 5 of 12 unlocked"; NEXT STEP "Renew membership to continue PT"; renewing makes the same unlocked sessions usable again. The PT end date keeps running while on hold (no freeze; freeze parked). No booking / attendance screens: labels and status only.
84. Sell mode layout: steps column max ~760px aligned with the stepper,
    content in headed cards (24px between, 16px inside), inputs max ~480px,
    bill fixed ~380px with grouped lines and a highlighted Total to pay,
    footer buttons aligned with the steps column.
85. Minimum first payment at conversion = accessories in full + key fob
    deposit in full + a minimum % of the package after discount. The % is
    one setting in Settings → Sales rules, "Minimum first payment on
    packages" (Default, can change: 30%; SuperAdmin / CEO edit). Below the
    minimum "Save payment" is disabled with "Minimum ₹7,189 (accessories
    ₹349 + 30% of package)". The bill shows the real allocation (accessories
    first, then the fob deposit, then the package): "Paid in full" only when
    covered, else "Paid ₹X · Balance ₹Y". Later installments (Collect
    payment) have no minimum: any amount up to the balance.
    Changed by #102: the minimum first payment % is edited by CEO only.
86. Dates show as "12 Nov 2026" everywhere a full date is shown, including
    date fields (no mm/dd/yyyy); stored as ISO. Follow-up due dates keep the
    short human form ("today", "Tue, 10 Nov, 5:00 pm") from #24 (decided, #90).
87. Payment step: "Balance due date" shows only when Balance due > 0.
88. Real app: payments are separate tables Sale -> SaleLine (GST snapshot,
    discount, sales rep) -> Payment / receipt (+ rows, allocation to lines);
    one sale can have many payments. The mockup keeps its simple storage.
    See docs/data-model.md.
89. Membership and PT are NOT sold together in one Sell mode (was Q23).
    At conversion PT stays disabled (#20, #57). PT is sold later, in its
    own Sell mode, only to a client who already has an active paid
    membership (PT longer than the membership: #42). May be revisited later.
    Changed by #92: Premium PT is the one package that sells membership + PT together (split into 2 lines at sale).
    Changed by #110: PT / Premium PT are decided by CM / MXM in a PT quote; the SE bills the quote (locked). A lead quote can only be Premium PT. PT directly only with `sales.sellPTDirect` (CEO).
90. Follow-up due dates keep the short human form ("today", "Tomorrow",
    "Tue, 10 Nov, 5:00 pm") everywhere they appear: list badges, NEXT STEP,
    Today, timeline and modals. Every other full date stays "12 Nov 2026"
    (#86). (Was Q24.)
91. Clients list (features/clients): list-first like Leads. Cards: Needs
    attention (any pending item, same helper as Today so counts match),
    Active (> 15 days), Renewal due (<= 15), Expired, Paid trial; counts
    follow role + top-bar branch. Default view Active + Renewal due;
    Expired via its card or filter. Sort: Needs attention first, then fewest
    days left. Columns: name / mobile / client no, ENDS ON (pinned,
    "12 Nov 2026" + days left), membership + status, PT sessions unlocked,
    balance due, pending badges, sales rep, branch (All branches only).
    Row actions: Call, WhatsApp, Collect payment if there is a balance else
    + Follow-up. Today's "Clients with pending items" View all opens
    ?view=attention. Visibility is a placeholder (Q8): SE their branch,
    managers their branches, CEO / SuperAdmin top-bar branch, Trainer / MXM
    hidden. Ex-client (Q25) and paid trial ended (Q26) are open.
    Changed by #92, #96: the "Paid trial" card goes (paid trial = lead; the paid-trial dummy client becomes a lead), visibility follows the grid row "View clients". Q26 closed.
    Changed by #102: "CEO / SuperAdmin top-bar branch" becomes CEO only; visibility follows the grid row "View clients".
92. Client definition and package categories (notes v3 §1, A1–A8;
    docs/meeting/lead-client-notes-v3.md). Client = a person who bought a
    Membership or a Premium PT; free and paid trial = Lead. 4 package
    categories: Membership, PT, Premium PT, Add-on. Premium PT = one
    package (membership days, PT sessions, price, reference membership
    price required); at sale it splits into 2 lines: membership line =
    reference price, PT line = the rest; client status, renewal, session
    unlock and incentives reuse the existing rules; the incentive split is
    set in the incentive scheme, not on the package (A7); no trial for
    Premium PT (A4; changed 16 Nov: a LEAD may also book PT trials, see
    #94). The "Premium" membership sub-type label and the dummy
    "Annual + PT Premium Combo" package are removed. Membership = access to
    all branches; PT = home branch only (A8). Closes Q5 and Q26 (a paid
    trial is a lead; "Trial ended" is a lead badge, #101).
    Reference membership price follows the PRICE rule (#50): it is part of
    each price entry (priceHistory: { price, referenceMembershipPrice,
    from }); after the first sale it can't be edited in place, a new price
    entry with "effective from" carries a new reference price; past sales
    keep theirs. Built in c2 (packages, Convert, Clients list).
    Changed by #103: Premium PT is a PT product; the membership inside it is an add-on (free or charged). Reference membership price 0 <= reference < price (₹0 = membership free; the ₹0 line still shows on the bill, no GST, because it drives client status, expiry and renewal). Discount applies ONLY to the PT line; the membership line always stays at the reference price (replaces the proportional split). ONE sales rep for the whole package (default = lead owner); the membership line stores it only as a reference, "incentive by scheme".
    Changed by #113: a Premium PT sold from a quote carries the quote's trainer on the PT line (`trainerUserId`).
93. Convert to Client (notes §1): offers Membership and Premium PT packages
    only (PT disabled #89; never trial packages). FF ID is mandatory; the
    key fob can be Pending; free items follow #67 (#46). Trials give
    nothing extra: no accessories, no free items, no FF ID, no key fob, no
    discount; a paid trial is paid in full, at once. A lead has two buttons:
    Book trial and Convert to Client. Closes Q5.
    Premium PT at sale: the discount is split proportionally across the
    membership line and the PT line. Payment allocation order: accessories
    → key fob deposit → membership line → PT line (PT sessions unlock from
    what reaches the PT line, #83). Built in c2.
    Changed by #103: Premium PT discount limit = min(% of the PT part (price − reference), cap), never more than the PT line; one sales rep select; paid PT trial adjust still goes to the PT line; allocation accessories → fob → membership → PT (a ₹0 membership line takes nothing).
    Changed by #110 / #113: Convert shows Premium PT / PT packages only to users with `sales.sellPTDirect`; others see "PT quotes" for this person (Open = can be picked, Expired = disabled with the date). Membership packages need `sales.sellMembership`.
94. Trials (notes §1, L1–L7, L1b, L1c). Book trial shows trial packages
    only, in two groups "Membership trials" and "PT trials". Who gets
    which (changed 16 Nov): open lead = membership trials + PT trials
    whose package has "Requires an active membership" OFF; active client
    = PT trials only (ON and OFF); expired client = no button; lost lead =
    "Re-open the lead first" (#26). PT trial packages default to OFF
    (form hint: "ON = clients only; OFF = leads and clients"). Premium PT
    has no trial. A lead's PT trial sets stage = Trial like a membership
    trial. Permission: trials.book.
    Trial stage is automatic (stage dropdown: New, Contacted, Negotiation;
    locked while a trial runs, unlocks after it ends, L5). Trial ends: stage
    stays Trial, status "Trial ended" (L7), follow-up for the owner.
    Free-trial limits are settings (default 2 per person counted by mobile
    across all branches, L6; 1 per branch), COUNTED SEPARATELY PER TRIAL
    TYPE (membership trials 2 / 1, PT trials 2 / 1, same numbers; one type
    never blocks the other), the same for every role (L1c), no per-booking
    override; over the limit the package card is disabled with the reason
    ("2 of 2 free membership trials used" / "1 free membership trial
    already at Sec 31"). Paid trials unlimited, count shown. From the 2nd
    trial of the SAME type (free + paid together) a warning shows with the
    trial history. ONE RUNNING TRIAL PER TYPE: a membership trial and a PT
    trial may run together; a second of the same type is blocked. Trial
    approval = a pending reference, not a block (L1b): every booking needs
    a comment + "Approval asked from"; booked at once, status Pending;
    the approver marks Approved /
    Rejected + remark (remark required to reject); Rejected is only
    recorded, the trial keeps running. If the branch has no SM / CM / RM
    with trials.approve, booking is NOT blocked: status "No approver
    available", shown in the CEO's "Trial approvals pending". Approvers
    (asked person; CEO for all) see pending trials in the bell and in the
    Today section "Trial approvals pending". Trial ended: the system
    creates "Trial ended · discuss plans" for the owner on the end date
    (due any time) unless an open follow-up exists on / after that date;
    the Stage dropdown offers New / Contacted / Negotiation, is locked
    while ANY trial runs (free or paid, membership or PT) and unlocks
    after. Paid trial adjust:
    running trial → the adjust checkbox is ticked and locked, full trial
    price subtracted (L4), membership start = trial start date (set by
    the system; staff can never back-date, #41 stays for staff); trial
    ended → 7-day buffer, only for roles with the grid permission (L2),
    start = today, full price subtracted (L3); beyond the buffer or
    without the permission: no adjust, one info line why; free trials
    never. A running paid PT trial is adjusted only when the lead buys
    Premium PT (same rules, into the PT line). Data: p.trials[] with type,
    kind, dates, price / paid, approval fields, endedFollowUpId,
    adjustedAt (docs/data-model.md). Built in c3. Closes Q12.
    Approver rule vs permission: `trials.approve` = who CAN approve /
    reject a pending trial (CEO = All, locked, #102). The "Approval asked
    from" dropdown (L1b) is a separate rule, not the permission: it lists
    only the SM, CM and RM of the lead's branch who have `trials.approve`.
    The CEO never appears in that dropdown but can approve / reject any
    pending trial (e.g. from a pending approvals list). Dropdown built in
    the lead flow update.
    Added 17 Nov (c4): paid PT trial adjust also applies to a NORMAL PT
    sale, only for a client with a paid membership (client Sell mode,
    built with Renewals). A lead without membership can adjust a PT trial
    only by buying Premium PT. Same running / buffer / permission rules.
    Changed by #112: PT trials are CM / MXM assessments, booked ONLY by `pt.quote` users (SE books membership trials only), with a TRAINER (required, the person's branch, a trainer type that can take PT). NO approval (L1b is for membership trials only; status "Not needed"), NO limit by default (Settings "PT trials per person", 0 = no limit, CEO). A repeat PT trial shows INFO only ("3rd PT trial · last on <date>" + history), never blocks. Paid PT trial adjust unchanged. Membership trial limits and approval unchanged.
95. Roles (notes §2a): fixed, seeded, locked `roles` table with keys
    SUPER_ADMIN (SA, all branches), CEO (multi, reports to SuperAdmin),
    REGIONAL_MANAGER (RM, multi → CEO), CLUB_MANAGER (CM, single → RM),
    SALES_MANAGER (SM, single → CM), SALES_EXECUTIVE (SE, single → SM),
    MXM (single → CM), TRAINER (TR, single → MXM), FINANCE (FIN, single →
    CM). Code uses the key, never the row id. One staff = exactly one
    `roleKey` + `branchIds[]` (exactly 1 for single-branch roles). Region
    = a grouping / filter of branches (and how branches are given to an
    RM), not a permission scope. Trainer type is not a role: an
    admin-managed Trainer types master list (name, short code, active,
    "Can take PT sessions" default Yes; seeded General Trainer GT, Personal
    Trainer PT, General + Personal GT-PT); each trainer has one
    `trainerTypeId`; any type can take PT sessions; the type only changes
    the payout (rate per type in the incentive scheme); every PT session /
    sale line stores the trainer type at that time (snapshot).
    Changed by #102: SUPER_ADMIN is a platform role (platformRoles, flag platform: true), not in the tenant roles table; CEO reports to nobody inside the tenant; 8 tenant roles.
96. Roles & permissions grid + Settings values (notes §2). Settings →
    Roles & permissions: fixed roles × actions; each cell is a tick, a
    scope (None / Own / Branch / All; Branch = the staff's branch(es)) or a
    number (discount %). Defaults ship pre-set (default grid in the notes:
    Leads, Trials, Sales, Clients, Settings rows for SE / SM / CM / RM /
    CEO; Trainer, MXM, Finance have no lead / sales access; SuperAdmin
    everything). Only CEO and SuperAdmin edit; every change is logged
    (who, when, old → new). No per-user permissions, custom roles or
    conditions. Locked rules: SuperAdmin has every permission; only CEO /
    SuperAdmin edit the grid; at least one role keeps Assign / reassign;
    an owner can always see and log follow-ups on their own leads.
    Settings values (numbers, not per role): free trials per person 2,
    per branch 1 (grid row "Edit free-trial limit settings"); paid trial
    adjust buffer 7 days (CEO); inactivity release after 7 days + warn 1
    day before (grid row "Edit inactivity release days"); new-lead
    assignment Manual (round-robin later, CEO); max discount % per role
    = the #77 numbers (SE 10, SM 20, CM 30, RM 50, CEO 50, SuperAdmin
    100; "no limit" never shows; CEO edits). Replaces every "Placeholder"
    visibility rule (#15, #56, #62, #63, #91). Added later: rows
    `clients.issueItems` (FF ID / fob / item on a client; SE–RM Branch,
    CEO All) and `settings.viewMasters` (split per master by #114; read-only Packages / Items / Tax /
    Sales rules; SM–RM Branch, CEO All); Sales rules edit maps to
    `settings.packages`. Closes Q7 (no separate
    Front desk role: front desk work = Sales Executive and Sales
    Manager, #62), Q8, Q11.
    Changed by #102: no SuperAdmin column; CEO has every permission (locked), only CEO edits the grid and the Settings values; CEO max discount 100% (Q31).
97. Follow-up assigned to a non-owner, any branch (notes L8–L11, L9b).
    The assignee sees the lead while they have an open follow-up on it;
    when it is Done / Cancelled / Closed by system the lead leaves their
    Leads list (stays in their follow-up history). Scope "Own" = leads I
    own + leads where I have an open follow-up, so the assignee can call,
    WhatsApp, add notes, log their follow-up, Book trial and Convert as
    the grid allows, on the full profile (L9b). The owner never changes by
    this. If the assignee converts they are the sales rep of that sale by
    default (#36, changeable at sale). Leads list badge "Follow-up from
    <owner>" on leads the user does not own (L11).
    Built in c4: "Assigned to" in the shared follow-up modal (grid row
    leads.assignFollowUp: Own = leads I own, Branch, All; staff of any
    branch; default = owner); follow-up field assignedToUserId. Scope
    "Own" (and "Branch") also covers leads where I have an open follow-up.
98. Lead moved to another branch (notes L12–L15). The lead's branch
    changes; the owner stays (cross-branch owner). Remark mandatory;
    timeline "Moved Sec 31 → Golf Course by Priya". Mover without the grid
    row "pick the follow-up person directly" (SE by default): the lead
    shows for the new branch's CM as "Transferred in · needs follow-up
    person" (Leads filter + Today); the CM picks an SE of that branch, who
    gets a follow-up. Mover with that row: a dropdown of the new branch's
    SEs in the move dialog, follow-up created at once. The owner's open
    follow-ups stay as they are. The new-branch SE who converts is the
    sales rep by default (#97); any owner credit is for the incentive
    scheme.
99. Owner change dialog, single or bulk (notes L16–L17). Shows "Open
    follow-ups and tasks (N)" with 3 choices, default first: (1) Move to
    the new owner; (2) Close them ("Closed by system · Owner changed") and
    create ONE new follow-up for the new owner (due = earliest open due
    date, editable); (3) Keep with the old owner (who keeps seeing the lead
    while they stay open, #97). In bulk one choice applies to all. Applies
    to open follow-ups and open tasks only; done / closed history, notes,
    timeline and trial-approval requests are not moved. Same dialog for a
    client's owner change.
    FIX (17 Nov, c4): the dialog acts ONLY on items assigned to the OLD
    OWNER. Follow-ups assigned to other staff (#97) stay with them and are
    not counted in N. N = 0 -> a plain confirm. One shared flow
    (App.Owner.change) for single assign / reassign, bulk assign, a
    client's owner change and re-opening someone else's lost lead.
    Permission: leads.assign, label "Assign / reassign / change owner
    (leads and clients)".
    Changed by #103 (Q32): if the earliest open due date is already past, the new follow-up (choice 2) is due TODAY, bulk too.
100. Inactivity release and Unassigned (notes L18–L22), built now. A lead
    is inactive when its next follow-up is overdue or not set for N days
    (setting, default 7): owner removed → Unassigned, open follow-ups and
    tasks "Closed by system · Released (inactive)", timeline entry. Applies
    to all open leads; never while a trial runs; lost leads are never
    released. Warning 1 day before (notification + "Releases tomorrow"
    badge); any follow-up logged or scheduled resets the clock. "Pool" =
    Unassigned leads, controlled only by the grid (no new screen):
    Unassigned has a reason, New (Meta / Excel / manual) or Released
    (inactive), filterable; default only CM / RM / CEO see and take them;
    giving SE View + Take (Branch) turns the pool on for SEs. "Take this
    lead" is an explicit button (no auto-claim by activity); the taker
    becomes owner, the lead's branch does not change. Lost leads are not
    Unassigned: they keep their owner; visibility by the grid row "View
    lost leads"; re-opening someone else's lost lead makes you the owner,
    with the owner-change dialog (#99) if anything is open.
    FIX (17 Nov, c4): inactive = next follow-up overdue, or no open
    follow-up. The clock counts days since the overdue due date, or since
    the last follow-up activity (else the created date) when none is open,
    and NEVER starts before the date the CURRENT owner got the lead
    (assigned, taken, re-opened, owner changed). Any follow-up activity by
    the owner or an assignee resets it. Excluded: lost, unassigned, any
    running trial, clients. Day N-1: badge "Releases tomorrow" + one
    notification to the owner per lead per day. Day N: owner removed ->
    Unassigned (reason Released); open follow-ups / tasks "Closed by
    system · Released (inactive)"; timeline "Released to Unassigned · no
    follow-up for 7 days". Setting "Release inactive leads after" (days).
    Mockup computes it on page load (real app: a daily job).
    Changed by #103 (Q36): Today's Unassigned row shows "Assign" for users with `leads.assign` (CM / RM / CEO by default) and "Take this lead" only for users who have `leads.take` but not `leads.assign`.
101. Lead stages stay 5 (notes L23–L24): New, Contacted, Trial (automatic),
    Negotiation, Lost. Converted = becomes a Client, not a stage.
    Situations are badges, not stages: Trial ended, Unassigned, Transferred
    in, Releases tomorrow, Re-opened, Follow-up from <owner>. Junk / wrong
    number / not interested are Lost reasons, not stages. Re-open returns
    to the stage before Lost (#29); if that was Trial and no trial is
    running, it returns to Negotiation.
102. Multi-tenant. One tenant = one gym business with its branches; all
    tenant data (branches, users, people, packages, sales, settings,
    permissions) carries a `tenantId`. SuperAdmin is a PLATFORM role, not a
    tenant role: it creates tenants and the tenant's first CEO account,
    nothing else for now (Q30); it has no tenant and does no gym work. CEO
    is the top role inside a tenant: every permission, locked; only the CEO
    edits Roles & permissions and the Settings values. 8 tenant roles: CEO,
    Regional Manager, Club Manager, Sales Manager, Sales Executive, MXM,
    Trainer, Finance. The grid, the Roles tab and "View as" show tenant
    roles only (View as defaults to CEO). CEO max discount 100% is a
    placeholder (Q31). The mockup shows one tenant ("Innovana Fitness
    Labs"): no tenant switcher, no SuperAdmin screens.
103. Client answers to the open questions (17 Nov 2026, c5).
    Q1 back date: see #41 (current month only, `sales.backDate`; no future start).
    Q3 trainers may see package prices (no restriction now; a grid row can come later).
    Q9 defaults confirmed: free-item rule "Once per client", package audience "Both".
    Q14 Couple PT: both people need an existing club membership (#43).
    Q17 FF ID: no format check, only unique.
    Q19 overdue balance: access = what is paid (PT sessions, #83); overdue is shown; the system never blocks.
    Q20 refund / cancel payment: grid row `payments.refund` (CEO yes, locked; others No, CEO can grant); no refund screen now.
    Q21 GST: per line stays.
    Q22 discount: % + ₹ cap, see #77.
    Q25 Ex-client: Settings value "Ex-client after N days without an active package" (default 30, CEO only). The client is
    Expired for N days after the LAST package ends (later of membership end and PT end; add-ons ignored), counted in
    renewals; then Ex-client (own card / filter, out of renewals).
    Q27 paid trial adjust GST: GST on the net amount (package price − trial paid), e.g. ₹20,000 − ₹800 = ₹19,200 incl. GST.
    Q28 sales credit = the sales rep selected on the line (#36). Q29 not a feature. Q31 CEO limit set by the club in the grid.
    Q30 SuperAdmin brings the tenant in and adds the basic staff; the CEO adds the rest later.
    Q32 see #99. Q33 "Assigned to" = roles with `leads.view`. Q34 release closes all open follow-ups / tasks on the lead.
    Q35 "Branch" scope also covers leads where I have an open follow-up. Q36 see #100. Q37 assign lists the lead's branch staff.
    Premium PT change: see #92, #93.
    Parked (later phase): Q2 (PT upgrade trainer change: MXM and above, not SE), Q4, Q6, Q10, Q13, Q18, call + WhatsApp integration setup.
    Added 17 Nov (c6): client status by the later end, renewal per package (#27, #31) and PT on hold without an active membership (#42, #83).
104. Lead lifecycle foundation (18 Nov 2026, c8; spec: docs/lead-lifecycle.md). Two dimensions: STAGE (New, Contacted,
    Trial, Negotiation, Lost; Converted = becomes a Client) and OWNERSHIP (owner, or Unassigned + reason New / Released;
    more reasons later; clients use the same model for renewals later). Every state change is an EVENT
    { type, from, to, reason, remark, byUserId, at, branchId }; the timeline is built from events. Old dummy timelines stay
    text; only new actions write events. Logic never checks a role name (#96): new grid rows `leads.own` "Can own leads"
    and `sales.rep` "Can be sales rep" (SE, SM, CM, RM, CEO yes, CEO locked; MXM, TR, FIN no) replace the hard-coded role
    lists (owner lists, follow-up person, release / pick lists, sales rep list). Trial approver dropdown = staff of the lead's
    branch with `trials.approve` at BRANCH scope only (All-scope, e.g. CEO, never listed; CEO can approve any). Trainer =
    user with a trainer type. New roles (e.g. Finance Manager, HR) are added by us; tenants don't create roles. Demo-only
    role-name checks are listed as debt in the lifecycle doc.
105. Cross-branch follow-up. Another branch's lead is found only by the FULL mobile number (across branches, like the
    duplicate check) and opens READ-ONLY: name, full mobile, owner "Owner: Arjun Nair (Sec 65)", branch, stage, timeline;
    no actions. Grid row `leads.crossBranchFollowUp` (SE, SM, CM, RM yes; CEO locked): "Add a follow-up for myself"; via
    #97 my open follow-up makes the lead "Own" for me (full profile + my role's actions: Book trial, Convert). Other
    branches' leads never show in the normal list.
106. Sell here + owner-change setting. Grid row `sales.sellCrossBranch` (same defaults; needs `leads.crossBranchFollowUp`):
    "Sell here" = add my follow-up + open Convert, remark required. Setting "When another branch's staff works on a lead,
    owner changes" = On sale (default) / On first follow-up / Never (CEO). On the trigger: the lead moves to that staff's
    branch, owner = that staff, the old owner's open follow-ups / tasks "Closed by system · Taken over by <branch>", an
    event for each; the inactivity clock restarts (#99 / #100). "On first follow-up" fires on the cross-branch follow-up
    AND on Sell here. "Never": owner and branch stay; the seller is only the sales rep. Cancel of Sell here changes
    nothing except a SellHereCancelled event.
107. Sales rep default = the person creating the sale, everywhere incl. Premium PT (replaces the #103 "lead owner"
    default); the PT quote trainer is separate. Dropdown = users with `sales.rep` in ANY branch. Every change =
    SalesRepChanged event. No separate permission (#36 changed).
108. Notification rules (Settings › Roles & permissions › Notification rules): event x role (RM, CM, SM), a checkbox per
    cell, CEO edits (audited). Events: Lead transferred in, Lead released (inactive), Cross-branch work on a lead
    (follow-up / sale). Default CM only. Each role gets only its own branch(es). Directly involved people (owner, old
    owner, approver) are ALWAYS notified (locked). Shown in the bell. More events later (PT quote requested, Client
    assigned to you).
109. Transferred-in pick (#98): the "Pick follow-up person" modal has "Make them owner" (ticked by default) -> the owner
    change rules (#99), event OwnerChanged reason TransferPick. The person list = staff of the branch with `leads.own`.
110. PT quote flow, grid rows (18 Nov 2026, c9). RULE: Sales Executives sell MEMBERSHIP only; PT and Premium PT are decided
    by CM or MXM (trainer, price / quote, PT trial with whom); the SE then bills exactly that quote, prefilled, no changes.
    Rows: `sales.sellMembership` (SE, SM, CM, RM, CEO yes; No hides membership packages in Convert), `pt.quote` "Create
    PT quote / book PT trial" (CM, MXM, RM = Branch; CEO locked All), `sales.sellPTDirect` "Sell PT / Premium PT without
    a quote" (CEO only, locked), `sales.sellFromQuote` "Bill a PT quote" (SE, SM, CM yes; MXM No, CEO can grant; CEO
    locked). Every real branch has an MXM and a trainer (dummy: Rakesh, Imran at Sec 65). Also: "CEO sees all pending
    trial approvals" now comes from `trials.approve` = All scope, not the role name.
111. Request + create a PT quote (leads only for now; client PT quotes come with client Sell mode / Renewals; the data
    model is person-agnostic). REQUEST (SE, `sales.sellFromQuote` without `pt.quote`): "Ask" = staff of the person's
    branch with `pt.quote` at BRANCH scope (preselected if only one), note required, ONE open request per person, event
    QuoteRequested, notification rule "PT quote requested" (asked person ALWAYS; RM / CM / SM per the rules table,
    default none). While the request is open the person is visible to the asked person, and while a quote is Open to
    its creator, even with `leads.view` = None, but ONLY view + quote actions (same idea as #97). Bell + Today section
    "PT quote requests" (open requests asked from me). CREATE (`pt.quote`): package (lead: Premium PT only, #89),
    TRAINER (the person's branch, active trainer type that can take PT), price + discount within the CREATOR's own limit
    (% and ₹ cap, #103; Premium PT discount on the PT part only, reason when > 0), valid till = today + Settings "PT
    quote valid for N days" (7, CEO), note; optional "Book a PT trial with this trainer". Status Open / Used / Expired
    / Cancelled; events QuoteCreated / QuoteUsed / QuoteExpired (system job) / QuoteCancelled. The open request closes
    when a quote is created. Several Open quotes per person allowed (options). Cancel: the creator or any `pt.quote`
    user with Branch scope there.
112. PT trials (see #94 change): CM / MXM assessments with a trainer, no approval, no limit by default, repeats are info.
113. Billing a quote (Convert). Picking an Open quote fills the bill LOCKED: package, trainer, price, discount; only payment
    (and FF ID / key fob as usual) is entered. Paid PT trial adjust still applies automatically (#94). Sales rep = the
    person creating the sale (#107), separate from the trainer. TRAINER on the PT line = the quote's trainer: gets the
    PT INCENTIVE and is the SESSION trainer until a trainer change. Incentive and session payout stay two separate
    things: the session payout goes by the trainer who takes each session and that trainer's type (#95). On save the
    quote becomes Used.
114. Permissions: masters, Finance / HR, new roles (18 Nov 2026, c11). (a) `settings.viewMasters` is dropped; EVERY master has
    its own View row with the same defaults (SM / CM / RM Branch, CEO All locked, others None): `settings.viewPackages`,
    `viewItems`, `viewTax`, `viewSalesRules`, `viewTrainerTypes`, `viewLeadSources`, `viewLostReasons`. Edit rules unchanged
    (Packages / Items / Tax / Sales rules: `settings.packages`; Trainer types: `settings.rolesPermissions`); new
    `settings.editLeadSources` (CEO + Marketing). (b) Finance and HR are MULTI-branch: branches chosen when the user is
    created (one or many). Only CEO = All. (c) Two fixed roles: MARKETING (MKT) and HR, each a grid column; None / No / 0
    on every lead, trial, sales and client key. Marketing: View + edit Lead sources. HR: nothing in the mockup yet (staff
    screens are real-app only). No role-specific code paths.
115. Lead sources branch-assignable; master row types (18 Nov 2026, c12). A lead source has "Applies to" = all branches
    (default) or selected branches (a region = pick its branches). Creating / editing a lead: the Source dropdown shows
    only sources that apply to the lead's branch. `settings.viewLeadSources` and `settings.editLeadSources` are SCOPE
    (Branch = see / create / edit sources only for my own branches). Defaults: CEO All (locked); Marketing and RM View +
    Edit Branch; CM, SM View Branch, Edit None; SE View Branch (dropdown), Edit None; others None. COMPANY-wide masters
    (Lost reasons, Tax, Sales rules, Trainer types) have TICK View / Edit rows; BRANCH-owned masters (Packages, Items /
    stock, Lead sources) have SCOPE rows. New `settings.editLostReasons`: CEO only. Marketing is MULTI-branch (like
    Finance / HR). Marketing and HR report to CEO. No lead-source / lost-reason / trainer-type screen in the mockup.
116. Masters, lead source filter, export, payment reference (19 Nov 2026, c13). Closes Q32–Q34.
    (a) Q32: masters (Packages incl. which branches sell them, Items, Tax, Sales rules) are always COMPANY-level, decided
    by the CEO: `settings.packages` stays a CEO-only tick, no split. The branch part is separate: stock of items per
    branch = `settings.stock` (scope; RM / CM add and manage their branch's stock); selling = the `sales.*` rows.
    (b) Q33: edit lead keeps a saved source that no longer applies to the lead's branch (history stays true) with a small
    note "Not used at this branch"; if the user changes it, only sources for the lead's branch are offered.
    (c) Q34: Leads list Source filter = company-wide sources + the sources of the top-bar branch; "All branches" shows all
    sources, branch-specific ones tagged with their branches ("Hoarding · Sec 31"). Filtering keeps the selected branch.
    (d) `leads.export` "Export leads" (tick): CEO Yes (locked), everyone else No. Real app only; no export screen.
    (e) Payment reference (Convert payment step). Cash: reference = the receipt number, automatic, not editable. Each other
    method has "Needs reference" (Sales rules > Payment methods): UPI = UTR / transaction ID, Card = approval code or
    last 4, Cheque = cheque number + bank name, Bank transfer = UTR. Duplicate = same method + same reference anywhere in
    the company (cheque: same bank + number; spaces / case ignored). NOT a block: a warning showing where it was used
    ("Used on 12 Nov in Rahul Verma's payment"); staff must tick a confirm box and give a reason; the payment row is
    flagged for Finance / CEO (badge on the profile receipt). "Net banking" is renamed "Bank transfer" (label changed by #117).
117. Payment reference everywhere; duplicate notification + Today (19 Nov 2026, c14). Changes #116 (e).
    (a) The SAME payment-reference rules apply everywhere money is taken: Convert payment step, Collect payment (balance)
    and the paid-trial payment, through ONE shared payment part (`App.PayRef`): Cash = the receipt no. (auto, read-only);
    other methods = the method's reference label (+ bank name for Cheque); duplicate = warning + confirm + reason + flag.
    (b) Notification-rules event "Duplicate payment reference": any role can be ticked, default CEO only; the CEO can tick
    Finance and others. Each ticked role gets it for its own branch(es).
    (c) Today section "Flagged payments" for the people that rule notifies (role ticked + the payment's branch is theirs).
    Row: client, amount, method + reference, where it was used before, staff, reason. No separate list screen.
    (d) One method "Bank transfer (NEFT / IMPS / Net banking)" (reference = UTR). Cheque stays disabled by default.
    (e) The duplicate check covers the whole company with no time limit (it's only a warning). When the branch changes,
    the Leads Source filter clears a source that doesn't apply (confirmed).
118. Flagged payment review; mockup aligned with the real build (19 Nov 2026, c15). Changes #19, #76.
    (a) "Mark reviewed" on a flagged payment (Today row + profile receipt), for the people the "Duplicate payment
    reference" rule notifies (role ticked + the payment's branch is theirs; CEO all). Optional note. It leaves Today; the
    receipt keeps "Reviewed by <name> · <date>" (+ note). Event FlaggedPaymentReviewed. No bell for the dummy p22.
    (b) Events: a stage change writes StageChanged (details edit; automatic Trial on booking); Mark lost writes
    MarkedLost; Re-open writes Reopened.
    (c) Duplicate mobile check (quick lead + edit lead) also covers STAFF numbers ("This number belongs to a staff
    member") and says what it found: "Already a lead · Owner Priya · Sec 65" / "Already a client · CL-1000 · Sec 31".
    "Open profile" only if the user can see that person; otherwise only that it exists + owner + branch (replaces the
    #19 "Request access" link). Save stays blocked while it's a duplicate.
    (d) Quick lead owner: default = me if I hold `leads.own`; picking another owner or "Unassigned" needs `leads.assign`
    (replaces #76 "any creator can pick any owner"); a user without `leads.own` creates the lead Unassigned (reason New).
    (e) Creating a lead checks `leads.create` (quick lead doesn't open without it); Mark lost checks `leads.markLost`.
    (f) A creator who can't see Unassigned leads gets no profile after saving one, only a confirmation.
    (g) Phone numbers are stored as E.164 (+91XXXXXXXXXX: `person.phone`, staff `user.mobile`); the duplicate check
    normalizes the typed number (spaces, leading 0, +91 / 91) to E.164 first. The screen still shows "+91 90000 01234".
119. Convert event, staff numbers, search, follow-ups (19 Nov 2026, c16; real build stage 3). Changes #118.
    (a) Converting writes ONLY the Converted event (the stage is kept as history), no StageChanged.
    (b) Staff numbers BLOCK saving a lead (staff are never leads / clients).
    (c) Top-bar search (and the Clients search) match numbers with the same E.164 normalization as the duplicate check
    (+91 / 91 / leading 0 / spaces / dashes ignored).
    (d) Follow-up types are a FIXED code list (not a master): Call (CALL), WhatsApp (WHATSAPP), Visit planned
    (VISIT_PLANNED), Free trial planned (FREE_TRIAL_PLANNED), Payment expected (PAYMENT_EXPECTED).
    (e) "Closed by system" notices go to the lead's owner AND the follow-up's assignee if different.
    (f) Unassigned leads can't get follow-ups: take or assign first. Every "Add follow-up" button is disabled with the
    reason ("Take or assign this lead first"); a quick lead saved Unassigned doesn't ask for a first follow-up.
    (g) Inactivity release runs daily at 02:00 India time (IST).
120. Settings values page, bell, Today unassigned rows (19 Nov 2026, c17; real build). Confirms #119 for clients.
    (a) A client with no owner CAN get follow-ups; "take or assign first" is for leads only.
    (b) Today "Overdue or not set" rows for an Unassigned lead show Take / Assign (as the Unassigned section does), not a
    disabled "Add follow-up".
    (c) Settings values: besides the CEO's Roles & permissions tab, a separate page "Settings values" (Settings › General
    settings card, `features/settings/values.html`) opens for anyone who can edit at least one key; they see ALL values
    but edit only theirs (the key's grid row; values with no row = CEO). "Reset to defaults" there resets only the keys
    the user may edit. No editable key → "You don't have access to settings values".
    (d) Bell: the unread count refreshes every 60 s and when the tab gets focus; "Mark all read"; read notifications older
    than 90 days are deleted nightly at 02:00 India time (unread ones are kept).
    (e) Until the real app has the notification-rules screen, recipients are chosen by permission key; the mockup's rules
    screen stays the target (lifecycle doc).
