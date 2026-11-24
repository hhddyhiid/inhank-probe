const http = require("http");
const https = require("https");

const PORT = parseInt(process.env.PORT || "8080", 10);
let EGRESS = "";

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { "user-agent": "curl/8.5.0" } }, (res) => {
      let d = "";
      res.on("data", (c) => (d += c));
      res.on("end", () => resolve(d));
    }).on("error", reject);
  });
}

(async () => {
  try { EGRESS = (await get("https://api.ipify.org")).trim(); } catch (e) {}
  console.log("EGRESS " + EGRESS);
})();

const srv = http.createServer(async (req, res) => {
  const p = (req.url || "/").split("?")[0];
  res.setHeader("content-type", "application/json");
  if (p === "/health") {
    res.setHeader("content-type", "text/plain");
    return res.end("ok");
  }
  if (p === "/ip") {
    let detail = null;
    try { detail = JSON.parse(await get("http://ip-api.com/json/?fields=status,country,countryCode,regionName,city,isp,org,as,asname,proxy,hosting,query")); } catch (e) {}
    return res.end(JSON.stringify({
      egress: EGRESS || (detail && detail.query) || null,
      detail,
      now: new Date().toISOString(),
      env: { PORT: process.env.PORT || null },
    }, null, 2));
  }
  res.setHeader("content-type", "text/plain");
  res.end(EGRESS || "ok");
});
srv.listen(PORT, () => console.log("LISTEN " + PORT));
