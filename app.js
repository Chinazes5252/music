class MusicPlayer {
    constructor() {
        this.initPlayer();
        this.initUI();
        this.initWebApp();
    }

    async initWebApp() {
        if (window.Telegram.WebApp.initData) {
            this.userId = Telegram.WebApp.initData.user.id;
            Telegram.WebApp.ready();
            this.loadRecommendations();
        }
    }

    async search(query) {
        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.displayResults(data);
            
            if(data[0]) {
                const track = data[0].snippet;
                const recs = await this.getRecommendations(track);
                this.displayRecs(recs);
            }
        } catch (error) {
            this.showError('Search failed');
        }
    }

    async getRecommendations(track) {
        try {
            const response = await fetch(`/api/recommendations?track=${track.title}&artist=${track.channelTitle}`);
            return await response.json();
        } catch (error) {
            console.error('Recommendations error:', error);
            return [];
        }
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