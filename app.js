const BOT_API_URL = 'https://77.79.183.74:8080/api/save';


class MusicPlayer {
    constructor() {
        this.player = document.createElement('audio');
        this.currentTrack = null;
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
                
                <div class="player">
                    <div id="now-playing"></div>
                    <div class="controls">
                        <button id="prev-btn">⏮</button>
                        <button id="play-btn">▶️</button>
                        <button id="next-btn">⏭</button>
                        <button id="like-btn">❤️</button>
                    </div>
                    <progress id="progress" value="0" max="100"></progress>
                </div>

                <div class="track-list" id="results"></div>
                <div id="loader" class="loader hidden"></div>
            </div>
        `;
    }

    initEventListeners() {
        document.getElementById('search-btn').addEventListener('click', () => this.search());
        document.getElementById('search-input').addEventListener('keypress', e => {
            if (e.key === 'Enter') this.search();
        });

        // Плеер
        this.player.addEventListener('timeupdate', () => this.updateProgress());
        document.getElementById('play-btn').addEventListener('click', () => this.togglePlay());
        document.getElementById('like-btn').addEventListener('click', () => this.saveTrack());
    }

    async search() {
        const input = document.getElementById('search-input');
        const query = input.value.trim();
        if (!query) return;

        this.showLoader(true);
        input.value = '';

        try {
            const response = await fetch(`${BOT_API_URL}/api/youtube?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.displayResults(data.items);
        } catch (error) {
            this.showError(`Ошибка: ${error.message}`);
        } finally {
            this.showLoader(false);
        }
    }

    displayResults(items) {
        const container = document.getElementById('results');
        container.innerHTML = items.map(item => `
            <div class="track-card" data-id="${item.id.videoId}">
                <img src="${item.snippet.thumbnails.medium.url}" class="track-image">
                <div class="track-info">
                    <div class="track-title">${item.snippet.title}</div>
                    <div class="track-artist">${item.snippet.channelTitle}</div>
                </div>
                <button class="play-btn">▶️</button>
            </div>
        `).join('');

        // Обработчик клика на трек
        document.querySelectorAll('.track-card').forEach(card => {
            card.addEventListener('click', async () => {
                const videoId = card.dataset.id;
                this.playTrack(videoId);
            });
        });
    }

    playTrack(videoId) {
        this.player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        this.player.play();
        document.getElementById('play-btn').textContent = '⏸️';
        document.getElementById('now-playing').textContent = 
            document.querySelector('.track-title').textContent;
    }

    togglePlay() {
        if (this.player.paused) {
            this.player.play();
            document.getElementById('play-btn').textContent = '⏸️';
        } else {
            this.player.pause();
            document.getElementById('play-btn').textContent = '▶️';
        }
    }

    async saveTrack() {
        const title = document.getElementById('now-playing').textContent;
        try {
            await fetch(`${BOT_API_URL}/api/save`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: this.userId,
                    query: title
                })
            });
            this.showNotification('Трек сохранен!');
        } catch (error) {
            this.showError('Ошибка сохранения');
        }
    }

    showLoader(show) {
        document.getElementById('loader').classList.toggle('hidden', !show);
    }

    showError(message) {
        const error = document.createElement('div');
        error.className = 'error';
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

    updateProgress() {
        const progress = document.getElementById('progress');
        progress.value = (this.player.currentTime / this.player.duration) * 100;
    }
}

window.player = new MusicPlayer();