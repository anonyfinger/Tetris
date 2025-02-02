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
