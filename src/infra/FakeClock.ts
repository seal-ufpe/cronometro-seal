import type { Clock } from '../abstractions/ports';

export class FakeClock implements Clock {
  constructor(private current = 0) {}
  now(): number {
    return this.current;
  }
  advance(milliseconds: number): void {
    this.current += milliseconds;
  }
  set(milliseconds: number): void {
    this.current = milliseconds;
  }
}
