const BOT_API_URL = 'https://77.79.183.74:8080/api/save';

class MusicPlayer {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('user_id');
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('search-btn').addEventListener('click', () => this.search());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });
    }

    async search() {
        const query = document.getElementById('search-input').value;
        if (!query) return;

        try {
            const response = await fetch(`${BOT_API_URL}/api/youtube?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.displayResults(data.items);
        } catch (error) {
            this.showError('Ошибка поиска: ' + error.message);
        }
    }

    displayResults(items) {
        const container = document.getElementById('results');
        container.innerHTML = items.map(item => `
            <div class="track-card">
                <img src="${item.snippet.thumbnails.medium.url}" width="60" height="60" style="border-radius:8px">
                <div class="track-info">
                    <div class="track-title">${item.snippet.title}</div>
                    <div class="track-artist">${item.snippet.channelTitle}</div>
                </div>
                <button class="like-btn" onclick="player.saveTrack('${item.snippet.title}')">❤</button>
            </div>
        `).join('');
    }

    async saveTrack(trackTitle) {
        try {
            await fetch(`${BOT_API_URL}/api/save`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: this.userId,
                    query: trackTitle
                })
            });
            this.showNotification('Трек сохранен!');
        } catch (error) {
            this.showError('Ошибка сохранения: ' + error.message);
        }
    }
}

let player = new MusicPlayer();