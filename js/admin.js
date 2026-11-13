const defaultTracks = [
    { id: 1, title: "Pamir Breeze", artist: "Tajik Beats", country: "Таджикистан", genre: "Поп", duration: "3:45", cover: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
    { id: 2, title: "Tashkent Nights", artist: "DJ Shod", country: "Узбекистан", genre: "Хип-хоп", duration: "2:50", cover: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=150&auto=format&fit=crop&q=80", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
    { id: 3, title: "Cyber City Lights", artist: "Neon Pulse", country: "Россия", genre: "Электроника", duration: "4:10", cover: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80", audio: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" }
];

let tracks = JSON.parse(localStorage.getItem('neonbeat_tracks')) || defaultTracks;
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
    const errorMsg = document.getElementById('login-error');

    if (login === 'admin' && pass === 'neon2026') {
        sessionStorage.setItem('neonbeat_admin_auth', 'true');
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

function showDashboard() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.remove('hidden');
    renderAdminTracks();
    renderAdminComments();
}

function saveTracks() {
    localStorage.setItem('neonbeat_tracks', JSON.stringify(tracks));
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
                    <p class="text-[11px] text-gray-400 truncate">${t.artist} &bull; <span class="text-neonPink">${t.country}</span> (${t.genre})</p>
                </div>
            </div>
            <button onclick="deleteTrack(${idx})" class="px-3 py-1.5 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white text-xs font-bold rounded-lg transition shrink-0 ml-2">
                Удалить
            </button>
        </div>
    `).join('');
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

async function addNewTrack(event) {
    event.preventDefault();
    const title = document.getElementById('newTitle').value;
    const artist = document.getElementById('newArtist').value;
    const country = document.getElementById('newCountry').value;
    const genre = document.getElementById('newGenre').value;

    const audioInput = document.getElementById('audioFile');
    const coverInput = document.getElementById('coverFile');

    let audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    if (audioInput.files && audioInput.files[0]) {
        audioUrl = await fileToBase64(audioInput.files[0]);
    }

    let coverUrl = "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&auto=format&fit=crop&q=80";
    if (coverInput.files && coverInput.files[0]) {
        coverUrl = await fileToBase64(coverInput.files[0]);
    }

    tracks.unshift({
        id: Date.now(),
        title: title,
        artist: artist,
        country: country,
        genre: genre,
        duration: "3:15",
        cover: coverUrl,
        audio: audioUrl
    });

    try {
        saveTracks();
        event.target.reset();
        renderAdminTracks();
        alert("Трек успешно добавлен и опубликован на сайте!");
    } catch (e) {
        alert("Файл слишком большой для сохранения в памяти браузера (localStorage). Попробуйте загрузить аудио меньшего размера.");
        tracks.shift();
    }
}

function deleteTrack(index) {
    if (confirm(`Удалить трек "${tracks[index].title}"?`)) {
        tracks.splice(index, 1);
        saveTracks();
        renderAdminTracks();
    }
}

function renderAdminComments() {
    const container = document.getElementById('admin-comments-list');
    document.getElementById('comments-count').innerText = `${comments.length} шт.`;

    if (comments.length === 0) {
        container.innerHTML = `<p class="text-xs text-gray-500 text-center py-4">Комментариев пока нет</p>`;
        return;
    }

    container.innerHTML = comments.map((c, idx) => `
        <div class="bg-black/40 border border-gray-800 rounded-xl p-2.5 flex items-center justify-between text-xs">
            <div class="min-w-0 pr-2">
                <span class="font-bold text-neonPurple">${c.name}</span>: <span class="text-gray-300">${c.text}</span>
            </div>
            <button onclick="deleteComment(${idx})" class="text-red-400 hover:text-red-300 text-[11px] shrink-0">
                <i class="fa-solid fa-trash"></i>
            </button>
        </div>
    `).join('');
}

function deleteComment(index) {
    comments.splice(index, 1);
    localStorage.setItem('neonbeat_comments', JSON.stringify(comments));
    renderAdminComments();
}
