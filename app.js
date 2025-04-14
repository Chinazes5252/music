class MusicPlayer {
    constructor() {
        this.userId = null;
        this.initPlayer();
        this.initUI();
        this.initEventListeners();
        this.initTelegramWebApp();
    }

    initTelegramWebApp() {
        if (window.Telegram.WebApp.initDataUnsafe) {
            this.userId = window.Telegram.WebApp.initDataUnsafe.user.id;
            Telegram.WebApp.ready();
        }
    }

    async search(query) {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.displayResults(data);
            
            if(data[0]) {
                const firstTrack = data[0].snippet;
                const recs = await this.getRecommendations(firstTrack.title, firstTrack.channelTitle);
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

    displayRecommendations(tracks) {
        const container = document.getElementById('recommendations');
        container.innerHTML = tracks.slice(0, 5).map(track => `
            <div class="track-card" data-id="${track.mbid}">
                <div class="track-info">
                    <h3>${track.name}</h3>
                    <p>${track.artist.name}</p>
                    <button class="save-btn">Сохранить</button>
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
            return await response.json();
        } catch (error) {
            return {error: 'Save failed'};
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