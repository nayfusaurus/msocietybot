/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable no-undef */
const { SnakeNamingStrategy } = require('typeorm-naming-strategies');

module.exports = {
  type: process.env.TYPEORM_TYPE || 'postgres',
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  username: process.env.POSTGRES_USERNAME,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DATABASE,
  synchronize: false,
  logging: false,
  namingStrategy: new SnakeNamingStrategy(),
  entities: ['src/entity/**/*.ts'],
  migrations: [process.env.TYPEORM_MIGRATIONS || 'src/migration/**/*.ts'],
  subscribers: ['src/subscriber/**/*.ts'],
  cli: {
    entitiesDir: 'src/entity',
    migrationsDir: process.env.TYPEORM_MIGRATION_DIR || 'src/migration',
    subscribersDir: 'src/subscriber',
  },
};
