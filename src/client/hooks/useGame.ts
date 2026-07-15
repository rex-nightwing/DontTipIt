import { useCallback, useEffect, useState } from 'react';
import type { InitResponse, VoteResponse } from '../../shared/api';

type GameState = {
  username: string;
  hint: string;
  totalClicks: number;
  loading: boolean;
  submitting: boolean;
  hasVotedToday: boolean;
};

export const useGame = () => {
  const [state, setState] = useState<GameState>({
    username: '',
    hint: '',
    totalClicks: 0,
    loading: true,
    submitting: false,
    hasVotedToday: false,
  });

  const initialize = useCallback(async () => {
    try {
      const response = await fetch('/api/init');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: InitResponse = await response.json();

      if (data.type !== 'init') {
        throw new Error('Unexpected response');
      }

      setState({
        username: data.username,
        hint: data.hint,
        totalClicks: data.totalClicks,
        loading: false,
        submitting: false,
        hasVotedToday: data.hasVotedToday,
      });
    } catch (error) {
      console.error(error);

      setState((previous) => ({
        ...previous,
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const play = useCallback(
    async (direction: 'push' | 'pull') => {
      // Prevent duplicate requests from the UI
      if (state.hasVotedToday || state.submitting) {
        return;
      }

      setState((previous) => ({
        ...previous,
        submitting: true,
      }));

      try {
        const response = await fetch(`/api/${direction}`, {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data: VoteResponse = await response.json();

        if (data.type === 'already-voted') {
          alert(data.message);

          setState((previous) => ({
            ...previous,
            submitting: false,
            hasVotedToday: true,
          }));

          return;
        }

        setState((previous) => ({
          ...previous,
          hint: data.hint,
          totalClicks: data.totalClicks,
          submitting: false,
          hasVotedToday: true,
        }));
      } catch (error) {
        console.error(error);

        setState((previous) => ({
          ...previous,
          submitting: false,
        }));
      }
    },
    [state.hasVotedToday, state.submitting]
  );

  return {
    username: state.username,
    hint: state.hint,
    totalClicks: state.totalClicks,
    loading: state.loading,
    submitting: state.submitting,
    hasVotedToday: state.hasVotedToday,
    pushNorth: () => play('push'),
    pullSouth: () => play('pull'),
  };
};