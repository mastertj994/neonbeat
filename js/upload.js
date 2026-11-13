const GITHUB_USER = "mastertj994";
const GITHUB_REPO = "neonbeat";

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
}

// Загрузка файла (используем тот же механизм через публичный API GitHub с токеном или временным доступом)
// Внимание: чтобы гости могли отправлять треки без ввода админ-токена, можно использовать встроенный ключ или сохранять в очередь.
// Для безопасности репозитория файлы проще загружать с использованием зашитого токена гостевой загрузки либо через админа.
async function uploadFileToGitHub(path, base64Content) {
    // Здесь используется токен для отправки заявок в pending
    const token = "ТВОЙ_АДМИН_ТОКЕН_ИЛИ_ОСТАВЬ_ПУСТЫМ_ЕСЛИ_НУЖЕН_ОБХОД"; 
    // Поскольку у гостей нет токена, самый надежный способ для статического сайта — 
    // либо админ дает гостевой токен с ограниченными правами, либо отправка идет через админку.
}
