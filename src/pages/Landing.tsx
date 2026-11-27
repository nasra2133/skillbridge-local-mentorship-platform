import { useEffect, useState } from 'react';
import { Search, Handshake, Sprout, ArrowRight, Quote } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/router';
import { useMentorCards } from '@/lib/mentors';
import { supabase, type SuccessStory } from '@/lib/supabase';
import { MentorCardItem, Spinner, Avatar } from '@/components/ui';

export function LandingPage() {
  const { t } = useI18n();
  const { cards, loading } = useMentorCards();
  const [stories, setStories] = useState<SuccessStory[]>([]);

  useEffect(() => {
    supabase
      .from('success_stories')
      .select('*')
      .eq('status', 'approved')
      .limit(3)
      .then(({ data }) => setStories((data as SuccessStory[]) ?? []));
  }, []);

  const steps = [
    { icon: Search, title: t('step1Title'), text: t('step1Text') },
    { icon: Handshake, title: t('step2Title'), text: t('step2Text') },
    { icon: Sprout, title: t('step3Title'), text: t('step3Text') },
  ];

  return (
    <main>
      {/* Hero */}
      <section className="bg-forest-900 px-4 py-14 text-center text-cream-50 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <span className="chip bg-forest-800 text-cream-100">SDG 8 · 10 · 17</span>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
            {t('tagline')}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-cream-200 sm:text-lg">
            {t('heroSub')}
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button onClick={() => navigate('/browse')} className="btn-primary w-full sm:w-auto">
              {t('ctaFind')} <ArrowRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => navigate('/auth?mode=signup&role=mentor')}
              className="w-full rounded-full border-2 border-cream-100 px-6 py-3 text-base font-semibold text-cream-50 transition hover:bg-forest-800 sm:w-auto"
            >
              {t('ctaBecome')}
            </button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="text-center font-display text-3xl font-bold text-forest-900">{t('howItWorks')}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={i} className="card p-6 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ember-100 text-ember-600">
                <s.icon className="h-7 w-7" />
              </div>
              <div className="mt-3 text-xs font-bold uppercase tracking-wider text-clay-500">
                {i + 1}
              </div>
              <h3 className="mt-1 font-display text-xl font-bold text-forest-900">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-clay-700">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured mentors */}
      <section className="bg-forest-50 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-bold text-forest-900">{t('featuredMentors')}</h2>
            <button
              onClick={() => navigate('/browse')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-ember-600 hover:text-ember-700"
            >
              {t('browse')} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          {loading ? (
            <Spinner />
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {cards.slice(0, 6).map((c) => (
                <MentorCardItem key={c.profile.id} card={c} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Success stories preview */}
      {stories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-3xl font-bold text-forest-900">{t('successStories')}</h2>
            <button
              onClick={() => navigate('/stories')}
              className="inline-flex items-center gap-1 text-sm font-semibold text-ember-600 hover:text-ember-700"
            >
              {t('viewAllStories')} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {stories.map((s) => (
              <div key={s.id} className="card flex flex-col p-6">
                <Quote className="h-6 w-6 text-ember-400" />
                <h3 className="mt-3 font-display text-lg font-bold text-forest-900">{s.title}</h3>
                <p className="mt-2 line-clamp-4 flex-1 text-sm leading-relaxed text-clay-700">{s.story}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA band */}
      <section className="bg-ember-500 px-4 py-12 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="font-display text-3xl font-bold text-white">{t('ctaBecome')}?</h2>
          <p className="mt-2 text-white/90">
            Share what you know. A few hours a month can change a young person's whole direction.
          </p>
          <button
            onClick={() => navigate('/auth?mode=signup&role=mentor')}
            className="mt-6 rounded-full bg-white px-8 py-3 font-semibold text-ember-700 shadow-sm transition hover:bg-cream-100"
          >
            {t('ctaBecome')}
          </button>
        </div>
      </section>
    </main>
  );
}

export function AboutPage() {
  const { t } = useI18n();
  const sdgs = [
    {
      n: 'SDG 8',
      title: 'Decent Work & Skills',
      text: 'Practical training from real practitioners opens paths to earning that classrooms alone cannot.',
    },
    {
      n: 'SDG 10',
      title: 'Reduced Inequalities',
      text: 'Talent is everywhere, but networks are not. SkillBridge gives young people without connections direct access to experienced professionals.',
    },
    {
      n: 'SDG 17',
      title: 'Partnerships',
      text: 'Schools, vocational centers, NGOs and local businesses post real opportunities and partner with mentors.',
    },
  ];
  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold text-forest-900">{t('aboutTitle')}</h1>
      <p className="mt-4 text-lg leading-relaxed text-clay-700">
        Many young people have no professional network and no way to reach experienced people in their own
        community. SkillBridge opens that door — connecting artisans, farmers, mechanics, tailors, retired
        teachers and business owners with youth and career changers who want practical skills.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {sdgs.map((s) => (
          <div key={s.n} className="card p-6">
            <span className="chip bg-forest-600 text-cream-50">{s.n}</span>
            <h2 className="mt-3 font-display text-lg font-bold text-forest-900">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-clay-700">{s.text}</p>
          </div>
        ))}
      </div>

      <div className="card mt-10 bg-forest-800 p-6 text-cream-100">
        <h2 className="font-display text-2xl font-bold">Trust & Safety</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-cream-200">
          <li>· Verified badge: phone verified, with optional ID or community reference.</li>
          <li>· Reviews and ratings only after completed sessions.</li>
          <li>· Report and block on every profile.</li>
          <li>· Contact details are shared only after a request is accepted.</li>
          <li>· Meet in public places and tell someone where you are going.</li>
          <li>· Extra safeguards and clear messaging for learners under 18.</li>
        </ul>
      </div>
    </main>
  );
}

export function StoriesPage() {
  const { t } = useI18n();
  const [stories, setStories] = useState<(SuccessStory & { authorName?: string; authorPhoto?: string | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('success_stories')
      .select('*, profiles(name, photo_url)')
      .eq('status', 'approved')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setStories(
          ((data ?? []) as unknown as (SuccessStory & { profiles: { name: string; photo_url: string | null } })[]).map(
            (s) => ({ ...s, authorName: s.profiles?.name, authorPhoto: s.profiles?.photo_url })
          )
        );
        setLoading(false);
      });
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold text-forest-900">{t('successStories')}</h1>
      <p className="mt-2 text-clay-700">"What I learned, and what changed for me."</p>
      {loading ? (
        <Spinner />
      ) : stories.length === 0 ? (
        <p className="mt-8 text-clay-700">No stories yet — yours could be the first.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {stories.map((s) => (
            <div key={s.id} className="card p-6">
              <div className="flex items-center gap-3">
                <Avatar name={s.authorName ?? 'Author'} photoUrl={s.authorPhoto} />
                <div>
                  <h2 className="font-display text-lg font-bold text-forest-900">{s.title}</h2>
                  <p className="text-xs font-semibold text-clay-500">{s.authorName}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-clay-700">{s.story}</p>
            </div>
          ))}
        </div>
      )}
      <div className="card mt-8 bg-forest-50 p-6">
        <h3 className="font-display text-xl font-bold text-forest-900">Have a story to share?</h3>
        <p className="mt-1 text-sm text-clay-700">
          Sign in and submit it from your dashboard. Our team reviews every story before it appears here.
        </p>
      </div>
    </main>
  );
}
