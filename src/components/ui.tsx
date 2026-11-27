import { Star, BadgeCheck, Clock, MapPin } from 'lucide-react';
import type { MentorCard as MentorCardType } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { useI18n } from '@/lib/i18n';

export function Avatar({ name, size = 'md', photoUrl }: { name: string; size?: 'sm' | 'md' | 'lg' | 'xl'; photoUrl?: string | null }) {
  const sizes = { sm: 'h-9 w-9 text-sm', md: 'h-12 w-12 text-base', lg: 'h-16 w-16 text-xl', xl: 'h-24 w-24 text-3xl' };
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  if (photoUrl) {
    return <img src={photoUrl} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizes[size]} flex shrink-0 items-center justify-center rounded-full bg-forest-600 font-bold text-cream-50`}>
      {initials}
    </div>
  );
}

export function Stars({ rating }: { rating: number | null }) {
  if (rating === null) return null;
  return (
    <span className="inline-flex items-center gap-1 text-sm font-semibold text-ember-600">
      <Star className="h-4 w-4 fill-ember-500 text-ember-500" />
      {rating.toFixed(1)}
    </span>
  );
}

const costStyles: Record<string, string> = {
  free: 'bg-forest-100 text-forest-700',
  paid: 'bg-ember-100 text-ember-700',
  swap: 'bg-clay-200 text-clay-700',
};

export function CostBadge({ costType, price }: { costType: string; price: number | null }) {
  const { t } = useI18n();
  const label =
    costType === 'free' ? t('free') : costType === 'paid' ? `${t('paid')}${price ? ` · ${price} KSh` : ''}` : t('swap');
  return <span className={`chip ${costStyles[costType] ?? costStyles.free}`}>{label}</span>;
}

export function MentorCardItem({ card }: { card: MentorCardType }) {
  const { t } = useI18n();
  const { profile, detail, skills, rating, reviewCount } = card;
  return (
    <button
      onClick={() => navigate(`/mentor/${profile.id}`)}
      className="card group w-full p-4 text-left transition hover:shadow-lift focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-400"
    >
      <div className="flex items-start gap-3">
        <Avatar name={profile.name} photoUrl={profile.photo_url} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate font-display text-lg font-bold text-forest-900">{profile.name}</h3>
            {detail.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-forest-500" aria-label={t('verified')} />}
          </div>
          <p className="truncate text-sm font-semibold text-ember-600">{detail.trade}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-clay-700">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> {profile.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> {detail.years_experience} {t('years')}
            </span>
            <Stars rating={rating} />
            {reviewCount > 0 && <span className="text-clay-500">({reviewCount} {t('reviews')})</span>}
          </div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {skills.slice(0, 3).map((s) => (
          <span key={s} className="chip bg-forest-50 text-forest-700">{s}</span>
        ))}
        <CostBadge costType={detail.cost_type} price={detail.price} />
      </div>
      <span className="mt-3 inline-flex w-full items-center justify-center rounded-full bg-forest-600 py-2.5 text-sm font-semibold text-white transition group-hover:bg-forest-700">
        {t('requestMentorship')}
      </span>
    </button>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-16" role="status" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-forest-200 border-t-forest-600" />
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700" role="alert">
      {message}
    </div>
  );
}
