// @vitest-environment happy-dom
import { App } from '../src/ui/App';
import { Stopwatch } from '../src/domain/Stopwatch';
import { FakeClock } from '../src/infra/FakeClock';
import type {
  PersistenceRepository,
  ThemeRepository,
  Ticker,
  TimerSnapshot,
} from '../src/abstractions/ports';

class TestTicker implements Ticker {
  callback: (() => void) | null = null;
  start(callback: () => void): void {
    this.callback = callback;
  }
  stop(): void {
    this.callback = null;
  }
}

class TestRepository implements PersistenceRepository<TimerSnapshot> {
  value: TimerSnapshot | null = null;
  load(): TimerSnapshot | null {
    return this.value;
  }
  save(value: TimerSnapshot): void {
    this.value = value;
  }
  clear(): void {
    this.value = null;
  }
}

class TestTheme implements ThemeRepository {
  theme: 'dark' | 'light' = 'light';
  load(): 'dark' | 'light' {
    return this.theme;
  }
  save(theme: 'dark' | 'light'): void {
    this.theme = theme;
  }
  clear(): void {
    this.theme = 'light';
  }
}

describe('App', () => {
  const displayValue = (root: HTMLElement): string =>
    Array.from(root.querySelectorAll<HTMLButtonElement>('[data-digit]'))
      .map((digit) => digit.textContent)
      .join('');

  it('renderiza HH:MM:SS, interage e bloqueia comandos modificados', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const timer = new Stopwatch(new FakeClock());
    const ticker = new TestTicker();
    new App(root, timer, ticker, new TestRepository(), new TestTheme()).mount();
    expect(displayValue(root)).toBe('000000');
    const minuteUnit = root.querySelector('[data-digit="3"]') as HTMLButtonElement;
    minuteUnit.focus();
    minuteUnit.dispatchEvent(new KeyboardEvent('keydown', { key: '5', bubbles: true }));
    expect(displayValue(root)).toBe('000500');
    (root.querySelector('#main') as HTMLButtonElement).click();
    expect((root.querySelector('[data-digit="0"]') as HTMLButtonElement).disabled).toBe(true);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '5', ctrlKey: true }));
    expect(displayValue(root)).toBe('000500');
    (root.querySelector('#main') as HTMLButtonElement).click();
    expect((root.querySelector('[data-digit="0"]') as HTMLButtonElement).disabled).toBe(false);
  });

  it('preserva controles de zerar, atalhos e tema acessíveis', () => {
    const root = document.createElement('div');
    document.body.append(root);
    const timer = new Stopwatch(new FakeClock());
    const theme = new TestTheme();
    new App(root, timer, new TestTicker(), new TestRepository(), theme).mount();

    const hourUnit = root.querySelector('[data-digit="1"]') as HTMLButtonElement;
    hourUnit.dispatchEvent(new KeyboardEvent('keydown', { key: '1', bubbles: true }));
    (root.querySelector('#reset') as HTMLButtonElement).click();
    expect(displayValue(root)).toBe('000000');

    expect(root.querySelector('#shortcuts-dialog')).not.toBeNull();
    const themeButton = root.querySelector('#theme') as HTMLButtonElement;
    themeButton.click();
    expect(theme.load()).toBe('dark');
    expect(themeButton.getAttribute('aria-label')).toBe('Ativar tema claro');
  });

  it('edita dígitos individualmente e rejeita minutos inválidos', () => {
    const root = document.createElement('div');
    document.body.append(root);
    new App(
      root,
      new Stopwatch(new FakeClock()),
      new TestTicker(),
      new TestRepository(),
      new TestTheme(),
    ).mount();

    const minuteTens = root.querySelector('[data-digit="2"]') as HTMLButtonElement;
    minuteTens.focus();
    minuteTens.dispatchEvent(new KeyboardEvent('keydown', { key: '6', bubbles: true }));
    expect(displayValue(root)).toBe('000000');
    expect(minuteTens.classList.contains('selected')).toBe(true);

    minuteTens.dispatchEvent(new KeyboardEvent('keydown', { key: '5', bubbles: true }));
    expect(displayValue(root)).toBe('005000');
    expect(
      (root.querySelector('[data-digit="3"]') as HTMLButtonElement).classList.contains('selected'),
    ).toBe(true);
  });
});
