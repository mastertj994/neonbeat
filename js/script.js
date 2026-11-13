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
    const sub = document.getElementById(`sub-${country}`);
    const icon = document.getElementById(`icon-${country}`);
    
    ['russia', 'uzbekistan', 'tajikistan'].forEach(c => {
        if (c !== country) {
            const subEl = document.getElementById(`sub-${c}`);
            const iconEl = document.getElementById(`icon-${c}`);
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

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setSrc = (id, val) => { const el = document.getElementById(id); if (el) el.src = val; };
    const setHref = (id, val) => { const el = document.getElementById(id); if (el) el.href = val; };

    setText('player-title', track.title);
    setText('player-artist', track.artist);
    setSrc('player-cover', track.cover);
    setHref('playerDownloadBtn', track.audio);
    setText('player-status-badge', "ИГРАЕТ");
    
    const playIcon = document.getElementById('playPauseIcon');
    if (playIcon) playIcon.className = "fa-solid fa-pause";
    
    const playerCol = document.getElementById('col-player');
    if (playerCol) playerCol.classList.add('pulsing-led', 'neon-border-cyan');

    setText('m-player-title', track.title);
    setText('m-player-artist', track.artist);
    setSrc('m-player-cover', track.cover);
    setHref('m-downloadBtn', track.audio);
    
    const mPlayIcon = document.getElementById('m-playPauseIcon');
    if (mPlayIcon) mPlayIcon.className = "fa-solid fa-pause";
    
    if (window.innerWidth < 768) {
        const stickyPlayer = document.getElementById('mobile-sticky-player');
        if (stickyPlayer) stickyPlayer.style.display = 'flex';
    }
}

function togglePlay() {
    if (!audioElement.src) {
        playTrack(0);
        return;
    }
    const playIcon = document.getElementById('playPauseIcon');
    const mPlayIcon = document.getElementById('m-playPauseIcon');
    const playerCol = document.getElementById('col-player');

    if (isPlaying) {
        audioElement.pause();
        isPlaying = false;
        if (playIcon) playIcon.className = "fa-solid fa-play ml-0.5";
        if (mPlayIcon) mPlayIcon.className = "fa-solid fa-play ml-0.5";
        const statusBadge = document.getElementById('player-status-badge');
        if (statusBadge) statusBadge.innerText = "ПАУЗА";
        if (playerCol) playerCol.classList.remove('pulsing-led');
    } else {
        audioElement.play();
        isPlaying = true;
        if (playIcon) playIcon.className = "fa-solid fa-pause";
        if (mPlayIcon) mPlayIcon.className = "fa-solid fa-pause";
        const statusBadge = document.getElementById('player-status-badge');
        if (statusBadge) statusBadge.innerText = "ИГРАЕТ";
        if (playerCol) playerCol.classList.add('pulsing-led');
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
        const progressBar = document.getElementById('progressBar');
        if (progressBar) progressBar.value = (audioElement.currentTime / audioElement.duration) * 100;

        const curTimeEl = document.getElementById('currentTime');
        if (curTimeEl) curTimeEl.innerText = formatTime(audioElement.currentTime);

        const totTimeEl = document.getElementById('totalTime');
        if (totTimeEl) totTimeEl.innerText = formatTime(audioElement.duration);
    }
}

function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}

async function loadComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    try {
        let localComments = JSON.parse(localStorage.getItem('neonbeat_comments')) || [];
        const response = await fetch(`https://raw.githubusercontent.com/mastertj994/neonbeat/main/comments.json?t=${Date.now()}`);
        let githubComments = response.ok ? await response.json() : [];

        let allComments = [...localComments, ...githubComments];
        let uniqueComments = Array.from(new Set(allComments.map(c => c.text + c.name)))
            .map(key => allComments.find(c => (c.text + c.name) === key));

        if (uniqueComments.length === 0) {
            commentsList.innerHTML = `<p class="text-gray-500 text-xs text-center py-2">Пока нет комментариев. Оставь первый!</p>`;
            return;
        }

        commentsList.innerHTML = uniqueComments.map(c => `
            <div class="bg-black/30 border border-gray-800 rounded-xl p-2 text-xs">
                <span class="font-bold text-neonPurple">${escapeHtml(c.name)}</span>: <span class="text-gray-300">${escapeHtml(c.text)}</span>
            </div>
        `).join('');
    } catch (e) {
        console.error("Ошибка загрузки комментариев:", e);
    }
}

function addComment(e) {
    e.preventDefault();
    const guestNameInput = document.getElementById('guestName');
    const commentTextInput = document.getElementById('commentText');
    if (!guestNameInput || !commentTextInput) return;

    const name = guestNameInput.value.trim();
    const text = commentTextInput.value.trim();
    if (!name || !text) return;

    let localComments = JSON.parse(localStorage.getItem('neonbeat_comments')) || [];
    localComments.unshift({ name, text, time: "Только что" });
    localStorage.setItem('neonbeat_comments', JSON.stringify(localComments));

    guestNameInput.value = '';
    commentTextInput.value = '';
    loadComments();
}

function escapeHtml(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
