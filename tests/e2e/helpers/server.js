export async function startTestServer() {
  const { default: app } = await import('../../../server.js');
  const { db } = await import('../../../config/db.js');

  const server = app.listen(0);

  await new Promise((resolve) => {
    server.once('listening', resolve);
  });

  const { port } = server.address();

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async close() {
      await new Promise((resolve, reject) => {
        server.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
      await db.end();
    },
  };
}
