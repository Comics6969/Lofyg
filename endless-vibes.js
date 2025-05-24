let playlist = [
          { id: "AzV77KFsLn4", title: "lofi songs for slow days"},
          { id: "QEWV6fiYaDU", title: "dryhope - White Oak [chill hip hop beats]"},
          { id: "rhrCG0Vtx3g", title: "High-Rise Urban Studio | Neo Soul, R&B Lofi Chill Mix 🌇"},
          { id: "AMcVJmb5mvk", title: "𝐏𝐥𝐚𝐲𝐥𝐢𝐬𝐭 90s Japanese Lofi Hiphop ☕️Nostalgic Chill Vibes"},
          { id: "EFdHhgI8-fw", title: "lofi songs for slower days"},
          { id: "d2VdpHxmbPE", title: "90's Lofi City 🌧️ Rainy Lofi Hip Hop 🎶 Lofi Music & Rain Sounds"},
          { id: "wWFCEo-zAfc", title: "Lo-fi Hotel Lobby Playlist"},
          { id: "ZbyxjGE885I", title: "Jazz at the Library 📚 1 Hour Jazz Music 📖 Library Ambience | Studying Music | Work Aid 🎧"},
          { id: "4ewLbD2ksKAU", title: "My Beloved Autumn - Chill Fall Lofi Mix for a Rainy Autumn Day 🍂"},

];

// DOM Elements
const elements = {
    playerContainer: document.getElementById("player-container"),
    queueList: document.getElementById("queue"),
    playButton: document.getElementById("play"),
    nextButton: document.getElementById("next"),
    vinylRecord: document.getElementById("vinyl"),
    songTitle: document.getElementById("song-title"),
    progressBar: document.getElementById("progress-bar"),
    progressContainer: document.getElementById("progress-bar")?.parentElement,
    timeRemaining: document.getElementById("time-remaining"),
};

let player;
let isPlaying = false;
let currentSongIndex = 0;
let updateInterval;
let isLooping = false;
let notificationTimeout;

// Request notification permission
if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
}

