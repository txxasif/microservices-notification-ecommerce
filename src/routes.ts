import express, { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
const router: Router = express.Router();
export function healthRoutes(): Router {
  router.get('/notification-health', (_request: Request, response: Response) => {
    response.status(StatusCodes.OK).json({ status: 'Notification Service is healthy and Ok' });
  });

  return router;
}
