// ---------------------
// 1. 初始化 & 常量配置
// ---------------------
const CELL_SIZE = 40;
const GRID_WIDTH = 20;
const GRID_HEIGHT = 15;
const CANVAS_WIDTH = CELL_SIZE * GRID_WIDTH;
const CANVAS_HEIGHT = CELL_SIZE * GRID_HEIGHT;
const FPS = 5;  // 帧率

// 跟之前的颜色对应（RGB）
const COLORS = {
  background: 'rgb(218, 41, 28)',
  snake: 'rgb(255, 199, 44)',
  grid: 'rgb(60, 65, 72)',
  text: 'rgb(255, 255, 255)'
};

// 方向键映射：键码 -> [x方向, y方向]
const DIRECTIONS = {
  ArrowUp: [0, -1],
  ArrowDown: [0, 1],
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0]
};

let snake; // 蛇对象
let food;  // 食物对象
let score;
let running = true;

// 获取 Canvas 并设定尺寸
const canvas = document.getElementById('gameCanvas');
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;
const ctx = canvas.getContext('2d');

// 获取游戏结束界面的 DOM
const gameOverOverlay = document.getElementById('gameOverOverlay');
const scoreDisplay = document.getElementById('scoreDisplay');

// ---------------------
// 2. 蛇 & 食物 类
// ---------------------
class Snake {
  constructor() {
    // 初始蛇位置
    this.body = [ { x: Math.floor(GRID_WIDTH / 2), y: Math.floor(GRID_HEIGHT / 2) } ];
    this.direction = { x: 1, y: 0 };
    this.grow = false;
  }

  // 移动蛇
  move() {
    const head = this.body[0];
    const newHead = {
      x: head.x + this.direction.x,
      y: head.y + this.direction.y
    };
    this.body.unshift(newHead);
    if (!this.grow) {
      this.body.pop();
    }
    this.grow = false;
  }
}

class Food {
  constructor(snakeBody) {
    // 随机挑一张图片
    this.img = randomFoodImage();
    // 随机生成一个不与蛇重叠的位置
    let validPosFound = false;
    while (!validPosFound) {
      const rx = Math.floor(Math.random() * GRID_WIDTH);
      const ry = Math.floor(Math.random() * GRID_HEIGHT);
      if (!snakeBody.some(segment => segment.x === rx && segment.y === ry)) {
        this.position = { x: rx, y: ry };
        validPosFound = true;
      }
    }
  }
}

// ---------------------
// 3. 加载图片资源
// ---------------------
// 由于浏览器中只能用 <img> 对象，先加载：
const foodImages = [
  'assets/foods/ice-cream.png',
  'assets/foods/potato-cake.png',
  'assets/foods/hamburger.png',
  'assets/foods/chips.png'
];
let loadedImages = [];

function loadAllImages() {
  return new Promise((resolve, reject) => {
    let count = 0;
    foodImages.forEach(src => {
      const image = new Image();
      image.src = src;
      image.onload = () => {
        loadedImages.push(image);
        count++;
        if (count === foodImages.length) {
          resolve();
        }
      };
      image.onerror = (e) => {
        console.error("Image load error:", src);
        reject(e);
      }
    });
  });
}

// 随机选择图片
function randomFoodImage() {
  return loadedImages[Math.floor(Math.random() * loadedImages.length)];
}

// ---------------------
// 4. 游戏初始化
// ---------------------
function initGame() {
  snake = new Snake();
  food = new Food(snake.body);
  score = 0;
  running = true;

  // 播放背景音乐
  playBgMusic();
}

