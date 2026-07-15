import { useCallback, useEffect, useState } from 'react';
import type {
  InitResponse,
  VoteResponse,
  Achievement,
  ActivityItem,
  ModeratorSettings,
  PersonalStats,
  WorldEvent,
  StabilityState,
} from '../../shared/api';

type GameState = {
  username: string;

  stability: StabilityState;

  lore: string;

  totalClicks: number;

  worldEvent: WorldEvent | null;

  activities: ActivityItem[];

  achievements: Achievement[];

  unlockedAchievements: Achievement[];

  moderatorSettings: ModeratorSettings | null;

  personalStats: PersonalStats;

  dailyGoalProgress: number;

  loading: boolean;

  submitting: boolean;

  hasVotedToday: boolean;
};

export const useGame = () => {
  const [state, setState] = useState<GameState>({
    username: '',

    stability: 'Perfect Equilibrium',

    lore: '',

    totalClicks: 0,

    worldEvent: null,

    activities: [],

    achievements: [],

    unlockedAchievements: [],

    moderatorSettings: null,

    personalStats: {
      helpfulVotes: 0,
      harmfulVotes: 0,
      totalVotes: 0,
    },

    dailyGoalProgress: 0,

    loading: true,

    submitting: false,

    hasVotedToday: false,
  });

  const initialize = useCallback(async () => {
    try {
      const response = await fetch('/api/init');

      if (!response.ok)
        throw new Error(`HTTP ${response.status}`);

      const data: InitResponse = await response.json();

      if (data.type !== 'init')
        throw new Error('Unexpected response');

      setState({
        username: data.username,

        stability: data.stability,

        lore: data.lore,

        totalClicks: data.totalClicks,

        worldEvent: data.worldEvent,

        activities: data.activities,

        achievements: data.achievements,

        unlockedAchievements: [],

        moderatorSettings: data.moderatorSettings,

        personalStats: data.personalStats,

        dailyGoalProgress: data.dailyGoalProgress,

        loading: false,

        submitting: false,

        hasVotedToday: data.hasVotedToday,
      });
    } catch (e) {
      console.error(e);

      setState((prev) => ({
        ...prev,
        loading: false,
      }));
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
        const response = await fetch('/api/init');

        if (!response.ok) return;

        const data: InitResponse = await response.json();

        if (data.type !== 'init') return;

        setState((prev) => ({
        ...prev,

        stability: data.stability,

        lore: data.lore,

        totalClicks: data.totalClicks,

        worldEvent: data.worldEvent,

        activities: data.activities,

        achievements: data.achievements,

        moderatorSettings: data.moderatorSettings,

        personalStats: data.personalStats,

        dailyGoalProgress: data.dailyGoalProgress,
        }));
    } catch (e) {
        console.error(e);
    }
    }, []);

  useEffect(() => {
    void initialize();
    }, [initialize]);

    useEffect(() => {
        if (state.submitting) return;

        const timer = setInterval(() => {
            if (document.hidden) return;

            void refresh();
        }, 8000);

        return () => clearInterval(timer);
        }, [refresh, state.submitting]);

  useEffect(() => {
    if (state.unlockedAchievements.length === 0)
      return;

    for (const achievement of state.unlockedAchievements) {
      alert(`🏆 ${achievement.title}\n\n${achievement.description}`);
    }

    setState((prev) => ({
      ...prev,
      unlockedAchievements: [],
    }));
  }, [state.unlockedAchievements]);

  const play = useCallback(
    async (direction: 'push' | 'pull') => {
      if (state.hasVotedToday || state.submitting)
        return;

      setState((prev) => ({
        ...prev,
        submitting: true,
      }));

      await refresh();

      try {
        const response = await fetch(`/api/${direction}`, {
          method: 'POST',
        });

        if (!response.ok)
          throw new Error(`HTTP ${response.status}`);

        const data: VoteResponse = await response.json();

        if (data.type === 'already-voted') {
          alert(data.message);

          setState((prev) => ({
            ...prev,
            submitting: false,
            hasVotedToday: true,
          }));

          return;
        }

        setState((prev) => ({
          ...prev,

          stability: data.stability,

          lore: data.lore,

          totalClicks: data.totalClicks,

          worldEvent: data.worldEvent,

          activities: data.activities,

          achievements: data.achievements,

          unlockedAchievements: data.unlockedAchievements,

          personalStats: data.personalStats,

          dailyGoalProgress: data.dailyGoalProgress,

          submitting: false,

          hasVotedToday: true,
        }));
      } catch (e) {
        console.error(e);

        setState((prev) => ({
          ...prev,
          submitting: false,
        }));
      }
    },
    [state.hasVotedToday, state.submitting]
  );

  return {
    username: state.username,

    stability: state.stability,

    lore: state.lore,

    totalClicks: state.totalClicks,

    worldEvent: state.worldEvent,

    activities: state.activities,

    achievements: state.achievements,

    moderatorSettings: state.moderatorSettings,

    personalStats: state.personalStats,

    dailyGoalProgress: state.dailyGoalProgress,

    loading: state.loading,

    submitting: state.submitting,

    hasVotedToday: state.hasVotedToday,

    pushNorth: () => play('push'),

    pullSouth: () => play('pull'),
  };
};