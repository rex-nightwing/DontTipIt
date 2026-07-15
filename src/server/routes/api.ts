import { Hono } from 'hono';
import { redis, reddit } from '@devvit/web/server';
import type {
  InitResponse,
  VoteResponse,
  StabilityState,
  WorldEvent,
  ActivityItem,
  Achievement,
  ModeratorSettings,
} from '../../shared/api';

const UNLIMITED_USERS = [
  "_night-shade_",
];

const EVENT_DURATION = 5 * 60 * 1000;

const EVENT_CHANCE = {
  rare: 0.10,
  normal: 0.20,
  frequent: 0.40,
};

const DEFAULT_SETTINGS: ModeratorSettings = {
  collapseThreshold: 80,
  worldEventFrequency: "normal",
  dailyGoal: 300,
  randomEventsEnabled: true,
  achievementsEnabled: true,
  activityFeedEnabled: true,
};

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
    day,

    score: `equilibrium_score:${day}`,

    clicks: `total_clicks:${day}`,

    worldEvent: `world_event:${day}`,

    activities: `activity_feed:${day}`,

    settings: "moderator_settings",

    dailyGoal: `daily_goal:${day}`,
  };
}

function voteKey(username: string) {
  return `vote:${utcDate()}:${username}`;
}

function achievementKey(username: string) {
  return `achievements:${username}`;
}

function statsKey(username: string) {
  return `stats:${username}`;
}

function getStability(
  score: number,
  collapseThreshold: number
): StabilityState {
  const value = Math.abs(score);

  if (value === 0)
    return "Perfect Equilibrium";

  if (value <= collapseThreshold * 0.125)
    return "Stable";

  if (value <= collapseThreshold * 0.3125)
    return "Slightly Tilting";

  if (value <= collapseThreshold * 0.625)
    return "Unsteady";

  if (value <= collapseThreshold)
    return "Critical";

  return "Collapse Imminent";
}

function getLore(
  score: number,
  collapseThreshold: number
): string {
  const value = Math.abs(score);

  if (value === 0)
    return "The world holds its breath.";

  if (value <= collapseThreshold * 0.125)
    return "The winds remain gentle.";

  if (value <= collapseThreshold * 0.3125)
    return "The balance begins to sway.";

  if (value <= collapseThreshold * 0.625)
    return "Something feels dangerously wrong.";

  if (value <= collapseThreshold)
    return "Reality struggles to stay together.";

  return "The world is moments from collapse.";
}

async function loadSettings(): Promise<ModeratorSettings> {
  const value = await redis.get(keys().settings);

  if (!value) {
    await redis.set(keys().settings, JSON.stringify(DEFAULT_SETTINGS));
    return DEFAULT_SETTINGS;
  }

  return JSON.parse(value);
}

async function ensureDailyScore() {
  const { score } = keys();

  const existing = await redis.get(score);

  if (existing !== null && existing !== undefined) {
    return Number(existing);
  }

  // Random starting value between -100 and +100
  const startingScore =
    Math.floor(Math.random() * 201) - 100;

  await redis.set(score, String(startingScore));

  return startingScore;
}

async function addActivity(message: string) {
  const settings = await loadSettings();

  if (!settings.activityFeedEnabled)
    return;

  const { activities } = keys();

  const raw = await redis.get(activities);

  const list: ActivityItem[] = raw
    ? JSON.parse(raw)
    : [];

  if (list.length > 0 && list[0].message === message) {
    list[0].count = (list[0].count ?? 1) + 1;
    list[0].createdAt = Date.now();

    await redis.set(
      activities,
      JSON.stringify(list)
    );

    return;
  }

  list.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: "system",
    message,
    count: 1,
    createdAt: Date.now(),
  });

  while (list.length > 20) {
    list.pop();
  }

  await redis.set(
    activities,
    JSON.stringify(list)
  );

}

const EVENTS: WorldEvent[] = [
  {
    type: "north_winds",
    title: "Northern Winds",
    description: "North votes count as +2.",
    expiresAt: 0,
  },
  {
    type: "southern_tide",
    title: "Southern Tide",
    description: "South votes count as -2.",
    expiresAt: 0,
  },
  {
    type: "gravity_distortion",
    title: "Gravity Distortion",
    description: "20% of votes fail.",
    expiresAt: 0,
  },
  {
    type: "calm_before_the_storm",
    title: "Calm Before the Storm",
    description: "Votes behave normally.",
    expiresAt: 0,
  },
];

async function getWorldEvent(): Promise<WorldEvent | null> {
  const raw = await redis.get(keys().worldEvent);

  if (!raw)
    return null;

  const event: WorldEvent = JSON.parse(raw);

  if (event.expiresAt < Date.now()) {
    await redis.del(keys().worldEvent);
    return null;
  }

  return event;
}

