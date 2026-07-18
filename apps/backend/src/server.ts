import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createServer } from "@porulle/core";
import configPromise from "../commerce.config.js";

const PORT = Number(process.env.PORT ?? 4000);

const config = await configPromise;
const { app, logger } = await createServer(config);

// Serve uploaded media files (local storage adapter). serveStatic resolves
// `root + requestPath`, so the `/assets` mount prefix must be stripped or it
// would look under ./.data/media/assets/… instead of ./.data/media/….
app.use(
  "/assets/*",
  serveStatic({
    root: "./.data/media",
    rewriteRequestPath: (path) => path.replace(/^\/assets/, ""),
  }),
);

// Liveness probe.
app.get("/health", (c) => c.json({ status: "ok", store: config.storeName }));

serve({ fetch: app.fetch, port: PORT }, (info) => {
  logger.info(
    {
      store: config.storeName,
      port: info.port,
      restApi: `http://localhost:${info.port}/api`,
      openapi: `http://localhost:${info.port}/api/doc`,
      reference: `http://localhost:${info.port}/api/reference`,
    },
    "porulle backend started",
  );
});
