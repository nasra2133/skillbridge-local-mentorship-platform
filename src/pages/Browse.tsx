import { useMemo, useState } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useMentorCards } from '@/lib/mentors';
import { MentorCardItem, Spinner, ErrorNote } from '@/components/ui';

const CATEGORIES = ['agriculture', 'construction', 'fashion', 'tech', 'food', 'business', 'repair', 'education'] as const;
const CATEGORY_ICONS: Record<string, string> = {
  agriculture: '🌾',
  construction: '🔨',
  fashion: '🧵',
  tech: '💻',
  food: '🍲',
  business: '📊',
  repair: '🔧',
  education: '📚',
};

export function BrowsePage() {
  const { t, lang } = useI18n();
  const { cards, loading, error } = useMentorCards();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [costType, setCostType] = useState<string | null>(null);

  const locations = useMemo(
    () => Array.from(new Set(cards.map((c) => c.profile.location).filter(Boolean))) as string[],
    [cards]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cards.filter((c) => {
      if (category && c.detail.category !== category) return false;
      if (costType && c.detail.cost_type !== costType) return false;
      if (location && c.profile.location !== location) return false;
      if (q) {
        const haystack = [
          c.profile.name,
          c.detail.trade,
          c.profile.location ?? '',
          ...c.skills,
        ]
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [cards, query, location, category, costType]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="font-display text-3xl font-extrabold text-forest-900">{t('browse')}</h1>

      {/* Category chips */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2" role="tablist" aria-label={t('category')}>
        <button
          onClick={() => setCategory(null)}
          className={`chip shrink-0 border ${category === null ? 'border-forest-600 bg-forest-600 text-white' : 'border-clay-200 bg-white text-forest-800'}`}
        >
          {t('all')}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(category === cat ? null : cat)}
            className={`chip shrink-0 border ${category === cat ? 'border-forest-600 bg-forest-600 text-white' : 'border-clay-200 bg-white text-forest-800'}`}
          >
            {CATEGORY_ICONS[cat]} {t(`categories.${cat}`)}
          </button>
        ))}
      </div>

      {/* Search + filters */}
      <div className="card mt-2 space-y-3 p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-clay-300" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="input !pl-11"
            aria-label={t('searchPlaceholder')}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-clay-500">
            <SlidersHorizontal className="h-4 w-4" /> Filters:
          </span>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-clay-300" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input !w-auto !py-2 !pl-9 !pr-8 text-sm"
              aria-label="Location filter"
            >
              <option value="">{t('all')} locations</option>
              {locations.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          {(['free', 'paid', 'swap'] as const).map((ct) => (
            <button
              key={ct}
              onClick={() => setCostType(costType === ct ? null : ct)}
              className={`chip border ${costType === ct ? 'border-ember-500 bg-ember-500 text-white' : 'border-clay-200 bg-white text-forest-800'}`}
            >
              {t(ct)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="mt-4"><ErrorNote message={error} /></div>}
      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-clay-700">{t('noMentors')}</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((c) => (
            <MentorCardItem key={c.profile.id} card={c} />
          ))}
        </div>
      )}
      <p className="mt-6 text-center text-xs text-clay-500" style={{ display: lang ? undefined : 'none' }}>
        {t('safetyFirst')}
      </p>
    </main>
  );
}
