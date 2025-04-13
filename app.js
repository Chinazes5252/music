const BOT_API_URL = 'https://77.79.183.74:8080/api/save';


class MusicPlayer {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('user_id');
        this.initUI();
        this.initEventListeners();
    }

    initUI() {
        document.body.innerHTML = `
            <div class="glass-container">
                <header class="header">
                    <h1 class="logo">🎵 MusicBot</h1>
                    <div class="search-box">
                        <input type="text" id="search-input" placeholder="Найти трек...">
                        <button id="search-btn"><i class="fas fa-search"></i> Поиск</button>
                    </div>
                </header>
                <div class="track-list" id="results"></div>
                <div id="loader" class="loader hidden"></div>
            </div>
        `;
    }

    initEventListeners() {
        document.getElementById('search-btn').addEventListener('click', () => this.search());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });
    }

    async search() {
        const input = document.getElementById('search-input');
        const query = input.value.trim();
        if (!query) return;

        this.showLoader(true);
        input.value = '';

        try {
            const response = await fetch(`${BOT_API_URL}/api/youtube?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            const data = await response.json();
            this.displayResults(data.items);
        } catch (error) {
            this.showError(`Ошибка поиска: ${error.message}`);
        } finally {
            this.showLoader(false);
        }
    }

    displayResults(items) {
        const container = document.getElementById('results');
        container.innerHTML = items.map(item => `
            <div class="track-card">
                <img src="${item.snippet.thumbnails.medium.url}" class="track-image">
                <div class="track-info">
                    <div class="track-title">${item.snippet.title}</div>
                    <div class="track-artist">${item.snippet.channelTitle}</div>
                </div>
                <button class="like-btn" onclick="player.saveTrack('${item.snippet.title}')">
                    ❤️ Сохранить
                </button>
            </div>
        `).join('');
    }

    async saveTrack(trackTitle) {
        try {
            const response = await fetch(`${BOT_API_URL}/api/save`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: this.userId,
                    query: trackTitle
                })
            });
            
            if (!response.ok) throw new Error('Ошибка сохранения');
            this.showNotification('🎉 Трек сохранен!');
        } catch (error) {
            this.showError(error.message);
        }
    }

    showLoader(show) {
        document.getElementById('loader').classList.toggle('hidden', !show);
    }

    showError(message) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        document.body.appendChild(error);
        setTimeout(() => error.remove(), 3000);
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
}

window.player = new MusicPlayer();