async function maybeCreateWorldEvent(totalClicks: number) {
  const settings = await loadSettings();

  if (!settings.randomEventsEnabled)
    return;

  const existing = await getWorldEvent();

  if (existing)
    return;

  const chance = EVENT_CHANCE[settings.worldEventFrequency];

  const lastRollKey = `event_roll:${keys().day}`;

  const lastRollRaw = await redis.get(lastRollKey);

  const lastRoll = lastRollRaw
    ? Number(lastRollRaw)
    : 0;

  const distance = totalClicks - lastRoll;

  if (distance < 250)
    return;

  if (distance <= 500 && Math.random() > chance)
    return;

  await redis.set(lastRollKey, String(totalClicks));

  const base = EVENTS[Math.floor(Math.random() * EVENTS.length)];

  const event: WorldEvent = {
    ...base,
    expiresAt: Date.now() + EVENT_DURATION,
  };

  await redis.set(keys().worldEvent, JSON.stringify(event));

  await addActivity(`World Event: ${event.title}`);
}

async function unlockAchievement(
  username: string,
  id: string,
  title: string,
  description: string
): Promise<boolean> {

  const settings = await loadSettings();

  if (!settings.achievementsEnabled)
    return false;

  const key = achievementKey(username);

  const raw = await redis.get(key);

  const list: Achievement[] = raw ? JSON.parse(raw) : [];

  if (list.find(a => a.id === id))
    return false;

  list.push({
    id: id as any,
    title,
    description,
    unlocked: true,
    unlockedAt: Date.now(),
  });

  await redis.set(key, JSON.stringify(list));

  await addActivity("An achievement was unlocked.");

  return true;
}

api.get('/init', async (c) => {
  try {
    const username = (await reddit.getCurrentUsername()) ?? "anonymous";

    const unlimited = UNLIMITED_USERS.includes(username);

    const { score, clicks, activities } = keys();

    const [clickValue, voted, worldEvent, settings, activityRaw] =
      await Promise.all([
        redis.get(clicks),
        redis.get(voteKey(username)),
        getWorldEvent(),
        loadSettings(),
        redis.get(activities),
      ]);

    const currentScore = await ensureDailyScore();
    const totalClicks = clickValue ? parseInt(clickValue, 10) : 0;

    const achievementRaw = await redis.get(achievementKey(username));

    const achievements = achievementRaw
      ? JSON.parse(achievementRaw)
      : [];

    const statsRaw = await redis.get(statsKey(username));

    const personalStats = statsRaw
      ? JSON.parse(statsRaw)
      : {
          helpfulVotes: 0,
          harmfulVotes: 0,
          totalVotes: 0,
        };

    const activityFeed = activityRaw
      ? JSON.parse(activityRaw)
      : [];

    return c.json<InitResponse>({
      type: "init",

      username,

      totalClicks,

      hasVotedToday: unlimited ? false : voted !== null,

      stability: getStability(
        currentScore,
        settings.collapseThreshold
      ),

      lore: getLore(
        currentScore,
        settings.collapseThreshold
      ),

      worldEvent,

      achievements,

      activities: activityFeed,

      moderatorSettings: settings,

      personalStats,

      dailyGoalProgress: Math.min(
        totalClicks,
        settings.dailyGoal
      ),
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        status: "error",
        message: "Failed to initialize game.",
      },
      500
    );
  }
});

