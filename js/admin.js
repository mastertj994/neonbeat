const GITHUB_USER = "mastertj994";
const GITHUB_REPO = "neonbeat";

let tracks = [];
let pendingTracks = [];
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
    const login = document.getElementById('adminLoginInput').value;
    const pass = document.getElementById('adminPassInput').value;
    const token = document.getElementById('adminTokenInput') ? document.getElementById('adminTokenInput').value : '';
    const errorMsg = document.getElementById('login-error');

    if (login === 'admin' && pass === 'neon2026') {
        sessionStorage.setItem('neonbeat_admin_auth', 'true');
        if (token) localStorage.setItem('neonbeat_gh_token', token);
        errorMsg.classList.add('hidden');
        showDashboard();
    } else {
        errorMsg.classList.remove('hidden');
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

        const resPending = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/pending.json?t=${Date.now()}`);
        pendingTracks = resPending.ok ? await resPending.json() : [];
    } catch (e) {
        console.error("Ошибка загрузки данных:", e);
    }
    renderAdminTracks();
    renderPendingTracks();
}

function renderAdminTracks() {
    const container = document.getElementById('admin-tracks-list');
    document.getElementById('tracks-count').innerText = `${tracks.length} шт.`;

    if (tracks.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Плейлист пуст</p>`;
        return;
    }

    container.innerHTML = tracks.map((t, idx) => `
        <div class="bg-black/40 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center space-x-3 min-w-0">
                <img src="${t.cover}" class="w-10 h-10 rounded-lg object-cover shrink-0">
                <div class="min-w-0">
                    <h4 class="text-xs font-bold text-white truncate">${t.title}</h4>
                    <p class="text-[11px] text-gray-400 truncate">${t.artist} &bull; <span class="text-neonPink">${t.country}</span></p>
                </div>
            </div>
            <button onclick="deleteTrack(${idx})" class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-lg transition shrink-0 ml-2">
                Удалить
            </button>
        </div>
    `).join('');
}

function renderPendingTracks() {
    const container = document.getElementById('admin-pending-list');
    const badge = document.getElementById('pending-count');
    if (badge) badge.innerText = `${pendingTracks.length} шт.`;

    if (!container) return;
    if (pendingTracks.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Нет новых заявок</p>`;
        return;
    }

    container.innerHTML = pendingTracks.map((t, idx) => `
        <div class="bg-black/40 border border-neonPurple/40 rounded-xl p-3 flex items-center justify-between">
            <div class="flex items-center space-x-3 min-w-0">
                <img src="${t.cover}" class="w-10 h-10 rounded-lg object-cover shrink-0">
                <div class="min-w-0">
                    <h4 class="text-xs font-bold text-white truncate">${t.title}</h4>
                    <p class="text-[11px] text-gray-400 truncate">Артист: ${t.artist} &bull; Гость</p>
                </div>
            </div>
            <div class="flex space-x-1.5 shrink-0 ml-2">
                <button onclick="approveTrack(${idx})" class="px-2.5 py-1.5 bg-green-500/20 hover:bg-green-500 text-green-400 hover:text-white text-xs font-bold rounded-lg transition">
                    Одобрить
                </button>
                <button onclick="rejectTrack(${idx})" class="px-2.5 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-lg transition">
                    Удалить
                </button>
            </div>
        </div>
    `).join('');
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

// Физическое удаление файла из репозитория GitHub по его URL
async function deleteFileFromGitHub(fileUrl) {
    if (!fileUrl || !fileUrl.includes(`/${GITHUB_USER}/${GITHUB_REPO}/`)) return;

    const token = localStorage.getItem('neonbeat_gh_token');
    // Извлекаем относительный путь (например, music/12345_song.mp3)
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
            headers: {
                Authorization: `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Delete ${filePath}`,
                sha: fileData.sha
            })
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

    const jsonString = JSON.stringify
