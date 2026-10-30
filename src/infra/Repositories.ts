import type { PersistenceRepository, TimerSnapshot } from '../abstractions/ports';

export const isTimerSnapshot = (value: unknown): value is TimerSnapshot => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.elapsedMs === 'number' &&
    typeof candidate.initialMs === 'number' &&
    ['idle', 'running', 'paused', 'finished'].includes(String(candidate.state)) &&
    (candidate.countMode === 'up' || candidate.countMode === 'down')
  );
};

export class InMemoryRepository<T> implements PersistenceRepository<T> {
  private value: T | null = null;
  load(): T | null {
    return this.value;
  }
  save(value: T): void {
    this.value = value;
  }
  clear(): void {
    this.value = null;
  }
}

export class LocalStorageRepository<T> implements PersistenceRepository<T> {
  constructor(
    private readonly key: string,
    private readonly storage: Storage = localStorage,
    private readonly isValid: (value: unknown) => value is T = (value): value is T =>
      value !== null,
  ) {}
  load(): T | null {
    try {
      const raw = this.storage.getItem(this.key);
      if (!raw) return null;
      const value: unknown = JSON.parse(raw);
      return this.isValid(value) ? value : null;
    } catch {
      return null;
    }
  }
  save(value: T): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(value));
    } catch {
      // Persistence is optional; the in-memory timer remains usable.
    }
  }
  clear(): void {
    try {
      this.storage.removeItem(this.key);
    } catch {
      // Ignore unavailable storage.
    }
  }
}

export class ThemeStorageRepository {
  constructor(
    private readonly key: string,
    private readonly storage: Storage = localStorage,
  ) {}
  load(): 'dark' | 'light' {
    try {
      const saved = this.storage.getItem(this.key);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // Use the default theme when storage is unavailable.
    }
    return 'light';
  }
  save(theme: 'dark' | 'light'): void {
    try {
      this.storage.setItem(this.key, theme);
    } catch {
      // Theme persistence is best effort.
    }
  }
  clear(): void {
    try {
      this.storage.removeItem(this.key);
    } catch {
      // Ignore unavailable storage.
    }
  }
}

export type SavedTimer = TimerSnapshot;
