import { Header, Footer } from '@/components/Layout';
import { useHashRoute } from '@/lib/router';
import { LandingPage, AboutPage, StoriesPage } from '@/pages/Landing';
import { AuthPage } from '@/pages/Auth';
import { BrowsePage } from '@/pages/Browse';
import { MentorProfilePage } from '@/pages/MentorProfile';
import { DashboardPage } from '@/pages/Dashboard';
import { OpportunitiesPage, OpportunityDetailPage } from '@/pages/Opportunities';
import { I18nProvider } from '@/lib/i18n';
import { AuthProvider } from '@/lib/auth';

function Routes() {
  const route = useHashRoute();
  const path = route.split('?')[0];
  if (path === '/') return <LandingPage />;
  if (path === '/auth') return <AuthPage />;
  if (path === '/browse') return <BrowsePage />;
  if (path.startsWith('/mentor/')) return <MentorProfilePage />;
  if (path === '/dashboard') return <DashboardPage />;
  if (path === '/opportunities') return <OpportunitiesPage />;
  if (path.startsWith('/opportunity/')) return <OpportunityDetailPage />;
  if (path === '/stories') return <StoriesPage />;
  if (path === '/about') return <AboutPage />;
  return <LandingPage />;
}

export default function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <div className="flex-1">
            <Routes />
          </div>
          <Footer />
        </div>
      </AuthProvider>
    </I18nProvider>
  );
}
