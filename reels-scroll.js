document.addEventListener("DOMContentLoaded", function() {
    const track = document.querySelector('.reels-track');
    if (!track) return;

    // 1. Save the original items as our "Blueprint"
    const originalItems = Array.from(track.querySelectorAll('.reel-item'));

    // --- OBSERVER: Play/Pause & Reset Logic ---
    const playObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;

            if (entry.isIntersecting) {
                // Always start fresh when scrolling onto a video
                video.currentTime = 0;
                video.play().catch(e => console.log("Autoplay prevented by browser."));
            } else {
                // Pause when scrolling away
                video.pause();
            }
        });
    }, {
        threshold: 0.6
    });

    // 2. Master function to setup a video (HLS + Observer + Clicks)
    function setupVideo(video) {
        const src = video.getAttribute('data-src');

        // Setup the HLS stream
        if (Hls.isSupported()) {
            const hls = new Hls({
                startLevel: -1,
                capLevelToPlayerSize: true
            });
            hls.loadSource(src);
            hls.attachMedia(video);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
        }

        // Tell the observer to watch this video
        playObserver.observe(video);

        // Add the play/pause on click
        video.addEventListener('click', () => {
            if (video.paused) {
                video.play();
            } else {
                video.pause();
            }
        });
    }

    // 3. Setup the initial videos that are already on the page
    const initialVideos = track.querySelectorAll('.hls-reel-video');
    initialVideos.forEach(setupVideo);

    // --- THE CONVEYOR BELT (Infinite Load) ---

    // Create an invisible tripwire and put it at the very bottom
    const tripwire = document.createElement('div');
    tripwire.style.height = "1px";
    tripwire.style.width = "100%";
    tripwire.style.flexShrink = "0";
    track.appendChild(tripwire);

    const appendObserver = new IntersectionObserver((entries) => {
        // When the tripwire comes near the screen...
        if (entries[0].isIntersecting) {

            // ...take our original blueprints, copy them, and insert them BEFORE the tripwire
            originalItems.forEach(item => {
                const clone = item.cloneNode(true); // Copies the HTML container
                track.insertBefore(clone, tripwire);

                // The clone needs to be "turned on", so we run our setup function
                const newVideo = clone.querySelector('.hls-reel-video');
                setupVideo(newVideo);
            });
        }
    }, {
        // This is the magic part you suggested: 
        // "800px" tells it to trigger while the user is still 1-2 videos away!
        root: track,
        rootMargin: "0px 0px 800px 0px"
    });

    // Start watching the tripwire
    appendObserver.observe(tripwire);

});
