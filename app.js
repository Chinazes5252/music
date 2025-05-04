class MusicPlayer {
    constructor() {
        this.userId = null;
        this.player = new Audio();
        this.initWebApp();
        this.initEventListeners();
    }

    initWebApp() {
        if (window.Telegram.WebApp.initDataUnsafe) {
            this.userId = Telegram.WebApp.initDataUnsafe.user.id;
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            this.loadRecommendations();
        }
    }

    initEventListeners() {
        document.getElementById('search-btn').addEventListener('click', () => this.search());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('save-btn')) {
                this.saveTrack(e.target.closest('.track-card').dataset.id);
            }
            if (e.target.classList.contains('play-btn')) {
                this.playTrack(e.target.dataset.id);
            }
        });
    }

    async search() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;
        
        this.showLoader();
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'X-Telegram-Init-Data': Telegram.WebApp.initData
                }
            });
            
            if (!response.ok) throw new Error(await response.text());
            this.displayResults(await response.json());
            
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoader();
        }
    }

    async playTrack(videoId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/stream?id=${videoId}`, {
                headers: {
                    'X-Telegram-Init-Data': Telegram.WebApp.initData
                }
            });
            this.player.src = await response.text();
            this.player.play();
        } catch (error) {
            this.showError('Ошибка воспроизведения');
        }
    }

    displayResults(items) {
        const container = document.getElementById('results');
        container.innerHTML = items.map(item => `
            <div class="track-card" data-id="${item.id}">
                <img src="${item.thumbnail}">
                <div class="track-info">
                    <h3>${item.title}</h3>
                    <p>${item.channel}</p>
                    <button class="play-btn" data-id="${item.id}">▶ Play</button>
                    <button class="save-btn">💾 Save</button>
                </div>
            </div>
        `).join('');
    }

    displayResults(items) {
        const container = document.getElementById('results');
        container.innerHTML = items.map(item => `
            <div class="track-card" data-id="${item.id.videoId}">
                <img src="${item.snippet.thumbnails.medium.url}">
                <div class="track-info">
                    <h3>${item.snippet.title}</h3>
                    <p>${item.snippet.channelTitle}</p>
                    <button class="play-btn" data-id="${item.id.videoId}">▶ Play</button>
                    <button class="save-btn">💾 Save</button>
                </div>
            </div>
        `).join('');

        // Добавляем обработчики для кнопок воспроизведения
        document.querySelectorAll('.play-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const videoId = btn.dataset.id;
                try {
                    const response = await fetch(`/api/stream?id=${videoId}`, {
                        headers: {
                            'X-Telegram-Init-Data': Telegram.WebApp.initData
                        }
                    });
                    const audioUrl = await response.text();
                    this.playTrack(audioUrl);
                } catch (error) {
                    this.showError('Ошибка воспроизведения');
                }
            });
        });
    }
    // Загрузка рекомендаций
    async loadRecommendations(track, artist) {
        try {
            const response = await fetch(`/api/recommendations?track=${encodeURIComponent(track)}&artist=${encodeURIComponent(artist)}`, {
                headers: {
                    'X-Telegram-Init-Data': window.Telegram.WebApp.initData
                }
            });
            
            const data = await response.json();
            this.displayRecommendations(data);
        } catch (error) {
            console.error('Ошибка рекомендаций:', error);
        }
    }

    // Отображение рекомендаций
    displayRecommendations(tracks) {
        const container = document.getElementById('recommendations');
        container.innerHTML = tracks.slice(0, 5).map(track => `
            <div class="track-card" data-id="${track.mbid || track.name}">
                <div class="track-info">
                    <h3>${track.name}</h3>
                    <p>${track.artist.name}</p>
                    <button class="save-btn">💾 Сохранить</button>
                </div>
            </div>
        `).join('');
    }

    // Сохранение трека
    async saveTrack(trackId) {
        try {
            const response = await fetch('/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Telegram-Init-Data': window.Telegram.WebApp.initData
                },
                body: JSON.stringify({
                    user_id: this.userId,
                    track_id: trackId
                })
            });

            const result = await response.json();
            
            if (result.status === 'saved') {
                this.showNotification('✅ Трек сохранен! Проверьте чат с ботом');
            } else {
                this.showNotification('⚠️ Трек уже в вашей библиотеке');
            }
        } catch (error) {
            this.showError('❌ Ошибка сохранения');
        }
    }

    // Уведомления
    showNotification(message) {
        Telegram.WebApp.showAlert(message);
    }

    // Показать ошибку
    showError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        document.body.appendChild(errorElement);
        setTimeout(() => errorElement.remove(), 3000);
    }

    // Воспроизведение трека
    playTrack(url) {
        this.player.src = url;
        this.player.play();
    }

    // Следующий трек
    playNext() {
        // Реализуйте логику плейлиста
    }
}

// Инициализация приложения
window.player = new MusicPlayer();