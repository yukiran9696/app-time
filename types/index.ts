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

export type CategoryFilter = 'ALL' | 'ATTRACTION' | 'FOOD' | 'ENTERTAINMENT' | 'GREETING' | 'FAVORITES';
export type StatusFilter = 'ALL' | 'OPERATING' | 'ZERO_WAIT' | 'INACTIVE';
export type SortType = 'waitTime' | 'name' | 'status';

export interface PaidReturnTime {
  state: 'AVAILABLE' | 'FINISHED' | 'TEMP_FULL';
  price?: { amount: number; currency: string; formatted: string };
  returnStart?: string;
  returnEnd?: string;
}

export interface LiveEntity {
  id: string;
  name: string;
  entityType: EntityType;
  status: StatusType;
  queue?: {
    STANDBY?: { waitTime: number | null };
    SINGLE_RIDER?: { waitTime: number | null };
    PAID_RETURN_TIME?: PaidReturnTime;
  };
  lastUpdated: string;
}

export interface Park {
  id: string;
  name: string;
  slug?: string;
}

export interface ScheduleEntry {
  date: string;
  type: string;
  openingTime: string;
  closingTime: string;
}
