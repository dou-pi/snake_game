// 确保脚本在页面加载完成后执行
window.onload = function () {
    // 获取DOM元素
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const restartBtn = document.getElementById('restart-btn');

    // 响应式画布设置
    function resizeCanvas() {
        const container = document.querySelector('.game-container');
        const maxWidth = Math.min(window.innerWidth - 80, 600);
        const maxHeight = Math.min(window.innerHeight - 300, 600);

        // 根据屏幕大小调整格子大小
        if (window.innerWidth <= 768) {
            gridSize = Math.max(15, Math.floor(maxWidth / 20)); // 移动端最小15px
            canvas.width = gridSize * 20;
            canvas.height = gridSize * 20;
        } else {
            gridSize = Math.max(25, Math.floor(maxWidth / 20)); // 桌面端最小25px
            canvas.width = gridSize * 20;
            canvas.height = gridSize * 20;
        }

        tileCount = Math.floor(canvas.width / gridSize);
    }

    // 音效系统
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
let backgroundMusic;
let isMuted = false;

// 音频配置和管理
let audioConfig = null;
let currentAudioTheme = 'default';
let masterVolume = 0.5;
let backgroundMusicAudio = null;
let soundEffects = {};

// 创建音效（保留原有的createBeep函数作为回退）
function createBeep(frequency, duration, type = 'sine') {
    if (isMuted) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}
    // 加载音频配置
    // 修改 loadAudioConfig 函数，添加更好的错误处理
    async function loadAudioConfig() {
        try {
            const response = await fetch('audio/config.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            audioConfig = await response.json();
            
            // 预加载音效文件
            await preloadSoundEffects();
            
            // 从本地存储加载设置
            const savedAudioTheme = localStorage.getItem('snakeGameAudioTheme');
            const savedVolume = localStorage.getItem('snakeGameVolume');
            
            if (savedAudioTheme && audioConfig.backgroundMusic[savedAudioTheme]) {
                currentAudioTheme = savedAudioTheme;
                const audioThemeSelector = document.getElementById('audio-theme');
                if (audioThemeSelector) {
                    audioThemeSelector.value = savedAudioTheme;
                }
            }
            
            if (savedVolume) {
                masterVolume = parseFloat(savedVolume);
                const volumeControl = document.getElementById('volume-control');
                if (volumeControl) {
                    volumeControl.value = masterVolume * 100;
                }
            }
            
            console.log('音频配置加载成功');
            
        } catch (error) {
            console.warn('无法加载音频配置，使用默认音效:', error);
            // 如果加载失败，回退到原有的音效系统
            audioConfig = null;
            
            // 隐藏音频选择器（如果存在）
            const audioSelector = document.querySelector('.audio-selector');
            if (audioSelector) {
                audioSelector.style.display = 'none';
            }
        }
    }
    
    // 修改 preloadSoundEffects 函数，添加更好的错误处理
    async function preloadSoundEffects() {
        if (!audioConfig) return;
    
        const effects = audioConfig.soundEffects;
        const loadPromises = [];
    
        for (const [name, path] of Object.entries(effects)) {
            const loadPromise = new Promise((resolve) => {
                try {
                    const audio = new Audio(path);
                    audio.preload = 'auto';
                    
                    audio.addEventListener('canplaythrough', () => {
                        soundEffects[name] = audio;
                        console.log(`音效 ${name} 加载成功`);
                        resolve();
                    });
                    
                    audio.addEventListener('error', (e) => {
                        console.warn(`无法加载音效文件 ${name} (${path}):`, e);
                        resolve(); // 即使失败也继续
                    });
                    
                    // 设置超时
                    setTimeout(() => {
                        if (!soundEffects[name]) {
                            console.warn(`音效 ${name} 加载超时`);
                        }
                        resolve();
                    }, 5000);
                    
                } catch (error) {
                    console.warn(`无法创建音效 ${name}:`, error);
                    resolve();
                }
            });
            
            loadPromises.push(loadPromise);
        }
        
        await Promise.all(loadPromises);
        console.log('音效预加载完成');
    }
    
    // 修改 playBackgroundMusic 函数，添加更好的错误处理
    function playBackgroundMusic() {
        if (isMuted) return;
    
        // 停止当前背景音乐
        stopBackgroundMusic();
    
        if (audioConfig && audioConfig.backgroundMusic[currentAudioTheme]) {
            // 使用音频文件
            try {
                const musicPath = audioConfig.backgroundMusic[currentAudioTheme];
                backgroundMusicAudio = new Audio(musicPath);
                backgroundMusicAudio.loop = true;
                backgroundMusicAudio.volume = masterVolume * (audioConfig.settings.backgroundVolume || 0.3);
                
                backgroundMusicAudio.addEventListener('error', (e) => {
                    console.warn('背景音乐播放失败，使用默认音效:', e);
                    playDefaultBackgroundMusic();
                });
                
                backgroundMusicAudio.play().catch(e => {
                    console.warn('播放背景音乐失败，使用默认音效:', e);
                    playDefaultBackgroundMusic();
                });
                
            } catch (error) {
                console.warn('无法创建背景音乐，使用默认音效:', error);
                playDefaultBackgroundMusic();
            }
        } else {
            // 回退到原有的背景音乐系统
            playDefaultBackgroundMusic();
        }
    }

    // 原有的背景音乐系统（作为回退）
    function playDefaultBackgroundMusic() {
        if (isMuted) return;

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        const melody = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
        let noteIndex = 0;

        function playNote() {
            if (gameRunning && !gamePaused && !isMuted) {
                oscillator.frequency.setValueAtTime(melody[noteIndex], audioContext.currentTime);
                noteIndex = (noteIndex + 1) % melody.length;
                setTimeout(playNote, 800);
            }
        }

        oscillator.type = 'triangle';
        gainNode.gain.setValueAtTime(0.1 * masterVolume, audioContext.currentTime);

        oscillator.start();
        playNote();

        backgroundMusic = oscillator;
    }

    // 停止背景音乐
    function stopBackgroundMusic() {
        if (backgroundMusicAudio) {
            backgroundMusicAudio.pause();
            backgroundMusicAudio.currentTime = 0;
            backgroundMusicAudio = null;
        }

        if (backgroundMusic) {
            backgroundMusic.stop();
            backgroundMusic = null;
        }
    }

    // 播放音效的通用函数
function playSound(soundName) {
    if (isMuted) return;

    // 如果有预加载的音效文件，优先使用
    if (soundEffects[soundName]) {
        try {
            const audio = soundEffects[soundName].cloneNode();
            audio.volume = masterVolume * (audioConfig?.settings?.effectsVolume || 0.7);
            audio.play().catch(e => {
                console.warn(`播放音效 ${soundName} 失败:`, e);
                // 回退到默认音效
                playDefaultSound(soundName);
            });
        } catch (error) {
            console.warn(`无法播放音效 ${soundName}:`, error);
            playDefaultSound(soundName);
        }
    } else {
        // 回退到默认音效
        playDefaultSound(soundName);
    }
}

// 默认音效（使用 createBeep 函数）
function playDefaultSound(soundName) {
    if (isMuted) return;

    switch (soundName) {
        case 'eat':
            createBeep(800, 0.1);
            break;
        case 'death':
            createBeep(200, 0.5);
            break;
        case 'celebration':
            // 播放一系列音符作为庆祝音效
            createBeep(523, 0.2); // C
            setTimeout(() => createBeep(659, 0.2), 200); // E
            setTimeout(() => createBeep(784, 0.2), 400); // G
            setTimeout(() => createBeep(1047, 0.3), 600); // C
            break;
        default:
            createBeep(440, 0.1); // 默认音效
    }
}

    // 更新音效函数调用
    function playEatSound() {
        playSound('eat');
    }

    function playDeathSound() {
        playSound('death');
    }

    function playCelebrationSound() {
        playSound('celebration');
    }

    // 在 window.onload 函数末尾添加音频相关事件监听
    // 音频主题选择器
    const audioThemeSelector = document.getElementById('audio-theme');
    audioThemeSelector.addEventListener('change', (e) => {
        currentAudioTheme = e.target.value;
        localStorage.setItem('snakeGameAudioTheme', currentAudioTheme);

        // 如果正在播放背景音乐，重新开始播放新主题
        if (gameRunning && !gamePaused) {
            playBackgroundMusic();
        }
    });

    // 音量控制
    const volumeControl = document.getElementById('volume-control');
    volumeControl.addEventListener('input', (e) => {
        masterVolume = e.target.value / 100;
        localStorage.setItem('snakeGameVolume', masterVolume.toString());

        // 更新当前播放的背景音乐音量
        if (backgroundMusicAudio) {
            backgroundMusicAudio.volume = masterVolume * (audioConfig?.settings.backgroundVolume || 0.3);
        }
    });

    // 初始化音频系统
    loadAudioConfig();

    // 加载图像
    const foodImage = new Image();
    foodImage.src = 'images/food.png';

    const mouthImage = new Image();
    mouthImage.src = 'images/head.png';

    const bodyImage = new Image();
    bodyImage.src = 'images/food.png';

    const footImage = new Image();
    footImage.src = 'images/foot.png';

    // 游戏配置
    let gridSize = 25; // 默认网格大小，会根据屏幕调整
    let tileCount;
    let speed = 4; // 游戏速度
    let lastScoreCheckpoint = 0; // 用于检查分数里程碑

       // 游戏状态
    let gameRunning = false;
    let gamePaused = false;
    let gameOver = false;
    let score = 0;
    
    // 碰撞相关状态
    let collisionSegmentIndex = -1; // 被碰撞的身体部分索引
    let collisionTime = 0; // 碰撞时间
    let isCollisionEffect = false; // 是否正在显示碰撞效果

    // 蛇的初始位置和速度
    let snake = [
        { x: 5, y: 5 }
    ];
    let velocityX = 0;
    let velocityY = 0;

    // 食物位置
    let foodX;
    let foodY;

    // 游戏循环
    let gameInterval;

    // 初始化响应式设置
    resizeCanvas();
    window.addEventListener('resize', () => {
        resizeCanvas();
        if (!gameRunning) {
            initGame();
        }
    });

// 初始化游戏
    function initGame() {
        snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];
        velocityX = 0;
        velocityY = 0;
        score = 0;
        lastScoreCheckpoint = 0;
        scoreElement.textContent = score;
        gameOver = false;
        
        // 重置碰撞状态
        collisionSegmentIndex = -1;
        collisionTime = 0;
        isCollisionEffect = false;
        
        placeFood();

        // 清空画布并绘制初始状态
        drawBackground();

        // 绘制食物
        drawFood();

        // 绘制蛇
        drawSnake();

        // 绘制美化网格
        drawEnhancedGrid();
    }

    // 放置食物函数
    function placeFood() {
        do {
            foodX = Math.floor(Math.random() * tileCount);
            foodY = Math.floor(Math.random() * tileCount);
        } while (snake.some(segment => segment.x === foodX && segment.y === foodY));
    }

    // 移动蛇函数
    function moveSnake() {
        // 计算新的头部位置
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };

        // 边界处理 - 穿越边界
        if (head.x < 0) {
            head.x = tileCount - 1;
        } else if (head.x >= tileCount) {
            head.x = 0;
        }

        if (head.y < 0) {
            head.y = tileCount - 1;
        } else if (head.y >= tileCount) {
            head.y = 0;
        }

        // 将新头部添加到蛇的前面
        snake.unshift(head);
    }

  // 检查碰撞函数
    function checkCollision() {
        const head = snake[0];

        // 检查是否撞到自己的身体
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                console.log("碰撞检测：蛇头撞到身体");
                return i; // 返回被碰撞的身体部分索引
            }
        }

        return false;
    }

    // 暂停游戏函数
    function pauseGame() {
        if (!gameRunning || gameOver) return;

        if (gamePaused) {
            // 恢复游戏
            gamePaused = false;
            pauseBtn.textContent = '暂停';
            gameInterval = setInterval(drawGame, 1000 / speed);
            playBackgroundMusic();
        } else {
            // 暂停游戏
            gamePaused = true;
            pauseBtn.textContent = '继续';
            clearInterval(gameInterval);
            stopBackgroundMusic();
        }
    }

    // 重新开始游戏函数
    function restartGame() {
        // 停止当前游戏
        gameRunning = false;
        gamePaused = false;
        gameOver = false;
        clearInterval(gameInterval);
        stopBackgroundMusic();

        // 退出全屏模式（如果在全屏模式）
        if (isFullscreenMode) {
            exitFullscreenMode();
        }

        // 重置按钮状态
        startBtn.textContent = '开始游戏';
        pauseBtn.textContent = '暂停';
        pauseBtn.disabled = true;

        // 重新初始化游戏
        initGame();
    }

