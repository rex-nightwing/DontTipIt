import { Hono } from 'hono';
import type {
  OnAppInstallRequest,
  TriggerResponse,
} from '@devvit/web/shared';

import { redis } from '@devvit/web/server';
import { createPost } from '../core/post';

export const triggers = new Hono();

function utcDate() {
  return new Date().toISOString().slice(0, 10);
}

triggers.post('/on-app-install', async (c) => {
  try {
    await c.req.json<OnAppInstallRequest>();

    const day = utcDate();

    await redis.del(`world_event:${day}`);
    await redis.del(`activity_feed:${day}`);
    await redis.del(`equilibrium_score:${day}`);
    await redis.del(`total_clicks:${day}`);

    await createPost();

    return c.json<TriggerResponse>({
      status: 'success',
      message: "DON'T TIP IT post created successfully.",
    });
  } catch (error) {
    console.error(error);

    return c.json<TriggerResponse>(
      {
        status: 'error',
        message: 'Failed to create initial game post.',
      },
      500
    );
  }
});