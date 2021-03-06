import { config as dotenv } from 'dotenv';
dotenv();
import 'reflect-metadata';
import { createApp, createConnection } from './app';
import { Bots } from './bots';

createConnection()
  .then(connection => createApp(connection, Object.values(Bots)))
  .then(app => app.launch())
  .catch(error => console.error(error));
