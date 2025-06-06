import React, { useEffect, useState } from 'react';
import styles from './DebugPanel.module.css';

interface LogEntry {
    timestamp: string;
    message: string;
    type: 'info' | 'error' | 'success';
}

const DebugPanel: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Override console methods
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
        };

        const addLog = (message: any, type: 'info' | 'error' | 'success' = 'info') => {
            const timestamp = new Date().toISOString();
            setLogs(prev => [...prev, { timestamp, message: String(message), type }].slice(-50));
        };

        console.log = (...args) => {
            originalConsole.log(...args);
            addLog(args.join(' '));
        };

        console.error = (...args) => {
            originalConsole.error(...args);
            addLog(args.join(' '), 'error');
        };

        console.warn = (...args) => {
            originalConsole.warn(...args);
            addLog(args.join(' '), 'error');
        };

        return () => {
            console.log = originalConsole.log;
            console.error = originalConsole.error;
            console.warn = originalConsole.warn;
        };
    }, []);

    return (
        <div className={styles.debugContainer}>
            <button 
                className={styles.toggleButton}
                onClick={() => setIsVisible(!isVisible)}
            >
                {isVisible ? 'Hide Debug' : 'Show Debug'}
            </button>
            
            {isVisible && (
                <div className={styles.panel}>
                    <div className={styles.logs}>
                        {logs.map((log, index) => (
                            <div 
                                key={index} 
                                className={`${styles.logEntry} ${styles[log.type]}`}
                            >
                                <span className={styles.timestamp}>{log.timestamp}</span>
                                <span className={styles.message}>{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DebugPanel; 