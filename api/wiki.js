import https from "https";

function cleanHtml(html, title) {
  let out = html;

  // Prende solo il body
  const bodyMatch = out.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) out = bodyMatch[1];

  // Rimuove commenti HTML
  out = out.replace(/<!--[\s\S]*?-->/g, "");

  // Rimuove script, style, noscript
  out = out
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "");

  // Rimuove iframe, svg, canvas, form, input e simili
  out = out
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<canvas[\s\S]*?<\/canvas>/gi, "")
    .replace(/<form[\s\S]*?<\/form>/gi, "")
    .replace(/<input[^>]*>/gi, "")
    .replace(/<button[\s\S]*?<\/button>/gi, "");

  // Rimuove immagini e thumbnail
  out = out
    .replace(/<img[^>]*>/gi, "")
    .replace(/<figure[\s\S]*?<\/figure>/gi, "");

  // Rimuove elementi noti di MediaWiki/accessori
  out = out
    .replace(/<div[^>]*class="[^"]*thumb[^"]*"[\s\S]*?<\/div>/gi, "")
    .replace(/<div[^>]*class="[^"]*magnify[^"]*"[\s\S]*?<\/div>/gi, "")
    .replace(/<div[^>]*class="[^"]*printfooter[^"]*"[\s\S]*?<\/div>/gi, "")
    .replace(/<table[^>]*class="[^"]*toc[^"]*"[\s\S]*?<\/table>/gi, "");

  // Rimuove riferimenti Dynatrace tipici
  out = out
    .replace(/<script[^>]*ruxitagentjs[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\sdata-dtconfig="[^"]*"/gi, "")
    .replace(/\sdata-dynatrace="[^"]*"/gi, "")
    .replace(/\sdata-dt[^=]*="[^"]*"/gi, "");

  // Rimuove attributi inutili o rumorosi
  out = out
    .replace(/\sclass="[^"]*"/gi, "")
    .replace(/\sid="[^"]*"/gi, "")
    .replace(/\sstyle="[^"]*"/gi, "")
    .replace(/\sdecoding="[^"]*"/gi, "")
    .replace(/\ssrcset="[^"]*"/gi, "")
    .replace(/\sloading="[^"]*"/gi, "")
    .replace(/\swidth="[^"]*"/gi, "")
    .replace(/\sheight="[^"]*"/gi, "")
    .replace(/\salt="[^"]*"/gi, "")
    .replace(/\stitle="[^"]*"/gi, "");

  // Riscrive i link wiki interni verso il proxy
  out = out.replace(
    /href="\/index\.php\/([^"#?]+)"/gi,
    'href="/api/wiki?title=$1"'
  );

  out = out.replace(
    /href="\/index\.php\?title=([^"&]+)[^"]*"/gi,
    'href="/api/wiki?title=$1"'
  );

  // Semplifica i link esterni: lascia il testo ma non il link
  out = out.replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, "$1");

  // Rimuove tag vuoti ripetuti
  out = out
    .replace(/<p>\s*<\/p>/gi, "")
    .replace(/<div>\s*<\/div>/gi, "")
    .replace(/<span>\s*<\/span>/gi, "");

  return `
    <!doctype html>
    <html lang="it">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body>
        <main>
          ${out}
        </main>
      </body>
    </html>
  `;
}

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

    const clean = cleanHtml(html, title.replaceAll("_", " "));

    res.setHeader("Content-Type", "text/html; charset=UTF-8");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.status(200).send(clean);
  } catch (err) {
    res.status(500).send(`Errore: ${err.message}`);
  }
}
