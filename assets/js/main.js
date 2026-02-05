(function(){
  const body = document.body;
  const overlay = document.getElementById("drawerOverlay");
  const openBtn = document.getElementById("menuToggle");
  const closeBtn = document.getElementById("drawerClose");

  function openDrawer(){
    body.classList.add("drawer-open");
    setTimeout(()=>closeBtn && closeBtn.focus(), 0);
  }
  function closeDrawer(){
    body.classList.remove("drawer-open");
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
