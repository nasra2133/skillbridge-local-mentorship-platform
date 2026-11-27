import { useState } from 'react';
import { Menu, X, Languages, LayoutDashboard } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/lib/auth';
import { navigate, useHashRoute } from '@/lib/router';
import { Avatar } from '@/components/ui';

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { session, profile, signOut } = useAuth();
  const route = useHashRoute();
  const [open, setOpen] = useState(false);

  const links: { href: string; label: string }[] = [
    { href: '/browse', label: t('browse') },
    { href: '/opportunities', label: 'Opportunities' },
    { href: '/stories', label: t('stories') },
    { href: '/about', label: t('about') },
  ];

  const isActive = (href: string) => route.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-clay-200 bg-cream-50/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-400 rounded-full"
          aria-label={t('appName') + ' home'}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-600 font-display text-lg font-extrabold text-cream-50">S</span>
          <span className="font-display text-xl font-extrabold text-forest-800">{t('appName')}</span>
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => navigate(l.href)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                isActive(l.href) ? 'bg-forest-100 text-forest-800' : 'text-forest-700 hover:bg-forest-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLang(lang === 'en' ? 'sw' : 'en')}
            className="btn-ghost !px-3 !py-2 text-xs"
            aria-label="Toggle language English Kiswahili"
          >
            <Languages className="h-4 w-4" />
            {lang === 'en' ? 'SW' : 'EN'}
          </button>
          {session && profile ? (
            <>
              <button
                onClick={() => navigate('/dashboard')}
                className="btn-ghost !px-3 !py-2 text-xs"
                aria-label={t('dashboard')}
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">{t('dashboard')}</span>
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                aria-label={profile.name}
                className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-400"
              >
                <Avatar name={profile.name} photoUrl={profile.photo_url} size="sm" />
              </button>
              <button
                onClick={() => {
                  signOut();
                  navigate('/');
                }}
                className="hidden text-xs font-semibold text-clay-700 underline hover:text-forest-700 sm:inline"
              >
                {t('signOut')}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/auth')} className="btn-ghost !px-4 !py-2 text-sm">
                {t('signIn')}
              </button>
              <button onClick={() => navigate('/auth?mode=signup')} className="btn-primary !px-5 !py-2 text-sm">
                {t('signUp')}
              </button>
            </>
          )}
          <button
            className="rounded-full p-2 text-forest-800 md:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-clay-200 bg-cream-50 px-4 py-3 md:hidden" aria-label="Mobile">
          {links.map((l) => (
            <button
              key={l.href}
              onClick={() => {
                navigate(l.href);
                setOpen(false);
              }}
              className={`block w-full rounded-xl px-4 py-3 text-left text-base font-semibold ${
                isActive(l.href) ? 'bg-forest-100 text-forest-800' : 'text-forest-700'
              }`}
            >
              {l.label}
            </button>
          ))}
          {session && (
            <button
              onClick={() => {
                signOut();
                navigate('/');
              }}
              className="block w-full rounded-xl px-4 py-3 text-left text-base font-semibold text-clay-700"
            >
              {t('signOut')}
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="mt-16 border-t border-clay-200 bg-forest-900 px-4 py-10 text-cream-100">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cream-50 font-display font-extrabold text-forest-800">S</span>
          <span className="font-display text-lg font-bold">{t('appName')}</span>
        </div>
        <p className="mt-3 max-w-md text-sm text-cream-200/80">{t('tagline')}</p>
        <p className="mt-6 text-xs text-cream-200/60">SDG 8 · SDG 10 · SDG 17 — {t('safetyFirst')}</p>
      </div>
    </footer>
  );
}
