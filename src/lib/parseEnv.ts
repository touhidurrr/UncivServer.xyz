export const parseEnv = <T>(name: string, defaultValue: T, parser: (val: string) => T): T => {
  const value = process.env[name];

  if (value === undefined) {
    return defaultValue;
  }

  console.info(`ENV ${name} =`, value);

  try {
    return parser(value);
  } catch (err) {
    console.error(`[ParseEnvError] Failed to parse ${name}:`, err);
    process.exit(1);
  }
};
