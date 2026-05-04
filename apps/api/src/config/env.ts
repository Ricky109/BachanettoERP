// Valida que las variables críticas existan al arrancar.
// Si falta alguna, el servidor no levanta.
const required = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Variable de entorno faltante: ${key}`);
  return value;
};

export const env = {
  NODE_ENV:       process.env.NODE_ENV ?? 'development',
  PORT:           parseInt(process.env.PORT ?? '3000', 10),
  DATABASE_URL:   required('DATABASE_URL'),
  JWT_SECRET:     required('JWT_SECRET'),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '8h',
  isDev:          process.env.NODE_ENV !== 'production',
};