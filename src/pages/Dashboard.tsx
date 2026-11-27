import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Inbox,
  CalendarDays,
  Star,
  Heart,
  BookOpen,
  Briefcase,
  PlusCircle,
  ShieldCheck,
  Quote,
} from 'lucide-react';
import { supabase, type MentorshipRequest, type Opportunity, type Profile, type Session, type SuccessStory } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/router';
import { Avatar, Spinner, ErrorNote, Stars } from '@/components/ui';

const statusStyles: Record<string, string> = {
  pending: 'bg-ember-100 text-ember-700',
  accepted: 'bg-forest-100 text-forest-700',
  declined: 'bg-red-100 text-red-700',
  completed: 'bg-clay-200 text-clay-700',
  scheduled: 'bg-forest-100 text-forest-700',
  cancelled: 'bg-red-100 text-red-700',
  approved: 'bg-forest-100 text-forest-700',
  rejected: 'bg-red-100 text-red-700',
  open: 'bg-forest-100 text-forest-700',
  closed: 'bg-clay-200 text-clay-700',
};

type RequestRow = MentorshipRequest & { otherName: string; otherTrade?: string; learnerUnder18?: boolean };

export function DashboardPage() {
  const { t } = useI18n();
  const { session, profile, loading: authLoading } = useAuth();

  if (authLoading) return <Spinner />;
  if (!session || !profile) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-forest-900">Please sign in to see your dashboard</h1>
        <button onClick={() => navigate('/auth')} className="btn-primary mt-6">{t('signIn')}</button>
      </main>
    );
  }
  if (profile.role === 'org') return <OrgDashboard profile={profile} />;
  if (profile.role === 'mentor') return <MentorDashboard profile={profile} />;
  return <LearnerDashboard profile={profile} />;
}

/* ---------------- MENTOR ---------------- */

function MentorDashboard({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: reqs, error: e1 } = await supabase
        .from('mentorship_requests')
        .select('*')
        .eq('mentor_id', profile.id)
        .order('created_at', { ascending: false });
      if (e1) throw e1;
      const rows: RequestRow[] = [];
      for (const r of (reqs ?? []) as MentorshipRequest[]) {
        const { data: learner } = await supabase
          .from('profiles')
          .select('name, is_under_18')
          .eq('id', r.learner_id)
          .maybeSingle();
        rows.push({ ...r, otherName: learner?.name ?? 'Learner', learnerUnder18: learner?.is_under_18 });
      }
      setRequests(rows);
      const { data: sess, error: e2 } = await supabase
        .from('sessions')
        .select('*')
        .eq('mentor_id', profile.id)
        .gte('start_time', new Date(Date.now() - 30 * 864e5).toISOString())
        .order('start_time', { ascending: true });
      if (e2) throw e2;
      setSessions((sess ?? []) as Session[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (id: string, status: 'accepted' | 'declined') => {
    await supabase
      .from('mentorship_requests')
      .update({ status })
      .eq('id', id);
    load();
  };

  const complete = async (s: Session) => {
    await supabase.from('sessions').update({ status: 'completed' }).eq('id', s.id);
    load();
  };

  const accepted = requests.filter((r) => r.status === 'accepted');
  const pending = requests.filter((r) => r.status === 'pending');

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-forest-900">Mentor dashboard</h1>
      <p className="mt-1 text-clay-700">Karibu, {profile.name.split(' ')[0]}.</p>
      {error && <div className="mt-4"><ErrorNote message={error} /></div>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 space-y-8">
          <Section icon={<Inbox className="h-5 w-5" />} title={`Requests (${pending.length} pending)`}>
            {requests.length === 0 && <p className="text-sm text-clay-700">No requests yet.</p>}
            {requests.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.otherName} />
                    <div>
                      <p className="font-semibold text-forest-900">{r.otherName}</p>
                      <p className="text-xs text-clay-500">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`chip ${statusStyles[r.status]}`}>{r.status}</span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-clay-700">{r.message}</p>
                {r.learnerUnder18 && (
                  <p className="mt-2 rounded-lg bg-ember-50 px-3 py-2 text-xs font-semibold text-ember-700">
                    This learner is under 18: meet in public places, involve a parent or guardian, and keep communication on the platform.
                  </p>
                )}
                {r.status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => respond(r.id, 'accepted')} className="btn-secondary !px-5 !py-2 text-sm">Accept</button>
                    <button
                      onClick={() => respond(r.id, 'declined')}
                      className="btn-ghost"
                      title="Thank you for thinking of me — I am at capacity right now. I wish you every success in finding a mentor!"
                    >
                      Decline
                    </button>
                  </div>
                )}
              </div>
            ))}
          </Section>

          <Section icon={<CalendarDays className="h-5 w-5" />} title="Upcoming & recent sessions">
            {sessions.length === 0 && <p className="text-sm text-clay-700">No sessions yet. Accept a request and schedule one from the request.</p>}
            {sessions.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-forest-900">{new Date(s.start_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p className="text-xs text-clay-500">{s.format.replace('_', ' ')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`chip ${statusStyles[s.status]}`}>{s.status}</span>
                  {s.status === 'scheduled' && (
                    <button onClick={() => complete(s)} className="btn-ghost !px-4 !py-1.5 text-xs">Mark complete</button>
                  )}
                </div>
              </div>
            ))}
          </Section>

          <p className="text-center text-sm text-clay-700">
            {accepted.length > 0
              ? `You are mentoring ${accepted.length} learner${accepted.length > 1 ? 's' : ''}. Asante!`
              : 'Accept your first request to start mentoring.'}
          </p>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-clay-500">{t('safetyFirst')}</p>
    </main>
  );
}

