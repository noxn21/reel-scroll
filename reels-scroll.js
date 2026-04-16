document.addEventListener("DOMContentLoaded", function() {
    const track = document.querySelector('.reels-track');
    if (!track) return;

    // 1. Save the original items as our "Blueprint"
    const originalItems = Array.from(track.querySelectorAll('.reel-item'));

    // --- NEW: DRAG TO SCROLL LOGIC ---
    let isDown = false;
    let startY;
    let scrollTop;
    let isDragging = false; // Prevents accidental pauses when dragging

    // Give visual feedback that it's draggable
    track.style.cursor = 'grab';

    track.addEventListener('mousedown', (e) => {
        isDown = true;
        isDragging = false;
        track.style.cursor = 'grabbing';
        startY = e.pageY - track.offsetTop;
        scrollTop = track.scrollTop;
        
        // Temporarily turn off snap so the drag feels 1:1 and smooth
        track.style.scrollSnapType = 'none'; 
    });

    track.addEventListener('mouseleave', () => {
        isDown = false;
        track.style.cursor = 'grab';
        track.style.scrollSnapType = 'y mandatory'; // Turn snap back on
    });

    track.addEventListener('mouseup', () => {
        isDown = false;
        track.style.cursor = 'grab';
        track.style.scrollSnapType = 'y mandatory'; // Turn snap back on
        
        // Reset dragging flag after a tiny delay so the click event has time to check it
        setTimeout(() => { isDragging = false; }, 50);
    });

    track.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        
        const y = e.pageY - track.offsetTop;
        const walk = (y - startY) * 1.5; // Multiply by 1.5 for slightly faster scrolling
        
        // If we move more than 5 pixels, count it as a drag, not a click
        if (Math.abs(walk) > 5) {
            isDragging = true;
        }
        
        track.scrollTop = scrollTop - walk;
    });
    // ----------------------------------


    // --- OBSERVER: Play/Pause & Reset Logic ---
    const playObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const video = entry.target;
            const icon = video.closest('.reel-item').querySelector('.reel-pause-icon');

            if (entry.isIntersecting) {
                video.currentTime = 0;
                video.play().catch(e => console.log("Autoplay prevented by browser."));
                if(icon) icon.style.display = 'none'; // Ensure icon is hidden when playing
            } else {
                video.pause();
                if(icon) icon.style.display = 'none'; // Keep hidden when off-screen
            }
        });
    }, {
        threshold: 0.6
    });

    // 2. Master function to setup a video (HLS + Observer + Clicks)
    function setupVideo(video) {
        const src = video.getAttribute('data-src');
        const icon = video.closest('.reel-item').querySelector('.reel-pause-icon');

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

        // Add the play/pause on click (with Drag Protection)
        video.addEventListener('click', (e) => {
            // If the user was dragging, ignore this click
            if (isDragging) {
                e.preventDefault();
                return; 
            }

            if (video.paused) {
                video.play();
                if (icon) icon.style.display = 'none';
            } else {
                video.pause();
                if (icon) icon.style.display = 'flex'; // Use 'flex' or 'block' depending on how you styled it in Webflow
            }
        });
    }

    // 3. Setup the initial videos that are already on the page
    const initialVideos = track.querySelectorAll('.hls-reel-video');
    initialVideos.forEach(setupVideo);

    // --- THE CONVEYOR BELT (Infinite Load) ---
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
    }, {
        root: track,
        rootMargin: "0px 0px 800px 0px"
    });

    appendObserver.observe(tripwire);

});

// Inside your setupVideo function
const icon = video.closest('.reel-item').querySelector('.reel-pause-icon');
console.log("Found icon for this video?", icon); // <--- Add this
