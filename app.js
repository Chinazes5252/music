class MusicPlayer {
    constructor() {
        this.userId = null;
        this.currentTrack = null;
        this.player = null;
        this.initWebApp();
        this.initPlayer();
        this.initEventListeners();
    }

    // Инициализация Telegram Web App
    initWebApp() {
        if (window.Telegram.WebApp.initDataUnsafe) {
            this.userId = Telegram.WebApp.initDataUnsafe.user.id;
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
            this.loadRecommendations();
        }
    }

    // Инициализация аудио плеера
    initPlayer() {
        this.player = new Audio();
        this.player.addEventListener('ended', () => this.playNext());
    }

    // Настройка обработчиков событий
    initEventListeners() {
        // Поиск
        document.getElementById('search-btn').addEventListener('click', () => this.search());
        document.getElementById('search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.search();
        });

        // Сохранение треков
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('save-btn')) {
                const trackId = e.target.closest('.track-card').dataset.id;
                this.saveTrack(trackId);
            }
        });
    }

    // Основной метод поиска
    async search() {
        const query = document.getElementById('search-input').value.trim();
        if (!query) return;

        try {
            const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
                headers: {
                    'X-Telegram-Init-Data': window.Telegram.WebApp.initData
                }
            });
            
            if (!response.ok) throw new Error('Ошибка поиска');
            
            const data = await response.json();
            this.displayResults(data);
            
            if(data[0]) {
                const track = data[0].snippet;
                this.loadRecommendations(track.title, track.channelTitle);
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    // Отображение результатов поиска
    displayResults(items) {
        const container = document.getElementById('results');
        container.innerHTML = items.map(item => `
            <div class="track-card" data-id="${item.id.videoId}">
                <img src="${item.snippet.thumbnails.medium.url}" class="track-image">
                <div class="track-info">
                    <h3>${item.snippet.title}</h3>
                    <p>${item.snippet.channelTitle}</p>
                    <button class="save-btn">💾 Сохранить</button>
                </div>
            </div>
        `).join('');
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