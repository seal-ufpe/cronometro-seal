export interface Clock {
  now(): number;
}

export interface Ticker {
  start(callback: () => void): void;
  stop(): void;
}

export interface TimeFormatter {
  format(milliseconds: number): string;
  accessibleLabel(milliseconds: number, context?: 'elapsed' | 'remaining'): string;
}

export interface CountStrategy {
  elapsedToDisplay(elapsedMs: number, initialMs: number): number;
  isFinished(elapsedMs: number, initialMs: number): boolean;
  display(elapsedMs: number, initialMs: number): number;
  isComplete(elapsedMs: number, initialMs: number): boolean;
}

export interface Configurable {
  setInitialTime(milliseconds: number): boolean;
  setStrategy(strategy: CountStrategy): boolean;
}

export interface TimeAdjustable {
  addTime(milliseconds: number): boolean;
  clearTime(): void;
}

export interface Observer<T> {
  update(value: T): void;
}

export interface PersistenceRepository<T> {
  load(): T | null;
  save(value: T): void;
  clear(): void;
}

export type StateRepository<T> = PersistenceRepository<T>;
export type Theme = 'dark' | 'light';
export type ThemeRepository = {
  load(): Theme;
  save(theme: Theme): void;
  clear(): void;
};

export type TimerState = 'idle' | 'running' | 'paused' | 'finished';
export type CountMode = 'up' | 'down';

export interface TimerSnapshot {
  elapsedMs: number;
  initialMs: number;
  state: TimerState;
  countMode: CountMode;
}
