import { useEffect, useState } from 'react';
import { MapPin, Clock, Send } from 'lucide-react';
import { supabase, type Opportunity } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { navigate, useHashRoute } from '@/lib/router';
import { Spinner, ErrorNote, Avatar } from '@/components/ui';

export function OpportunitiesPage() {
  const [opps, setOpps] = useState<(Opportunity & { posterName: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('opportunities')
      .select('*, profiles(name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .then(({ data, error: e }) => {
        if (e) setError(e.message);
        setOpps(
          ((data ?? []) as unknown as (Opportunity & { profiles: { name: string } })[]).map((o) => ({
            ...o,
            posterName: o.profiles?.name ?? 'Organization',
          }))
        );
        setLoading(false);
      });
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-forest-900">Opportunities board</h1>
      <p className="mt-1 text-clay-700">Apprenticeships, workshops and training openings from mentors, schools, NGOs and businesses.</p>
      {error && <div className="mt-4"><ErrorNote message={error} /></div>}
      {loading ? (
        <Spinner />
      ) : opps.length === 0 ? (
        <p className="mt-10 text-center text-clay-700">No open opportunities right now.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {opps.map((o) => (
            <button
              key={o.id}
              onClick={() => navigate(`/opportunity/${o.id}`)}
              className="card block w-full p-5 text-left transition hover:shadow-lift"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-ember-600">{o.posterName}</p>
              <h2 className="mt-1 font-display text-xl font-bold text-forest-900">{o.title}</h2>
              <p className="mt-2 line-clamp-2 text-sm text-clay-700">{o.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-clay-500">
                {o.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{o.location}</span>}
                {o.duration && <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{o.duration}</span>}
              </div>
            </button>
          ))}
        </div>
      )}
    </main>
  );
}

export function OpportunityDetailPage() {
  const route = useHashRoute();
  const id = route.split('/')[2];
  const { session } = useAuth();
  const { t } = useI18n();
  const [opp, setOpp] = useState<(Opportunity & { posterName: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [applied, setApplied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('opportunities')
      .select('*, profiles(name)')
      .eq('id', id)
      .maybeSingle()
      .then(({ data, error: e }) => {
        if (e) setError(e.message);
        if (data) {
          const o = data as unknown as Opportunity & { profiles: { name: string } };
          setOpp({ ...o, posterName: o.profiles?.name ?? 'Organization' });
        }
        setLoading(false);
      });
  }, [id]);

  const apply = async () => {
    if (!session) {
      navigate('/auth?mode=signup');
      return;
    }
    setBusy(true);
    const { error: e } = await supabase
      .from('applications')
      .insert({ opportunity_id: id, learner_id: session.user.id, message: 'One-tap application with my profile.' });
    if (!e) setApplied(true);
    setBusy(false);
  };

  if (loading) return <Spinner />;
  if (!opp)
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <ErrorNote message={error ?? 'Opportunity not found.'} />
      </main>
    );

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="flex items-center gap-2 text-sm font-bold text-ember-600">
        <Avatar name={opp.posterName} size="sm" /> {opp.posterName}
      </p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-forest-900">{opp.title}</h1>
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-clay-700">
        {opp.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{opp.location}</span>}
        {opp.duration && <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{opp.duration}</span>}
      </div>
      <p className="mt-4 leading-relaxed text-clay-700">{opp.description}</p>
      {opp.skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {opp.skills.map((s) => (
            <span key={s} className="chip bg-forest-50 text-forest-700">{s}</span>
          ))}
        </div>
      )}
      <div className="card mt-6 p-5">
        <h2 className="font-display text-lg font-bold text-forest-900">How to apply</h2>
        <p className="mt-1 text-sm text-clay-700">{opp.apply_instructions}</p>
        {applied ? (
          <p className="mt-4 rounded-xl bg-forest-50 px-4 py-3 text-sm font-semibold text-forest-700">
            Application sent! The organization will contact you.
          </p>
        ) : (
          <button onClick={apply} disabled={busy} className="btn-primary mt-4 w-full sm:w-auto">
            {busy ? 'Applying…' : 'Apply with my profile'}
          </button>
        )}
        {!session && <p className="mt-2 text-xs text-clay-500">You will be asked to {t('signUp')} first.</p>}
      </div>
    </main>
  );
}
