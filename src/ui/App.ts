import { formatTime } from '../domain/TimeParser';
import type {
  CountMode,
  PersistenceRepository,
  ThemeRepository,
  Ticker,
  TimerSnapshot,
} from '../abstractions/ports';
import { Stopwatch } from '../domain/Stopwatch';
import { ClockFormatter } from '../domain/TimeFormatter';
import { GlassEffectController } from './GlassEffectController';

export class App {
  constructor(
    private readonly root: HTMLElement,
    private readonly timer: Stopwatch,
    private readonly ticker: Ticker,
    private readonly repository: PersistenceRepository<TimerSnapshot>,
    private readonly themes: ThemeRepository,
  ) {}

  mount(): void {
    this.root.innerHTML = `
      <a class="skip-link" href="#timer-content">Pular para o conteúdo</a>
      <div class="page-frame">
        <div class="orbital orbital-one" aria-hidden="true"></div>
        <div class="orbital orbital-two" aria-hidden="true"></div>
        <div class="orbital orbital-three" aria-hidden="true"></div>
        <article class="card" data-state="idle" aria-labelledby="app-title">
        <header class="header">
          <div class="brand">
            <span class="logo">
              <img src="/assets/seal-logo-white.svg" alt="SEAL" width="64" height="64">
            </span>
            <div><p class="eyebrow">&gt;_ UTILITÁRIO SEAL</p><strong id="app-title">Cronômetro</strong></div>
          </div>
          <nav class="header-actions" aria-label="Opções da aplicação">
            <button id="shortcuts" class="shortcuts-link" type="button">&gt;_ Atalhos</button>
            <button id="theme" class="theme-toggle" type="button" aria-label="Ativar tema escuro">
                <img src="/assets/circle-half-fill.svg" alt="change-theme" width="32" height="32">
            </button>
          </nav>
        </header>
        <main id="timer-content">
          <section aria-labelledby="timer-heading">
            <h1 id="timer-heading" class="sr-only">Temporizador</h1>
            <div id="display" class="display" role="group" aria-label="Editor de tempo">
              <button class="digit" type="button" data-digit="0" aria-label="Hora, dezena">0</button><button class="digit" type="button" data-digit="1" aria-label="Hora, unidade">0</button><span class="separator" aria-hidden="true">:</span><button class="digit" type="button" data-digit="2" aria-label="Minuto, dezena">0</button><button class="digit" type="button" data-digit="3" aria-label="Minuto, unidade">0</button><span class="separator" aria-hidden="true">:</span><button class="digit" type="button" data-digit="4" aria-label="Segundo, dezena">0</button><button class="digit" type="button" data-digit="5" aria-label="Segundo, unidade">0</button>
            </div>
            <p id="status" class="status" aria-live="polite">Decorrido · Pronto para começar</p>
            <div class="actions">
              <button id="main" class="primary" type="button"><span aria-hidden="true">▶</span> Iniciar</button>
              <button id="reset" class="secondary icon-button" type="button" aria-label="Zerar cronômetro" title="Zerar cronômetro"><span aria-hidden="true">↺</span></button>
            </div>
            <div class="mode-pill" role="radiogroup" aria-label="Modo de contagem">
              <button type="button" data-mode="up" role="radio" aria-checked="true">Progressivo</button>
              <button type="button" data-mode="down" role="radio" aria-checked="false">Regressivo</button>
            </div>
          </section>
        </main>
        <footer>© 2026 SEAL · CIn-UFPE</footer>
        </article>
      </div>
      <dialog id="shortcuts-dialog" aria-labelledby="shortcuts-title"><form method="dialog"><button class="dialog-close" aria-label="Fechar atalhos">×</button><h2 id="shortcuts-title">&gt;ATALHOS</h2><p>Espaço iniciar/pausar · R zerar · T focar tempo · 1, 5 e 0 adicionar minutos.</p></form></dialog>`;

    const $ = <T extends HTMLElement>(id: string): T => {
      const element = this.root.querySelector<T>(`#${id}`);
      if (!element) throw new Error(`Elemento ausente: ${id}`);
      return element;
    };
    const display = $('display');
    const status = $('status');
    const main = $('main') as HTMLButtonElement;
    const digits = Array.from(display.querySelectorAll<HTMLButtonElement>('[data-digit]'));
    let selectedDigit = 0;
    const save = (): void => this.repository.save(this.timer.snapshot());
    const formatter = new ClockFormatter();
    const card = this.root.querySelector<HTMLElement>('.card');
    if (!card) throw new Error('Card ausente');
    const glass = new GlassEffectController(
      card,
      window,
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    glass.mount();

    let lastDisplay = '';
    let lastStatus = '';
    let lastState = '';
    const render = (): void => {
      const state = this.timer.getState();
      const formattedDisplay = formatTime(
        this.timer.displayMs(),
        this.timer.getMode() === 'down' ? 'ceil' : 'floor',
      );
      const formattedStatus =
        state === 'finished'
          ? 'merge concluído'
          : state === 'running'
            ? this.timer.getMode() === 'down'
              ? 'Restante · Rodando'
              : 'Decorrido · Rodando'
            : state === 'paused'
              ? this.timer.getMode() === 'down'
                ? 'Restante · Pausado'
                : 'Decorrido · Pausado'
              : this.timer.getMode() === 'down'
                ? 'Restante · Pronto para começar'
                : 'Decorrido · Pronto para começar';
      if (formattedDisplay !== lastDisplay) {
        const numeric = formattedDisplay.replaceAll(':', '');
        digits.forEach((digit, index) => {
          digit.textContent = numeric[index] ?? '0';
          digit.disabled = state === 'running' || state === 'finished';
        });
        display.setAttribute(
          'aria-label',
          `${formatter.accessibleLabel(
            this.timer.displayMs(),
            this.timer.getMode() === 'down' ? 'remaining' : 'elapsed',
          )}. Use as setas ou números para editar quando parado.`,
        );
        lastDisplay = formattedDisplay;
      }
      if (formattedStatus !== lastStatus) {
        status.textContent = formattedStatus;
        lastStatus = formattedStatus;
      }
      main.textContent = state === 'running' ? 'Pausar' : 'Iniciar';
      main.disabled = false;
      display.classList.toggle('finished', state === 'finished');
      display.setAttribute('aria-live', state === 'finished' ? 'assertive' : 'off');
      glass.setState(state);
      if (state !== lastState) {
        digits.forEach((digit) => {
          digit.disabled = state === 'running' || state === 'finished';
        });
        this.root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
          button.disabled = state === 'running';
        });
        lastState = state;
      }
      this.root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) => {
        const selected = button.dataset.mode === this.timer.getMode();
        button.setAttribute('aria-checked', String(selected));
      });
    };
    const selectDigit = (index: number): void => {
      selectedDigit = Math.max(0, Math.min(digits.length - 1, index));
      digits.forEach((digit, digitIndex) => {
        digit.classList.toggle('selected', digitIndex === selectedDigit);
        digit.setAttribute('aria-selected', String(digitIndex === selectedDigit));
      });
      digits[selectedDigit]?.focus();
    };
    const editDigit = (value: number): void => {
      if (this.timer.getState() === 'running' || this.timer.getState() === 'finished') return;
      const current = formatTime(this.timer.displayMs(), 'floor').replaceAll(':', '').split('');
      current[selectedDigit] = String(value);
      const hours = Number(`${current[0]}${current[1]}`);
      const minutes = Number(`${current[2]}${current[3]}`);
      const seconds = Number(`${current[4]}${current[5]}`);
      if (minutes > 59 || seconds > 59) return;
      this.timer.setInitialTime((hours * 3600 + minutes * 60 + seconds) * 1000);
      save();
      render();
      selectDigit(Math.min(selectedDigit + 1, digits.length - 1));
    };

    const saved = this.repository.load();
    if (saved) this.timer.restore(saved);
    const unsubscribe = this.timer.subscribe({
      update: () => {
        save();
        render();
      },
    });
    this.ticker.start(() => {
      this.timer.tick();
      render();
      save();
    });

    $('theme').addEventListener('click', () => {
      const next = this.themes.load() === 'dark' ? 'light' : 'dark';
      this.themes.save(next);
      document.documentElement.dataset.theme = next;
      $('theme').setAttribute(
        'aria-label',
        next === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro',
      );
    });
    const shortcutsDialog = $('shortcuts-dialog') as HTMLDialogElement;
    $('shortcuts').addEventListener('click', () => shortcutsDialog.showModal());
    this.root.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach((button) =>
      button.addEventListener('click', () => {
        this.timer.setMode(button.dataset.mode as CountMode);
        save();
        render();
      }),
    );
    main.addEventListener('click', () => {
      if (this.timer.getState() === 'running') this.timer.pause();
      else this.timer.start();
      save();
      render();
    });
    const reset = (): void => {
      this.timer.clearTime();
      save();
      render();
    };
    $('reset').addEventListener('click', reset);
    digits.forEach((digit, index) => {
      digit.addEventListener('click', () => selectDigit(index));
      digit.addEventListener('focus', () => {
        selectedDigit = index;
        digits.forEach((item, itemIndex) => {
          item.classList.toggle('selected', itemIndex === selectedDigit);
          item.setAttribute('aria-selected', String(itemIndex === selectedDigit));
        });
      });
      digit.addEventListener('keydown', (event) => {
        if (/^[0-9]$/.test(event.key)) {
          event.preventDefault();
          editDigit(Number(event.key));
        } else if (event.key === 'ArrowLeft') {
          event.preventDefault();
          selectDigit(index - 1);
        } else if (event.key === 'ArrowRight' || event.key === 'Tab') {
          event.preventDefault();
          selectDigit(event.key === 'Tab' && event.shiftKey ? index - 1 : index + 1);
        } else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          selectDigit(index);
        }
      });
    });
    selectDigit(0);
    document.addEventListener('keydown', (event) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLButtonElement && event.target.classList.contains('digit'))
      ) {
        return;
      }
      const key = event.key.toLowerCase();
      if (event.key === ' ') {
        event.preventDefault();
        main.click();
      } else if (key === 'r') {
        reset();
      }
    });
    void unsubscribe;
    const savedTheme = this.themes.load();
    document.documentElement.dataset.theme = savedTheme;
    $('theme').setAttribute(
      'aria-label',
      savedTheme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro',
    );
    render();
  }
}
