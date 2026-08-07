export const logger = {
  info(message: string): void {
    console.log(message);
  },

  warn(message: string): void {
    console.warn(message);
  },

  error(message: string, error?: unknown): void {
    const details =
      error instanceof Error ? `${error.name}: ${error.message}` : String(error ?? "");
    console.error(details ? `${message} - ${details}` : message);
  },
};

const formatElapsed = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");
};

export class ProgressTracker {
  private readonly startedAt = Date.now();
  private totalPages = 0;
  private currentPage = 0;
  private totalJobs = 0;
  private completedJobs = 0;
  private lastPrintedAt = 0;

  setPages(current: number, total: number): void {
    this.currentPage = current;
    this.totalPages = total;
    this.print(true);
  }

  setTotalJobs(total: number): void {
    this.totalJobs = total;
  }

  incrementCompletedJobs(): void {
    this.completedJobs += 1;
    this.print();
  }

  private print(force = false): void {
    const now = Date.now();
    if (!force && now - this.lastPrintedAt < 1_000) return;
    this.lastPrintedAt = now;

    const elapsedMs = now - this.startedAt;
    const jobsPerSecond = elapsedMs > 0 ? this.completedJobs / (elapsedMs / 1000) : 0;

    logger.info(
      `Pages ${this.currentPage}/${this.totalPages} | ` +
        `Jobs ${this.completedJobs}/${this.totalJobs} | ` +
        `Elapsed ${formatElapsed(elapsedMs)} | ` +
        `Jobs/sec ${jobsPerSecond.toFixed(1)}`,
    );
  }

  printFinal(): void {
    this.print(true);
  }
}
