let tracks = [];
let defaultTracks = [
    { id: 1, title: "Pamir Breeze", artist: "Tajik Beats", country: "Таджикистан", genre: "Поп", duration: "3:45", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: 2, title: "Tashkent Nights", artist: "DJ Shod", country: "Узбекистан", genre: "Хип-хоп", duration: "2:50", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: 3, title: "Cyber City Lights", artist: "Neon Pulse", country: "Россия", genre: "Электроника", duration: "4:10", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

let currentFilterCountry = 'Все';
let currentFilterGenre = 'Все Жанры';
let searchQuery = '';
let currentTrackIndex = 0;
let isPlaying = false;

const audioElement = new Audio();

window.addEventListener('DOMContentLoaded', async () => {
    await loadTracksFromGitHub();
    initScreenLayout();
    renderTracks();
    loadComments();

    audioElement.addEventListener('timeupdate', updateProgress);
    audioElement.addEventListener('ended', nextTrack);

    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.addEventListener('input', (e) => {
            if (audioElement.duration) {
                audioElement.currentTime = (e.target.value / 100) * audioElement.duration;
            }
        });
    }

    const volumeBar = document.getElementById('volumeBar');
    if (volumeBar) {
        volumeBar.addEventListener('input', (e) => {
            audioElement.volume = e.target.value;
        });
    }
});

async function loadTracksFromGitHub() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/mastertj994/neonbeat/main/tracks.json?t=${Date.now()}`);
        if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
                tracks = data;
                return;
            }
        }
        throw new Error("Пустой или некорректный ответ");
    } catch (e) {
        console.warn("Не удалось подгрузить с GitHub, используем дефолтные треки:", e);
        tracks = defaultTracks;
    }
}

function initScreenLayout() {
    if (window.innerWidth < 768) {
        switchTab('menu');
    } else {
        const menu = document.getElementById('col-menu');
        const tracksCol = document.getElementById('col-tracks');
        const player = document.getElementById('col-player');
        if (menu) menu.style.display = 'flex';
        if (tracksCol) tracksCol.style.display = 'flex';
        if (player) player.style.display = 'flex';
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
        if (b) b.className = "flex-1 py-2.5 text-center text-xs font-semibold text-gray-400 border-b-2 border-transparent bg-transparent";
    });

    if (menu) menu.style.display = 'none';
    if (tracksCol) tracksCol.style.display = 'none';
    if (player) player.style.display = 'none';

    if (tabName === 'menu' && menu && btnMenu) {
        menu.style.display = 'flex';
        btnMenu.className = "flex-1 py-2.5 text-center text-xs font-semibold text-neonCyan border-b-2 border-neonCyan bg-gray-900/50";
    } else if (tabName === 'tracks' && tracksCol && btnTracks) {
        tracksCol.style.display = 'flex';
        btnTracks.className = "flex-1 py-2.5 text-center text-xs font-semibold text-neonPink border-b-2 border-neonPink bg-gray-900/50";
    } else if (tabName === 'player' && player && btnPlayer) {
        player.style.display = 'flex';
        btnPlayer.className = "flex-1 py-2.5 text-center text-xs font-semibold text-neonPurple border-b-2 border-neonPurple bg-gray-900/50";
    }
}

function toggleCountry(country) {
    const sub = document.getElementById(`sub-${country}`); const icon = document.getElementById(`icon-${country}`);
    
    ['russia', 'uzbekistan', 'tajikistan'].forEach(c => {
        if (c !== country) {
            const subEl = document.getElementById(`sub-${c}`); const iconEl = document.getElementById(`icon-${c}`);
            if (subEl) subEl.classList.add('hidden');
            if (iconEl) iconEl.style.transform = 'rotate(0deg)';
        }
    });

    if (sub && icon) {
        if (sub.classList.contains('hidden')) {
            sub.classList.remove('hidden');
            icon.style.transform = 'rotate(90deg)';
        } else {
            sub.classList.add('hidden');
            icon.style.transform = 'rotate(0deg)';
        }
    }
}

function filterMusic(country, genre) {
    currentFilterCountry = country;
    currentFilterGenre = genre;

    const catTitle = document.getElementById('current-category-title');
    const catSub = document.getElementById('current-category-subtitle');

    if (catTitle) {
        catTitle.innerHTML = `
            <i class="fa-solid fa-music text-neonCyan"></i>
            <span>${country === 'Все' ? genre : country + ' — ' + genre}</span>
        `;
    }
    if (catSub) {
        catSub.innerText = `Жанр: ${genre}`;
    }

    renderTracks();

    if (window.innerWidth < 768) {
        switchTab('tracks');
    }
}

function searchTracks() {
    const searchInput = document.getElementById('searchInput');
    searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    renderTracks();
}

function renderTracks() {
    const container = document.getElementById('center-dynamic-content');
    if (!container) return;
    
    let filtered = tracks.filter(t => {
        const matchCountry = currentFilterCountry === 'Все' || t.country === currentFilterCountry;
        const matchGenre = currentFilterGenre === 'Все Жанры' || t.genre === currentFilterGenre;
        const matchSearch = (t.title && t.title.toLowerCase().includes(searchQuery)) || 
                            (t.artist && t.artist.toLowerCase().includes(searchQuery));
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
                <a href="${track.audio}" download class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-neonPink hover:text-white text-gray-300 flex items-center justify-center text-xs transition
