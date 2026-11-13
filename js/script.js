const let tracks = [];
let currentFilterCountry = 'Все';
let currentFilterGenre = 'Все Жанры';
let searchQuery = '';
let currentTrackIndex = 0;
let isPlaying = false;

const audioElement = new Audio();

window.addEventListener('DOMContentLoaded', async () => {
    // Загружаем актуальный плейлист с GitHub с защитой от кэша
    await loadTracksFromGitHub();

    initScreenLayout();
    renderTracks();
    loadComments();

    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', nextTrack);

    document.getElementById('progressBar').addEventListener('input', (e) => {
        if (audioElement.duration) {
            audioElement.currentTime = (e.target.value / 100) * audioElement.duration;
        }
    });
    document.getElementById('volumeBar').addEventListener('input', (e) => {
        audioElement.volume = e.target.value;
    });
});

async function loadTracksFromGitHub() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/mastertj994/neonbeat/main/tracks.json?t=${Date.now()}`);
        if (response.ok) {
            tracks = await response.json();
        } else {
            throw new Error("Не удалось загрузить tracks.json");
        }
    } catch (e) {
        console.error("Ошибка загрузки плейлиста, используем дефолтные:", e);
        tracks = [
            { id: 1, title: "Pamir Breeze", artist: "Tajik Beats", country: "Таджикистан", genre: "Поп", duration: "3:45", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" }
        ];
    }
}

let currentFilterCountry = 'Все';
let currentFilterGenre = 'Все Жанры';
let searchQuery = '';
let currentTrackIndex = 0;
let isPlaying = false;

const audioElement = new Audio();

window.addEventListener('DOMContentLoaded', () => {
    initScreenLayout();
    renderTracks();
    loadComments();

    // Синхронизация при изменении треков в соседней вкладке (админке)
    window.addEventListener('storage', (e) => {
        if (e.key === 'neonbeat_tracks') {
            tracks = JSON.parse(e.newValue) || [];
            renderTracks();
        }
    });

    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', nextTrack);

    document.getElementById('progressBar').addEventListener('input', (e) => {
        if (audioElement.duration) {
            audioElement.currentTime = (e.target.value / 100) * audioElement.duration;
        }
    });
    document.getElementById('volumeBar').addEventListener('input', (e) => {
        audioElement.volume = e.target.value;
    });
});

function initScreenLayout() {
    if (window.innerWidth < 768) {
        switchTab('menu');
    } else {
        document.getElementById('col-menu').style.display = 'flex';
        document.getElementById('col-tracks').style.display = 'flex';
        document.getElementById('col-player').style.display = 'flex';
    }
}

function switchTab(tabName) {
    if (window.innerWidth >= 768) return;

    const menu = document.getElementById('col-menu');
    const tracksCol = document.getElementById('col-tracks');
    const player = document.getElementById('col-player');

    const btnMenu = document.getElementById('tab-btn-menu');
    const btnTracks = document.getElementById('tab-btn-tracks');
    const btnPlayer = document.getElementById('tab-btn-player');

    [btnMenu, btnTracks, btnPlayer].forEach(b => {
        b.className = "flex-1 py-2.5 text-center text-xs font-semibold text-gray-400 border-b-2 border-transparent bg-transparent";
    });

    menu.style.display = 'none';
    tracksCol.style.display = 'none';
    player.style.display = 'none';

    if (tabName === 'menu') {
        menu.style.display = 'flex';
        btnMenu.className = "flex-1 py-2.5 text-center text-xs font-semibold text-neonCyan border-b-2 border-neonCyan bg-gray-900/50";
    } else if (tabName === 'tracks') {
        tracksCol.style.display = 'flex';
        btnTracks.className = "flex-1 py-2.5 text-center text-xs font-semibold text-neonPink border-b-2 border-neonPink bg-gray-900/50";
    } else if (tabName === 'player') {
        player.style.display = 'flex';
        btnPlayer.className = "flex-1 py-2.5 text-center text-xs font-semibold text-neonPurple border-b-2 border-neonPurple bg-gray-900/50";
    }
}

function toggleCountry(country) {
    const sub = document.getElementById(`sub-${country}`);
    const icon = document.getElementById(`icon-${country}`);
    
    ['russia', 'uzbekistan', 'tajikistan'].forEach(c => {
        if (c !== country) {
            document.getElementById(`sub-${c}`).classList.add('hidden');
            document.getElementById(`icon-${c}`).style.transform = 'rotate(0deg)';
        }
    });

    if (sub.classList.contains('hidden')) {
        sub.classList.remove('hidden');
        icon.style.transform = 'rotate(90deg)';
    } else {
        sub.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }
}

function filterMusic(country, genre) {
    currentFilterCountry = country;
    currentFilterGenre = genre;

    document.getElementById('current-category-title').innerHTML = `
        <i class="fa-solid fa-music text-neonCyan"></i>
        <span>${country === 'Все' ? genre : country + ' — ' + genre}</span>
    `;
    document.getElementById('current-category-subtitle').innerText = `Жанр: ${genre}`;

    renderTracks();

    if (window.innerWidth < 768) {
        switchTab('tracks');
    }
}

function searchTracks() {
    searchQuery = document.getElementById('searchInput').value.toLowerCase();
    renderTracks();
}

function renderTracks() {
    const container = document.getElementById('center-dynamic-content');
    
    let filtered = tracks.filter(t => {
        const matchCountry = currentFilterCountry === 'Все' || t.country === currentFilterCountry;
        const matchGenre = currentFilterGenre === 'Все Жанры' || t.genre === currentFilterGenre;
        const matchSearch = t.title.toLowerCase().includes(searchQuery) || t.artist.toLowerCase().includes(searchQuery);
        return matchCountry && matchGenre && matchSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-center py-12 text-gray-500 text-xs"><p>Треки не найдены</p></div>`;
        return;
    }

    container.innerHTML = filtered.map((track) => `
        <div class="bg-panelBg/60 border border-gray-800/80 hover:border-neonCyan/40 rounded-2xl p-3 flex items-center justify-between transition group">
            <div class="flex items-center space-x-3 min-w-0">
                <div class="relative w-11 h-11 rounded-xl overflow-hidden shrink-0">
                    <img src="${track.cover}" class="w-full h-full object-cover">
                </div>
                <div class="min-w-0">
                    <h4 class="text-xs font-bold text-white truncate">${track.title}</h4>
                    <p class="text-[11px] text-gray-400 truncate">${track.artist} &bull; <span class="text-neonPink">${track.country}</span></p>
                </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
                <button onclick="playTrack(${tracks.indexOf(track)})" class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-neonCyan hover:text-gray-950 text-gray-300 flex items-center justify-center text-xs transition">
                    <i class="fa-solid fa-play"></i>
                </button>
                <a href="${track.audio}" download class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-neonPink hover:text-white text-gray-300 flex items-center justify-center text-xs transition">
                    <i class="fa-solid fa-download"></i>
                </a>
            </div>
        </div>
    `).join('');
}

