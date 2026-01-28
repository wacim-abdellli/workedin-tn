/**
 * Development-only logger utility
 *
 * This logger provides console-like logging that only outputs in development mode.
 * Error logging is always enabled for production error tracking.
 */

type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'info';

interface LoggerConfig {
    enabled: boolean;
    prefix?: string;
}

const config: LoggerConfig = {
    enabled: import.meta.env.DEV,
    prefix: '[Khedma]',
};

/**
 * Formats a log message with timestamp and optional prefix
 */
const formatMessage = (level: LogLevel, message: string): string => {
    const timestamp = new Date().toLocaleTimeString();
    return `${config.prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`;
};

/**
 * Logger object with methods for different log levels
 *
 * - log, warn, info, debug: Only execute in development mode
 * - error: Always executes (needed for error tracking services like Sentry)
 */
export const logger = {
    /**
     * Log general information (dev only)
     */
    log: (message: string, ...args: unknown[]): void => {
        if (config.enabled) {
            console.log(formatMessage('log', message), ...args);
        }
    },

    /**
     * Log warnings (dev only)
     */
    warn: (message: string, ...args: unknown[]): void => {
        if (config.enabled) {
            console.warn(formatMessage('warn', message), ...args);
        }
    },

    /**
     * Log errors (always enabled for production error tracking)
     */
    error: (message: string, ...args: unknown[]): void => {
        console.error(formatMessage('error', message), ...args);
    },

    /**
     * Log debug information (dev only)
     */
    debug: (message: string, ...args: unknown[]): void => {
        if (config.enabled) {
            console.debug(formatMessage('debug', message), ...args);
        }
    },

    /**
     * Log informational messages (dev only)
     */
    info: (message: string, ...args: unknown[]): void => {
        if (config.enabled) {
            console.info(formatMessage('info', message), ...args);
        }
    },

    /**
     * Log a group of related messages (dev only)
     */
    group: (label: string): void => {
        if (config.enabled) {
            console.group(formatMessage('log', label));
        }
    },

    /**
     * End a log group (dev only)
     */
    groupEnd: (): void => {
        if (config.enabled) {
            console.groupEnd();
        }
    },

    /**
     * Log a table of data (dev only)
     */
    table: (data: unknown): void => {
        if (config.enabled) {
            console.table(data);
        }
    },
};

export default logger;
