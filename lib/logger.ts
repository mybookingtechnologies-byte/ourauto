import pino from "pino";

type LogMeta = Record<string, unknown>;

const base = pino({
  level: process.env.LOG_LEVEL || "info",
  base: {
    service: "ourauto",
    env: process.env.NODE_ENV || "development",
    region: process.env.VERCEL_REGION || process.env.APP_REGION || "unknown",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const logger = {
  info: (message: string, meta?: LogMeta): void => {
    base.info(meta || {}, message);
  },
  warn: (message: string, meta?: LogMeta): void => {
    base.warn(meta || {}, message);
  },
  error: (message: string, meta?: LogMeta): void => {
    base.error(meta || {}, message);
  },
};
