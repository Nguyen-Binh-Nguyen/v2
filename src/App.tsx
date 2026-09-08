import { useEffect, useState } from 'react';
import { LineChart, Moon, Sun, FileText, BarChart3 } from 'lucide-react';
import { useJournalData } from '@/hooks/useJournalData';
import { CoverPhoto } from '@/components/CoverPhoto';
import { DocumentaryPage } from '@/components/DocumentaryPage';
import { StatisticsPage } from '@/components/StatisticsPage';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';

type Page = 'documentary' | 'statistics';

function JournalApp() {
  const { loading: authLoading } = useAuth();
  const data = useJournalData();
  const [page, setPage] = useState<Page>('documentary');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '1') {
        e.preventDefault();
        setPage('documentary');
      } else if ((e.metaKey || e.ctrlKey) && e.key === '2') {
        e.preventDefault();
        setPage('statistics');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const theme = data.settings?.theme || 'dark';
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#1c1c1e';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f5f5f5';
    }
  }, [isDark]);

  const [docCoverUrl, setDocCoverUrl] = useState<string | null>(null);
  const [statCoverUrl, setStatCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (data.settings?.documentary_cover) {
      data.getSignedUrl(data.settings.documentary_cover).then(setDocCoverUrl).catch(() => setDocCoverUrl(null));
    } else {
      setDocCoverUrl(null);
    }
  }, [data.settings?.documentary_cover, data.getSignedUrl]);

  useEffect(() => {
    if (data.settings?.statistics_cover) {
      data.getSignedUrl(data.settings.statistics_cover).then(setStatCoverUrl).catch(() => setStatCoverUrl(null));
    } else {
      setStatCoverUrl(null);
    }
  }, [data.settings?.statistics_cover, data.getSignedUrl]);

  const handleCoverUpload = async (file: File, whichPage: Page) => {
    const path = await data.uploadImage(file, `${whichPage}_cover`);
    if (whichPage === 'documentary') {
      await data.updateSettings({ documentary_cover: path });
    } else {
      await data.updateSettings({ statistics_cover: path });
    }
  };

  const handleCoverReposition = async (offset: number, whichPage: Page) => {
    if (whichPage === 'documentary') {
      await data.updateSettings({ documentary_cover_offset: offset });
    } else {
      await data.updateSettings({ statistics_cover_offset: offset });
    }
  };

  const handleCoverRemove = async (whichPage: Page) => {
    if (whichPage === 'documentary') {
      await data.updateSettings({ documentary_cover: null, documentary_cover_offset: 50 });
    } else {
      await data.updateSettings({ statistics_cover: null, statistics_cover_offset: 50 });
    }
  };

  const toggleTheme = async () => {
    await data.updateSettings({ theme: isDark ? 'light' : 'dark' });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="animate-pulse text-gray-400 dark:text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#1c1c1e]' : 'bg-[#f5f5f7]'} ${isDark ? 'text-gray-100' : 'text-gray-900'} transition-colors`}>
      <header className={`sticky top-0 z-40 border-b backdrop-blur-md ${
        isDark
          ? 'bg-gray-900/80 border-gray-800'
          : 'bg-white/80 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
              <LineChart className="w-5 h-5 text-white dark:text-gray-900" />
            </div>
            <span className="font-semibold text-lg hidden sm:block">Journal</span>
          </div>

          <div className={`flex gap-1 p-1 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button
              onClick={() => setPage('documentary')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                page === 'documentary'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <FileText className="w-4 h-4" />
              Documentary
            </button>
            <button
              onClick={() => setPage('statistics')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                page === 'statistics'
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Statistics
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
              title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {data.loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-gray-400 dark:text-gray-500">Loading your journal...</div>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <CoverPhoto
                coverUrl={page === 'documentary' ? docCoverUrl : statCoverUrl}
                offset={page === 'documentary' ? data.settings?.documentary_cover_offset || 50 : data.settings?.statistics_cover_offset || 50}
                onUpload={(file) => handleCoverUpload(file, page)}
                onReposition={(offset) => handleCoverReposition(offset, page)}
                onRemove={() => handleCoverRemove(page)}
              />
            </div>

            {page === 'statistics' && (
              <div className="mb-6">
                <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Statistics</h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Analyze your trading performance</p>
              </div>
            )}

            {page === 'documentary' ? (
              <DocumentaryPage data={data} />
            ) : (
              <StatisticsPage data={data} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function AppInner() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-950">
        <div className="animate-pulse text-gray-400 dark:text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return <JournalApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
