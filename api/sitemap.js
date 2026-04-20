const pages = [
  { title: "Registrazione_e_autenticazione", label: "Registrazione e autenticazione" },
  { title: "Glossario", label: "Glossario" },
  { title: "Abilitazione", label: "Abilitazione" },
  { title: "Gestione_dell_abilitazione", label: "Gestione dell'abilitazione" },
  { title: "Abilitazione_ai_Mercati_Telematici", label: "Mercati Telematici" }
];

export default function handler(req, res) {
  const links = pages
    .map(
      (p) =>
        `<li><a href="/api/wiki?title=${encodeURIComponent(p.title)}">${p.label}</a></li>`
    )
    .join("");

  res.setHeader("Content-Type", "text/html; charset=UTF-8");
  res.setHeader("Cache-Control", "public, max-age=3600");

  res.status(200).send(`
    <!doctype html>
    <html lang="it">
      <head>
        <meta charset="UTF-8">
        <title>Sitemap Wiki</title>
      </head>
      <body>
        <main>
          <h1>Sitemap Wiki</h1>
          <p>Pagine disponibili per il crawler</p>
          <ul>
            ${links}
          </ul>
        </main>
      </body>
    </html>
  `);
}
