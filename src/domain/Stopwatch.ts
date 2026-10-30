import type { Clock, CountMode, Observer, TimerSnapshot, TimerState } from '../abstractions/ports';
import { strategyFor, type CountStrategy } from './CountStrategy';

/** Domain service: no DOM, timers, storage, or browser APIs (Dependency Inversion). */
export class Stopwatch {
  static readonly MAX_MS = (99 * 60 * 60 + 59 * 60 + 59) * 1000;
  private state: TimerState = 'idle';
  private elapsedMs = 0;
  private initialMs = 0;
  private startedAt = 0;
  private mode: CountMode = 'up';
  private strategy: CountStrategy;
  private readonly observers = new Set<Observer<void>>();
  private finishedNotified = false;

  constructor(
    private readonly clock: Clock,
    strategy: CountStrategy = strategyFor('up'),
  ) {
    this.strategy = strategy;
  }

  getState(): TimerState {
    this.syncIfRunning();
    return this.state;
  }
  getMode(): CountMode {
    return this.mode;
  }
  getInitialMs(): number {
    return this.initialMs;
  }
  getElapsedMs(): number {
    this.syncIfRunning();
    return this.elapsedMs;
  }
  displayMs(): number {
    this.syncIfRunning();
    return this.strategy.elapsedToDisplay(this.elapsedMs, this.initialMs);
  }

  setMode(mode: CountMode): void {
    if (this.state === 'running') this.sync();
    if (this.state === 'idle' || this.state === 'paused') {
      this.mode = mode;
      this.strategy = strategyFor(mode);
    }
  }

  setStrategy(strategy: CountStrategy, mode: CountMode = this.mode): void {
    if (this.state === 'running') this.sync();
    if (this.state === 'idle' || this.state === 'paused') {
      this.strategy = strategy;
      this.mode = mode;
    }
  }

  setInitialTime(milliseconds: number): boolean {
    if (
      !Number.isFinite(milliseconds) ||
      !Number.isInteger(milliseconds) ||
      milliseconds < 0 ||
      milliseconds > Stopwatch.MAX_MS
    )
      return false;
    if (this.state === 'running') this.sync();
    if (this.state === 'idle' || this.state === 'paused') {
      this.initialMs = Math.min(Stopwatch.MAX_MS, Math.max(0, milliseconds));
      this.elapsedMs = 0;
      this.state = 'idle';
      this.finishedNotified = false;
    }
    return true;
  }

  setInitialMs(milliseconds: number): void {
    this.setInitialTime(milliseconds);
  }

  addTime(milliseconds: number): boolean {
    if (!Number.isFinite(milliseconds) || !Number.isInteger(milliseconds) || milliseconds < 0)
      return false;
    if (this.state === 'running') this.sync();
    const current = this.state === 'finished' ? 0 : this.displayMs();
    const next = Math.min(Stopwatch.MAX_MS, current + milliseconds);
    this.initialMs = next;
    this.elapsedMs = 0;
    this.startedAt = this.state === 'running' ? this.clock.now() : 0;
    if (this.state === 'finished') this.state = 'idle';
    this.finishedNotified = false;
    return true;
  }

  addMinutes(minutes: number): void {
    if (!Number.isFinite(minutes) || !Number.isInteger(minutes) || minutes < 0) return;
    this.addTime(minutes * 60_000);
  }

  clearTime(): void {
    this.state = 'idle';
    this.elapsedMs = 0;
    this.initialMs = 0;
    this.startedAt = 0;
    this.finishedNotified = false;
  }

  start(): void {
    if (this.state === 'finished') return;
    if (this.state === 'idle' || this.state === 'paused') {
      this.startedAt = this.clock.now();
      this.state = 'running';
    }
  }

  pause(): void {
    if (this.state === 'running') {
      this.sync();
      if (this.state === 'running') this.state = 'paused';
    }
  }

  reset(): void {
    this.clearTime();
  }

  subscribe(observer: Observer<void>): () => void {
    this.observers.add(observer);
    return () => this.observers.delete(observer);
  }

  onFinished(observer: Observer<void>): () => void {
    return this.subscribe(observer);
  }

  restore(snapshot: TimerSnapshot): void {
    this.elapsedMs = Math.max(0, snapshot.elapsedMs);
    this.initialMs = Math.max(0, snapshot.initialMs);
    this.mode = snapshot.countMode;
    this.strategy = strategyFor(this.mode);
    this.state = snapshot.state;
    this.startedAt = this.state === 'running' ? this.clock.now() : 0;
    this.finishedNotified = this.state === 'finished';
  }

  tick(): void {
    if (this.state === 'running') this.sync();
  }

  snapshot(): TimerSnapshot {
    this.tick();
    return {
      elapsedMs: this.elapsedMs,
      initialMs: this.initialMs,
      state: this.state,
      countMode: this.mode,
    };
  }

  private syncIfRunning(): void {
    if (this.state === 'running') this.sync();
  }

  private sync(): void {
    const now = this.clock.now();
    this.elapsedMs += Math.max(0, now - this.startedAt);
    this.startedAt = now;
    if (this.strategy.isFinished(this.elapsedMs, this.initialMs)) {
      this.state = 'finished';
      if (!this.finishedNotified) {
        this.finishedNotified = true;
        for (const observer of this.observers) {
          try {
            observer.update(undefined);
          } catch {
            // An observer is isolated so one faulty subscriber cannot stop the timer.
          }
        }
      }
    }
  }
}
