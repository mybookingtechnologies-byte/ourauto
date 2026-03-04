import pino from "pino";

type LogMeta = Record<string, unknown>;

const base = pino({
  level: process.env.NODE_ENV === "production" ? "info" : "debug",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            singleLine: true,
          },
        }
      : undefined,
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
  child: (meta: LogMeta) => base.child(meta),
};
