import { createContext, useContext, useState, type ReactNode } from 'react';

export type Lang = 'en' | 'sw';

const dict = {
  en: {
    appName: 'SkillBridge',
    tagline: 'Learn a skill. Meet a mentor. Change your story.',
    heroSub:
      'SkillBridge connects you with experienced professionals in your own community — welders, farmers, tailors, teachers — for mentorship, hands-on training and apprenticeships.',
    howItWorks: 'How it works',
    step1Title: 'Find a mentor',
    step1Text: 'Search by skill, trade, location or price. Browse real people in your community.',
    step2Title: 'Send a request',
    step2Text: 'Tell them what you want to learn and your goal. They accept and you book a time.',
    step3Title: 'Learn & grow',
    step3Text: 'Meet, practice, complete sessions, and share your success story.',
    featuredMentors: 'Featured mentors',
    successStories: 'Success stories',
    viewAllStories: 'View all stories',
    ctaFind: 'Find a mentor',
    ctaBecome: 'Become a mentor',
    requestMentorship: 'Request mentorship',
    verified: 'Verified',
    browse: 'Browse mentors',
    about: 'About & Impact',
    stories: 'Stories',
    signIn: 'Sign in',
    signUp: 'Sign up',
    signOut: 'Sign out',
    dashboard: 'Dashboard',
    free: 'Free',
    paid: 'Paid',
    swap: 'Skill swap',
    perSession: 'per session',
    years: 'yrs experience',
    inPerson: 'In person',
    phone: 'Phone call',
    whatsapp: 'WhatsApp',
    video: 'Video call',
    all: 'All',
    nearMe: 'Near me',
    searchPlaceholder: 'Search skill, trade or name…',
    locationPlaceholder: 'Location',
    category: 'Category',
    categories: {
      agriculture: 'Agriculture',
      construction: 'Construction',
      fashion: 'Fashion',
      tech: 'Tech',
      food: 'Food',
      business: 'Business',
      repair: 'Repair',
      education: 'Education',
    },
    noMentors: 'No mentors match your search yet. Try different filters.',
    aboutTitle: 'Why SkillBridge exists',
    reviews: 'reviews',
    learner: 'Learner',
    mentor: 'Mentor',
    organization: 'Organization',
    safetyFirst: 'Safety first: meet in public places and tell someone where you are going.',
  },
  sw: {
    appName: 'SkillBridge',
    tagline: 'Jifunze ujuzi. Pata mshauri. Badilisha hadithi yako.',
    heroSub:
      'SkillBridge inakuunganisha na wataalamu wenye uzoefu katika jamii yako — waweldi, wakulima, washoni, walimu — kwa ushauri, mafunzo ya vitendo na apprenticeship.',
    howItWorks: 'Inavyofanya kazi',
    step1Title: 'Tafuta mshauri',
    step1Text: 'Tafuta kwa ujuzi, fani, mahali au bei. Angalia watu wa kweli katika jamii yako.',
    step2Title: 'Tuma ombi',
    step2Text: 'Waambie unachotaka kujifunza na lengo lako. Wanakubali na mnachagua muda.',
    step3Title: 'Jifunza & ukuze',
    step3Text: 'Kutane, fanya mazoezi, maliza vipindi, na shirikisha hadithi yako ya mafanikio.',
    featuredMentors: 'Washauri maarufu',
    successStories: 'Hadithi za mafanikio',
    viewAllStories: 'Ona hadithi zote',
    ctaFind: 'Tafuta mshauri',
    ctaBecome: 'Kuwa mshauri',
    requestMentorship: 'Omba ushauri',
    verified: 'Thibitishwa',
    browse: 'Tafuta washauri',
    about: 'Kuhusu & Athari',
    stories: 'Hadithi',
    signIn: 'Ingia',
    signUp: 'Jiunge',
    signOut: 'Toka',
    dashboard: 'Dashibodi',
    free: 'Bure',
    paid: 'Malipo',
    swap: 'Kubadilishana ujuzi',
    perSession: 'kwa kipindi',
    years: 'miaka ya uzoefu',
    inPerson: 'Ana kwa ana',
    phone: 'Simu',
    whatsapp: 'WhatsApp',
    video: 'Video',
    all: 'Wote',
    nearMe: 'Karibu nami',
    searchPlaceholder: 'Tafuta ujuzi, fani au jina…',
    locationPlaceholder: 'Mahali',
    category: 'Kundi',
    categories: {
      agriculture: 'Kilimo',
      construction: 'Ujenzi',
      fashion: 'Nguo',
      tech: 'Teknolojia',
      food: 'Chakula',
      business: 'Biashara',
      repair: 'Kuremba',
      education: 'Elimu',
    },
    noMentors: 'Hakuna washauri wanaofanana na utafutaji wako. Jaribu vichujio tofauti.',
    aboutTitle: 'Kwa nini SkillBridge ipo',
    reviews: 'maoni',
    learner: 'Mwanafunzi',
    mentor: 'Mshauri',
    organization: 'Shirika',
    safetyFirst: 'Usalama kwanza: kutaneni mahali pa hadhara na mtu ajue uliko.',
  },
} as const;

type I18nContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const lookup = (d: Record<string, unknown>, key: string): string => {
  const val = key
    .split('.')
    .reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], d);
  return typeof val === 'string' ? val : key;
};

const I18nContext = createContext<I18nContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => lookup(dict.en, k),
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const t = (key: string) => lookup(dict[lang] as unknown as Record<string, unknown>, key);
  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
