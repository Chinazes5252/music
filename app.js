const BOT_API_URL = 'https://77.79.183.74:8080/api/save';

class MusicPlayer {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('user_id');
        this.currentTrack = null;
        this.player = null;
        this.initUI();
        this.initEventListeners();
        this.initYouTubePlayer();
    }

    initUI() {
        document.body.innerHTML = `
            <div class="glass-container">
                <header class="header">
                    <h1 class="logo">𖤐FuckTheIndustry</h1>
                    <div class="search-box">
                        <input type="text" id="search-input" placeholder="Поиск треков...">
                        <button id="search-btn" class="glass-button">
                            <i class="fas fa-search"></i>
                        </button>
                    </div>
                </header>
                
                <div id="player-container"></div>
                
                <div class="section">
                    <h2 class="section-title">Результаты поиска</h2>
                    <div class="track-list" id="results"></div>
                </div>
                
                <div class="section">
                    <h2 class="section-title">Рекомендации</h2>
                    <div class="track-list" id="recommendations"></div>
                </div>
                
                <div id="loader" class="loader hidden"></div>
            </div>
        `;
    }

    initYouTubePlayer() {
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        window.onYouTubeIframeAPIReady = () => {
            this.player = new YT.Player('player-container', {
                height: '0',
                width: '0',
                events: {
                    'onReady': () => console.log('Player ready'),
                    'onStateChange': this.onPlayerStateChange.bind(this)
                }
            });
        };
    }

    onPlayerStateChange(event) {
        if (event.data === YT.PlayerState.ENDED) {
            this.playNextRecommendation();
        }
    }

    async search() {
        const input = document.getElementById('search-input');
        const query = input.value.trim();
        if (!query) return;

        this.showLoader(true);
        
        try {
            const response = await fetch(`${API_BASE}/api/youtube?q=${encodeURIComponent(query)}`);
            const data = await response.json();
            this.displayResults(data);
            
            if (data[0]) {
                const firstTrack = data[0].snippet;
                this.loadRecommendations(firstTrack.title, firstTrack.channelTitle);
            }
        } catch (error) {
            this.showError('Ошибка поиска');
        } finally {
            this.showLoader(false);
        }
    }

    async loadRecommendations(track, artist) {
        try {
            const response = await fetch(
                `${API_BASE}/api/lastfm?track=${encodeURIComponent(track)}&artist=${encodeURIComponent(artist)}`
            );
            const data = await response.json();
            this.displayRecommendations(data);
        } catch (error) {
            console.error('Ошибка рекомендаций:', error);
        }
    }

    displayResults(items) {
        const container = document.getElementById('results');
        container.innerHTML = items.map(item => `
            <div class="track-card" data-id="${item.id.videoId}">
                <img src="${item.snippet.thumbnails.medium.url}" 
                     class="track-artwork"
                     alt="${item.snippet.title}">
                <div class="track-info">
                    <h3 class="track-title">${item.snippet.title}</h3>
                    <p class="track-artist">${item.snippet.channelTitle}</p>
                </div>
                <button class="track-action" data-action="play">
                    <i class="fas fa-play"></i>
                </button>
                <button class="track-action" data-action="save">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        `).join('');

        // Обработчики событий
        document.querySelectorAll('[data-action="play"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const videoId = btn.closest('.track-card').dataset.id;
                this.playTrack(videoId);
            });
        });

        document.querySelectorAll('[data-action="save"]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const videoId = btn.closest('.track-card').dataset.id;
                await this.saveTrack(videoId);
            });
        });
    }

    playTrack(videoId) {
        this.player.loadVideoById(videoId);
        this.player.playVideo();
    }

    async saveTrack(videoId) {
        try {
            await fetch(`${API_BASE}/api/save`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: this.userId,
                    track_id: videoId
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