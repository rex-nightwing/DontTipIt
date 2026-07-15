import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { useGame } from './hooks/useGame';

export const App = () => {
  const {
    username,
    stability,
    lore,
    worldEvent,
    activities,
    achievements,
    personalStats,
    dailyGoalProgress,
    moderatorSettings,
    totalClicks,
    loading,
    submitting,
    hasVotedToday,
    pushNorth,
    pullSouth,
  } = useGame();

  const buttonsDisabled = loading || submitting || hasVotedToday;

  const stabilityColor = {
    "Perfect Equilibrium": "bg-green-600",
    Stable: "bg-green-500",
    "Slightly Tilting": "bg-yellow-500",
    Unsteady: "bg-orange-500",
    Critical: "bg-red-600",
    "Collapse Imminent": "bg-black",
  }[stability];

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

        <div className="mt-8 space-y-5">

          <div className={`${stabilityColor} rounded-2xl p-5 text-white transition-all duration-300 glow card-hover`}>

            <p className="uppercase tracking-[0.25em] text-xs opacity-80">
              Stability
            </p>

            <h2 className="text-3xl font-black mt-2">
              {stability}
            </h2>

          </div>

          <div className="rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-5">

            <p className="uppercase tracking-widest text-xs text-gray-500">
              World Lore
            </p>

            <p className="mt-3 text-lg">
              {lore}
            </p>

          </div>

          {worldEvent && (
            <div className="rounded-2xl border-2 border-purple-500 bg-purple-50 dark:bg-purple-900/30 p-5 card-hover fade-in">

              <p className="text-xs uppercase tracking-widest text-purple-700">
                Active World Event
              </p>

              <h3 className="text-2xl font-bold mt-2">
                {worldEvent.title}
              </h3>

              <p className="mt-2">
                {worldEvent.description}
              </p>

            </div>
          )}

        </div>

        <div className="mt-8 text-center">

          <p className="uppercase tracking-widest text-gray-500 text-sm">
          Daily Goal
          </p>

          <div className="mt-3 h-5 rounded-full bg-gray-200 overflow-hidden">

            <div
              className="h-full bg-orange-600 progress-smooth"
              style={{
                width: `${
                  moderatorSettings
                    ? (dailyGoalProgress /
                        moderatorSettings.dailyGoal) *
                      100
                    : 0
                }%`,
              }}
            />

          </div>

          <p className="mt-3 font-bold">

            {dailyGoalProgress}

            /

            {moderatorSettings?.dailyGoal ?? "--"}

          </p>

          <p className="mt-6 uppercase tracking-widest text-gray-500 text-sm">
          Total Votes Today
          </p>

          <h2 className="mt-2 text-6xl font-extrabold text-orange-600">
          {loading ? "--" : totalClicks.toLocaleString()}
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

        <div className="mt-8 rounded-2xl bg-gray-50 dark:bg-gray-800 p-5">

        <h3 className="font-bold text-xl">
        Personal Statistics
        </h3>

        <div className="grid grid-cols-3 gap-4 mt-5">

        <div>

        <p className="text-sm text-gray-500">
        Helpful
        </p>

        <p className="text-2xl font-bold">

        {personalStats.helpfulVotes}

        </p>

        </div>

        <div>

        <p className="text-sm text-gray-500">
        Harmful
        </p>

        <p className="text-2xl font-bold">

        {personalStats.harmfulVotes}

        </p>

        </div>

        <div>

        <p className="text-sm text-gray-500">
        Total
        </p>

        <p className="text-2xl font-bold">

        {personalStats.totalVotes}

        </p>

        </div>

        </div>

        </div>

        <div className="mt-8 rounded-2xl bg-gray-50 dark:bg-gray-800 p-5">

        <h3 className="text-xl font-bold">

        Achievements

        </h3>

        <div className="mt-4 space-y-3">

        {achievements.length === 0 && (

        <p className="text-gray-500">

        No achievements unlocked.

        </p>

        )}

        {achievements.map(a=>(

        <div
        key={a.id}
        className="rounded-xl border p-3 flex justify-between items-center achievement-pop card-hover"
        >

        <div>

        <p className="font-semibold">

        🏆 {a.title}

        </p>

        <p className="text-sm text-gray-500">

        {a.description}

        </p>

        </div>

        </div>

        ))}

        </div>

        </div>

        <div className="mt-8 rounded-2xl bg-gray-50 dark:bg-gray-800 p-5">

        <h3 className="text-xl font-bold">

        Activity Feed

        </h3>

        <div className="mt-4 space-y-2 max-h-72 overflow-y-auto">

        {activities.map(item=>(

        <div
        key={item.id}
        className="border-b pb-2 text-sm activity-item"
        >

        {item.message}
        {item.count && item.count > 1 && (
          <span className="ml-2 text-xs text-gray-500">
            ×{item.count}
          </span>
        )}

        </div>

        ))}

        </div>

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