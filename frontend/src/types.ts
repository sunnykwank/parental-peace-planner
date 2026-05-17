export interface Plan {
  id: string;
  location: string;
  time_period: string;
  activity_type: string;
  result: string;
  createdAt: string;
}

export interface ActivityTile {
  label: string;
  emoji: string;
}

export interface TimeTile {
  label: string;
  emoji: string;
}
