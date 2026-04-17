document.addEventListener("DOMContentLoaded", function () {
    const track = document.querySelector(".reels-track");
    if (!track) return;

    const originalItems = Array.from(track.querySelectorAll(".reel-item"));
    if (!originalItems.length) return;

    // --- DRAG TO SCROLL ---
    let isDown = false;
    let startY;
    let scrollTop;
    let isDragging = false;

    track.style.cursor = "grab";

    track.addEventListener("mousedown", (e) => {
        isDown = true;
        isDragging = false;
        track.style.cursor = "grabbing";
        startY = e.pageY - track.offsetTop;
        scrollTop = track.scrollTop;
        track.style.scrollSnapType = "none";
    });

    track.addEventListener("mouseleave", () => {
        isDown = false;
        track.style.cursor = "grab";
        track.style.scrollSnapType = "y mandatory";
    });

    track.addEventListener("mouseup", () => {
        isDown = false;
        track.style.cursor = "grab";
        track.style.scrollSnapType = "y mandatory";

        // Delay resetting isDragging so the click handler can still detect it
        setTimeout(() => {
            isDragging = false;
        }, 100);
    });

    track.addEventListener("mousemove", (e) => {
        if (!isDown) return;

        const y = e.pageY - track.offsetTop;
        const walk = (y - startY) * 1.5;

        if (Math.abs(walk) > 10) {
            isDragging = true;
        }

        track.scrollTop = scrollTop - walk;
    });

    // --- OBSERVER ---
    const playObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;
            const item = video.closest(".reel-item");
            const icon = item ? item.querySelector(".reel-pause-icon") : null;

            if (entry.isIntersecting) {
                video.currentTime = 0;
                video.play().catch(() => {});
                if (icon) icon.style.display = "none";
            } else {
                video.pause();
                if (icon) icon.style.display = "none";
            }
        });
    }, { threshold: 0.6 });

    // --- VIDEO SETUP ---
    function setupVideo(video, observe = true) {
        const item = video.closest(".reel-item");
        const icon = item ? item.querySelector(".reel-pause-icon") : null;
        const src = video.getAttribute("data-src");

        if (!src) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                startLevel: -1,
                capLevelToPlayerSize: true
            });
            hls.loadSource(src);
            hls.attachMedia(video);
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
            video.src = src;
        }

        if (observe) {
            playObserver.observe(video);
        }

        video.addEventListener("click", () => {
            if (isDragging) return;

            if (video.paused) {
                video.play().catch(() => {});
                if (icon) icon.style.display = "none";
            } else {
                video.pause();
                if (icon) icon.style.display = "flex";
            }
        });
    }

    // --- STABLE INFINITE LOOP SETUP ---
    const originalHTML = originalItems.map(item => item.outerHTML).join("");

    // Build a fixed loop: [clone][original][clone]
    track.innerHTML = originalHTML + originalHTML + originalHTML;

    const allItems = Array.from(track.querySelectorAll(".reel-item"));
    const setSize = originalItems.length;

    // Set up videos once on the rebuilt DOM
    track.querySelectorAll(".hls-reel-video").forEach((video) => {
        setupVideo(video, true);
    });

    function getItemHeight() {
        const referenceItem = allItems[setSize];
        return referenceItem ? referenceItem.offsetHeight : 0;
    }

    function getSetHeight() {
        const itemHeight = getItemHeight();
        return itemHeight * setSize;
    }

    // Start in the middle block
    requestAnimationFrame(() => {
        const setHeight = getSetHeight();
        if (setHeight > 0) {
            track.scrollTop = setHeight;
        }
    });

    // --- SEAMLESS REPOSITIONING ---
    let isLoopAdjusting = false;

    track.addEventListener("scroll", () => {
        if (isLoopAdjusting) return;

        const itemHeight = getItemHeight();
        const setHeight = getSetHeight();

        if (!itemHeight || !setHeight) return;

        // Move back into the middle block when getting too close
        // to either edge, so the loop feels continuous
        if (track.scrollTop <= itemHeight * 0.5) {
            isLoopAdjusting = true;
            track.scrollTop += setHeight;
            requestAnimationFrame(() => {
                isLoopAdjusting = false;
            });
        } else if (track.scrollTop >= (setHeight * 2) - (itemHeight * 0.5)) {
            isLoopAdjusting = true;
            track.scrollTop -= setHeight;
            requestAnimationFrame(() => {
                isLoopAdjusting = false;
            });
        }
    });
});
