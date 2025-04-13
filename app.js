const BOT_API_URL = 'https://77.79.183.74:8080/api/save';

class MusicPlayer {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('user_id');
        this.currentTrack = null;
        this.initUI();
        this.initEventListeners();
    }

    initUI() {
        document.body.innerHTML = `
            <div class="glass-container">
                <header class="header">
                    <h1 class="logo">𖤐FuckTheIndustry</h1>
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

                <div class="recommendations" id="recommendations"></div>
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

        document.getElementById('like-btn').addEventListener('click', () => this.saveTrack());
        document.getElementById('play-btn').addEventListener('click', () => this.togglePlay());
    }

    async search() {
        const input = document.getElementById('search-input');
        const query = input.value.trim();
        if (!query) return;

        this.showLoader(true);
        input.value = '';

        try {
            // Поиск треков
            const youtubeResponse = await fetch(`${BOT_API_URL}/api/youtube?q=${encodeURIComponent(query)}`);
            const youtubeData = await youtubeResponse.json();
            this.displayResults(youtubeData.items);

            // Получение рекомендаций
            if (youtubeData.items[0]) {
                const firstTrack = youtubeData.items[0].snippet;
                const lastfmResponse = await fetch(
                    `${BOT_API_URL}/api/lastfm?track=${encodeURIComponent(firstTrack.title)}&artist=${encodeURIComponent(firstTrack.channelTitle)}`
                );
                const lastfmData = await lastfmResponse.json();
                this.displayRecommendations(lastfmData);
            }

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
            card.addEventListener('click', () => {
                const videoId = card.dataset.id;
                this.playTrack(videoId);
            });
        });
    }

    displayRecommendations(tracks) {
        const container = document.getElementById('recommendations');
        if (!tracks || tracks.length === 0) return;

        container.innerHTML = `
            <h2>Рекомендации</h2>
            ${tracks.slice(0, 5).map(track => `
                <div class="track-card">
                    <div class="track-title">${track.name}</div>
                    <div class="track-artist">${track.artist.name}</div>
                </div>
            `).join('')}
        `;
    }

    playTrack(videoId) {
        this.currentTrack = `https://www.youtube.com/watch?v=${videoId}`;
        document.getElementById('now-playing').textContent = 
            document.querySelector('.track-title').textContent;
        this.showNotification('Воспроизведение...');
    }

    async saveTrack() {
        if (!this.currentTrack) return;
        
        try {
            const trackTitle = document.getElementById('now-playing').textContent;
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
}

window.player = new MusicPlayer();