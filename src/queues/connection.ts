import { config } from '@notifications/config';
import { winstonLogger } from '@txxasif/shared';
import client, { Channel, Connection } from 'amqplib';
import { Logger } from 'winston';
/**
 * Establishes a connection to RabbitMQ and sets up a channel for messaging.
 *
 * This module provides functionality to connect to a RabbitMQ message broker
 * and create a channel for sending and receiving messages. It also handles
 * graceful shutdown of the connection and channel when the process receives
 * the SIGINT signal (e.g., when the user interrupts the process with Ctrl+C).
 *
 * The `createConnection` function attempts to:
 * - Connect to RabbitMQ using the endpoint specified in the configuration.
 * - Create a new channel on the established connection.
 * - Log a success message if the connection and channel creation are successful.
 * - Return the created channel or `undefined` if an error occurs during the process.
 *
 * The `closeConnection` function sets up a listener for the SIGINT signal to:
 * - Close the channel and the connection gracefully when the process is interrupted.
 *
 * @returns {Promise<Channel | undefined>} A promise that resolves to the created
 * channel if successful, or `undefined` if an error occurs.
 */

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'notificationQueueConnection', 'debug');

async function createConnection(): Promise<Channel | undefined> {
  try {
    const connection: Connection = await client.connect(`${config.RABBITMQ_ENDPOINT}`);
    const channel: Channel = await connection.createChannel();
    log.info('Notification server connected to queue successfully...');
    closeConnection(channel, connection);
    return channel;
  } catch (error) {
    log.log('error', 'NotificationService error createConnection() method:', error);
    return undefined;
  }
}

function closeConnection(channel: Channel, connection: Connection): void {
  process.once('SIGINT', async () => {
    await channel.close();
    await connection.close();
  });
}

export { createConnection };