// Load YouTube API
function loadYouTubeAPI() {
    return new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// YouTube API callback
function onYouTubeIframeAPIReady() {
    player = new YT.Player("youtube-player", {
        height: "390",
        width: "640",
        videoId: playlist[currentSongIndex].id,
        playerVars: { autoplay: 0, controls: 1, modestbranding: 1, rel: 0, fs: 0 },
        events: {
            onReady: () => {
                loadQueue();
                updateSongInfo();
            },
            onStateChange: handlePlayerStateChange,
            onError: handlePlayerError
        }
    });
}

function initialize() {
    if (window.YT?.Player) {
        onYouTubeIframeAPIReady();
    } else {
        setTimeout(initialize, 500);
    }
}

function loadQueue() {
    elements.queueList.innerHTML = "";
    playlist.forEach((song, index) => {
        if (!isValidYouTubeId(song.id)) return;
        const li = document.createElement("li");
        li.textContent = sanitizeTitle(song.title);
        li.dataset.index = index;
        li.style.cursor = "pointer";
        li.classList.toggle("active-song", index === currentSongIndex);
        li.addEventListener("click", () => playSong(index));
        elements.queueList.appendChild(li);
    });
}

function sanitizeTitle(title) {
    const div = document.createElement("div");
    div.innerText = title;
    return div.innerHTML;
}

function isValidYouTubeId(id) {
    return typeof id === "string" && id.length === 11;
}

function updateSongInfo() {
    const title = sanitizeTitle(playlist[currentSongIndex].title);
    elements.songTitle.textContent = `Now Playing: ${title}`;

    loadQueue();

    if (Notification.permission === "granted") {
        clearTimeout(notificationTimeout);
        notificationTimeout = setTimeout(() => {
            new Notification("🎶 Now Playing", {
                body: title,
                icon: "logo.png"
            });
        }, 300);
    }

    const popup = document.getElementById("now-playing-popup");
    const popupText = document.getElementById("now-playing-text");
    if (popup && popupText) {
        popupText.textContent = `Now Playing: ${title}`;
        popup.style.opacity = "1";
        setTimeout(() => popup.style.opacity = "0", 3000);
    }
}

function playSong(index, skipped = 0) {
    if (index >= playlist.length) index = 0;
    if (index < 0) index = playlist.length - 1;
    if (skipped >= playlist.length) return;

    const song = playlist[index];
    if (!isValidYouTubeId(song.id)) {
        playSong(index + 1, skipped + 1);
        return;
    }

    currentSongIndex = index;
    player.loadVideoById(song.id);
    player.playVideo();

    updateSongInfo();
    resetProgressBar();
    startVinylAnimation();
}

function resetProgressBar() {
    elements.progressBar.style.width = "0%";
}

function updateTime() {
    if (!player?.getDuration()) return;
    const duration = player.getDuration();
    const currentTime = player.getCurrentTime();
    const remaining = duration - currentTime;

    elements.progressBar.style.width = `${(currentTime / duration) * 100}%`;
    elements.timeRemaining.textContent = `${Math.floor(remaining / 60)}:${String(Math.floor(remaining % 60)).padStart(2, "0")}`;
}

function startUpdatingTime() {
    clearInterval(updateInterval);
    updateInterval = setInterval(updateTime, 1000);
}

function startVinylAnimation() {
    if (elements.vinylRecord) {
        elements.vinylRecord.classList.toggle("spinning", isPlaying);
        elements.vinylRecord.classList.toggle("pulsing", isPlaying);
    }
}

function handlePlayerStateChange(event) {
    switch (event.data) {
        case YT.PlayerState.ENDED:
            isLooping ? playSong(currentSongIndex) : playSong(currentSongIndex + 1);
            break;
        case YT.PlayerState.PLAYING:
            isPlaying = true;
            startUpdatingTime();
            break;
        case YT.PlayerState.PAUSED:
            isPlaying = false;
            break;
    }
    startVinylAnimation();
}

function handlePlayerError(event) {
    console.warn("YouTube Player Error:", event.data);
    playSong(currentSongIndex + 1);
}

// Buttons
elements.playButton?.addEventListener("click", () => {
    isPlaying ? player.pauseVideo() : player.playVideo();
    isPlaying = !isPlaying;
    startVinylAnimation();
});

elements.nextButton?.addEventListener("click", () => {
    playSong(currentSongIndex + 1);
});

elements.progressContainer?.addEventListener("click", (event) => {
    if (!player?.getDuration()) return;
    const width = elements.progressContainer.clientWidth;
    const clickX = event.offsetX;
    const seekTo = (clickX / width) * player.getDuration();
    player.seekTo(seekTo, true);
    updateTime();
});

document.getElementById("loop-single")?.addEventListener("click", () => {
    isLooping = !isLooping;
    document.getElementById("loop-single").classList.toggle("active-mode", isLooping);
});

document.addEventListener("visibilitychange", () => {
    if (document.hidden && isPlaying) player.playVideo();
});

document.addEventListener("keydown", (event) => {
    if (event.code === "Space" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
        event.preventDefault();
        isPlaying ? player.pauseVideo() : player.playVideo();
        isPlaying = !isPlaying;
        startVinylAnimation();
    }
});

document.addEventListener("click", e => {
    for (let i = 0; i < 8; i++) {
        const fleck = document.createElement('div');
        fleck.classList.add('particle');
        fleck.style.left = e.clientX + 'px';
        fleck.style.top = e.clientY + 'px';

        const angle = Math.random() * 2 * Math.PI;
        const distance = 40 + Math.random() * 20;
        fleck.style.setProperty('--x', `${Math.cos(angle) * distance}px`);
        fleck.style.setProperty('--y', `${Math.sin(angle) * distance}px`);

        fleck.addEventListener('animationend', () => fleck.remove());
        document.body.appendChild(fleck);
    }
});

// Start
loadYouTubeAPI().then(initialize);

const volumeSlider = document.getElementById("volume-slider");

volumeSlider.addEventListener("input", () => {
    const volume = parseInt(volumeSlider.value, 10);
    if (player && typeof player.setVolume === "function") {
        player.setVolume(volume);
    }
});