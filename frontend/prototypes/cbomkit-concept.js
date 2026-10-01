// Local interaction model for the design preview. No API requests are made.
const el = (id) => document.getElementById(id);
const scanSeeds = [
  ["Keycloak", "pkg:github/keycloak/keycloak@9f8d2e4", "9f8d2e4", 128],
  ["Spring Security", "pkg:github/spring-projects/spring-security@b7c42a1", "b7c42a1", 74],
  ["Bouncy Castle", "pkg:github/bcgit/bc-java@a1e78d9", "a1e78d9", 216],
  ["OpenSSL", "pkg:github/openssl/openssl@67b9d21", "67b9d21", 164],
  ["Kubernetes", "pkg:github/kubernetes/kubernetes@239aa44", "239aa44", 51],
  ["Keycloak", "pkg:github/keycloak/keycloak@d82b9f0", "d82b9f0", 124],
  ["Spring Security", "pkg:github/spring-projects/spring-security@23c55f1", "23c55f1", 69],
  ["Bouncy Castle", "pkg:github/bcgit/bc-java@c70a3e0", "c70a3e0", 211],
  ["OpenSSL", "pkg:github/openssl/openssl@411be27", "411be27", 160],
  ["Keycloak", "pkg:github/keycloak/keycloak@0e16b48", "0e16b48", 119],
  ["Kubernetes", "pkg:github/kubernetes/kubernetes@9de801a", "9de801a", 49],
  ["Spring Security", "pkg:github/spring-projects/spring-security@68ac0de", "68ac0de", 71],
  ["Bouncy Castle", "pkg:github/bcgit/bc-java@3b27e17", "3b27e17", 207],
  ["OpenSSL", "pkg:github/openssl/openssl@78cb193", "78cb193", 157],
  ["Keycloak", "pkg:github/keycloak/keycloak@771d50c", "771d50c", 115],
  ["Kubernetes", "pkg:github/kubernetes/kubernetes@04f8c36", "04f8c36", 46],
  ["Spring Security", "pkg:github/spring-projects/spring-security@15d0af1", "15d0af1", 67],
  ["Bouncy Castle", "pkg:github/bcgit/bc-java@891f8e1", "891f8e1", 201],
  ["OpenSSL", "pkg:github/openssl/openssl@1f0a802", "1f0a802", 154],
  ["Keycloak", "pkg:github/keycloak/keycloak@760db2a", "760db2a", 112],
  ["Kubernetes", "pkg:github/kubernetes/kubernetes@68a74ee", "68a74ee", 44],
  ["Spring Security", "pkg:github/spring-projects/spring-security@34b17cd", "34b17cd", 65]
];
const scans = scanSeeds.map((seed, index) => ({
  id: index + 1,
  name: seed[0],
  identifier: seed[1],
  commit: seed[2],
  assets: seed[3],
  startedAt: new Date(Date.UTC(2026, 9, 1, 10, 42) - index * 26 * 60 * 60 * 1000),
  status: "Complete"
})).sort((a, b) => b.startedAt - a.startedAt);
const inventory = [
  { id: "keycloak", name: "Keycloak", identifier: "pkg:github/keycloak/keycloak", repository: "https://github.com/keycloak/keycloak", versions: [
    { name: "9f8d2e4", date: "1 Oct 2026 · 10:42", assets: 128, source: "Generated" },
    { name: "d82b9f0", date: "26 Sep 2026 · 08:18", assets: 124, source: "Generated" },
    { name: "0e16b48", date: "21 Sep 2026 · 11:02", assets: 119, source: "Generated" }
  ] },
  { id: "spring", name: "Spring Security", identifier: "pkg:github/spring-projects/spring-security", repository: "https://github.com/spring-projects/spring-security", versions: [
    { name: "b7c42a1", date: "30 Sep 2026 · 08:42", assets: 74, source: "Generated" },
    { name: "23c55f1", date: "25 Sep 2026 · 17:16", assets: 69, source: "Generated" }
  ] },
  { id: "bouncycastle", name: "Bouncy Castle", identifier: "pkg:github/bcgit/bc-java", repository: "https://github.com/bcgit/bc-java", versions: [
    { name: "a1e78d9", date: "29 Sep 2026 · 13:14", assets: 216, source: "Generated" },
    { name: "c70a3e0", date: "24 Sep 2026 · 15:03", assets: 211, source: "Generated" }
  ] },
  { id: "openssl", name: "OpenSSL", identifier: "pkg:github/openssl/openssl", repository: "https://github.com/openssl/openssl", versions: [
    { name: "67b9d21", date: "28 Sep 2026 · 09:37", assets: 164, source: "Generated" },
    { name: "411be27", date: "23 Sep 2026 · 16:25", assets: 160, source: "Generated" }
  ] },
  { id: "kubernetes", name: "Kubernetes", identifier: "pkg:github/kubernetes/kubernetes", repository: "https://github.com/kubernetes/kubernetes", versions: [
    { name: "239aa44", date: "27 Sep 2026 · 07:40", assets: 51, source: "Generated" },
    { name: "9de801a", date: "22 Sep 2026 · 10:57", assets: 49, source: "Generated" }
  ] }
];
const assets = [
  { name: "RSA-2048", status: "Quantum vulnerable", color: "red", type: "Algorithm", primitive: "Signature", location: "KeyManager.java:84", file: "src/main/java/security/KeyManager.java", bomref: "crypto/rsa-2048" },
  { name: "AES-256-GCM", status: "Quantum safe", color: "green", type: "Algorithm", primitive: "Encryption", location: "EncryptionService.java:126", file: "src/main/java/crypto/EncryptionService.java", bomref: "crypto/aes-256-gcm" },
  { name: "SHA-256", status: "Quantum safe", color: "green", type: "Algorithm", primitive: "Hashing", location: "TokenValidator.java:43", file: "src/main/java/tokens/TokenValidator.java", bomref: "crypto/sha-256" },
  { name: "ECDSA P-256", status: "Quantum vulnerable", color: "red", type: "Algorithm", primitive: "Signature", location: "SignatureProvider.java:67", file: "src/main/java/security/SignatureProvider.java", bomref: "crypto/ecdsa-p256" },
  { name: "TLS 1.3", status: "Not applicable", color: "gray", type: "Protocol", primitive: "Key exchange", location: "TlsConfig.java:31", file: "src/main/java/config/TlsConfig.java", bomref: "crypto/tls-1.3" },
  { name: "PBKDF2", status: "Unknown", color: "purple", type: "Algorithm", primitive: "Key derivation", location: "CredentialStore.java:112", file: "src/main/java/store/CredentialStore.java", bomref: "crypto/pbkdf2" }
];
let scansPage = 1;
const scansPageSize = 8;
let selectedInventory = inventory[0];
let resultFrom = "scans";
let noticeTimer;

