(function(){
  const body = document.body;
  const overlay = document.getElementById("drawerOverlay");
  const openBtn = document.getElementById("menuToggle");
  const closeBtn = document.getElementById("drawerClose");

  function openDrawer(){
    body.classList.add("drawer-open");
  body.classList.add("menu-open"); // 
  setTimeout(()=>closeBtn && closeBtn.focus(), 0);
}
  function closeDrawer(){
    body.classList.remove("drawer-open");
  body.classList.remove("menu-open"); // 
  openBtn && openBtn.focus();
}

  if(openBtn) openBtn.addEventListener("click", openDrawer);
  if(closeBtn) closeBtn.addEventListener("click", closeDrawer);
  if(overlay) overlay.addEventListener("click", closeDrawer);

  document.addEventListener("keydown", (e)=>{
    if(e.key === "Escape" && body.classList.contains("drawer-open")) closeDrawer();
  });

  window.toast = function(msg){
    const t = document.getElementById("toast");
    if(!t) return;
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(()=>t.classList.remove("show"), 2200);
  }
})();
document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname.split("/").pop() || "index.html";

  const map = {
    fr: path.replace(/-en|-ar/g, ""),
    en: path.replace(/\.html$/, "").replace(/-ar$/, "") + "-en.html",
    ar: path.replace(/\.html$/, "").replace(/-en$/, "") + "-ar.html",
  };

  if (path === "index.html" || path === "") {
    map.fr = "index.html";
    map.en = "index-en.html";
    map.ar = "index-ar.html";
  }

  document
    .querySelectorAll(".lang a, .drawer-lang a")
    .forEach(a => {
      const t = a.textContent.trim().toLowerCase();
      if (map[t]) a.href = map[t];
    });
});
const targetDate = new Date("October 12, 2026 09:00:00").getTime();

setInterval(() => {
  const now = new Date().getTime();
  const diff = targetDate - now;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  document.getElementById("days").innerText = days;
  document.getElementById("hours").innerText = hours;
  document.getElementById("minutes").innerText = minutes;
  document.getElementById("seconds").innerText = seconds;
}, 1000);
// ===== PREMIUM COUNTDOWN (IA EXPO 2026) =====
function startCountdown() {
  const targetDate = new Date("October 12, 2026 09:00:00").getTime();

  function updateCountdown() {
    const now = new Date().getTime();
    const diff = targetDate - now;

    if (diff <= 0) return;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    const d = document.getElementById("days");
    const h = document.getElementById("hours");
    const m = document.getElementById("minutes");
    const s = document.getElementById("seconds");

    if (!d || !h || !m || !s) return;

    d.textContent = days;
    h.textContent = hours;
    m.textContent = minutes;
    s.textContent = seconds;
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

window.addEventListener("load", startCountdown);
