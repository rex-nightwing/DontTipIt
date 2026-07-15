import { reddit, redis } from '@devvit/web/server';

function utcDate() {
  return new Date().toISOString().slice(0, 10);
}

function scoreKey() {
  return `equilibrium_score:${utcDate()}`;
}

function getStability(score: number): string {
  const value = Math.abs(score);

  if (value === 0) return '🟢 Perfect Equilibrium';
  if (value <= 10) return '🟢 Stable';
  if (value <= 25) return '🟡 Slightly Tilting';
  if (value <= 50) return '🟠 Unsteady';
  if (value <= 80) return '🔴 Critical';
  return '⚫ Collapse Imminent';
}

export const createPost = async () => {
  const raw = await redis.get(scoreKey());
  const score = raw ? Number(raw) : 0;

  return reddit.submitCustomPost({
    title: `DON'T TIP IT • ${getStability(score)}`,
  });
};