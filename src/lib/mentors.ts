import { useEffect, useState } from 'react';
import { supabase, type MentorCard, type MentorDetail, type Profile, type Review } from '@/lib/supabase';

export type { MentorCard };

export async function fetchMentorCards(): Promise<MentorCard[]> {
  const [{ data: details }, { data: mentorProfiles }, { data: teachSkills }, { data: reviews }] =
    await Promise.all([
      supabase.from('mentor_details').select('*'),
      supabase.from('profiles').select('*').eq('role', 'mentor'),
      supabase.from('profile_skills').select('profile_id, type, skills(name)').eq('type', 'teach'),
      supabase.from('reviews').select('reviewer_id, session_id, rating'),
    ]);
  if (!details || !mentorProfiles) return [];
  const profiles = mentorProfiles as Profile[];
  const detailByProfile = new Map<string, MentorDetail>(
    (details as MentorDetail[]).map((d) => [d.profile_id, d])
  );
  const skillsByProfile = new Map<string, string[]>();
  for (const ps of (teachSkills ?? []) as unknown as { profile_id: string; skills: { name: string }[] | null }[]) {
    if (!ps.skills) continue;
    const list = skillsByProfile.get(ps.profile_id) ?? [];
    for (const s of ps.skills) list.push(s.name);
    skillsByProfile.set(ps.profile_id, list);
  }
  const ratingByReviewer = new Map<string, { sum: number; count: number }>();
  for (const r of (reviews ?? []) as Review[]) {
    const cur = ratingByReviewer.get(r.reviewer_id) ?? { sum: 0, count: 0 };
    cur.sum += r.rating;
    cur.count += 1;
    ratingByReviewer.set(r.reviewer_id, cur);
  }
  return profiles
    .filter((p) => detailByProfile.has(p.id))
    .map((p) => {
      const detail = detailByProfile.get(p.id)!;
      const r = ratingByReviewer.get(p.id);
      return {
        profile: p,
        detail,
        skills: skillsByProfile.get(p.id) ?? [],
        rating: r ? r.sum / r.count : null,
        reviewCount: r?.count ?? 0,
      };
    });
}

export function useMentorCards() {
  const [cards, setCards] = useState<MentorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetchMentorCards()
      .then(setCards)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);
  return { cards, loading, error };
}

export async function fetchMentorProfile(id: string): Promise<{
  profile: Profile;
  detail: MentorDetail;
  skills: string[];
  reviews: (Review & { reviewerName: string })[];
  availability: { day_of_week: number; start_time: string; end_time: string }[];
} | null> {
  const [{ data: profile }, { data: detail }, { data: teachSkills }, { data: avail }] =
    await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
      supabase.from('mentor_details').select('*').eq('profile_id', id).maybeSingle(),
      supabase.from('profile_skills').select('skills(name)').eq('profile_id', id).eq('type', 'teach'),
      supabase.from('availability').select('day_of_week, start_time, end_time').eq('mentor_id', id),
    ]);
  if (!profile || !detail) return null;
  const { data: reviewRows } = await supabase
    .from('reviews')
    .select('*, sessions!inner(mentor_id)')
    .eq('sessions.mentor_id', id)
    .order('created_at', { ascending: false });
  const reviews: (Review & { reviewerName: string })[] = [];
  for (const r of (reviewRows ?? []) as (Review & { sessions: { mentor_id: string } })[]) {
    const { data: reviewer } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', r.reviewer_id)
      .maybeSingle();
    reviews.push({ ...r, reviewerName: reviewer?.name ?? 'Learner' });
  }
  return {
    profile: profile as Profile,
    detail: detail as MentorDetail,
    skills: ((teachSkills ?? []) as unknown as { skills: { name: string }[] }[])
      .flatMap((s) => s.skills?.map((x) => x.name) ?? []),
    reviews,
    availability: (avail ?? []) as { day_of_week: number; start_time: string; end_time: string }[],
  };
}
