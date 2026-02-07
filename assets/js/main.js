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
