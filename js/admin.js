const GITHUB_USER = "mastertj994";
const GITHUB_REPO = "neonbeat";

let tracks = [];
let comments = JSON.parse(localStorage.getItem('neonbeat_comments')) || [
    { name: "Тимур", text: "Отличный сайт!", time: "Только что" }
];

window.addEventListener('DOMContentLoaded', () => {
    if (sessionStorage.getItem('neonbeat_admin_auth') === 'true') {
        showDashboard();
    }
});

function handleLogin(event) {
    event.preventDefault();
    const login = document.getElementById('adminLoginInput').value.trim();
    const pass = document.getElementById('adminPassInput').value.trim();
    const tokenInput = document.getElementById('adminTokenInput');
    const token = tokenInput ? tokenInput.value.trim() : '';
    const errorMsg = document.getElementById('login-error');

    if (login === 'admin' && pass === 'neon2026' && token !== '') {
        sessionStorage.setItem('neonbeat_admin_auth', 'true');
        localStorage.setItem('neonbeat_gh_token', token);
        if (errorMsg) errorMsg.classList.add('hidden');
        showDashboard();
    } else {
        if (errorMsg) {
            errorMsg.innerText = "Неверный логин, пароль или пустой токен!";
            errorMsg.classList.remove('hidden');
        }
    }
}

function logoutAdmin() {
    sessionStorage.removeItem('neonbeat_admin_auth');
    document.getElementById('admin-dashboard').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

async function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    await loadDataFromGitHub();
    renderAdminComments();
}

async function loadDataFromGitHub() {
    try {
        const resTracks = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/tracks.json?t=${Date.now()}`);
        tracks = resTracks.ok ? await resTracks.json() : [];
    } catch (e) {
        console.error("Ошибка загрузки данных:", e);
    }
    renderAdminTracks();
}

function renderAdminTracks() {
    const container = document.getElementById('admin-tracks-list');
    const countEl = document.getElementById('tracks-count');
    if (countEl) countEl.innerText = `${tracks.length} шт.`;

    if (!container) return;
    if (tracks.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Плейлист пуст</p>`;
        return;
    }

    container.innerHTML = tracks.map((t, idx) => `
        <div class="bg-black/40 border border-gray-800 rounded-xl p-3 flex flex-col space-y-2 transition hover:border-neonCyan/30">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3 min-w-0">
                    <img src="${t.cover}" class="w-10 h-10 rounded-lg object-cover shrink-0">
                    <div class="min-w-0">
                        <h4 class="text-xs font-bold text-white truncate">${t.title}</h4>
                        <p class="text-[11px] text-gray-400 truncate">${t.artist} &bull; <span class="text-neonPink">${t.country}</span></p>
                    </div>
                </div>
                <div class="flex items-center space-x-2 shrink-0">
                    <button onclick="toggleAdminPlay('${t.audio}', ${idx})" id="admin-play-btn-${idx}" class="w-8 h-8 rounded-lg bg-gray-800 hover:bg-neonCyan hover:text-gray-950 text-neonCyan flex items-center justify-center text-xs transition">
                        <i class="fa-solid fa-play" id="admin-play-icon-${idx}"></i>
                    </button>
                    <button onclick="deleteTrack(${idx})" class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-lg transition">
                        Удалить
                    </button>
                </div>
            </div>
            <!-- Мини-плеер (скрыт по умолчанию) -->
            <div id="admin-mini-player-${idx}" class="hidden pt-2 border-t border-gray-800/60 flex items-center space-x-3">
                <audio id="admin-audio-${idx}" src="${t.audio}" ontimeupdate="updateAdminProgress(${idx})" onended="stopAdminPlay(${idx})"></audio>
                <span id="admin-current-time-${idx}" class="text-[10px] text-gray-400 font-mono w-8 text-right">0:00</span>
                <input type="range" id="admin-progress-${idx}" value="0" max="100" step="0.1" oninput="seekAdminAudio(${idx})" class="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-neonCyan">
                <span id="admin-total-time-${idx}" class="text-[10px] text-gray-400 font-mono w-8">0:00</span>
            </div>
        </div>
    `).join('');
}

// Управление воспроизведением мини-плеера в админке
let currentAdminAudio = null;
let currentAdminIdx = null;

function toggleAdminPlay(audioUrl, idx) {
    const audioElement = document.getElementById(`admin-audio-${idx}`);
    const miniPlayer = document.getElementById(`admin-mini-player-${idx}`);
    const playIcon = document.getElementById(`admin-play-icon-${idx}`);

    // Если уже играет другой трек — остановим его
    if (currentAdminAudio && currentAdminAudio !== audioElement) {
        currentAdminAudio.pause();
        if (currentAdminIdx !== null) {
            const prevIcon = document.getElementById(`admin-play-icon-${currentAdminIdx}`);
            const prevPlayer = document.getElementById(`admin-mini-player-${currentAdminIdx}`);
            if (prevIcon) prevIcon.className = "fa-solid fa-play";
            if (prevPlayer) prevPlayer.classList.add('hidden');
        }
    }

    if (audioElement.paused) {
        audioElement.play();
        miniPlayer.classList.remove('hidden');
        playIcon.className = "fa-solid fa-pause";
        currentAdminAudio = audioElement;
        currentAdminIdx = idx;
    } else {
        audioElement.pause();
        playIcon.className = "fa-solid fa-play";
        currentAdminAudio = null;
        currentAdminIdx = null;
    }
}