// 显示游戏结束函数
function displayGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = `${Math.floor(gridSize * 1.2)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - gridSize * 1.5);

    ctx.font = `${Math.floor(gridSize * 0.8)}px Arial`;
    ctx.fillText(`得分: ${score}`, canvas.width / 2, canvas.height / 2 - gridSize * 0.5);
    
    // 添加重新开始提示
    ctx.font = `${Math.floor(gridSize * 0.6)}px Arial`;
    ctx.fillText('按空格键重新开始', canvas.width / 2, canvas.height / 2 + gridSize);
    ctx.fillText('或点击"重新开始"按钮', canvas.width / 2, canvas.height / 2 + gridSize * 1.8);
}

    // 绘制美化背景
    // 在游戏配置部分添加主题相关变量
    let currentTheme = 'grass'; // 默认主题

    // 主题配置
    const themes = {
        grass: {
            background: {
                gradient: ['#1a4d1a', '#2d5a2d', '#1a4d1a'],
                texture: 'rgba(255, 255, 255, 0.01)' // 降低纹理亮度
            },
            grid: {
                line: 'rgba(76, 175, 80, 0.2)', // 降低网格线亮度
                highlight: 'rgba(76, 175, 80, 0.02)' // 大幅降低高光亮度
            }
        },
        dark: {
            background: {
                gradient: ['#0a0a0a', '#1a1a1a', '#0a0a0a'],
                texture: 'rgba(100, 100, 100, 0.01)'
            },
            grid: {
                line: 'rgba(100, 100, 100, 0.2)',
                highlight: 'rgba(100, 100, 100, 0.02)'
            }
        },
        ocean: {
            background: {
                gradient: ['#0066cc', '#004499', '#0066cc'],
                texture: 'rgba(255, 255, 255, 0.01)'
            },
            grid: {
                line: 'rgba(0, 150, 255, 0.2)',
                highlight: 'rgba(0, 150, 255, 0.02)'
            }
        },
        desert: {
            background: {
                gradient: ['#d2691e', '#cd853f', '#d2691e'],
                texture: 'rgba(255, 255, 255, 0.01)'
            },
            grid: {
                line: 'rgba(210, 180, 140, 0.2)',
                highlight: 'rgba(210, 180, 140, 0.02)'
            }
        },
        classic: {
            background: {
                gradient: ['#222222', '#333333', '#222222'],
                texture: 'rgba(255, 255, 255, 0.005)'
            },
            grid: {
                line: 'rgba(255, 255, 255, 0.1)',
                highlight: 'rgba(255, 255, 255, 0.01)'
            }
        }
    };

    // 修改 drawBackground 函数
    function drawBackground() {
        const theme = themes[currentTheme];

        // 创建渐变背景
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, theme.background.gradient[0]);
        gradient.addColorStop(0.5, theme.background.gradient[1]);
        gradient.addColorStop(1, theme.background.gradient[2]);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 添加纹理效果（降低亮度）
        ctx.fillStyle = theme.background.texture;
        for (let i = 0; i < canvas.width; i += 6) { // 增加间距，减少纹理密度
            for (let j = 0; j < canvas.height; j += 6) {
                if (Math.random() > 0.8) { // 降低纹理出现概率
                    ctx.fillRect(i, j, 1, 1); // 减小纹理点大小
                }
            }
        }
    }

    // 修改 drawEnhancedGrid 函数
    function drawEnhancedGrid() {
        const theme = themes[currentTheme];

        ctx.strokeStyle = theme.grid.line;
        ctx.lineWidth = 1;

        // 绘制垂直线
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvas.height);
            ctx.stroke();
        }

        // 绘制水平线
        for (let i = 0; i <= tileCount; i++) {
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvas.width, i * gridSize);
            ctx.stroke();
        }

        // 添加格子高光效果（大幅降低亮度）
        ctx.fillStyle = theme.grid.highlight;
        for (let x = 0; x < tileCount; x++) {
            for (let y = 0; y < tileCount; y++) {
                if ((x + y) % 2 === 0) {
                    ctx.fillRect(x * gridSize + 1, y * gridSize + 1, gridSize - 2, gridSize - 2);
                }
            }
        }
    }

    // 在 window.onload 函数末尾添加主题选择器事件监听
    const themeSelector = document.getElementById('background-theme');
    themeSelector.addEventListener('change', (e) => {
        currentTheme = e.target.value;
        // 保存主题选择到本地存储
        localStorage.setItem('snakeGameTheme', currentTheme);
        // 重新绘制游戏
        if (!gameRunning) {
            initGame();
        }
    });

    // 加载保存的主题
    const savedTheme = localStorage.getItem('snakeGameTheme');
    if (savedTheme && themes[savedTheme]) {
        currentTheme = savedTheme;
        themeSelector.value = savedTheme;
    }

    // 绘制食物
    function drawFood() {
        // 添加食物光晕效果
        // const gradient = ctx.createRadialGradient(
        //     foodX * gridSize + gridSize / 2, foodY * gridSize + gridSize / 2, 0,
        //     foodX * gridSize + gridSize / 2, foodY * gridSize + gridSize / 2, gridSize
        // );
        // gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        // gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

        // ctx.fillStyle = gradient;
        // ctx.fillRect(foodX * gridSize - 5, foodY * gridSize - 5, gridSize + 10, gridSize + 10);

        // 绘制食物图标
        if (foodImage.complete) {
            ctx.drawImage(foodImage, foodX * gridSize + 2, foodY * gridSize + 2, gridSize - 4, gridSize - 4);
        } else {
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(foodX * gridSize + 2, foodY * gridSize + 2, gridSize - 4, gridSize - 4);
        }
    }

       // 绘制蛇
    function drawSnake() {
        for (let i = 0; i < snake.length; i++) {
            const segment = snake[i];
            
            // 检查是否是被碰撞的身体部分
            const isCollisionSegment = isCollisionEffect && i === collisionSegmentIndex;

            if (i === 0) {
                // 绘制蛇头光晕
                const gradient = ctx.createRadialGradient(
                    segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, 0,
                    segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, gridSize
                );
                gradient.addColorStop(0, 'rgba(255, 100, 100, 0.3)');
                gradient.addColorStop(1, 'rgba(255, 100, 100, 0)');

                ctx.fillStyle = gradient;
                ctx.fillRect(segment.x * gridSize - 3, segment.y * gridSize - 3, gridSize + 6, gridSize + 6);

                // 绘制蛇头
                if (mouthImage.complete) {
                    ctx.save();
                    ctx.translate(segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2);

                    if (velocityX === 1) {
                        // 向右，不旋转
                    } else if (velocityX === -1) {
                        ctx.rotate(Math.PI);
                    } else if (velocityY === -1) {
                        ctx.rotate(-Math.PI / 2);
                    } else if (velocityY === 1) {
                        ctx.rotate(Math.PI / 2);
                    }

                    ctx.drawImage(mouthImage, -gridSize / 2 + 1, -gridSize / 2 + 1, gridSize - 2, gridSize - 2);
                    ctx.restore();
                } else {
                    ctx.fillStyle = '#FF6B6B';
                    ctx.fillRect(segment.x * gridSize + 2, segment.y * gridSize + 2, gridSize - 4, gridSize - 4);
                }
            } else if (i === snake.length - 1) {
                // 绘制蛇尾
                if (isCollisionSegment) {
                    // 绘制红光效果
                    const redGlow = ctx.createRadialGradient(
                        segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, 0,
                        segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, gridSize * 1.5
                    );
                    redGlow.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
                    redGlow.addColorStop(0.5, 'rgba(255, 0, 0, 0.4)');
                    redGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
                    
                    ctx.fillStyle = redGlow;
                    ctx.fillRect(segment.x * gridSize - gridSize / 2, segment.y * gridSize - gridSize / 2, gridSize * 2, gridSize * 2);
                }
                
                if (footImage.complete) {
                    ctx.save();
                    ctx.translate(segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2);

                    let prevSegment = snake[i - 1];
                    let directionX = segment.x - prevSegment.x;
                    let directionY = segment.y - prevSegment.y;

                    if (directionX === 1) {
                        ctx.rotate(Math.PI);
                    } else if (directionX === -1) {
                        // 不旋转
                    } else if (directionY === 1) {
                        ctx.rotate(-Math.PI / 2);
                    } else if (directionY === -1) {
                        ctx.rotate(Math.PI / 2);
                    }

                    ctx.drawImage(footImage, -gridSize / 2 + 1, -gridSize / 2 + 1, gridSize - 2, gridSize - 2);
                    ctx.restore();
                } else {
                    ctx.fillStyle = isCollisionSegment ? '#FF0000' : '#4ECDC4';
                    ctx.fillRect(segment.x * gridSize + 2, segment.y * gridSize + 2, gridSize - 4, gridSize - 4);
                }
            } else {
                // 绘制身体
                if (isCollisionSegment) {
                    // 绘制红光效果
                    const redGlow = ctx.createRadialGradient(
                        segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, 0,
                        segment.x * gridSize + gridSize / 2, segment.y * gridSize + gridSize / 2, gridSize * 1.5
                    );
                    redGlow.addColorStop(0, 'rgba(255, 0, 0, 0.8)');
                    redGlow.addColorStop(0.5, 'rgba(255, 0, 0, 0.4)');
                    redGlow.addColorStop(1, 'rgba(255, 0, 0, 0)');
                    
                    ctx.fillStyle = redGlow;
                    ctx.fillRect(segment.x * gridSize - gridSize / 2, segment.y * gridSize - gridSize / 2, gridSize * 2, gridSize * 2);
                }
                
                if (bodyImage.complete) {
                    ctx.drawImage(bodyImage, segment.x * gridSize + 2, segment.y * gridSize + 2, gridSize - 4, gridSize - 4);
                } else {
                    let alpha = 1 - (i / snake.length) * 0.5;
                    ctx.fillStyle = isCollisionSegment ? '#FF0000' : `rgba(76, 175, 80, ${alpha})`;
                    ctx.fillRect(segment.x * gridSize + 2, segment.y * gridSize + 2, gridSize - 4, gridSize - 4);
                }
            }
        }
    }

    // 开始游戏
    // 在文件开头添加全屏相关变量
    let isFullscreenMode = false;
    let exitButton;
    let gameInfoDisplay;

    // 修改 startGame 函数
    function startGame() {
        if (gameRunning) return;

        // 启用音频上下文
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }

        gameRunning = true;
        gamePaused = false;

        if (velocityX === 0 && velocityY === 0) {
            velocityX = 1;
            velocityY = 0;
        }

        // 进入全屏游戏模式
        enterFullscreenMode();

        gameInterval = setInterval(drawGame, 1000 / speed);

        // 播放背景音乐
        playBackgroundMusic();
    }

    // 添加进入全屏模式函数
    function enterFullscreenMode() {
        isFullscreenMode = true;
        document.body.classList.add('game-mode');

        // 创建退出按钮
        exitButton = document.createElement('button');
        exitButton.className = 'exit-fullscreen';
        exitButton.textContent = '退出游戏';
        exitButton.onclick = exitFullscreenMode;
        document.body.appendChild(exitButton);

        // 创建游戏信息显示
        gameInfoDisplay = document.createElement('div');
        gameInfoDisplay.className = 'game-info';
        updateGameInfo();
        document.body.appendChild(gameInfoDisplay);

        // 调整画布大小以适应全屏
        resizeCanvasForFullscreen();
    }

    // 添加退出全屏模式函数
    function exitFullscreenMode() {
        isFullscreenMode = false;
        document.body.classList.remove('game-mode');

        // 移除全屏元素
        if (exitButton) {
            document.body.removeChild(exitButton);
            exitButton = null;
        }

        if (gameInfoDisplay) {
            document.body.removeChild(gameInfoDisplay);
            gameInfoDisplay = null;
        }

        // 停止游戏
        if (gameRunning) {
            clearInterval(gameInterval);
            stopBackgroundMusic();
            gameRunning = false;
            gamePaused = false;
            startBtn.textContent = '开始游戏';
            pauseBtn.disabled = true;
        }

        // 恢复原始画布大小
        resizeCanvas();
        initGame();
    }

    // 添加全屏画布调整函数
    function resizeCanvasForFullscreen() {
        const maxWidth = Math.min(window.innerWidth * 0.9, 800);
        const maxHeight = Math.min(window.innerHeight * 0.9, 800);

        // 保持正方形比例
        const size = Math.min(maxWidth, maxHeight);

        if (window.innerWidth <= 768) {
            gridSize = Math.max(20, Math.floor(size / 20));
        } else {
            gridSize = Math.max(30, Math.floor(size / 20));
        }

        canvas.width = gridSize * 20;
        canvas.height = gridSize * 20;
        tileCount = 20;
    }

    // 添加更新游戏信息函数
    function updateGameInfo() {
        if (gameInfoDisplay) {
            gameInfoDisplay.innerHTML = `
                <div>分数: ${score}</div>
                <div>速度: ${speed}</div>
                <div>长度: ${snake.length}</div>
            `;
        }
    }

    function moveSnake() {
        // 计算新的头部位置
        const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };

        // 边界处理 - 穿越边界
        if (head.x < 0) {
            head.x = tileCount - 1;
        } else if (head.x >= tileCount) {
            head.x = 0;
        }

        if (head.y < 0) {
            head.y = tileCount - 1;
        } else if (head.y >= tileCount) {
            head.y = 0;
        }

        // 将新头部添加到蛇的前面
        snake.unshift(head);
    }

     // 修改 drawGame 函数，在分数更新时同步更新全屏信息
    function drawGame() {
        if (gameOver) {
            displayGameOver();
            return;
        }

        moveSnake();

        const collisionResult = checkCollision();
        if (collisionResult !== false) {
            console.log("游戏结束：检测到碰撞");
            
            // 设置碰撞效果
            collisionSegmentIndex = collisionResult;
            isCollisionEffect = true;
            collisionTime = Date.now();
            
            // 播放死亡音效
            playDeathSound();
            
            // 停止游戏循环，但不立即显示游戏结束
            gameRunning = false;
            clearInterval(gameInterval);
            stopBackgroundMusic();
            
            // 1秒后显示游戏结束
            setTimeout(() => {
                gameOver = true;
                isCollisionEffect = false;
                
                // 如果在全屏模式，显示全屏游戏结束界面
                if (isFullscreenMode) {
                    displayFullscreenGameOver();
                } else {
                    startBtn.textContent = '开始游戏';
                    pauseBtn.disabled = true;
                    displayGameOver();
                }
            }, 1000);
            
            // 继续绘制一次以显示红光效果
            drawBackground();
            drawFood();
            drawSnake();
            drawEnhancedGrid();
            return;
        }

        // 清空画布并绘制背景
        drawBackground();

        // 检查是否吃到食物
        if (snake[0].x === foodX && snake[0].y === foodY) {
            score += 10;

            // 更新分数显示
            if (isFullscreenMode) {
                updateGameInfo();
            } else {
                scoreElement.textContent = score;
            }

            // 播放吃食物音效
            playEatSound();

            // 检查分数里程碑（每100分）
            if (Math.floor(score / 100) > Math.floor(lastScoreCheckpoint / 100)) {
                playCelebrationSound();
            }
            lastScoreCheckpoint = score;

            placeFood();

            // 每得100分增加速度
            if (score % 100 === 0) {
                speed += 1;
                clearInterval(gameInterval);
                gameInterval = setInterval(drawGame, 1000 / speed);
                updateGameInfo(); // 更新速度显示
            }
        } else {
            snake.pop();
        }

        // 绘制游戏元素
        drawFood();
        drawSnake();
        drawEnhancedGrid();
    }

// 添加全屏游戏结束显示函数
function displayFullscreenGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = 'white';
    ctx.font = `${Math.floor(gridSize * 1.5)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - gridSize * 2.5);

    ctx.font = `${Math.floor(gridSize * 1)}px Arial`;
    ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 - gridSize);

    ctx.font = `${Math.floor(gridSize * 0.8)}px Arial`;
    ctx.fillText('按空格键重新开始', canvas.width / 2, canvas.height / 2 + gridSize * 0.5);
    ctx.fillText('按ESC键退出游戏', canvas.width / 2, canvas.height / 2 + gridSize * 1.5);
}

