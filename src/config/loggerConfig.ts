import winston, { createLogger, format, transports } from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import env from "./envConfig";

const logTransports: winston.transport[] = [];

if(env.log_transport === 'CONSOLE'){
  logTransports.push(new transports.Console());
}
else {
  logTransports.push(new DailyRotateFile({
    dirname: './logs',
    filename: 'legal_form_service-%DATE%.log',
    utc: true,
    maxSize: '50m',
    maxFiles: '30d'
  }));
}

const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.printf(({ timestamp, level, message, stack }) => {
      return `[${timestamp}] ${level.toUpperCase()}: ${stack || JSON.stringify(message)}`;
    })
  ),
  transports: logTransports
});
export default logger;