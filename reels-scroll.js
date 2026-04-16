document.addEventListener("DOMContentLoaded", function() {
  const track = document.querySelector('.reels-track'); 
  if (!track) return;

  // 1. CLONE ONCE
  const originalItems = Array.from(track.querySelectorAll('.reel-item'));
  originalItems.forEach(item => {
    const clone = item.cloneNode(true); 
    track.appendChild(clone);
  });

  const allVideos = track.querySelectorAll('.hls-reel-video');
  const totalHeight = track.scrollHeight;
  const halfHeight = totalHeight / 2;

  // 2. INITIAL START POSITION
  // We jump to the middle so there is "content" above the user immediately
  track.scrollTop = halfHeight;

  // 3. BIDIRECTIONAL TELEPORT
  track.addEventListener('scroll', () => {
    const currentScroll = track.scrollTop;

    // If we hit the absolute top, jump to the middle
    if (currentScroll <= 0) {
      track.scrollTop = halfHeight;
    } 
    // If we hit the absolute bottom, jump to the middle
    else if (currentScroll >= (totalHeight - track.clientHeight)) {
      track.scrollTop = halfHeight - track.clientHeight;
    }
  }, { passive: true });

  // --- HLS & OBSERVER SETUP ---
  const playObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const video = entry.target;
      if (entry.isIntersecting) {
        video.currentTime = 0; 
        video.play().catch(e => {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.6 });

  allVideos.forEach(video => {
    // Setup HLS
    const src = video.getAttribute('data-src');
    if (Hls.isSupported()) {
      const hls = new Hls({ startLevel: -1, capLevelToPlayerSize: true });
      hls.loadSource(src);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
    }

    playObserver.observe(video);

    // Play/Pause on click
    video.addEventListener('click', () => {
      video.paused ? video.play() : video.pause();
    });
  });
});
