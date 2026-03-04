export function getEnv(name: string) {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing ${name}. Set ${name} in .env.local`);
  }

  return value;
}

export function hasEnv(name: string) {
  const value = process.env[name];
  return Boolean(value && value.trim() !== "");
}

export function getEnvPresence(name: string): "present" | "missing" {
  return hasEnv(name) ? "present" : "missing";
}

export const requireServerEnv = getEnv;
