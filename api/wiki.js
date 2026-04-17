import https from "https";

export default async function handler(req, res) {
  try {
    const title = req.query.title || "Registrazione_e_autenticazione";
    const url = `https://wiki.acquistinretepa.it/index.php?title=${encodeURIComponent(title)}&action=render`;

    const agent = new https.Agent({
      rejectUnauthorized: false,
    });

    const html = await new Promise((resolve, reject) => {
      https
        .get(url, { agent, timeout: 15000 }, (response) => {
          let data = "";

          response.on("data", (chunk) => {
            data += chunk;
          });

          response.on("end", () => {
            if (response.statusCode && response.statusCode >= 400) {
              reject(new Error(`Errore fetch: ${response.statusCode}`));
              return;
            }
            resolve(data);
          });
        })
        .on("error", reject)
        .on("timeout", function () {
          this.destroy(new Error("Timeout durante la fetch verso la wiki"));
        });
    });

    let cleanHtml = html;

    const match = cleanHtml.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (match) cleanHtml = match[1];

    cleanHtml = cleanHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<figure[\s\S]*?<\/figure>/gi, "")
      .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");

    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=3600");

    res.status(200).send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
        </head>
        <body>
          <main>${cleanHtml}</main>
        </body>
      </html>
    `);
  } catch (err) {
    res.status(500).send(`Errore: ${err.message}`);
  }
}
