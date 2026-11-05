# App brief

Gym CRM for multi-branch gyms. Users are front desk, sales staff, trainers
and managers. Goal: no lead is ever forgotten, and a lead becomes a client
in a few clicks.

## Main flow
Lead created → follow-ups (call / WhatsApp / visit / free trial) → outcome:
Lost (with reason, can re-open) | still a Lead | Paid service → Convert to
Client → Proceed to Payment (placeholder).

## App shell
Top bar: global search, "+ Lead" button, branch switcher, "View as role"
switcher, notifications. Sidebar: Today, Leads, Clients, Follow-ups, Tasks,
Settings.

## Screens (build later, one by one)
1. Today — overdue follow-ups, today's follow-ups, my tasks, unassigned new
   leads.
2. Leads list — pipeline cards (click = filter), search, filters (stage,
   owner, source + "More filters"), columns: name+mobile, stage/temperature,
   source, owner, NEXT FOLLOW-UP (prominent), last activity. Row click opens
   the profile drawer.
3. Profile drawer — left fixed column: name, mobile, branch, badges (Lead/
   Client, source, stage, temperature), quick actions (call, WhatsApp, email,
   add follow-up), NEXT STEP box, owner, source, Convert button. Right: tabs.
   Timeline merges follow-ups, notes, calls, WhatsApp and milestones, with
   one composer at the bottom (toggle: Note / Follow-up / WhatsApp).
4. Quick lead modal — name, country code + mobile (live duplicate check),
   source, temperature. "More details": email, gender, birth date, FF ID,
   inquiry type (Call / Walk-in), campaign, remarks.
5. Follow-up modals — Add: type, date + time, note. Complete: outcome chips
   (Interested, No answer, Call later, Will visit, Not interested), note,
   next follow-up quick picks (Tomorrow, 3 days, 1 week, custom).
6. Tasks — my tasks list (Open / Done) and task modal: title, assigned to,
   due date+time, priority (Critical / High / Medium / Low), linked lead or
   client, note.
7. Convert to Client stepper — confirm details (email, gender, birth date,
   FF ID) → choose package (price shown, locked; discount + reason) → sale
   type auto (Trial / Trial Paid / Paid) → key fob from branch stock (Paid
   membership only) → "Proceed to Payment" placeholder.
8. Global search — command palette. Detects type: phone, email, FF ID,
   client no, key fob no. Results grouped: Leads, Clients, Ex-clients. Shows
   records in other branches with their owner. 2–3 quick actions per result.
   No result → "Create lead with this number" (prefilled).
9. Settings — key fob stock per branch; lead sources; follow-up types;
   lost reasons; lead stages.

## Default lists (configurable unless marked fixed)
- Lead sources: Walk-in, Phone Call, Referral, WhatsApp, Website, Facebook,
  Instagram, Google, Hoarding, Pamphlet, Others.
- Follow-up types: Call, WhatsApp, Visit planned, Free trial planned,
  Payment expected.
- Lost reasons: Price high, Joined competitor, Not interested, No response,
  Location issue, Timing issue, Health issue, Already a member elsewhere,
  Shifted location, Other (needs text).
- Temperature (fixed): Hot, Warm, Cold.
- Default stages: New, Contacted, Trial, Negotiation + fixed Converted, Lost.

## Lead fields
Name*, Mobile* (country code), Email, Gender, Birth date, FF ID, Source*,
Temperature*, Inquiry type, Campaign, Owner* (prefilled), Branch*
(prefilled), Remarks, Stage (system), Lost reason, External ID (for future
sync), Created / Last activity (system).

## Client adds
Client no (auto), Home branch, Joined date, Key fob, Photo, Membership.
