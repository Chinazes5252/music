const YOUTUBE_API_KEY = 'AIzaSyAso8Trmrorx190GJGPEHIjna-JCZZVe8E';
const LASTFM_API_KEY = '0bba9eec910cd08293cbbf6de26392fe';
const BOT_API_URL = 'https://77.79.183.74:8080/api/save';

class MusicPlayer {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('user_id');
        this.currentTrackIndex = 0;
        this.tracks = [];
        this.initPlayer();
        this.initUI();
        this.initEventListeners();
    }

    initPlayer() {
        this.player = document.createElement('audio');
        this.player.addEventListener('ended', () => this.playNext());
        document.body.appendChild(this.player);
    }

    initUI() {
        document.body.innerHTML = `
            <div class="glass-container">
                <header class="header">
                    <h1 class="logo">𖤐 FuckTheIndustry</h1>
                    <div class="search-box">
                        <input type="text" id="search-input" placeholder="Искать треки...">
                        <button id="search-btn"><i class="fas fa-search"></i></button>
                    </div>
                </header>
                
                <div class="player hidden">
                    <div id="now-playing">Выберите трек</div>
                    <div class="controls">
                        <button id="prev-btn" class="control-btn">⏮</button>
                        <button id="play-btn" class="control-btn">▶️</button>
                        <button id="next-btn" class="control-btn">⏭</button>
                        <button id="like-btn" class="control-btn">❤️</button>
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

        document.getElementById('like-btn').addEventListener('click', () => this.saveTrack());
        document.getElementById('play-btn').addEventListener('click', () => this.togglePlay());
        document.getElementById('prev-btn').addEventListener('click', () => this.playPrev());
        document.getElementById('next-btn').addEventListener('click', () => this.playNext());
    }

    async search() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        this.showLoader(true);
        
        try {
            const response = await fetch(
                `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&part=snippet&maxResults=10&regionCode=RU`
            );
            const data = await response.json();
            this.tracks = data.items;
            this.displayResults(data.items);
            document.querySelector('.player').classList.remove('hidden');

        } catch (error) {
            this.showError(`Ошибка: ${error.message}`);
        } finally {
            this.showLoader(false);
        }
    }

    displayResults(items) {
        const container = document.getElementById('results');
        container.innerHTML = items.map((item, index) => `
            <div class="track-card" data-index="${index}">
                <img src="${item.snippet.thumbnails.medium.url}" class="track-image">
                <div class="track-info">
                    <div class="track-title">${item.snippet.title}</div>
                    <div class="track-artist">${item.snippet.channelTitle}</div>
                </div>
                <button class="play-btn">▶️</button>
            </div>
        `).join('');

        document.querySelectorAll('.track-card').forEach(card => {
            card.addEventListener('click', () => {
                this.currentTrackIndex = parseInt(card.dataset.index);
                this.playTrack(this.tracks[this.currentTrackIndex]);
            });
        });
    }

    playTrack(track) {
        const videoId = track.id.videoId;
        this.player.src = `https://www.youtube.com/watch?v=${videoId}`;
        this.player.play();
        document.getElementById('now-playing').textContent = track.snippet.title;
        this.updateRecommendations(track);
    }

    async updateRecommendations(track) {
        try {
            const response = await fetch(
                `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${encodeURIComponent(track.snippet.channelTitle)}&track=${encodeURIComponent(track.snippet.title)}&api_key=${LASTFM_API_KEY}&format=json`
            );
            const data = await response.json();
            this.displayRecommendations(data.similartracks.track);
        } catch (error) {
            console.error('Ошибка рекомендаций:', error);
        }
    }

    playNext() {
        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.tracks.length;
        this.playTrack(this.tracks[this.currentTrackIndex]);
    }

    playPrev() {
        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.tracks.length) % this.tracks.length;
        this.playTrack(this.tracks[this.currentTrackIndex]);
    }

    togglePlay() {
        this.player.paused ? this.player.play() : this.player.pause();
    }

    async saveTrack() {
        const trackTitle = document.getElementById('now-playing').textContent;
        if (!trackTitle) return;

        try {
            await fetch(BOT_API_URL, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    user_id: this.userId,
                    query: trackTitle
                })
            });
            this.showNotification('🎵 Трек сохранен в боте!');
        } catch (error) {
            this.showError('❌ Ошибка сохранения');
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