function updateAdminProgress(idx) {
    const audio = document.getElementById(`admin-audio-${idx}`);
    const progressBar = document.getElementById(`admin-progress-${idx}`);
    const currentTimeEl = document.getElementById(`admin-current-time-${idx}`);
    const totalTimeEl = document.getElementById(`admin-total-time-${idx}`);

    if (audio && audio.duration) {
        const progress = (audio.currentTime / audio.duration) * 100;
        progressBar.value = progress;
        currentTimeEl.innerText = formatTime(audio.currentTime);
        totalTimeEl.innerText = formatTime(audio.duration);
    }
}

function seekAdminAudio(idx) {
    const audio = document.getElementById(`admin-audio-${idx}`);
    const progressBar = document.getElementById(`admin-progress-${idx}`);
    if (audio && audio.duration) {
        audio.currentTime = (progressBar.value / 100) * audio.duration;
    }
}

function stopAdminPlay(idx) {
    const playIcon = document.getElementById(`admin-play-icon-${idx}`);
    if (playIcon) playIcon.className = "fa-solid fa-play";
    currentAdminAudio = null;
    currentAdminIdx = null;
}

// Вспомогательная функция форматирования времени (если её еще нет в файле)
function formatTime(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
}
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

async function uploadFileToGitHub(path, base64Content) {
    const token = localStorage.getItem('neonbeat_gh_token');
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`;
    
    let sha = null;
    const checkRes = await fetch(url, { headers: { Authorization: `token ${token}` } });
    if (checkRes.ok) {
        const fileData = await checkRes.json();
        sha = fileData.sha;
    }

    const bodyData = { message: `Upload ${path}`, content: base64Content };
    if (sha) bodyData.sha = sha;

    const response = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    });

    if (!response.ok) throw new Error("Ошибка загрузки файла на GitHub");
    const resData = await response.json();
    return resData.content.download_url;
}

async function deleteFileFromGitHub(fileUrl) {
    if (!fileUrl || !fileUrl.includes(`/${GITHUB_USER}/${GITHUB_REPO}/`)) return;

    const token = localStorage.getItem('neonbeat_gh_token');
    const parts = fileUrl.split('/main/');
    if (parts.length < 2) return;
    const filePath = decodeURIComponent(parts[1]);

    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${filePath}`;

    try {
        const checkRes = await fetch(url, { headers: { Authorization: `token ${token}` } });
        if (!checkRes.ok) return;
        const fileData = await checkRes.json();

        await fetch(url, {
            method: 'DELETE',
            headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: `Delete ${filePath}`, sha: fileData.sha })
        });
    } catch (e) {
        console.error("Не удалось удалить файл:", filePath, e);
    }
}

async function updateJsonFileOnGitHub(path, dataArray) {
    const token = localStorage.getItem('neonbeat_gh_token');
    const url = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/${path}`;

    let sha = null;
    const checkRes = await fetch(url, { headers: { Authorization: `token ${token}` } });
    if (checkRes.ok) {
        const fileData = await checkRes.json();
        sha = fileData.sha;
    }

    const jsonString = JSON.stringify(dataArray, null, 2);
    const base64Content = btoa(unescape(encodeURIComponent(jsonString)));

    const bodyData = { message: `Update ${path}`, content: base64Content };
    if (sha) bodyData.sha = sha;

    const response = await fetch(url, {
        method: 'PUT',
        headers: { Authorization: `token ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
    });

    if (!response.ok) throw new Error(`Ошибка обновления ${path}`);
}

async function addNewTrack(event) {
    event.preventDefault();
    const title = document.getElementById('newTitle').value;
    const artist = document.getElementById('newArtist').value;
    const country = document.getElementById('newCountry').value;
    const genre = document.getElementById('newGenre').value;
    const audioInput = document.getElementById('audioFile');
    const coverInput = document.getElementById('coverFile');

    if (!audioInput.files[0]) { alert("Выберите аудио!"); return; }

    try {
        alert("Загрузка...");
        const audioBase64 = await fileToBase64(audioInput.files[0]);
        const audioUrl = await uploadFileToGitHub(`music/${Date.now()}_${audioInput.files[0].name}`, audioBase64);

        let coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80";
        if (coverInput.files && coverInput.files[0]) {
            const coverBase64 = await fileToBase64(coverInput.files[0]);
            coverUrl = await uploadFileToGitHub(`covers/${Date.now()}_${coverInput.files[0].name}`, coverBase64);
        }

        tracks.unshift({ id: Date.now(), title, artist, country, genre, duration: "3:15", cover: coverUrl, audio: audioUrl });
        await updateJsonFileOnGitHub('tracks.json', tracks);
        event.target.reset();
        renderAdminTracks();
        alert("Трек успешно опубликован!");
    } catch (e) {
        alert("Ошибка: " + e.message);
    }
}

async function deleteTrack(index) {
    if (confirm("Удалить трек из плейлиста и стереть его файлы с GitHub?")) {
        const track = tracks[index];
        await deleteFileFromGitHub(track.audio);
        await deleteFileFromGitHub(track.cover);

        tracks.splice(index, 1);
        await updateJsonFileOnGitHub('tracks.json', tracks);
        renderAdminTracks();
    }
}

function renderAdminComments() {
    const container = document.getElementById('admin-comments-list');
    const commentsCount = document.getElementById('comments-count');
    if (commentsCount) commentsCount.innerText = `${comments.length} шт.`;
    if (!container) return;
    container.innerHTML = comments.map((c, idx) => `
        <div class="bg-black/40 border border-gray-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div><span class="font-bold text-neonPurple">${c.name}</span>: ${c.text}</div>
            <button onclick="deleteComment(${idx})" class="text-red-400"><i class="fa-solid fa-trash"></i></button>
        </div>
    `).join('');
}

function deleteComment(index) {
    comments.splice(index, 1);
    localStorage.setItem('neonbeat_comments', JSON.stringify(comments));
    renderAdminComments();
}
