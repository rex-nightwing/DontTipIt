export type InitResponse = {
  type: 'init';
  username: string;
  totalClicks: number;
  hint: string;
  hasVotedToday: boolean;
};

export type GameResponse = {
  type: 'update';
  totalClicks: number;
  hint: string;
};

export type AlreadyVotedResponse = {
  type: 'already-voted';
  message: string;
};

export type VoteResponse = GameResponse | AlreadyVotedResponse;