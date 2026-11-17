import { db, seedDemoData } from "./config/database";
import { env } from "./config/env";
import { createApp } from "./app";

seedDemoData();

const server = createApp().listen(env.port, () => {
  console.log(`Plataforma de notas lista en http://localhost:${env.port}`);
});

function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
