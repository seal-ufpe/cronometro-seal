/** UI adapter: owns pointer lighting and visual timer-state classes only. */
export class GlassEffectController {
  private frame: number | null = null;
  private pendingX = 50;
  private pendingY = 50;

  constructor(
    private readonly card: HTMLElement,
    private readonly motion: Pick<Window, 'requestAnimationFrame' | 'cancelAnimationFrame'>,
    private readonly reducedMotion: boolean,
  ) {}

  mount(): void {
    this.card.style.setProperty('--light-opacity', '0.06');
    if (this.reducedMotion) return;
    this.card.addEventListener('pointermove', this.onPointerMove);
    this.card.addEventListener('pointerleave', this.onPointerLeave);
  }

  setState(state: 'idle' | 'running' | 'paused' | 'finished'): void {
    this.card.dataset.state = state;
  }

  dispose(): void {
    this.card.removeEventListener('pointermove', this.onPointerMove);
    this.card.removeEventListener('pointerleave', this.onPointerLeave);
    if (this.frame !== null) this.motion.cancelAnimationFrame(this.frame);
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return;
    const bounds = this.card.getBoundingClientRect();
    this.pendingX = ((event.clientX - bounds.left) / bounds.width) * 100;
    this.pendingY = ((event.clientY - bounds.top) / bounds.height) * 100;
    this.card.style.setProperty('--light-opacity', '0.14');
    this.schedulePaint();
  };

  private readonly onPointerLeave = (): void => {
    this.pendingX = 50;
    this.pendingY = 50;
    this.card.style.setProperty('--light-opacity', '0.06');
    this.schedulePaint();
  };

  private schedulePaint(): void {
    if (this.frame !== null) return;
    this.frame = this.motion.requestAnimationFrame(() => {
      this.card.style.setProperty('--mx', `${this.pendingX}%`);
      this.card.style.setProperty('--my', `${this.pendingY}%`);
      this.frame = null;
    });
  }
}
