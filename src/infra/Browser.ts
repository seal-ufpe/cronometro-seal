import type { Clock, Ticker } from '../abstractions/ports';

export class SystemClock implements Clock {
  now(): number {
    return performance.now();
  }
}

export class RafTicker implements Ticker {
  private id: number | null = null;
  start(callback: () => void): void {
    this.stop();
    const loop = (): void => {
      callback();
      this.id = requestAnimationFrame(loop);
    };
    this.id = requestAnimationFrame(loop);
  }
  stop(): void {
    if (this.id !== null) cancelAnimationFrame(this.id);
    this.id = null;
  }
}

export class IntervalTicker implements Ticker {
  private id: number | null = null;
  start(callback: () => void): void {
    this.stop();
    this.id = window.setInterval(callback, 100);
  }
  stop(): void {
    if (this.id !== null) window.clearInterval(this.id);
    this.id = null;
  }
}
