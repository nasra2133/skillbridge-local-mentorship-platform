import { useEffect, useState } from 'react';
import {
  BadgeCheck,
  MapPin,
  Clock,
  Globe,
  MessageSquare,
  ShieldCheck,
  Flag,
  Star,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { fetchMentorProfile } from '@/lib/mentors';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { navigate, useHashRoute } from '@/lib/router';
import { Avatar, CostBadge, Spinner, ErrorNote, Stars } from '@/components/ui';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatLabels: Record<string, string> = {
  in_person: 'In person',
  phone: 'Phone call',
  whatsapp: 'WhatsApp',
  video: 'Video call',
};

const supportLabels: Record<string, string> = {
  one_off_advice: 'One-off advice',
  weekly_mentorship: 'Weekly mentorship',
  apprenticeship: 'Apprenticeship',
  workshop: 'Workshop',
};

export function MentorProfilePage() {
  const route = useHashRoute();
  const mentorId = route.split('/')[2];
  const { t } = useI18n();
  const { session, profile } = useAuth();
  const [data, setData] = useState<Awaited<ReturnType<typeof fetchMentorProfile>>>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [reported, setReported] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchMentorProfile(mentorId)
      .then((d) => {
        if (!d) setError('Mentor not found.');
        setData(d);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [mentorId]);

  const sendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError(null);
    try {
      const uid = session?.user.id;
      if (!uid) throw new Error('Please sign in first.');
      const { error: err } = await supabase
        .from('mentorship_requests')
        .insert({ learner_id: uid, mentor_id: mentorId, message });
      if (err) throw err;
      setSent(true);
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const report = async () => {
    if (!session) {
      navigate('/auth');
      return;
    }
    await supabase.from('reports').insert({
      reporter_id: session.user.id,
      target_id: mentorId,
      reason: 'Reported from profile',
    });
    setReported(true);
  };

  if (loading) return <Spinner />;
  if (error || !data)
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <ErrorNote message={error ?? 'Mentor not found.'} />
      </main>
    );

  const { profile: m, detail, skills, reviews, availability } = data;
  const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Header card */}
      <div className="card p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <Avatar name={m.name} photoUrl={m.photo_url} size="xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="font-display text-3xl font-extrabold text-forest-900">{m.name}</h1>
              {detail.verified && (
                <span className="chip bg-forest-100 text-forest-700">
                  <BadgeCheck className="h-3.5 w-3.5" /> {t('verified')}
                </span>
              )}
            </div>
            <p className="mt-1 font-semibold text-ember-600">{detail.trade}</p>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-clay-700">
              <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{m.location}</span>
              <span className="inline-flex items-center gap-1"><Clock className="h-4 w-4" />{detail.years_experience} {t('years')}</span>
              <span className="inline-flex items-center gap-1"><Globe className="h-4 w-4" />{m.languages.join(', ')}</span>
              <Stars rating={rating} />
            </div>
          </div>
        </div>
        <p className="mt-4 leading-relaxed text-clay-700">{m.bio}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <span key={s} className="chip bg-forest-50 text-forest-700">{s}</span>
          ))}
        </div>
      </div>

      {/* Support & cost */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-forest-900">Support offered</h2>
          <ul className="mt-2 space-y-1 text-sm text-clay-700">
            {detail.support_types.map((s) => (
              <li key={s}>· {supportLabels[s] ?? s}</li>
            ))}
            <li>· Up to {detail.max_learners} learners at a time</li>
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="font-display text-lg font-bold text-forest-900">Cost & format</h2>
          <div className="mt-2 flex items-center gap-2">
            <CostBadge costType={detail.cost_type} price={detail.price} />
            {detail.cost_type === 'paid' && detail.price && (
              <span className="text-sm text-clay-700">{t('perSession')}</span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {detail.formats.map((f) => (
              <span key={f} className="chip bg-clay-100 text-clay-700">{formatLabels[f] ?? f}</span>
            ))}
          </div>
          {availability.length > 0 && (
            <>
              <h3 className="mt-4 text-sm font-bold text-forest-800">Availability</h3>
              <ul className="mt-1 space-y-0.5 text-sm text-clay-700">
                {availability
                  .slice()
                  .sort((a, b) => a.day_of_week - b.day_of_week)
                  .map((a, i) => (
                    <li key={i}>
                      {DAYS[a.day_of_week]}: {a.start_time.slice(0, 5)}–{a.end_time.slice(0, 5)}
                    </li>
                  ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* CTA / request form */}
      <div className="card mt-4 p-6">
        {sent ? (
          <div className="text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-forest-500" />
            <h2 className="mt-3 font-display text-xl font-bold text-forest-900">Request sent!</h2>
            <p className="mt-1 text-sm text-clay-700">
              {m.name.split(' ')[0]} will get back to you. Track it in your dashboard.
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-secondary mt-4">
              {t('dashboard')}
            </button>
          </div>
        ) : showForm ? (
          <form onSubmit={sendRequest} className="space-y-4">
            {formError && <ErrorNote message={formError} />}
            <h2 className="font-display text-xl font-bold text-forest-900">{t('requestMentorship')}</h2>
            <div>
              <label htmlFor="msg" className="label">
                What do you want to learn, and what is your goal? (include your availability)
              </label>
              <textarea
                id="msg"
                required
                minLength={10}
                maxLength={600}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="input"
                placeholder="e.g. I want to learn tailoring so I can start making dresses. I am free on Saturdays."
              />
              <p className="mt-1 text-xs text-clay-500">{message.length}/600</p>
            </div>
            <p className="text-xs text-clay-500">{t('safetyFirst')}</p>
            <div className="flex gap-3">
              <button type="submit" disabled={busy} className="btn-primary flex-1">
                {busy ? 'Sending…' : 'Send request'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-sm text-clay-700">
              Contact details are shared only after your request is accepted.
            </p>
            <button
              onClick={() => (session ? setShowForm(true) : navigate('/auth?mode=signup'))}
              className="btn-primary w-full sm:w-auto"
            >
              <MessageSquare className="h-4 w-4" /> {t('requestMentorship')}
            </button>
          </div>
        )}
      </div>

      {/* Reviews */}
      {reviews.length > 0 && (
        <div className="mt-6">
          <h2 className="font-display text-2xl font-bold text-forest-900">
            Reviews <span className="text-base font-normal text-clay-500">({reviews.length})</span>
          </h2>
          <div className="mt-3 space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="card p-4">
                <div className="flex items-center gap-2">
                  <Stars rating={r.rating} />
                  <span className="text-sm font-semibold text-forest-800">{r.reviewerName}</span>
                  <span className="text-xs text-clay-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-clay-700">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-forest-50 p-4">
        <p className="text-xs font-medium text-forest-800">{t('safetyFirst')}</p>
        {reported ? (
          <span className="text-xs font-semibold text-clay-500">Report submitted — thank you.</span>
        ) : (
          <button onClick={report} className="inline-flex items-center gap-1 text-xs font-semibold text-clay-700 underline hover:text-red-700">
            <Flag className="h-3.5 w-3.5" /> Report profile
          </button>
        )}
      </div>
    </main>
  );
}
