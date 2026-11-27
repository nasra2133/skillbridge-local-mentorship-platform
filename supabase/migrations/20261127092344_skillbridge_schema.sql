/*
# SkillBridge core schema

1. New Tables
- `profiles` - one row per person/org: role (mentor|learner|org|admin), name, photo_url, phone, location, bio, languages (text[]), is_under_18, created_at. `id` references auth.users so auth.uid() matches.
- `mentor_details` - extends a mentor profile: trade, years_experience, support_types[], cost_type (free|paid|swap), price, formats[], max_learners, verified, category.
- `skills` - catalog of skills with category; `profile_skills` - links profiles to skills with type teach/learn.
- `availability` - weekly slots per mentor (day_of_week, start_time, end_time).
- `mentorship_requests` - learner -> mentor request with message and status (pending|accepted|declined|completed).
- `sessions` - booked sessions with start_time, format, status.
- `reviews` - rating + comment on completed sessions.
- `opportunities` - apprenticeships/workshops posted by mentors/orgs (title, description, skills[], duration, location, apply_instructions, status).
- `applications` - one-tap learner applications with status.
- `success_stories` - submitted stories with photo, status pending/approved.
- `reports` - abuse reports (reporter_id, target_id, reason).

2. Security
- RLS enabled on every table.
- Public catalog data (profiles of mentors, skills, approved stories, open opportunities, mentor details, availability) is readable by anon + authenticated.
- Personal rows (own profile, own requests, own sessions, own applications, own stories) are owner-scoped via auth.uid().
- Requests/sessions/reviews/applications readable by the two participants only.
- Contact details (phone) are hidden from general profile reads: only your own row exposes phone; the mentor of an accepted request sees the learner's phone via a SECURITY DEFINER view (sk_learner_contacts), and vice versa (sk_mentor_contacts).
- Grants: SELECT on public tables to anon+authenticated; full CRUD on owner-scoped tables to authenticated; column-restricted UPDATE on profiles (verified is admin-set via service role only).

3. Notes
- Seeding of sample mentors happens in a follow-up migration (anon-visible demo data with stable UUIDs).
*/
