document.addEventListener("DOMContentLoaded", function() {
    const track = document.querySelector('.reels-track');
    if (!track) return;

    const originalItems = Array.from(track.querySelectorAll('.reel-item'));

    // --- DRAG TO SCROLL ---
    let isDown = false;
    let startY;
    let scrollTop;
    let isDragging = false;

    track.style.cursor = 'grab';

    track.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false;
        track.style.cursor = 'grabbing';
        startY = e.pageY - track.offsetTop;
        scrollTop = track.scrollTop;
        track.style.scrollSnapType = 'none'; 
    });

    track.addEventListener('mouseleave', () => {
        isDown = false;
        track.style.scrollSnapType = 'y mandatory';
    });

    track.addEventListener('mouseup', () => {
        isDown = false;
        track.style.cursor = 'grab';
        track.style.scrollSnapType = 'y mandatory';
        // Delay resetting isDragging so the click handler can see it
        setTimeout(() => { isDragging = false; }, 100);
    });

    track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        const y = e.pageY - track.offsetTop;
        const walk = (y - startY) * 1.5;
        if (Math.abs(walk) > 10) { // Increased threshold to 10px
            isDragging = true;
        }
        track.scrollTop = scrollTop - walk;
    });

    // --- OBSERVER ---
    const playObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const item = video.closest('.reel-item');
            const icon = item ? item.querySelector('.reel-pause-icon') : null;

            if (entry.isIntersecting) {
                video.currentTime = 0;
                video.play().catch(e => {});
                if (icon) icon.style.display = 'none'; // Hide icon on auto-play
            } else {
                video.pause();
                if (icon) icon.style.display = 'none'; // Hide icon when scrolled away
            }
        });
    }, { threshold: 0.6 });

    // --- SETUP FUNCTION ---
    function setupVideo(video) {
        const item = video.closest('.reel-item');
        const icon = item ? item.querySelector('.reel-pause-icon') : null;
        const src = video.getAttribute('data-src');

        if (Hls.isSupported()) {
            const hls = new Hls({ startLevel: -1, capLevelToPlayerSize: true });
            hls.loadSource(src);
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
        }

        playObserver.observe(video);

        // CLICK LOGIC
        video.addEventListener('click', () => {
            console.log("Video clicked! isDragging is:", isDragging);
            
            if (isDragging) return; // Don't toggle if we were just scrolling

            if (video.paused) {
                video.play();
                if (icon) icon.style.display = 'none';
            } else {
                video.pause();
                if (icon) icon.style.display = 'flex';
            }
        });
    }

    // INITIAL SETUP
    track.querySelectorAll('.hls-reel-video').forEach(setupVideo);

    // CONVEYOR BELT
    const tripwire = document.createElement('div');
    tripwire.style.height = "1px";
    tripwire.style.width = "100%";
    tripwire.style.flexShrink = "0";
    track.appendChild(tripwire);

    const appendObserver = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            originalItems.forEach(item => {
                const clone = item.cloneNode(true);
                track.insertBefore(clone, tripwire);
                const newVideo = clone.querySelector('.hls-reel-video');
                setupVideo(newVideo);
            });
        }
    }, { root: track, rootMargin: "0px 0px 800px 0px" });

    appendObserver.observe(tripwire);
});
