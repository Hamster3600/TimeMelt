export type Period = 'D' | 'W' | 'M' | 'Y';

export interface TimeEntry { time: number }

export interface DomainData {
    [date: string]: TimeEntry;
}

export interface TimeData {
    [domain: string]: DomainData;
}