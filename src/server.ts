import 'express-async-errors';
import http from 'http';

import { IEmailMessageDetails, winstonLogger } from '@txxasif/shared';
import { Logger } from 'winston';
import { config } from '@notifications/config';
import { Application } from 'express';
import { healthRoutes } from '@notifications/routes';
import { checkConnection } from '@notifications/elasticsearch';
import { Channel } from 'amqplib';
import { createConnection } from '@notifications/queues/connection';
import { consumeAuthEmailMessages, consumeOrderEmailMessages } from '@notifications/queues/email.consumer';
// import { healthRoutes } from '@notifications/routes';
// import { checkConnection } from '@notifications/elasticsearch';
// import { consumeAuthEmailMessages, consumeOrderEmailMessages } from '@notifications/queues/email.consumer';

const SERVER_PORT = 4001;
const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationServer', 'debug');

export function start(app: Application): void {
  startServer(app);
  app.use('', healthRoutes());
  startQueues();
  startElasticSearch();
  checkConnection();
}

async function startQueues(): Promise<void> {
  const emailChannel: Channel = (await createConnection()) as Channel;

  await consumeAuthEmailMessages(emailChannel);
  await consumeOrderEmailMessages(emailChannel);
  const verifyLink = 'http://localhost:3000/verify';
  const messageDetails: IEmailMessageDetails = {
    receiverEmail: `${config.SENDER_EMAIL}`,
    verifyLink: verifyLink,
    template: 'verifyEmail'
  };
  await emailChannel.assertExchange('jobber-email-notification', 'direct');
  const message = JSON.stringify(messageDetails);
  emailChannel.publish('jobber-email-notification', 'auth-email', Buffer.from(message));

  // await emailChannel.assertExchange('jobber-order-notification', 'direct');
  // const message1 = JSON.stringify({ name: 'jobber', service: 'notification service' });
  // emailChannel.publish('jobber-order-notification', 'order-email', Buffer.from(message1));
}
function startElasticSearch(): void {
  //   checkConnection();
}

function startServer(app: Application): void {
  try {
    const httpServer: http.Server = new http.Server(app);
    log.info(`Worker with process id of ${process.pid} on notification server has started`);
    httpServer.listen(SERVER_PORT, () => {
      log.info(`Notification server running on port ${SERVER_PORT}`);
    });
  } catch (error) {
    log.log('error', 'NotificationService startServer() method:', error);
  }
}
