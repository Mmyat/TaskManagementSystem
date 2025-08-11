import winston from 'winston';
import 'winston-daily-rotate-file'; // Import to register the transport
import path from 'path';

const TIMESTAMP_FORMAT = 'YYYY-MM-DD HH:mm:ss.SSS';

// --- Configure Winston Logger ---
const logDir = './logs'; // Directory to store log files

const fileLogFormat = winston.format.combine(
  winston.format.timestamp({ format: TIMESTAMP_FORMAT }), // Add timestamp
  //winston.format.json() // Output as JSON
  winston.format.printf((info) => {
    const { timestamp, level, message, ...rest } = info; // Destructure to get relevant fields
    const logEntry = {
      timestamp, // Put timestamp first
      level,
      message,
      ...rest, // Include any other properties (e.g., stack, customProps)
    };
    return JSON.stringify(logEntry);
  })
);

const fileTransport = new winston.transports.DailyRotateFile({
  filename: path.join(logDir, 'application-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true, // Compress old logs
  maxSize: '20m', // Max size of a log file
  maxFiles: '14d', // Retain logs for 14 days
  level: 'info', // Log level for file
  format: fileLogFormat,
});

const consoleTransport = new winston.transports.Console({
  level: 'debug', // Log level for console
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: TIMESTAMP_FORMAT }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}` +
                (info.stack ? `\n${info.stack}` : '') // Include stack trace for errors
    )
  ),
});

export const logger = winston.createLogger({
  format: winston.format.json(), // Default format for file (JSON for easy parsing)
  transports: [
    consoleTransport,
    fileTransport,
  ],
  exceptionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
  rejectionHandlers: [
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});