// 修改键盘控制，添加游戏结束时重新开始功能
document.addEventListener('keydown', (e) => {
    // ESC键退出全屏模式
    if (e.key === 'Escape' && isFullscreenMode) {
        exitFullscreenMode();
        return;
    }

    // 游戏结束时按空格键重新开始
    if (gameOver && (e.key === ' ' || e.code === 'Space')) {
        if (isFullscreenMode) {
            // 全屏模式下重新开始
            gameOver = false;
            gameRunning = true;
            gamePaused = false;
            
            // 重新初始化游戏状态
            snake = [{ x: Math.floor(tileCount / 2), y: Math.floor(tileCount / 2) }];
            velocityX = 1;
            velocityY = 0;
            score = 0;
            lastScoreCheckpoint = 0;
            speed = 4;
            placeFood();
            
            // 更新游戏信息显示
            updateGameInfo();
            
            // 重新开始游戏循环
            gameInterval = setInterval(drawGame, 1000 / speed);
            playBackgroundMusic();
        } else {
            // 普通模式下重新开始
            restartGame();
            startGame();
        }
        e.preventDefault();
        return;
    }

    if (!gameRunning || gamePaused || gameOver) {
        if (e.key === ' ' || e.code === 'Space') {
            if (!gameRunning && !gameOver && !isFullscreenMode) {
                startGame();
            } else if (gameRunning && !gameOver) {
                pauseGame();
            }
            e.preventDefault();
        }
        return;
    }

        switch (e.key) {
            case 'ArrowUp':
                if (velocityY !== 1) {
                    velocityX = 0;
                    velocityY = -1;
                }
                break;
            case 'ArrowDown':
                if (velocityY !== -1) {
                    velocityX = 0;
                    velocityY = 1;
                }
                break;
            case 'ArrowLeft':
                if (velocityX !== 1) {
                    velocityX = -1;
                    velocityY = 0;
                }
                break;
            case 'ArrowRight':
                if (velocityX !== -1) {
                    velocityX = 1;
                    velocityY = 0;
                }
                break;
            case ' ':
            case 'Space':
                pauseGame();
                break;
            case 'm':
            case 'M':
                // 静音切换
                isMuted = !isMuted;
                if (isMuted) {
                    stopBackgroundMusic();
                }
                break;
        }

        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // 按钮事件监听
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    restartBtn.addEventListener('click', restartGame);

    // 移动端触摸控制
    let touchStartX = 0;
    let touchStartY = 0;

    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, false);

    canvas.addEventListener('touchmove', (e) => {
        if (!gameRunning || gamePaused || gameOver) return;

        e.preventDefault();

        const touchEndX = e.touches[0].clientX;
        const touchEndY = e.touches[0].clientY;

        const dx = touchEndX - touchStartX;
        const dy = touchEndY - touchStartY;

        if (Math.abs(dx) > Math.abs(dy)) {
            if (dx > 0 && velocityX !== -1) {
                velocityX = 1;
                velocityY = 0;
            } else if (dx < 0 && velocityX !== 1) {
                velocityX = -1;
                velocityY = 0;
            }
        } else {
            if (dy > 0 && velocityY !== -1) {
                velocityX = 0;
                velocityY = 1;
            } else if (dy < 0 && velocityY !== 1) {
                velocityX = 0;
                velocityY = -1;
            }
        }

        touchStartX = touchEndX;
        touchStartY = touchEndY;
    }, false);

    pauseBtn.disabled = true;
    initGame();
};