import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './SimpleDebugConsole.css';

interface LogEntry {
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  args: any[];
  stack?: string;
}

export const SimpleDebugConsole: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const [consoleInput, setConsoleInput] = useState('');
  const logsEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Get initial logs
    // eslint-disable-next-line no-undef
    const consoleCapture = (window as any).__consoleCapture;
    if (consoleCapture) {
      setLogs(consoleCapture.getLogs());
    }

    // Update logs every second
    const interval = setInterval(() => {
      if (consoleCapture) {
        setLogs(consoleCapture.getLogs());
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const filteredLogs = filter === 'all' 
    ? logs 
    : logs.filter(log => log.level === filter);

  const clearLogs = () => {
    // eslint-disable-next-line no-undef
    const consoleCapture = (window as any).__consoleCapture;
    if (consoleCapture) {
      consoleCapture.clearLogs();
      setLogs([]);
    }
  };

  const downloadLogs = () => {
    // eslint-disable-next-line no-undef
    const consoleCapture = (window as any).__consoleCapture;
    if (consoleCapture) {
      consoleCapture.downloadLogs();
    }
  };

  const executeCommand = (command: string) => {
    if (!command.trim()) return;

    // Add the command to logs as input
    // eslint-disable-next-line no-undef
    const consoleCapture = (window as any).__consoleCapture;
    if (consoleCapture) {
      // Manually add the command as a log entry
      console.log(`> ${command}`);
    }

    try {
      // Execute the command and capture result
      // eslint-disable-next-line no-eval
      const result = eval(command);
      
      // Log the result
      if (result !== undefined) {
        console.log(result);
      }
    } catch (error) {
      console.error(`Error executing command: ${error}`);
    }

    setConsoleInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(consoleInput);
    }
  };

  const formatLogArgs = (args: any[]): string => {
    return args.map(arg => {
      if (typeof arg === 'object' && arg !== null) {
        return JSON.stringify(arg, null, 2);
      }
      return String(arg);
    }).join(' ');
  };

  const getLogLevelColor = (level: string): string => {
    switch (level) {
      case 'error': return '#ff4444';
      case 'warn': return '#ffaa00';
      case 'info': return '#44aaff';
      case 'debug': return '#aa44ff';
      default: return '#333';
    }
  };

  return (
    <div className="simple-debug-console">
      <div className="debug-header">
        <Link to="/" className="back-button">
          <i className="fas fa-arrow-left"></i> Back to App
        </Link>
        <h1>Debug Console</h1>
        <div className="header-controls">
          <button onClick={clearLogs} className="control-btn">
            <i className="fas fa-trash"></i> Clear
          </button>
          <button onClick={downloadLogs} className="control-btn">
            <i className="fas fa-download"></i> Download
          </button>
        </div>
      </div>

      <div className="debug-filters">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Logs ({logs.length})</option>
          <option value="log">Log ({logs.filter(l => l.level === 'log').length})</option>
          <option value="warn">Warnings ({logs.filter(l => l.level === 'warn').length})</option>
          <option value="error">Errors ({logs.filter(l => l.level === 'error').length})</option>
          <option value="info">Info ({logs.filter(l => l.level === 'info').length})</option>
          <option value="debug">Debug ({logs.filter(l => l.level === 'debug').length})</option>
        </select>
        
        <label className="auto-scroll-toggle">
          <input
            type="checkbox"
            checked={autoScroll}
            onChange={(e) => setAutoScroll(e.target.checked)}
          />
          Auto-scroll
        </label>
      </div>

      <div className="debug-logs">
        {filteredLogs.map((log, index) => (
          <div 
            key={index} 
            className={`log-entry log-${log.level}`}
            style={{ borderLeftColor: getLogLevelColor(log.level) }}
          >
            <div className="log-header">
              <span className="log-time">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span className="log-level" style={{ color: getLogLevelColor(log.level) }}>
                {log.level.toUpperCase()}
              </span>
            </div>
            <div className="log-message">
              {formatLogArgs(log.args)}
            </div>
            {log.stack && (
              <details className="log-stack">
                <summary>Stack Trace</summary>
                <pre>{log.stack}</pre>
              </details>
            )}
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>

      {filteredLogs.length === 0 && (
        <div className="no-logs">
          No {filter === 'all' ? '' : filter} logs found.
        </div>
      )}

      <div className="console-input-container">
        <span className="console-prompt">&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={consoleInput}
          onChange={(e) => setConsoleInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type JavaScript command and press Enter..."
          className="console-input"
          autoComplete="off"
          spellCheck={false}
        />
        <button 
          onClick={() => executeCommand(consoleInput)}
          className="execute-btn"
          disabled={!consoleInput.trim()}
        >
          Execute
        </button>
      </div>
    </div>
  );
};