// ---------------------
// 5. 游戏主循环
// ---------------------
function gameLoop() {
  if (!running) return;

  // 逻辑更新
  snake.move();

  const head = snake.body[0];
  // 撞墙检测
  if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
    running = false;
    showGameOver();
    return;
  }
  // 撞自身检测
  for (let i = 1; i < snake.body.length; i++) {
    if (snake.body[i].x === head.x && snake.body[i].y === head.y) {
      running = false;
      showGameOver();
      return;
    }
  }
  // 吃食物
  if (head.x === food.position.x && head.y === food.position.y) {
    snake.grow = true;
    score++;
    food = new Food(snake.body);
  }

  // 渲染画面
  drawScene();

  // 定时下一帧
  setTimeout(() => {
    requestAnimationFrame(gameLoop);
  }, 1000 / FPS);
}

// ---------------------
// 6. 绘制相关函数
// ---------------------
function drawScene() {
  // 清空背景
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 画网格（可选，想节约性能可以去掉）
  drawGrid();

  // 画食物
  drawFood();

  // 画蛇
  drawSnake();

  // 画分数
  ctx.fillStyle = COLORS.text;
  ctx.font = "24px Arial";
  ctx.fillText(`Score: ${score}`, 10, 30);
}

function drawGrid() {
  ctx.strokeStyle = COLORS.grid;
  for (let x = 0; x <= CANVAS_WIDTH; x += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

function drawFood() {
  // food.position.x/y 是格子坐标 => 转换到像素
  const pixelX = food.position.x * CELL_SIZE;
  const pixelY = food.position.y * CELL_SIZE;
  // 绘制图片
  ctx.drawImage(food.img, pixelX, pixelY, CELL_SIZE, CELL_SIZE);
}

function drawSnake() {
  ctx.fillStyle = COLORS.snake;
  snake.body.forEach((segment) => {
    const pixelX = segment.x * CELL_SIZE;
    const pixelY = segment.y * CELL_SIZE;
    // 画矩形
    ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
    // 画黑色分界线
    ctx.strokeStyle = 'black';
    ctx.strokeRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
  });
}

// ---------------------
// 7. 播放音乐
// ---------------------
function playBgMusic() {
  // 在浏览器中自动播放音乐可能会被限制，需要用户交互后才生效
  // 所以可以在页面点击或 keydown 时再触发
  let audio = new Audio('assets/sounds/麦当劳大农场.mp3');
  audio.loop = true;
  audio.play().catch(err => {
    console.log("Audio play failed (need user gesture).", err);
  });
}

// ---------------------
// 8. 游戏结束逻辑
// ---------------------
function showGameOver() {
  // 显示 Overlay
  scoreDisplay.textContent = `Score: ${score}`;
  gameOverOverlay.style.display = 'block';
}

// ---------------------
// 9. 键盘事件处理
// ---------------------
window.addEventListener('keydown', (e) => {
  // 如果蛇还在跑，处理方向变化
  if (running && DIRECTIONS[e.key]) {
    const [dx, dy] = DIRECTIONS[e.key];
    // 禁止180度掉头
    if (dx + snake.direction.x !== 0 || dy + snake.direction.y !== 0) {
      snake.direction = { x: dx, y: dy };
    }
  }
  // 如果游戏结束了，可以按 R/Q
  if (!running) {
    if (e.key === 'r' || e.key === 'R') {
      // 重新开始
      gameOverOverlay.style.display = 'none';
      initGame();
      requestAnimationFrame(gameLoop);
    } else if (e.key === 'q' || e.key === 'Q') {
      // 退出——浏览器没法像桌面程序那样直接退出，就隐藏 Overlay 算了
      gameOverOverlay.style.display = 'none';
    }
  }
});

// ---------------------
// 10. 启动整个流程
// ---------------------
loadAllImages().then(() => {
  // 图片加载完后再初始化游戏
  initGame();
  // 监听一次点击或键盘让音频得以播放
  document.body.addEventListener('click', playBgMusic, { once: true });
  document.body.addEventListener('keydown', playBgMusic, { once: true });
  // 开始循环
  requestAnimationFrame(gameLoop);
}).catch(err => {
  console.error("Image resource load error:", err);
});