function notify(message) {
  el("notice").textContent = message;
  el("notice").hidden = false;
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { el("notice").hidden = true; }, 3600);
}
function currentRoute() {
  const route = location.hash.slice(1);
  return ["scan", "scans", "inventory", "result"].includes(route) ? route : "scan";
}
function routeTo(route) {
  if (location.hash === "#" + route) renderRoute();
  else location.hash = route;
}
function renderRoute() {
  const route = currentRoute();
  for (const name of ["scan", "scans", "inventory", "result"]) el("view-" + name).hidden = name !== route;
  document.querySelectorAll("[data-nav]").forEach((item) => {
    if (item.dataset.nav === route || (route === "result" && item.dataset.nav === resultFrom)) item.setAttribute("active", "");
    else item.removeAttribute("active");
  });
  if (route === "scans") renderScans();
  if (route === "inventory") renderInventory();
  if (route === "result") renderAssets();
  window.scrollTo(0, 0);
}
function addCell(row, primary, secondary) {
  const cell = document.createElement("td");
  if (secondary) {
    const strong = document.createElement("span");
    strong.className = "table-primary";
    strong.textContent = primary;
    const minor = document.createElement("span");
    minor.className = "table-secondary mono";
    minor.textContent = secondary;
    cell.append(strong, minor);
  } else cell.textContent = primary;
  row.append(cell);
  return cell;
}
function addTag(cell, value, color) {
  const tag = document.createElement("cds-tag");
  tag.setAttribute("type", color);
  tag.textContent = value;
  cell.append(tag);
}
function dateLabel(value) {
  return value.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
}
function renderScans() {
  const pageCount = Math.max(1, Math.ceil(scans.length / scansPageSize));
  scansPage = Math.min(scansPage, pageCount);
  const first = (scansPage - 1) * scansPageSize;
  const pageRecords = scans.slice(first, first + scansPageSize);
  el("scans-rows").replaceChildren();
  pageRecords.forEach((scan) => {
    const row = document.createElement("tr");
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", "Open " + scan.name + " scan from " + dateLabel(scan.startedAt));
    addCell(row, scan.name, scan.identifier);
    addCell(row, dateLabel(scan.startedAt));
    addTag(addCell(row, ""), scan.status, "green");
    addCell(row, String(scan.assets));
    addCell(row, scan.commit);
    addCell(row, "↗");
    row.addEventListener("click", () => openResult(scan.name, scan.identifier, scan.commit, "scans"));
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); row.click(); } });
    el("scans-rows").append(row);
  });
  el("scans-total").textContent = scans.length + " scans · newest first";
  el("scans-range").textContent = scans.length ? "Showing " + (first + 1) + "–" + (first + pageRecords.length) + " of " + scans.length : "0 scans";
  el("scans-page-label").textContent = "Page " + scansPage + " of " + pageCount;
  el("scans-prev").disabled = scansPage === 1;
  el("scans-next").disabled = scansPage === pageCount;
}
function renderInventory() {
  el("identifier-count").textContent = inventory.length + " identifiers";
  el("identifier-list").replaceChildren();
  inventory.forEach((item) => {
    const button = document.createElement("button");
    button.className = "identifier-item" + (item === selectedInventory ? " active" : "");
    button.setAttribute("aria-pressed", String(item === selectedInventory));
    for (const [className, value] of [["identifier-name", item.name], ["identifier-value", item.identifier], ["identifier-count", item.versions.length + " CBOMs · " + item.repository.replace("https://", "")]]) {
      const span = document.createElement("span");
      span.className = className;
      span.textContent = value;
      button.append(span);
    }
    button.addEventListener("click", () => { selectedInventory = item; renderInventory(); });
    el("identifier-list").append(button);
  });
  el("selected-name").textContent = selectedInventory.name;
  el("selected-identifier").textContent = selectedInventory.identifier + " · " + selectedInventory.repository;
  el("cbom-count").textContent = selectedInventory.versions.length + " CBOMs · newest first";
  el("cbom-rows").replaceChildren();
  selectedInventory.versions.forEach((version) => {
    const row = document.createElement("tr");
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", "Open CBOM " + version.name);
    addCell(row, version.name, selectedInventory.identifier + "@" + version.name);
    addCell(row, version.date);
    addCell(row, String(version.assets));
    addTag(addCell(row, ""), version.source, version.source === "Uploaded" ? "blue" : "cool-gray");
    addCell(row, "↗");
    row.addEventListener("click", () => openResult(selectedInventory.name, selectedInventory.identifier, version.name, "inventory"));
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); row.click(); } });
    el("cbom-rows").append(row);
  });
}
function openResult(name, identifier, revision, from) {
  resultFrom = from;
  el("result-heading").textContent = name;
  el("result-meta").textContent = identifier + " · " + revision;
  el("result-eyebrow").textContent = from === "inventory" ? "Inventory / CBOM" : "Scans / Result";
  el("result-upload-note").hidden = !revision.toLowerCase().endsWith(".json");
  routeTo("result");
}
function renderAssets() {
  el("assets-rows").replaceChildren();
  assets.forEach((asset) => {
    const row = document.createElement("tr");
    row.tabIndex = 0;
    row.setAttribute("role", "button");
    row.setAttribute("aria-label", "Inspect " + asset.name);
    addCell(row, asset.name);
    addTag(addCell(row, ""), asset.status, asset.color);
    addCell(row, asset.type);
    addCell(row, asset.primitive);
    addCell(row, asset.location);
    addCell(row, "→");
    row.addEventListener("click", () => openAsset(asset));
    row.addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); row.click(); } });
    el("assets-rows").append(row);
  });
}
function openAsset(asset) {
  el("asset-detail-name").textContent = asset.name;
  el("asset-detail-ref").textContent = "Cryptographic asset · " + asset.type.toLowerCase();
  el("asset-detail-status").textContent = asset.status;
  el("asset-detail-status").setAttribute("type", asset.color);
  el("asset-detail-type").textContent = asset.type;
  el("asset-detail-primitive").textContent = asset.primitive;
  el("asset-detail-bomref").textContent = asset.bomref;
  el("asset-detail-file").textContent = asset.location;
  el("asset-detail-location").textContent = asset.file + ":" + asset.location.split(":").pop();
  el("detail-scrim").hidden = false;
  el("asset-detail").hidden = false;
  el("detail-close").focus();
}
function closeAsset() {
  el("detail-scrim").hidden = true;
  el("asset-detail").hidden = true;
}
async function addUploadedFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".json")) { notify("Choose a CycloneDX JSON file."); return; }
  let data;
  try { data = JSON.parse(await file.text()); }
  catch { notify("The selected file is not valid JSON."); return; }
  if (data.bomFormat !== "CycloneDX") { notify("Choose a CycloneDX CBOM JSON file."); return; }
  const count = Array.isArray(data.components) ? data.components.filter((item) => item.type === "cryptographic-asset").length : 0;
  selectedInventory.versions.unshift({ name: file.name, date: dateLabel(new Date()), assets: count, source: "Uploaded" });
  renderInventory();
  notify(file.name + " added to this preview only. Nothing was uploaded to the server.");
  el("cbom-file").value = "";
}

