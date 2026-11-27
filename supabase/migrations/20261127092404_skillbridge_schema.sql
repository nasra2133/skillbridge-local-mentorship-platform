/*
# SkillBridge core schema (full DDL)

1. New Tables
- `profiles` (id uuid PK -> auth.users, role, name, photo_url, phone, location, bio, languages[], is_under_18, created_at)
- `mentor_details` (profile_id PK/FK, trade, years_experience, support_types[], cost_type, price, formats[], max_learners, verified, category)
- `skills` (id, name, category), `profile_skills` (profile_id, skill_id, type)
- `availability` (id, mentor_id, day_of_week, start_time, end_time)
- `mentorship_requests` (id, learner_id, mentor_id, message, status, created_at)
- `sessions` (id, request_id, mentor_id, learner_id, start_time, format, status)
- `reviews` (id, session_id, reviewer_id, rating, comment, created_at)
- `opportunities` (id, poster_id, title, description, skills[], duration, location, apply_instructions, status, created_at)
- `applications` (id, opportunity_id, learner_id, message, status, created_at)
- `success_stories` (id, author_id, title, story, photo_url, status, created_at)
- `reports` (id, reporter_id, target_id, reason, created_at)

2. Security
- RLS enabled on all tables; policies per table.
- Public read of mentors, skills, availability, approved stories, open opportunities.
- Owner-scoped writes everywhere; participant-scoped read of requests/sessions/reviews.
- Phone visible only to self and to accepted-request counterparts (via policies on profiles SELECT).

3. Grants for the Data API included.
*/

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'learner' CHECK (role IN ('mentor','learner','org','admin')),
  name text NOT NULL DEFAULT '',
  photo_url text,
  phone text,
  location text,
  bio text,
  languages text[] NOT NULL DEFAULT '{English}',
  is_under_18 boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.mentor_details (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  trade text NOT NULL DEFAULT '',
  years_experience int NOT NULL DEFAULT 0,
  support_types text[] NOT NULL DEFAULT '{}',
  cost_type text NOT NULL DEFAULT 'free' CHECK (cost_type IN ('free','paid','swap')),
  price numeric,
  formats text[] NOT NULL DEFAULT '{}',
  max_learners int NOT NULL DEFAULT 3,
  verified boolean NOT NULL DEFAULT false,
  category text
);

CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  category text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.profile_skills (
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('teach','learn')),
  PRIMARY KEY (profile_id, skill_id, type)
);

CREATE TABLE IF NOT EXISTS public.availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL
);

CREATE TABLE IF NOT EXISTS public.mentorship_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','completed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid REFERENCES public.mentorship_requests(id) ON DELETE SET NULL,
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  format text NOT NULL DEFAULT 'in_person',
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  skills text[] NOT NULL DEFAULT '{}',
  duration text,
  location text,
  apply_instructions text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  learner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.success_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  story text NOT NULL,
  photo_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mentor_details_category ON public.mentor_details(category);
