/*
# SkillBridge seed data

1. Changes
- Drops the FK from profiles.id to auth.users so demo mentors/learners/orgs can exist as
  showcase rows without real login accounts (writes still require auth.uid() = id via RLS).
- Seeds the skills catalog (8 categories).
- Seeds 6 demo mentors (welder in Nairobi, retired teacher in Nakuru, poultry farmer in Kisumu,
  tailor in Mombasa, phone repairer in Nairobi, caterer in Kisumu), 1 demo organization,
  2 demo learners, mentor_details, profile_skills, availability.
- Seeds one accepted request chain -> completed sessions -> reviews so mentor ratings show.
- Seeds 3 open opportunities (poster = demo org and a mentor) and 3 approved success stories.

2. Security
- No policy changes. Seed rows bypass RLS (run as migration role); public-read policies
  already allow the app to display them. Demo rows are intentionally public.
*/
