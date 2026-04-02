import './style.css'

interface Point {
  x: number;
  y: number;
}

enum Direction {
  UP, DOWN, LEFT, RIGHT
}

class SnakeGame {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentScoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private overlay: HTMLElement;
  private startBtn: HTMLButtonElement;

  private gridSize: number = 20;
  private tileCount: number = 20;
  private snake: Point[] = [];
  private food: Point = { x: 5, y: 5 };
  private direction: Direction = Direction.RIGHT;
  private nextDirection: Direction = Direction.RIGHT;
  private score: number = 0;
  private highScore: number = 0;
  private gameLoopId: number | null = null;
  private lastTime: number = 0;
  private fps: number = 10;
  private isGameOver: boolean = false;

  constructor() {
    this.canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.currentScoreElement = document.getElementById('current-score')!;
    this.highScoreElement = document.getElementById('high-score')!;
    this.overlay = document.getElementById('overlay')!;
    this.startBtn = document.getElementById('start-btn') as HTMLButtonElement;

    this.setupCanvas();
    this.loadHighScore();
    this.bindEvents();
    this.resetGame();
    this.draw(); // Initial draw
  }

  private setupCanvas() {
    // Internal resolution
    this.canvas.width = 400;
    this.canvas.height = 400;
  }

  private loadHighScore() {
    const saved = localStorage.getItem('snake-high-score');
    if (saved) {
      this.highScore = parseInt(saved);
      this.highScoreElement.textContent = this.highScore.toString();
    }
  }

  private bindEvents() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    this.startBtn.addEventListener('click', () => this.startGame());
    
    // Resize handling to keep it looking good
    window.addEventListener('resize', () => this.draw());
  }

  private handleKeyDown(e: KeyboardEvent) {
    if (e.code === 'Space' && (this.isGameOver || this.gameLoopId === null)) {
      this.startGame();
      return;
    }

    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        if (this.direction !== Direction.DOWN) this.nextDirection = Direction.UP;
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        if (this.direction !== Direction.UP) this.nextDirection = Direction.DOWN;
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        if (this.direction !== Direction.RIGHT) this.nextDirection = Direction.LEFT;
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        if (this.direction !== Direction.LEFT) this.nextDirection = Direction.RIGHT;
        break;
    }
  }

  private resetGame() {
    this.snake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 }
    ];
    this.direction = Direction.RIGHT;
    this.nextDirection = Direction.RIGHT;
    this.score = 0;
    this.fps = 10;
    this.currentScoreElement.textContent = '0';
    this.isGameOver = false;
    this.spawnFood();
  }

  private spawnFood() {
    while (true) {
      const newFood = {
        x: Math.floor(Math.random() * this.tileCount),
        y: Math.floor(Math.random() * this.tileCount)
      };
      
      // Don't spawn on snake
      const onSnake = this.snake.some(segment => segment.x === newFood.x && segment.y === newFood.y);
      if (!onSnake) {
        this.food = newFood;
        break;
      }
    }
  }

  private startGame() {
    if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
    this.resetGame();
    this.overlay.classList.add('hidden');
    this.lastTime = performance.now();
    this.gameLoop();
  }

  private gameOver() {
    this.isGameOver = true;
    if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
    this.gameLoopId = null;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('snake-high-score', this.highScore.toString());
      this.highScoreElement.textContent = this.highScore.toString();
    }

    document.getElementById('overlay-title')!.textContent = 'GAME OVER';
    document.getElementById('overlay-message')!.textContent = `Score: ${this.score} | Press Space to Restart`;
    this.startBtn.textContent = 'RETRY';
    this.overlay.classList.remove('hidden');
  }

  private update() {
    this.direction = this.nextDirection;
    const head = { ...this.snake[0] };

    switch (this.direction) {
      case Direction.UP: head.y--; break;
      case Direction.DOWN: head.y++; break;
      case Direction.LEFT: head.x--; break;
      case Direction.RIGHT: head.x++; break;
    }

    // Wall collision
    if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
      this.gameOver();
      return;
    }

    // Self collision
    if (this.snake.some(segment => segment.x === head.x && segment.y === head.y)) {
      this.gameOver();
      return;
    }

    this.snake.unshift(head);

    // Food collision
    if (head.x === this.food.x && head.y === this.food.y) {
      this.score += 10;
      this.currentScoreElement.textContent = this.score.toString();
      this.spawnFood();
      // Increase speed slightly
      if (this.fps < 25) this.fps += 0.2;
    } else {
      this.snake.pop();
    }
  }

  private draw() {
    // Clear canvas
    this.ctx.fillStyle = '#111114';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw grid lines (subtle)
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < this.tileCount; i++) {
      this.ctx.beginPath();
      this.ctx.moveTo(i * this.gridSize, 0);
      this.ctx.lineTo(i * this.gridSize, this.canvas.height);
      this.ctx.stroke();
      this.ctx.beginPath();
      this.ctx.moveTo(0, i * this.gridSize);
      this.ctx.lineTo(this.canvas.width, i * this.gridSize);
      this.ctx.stroke();
    }

    // Draw food
    this.ctx.fillStyle = '#ff3366';
    this.ctx.shadowBlur = 15;
    this.ctx.shadowColor = '#ff3366';
    this.ctx.beginPath();
    const centerX = this.food.x * this.gridSize + this.gridSize / 2;
    const centerY = this.food.y * this.gridSize + this.gridSize / 2;
    this.ctx.arc(centerX, centerY, this.gridSize / 2 - 2, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    // Draw snake
    this.snake.forEach((segment, index) => {
      const isHead = index === 0;
      this.ctx.fillStyle = isHead ? '#00ffaa' : '#00ff88';
      
      // Head glow
      if (isHead) {
        this.ctx.shadowBlur = 10;
        this.ctx.shadowColor = '#00ffaa';
      }

      this.ctx.fillRect(
        segment.x * this.gridSize + 1,
        segment.y * this.gridSize + 1,
        this.gridSize - 2,
        this.gridSize - 2
      );
      this.ctx.shadowBlur = 0;
    });
  }

  private gameLoop = (timestamp: number = 0) => {
    this.gameLoopId = requestAnimationFrame(this.gameLoop);

    const deltaTime = timestamp - this.lastTime;
    const interval = 1000 / this.fps;

    if (deltaTime >= interval) {
      this.lastTime = timestamp - (deltaTime % interval);
      this.update();
      this.draw();
    }
  }
}

// Initialize game
new SnakeGame();
