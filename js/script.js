// ===== Состояние =====
let tracks = [];
let defaultTracks = [
    { id: 1, title: "Pamir Breeze", artist: "Tajik Beats", country: "Таджикистан", genre: "Поп", duration: "3:45", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: 2, title: "Tashkent Nights", artist: "DJ Shod", country: "Узбекистан", genre: "Хип-хоп", duration: "2:50", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: 3, title: "Cyber City Lights", artist: "Neon Pulse", country: "Россия", genre: "Электроника", duration: "4:10", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

const COUNTRIES = ['russia', 'uzbekistan', 'tajikistan'];

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
    audioElement.addEventListener('error', () => {
        showToast('Не удалось загрузить аудио этого трека');
        if (isPlaying) togglePlay();
    });

    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.addEventListener('input', (e) => {
            if (audioElement.duration) {
                audioElement.currentTime = (e.target.value / 100) * audioElement.duration;
                updateProgress(); // сразу обновляем UI, не ждём timeupdate
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

// ===== Уведомления =====
function showToast(message) {
    let toast = document.getElementById('neonbeat-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'neonbeat-toast';
        toast.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-gray-900 border border-neonCyan/50 text-gray-200 text-xs px-4 py-2.5 rounded-xl shadow-lg z-50 transition-opacity duration-300';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.opacity = '1';
    setTimeout(() => { toast.style.opacity = '0'; }, 3500);
}

// ===== Загрузка треков =====
async function loadTracksFromGitHub() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/mastertj994/neonbeat/main/tracks.json?t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) throw new Error('Пустой или некорректный ответ');

        // Отбираем только валидные треки — один битый объект не сломает весь список
        const valid = data.filter(t =>
            t && typeof t === 'object' &&
            typeof t.title === 'string' && t.title.trim() &&
            typeof t.audio === 'string' && t.audio.trim()
        );
        if (valid.length === 0) throw new Error('Нет ни одного валидного трека');

        // Чистим строки от случайной разметки (в HTML вставляются напрямую)
        tracks = valid.map((t, i) => ({
            ...t,
            id: Number.isInteger(t.id) ? t.id : i + 1,
            title: escapeHtml(String(t.title)),
            artist: escapeHtml(String(t.artist ?? 'Неизвестный исполнитель')),
            country: escapeHtml(String(t.country ?? '')),
            genre: escapeHtml(String(t.genre ?? ''))
        }));
    } catch (e) {
        console.warn('Не удалось подгрузить с GitHub, используем дефолтные треки:', e);
        tracks = defaultTracks;
        showToast('Не удалось загрузить свежие треки — показаны локальные');
    }
}

// ===== Layout =====
function initScreenLayout() {
    if (window.innerWidth < 768) {
        switchTab('menu');
    } else {
        ['col-menu', 'col-tracks', 'col-player'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'flex';
        });
    }
}

function switchTab(tabName) {
    if (window.innerWidth >= 768) return;

    const tabs = {
        menu:   { col: 'col-menu',   btn: 'tab-btn-menu',   color: 'neonCyan' },
        tracks: { col: 'col-tracks', btn: 'tab-btn-tracks', color: 'neonPink' },
        player: { col: 'col-player', btn: 'tab-btn-player', color: 'neonPurple' }
    };

    const resetClass = "flex-1 py-2.5 text-center text-xs font-semibold text-gray-400 border-b-2 border-transparent bg-transparent";

    ['col-menu', 'col-tracks', 'col-player'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    ['tab-btn-menu', 'tab-btn-tracks', 'tab-btn-player'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.className = resetClass;
    });

    const active = tabs[tabName];
    if (!active) return;

    const col = document.getElementById(active.col);
    const btn = document.getElementById(active.btn);
    if (col) col.style.display = 'flex';
    if (btn) {
        btn.className = `flex-1 py-2.5 text-center text-xs font-semibold text-${active.color} border-b-2 border-${active.color} bg-gray-900/50`;
    }
}

// ===== Меню стран =====
function toggleCountry(country) {
    const sub = document.getElementById(`sub-${country}`);
    const icon = document.getElementById(`icon-${country}`);
    if (!sub || !icon) return; // безопасный выход, если элемента нет

    COUNTRIES.forEach(c => {
        if (c === country) return;
        const subEl = document.getElementById(`sub-${c}`);
        const iconEl = document.getElementById(`icon-${c}`);
        if (subEl) subEl.classList.add('hidden');
        if (iconEl) iconEl.style.transform = 'rotate(0deg)';
    });

    const isHidden = sub.classList.contains('hidden');
    sub.classList.toggle('hidden', !isHidden);
    icon.style.transform = isHidden ? 'rotate(90deg)' : 'rotate(0deg)';
}

// ===== Фильтры и поиск =====
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

// ===== Рендер списка =====
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
                    <img src="${track.cover}" class="w-full h-full object-cover" alt="${track.title}">
                </div>
                <div class="min-w-0">
                    <h4 class="text-xs font-bold text-white truncate">${track.title}</h4>
                    <p class="text-[11px] text-gray-400 truncate">${track.artist} &bull; <span class="text-neonPink">${track.country}</span></p>
                </div>
            </div>
            <div class="flex items-center space-x-2 shrink-0">
                <button onclick="playTrackById(${track.id})" class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-neonCyan hover:text-gray-950 text-gray-300 flex items-center justify-center text-xs transition" aria-label="Играть ${track.title}">
                    <i class="fa-solid fa-play"></i>
                </button>
                <a href="${track.audio}" download class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-neonPink hover:text-white text-gray-300 flex items-center justify-center text-xs transition" aria-label="Скачать ${track.title}">
                    <i class="fa-solid fa-download"></i>
                </a>
            </div>
        </div>
    `).join('');
}

// ===== Плеер =====
function playTrackById(trackId) {
    const index = tracks.findIndex(t => t.id === trackId);
    if (index === -1) return;
    playTrack(index);
}

function playTrack(index) {
    if (!tracks[index]) return;
    currentTrackIndex = index;
    const track = tracks[currentTrackIndex];

    audioElement.src = track.audio;
    // play() возвращает промис — обрабатываем возможный отказ браузера
    audioElement.play().catch(() => {
        showToast('Нажмите ещё раз, чтобы начать воспроизведение');
    });
    isPlaying = true;

    const setText = (id, val) => { const el = document.getElementById(id); if (el) el.innerText = val; };
    const setSrc = (id, val) => { const el = document.getElementById(id); if (el) el.src = val; };
    const setHref = (id, val) => { const el = document.getElementById(id); if (el) el.href = val; };

    setText('player-title', track.title);
    setText('player-artist', track.artist);
    setSrc('player-cover', track.cover);
    setHref('playerDownloadBtn', track.audio);
    setText('player-status-badge', 'ИГРАЕТ');

    const playIcon = document.getElementById('playPauseIcon');
    if (playIcon) playIcon.className = 'fa-solid fa-pause';

    const playerCol = document.getElementById('col-player');
    if (playerCol) playerCol.classList.add('pulsing-led', 'neon-border-cyan');

    setText('m-player-title', track.title);
    setText('m-player-artist', track.artist);
    setSrc('m-player-cover', track.cover);
    setHref('m-downloadBtn', track.audio);

    const mPlayIcon = document.getElementById('m-playPauseIcon');
    if (mPlayIcon) mPlayIcon.className = 'fa-solid fa-pause';

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
    const statusBadge = document.getElementById('player-status-badge');

    if (isPlaying) {
        audioElement.pause();
        isPlaying = false;
        if (playIcon) playIcon.className = 'fa-solid fa-play ml-0.5';
        if (mPlayIcon) mPlayIcon.className = 'fa-solid fa-play ml-0.5';
        if (statusBadge) statusBadge.innerText = 'ПАУЗА';
        if (playerCol) playerCol.classList.remove('pulsing-led');
    } else {
        audioElement.play().catch(() => {
            showToast('Нажмите ещё раз, чтобы начать воспроизведение');
        });
        isPlaying = true;
        if (playIcon) playIcon.className = 'fa-solid fa-pause';
        if (mPlayIcon) mPlayIcon.className = 'fa-solid fa-pause';
        if (statusBadge) statusBadge.innerText = 'ИГРАЕТ';
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
    if (!audioElement.duration) return;

    const progressBar = document.getElementById('progressBar');
    if (progressBar) progressBar.value = (audioElement.currentTime / audioElement.duration) * 100;

    const curTimeEl = document.getElementById('currentTime');
    if (curTimeEl) curTimeEl.innerText = formatTime(audioElement.currentTime);

    const totTimeEl = document.getElementById('totalTime');
    if (totTimeEl) totTimeEl.innerText = formatTime(audioElement.duration);
}

function formatTime(s) {
    if (!isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
}

// ===== Комментарии =====
async function loadComments() {
    const commentsList = document.getElementById('commentsList');
    if (!commentsList) return;

    try {
        let localComments = [];
        try {
            localComments = JSON.parse(localStorage.getItem('neonbeat_comments')) || [];
        } catch (e) {
            // Повреждённый localStorage — сбрасываем, не роняя всё приложение
            localStorage.removeItem('neonbeat_comments');
        }
        if (!Array.isArray(localComments)) localComments = [];

        let githubComments = [];
        try {
            const response = await fetch(`https://raw.githubusercontent.com/mastertj994/neonbeat/main/comments.json?t=${Date.now()}`);
            if (response.ok) {
                const data = await response.json();
                if (Array.isArray(data)) githubComments = data;
            }
        } catch (e) {
            console.warn('GitHub-комментарии недоступны:', e);
        }

        // Дедупликация: имя + текст + время (тройной ключ надёжнее двойного)
        const seen = new Set();
        const uniqueComments = [...localComments, ...githubComments].filter(c => {
            const key = `${c?.name}|${c?.text}|${c?.time ?? ''}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });

        if (uniqueComments.length === 0) {
            commentsList.innerHTML = `<p class="text-gray-500 text-xs text-center py-2">Пока нет комментариев. Оставь первый!</p>`;
            return;
        }

        commentsList.innerHTML = uniqueComments.map(c => `
            <div class="bg-black/30 border border-gray-800 rounded-xl p-2 text-xs">
                <span class="font-bold text-neonPurple">${escapeHtml(String(c.name ?? ''))}</span>: <span class="text-gray-300">${escapeHtml(String(c.text ?? ''))}</span>
            </div>
        `).join('');
    } catch (e) {
        console.error('Ошибка загрузки комментариев:', e);
        commentsList.innerHTML = `<p class="text-gray-500 text-xs text-center py-2">Не удалось загрузить комментарии</p>`;
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

    // Ограничения по длине, чтобы не раздувать localStorage
    const comment = { name: name.slice(0, 50), text: text.slice(0, 500), time: 'Только что' };

    let localComments = [];
    try {
        localComments = JSON.parse(localStorage.getItem('neonbeat_comments')) || [];
    } catch (e) {
        localComments = [];
    }
    if (!Array.isArray(localComments)) localComments = [];

    localComments.unshift(comment);
    try {
        localStorage.setItem('neonbeat_comments', JSON.stringify(localComments));
    } catch (e) {
        console.warn('localStorage переполнен — комментарий показан, но не сохранён:', e);
        showToast('Комментарий не сохранён: память браузера переполнена');
    }

    guestNameInput.value = '';
    commentTextInput.value = '';
    loadComments();
}

// ===== Утилиты =====
function escapeHtml(str) {
    return String(str).replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