/* ---------------- LEARNER ---------------- */

function LearnerDashboard({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [saved, setSaved] = useState<{ id: string; name: string }[]>([]);
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: reqs, error: e1 }, { data: savedRows }, { data: myStories }] = await Promise.all([
        supabase.from('mentorship_requests').select('*').eq('learner_id', profile.id).order('created_at', { ascending: false }),
        supabase.from('saved_mentors').select('mentor_id, profiles(name)').eq('learner_id', profile.id),
        supabase.from('success_stories').select('*').eq('author_id', profile.id).order('created_at', { ascending: false }),
      ]);
      if (e1) throw e1;
      const rows: RequestRow[] = [];
      for (const r of (reqs ?? []) as MentorshipRequest[]) {
        const { data: mentor } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', r.mentor_id)
          .maybeSingle();
        rows.push({ ...r, otherName: mentor?.name ?? 'Mentor' });
      }
      setRequests(rows);
      setSaved(((savedRows ?? []) as unknown as { mentor_id: string; profiles: { name: string } }[]).map((s) => ({ id: s.mentor_id, name: s.profiles?.name ?? 'Mentor' })));
      setStories((myStories ?? []) as SuccessStory[]);
      const { data: sess } = await supabase
        .from('sessions')
        .select('*')
        .eq('learner_id', profile.id)
        .order('start_time', { ascending: true });
      setSessions((sess ?? []) as Session[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submitStory = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const { error: err } = await supabase.from('success_stories').insert({
      author_id: profile.id,
      title: String(form.get('title') ?? ''),
      story: String(form.get('story') ?? ''),
    });
    if (!err) {
      setShowStoryForm(false);
      load();
    }
  };

  const completedSessions = sessions.filter((s) => s.status === 'completed').length;
  const accepted = requests.filter((r) => r.status === 'accepted' || r.status === 'completed');

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-forest-900">{t('learner')} dashboard</h1>
      <p className="mt-1 text-clay-700">Karibu, {profile.name.split(' ')[0]}.</p>
      {error && <div className="mt-4"><ErrorNote message={error} /></div>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 space-y-8">
          {/* Learning journey */}
          <div className="grid grid-cols-2 gap-3">
            <div className="card p-4 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-ember-500" />
              <p className="mt-1 font-display text-3xl font-extrabold text-forest-900">{completedSessions}</p>
              <p className="text-xs font-semibold text-clay-500">sessions completed</p>
            </div>
            <div className="card p-4 text-center">
              <ShieldCheck className="mx-auto h-6 w-6 text-forest-500" />
              <p className="mt-1 font-display text-3xl font-extrabold text-forest-900">{accepted.length}</p>
              <p className="text-xs font-semibold text-clay-500">mentors guiding you</p>
            </div>
          </div>

          <Section icon={<Inbox className="h-5 w-5" />} title="My requests">
            {requests.length === 0 && (
              <div className="text-sm text-clay-700">
                No requests yet.{' '}
                <button onClick={() => navigate('/browse')} className="font-semibold text-ember-600 underline">
                  Find a mentor
                </button>
              </div>
            )}
            {requests.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.otherName} />
                    <div>
                      <p className="font-semibold text-forest-900">{r.otherName}</p>
                      <p className="text-xs text-clay-500">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <span className={`chip ${statusStyles[r.status]}`}>{r.status}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-clay-700">{r.message}</p>
              </div>
            ))}
          </Section>

          <Section icon={<CalendarDays className="h-5 w-5" />} title="My sessions">
            {sessions.length === 0 && <p className="text-sm text-clay-700">No sessions yet.</p>}
            {sessions.map((s) => (
              <div key={s.id} className="card flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-semibold text-forest-900">{new Date(s.start_time).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  <p className="text-xs text-clay-500">{s.format.replace('_', ' ')}</p>
                </div>
                <span className={`chip ${statusStyles[s.status]}`}>{s.status}</span>
              </div>
            ))}
          </Section>

          <Section icon={<Heart className="h-5 w-5" />} title="Saved mentors">
            {saved.length === 0 && <p className="text-sm text-clay-700">Save mentors from their profile page.</p>}
            <div className="flex flex-wrap gap-2">
              {saved.map((s) => (
                <button key={s.id} onClick={() => navigate(`/mentor/${s.id}`)} className="btn-ghost">
                  {s.name}
                </button>
              ))}
            </div>
          </Section>

          <Section icon={<Quote className="h-5 w-5" />} title="My success stories">
            <button onClick={() => setShowStoryForm(!showStoryForm)} className="btn-ghost">
              <PlusCircle className="h-4 w-4" /> Share a story
            </button>
            {showStoryForm && (
              <form onSubmit={submitStory} className="card space-y-3 p-4">
                <div>
                  <label htmlFor="st-title" className="label">Title</label>
                  <input id="st-title" name="title" required maxLength={120} className="input" placeholder="What changed for me…" />
                </div>
                <div>
                  <label htmlFor="st-story" className="label">Your story (what you learned, and what changed)</label>
                  <textarea id="st-story" name="story" required maxLength={1200} rows={5} className="input" />
                </div>
                <button type="submit" className="btn-primary">Submit for review</button>
              </form>
            )}
            {stories.map((s) => (
              <div key={s.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-forest-900">{s.title}</p>
                  <span className={`chip ${statusStyles[s.status]}`}>{s.status}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-clay-700">{s.story}</p>
              </div>
            ))}
          </Section>
        </div>
      )}
      <p className="mt-8 text-center text-xs text-clay-500">{t('safetyFirst')}</p>
    </main>
  );
}

