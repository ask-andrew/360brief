export interface Timestamped {
  createdAt: string;
  updatedAt: string;
}

export interface Owned {
  owner: string;
}

export interface TimeRange {
  start: string;
  end: string;
}