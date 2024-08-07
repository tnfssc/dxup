import { atom } from 'nanostores';

export interface Log {
  timestamp: number;
  message: string;
  name: string;
  level: 'info' | 'error';
}

class LogsStore {
  public readonly $logs = atom<Log[]>([]);
  private debounceTime = 1_000;
  private maxLogs = 1000;
  private debounceTimer: number | null = null;
  private constructor() {
    this.debounceTimer = null;
  }
  private static instance: LogsStore | null = null;
  static getInstance() {
    if (!LogsStore.instance) {
      LogsStore.instance = new LogsStore();
    }
    return LogsStore.instance;
  }
  private logs: Log[] = [];
  public addLog(name: string, log: string, level: 'info' | 'error' = 'info', timestamp = Date.now()) {
    this.logs.push({ message: log, level, timestamp, name });
    this.logs = this.logs.slice(-this.maxLogs);
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      this.$logs.set([...this.logs]);
    }, this.debounceTime);
  }
  public getLogs() {
    return this.logs;
  }
  public clearLogs() {
    this.logs = [];
    this.$logs.set([...this.logs]);
  }
  public setDebounceTime(time: number) {
    this.debounceTime = time;
  }
  public setMaxLogs(maxLogs: number) {
    this.maxLogs = maxLogs;
    this.logs = this.logs.slice(-this.maxLogs);
    this.$logs.set([...this.logs]);
  }
}

const logsStore = LogsStore.getInstance();

export default logsStore;
