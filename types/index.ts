export type EntityType =
  | 'ATTRACTION'
  | 'RESTAURANT'
  | 'SHOW'
  | 'MEET_AND_GREET'
  | 'PARADE'
  | 'FIREWORKS'
  | 'ENTERTAINMENT'
  | 'MERCHANDISE';

export type StatusType = 'OPERATING' | 'DOWN' | 'CLOSED' | 'REFURBISHMENT' | 'NO_DATA';

export type CategoryFilter = 'ALL' | 'ATTRACTION' | 'FOOD' | 'ENTERTAINMENT' | 'GREETING';
export type StatusFilter = 'ALL' | 'OPERATING' | 'INACTIVE';
export type SortType = 'waitTime' | 'name' | 'status';

export interface LiveEntity {
  id: string;
  name: string;
  entityType: EntityType;
  status: StatusType;
  queue?: {
    STANDBY?: { waitTime: number | null };
    SINGLE_RIDER?: { waitTime: number | null };
  };
  lastUpdated: string;
}

export interface Park {
  id: string;
  name: string;
  slug?: string;
}
