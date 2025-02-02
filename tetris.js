const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");

canvas.width = 300;
canvas.height = 600;
document.body.insertBefore(canvas, document.body.firstChild);

const BLOCK_SIZE = 30;
const COLS = 10;
const ROWS = 20;
let score = 0;

// 테트리스 블록 모양
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [1, 1, 1],
    [0, 1, 0],
  ], // T
  [
    [1, 1, 1],
    [1, 0, 0],
  ], // L
  [
    [1, 1, 1],
    [0, 0, 1],
  ], // J
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // S
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // Z
];

// 블록 색상
const COLORS = [
  "#00f0f0",
  "#f0f000",
  "#a000f0",
  "#f0a000",
  "#0000f0",
  "#00f000",
  "#f00000",
];

let board = Array(ROWS)
  .fill()
  .map(() => Array(COLS).fill(0));
let currentPiece = null;
let currentPieceX = 0;
let currentPieceY = 0;
let currentColor = "";

class ComboSystem {
  constructor() {
    this.combo_count = 0;
    this.combo_timer = 0;
    this.combo_timeout = 2.0; // 콤보 유지 시간 (초)
  }

  add_combo() {
    this.combo_count += 1;
    this.combo_timer = this.combo_timeout;
    this.show_combo_effect();
  }

  reset_combo() {
    this.combo_count = 0;
  }

  update(dt) {
    if (this.combo_timer > 0) {
      this.combo_timer -= dt;
      if (this.combo_timer <= 0) {
        this.reset_combo();
      }
    }
  }
}

class ComboEffect {
  constructor() {
    // 이펙트 이미지/스프라이트 로드
    this.effects = {
      small: load_image("small_effect.png"),
      medium: load_image("medium_effect.png"),
      large: load_image("large_effect.png"),
    };
    this.active_effects = [];
  }

  create_effect(combo_count, position) {
    let effect_type = "small";
    if (combo_count >= 3) {
      effect_type = "medium";
    }
    if (combo_count >= 5) {
      effect_type = "large";
    }

    const effect = {
      sprite: this.effects[effect_type],
      position: position,
      lifetime: 1.0,
      scale: 1.0,
    };
    this.active_effects.push(effect);
  }

  update(dt) {
    // 활성화된 이펙트 업데이트 및 제거
    this.active_effects.forEach((effect, index) => {
      effect.lifetime -= dt;
      if (effect.lifetime <= 0) {
        this.active_effects.splice(index, 1);
      }
    });
  }
}

class MobileControls {
  constructor() {
    this.buttons = {
      left: { x: 50, y: window.innerHeight - 150, width: 80, height: 80 },
      right: { x: 210, y: window.innerHeight - 150, width: 80, height: 80 },
      down: { x: 130, y: window.innerHeight - 150, width: 80, height: 80 },
      rotate: {
        x: window.innerWidth - 100,
        y: window.innerHeight - 150,
        width: 80,
        height: 80,
      },
    };
    this.initTouchEvents();
  }

  drawControls(ctx) {
    // 반투명한 컨트롤러 배경
    ctx.globalAlpha = 0.5;
    for (const [key, btn] of Object.entries(this.buttons)) {
      ctx.fillStyle = "#333333";
      ctx.beginPath();
      ctx.roundRect(btn.x, btn.y, btn.width, btn.height, 10);
      ctx.fill();

      // 버튼 아이콘 그리기
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "24px Arial";
      const text = {
        left: "←",
        right: "→",
        down: "↓",
        rotate: "R",
      }[key];
      ctx.fillText(text, btn.x + 30, btn.y + 45);
    }
    ctx.globalAlpha = 1.0;
  }

  initTouchEvents() {
    canvas.addEventListener("touchstart", (e) => this.handleTouch(e));
    canvas.addEventListener("touchend", (e) => this.handleTouchEnd(e));
  }

  handleTouch(event) {
    event.preventDefault();
    const touch = event.touches[0];
    const touchX = touch.clientX;
    const touchY = touch.clientY;

    for (const [key, btn] of Object.entries(this.buttons)) {
      if (
        btn.x <= touchX &&
        touchX <= btn.x + btn.width &&
        btn.y <= touchY &&
        touchY <= btn.y + btn.height
      ) {
        switch (key) {
          case "left":
            game.movePiece(-1);
            break;
          case "right":
            game.movePiece(1);
            break;
          case "down":
            game.dropPiece();
            break;
          case "rotate":
            game.rotatePiece();
            break;
        }
      }
    }
  }

