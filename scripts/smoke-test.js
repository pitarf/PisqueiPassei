const http = require("http");

const routes = [
  { path: "/", name: "Dashboard" },
  { path: "/edital", name: "Edital Verticalizado" },
  { path: "/questoes", name: "Questões" },
  { path: "/simulado", name: "Simulado" },
  { path: "/flashcards", name: "Flashcards" },
  { path: "/desempenho", name: "Desempenho" },
  { path: "/professor", name: "Professor IA" },
  { path: "/configuracoes", name: "Configurações" },
  { path: "/api/backup", name: "API Backup" },
];

function checkRoute(route) {
  return new Promise((resolve) => {
    http.get(`http://localhost:3000${route.path}`, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        resolve({
          name: route.name,
          path: route.path,
          statusCode: res.statusCode,
          ok: res.statusCode >= 200 && res.statusCode < 400,
          length: data.length,
        });
      });
    }).on("error", (err) => {
      resolve({
        name: route.name,
        path: route.path,
        statusCode: 0,
        ok: false,
        error: err.message,
      });
    });
  });
}

async function run() {
  console.log("🚀 Executando Smoke Test em todas as rotas principais...");
  let allOk = true;
  for (const route of routes) {
    const result = await checkRoute(route);
    const statusSymbol = result.ok ? "✅" : "❌";
    console.log(`${statusSymbol} [${result.statusCode}] ${result.name} (${result.path}) - ${result.length || 0} bytes`);
    if (!result.ok) allOk = false;
  }

  if (allOk) {
    console.log("\n🎉 TODAS AS ROTAS RESPONDERAM COM SUCESSO (200 OK)!");
    process.exit(0);
  } else {
    console.error("\n❌ HOUVE FALHAS NAS ROTAS.");
    process.exit(1);
  }
}

run();
