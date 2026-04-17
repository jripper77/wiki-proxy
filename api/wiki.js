export default async function handler(req, res) {
  try {
    const title = req.query.title || "Registrazione_e_autenticazione";

    const url = `https://wiki.acquistinretepa.it/index.php?title=${encodeURIComponent(title)}&action=render`;

    const response = await fetch(url);

    let html = await response.text();

    const match = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (match) html = match[1];

    html = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<img[^>]*>/gi, "")
      .replace(/<figure[\s\S]*?<\/figure>/gi, "")
      .replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");

    res.setHeader("Content-Type", "text/html; charset=UTF-8");

    res.status(200).send(`
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${title}</title>
        </head>
        <body>
          <main>${html}</main>
        </body>
      </html>
    `);

  } catch (err) {
    res.status(500).send(`Errore: ${err.message}`);
  }
}
