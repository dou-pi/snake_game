// 确保脚本在页面加载完成后执行
window.onload = function() {
    // 获取DOM元素
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const scoreElement = document.getElementById('score');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const restartBtn = document.getElementById('restart-btn');
    
    // 加载图像
    const durianImage = new Image();
    durianImage.src = 'images/durian.svg';
    
    const mouthImage = new Image();
    mouthImage.src = 'images/mouth.svg';

    // 游戏配置
    const gridSize = 20; // 网格大小
    const tileCount = canvas.width / gridSize; // 网格数量
    let speed = 6; // 游戏速度

    // 游戏状态
    let gameRunning = false;
    let gamePaused = false;
    let gameOver = false;
    let score = 0;

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

    // 初始化游戏
    function initGame() {
        snake = [{ x: 5, y: 5 }];
        velocityX = 0;
        velocityY = 0;
        score = 0;
        scoreElement.textContent = score;
        gameOver = false;
        placeFood();
        
        // 清空画布并绘制初始状态
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制食物（榴莲图标）
        if (durianImage.complete) {
            ctx.drawImage(durianImage, foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2);
        } else {
            // 如果图像未加载完成，使用备用颜色
            ctx.fillStyle = '#8B7500';
            ctx.fillRect(foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2);
        }
        
        // 绘制蛇
        ctx.fillStyle = '#00cc00';
        ctx.fillRect(snake[0].x * gridSize, snake[0].y * gridSize, gridSize - 2, gridSize - 2);
        
        // 绘制网格
        drawGrid();
    }

    // 开始游戏
    function startGame() {
        if (gameRunning) return;
        gameRunning = true;
        gamePaused = false;
        
        // 设置初始移动方向（向右）
        if (velocityX === 0 && velocityY === 0) {
            velocityX = 1;
            velocityY = 0;
        }
        
        gameInterval = setInterval(drawGame, 1000 / speed);
        startBtn.textContent = '游戏中';
        pauseBtn.disabled = false;
    }

    // 暂停游戏
    function pauseGame() {
        if (!gameRunning || gameOver) return;
        
        if (gamePaused) {
            gamePaused = false;
            gameInterval = setInterval(drawGame, 1000 / speed);
            pauseBtn.textContent = '暂停';
        } else {
            gamePaused = true;
            clearInterval(gameInterval);
            pauseBtn.textContent = '继续';
            // 在画布上显示暂停文本
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('游戏暂停', canvas.width / 2, canvas.height / 2);
        }
    }

    // 重新开始游戏
    function restartGame() {
        clearInterval(gameInterval);
        gameRunning = false;
        gamePaused = false;
        startBtn.textContent = '开始游戏';
        pauseBtn.textContent = '暂停';
        pauseBtn.disabled = true;
        initGame();
    }

    // 随机放置食物
    function placeFood() {
        // 确保食物不会出现在蛇身上
        let validPosition = false;
        while (!validPosition) {
            foodX = Math.floor(Math.random() * tileCount);
            foodY = Math.floor(Math.random() * tileCount);
            
            validPosition = true;
            // 检查是否与蛇身重叠
            for (let i = 0; i < snake.length; i++) {
                if (snake[i].x === foodX && snake[i].y === foodY) {
                    validPosition = false;
                    break;
                }
            }
        }
    }

    // 绘制游戏
    function drawGame() {
        if (gameOver) {
            displayGameOver();
            return;
        }

        // 移动蛇
        moveSnake();

        // 检查碰撞
        if (checkCollision()) {
            gameOver = true;
            gameRunning = false;
            clearInterval(gameInterval);
            startBtn.textContent = '开始游戏';
            pauseBtn.disabled = true;
            displayGameOver();
            return;
        }

        // 清空画布
        ctx.fillStyle = '#222';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // 检查是否吃到食物
        if (snake[0].x === foodX && snake[0].y === foodY) {
            // 增加分数
            score += 10;
            scoreElement.textContent = score;
            
            // 不移除蛇尾，让蛇变长
            // 放置新的食物
            placeFood();
            
            // 每得100分增加速度
            if (score % 100 === 0) {
                speed += 1;
                clearInterval(gameInterval);
                gameInterval = setInterval(drawGame, 1000 / speed);
            }
        } else {
            // 移除蛇尾
            snake.pop();
        }

        // 绘制食物（榴莲图标）
        if (durianImage.complete) {
            ctx.drawImage(durianImage, foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2);
        } else {
            // 如果图像未加载完成，使用备用颜色
            ctx.fillStyle = '#8B7500';
            ctx.fillRect(foodX * gridSize, foodY * gridSize, gridSize - 2, gridSize - 2);
        }

        // 绘制蛇
        for (let i = 0; i < snake.length; i++) {
            if (i === 0) {
                // 绘制蛇头（嘴巴图标）
                if (mouthImage.complete) {
                    // 保存当前状态
                    ctx.save();
                    // 移动到蛇头位置
                    ctx.translate(snake[i].x * gridSize + (gridSize-2)/2, snake[i].y * gridSize + (gridSize-2)/2);
                    
                    // 根据移动方向旋转嘴巴
                    if (velocityX === 1) { // 向右
                        // 默认方向，不需要旋转
                    } else if (velocityX === -1) { // 向左
                        ctx.rotate(Math.PI); // 旋转180度
                    } else if (velocityY === -1) { // 向上
                        ctx.rotate(-Math.PI/2); // 旋转-90度
                    } else if (velocityY === 1) { // 向下
                        ctx.rotate(Math.PI/2); // 旋转90度
                    }
                    
                    // 绘制嘴巴图标
                    ctx.drawImage(mouthImage, -(gridSize-2)/2, -(gridSize-2)/2, gridSize-2, gridSize-2);
                    
                    // 恢复状态
                    ctx.restore();
                } else {
                    // 如果图像未加载完成，使用备用颜色
                    ctx.fillStyle = '#FF9999';
                    ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
                }
            } else {
                // 蛇身体部分
                ctx.fillStyle = '#00ff00';
                // 渐变色效果
                let alpha = 1 - (i / snake.length) * 0.6;
                ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                ctx.fillRect(snake[i].x * gridSize, snake[i].y * gridSize, gridSize - 2, gridSize - 2);
            }
        }

        // 绘制网格线（可选）
        drawGrid();
    }

    // 移动蛇
    function moveSnake() {
        // 创建新的蛇头
        let newX = snake[0].x + velocityX;
        let newY = snake[0].y + velocityY;
        
        // 穿越边界处理
        // 如果超出右边界，从左边出来
        if (newX >= tileCount) {
            newX = 0;
        }
        // 如果超出左边界，从右边出来
        else if (newX < 0) {
            newX = tileCount - 1;
        }
        
        // 如果超出下边界，从上边出来
        if (newY >= tileCount) {
            newY = 0;
        }
        // 如果超出上边界，从下边出来
        else if (newY < 0) {
            newY = tileCount - 1;
        }
        
        const head = { x: newX, y: newY };
        // 将新蛇头添加到蛇身数组的开头
        snake.unshift(head);
    }

    // 检查碰撞
    function checkCollision() {
        // 不再检查边界碰撞，因为蛇可以穿越边界
        
        // 只检查是否撞到自己（从第二个身体部分开始检查）
        for (let i = 1; i < snake.length; i++) {
            if (snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
                return true;
            }
        }

        return false;
    }

    // 显示游戏结束
    function displayGameOver() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', canvas.width / 2, canvas.height / 2 - 20);
        
        ctx.font = '20px Arial';
        ctx.fillText(`最终得分: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        
        ctx.font = '16px Arial';
        ctx.fillText('按"重新开始"按钮再玩一次', canvas.width / 2, canvas.height / 2 + 60);
    }

    // 绘制网格线
    function drawGrid() {
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 0.5;
        
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
    }

    // 键盘控制
    document.addEventListener('keydown', (e) => {
        // 如果游戏未运行或已暂停，不响应方向键
        if (!gameRunning || gamePaused || gameOver) {
            // 如果按下空格键，可以开始或暂停游戏
            if (e.key === ' ' || e.code === 'Space') {
                if (!gameRunning && !gameOver) {
                    startGame();
                } else if (gameRunning && !gameOver) {
                    pauseGame();
                }
                e.preventDefault();
            }
            return;
        }

        // 防止蛇反向移动（不能直接掉头）
        switch (e.key) {
            case 'ArrowUp':
                if (velocityY !== 1) { // 如果不是向下移动
                    velocityX = 0;
                    velocityY = -1;
                }
                break;
            case 'ArrowDown':
                if (velocityY !== -1) { // 如果不是向上移动
                    velocityX = 0;
                    velocityY = 1;
                }
                break;
            case 'ArrowLeft':
                if (velocityX !== 1) { // 如果不是向右移动
                    velocityX = -1;
                    velocityY = 0;
                }
                break;
            case 'ArrowRight':
                if (velocityX !== -1) { // 如果不是向左移动
                    velocityX = 1;
                    velocityY = 0;
                }
                break;
            // 空格键暂停/继续游戏
            case ' ':
            case 'Space':
                pauseGame();
                break;
        }
        
        // 防止方向键滚动页面
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Space'].includes(e.key)) {
            e.preventDefault();
        }
    });

    // 按钮事件监听
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    restartBtn.addEventListener('click', restartGame);

    // 移动端触摸控制（可选）
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
        
        // 确定滑动方向（水平或垂直）
        if (Math.abs(dx) > Math.abs(dy)) {
            // 水平滑动
            if (dx > 0 && velocityX !== -1) { // 向右滑动且不是向左移动
                velocityX = 1;
                velocityY = 0;
            } else if (dx < 0 && velocityX !== 1) { // 向左滑动且不是向右移动
                velocityX = -1;
                velocityY = 0;
            }
        } else {
            // 垂直滑动
            if (dy > 0 && velocityY !== -1) { // 向下滑动且不是向上移动
                velocityX = 0;
                velocityY = 1;
            } else if (dy < 0 && velocityY !== 1) { // 向上滑动且不是向下移动
                velocityX = 0;
                velocityY = -1;
            }
        }
        
        // 更新触摸起始位置
        touchStartX = touchEndX;
        touchStartY = touchEndY;
    }, false);

    // 禁用暂停按钮，直到游戏开始
    pauseBtn.disabled = true;

    // 初始化游戏
    initGame();
};