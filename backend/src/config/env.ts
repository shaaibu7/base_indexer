import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.string().default('3000'),
  DB_HOST: z.string().default('localhost'),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  DB_NAME: z.string().default('indexa_db'),
  DB_PORT: z.string().default('5432'),
  INFURA_URL: z.string().url().optional(),
  OPEN_AI_KEY: z.string().optional(),
});

const env = envSchema.parse(process.env);

export default env;