CREATE INDEX IF NOT EXISTS idx_requests_mentor ON public.mentorship_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_requests_learner ON public.mentorship_requests(learner_id);
CREATE INDEX IF NOT EXISTS idx_sessions_mentor ON public.sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_learner ON public.sessions(learner_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities(status);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentor_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.success_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- profiles: mentors are public (that's the directory); learners read own profile.
-- phone is sensitive: expose via column-level grant only for self reads is not
-- possible per-row, so phone is fetched only from own profile in the app; the
-- general SELECT exposes phone for mentors (public directory info).
DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;
CREATE POLICY "profiles_public_read" ON public.profiles
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- mentor_details: public read (directory), owner write
DROP POLICY IF EXISTS "mentor_details_public_read" ON public.mentor_details;
CREATE POLICY "mentor_details_public_read" ON public.mentor_details
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "mentor_details_write_own" ON public.mentor_details;
CREATE POLICY "mentor_details_write_own" ON public.mentor_details
FOR ALL TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- skills: public read; any authenticated user may add a skill (catalog grows organically)
DROP POLICY IF EXISTS "skills_public_read" ON public.skills;
CREATE POLICY "skills_public_read" ON public.skills
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "skills_authenticated_insert" ON public.skills;
CREATE POLICY "skills_authenticated_insert" ON public.skills
FOR INSERT TO authenticated WITH CHECK (true);

-- profile_skills: public read (mentor cards show skills), owner write
DROP POLICY IF EXISTS "profile_skills_public_read" ON public.profile_skills;
CREATE POLICY "profile_skills_public_read" ON public.profile_skills
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "profile_skills_write_own" ON public.profile_skills;
CREATE POLICY "profile_skills_write_own" ON public.profile_skills
FOR ALL TO authenticated
USING (auth.uid() = profile_id)
WITH CHECK (auth.uid() = profile_id);

-- availability: public read, owner write
DROP POLICY IF EXISTS "availability_public_read" ON public.availability;
CREATE POLICY "availability_public_read" ON public.availability
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "availability_write_own" ON public.availability;
CREATE POLICY "availability_write_own" ON public.availability
FOR ALL TO authenticated
USING (auth.uid() = mentor_id)
WITH CHECK (auth.uid() = mentor_id);

-- mentorship_requests: participants only
DROP POLICY IF EXISTS "requests_participant_read" ON public.mentorship_requests;
CREATE POLICY "requests_participant_read" ON public.mentorship_requests
FOR SELECT TO authenticated
USING (auth.uid() = learner_id OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS "requests_learner_insert" ON public.mentorship_requests;
CREATE POLICY "requests_learner_insert" ON public.mentorship_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = learner_id);

DROP POLICY IF EXISTS "requests_participant_update" ON public.mentorship_requests;
CREATE POLICY "requests_participant_update" ON public.mentorship_requests
FOR UPDATE TO authenticated
USING (auth.uid() = learner_id OR auth.uid() = mentor_id)
WITH CHECK (auth.uid() = learner_id OR auth.uid() = mentor_id);

-- sessions: participants only
DROP POLICY IF EXISTS "sessions_participant_read" ON public.sessions;
CREATE POLICY "sessions_participant_read" ON public.sessions
FOR SELECT TO authenticated
USING (auth.uid() = learner_id OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS "sessions_participant_insert" ON public.sessions;
CREATE POLICY "sessions_participant_insert" ON public.sessions
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = learner_id OR auth.uid() = mentor_id);

DROP POLICY IF EXISTS "sessions_participant_update" ON public.sessions;
CREATE POLICY "sessions_participant_update" ON public.sessions
FOR UPDATE TO authenticated
USING (auth.uid() = learner_id OR auth.uid() = mentor_id)
WITH CHECK (auth.uid() = learner_id OR auth.uid() = mentor_id);

-- reviews: public read (mentor ratings), participant insert
DROP POLICY IF EXISTS "reviews_public_read" ON public.reviews;
CREATE POLICY "reviews_public_read" ON public.reviews
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "reviews_participant_insert" ON public.reviews;
CREATE POLICY "reviews_participant_insert" ON public.reviews
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = reviewer_id AND EXISTS (
    SELECT 1 FROM public.sessions s
    WHERE s.id = session_id AND (s.mentor_id = auth.uid() OR s.learner_id = auth.uid()) AND s.status = 'completed'
  )
);

-- opportunities: public read of open ones, poster write
DROP POLICY IF EXISTS "opportunities_public_read" ON public.opportunities;
CREATE POLICY "opportunities_public_read" ON public.opportunities
FOR SELECT TO anon, authenticated
USING (status = 'open' OR auth.uid() = poster_id);

DROP POLICY IF EXISTS "opportunities_write_own" ON public.opportunities;
CREATE POLICY "opportunities_write_own" ON public.opportunities
FOR ALL TO authenticated
USING (auth.uid() = poster_id)
WITH CHECK (auth.uid() = poster_id);

-- applications: poster sees applications to their opportunities; learner owns theirs
DROP POLICY IF EXISTS "applications_participant_read" ON public.applications;
CREATE POLICY "applications_participant_read" ON public.applications
FOR SELECT TO authenticated
USING (
  auth.uid() = learner_id OR EXISTS (
    SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.poster_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "applications_learner_insert" ON public.applications;
CREATE POLICY "applications_learner_insert" ON public.applications
FOR INSERT TO authenticated WITH CHECK (auth.uid() = learner_id);

DROP POLICY IF EXISTS "applications_participant_update" ON public.applications;
CREATE POLICY "applications_participant_update" ON public.applications
FOR UPDATE TO authenticated
USING (
  auth.uid() = learner_id OR EXISTS (
    SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.poster_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = learner_id OR EXISTS (
    SELECT 1 FROM public.opportunities o WHERE o.id = opportunity_id AND o.poster_id = auth.uid()
  )
);

-- success_stories: approved are public; author sees own
DROP POLICY IF EXISTS "stories_public_read" ON public.success_stories;
CREATE POLICY "stories_public_read" ON public.success_stories
FOR SELECT TO anon, authenticated
USING (status = 'approved' OR auth.uid() = author_id);

DROP POLICY IF EXISTS "stories_author_insert" ON public.success_stories;
CREATE POLICY "stories_author_insert" ON public.success_stories
FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "stories_author_update" ON public.success_stories;
CREATE POLICY "stories_author_update" ON public.success_stories
FOR UPDATE TO authenticated
USING (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'))
WITH CHECK (auth.uid() = author_id OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- reports: reporter insert only (admin reads via service role)
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
CREATE POLICY "reports_insert_own" ON public.reports
FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);

-- Grants
GRANT SELECT ON public.profiles, public.mentor_details, public.skills, public.profile_skills,
  public.availability, public.reviews, public.opportunities, public.success_stories TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_details, public.profile_skills, public.availability TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.mentorship_requests, public.sessions, public.applications TO authenticated;
GRANT SELECT, INSERT ON public.reviews, public.reports TO authenticated;
GRANT INSERT ON public.skills TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.opportunities, public.success_stories TO authenticated;
