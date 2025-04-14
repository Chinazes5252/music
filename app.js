class MusicPlayer {
    constructor() {
        this.userId = null;
        this.initUI();
        this.initTelegramWebApp();
        this.initEventListeners();
    }

    initTelegramWebApp() {
        if (window.Telegram.WebApp.initDataUnsafe) {
            this.userId = Telegram.WebApp.initDataUnsafe.user.id;
            Telegram.WebApp.ready();
        }
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
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.displayResults(data);
            
            if(data[0]) {
                const track = data[0].snippet;
                const recs = await this.getRecommendations(track.title, track.channelTitle);
                this.displayRecommendations(recs);
            }
        } catch (error) {
            this.showError('Ошибка поиска');
        }
    }

    async getRecommendations(track, artist) {
        try {
            const response = await fetch(`/api/recommendations?track=${encodeURIComponent(track)}&artist=${encodeURIComponent(artist)}`);
            return await response.json();
        } catch (error) {
            return [];
        }
    }

    displayResults(items) {
        const container = document.getElementById('results');
        container.innerHTML = items.map(item => `
            <div class="track-card" data-id="${item.id.videoId}">
                <img src="${item.snippet.thumbnails.medium.url}" class="track-image">
                <div class="track-info">
                    <h3>${item.snippet.title}</h3>
                    <p>${item.snippet.channelTitle}</p>
                    <button class="save-btn" onclick="player.saveTrack('${item.id.videoId}')">💾 Сохранить</button>
                </div>
            </div>
        `).join('');
    }

    displayRecommendations(tracks) {
        const container = document.getElementById('recommendations');
        container.innerHTML = tracks.slice(0, 5).map(track => `
            <div class="track-card">
                <div class="track-info">
                    <h3>${track.name}</h3>
                    <p>${track.artist.name}</p>
                </div>
            </div>
        `).join('');
    }

    async saveTrack(trackId) {
        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: this.userId,
                    track_id: trackId
                })
            });
            
            const result = await response.json();
            if (result.status === 'saved') {
                this.showNotification('Трек сохранен!');
            } else {
                this.showError('Трек уже в библиотеке');
            }
        } catch (error) {
            this.showError('Ошибка сохранения');
        }
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }

    showError(message) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        document.body.appendChild(error);
        setTimeout(() => error.remove(), 3000);
    }
}

window.player = new MusicPlayer();