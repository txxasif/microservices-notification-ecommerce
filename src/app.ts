import express, { Express } from 'express';
import { winstonLogger } from '@txxasif/shared';
import { Logger } from 'winston';
import { config } from '@notifications/config';
import { start } from '@notifications/server';

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationApp', 'debug');

function initialize(): void {
  const app: Express = express(); // Fix: added assignment operator (=)
  start(app);
  log.info('Notification Service Initialized');
}

initialize();