/* ---------------- ORG ---------------- */

function OrgDashboard({ profile }: { profile: Profile }) {
  const { t } = useI18n();
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('opportunities')
      .select('*')
      .eq('poster_id', profile.id)
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    setOpps((data ?? []) as Opportunity[]);
    setLoading(false);
  }, [profile.id]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const skills = String(form.get('skills') ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const { error: err } = await supabase.from('opportunities').insert({
      poster_id: profile.id,
      title: String(form.get('title') ?? ''),
      description: String(form.get('description') ?? ''),
      skills,
      duration: String(form.get('duration') ?? '') || null,
      location: String(form.get('location') ?? '') || null,
      apply_instructions: String(form.get('apply_instructions') ?? ''),
    });
    if (!err) {
      setShowForm(false);
      load();
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-forest-900">{t('organization')} dashboard</h1>
      <p className="mt-1 text-clay-700">{profile.name}</p>
      {error && <div className="mt-4"><ErrorNote message={error} /></div>}
      {loading ? (
        <Spinner />
      ) : (
        <div className="mt-6 space-y-6">
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            <PlusCircle className="h-4 w-4" /> Post an opportunity
          </button>
          {showForm && (
            <form onSubmit={submit} className="card space-y-3 p-5">
              <div>
                <label htmlFor="o-title" className="label">Title</label>
                <input id="o-title" name="title" required className="input" placeholder="e.g. Weekend tailoring workshop" />
              </div>
              <div>
                <label htmlFor="o-desc" className="label">Description</label>
                <textarea id="o-desc" name="description" required rows={4} className="input" />
              </div>
              <div>
                <label htmlFor="o-skills" className="label">Skills gained (comma separated)</label>
                <input id="o-skills" name="skills" className="input" placeholder="Tailoring, Fashion design" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="o-dur" className="label">Duration</label>
                  <input id="o-dur" name="duration" className="input" placeholder="3 months, 3 days per week" />
                </div>
                <div>
                  <label htmlFor="o-loc" className="label">Location</label>
                  <input id="o-loc" name="location" className="input" placeholder="Nakuru Town" />
                </div>
              </div>
              <div>
                <label htmlFor="o-apply" className="label">How to apply</label>
                <input id="o-apply" name="apply_instructions" className="input" />
              </div>
              <button type="submit" className="btn-primary">Publish</button>
            </form>
          )}

          <Section icon={<Briefcase className="h-5 w-5" />} title={`Posted opportunities (${opps.length})`}>
            {opps.length === 0 && <p className="text-sm text-clay-700">Nothing posted yet.</p>}
            {opps.map((o) => (
              <div key={o.id} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-forest-900">{o.title}</p>
                  <span className={`chip ${statusStyles[o.status]}`}>{o.status}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-clay-700">{o.description}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={async () => {
                      await supabase.from('opportunities').update({ status: o.status === 'open' ? 'closed' : 'open' }).eq('id', o.id);
                      load();
                    }}
                    className="btn-ghost !px-4 !py-1.5 text-xs"
                  >
                    {o.status === 'open' ? 'Close' : 'Reopen'}
                  </button>
                </div>
              </div>
            ))}
          </Section>
        </div>
      )}
    </main>
  );
}

/* ---------------- shared ---------------- */

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 font-display text-xl font-bold text-forest-900">
        <span className="text-ember-600">{icon}</span> {title}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}
