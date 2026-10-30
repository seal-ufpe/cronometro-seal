import { Stopwatch } from './domain/Stopwatch';
import { SystemClock, RafTicker } from './infra/Browser';
import { isTimerSnapshot, LocalStorageRepository } from './infra/Repositories';
import { ThemeStorageRepository } from './infra/Repositories';
import type { TimerSnapshot } from './abstractions/ports';
import { App } from './ui/App';
import './styles/main.css';
import './styles/tokens.css';
import './styles/base.css';

const timer = new Stopwatch(new SystemClock());
const storage = window.localStorage;
const repository = new LocalStorageRepository<TimerSnapshot>(
  'seal-timer',
  storage,
  isTimerSnapshot,
);
new App(
  document.querySelector('#app') as HTMLElement,
  timer,
  new RafTicker(),
  repository,
  new ThemeStorageRepository('seal-theme', storage),
).mount();
