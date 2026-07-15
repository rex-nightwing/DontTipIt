import { Hono } from 'hono';
import type {
  OnAppInstallRequest,
  TriggerResponse,
} from '@devvit/web/shared';

import { createPost } from '../core/post';

export const triggers = new Hono();

triggers.post('/on-app-install', async (c) => {
  try {
    await c.req.json<OnAppInstallRequest>();

    await createPost();

    return c.json<TriggerResponse>({
      status: 'success',
      message: 'DON\'T TIP IT post created successfully.',
    });
  } catch (error) {
    console.error(error);

    return c.json<TriggerResponse>({
      status: 'error',
      message: 'Failed to create initial game post.',
    }, 500);
  }
});