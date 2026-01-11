import { Sequelize } from 'sequelize';
import env from './env';
import logger from '../utils/logger';

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER!, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: parseInt(env.DB_PORT, 10),
  dialect: 'postgres',
  logging: (msg) => logger.debug(msg),
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

export default sequelize;
