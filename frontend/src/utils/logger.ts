/**
 * Logger Utility for frontend tracing and debugging.
 * Allows filtering of log levels and includes timestamps/context formatting.
 */
export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
} as const;

// Configurable log level based on environment or preferences
const CURRENT_LOG_LEVEL = import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN;

class Logger {
    private static formatMessage(level: string, context: string, message: string): string {
        const timestamp = new Date().toISOString();
        return `[${timestamp}] [${level}] [${context}] ${message}`;
    }

    /**
     * Logs detailed trace information, useful when debugging the state or execution flow.
     */
    static debug(context: string, message: string, ...data: any[]) {
        if (CURRENT_LOG_LEVEL <= LogLevel.DEBUG) {
            console.debug(this.formatMessage('DEBUG', context, message), ...data);
        }
    }

    /**
     * Logs informational messages, such as feature initialization or generic state changes.
     */
    static info(context: string, message: string, ...data: any[]) {
        if (CURRENT_LOG_LEVEL <= LogLevel.INFO) {
            console.info(this.formatMessage('INFO', context, message), ...data);
        }
    }

    /**
     * Logs warnings for unexpected but non-fatal scenarios.
     */
    static warn(context: string, message: string, ...data: any[]) {
        if (CURRENT_LOG_LEVEL <= LogLevel.WARN) {
            console.warn(this.formatMessage('WARN', context, message), ...data);
        }
    }

    /**
     * Logs errors for exceptions or fatal failures. Included stack traces when possible.
     */
    static error(context: string, message: string, ...data: any[]) {
        if (CURRENT_LOG_LEVEL <= LogLevel.ERROR) {
            console.error(this.formatMessage('ERROR', context, message), ...data);
        }
    }
}

export default Logger;
