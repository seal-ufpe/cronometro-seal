import type { CountStrategy as Strategy } from '../abstractions/ports';
import type { CountMode } from '../abstractions/ports';

export type { CountMode };
const MAX_TIME_MS = (99 * 60 * 60 + 59 * 60 + 59) * 1000;

/** Strategy pattern keeps progress and countdown rules replaceable (Open/Closed). */
export type CountStrategy = Strategy;

export class ProgressStrategy implements CountStrategy {
  elapsedToDisplay(elapsedMs: number, initialMs: number): number {
    return this.display(elapsedMs, initialMs);
  }
  isFinished(): boolean {
    return false;
  }
  display(elapsedMs: number, initialMs: number): number {
    return Math.min(MAX_TIME_MS, Math.max(0, initialMs + elapsedMs));
  }
  isComplete(): boolean {
    return false;
  }
}

export class CountdownStrategy implements CountStrategy {
  elapsedToDisplay(elapsedMs: number, initialMs: number): number {
    return this.display(elapsedMs, initialMs);
  }
  isFinished(elapsedMs: number, initialMs: number): boolean {
    return this.isComplete(elapsedMs, initialMs);
  }
  display(elapsedMs: number, initialMs: number): number {
    return Math.max(0, initialMs - elapsedMs);
  }
  isComplete(elapsedMs: number, initialMs: number): boolean {
    return initialMs > 0 && elapsedMs >= initialMs;
  }
}

export const strategyFor = (mode: CountMode): CountStrategy =>
  mode === 'down' ? new CountdownStrategy() : new ProgressStrategy();

// Compatibility aliases for consumers of the previous domain API.
export { ProgressStrategy as CountUpStrategy, CountdownStrategy as CountDownStrategy };
