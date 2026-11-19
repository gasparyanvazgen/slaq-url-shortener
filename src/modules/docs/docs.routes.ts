import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express, { Router } from 'express';

/**
 * `docs/openapi.yaml` is not copied into `dist/`, so resolve it from this module
 * rather than the process working directory. The depth is identical in `src/`
 * and `dist/`, which makes `tsx` and the compiled server behave the same (D23).
 */
const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const SPEC_PATH = path.resolve(MODULE_DIR, '../../../docs/openapi.yaml');

/** The package root is the directory Swagger UI ships its browser assets in. */
const ASSETS_DIR = path.dirname(fileURLToPath(import.meta.resolve('swagger-ui-dist')));

const DOCS_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Slaq API documentation</title>
    <link rel="stylesheet" href="/api/docs/assets/swagger-ui.css">
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/api/docs/assets/swagger-ui-bundle.js"></script>
    <script>
      window.onload = function () {
        window.SwaggerUIBundle({
          url: '/api/openapi.yaml',
          dom_id: '#swagger-ui'
        });
      };
    </script>
  </body>
</html>
`;

/** Static documentation routes; mounted under `/api` before `/:code` (D3, D23). */
export function createDocsRouter(): Router {
  const router = Router();

  router.get('/docs', (_req, res) => {
    res.status(200).type('html').send(DOCS_HTML);
  });

  router.use('/docs/assets', express.static(ASSETS_DIR));

  router.get('/openapi.yaml', (_req, res) => {
    res.status(200).type('application/yaml').sendFile(SPEC_PATH);
  });

  return router;
}
