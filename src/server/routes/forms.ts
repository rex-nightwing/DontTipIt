import { Hono } from 'hono';
import { redis } from '@devvit/web/server';
import type { UiResponse } from '@devvit/web/shared';

export const forms = new Hono();

const SETTINGS_KEY = 'moderator_settings';

forms.post('/moderator-settings', async (c) => {
  try {
    const body = await c.req.json();

    const settings = {
      collapseThreshold: Number(body.collapseThreshold ?? 80),

      worldEventFrequency:
        body.worldEventFrequency ?? 'normal',

      dailyGoal: Number(body.dailyGoal ?? 300),

      randomEventsEnabled:
        body.randomEventsEnabled === true ||
        body.randomEventsEnabled === 'true',

      achievementsEnabled:
        body.achievementsEnabled === true ||
        body.achievementsEnabled === 'true',

      activityFeedEnabled:
        body.activityFeedEnabled === true ||
        body.activityFeedEnabled === 'true',
    };

    await redis.set(
      SETTINGS_KEY,
      JSON.stringify(settings)
    );

    return c.json<UiResponse>({
      showToast:
        'Moderator settings updated successfully.',
    });
  } catch (e) {
    console.error(e);

    return c.json<UiResponse>(
      {
        showToast:
          'Failed to save moderator settings.',
      },
      500
    );
  }
});