function playTrack(index) {
    if (!tracks[index]) return;
    currentTrackIndex = index;
    const track = tracks[currentTrackIndex];
    audioElement.src = track.audio;
    audioElement.play();
    isPlaying = true;

    document.getElementById('player-title').innerText = track.title;
    document.getElementById('player-artist').innerText = track.artist;
    document.getElementById('player-cover').src = track.cover;
    document.getElementById('playerDownloadBtn').href = track.audio;
    document.getElementById('player-status-badge').innerText = "ИГРАЕТ";
    document.getElementById('playPauseIcon').className = "fa-solid fa-pause";
    document.getElementById('col-player').classList.add('pulsing-led', 'neon-border-cyan');

    document.getElementById('m-player-title').innerText = track.title;
    document.getElementById('m-player-artist').innerText = track.artist;
    document.getElementById('m-player-cover').src = track.cover;
    document.getElementById('m-downloadBtn').href = track.audio;
    document.getElementById('m-playPauseIcon').className = "fa-solid fa-pause";
    
    if (window.innerWidth < 768) {
        document.getElementById('mobile-sticky-player').style.display = 'flex';
    }
}

function togglePlay() {
    if (!audioElement.src) {
        playTrack(0);
        return;
    }
    if (isPlaying) {
        audioElement.pause();
        isPlaying = false;
        document.getElementById('playPauseIcon').className = "fa-solid fa-play ml-0.5";
        document.getElementById('m-playPauseIcon').className = "fa-solid fa-play ml-0.5";
        document.getElementById('player-status-badge').innerText = "ПАУЗА";
        document.getElementById('col-player').classList.remove('pulsing-led');
    } else {
        audioElement.play();
        isPlaying = true;
        document.getElementById('playPauseIcon').className = "fa-solid fa-pause";
        document.getElementById('m-playPauseIcon').className = "fa-solid fa-pause";
        document.getElementById('player-status-badge').innerText = "ИГРАЕТ";
        document.getElementById('col-player').classList.add('pulsing-led');
    }
}

function nextTrack() {
    if (tracks.length === 0) return;
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    playTrack(currentTrackIndex);
}

function prevTrack() {
    if (tracks.length === 0) return;
    currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(currentTrackIndex);
}

function updateProgress() {
    if (audioElement.duration) {
        document.getElementById('progressBar').value = (audioElement.currentTime / audioElement.duration) * 100;
        document.getElementById('currentTime').innerText = formatTime(audioElement.currentTime);
        document.getElementById('totalTime').innerText = formatTime(audioElement.duration);
    }
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

let comments = JSON.parse(localStorage.getItem('neonbeat_comments')) || [
    { name: "Тимур", text: "Отличный сайт!", time: "Только что" }
];

function loadComments() {
    document.getElementById('commentsList').innerHTML = comments.map(c => `
        <div class="bg-black/30 border border-gray-800 rounded-xl p-2 text-xs">
            <span class="font-bold text-neonPurple">${c.name}</span>: <span class="text-gray-300">${c.text}</span>
        </div>
    `).join('');
}

function addComment(e) {
    e.preventDefault();
    const n = document.getElementById('guestName').value;
    const t = document.getElementById('commentText').value;
    if (n && t) {
        comments.unshift({ name: n, text: t, time: "Только что" });
        localStorage.setItem('neonbeat_comments', JSON.stringify(comments));
        document.getElementById('guestName').value = '';
        document.getElementById('commentText').value = '';
        loadComments();
    }
}
