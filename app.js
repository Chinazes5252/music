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
                        <input type="text" id="search-input" placeholder="Искать треки...">
                        <button id="search-btn"><i class="fas fa-search"></i></button>
                    </div>
                </header>
                
                <div class="player-container">
                    <div class="track-list" id="results"></div>
                    <div class="now-playing" id="player"></div>
                </div>
            </div>
        `;
    }

    initEventListeners() {
        document.getElementById('search-btn').addEventListener('click', () => this.search());
        document.getElementById('search-input').addEventListener('keypress', e => {
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
            // Поиск треков
            const youtubeResponse = await fetch(`${BOT_API_URL}/api/youtube?q=${encodeURIComponent(query)}`);
            const youtubeData = await youtubeResponse.json();
            this.displayResults(youtubeData.items);
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
}

window.player = new MusicPlayer();
