import { Router } from 'express';

import type { LinksController } from './links.controller.js';

/** Routes only map method and path; validation belongs to the controller (D1). */
export function createLinksRouter(controller: LinksController): Router {
  const router = Router();
  router.post('/links', (req, res, next) => {
    controller.create(req, res, next);
  });
  return router;
}
