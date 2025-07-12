// Console capture utility to store logs from startup
// This captures all console messages and stores them for later viewing

interface LogEntry {
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[];
  stack?: string;
}

class ConsoleCapture {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    info: typeof console.info;
    debug: typeof console.debug;
  };

  constructor() {
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      info: console.info.bind(console),
      debug: console.debug.bind(console),
    };

    this.interceptConsole();
  }

  private interceptConsole() {
    // Intercept console.log
    console.log = (...args: any[]) => {
      this.addLog('log', args);
      this.originalConsole.log(...args);
    };

    // Intercept console.warn
    console.warn = (...args: any[]) => {
      this.addLog('warn', args);
      this.originalConsole.warn(...args);
    };

    // Intercept console.error
    console.error = (...args: any[]) => {
      this.addLog('error', args, new Error().stack);
      this.originalConsole.error(...args);
    };

    // Intercept console.info
    console.info = (...args: any[]) => {
      this.addLog('info', args);
      this.originalConsole.info(...args);
    };

    // Intercept console.debug
    console.debug = (...args: any[]) => {
      this.addLog('debug', args);
      this.originalConsole.debug(...args);
    };

    // Capture unhandled errors
    // eslint-disable-next-line no-undef
    window.addEventListener('error', (event) => {
      this.addLog('error', [
        `Unhandled Error: ${event.message}`,
        `File: ${event.filename}:${event.lineno}:${event.colno}`,
        event.error?.stack || 'No stack trace'
      ]);
    });

    // Capture unhandled promise rejections
    // eslint-disable-next-line no-undef
    window.addEventListener('unhandledrejection', (event) => {
      this.addLog('error', [
        'Unhandled Promise Rejection:',
        event.reason
      ]);
    });
  }

  private addLog(level: LogEntry['level'], args: any[], stack?: string) {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      args: this.serializeArgs(args),
      stack
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private serializeArgs(args: any[]): any[] {
    return args.map(arg => {
      try {
        // Handle objects, arrays, etc.
        if (typeof arg === 'object' && arg !== null) {
          return JSON.parse(JSON.stringify(arg));
        }
        return arg;
      } catch (error) {
        // If serialization fails, convert to string
        return String(arg);
      }
    });
  }

  public getLogs(): LogEntry[] {
    return [...this.logs]; // Return a copy
  }

  public clearLogs(): void {
    this.logs = [];
  }

  public getLogsAsString(): string {
    return this.logs.map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      const level = log.level.toUpperCase();
      const message = log.args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ');
      
      let result = `[${time}] ${level}: ${message}`;
      if (log.stack && log.level === 'error') {
        result += `\n${log.stack}`;
      }
      return result;
    }).join('\n');
  }

  public downloadLogs(): void {
    const logsText = this.getLogsAsString();
    const blob = new Blob([logsText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // eslint-disable-next-line no-undef
    const a = document.createElement('a');
    a.href = url;
    a.download = `console-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    // eslint-disable-next-line no-undef
    document.body.appendChild(a);
    a.click();
    // eslint-disable-next-line no-undef
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Create global instance
const consoleCapture = new ConsoleCapture();

// Make it available globally
// eslint-disable-next-line no-undef
(window as any).__consoleCapture = consoleCapture;

export default consoleCapture;