async function handleVote(direction: 1 | -1, c: any) {
  try {
    const username =
      (await reddit.getCurrentUsername()) ?? "anonymous";

    const unlimited =
      UNLIMITED_USERS.includes(username);

    if (!unlimited) {
      const already = await redis.get(voteKey(username));

      if (already) {
        return c.json<VoteResponse>({
          type: "already-voted",
          message: "You have already voted today.",
        });
      }

      await redis.set(voteKey(username), "1");
    }

    let delta = direction;

    const worldEvent = await getWorldEvent();

    if (worldEvent) {
      switch (worldEvent.type) {
        case "north_winds":
          if (direction === 1)
            delta = 2;
          break;

        case "southern_tide":
          if (direction === -1)
            delta = -2;
          break;

        case "gravity_distortion":
          if (Math.random() < 0.2) {
              delta = 0;

              await addActivity(
                  "Gravity distorted a vote."
              );
          }

          break;
      }
    }

    const { score, clicks } = keys();

    await ensureDailyScore();

    const [newScore, totalClicks] =
      await Promise.all([
        redis.incrBy(score, delta),
        redis.incrBy(clicks, 1),
      ]);

    await maybeCreateWorldEvent(totalClicks);

    const statsRaw =
      await redis.get(statsKey(username));

    const stats = statsRaw
      ? JSON.parse(statsRaw)
      : {
          helpfulVotes: 0,
          harmfulVotes: 0,
          totalVotes: 0,
        };

    stats.totalVotes++;

    if (direction === 1)
      stats.helpfulVotes++;
    else
      stats.harmfulVotes++;

    await redis.set(
      statsKey(username),
      JSON.stringify(stats)
    );

    const settings = await loadSettings();

    const unlockedAchievements = [];

    const currentState = getStability(
      newScore,
      settings.collapseThreshold
    );

    if (
      currentState === "Collapse Imminent"
    ) {
      if (
        await unlockAchievement(
          username,
          "chaos_witness",
          "Chaos Witness",
          "Be online when Collapse Imminent is reached."
        )
      ) {
        unlockedAchievements.push({
          id: "chaos_witness",
          title: "Chaos Witness",
          description:
            "Be online when Collapse Imminent is reached.",
          unlocked: true,
        });
      }
    }

    if (stats.totalVotes === 1) {
      if (
        await unlockAchievement(
          username,
          "first_step",
          "First Step",
          "Cast your first vote."
        )
      ) {
        unlockedAchievements.push({
          id: "first_step",
          title: "First Step",
          description: "Cast your first vote.",
          unlocked: true,
        });
      }
    }

    if (stats.totalVotes === 100) {
      if (
        await unlockAchievement(
          username,
          "persistent",
          "Persistent",
          "Cast 100 votes."
        )
      ) {
        unlockedAchievements.push({
          id: "persistent",
          title: "Persistent",
          description: "Cast 100 votes.",
          unlocked: true,
        });
      }
    }

    if (stats.helpfulVotes === 100) {
      if (
        await unlockAchievement(
          username,
          "balanced_mind",
          "Balanced Mind",
          "100 helpful votes."
        )
      ) {
        unlockedAchievements.push({
          id: "balanced_mind",
          title: "Balanced Mind",
          description: "100 helpful votes.",
          unlocked: true,
        });
      }
    }

    if (newScore === 0) {
      if (
        await unlockAchievement(
          username,
          "neutralizer",
          "Neutralizer",
          "Returned equilibrium to zero."
        )
      ) {
        unlockedAchievements.push({
          id: "neutralizer",
          title: "Neutralizer",
          description:
            "Returned equilibrium to zero.",
          unlocked: true,
        });
      }
    }

    const state = getStability(
      newScore,
      settings.collapseThreshold
    );

    switch (state) {

    case "Perfect Equilibrium":
        await addActivity(
            "The world grows calmer."
        );
        break;

    case "Stable":
        await addActivity(
            "The world steadies."
        );
        break;

    case "Slightly Tilting":
        await addActivity(
            "Balance begins to shift."
        );
        break;

    case "Unsteady":
        await addActivity(
            "The world trembles."
        );
        break;

    case "Critical":
        await addActivity(
            "The balance hangs by a thread."
        );
        break;

    case "Collapse Imminent":
        await addActivity(
            "Collapse is approaching."
        );
        break;

    }

    const activityRaw =
      await redis.get(keys().activities);

    const achievementRaw =
      await redis.get(achievementKey(username));

    return c.json<VoteResponse>({
      type: "update",

      totalClicks,

      stability: getStability(
        newScore,
        settings.collapseThreshold
      ),

      lore: getLore(
        newScore,
        settings.collapseThreshold
      ),

      worldEvent: await getWorldEvent(),

      activities: activityRaw
        ? JSON.parse(activityRaw)
        : [],

      achievements: achievementRaw
        ? JSON.parse(achievementRaw)
        : [],

      unlockedAchievements,

      personalStats: stats,

      dailyGoalProgress: Math.min(
        totalClicks,
        settings.dailyGoal
      ),
    });
  } catch (error) {
    console.error(error);

    return c.json(
      {
        status: "error",
        message: "Failed to update game.",
      },
      500
    );
  }
}

api.post('/push', (c) => handleVote(1, c));

api.post('/pull', (c) => handleVote(-1, c));

api.get("/settings", async (c) => {
  try {
    const settings = await loadSettings();

    return c.json({
      type: "moderator-settings",
      settings,
    });
  } catch (e) {
    console.error(e);

    return c.json(
      {
        status: "error",
        message: "Failed to load settings.",
      },
      500
    );
  }
});

api.post("/settings", async (c) => {
  try {
    const body = await c.req.json();

    const updated: ModeratorSettings = {
      collapseThreshold:
        body.collapseThreshold ??
        DEFAULT_SETTINGS.collapseThreshold,

      worldEventFrequency:
        body.worldEventFrequency ??
        DEFAULT_SETTINGS.worldEventFrequency,

      dailyGoal:
        body.dailyGoal ??
        DEFAULT_SETTINGS.dailyGoal,

      randomEventsEnabled:
        body.randomEventsEnabled ??
        DEFAULT_SETTINGS.randomEventsEnabled,

      achievementsEnabled:
        body.achievementsEnabled ??
        DEFAULT_SETTINGS.achievementsEnabled,

      activityFeedEnabled:
        body.activityFeedEnabled ??
        DEFAULT_SETTINGS.activityFeedEnabled,
    };

    await redis.set(
      keys().settings,
      JSON.stringify(updated)
    );

    await addActivity(
      "Moderator updated game settings."
    );

    return c.json({
      success: true,
      settings: updated,
    });
  } catch (e) {
    console.error(e);

    return c.json(
      {
        status: "error",
        message: "Failed to save settings.",
      },
      500
    );
  }
});