  handleTouchEnd(event) {
    // 터치가 끝났을 때의 처리
  }
}

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.size = Math.random() * 4 + 2;
    this.speedX = Math.random() * 6 - 3;
    this.speedY = Math.random() * 6 - 3;
    this.gravity = 0.1;
    this.life = 1.0;
    this.decay = Math.random() * 0.02 + 0.02;
  }

  update() {
    this.speedY += this.gravity;
    this.x += this.speedX;
    this.y += this.speedY;
    this.life -= this.decay;
  }

  draw(ctx) {
    ctx.globalAlpha = this.life;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
    this.colors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF"];
  }

  createExplosion(x, y, count = 30) {
    for (let i = 0; i < count; i++) {
      const color = this.colors[Math.floor(Math.random() * this.colors.length)];
      this.particles.push(new Particle(x, y, color));
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      this.particles[i].update();
      if (this.particles[i].life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx) {
    this.particles.forEach((particle) => particle.draw(ctx));
  }
}

// 새로운 블록 생성
function newPiece() {
  const shapeIndex = Math.floor(Math.random() * SHAPES.length);
  currentPiece = SHAPES[shapeIndex];
  currentColor = COLORS[shapeIndex];
  currentPieceX = Math.floor(COLS / 2) - Math.floor(currentPiece[0].length / 2);
  currentPieceY = 0;

  if (collision()) {
    // 게임 오버
    board = Array(ROWS)
      .fill()
      .map(() => Array(COLS).fill(0));
    score = 0;
    scoreElement.textContent = score;
  }
}

// 충돌 검사
function collision() {
  for (let y = 0; y < currentPiece.length; y++) {
    for (let x = 0; x < currentPiece[y].length; x++) {
      if (currentPiece[y][x]) {
        const boardX = currentPieceX + x;
        const boardY = currentPieceY + y;

        if (
          boardX < 0 ||
          boardX >= COLS ||
          boardY >= ROWS ||
          (boardY >= 0 && board[boardY][boardX])
        ) {
          return true;
        }
      }
    }
  }
  return false;
}

// 블록 고정
function freeze() {
  for (let y = 0; y < currentPiece.length; y++) {
    for (let x = 0; x < currentPiece[y].length; x++) {
      if (currentPiece[y][x]) {
        board[currentPieceY + y][currentPieceX + x] = currentColor;
      }
    }
  }
  // 줄 제거 확인
  checkLines();
  // 새로운 블록 생성
  newPiece();
}

// 줄이 가득 찼는지 확인하고 제거
function checkLines() {
  for (let y = ROWS - 1; y >= 0; y--) {
    if (board[y].every((cell) => cell !== 0)) {
      // 줄 제거
      board.splice(y, 1);
      board.unshift(Array(COLS).fill(0));
      score += 100;
      scoreElement.textContent = score;
    }
  }
}

// 게임 보드 그리기
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 보드 그리기
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      if (board[y][x]) {
        ctx.fillStyle = board[y][x];
        ctx.fillRect(
          x * BLOCK_SIZE,
          y * BLOCK_SIZE,
          BLOCK_SIZE - 1,
          BLOCK_SIZE - 1
        );
      }
    }
  }

  // 현재 블록 그리기
  if (currentPiece) {
    ctx.fillStyle = currentColor;
    for (let y = 0; y < currentPiece.length; y++) {
      for (let x = 0; x < currentPiece[y].length; x++) {
        if (currentPiece[y][x]) {
          ctx.fillRect(
            (currentPieceX + x) * BLOCK_SIZE,
            (currentPieceY + y) * BLOCK_SIZE,
            BLOCK_SIZE - 1,
            BLOCK_SIZE - 1
          );
        }
      }
    }
  }

  if (game.isMobile) {
    game.mobileControls.drawControls(ctx);
  }
}

// 키보드 컨트롤
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      currentPieceX--;
      if (collision()) currentPieceX++;
      break;
    case "ArrowRight":
      currentPieceX++;
      if (collision()) currentPieceX--;
      break;
    case "ArrowDown":
      currentPieceY++;
      if (collision()) {
        currentPieceY--;
        freeze();
      }
      break;
    case "ArrowUp":
      rotate();
      break;
    case " ": // 스페이스바
      // 충돌할 때까지 블록을 아래로 이동
      while (!collision()) {
        currentPieceY++;
      }
      currentPieceY--;
      freeze();
      break;
  }
  draw();
});

// 블록 회전
function rotate() {
  const newPiece = currentPiece[0].map((_, i) =>
    currentPiece.map((row) => row[i]).reverse()
  );
  const oldPiece = currentPiece;
  currentPiece = newPiece;

  if (collision()) {
    currentPiece = oldPiece;
  }
}

// 게임 루프
function gameLoop() {
  currentPieceY++;
  if (collision()) {
    currentPieceY--;
    freeze();
  }
  draw();
  setTimeout(gameLoop, 1000);
}

// 게임 시작
newPiece();
gameLoop();
