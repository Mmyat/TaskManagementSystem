import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { corePlugin } from "./plugins/core";
import apiRoutes from "./api";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: {
        info: {
          title: "Todo API Documentation",
          version: "1.0.0",
        },
      },
    })
  )
  .use(corePlugin)
  .get('/', async ({ request, log }) => {
    //await Bun.write(Bun.stdout, `[${new Date().toISOString()}] Incoming Request: ${request.method} ${request.url}\n`);
    //console.log('🌱 Health check');
    log.info('🌱 Health check');
    return 'Hello Lotus CoreAPI';
  })
  .use(apiRoutes)
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);