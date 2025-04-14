const YOUTUBE_API_KEY = 'AIzaSyAso8Trmrorx190GJGPEHIjna-JCZZVe8E';
const LASTFM_API_KEY = '0bba9eec910cd08293cbbf6de26392fe';
const BOT_API_URL = 'http://localhost:8080/api/save';

class MusicPlayer {
    constructor() {
        this.userId = new URLSearchParams(window.location.search).get('user_id');
        this.player = document.createElement('audio');
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
                
                <div class="player">
                    <div id="now-playing"></div>
                    <div class="controls">
                        <button id="play-btn">▶️</button>
                        <button id="like-btn">❤️</button>
                    </div>
                    <progress id="progress" value="0" max="100"></progress>
                </div>

                <div class="track-list" id="results"></div>
                <div id="loader" class="loader hidden"></div>
            </div>
        `;
        document.body.appendChild(this.player);
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
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        this.showLoader(true);
        
        try {
            // YouTube Search
            const youtubeResponse = await fetch(
                `https://www.googleapis.com/youtube/v3/search?q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&part=snippet&maxResults=5&regionCode=RU`
            );
            const youtubeData = await youtubeResponse.json();
            this.displayResults(youtubeData.items);

            // Last.fm Recommendations
            if (youtubeData.items[0]) {
                const track = youtubeData.items[0].snippet.title;
                const artist = youtubeData.items[0].snippet.channelTitle;
                const lastfmResponse = await fetch(
                    `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${encodeURIComponent(artist)}&track=${encodeURIComponent(track)}&api_key=${LASTFM_API_KEY}&format=json`
                );
                const lastfmData = await lastfmResponse.json();
                this.displayRecommendations(lastfmData.similartracks.track);
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

        document.querySelectorAll('.track-card').forEach(card => {
            card.addEventListener('click', () => {
                const videoId = card.dataset.id;
                this.playTrack(videoId);
            });
        });
    }

    playTrack(videoId) {
        this.player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        document.getElementById('now-playing').textContent = 
            document.querySelector('.track-title').textContent;
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
            this.showNotification('Трек сохранен в боте!');
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