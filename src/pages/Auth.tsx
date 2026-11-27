import { useState, type FormEvent } from 'react';
import { GraduationCap, HandHeart, Building2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { useI18n } from '@/lib/i18n';
import { navigate, useHashRoute } from '@/lib/router';
import { ErrorNote, Spinner } from '@/components/ui';

type Role = 'mentor' | 'learner' | 'org';

const roleOptions: { role: Role; icon: typeof GraduationCap; en: string; enSub: string; sw: string; swSub: string }[] = [
  { role: 'learner', icon: GraduationCap, en: 'I want to learn', enSub: 'Find a mentor or training', sw: 'Nataka kujifunza', swSub: 'Tafuta mshauri au mafunzo' },
  { role: 'mentor', icon: HandHeart, en: 'I can teach', enSub: 'Share your skills & experience', sw: 'Naweza kufundisha', swSub: 'Shirikisha ujuzi wako' },
  { role: 'org', icon: Building2, en: 'We are an organization', enSub: 'Post opportunities & partner', sw: 'Sisi ni shirika', swSub: 'Weka fursa & shirikiana' },
];

export function AuthPage() {
  const { t, lang } = useI18n();
  const { session, profile, refreshProfile } = useAuth();
  const route = useHashRoute();
  const isSignup = new URLSearchParams(route.split('?')[1] ?? '').get('mode') === 'signup';
  const [mode, setMode] = useState<'login' | 'signup'>(isSignup ? 'signup' : 'login');
  const [step, setStep] = useState<'account' | 'profile'>(session && !profile ? 'profile' : 'account');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role | null>(null);
  const [location, setLocation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submitAccount = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'signup') {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setStep('profile');
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        await refreshProfile();
        navigate('/dashboard');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user.id;
      if (!uid) throw new Error('Please sign in first.');
      const { error: err } = await supabase.from('profiles').upsert({
        id: uid,
        role,
        name,
        location: location || null,
        bio: '',
      });
      if (err) throw err;
      await refreshProfile();
      navigate(role === 'org' ? '/dashboard' : role === 'mentor' ? '/dashboard' : '/browse');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (session && profile) {
    return (
      <main className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="font-display text-2xl font-bold text-forest-900">Welcome, {profile.name}!</h1>
        <button onClick={() => navigate('/dashboard')} className="btn-primary mt-6">
          {t('dashboard')}
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      {step === 'account' ? (
        <div>
          <h1 className="font-display text-3xl font-extrabold text-forest-900">
            {mode === 'signup' ? t('signUp') : t('signIn')}
          </h1>
          <p className="mt-2 text-sm text-clay-700">{t('tagline')}</p>
          <form onSubmit={submitAccount} className="card mt-6 space-y-4 p-6">
            {error && <ErrorNote message={error} />}
            <div>
              <label htmlFor="email" className="label">Email</label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">Password</label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
              />
            </div>
            <button type="submit" disabled={busy} className="btn-primary w-full">
              {busy ? <Spinner /> : mode === 'signup' ? t('signUp') : t('signIn')}
            </button>
            <p className="text-center text-sm text-clay-700">
              {mode === 'signup' ? 'Already have an account?' : 'New to SkillBridge?'}{' '}
              <button
                type="button"
                onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
                className="font-semibold text-ember-600 underline"
              >
                {mode === 'signup' ? t('signIn') : t('signUp')}
              </button>
            </p>
          </form>
        </div>
      ) : (
        <form onSubmit={submitProfile} className="space-y-6">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-forest-900">Karibu! Who are you?</h1>
            <p className="mt-2 text-sm text-clay-700">Choose how you'll use SkillBridge. You can do both later.</p>
          </div>
          {error && <ErrorNote message={error} />}
          <div className="space-y-3">
            {roleOptions.map((o) => {
              const active = role === o.role;
              const Icon = o.icon;
              return (
                <button
                  type="button"
                  key={o.role}
                  onClick={() => setRole(o.role)}
                  className={`card flex w-full items-center gap-4 p-5 text-left transition ${
                    active ? 'ring-2 ring-ember-500' : 'hover:shadow-lift'
                  }`}
                  aria-pressed={active}
                >
                  <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${active ? 'bg-ember-500 text-white' : 'bg-forest-100 text-forest-700'}`}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block font-display text-lg font-bold text-forest-900">
                      {lang === 'sw' ? o.sw : o.en}
                    </span>
                    <span className="block text-sm text-clay-700">{lang === 'sw' ? o.swSub : o.enSub}</span>
                  </span>
                </button>
              );
            })}
          </div>
          <div className="card space-y-4 p-6">
            <div>
              <label htmlFor="name" className="label">Your name</label>
              <input id="name" required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Amina Hassan" />
            </div>
            <div>
              <label htmlFor="loc" className="label">Town / County</label>
              <input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} className="input" placeholder="e.g. Nairobi" />
            </div>
            <button type="submit" disabled={busy || !role} className="btn-primary w-full">
              {busy ? 'Saving…' : 'Start'}
            </button>
          </div>
        </form>
      )}
    </main>
  );
}
