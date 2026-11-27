/*
# Saved mentors

1. New Tables
- `saved_mentors` (learner_id, mentor_id, created_at) - mentors a learner bookmarked.

2. Security
- RLS enabled; owner-scoped CRUD via auth.uid() = learner_id.
- Grant CRUD to authenticated only.
*/
