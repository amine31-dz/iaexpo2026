
(() => {
  const grid = document.getElementById('galleryGrid');
  if (!grid) return;

  const images = [
    'assets/gallery/photo1.jpg',
    'assets/gallery/photo2.jpg',
    'assets/gallery/photo3.jpg',
    'assets/gallery/photo4.jpg',
    'assets/gallery/photo5.jpg',
    'assets/gallery/photo6.jpg',
    'assets/gallery/photo7.jpg',
    'assets/gallery/photo8.jpg',
  ];

  const videos = [
    'assets/media/promo1.mp4',
    'assets/media/promo2.mp4',
  ];

  const lang = document.documentElement.getAttribute('data-lang') || document.documentElement.getAttribute('lang') || 'fr';

  const t = {
    fr: { photos: 'Photos', videos: 'Vidéos', play: 'Lecture' },
    en: { photos: 'Photos', videos: 'Videos', play: 'Play' },
    ar: { photos: 'صور', videos: 'فيديوهات', play: 'تشغيل' }
  }[lang] || { photos:'Photos', videos:'Videos', play:'Play' };

  function sectionTitle(text){
    const h = document.createElement('h2');
    h.textContent = text;
    h.style.margin = '18px 0 10px';
    h.style.fontSize = '1.1rem';
    h.style.opacity = '0.95';
    return h;
  }

  function item(el, caption){
    const wrap = document.createElement('div');
    wrap.className = 'gallery-item';
    wrap.appendChild(el);
    const cap = document.createElement('div');
    cap.className = 'cap';
    cap.textContent = caption;
    wrap.appendChild(cap);
    return wrap;
  }

  grid.innerHTML = '';
  grid.appendChild(sectionTitle(t.photos));

  images.forEach((src, i) => {
    const img = document.createElement('img');
    img.loading = 'lazy';
    img.src = src;
    img.alt = `IAEXPO 2026 photo ${i+1}`;
    grid.appendChild(item(img, `IAEXPO 2026 — ${t.photos} ${i+1}`));
  });

  grid.appendChild(sectionTitle(t.videos));

  videos.forEach((src, i) => {
    const video = document.createElement('video');
    video.src = src;
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    grid.appendChild(item(video, `IAEXPO 2026 — ${t.videos} ${i+1}`));
  });
})();
