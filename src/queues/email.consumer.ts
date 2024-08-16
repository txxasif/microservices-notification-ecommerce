import { config } from '@notifications/config';
import { IEmailLocals, winstonLogger } from '@txxasif/shared';
import { Channel, ConsumeMessage } from 'amqplib';
import { Logger } from 'winston';
import { createConnection } from '@notifications/queues/connection';
import { sendEmail } from '@notifications/queues/mail.transport';

/**
 * Consumes messages from the 'auth-email-queue' in RabbitMQ.
 *
 * @param {Channel} channel - The RabbitMQ channel to use for consuming messages.
 *
 * This function:
 * 1. **Checks Channel**: If no channel is provided, it creates a new connection and assigns it to `channel`.
 * 2. **Sets Up Exchange and Queue**:
 *    - **Exchange**: Ensures the 'jobber-email-notification' exchange exists and is of type 'direct'.
 *    - **Queue**: Ensures the 'auth-email-queue' exists with durability and no auto-delete.
 *    - **Bind**: Links the queue to the exchange with the routing key 'auth-email'.
 * 3. **Consumes Messages**:
 *    - **Message Handling**: When a message is received, it is logged after parsing from JSON format.
 *    - **TODO**: Prepare to send emails by parsing message content, constructing email details, and acknowledging the message.
 *
 * Errors during setup or message handling are logged for troubleshooting.
 */

const log: Logger = winstonLogger(`${config.ELASTIC_SEARCH_URL}`, 'emailConsumer', 'debug');
async function consumeAuthEmailMessages(channel: Channel): Promise<void> {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'jobber-email-notification';
    const routingKey = 'auth-email';
    const queueName = 'auth-email-queue';

    // Assert the exchange exists
    await channel.assertExchange(exchangeName, 'direct');

    // Assert the queue exists with durability and no auto-delete
    const jobberQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });

    // Bind the queue to the exchange with the specified routing key
    await channel.bindQueue(jobberQueue.queue, exchangeName, routingKey);

    // Set up consumer to process messages from the queue
    channel.consume(jobberQueue.queue, async (msg: ConsumeMessage | null) => {
      if (msg) {
        // Log the message content after parsing from JSON
        console.log(JSON.parse(msg.content.toString()));

        // TODO: Process the message to send an email and acknowledge receipt
        const { receiverEmail, username, verifyLink, resetLink, template } = JSON.parse(msg.content.toString());
        const locals: IEmailLocals = {
          appLink: `${config.CLIENT_URL}`,
          appIcon: 'https://i.ibb.co/Kyp2m0t/cover.png',
          username,
          verifyLink,
          resetLink
        };
        await sendEmail(template, receiverEmail, locals);
        channel.ack(msg);
      }
    });
  } catch (error) {
    // Log any errors encountered during setup or consumption
    log.log('error', 'NotificationService EmailConsumer consumeAuthEmailMessages() method error:', error);
  }
}

async function consumeOrderEmailMessages(channel: Channel): Promise<void> {
  try {
    if (!channel) {
      channel = (await createConnection()) as Channel;
    }
    const exchangeName = 'jobber-order-notification';
    const routingKey = 'order-email';
    const queueName = 'order-email-queue';
    await channel.assertExchange(exchangeName, 'direct');
    const jobberQueue = await channel.assertQueue(queueName, { durable: true, autoDelete: false });
    await channel.bindQueue(jobberQueue.queue, exchangeName, routingKey);
    channel.consume(jobberQueue.queue, async (msg: ConsumeMessage | null) => {
      const {
        receiverEmail,
        username,
        template,
        sender,
        offerLink,
        amount,
        buyerUsername,
        sellerUsername,
        title,
        description,
        deliveryDays,
        orderId,
        orderDue,
        requirements,
        orderUrl,
        originalDate,
        newDate,
        reason,
        subject,
        header,
        type,
        message,
        serviceFee,
        total
      } = JSON.parse(msg!.content.toString());
      const locals: IEmailLocals = {
        appLink: `${config.CLIENT_URL}`,
        appIcon: 'https://i.ibb.co/Kyp2m0t/cover.png',
        username,
        sender,
        offerLink,
        amount,
        buyerUsername,
        sellerUsername,
        title,
        description,
        deliveryDays,
        orderId,
        orderDue,
        requirements,
        orderUrl,
        originalDate,
        newDate,
        reason,
        subject,
        header,
        type,
        message,
        serviceFee,
        total
      };
      if (template === 'orderPlaced') {
        await sendEmail('orderPlaced', receiverEmail, locals);
        await sendEmail('orderReceipt', receiverEmail, locals);
      } else {
        await sendEmail(template, receiverEmail, locals);
      }
      channel.ack(msg!);
    });
  } catch (error) {
    log.log('error', 'NotificationService EmailConsumer consumeOrderEmailMessages() method error:', error);
  }
}

export { consumeAuthEmailMessages, consumeOrderEmailMessages };
