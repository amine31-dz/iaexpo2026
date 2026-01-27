(function(){
  // Highlight current page in the navbar
  const path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav]').forEach(a=>{
    if(a.getAttribute('href') === path) a.classList.add('active');
  });

  // Social links (edit these 3 URLs whenever you need)
  const SOCIAL = {
    facebook: "https://www.facebook.com/AgenceArtistiqueStarEvent",
    instagram: "https://www.instagram.com/stareventdz",
    tiktok: "https://www.tiktok.com/@stareventdz"
  };

  // Apply social links across all pages
  document.querySelectorAll('a[data-social]').forEach(a=>{
    const key = (a.getAttribute('data-social') || '').toLowerCase();
    const url = SOCIAL[key];
    if(!url){
      // If a link is not provided, hide it
      a.style.display = 'none';
      return;
    }
    a.setAttribute('href', url);
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noopener');
  });
})();