window.addEventListener("hashchange", renderRoute);
el("start-scan").addEventListener("click", () => {
  const value = (el("scan-url").value || "").trim();
  if (!value) { notify("Enter a Git URL or Package URL to start."); el("scan-url").focus(); return; }
  const name = value.replace(/^https?:\/\//, "").split("/").filter(Boolean).pop() || value;
  openResult(name, value, "Preview scan", "scan");
  notify("Preview scan opened with sample results. No backend request was sent.");
});
el("scan-url").addEventListener("keydown", (event) => { if (event.key === "Enter") el("start-scan").click(); });
el("advanced-trigger").addEventListener("click", () => {
  const expanded = el("advanced-trigger").getAttribute("aria-expanded") === "true";
  el("advanced-trigger").setAttribute("aria-expanded", String(!expanded));
  el("advanced-content").hidden = expanded;
});
el("scans-new-button").addEventListener("click", () => routeTo("scan"));
el("scans-prev").addEventListener("click", () => { if (scansPage > 1) { scansPage--; renderScans(); } });
el("scans-next").addEventListener("click", () => { scansPage++; renderScans(); });
el("identifier-open-latest").addEventListener("click", () => {
  const latest = selectedInventory.versions[0];
  openResult(selectedInventory.name, selectedInventory.identifier, latest.name, "inventory");
});
for (const id of ["inventory-upload-top", "identifier-upload", "result-upload"]) {
  el(id).addEventListener("click", () => { if (currentRoute() !== "inventory") routeTo("inventory"); el("cbom-file").click(); });
}
el("cbom-file").addEventListener("change", (event) => addUploadedFile(event.target.files[0]));
el("upload-zone").addEventListener("dragover", (event) => event.preventDefault());
el("upload-zone").addEventListener("drop", (event) => { event.preventDefault(); addUploadedFile(event.dataTransfer.files[0]); });
el("upload-zone").addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); el("cbom-file").click(); } });
el("result-back").addEventListener("click", () => routeTo(resultFrom));
el("result-download").addEventListener("click", () => notify("Download is shown for layout review; this preview has sample results."));
el("detail-close").addEventListener("click", closeAsset);
el("detail-scrim").addEventListener("click", closeAsset);
el("open-code").addEventListener("click", () => notify("The real app will open this occurrence in its repository."));
document.addEventListener("keydown", (event) => { if (event.key === "Escape") closeAsset(); });
el("theme-switch").addEventListener("click", () => {
  document.documentElement.classList.toggle("cds-theme-zone-white");
  document.documentElement.classList.toggle("cds-theme-zone-g100");
});
renderRoute();
