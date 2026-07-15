export type StabilityState =
  | 'Perfect Equilibrium'
  | 'Stable'
  | 'Slightly Tilting'
  | 'Unsteady'
  | 'Critical'
  | 'Collapse Imminent';

export type WorldEventType =
  | 'north_winds'
  | 'southern_tide'
  | 'gravity_distortion'
  | 'calm_before_the_storm';

export interface WorldEvent {
  type: WorldEventType;
  title: string;
  description: string;
  expiresAt: number;
}

export interface ActivityItem {
  id: string;
  type: 'system' | 'vote' | 'achievement' | 'event';
  message: string;
  createdAt: number;
  count?: number;
}

export type AchievementId =
  | 'first_step'
  | 'balanced_mind'
  | 'persistent'
  | 'neutralizer'
  | 'chaos_witness';

export interface Achievement {
  id: AchievementId;
  title: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface PersonalStats {
  helpfulVotes: number;
  harmfulVotes: number;
  totalVotes: number;
}

export interface ModeratorSettings {
  collapseThreshold: number;
  worldEventFrequency: 'rare' | 'normal' | 'frequent';
  dailyGoal: 100 | 300 | 500;
  randomEventsEnabled: boolean;
  achievementsEnabled: boolean;
  activityFeedEnabled: boolean;
}

export type InitResponse = {
  type: 'init';

  username: string;

  totalClicks: number;

  hasVotedToday: boolean;

  stability: StabilityState;

  lore: string;

  worldEvent: WorldEvent | null;

  activities: ActivityItem[];

  achievements: Achievement[];

  personalStats: PersonalStats;

  moderatorSettings: ModeratorSettings;

  dailyGoalProgress: number;
};

export type GameResponse = {
  type: 'update';

  totalClicks: number;

  stability: StabilityState;

  lore: string;

  worldEvent: WorldEvent | null;

  activities: ActivityItem[];

  achievements: Achievement[];

  unlockedAchievements: Achievement[];

  personalStats: PersonalStats;

  dailyGoalProgress: number;
};

export type AlreadyVotedResponse = {
  type: 'already-voted';
  message: string;
};

export type VoteResponse =
  | GameResponse
  | AlreadyVotedResponse;