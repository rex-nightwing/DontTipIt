import { Hono } from 'hono';
import { redis, reddit } from '@devvit/web/server';
import type { InitResponse, VoteResponse } from '../../shared/api';

const UNLIMITED_USERS = [
  "_night-shade_",
];

type ErrorResponse = {
  status: 'error';
  message: string;
};

export const api = new Hono();

function utcDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function keys() {
  const day = utcDate();

  return {
    score: `equilibrium_score:${day}`,
    clicks: `total_clicks:${day}`,
    day,
  };
}

function voteKey(username: string) {
  return `vote:${utcDate()}:${username}`;
}

const getHint = (score: number): string => {
  if (score === 0) {
    return 'The scales rest in perfect, terrifying silence.';
  }

  if (score > 0 && score <= 10) {
    return 'A gentle breeze blows North.';
  }

  if (score > 10) {
    return 'A heavy storm pulls North!';
  }

  if (score < 0 && score >= -10) {
    return 'A quiet rustle to the South.';
  }

  return 'A massive tidal wave crashes South!';
};

api.get('/init', async (c) => {
  try {
    const username = (await reddit.getCurrentUsername()) ?? 'anonymous';
    const unlimited = UNLIMITED_USERS.includes(username);

    const { score, clicks } = keys();

    const [scoreValue, clickValue, voted] = await Promise.all([
      redis.get(score),
      redis.get(clicks),
      redis.get(voteKey(username)),
    ]);

    const currentScore = scoreValue ? parseInt(scoreValue, 10) : 0;
    const totalClicks = clickValue ? parseInt(clickValue, 10) : 0;

    return c.json<InitResponse>({
      type: 'init',
      username,
      totalClicks,
      hint: getHint(currentScore),
      hasVotedToday: unlimited ? false : voted !== null,
    });
  } catch (error) {
    console.error(error);

    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'Failed to initialize game.',
      },
      500
    );
  }
});

async function handleVote(direction: 1 | -1, c: any) {
  try {
    const username = (await reddit.getCurrentUsername()) ?? 'anonymous';

    const unlimited = UNLIMITED_USERS.includes(username);

    if (!unlimited) {
      const userVote = voteKey(username);

      const already = await redis.get(userVote);

      if (already) {
        return c.json<VoteResponse>({
          type: 'already-voted',
          message: 'You have already voted today.',
        });
      }

      await redis.set(userVote, '1');
    }

    const { score, clicks } = keys();

    const [newScore, totalClicks] = await Promise.all([
      redis.incrBy(score, direction),
      redis.incrBy(clicks, 1),
    ]);

    return c.json<VoteResponse>({
      type: 'update',
      totalClicks,
      hint: getHint(newScore),
    });
  } catch (error) {
    console.error(error);

    return c.json<ErrorResponse>(
      {
        status: 'error',
        message: 'Failed to update game.',
      },
      500
    );
  }
}

api.post('/push', (c) => handleVote(1, c));

api.post('/pull', (c) => handleVote(-1, c));