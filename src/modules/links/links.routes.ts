import { Router } from 'express';

import type { LinksController } from './links.controller.js';

/** Routes only map method and path; validation belongs to the controller (D1). */
export function createLinksRouter(controller: LinksController): Router {
  const router = Router();
  router.post('/links', (req, res, next) => {
    controller.create(req, res, next);
  });
  router.get('/links/:code/stats', (req, res, next) => {
    controller.stats(req, res, next);
  });
  return router;
}

/**
 * The catch-all short-code routes are mounted at the root after `/health` and
 * `/api`, so static paths are never shadowed (D3). HEAD is registered
 * explicitly so it cannot fall through to GET and inflate click counts (D20).
 */
export function createRedirectRouter(controller: LinksController): Router {
  const router = Router();
  router.get('/:code', (req, res, next) => {
    controller.redirect(req, res, next);
  });
  router.head('/:code', (req, res, next) => {
    controller.redirect(req, res, next);
  });
  return router;
}
