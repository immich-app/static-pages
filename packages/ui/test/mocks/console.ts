const benignBrowserErrors = ['ResizeObserver loop completed with undelivered notifications'];

const isBenign = (message: string) => benignBrowserErrors.some((benign) => message.includes(benign));

const format = (args: unknown[]) =>
  args.map((arg) => (arg instanceof Error ? (arg.stack ?? arg.message) : String(arg))).join(' ');

export class MockConsole {
  readonly errors: string[] = [];
  private restore?: () => void;

  private readonly onWindowError = (event: ErrorEvent) => {
    this.record(`[pageerror] ${event.error?.stack ?? event.message}`);
  };

  setup() {
    const original = console.error;
    console.error = (...args: unknown[]) => this.record(`[console.error] ${format(args)}`);
    addEventListener('error', this.onWindowError);
    this.restore = () => {
      console.error = original;
      removeEventListener('error', this.onWindowError);
    };
  }

  teardown() {
    this.restore?.();
    this.restore = undefined;
  }

  private record(message: string) {
    if (!isBenign(message)) {
      this.errors.push(message);
    }
  }
}
