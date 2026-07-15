import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useGame } from './hooks/useGame';

export const App = () => {
  const {
    username,
    hint,
    totalClicks,
    loading,
    submitting,
    hasVotedToday,
    pushNorth,
    pullSouth,
  } = useGame();

  const buttonsDisabled = loading || submitting || hasVotedToday;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center px-6 py-8">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-gray-900 shadow-2xl border border-gray-200 dark:border-gray-800 p-8">

        <div className="text-center space-y-2">
          <h1 className="text-5xl font-black tracking-wider text-orange-600">
            DON'T TIP IT
          </h1>

          {!loading && (
            <p className="text-gray-500 dark:text-gray-400">
              Playing as <span className="font-semibold">{username}</span>
            </p>
          )}
        </div>

        <div className="mt-10 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6">

          <p className="uppercase text-xs tracking-[0.3em] text-gray-500 text-center">
            Current Balance Hint
          </p>

          <p className="mt-4 text-xl font-semibold text-center text-gray-900 dark:text-white min-h-[80px] flex items-center justify-center">
            {loading ? 'Loading...' : hint}
          </p>

        </div>

        <div className="mt-8 text-center">

          <p className="uppercase tracking-widest text-gray-500 text-sm">
            Total Clicks
          </p>

          <h2 className="mt-2 text-6xl font-extrabold text-orange-600">
            {loading ? '--' : totalClicks.toLocaleString()}
          </h2>

        </div>

        <div className="mt-10 flex flex-col gap-4">

          <button
            onClick={pushNorth}
            disabled={buttonsDisabled}
            className="h-16 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xl font-bold transition-colors flex items-center justify-center"
          >
            {submitting ? (
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Updating...
              </span>
            ) : hasVotedToday ? (
              '✓ Already Voted Today'
            ) : (
              '⬆ Push North'
            )}
          </button>

          <button
            onClick={pullSouth}
            disabled={buttonsDisabled}
            className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xl font-bold transition-colors flex items-center justify-center"
          >
            {submitting ? (
              <span className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Updating...
              </span>
            ) : hasVotedToday ? (
              '✓ Already Voted Today'
            ) : (
              '⬇ Pull South'
            )}
          </button>

        </div>

        {hasVotedToday && (
          <div className="mt-6 rounded-xl bg-orange-100 dark:bg-orange-900/30 border border-orange-300 dark:border-orange-700 p-4">
            <p className="text-center text-orange-700 dark:text-orange-300 font-semibold">
              You have already voted today.
            </p>
            <p className="mt-1 text-center text-sm text-orange-600 dark:text-orange-400">
              Voting resets automatically at 00:00 UTC.
            </p>
          </div>
        )}

        <div className="mt-10 border-t border-gray-200 dark:border-gray-700 pt-6">

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Nobody knows the real balance.
          </p>

          <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
            Every player changes the same global equilibrium.
          </p>

          <p className="mt-2 text-center text-sm font-semibold text-orange-600">
            Can Reddit keep it at zero?
          </p>

        </div>

      </div>
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);