class Tetris {
  constructor() {
    this.board = Array(20)
      .fill()
      .map(() => Array(10).fill(0));
    this.score = 0;
    this.level = 1;
    this.gameBoard = document.querySelector(".game-board");
    this.currentPiece = null;
    this.gameOver = false;

    // 테트리스 블록 모양 정의
    this.shapes = {
      I: [[1, 1, 1, 1]],
      L: [
        [1, 0],
        [1, 0],
        [1, 1],
      ],
      J: [
        [0, 1],
        [0, 1],
        [1, 1],
      ],
      O: [
        [1, 1],
        [1, 1],
      ],
      Z: [
        [1, 1, 0],
        [0, 1, 1],
      ],
      S: [
        [0, 1, 1],
        [1, 1, 0],
      ],
      T: [
        [1, 1, 1],
        [0, 1, 0],
      ],
    };

    // 각 블록 타입별 색상 정의
    this.colors = {
      I: "#00f0f0", // 하늘색
      O: "#f0f000", // 노란색
      T: "#a000f0", // 보라색
      S: "#00f000", // 초록색
      Z: "#f00000", // 빨간색
      J: "#0000f0", // 파란색
      L: "#f0a000", // 주황색
    };

    this.currentType = null;

    // 사운드 요소
    this.sounds = {
      move: document.getElementById("moveSound"),
      rotate: document.getElementById("rotateSound"),
      drop: document.getElementById("dropSound"),
      clear: document.getElementById("clearSound"),
      gameover: document.getElementById("gameoverSound"),
    };

    // 음소거 상태
    this.isMuted = false;

    this.init();
  }

  init() {
    this.setupControls();
    this.createNewPiece();
    this.gameLoop();
  }

  setupControls() {
    // 키보드 컨트롤
    document.addEventListener("keydown", (e) => {
      if (this.gameOver) return;

      switch (e.key) {
        case "ArrowLeft":
          this.movePiece(-1, 0);
          break;
        case "ArrowRight":
          this.movePiece(1, 0);
          break;
        case "ArrowDown":
          this.movePiece(0, 1);
          break;
        case "ArrowUp":
          this.rotatePiece();
          break;
        case " ": // 스페이스바
          this.hardDrop();
          break;
      }
    });

    // 모바일 컨트롤
    document.getElementById("leftBtn").addEventListener("click", () => {
      if (!this.gameOver) this.movePiece(-1, 0);
    });

    document.getElementById("rightBtn").addEventListener("click", () => {
      if (!this.gameOver) this.movePiece(1, 0);
    });

    document.getElementById("downBtn").addEventListener("click", () => {
      if (!this.gameOver) this.movePiece(0, 1);
    });

    document.getElementById("rotateBtn").addEventListener("click", () => {
      if (!this.gameOver) this.rotatePiece();
    });

    document.getElementById("dropBtn").addEventListener("click", () => {
      if (!this.gameOver) this.hardDrop();
    });
  }

  createNewPiece() {
    const shapes = Object.keys(this.shapes);
    const randomShape = shapes[Math.floor(Math.random() * shapes.length)];
    this.currentPiece = {
      shape: this.shapes[randomShape],
      x: 3,
      y: 0,
    };
    this.currentType = randomShape;
  }

  movePiece(dx, dy) {
    const newX = this.currentPiece.x + dx;
    const newY = this.currentPiece.y + dy;

    if (this.isValidMove(newX, newY, this.currentPiece.shape)) {
      this.currentPiece.x = newX;
      this.currentPiece.y = newY;
      this.draw();
      if (dx !== 0) this.playSound("move"); // 좌우 이동 시 사운드
      return true;
    }

    if (dy > 0) {
      this.freezePiece();
      this.clearLines();
      this.createNewPiece();
      this.playSound("drop"); // 블록이 바닥에 닿았을 때 사운드

      if (
        !this.isValidMove(
          this.currentPiece.x,
          this.currentPiece.y,
          this.currentPiece.shape
        )
      ) {
        this.gameOver = true;
        this.playSound("gameover"); // 게임 오버 시 사운드
        alert("게임 오버!");
      }
    }
    return false;
  }

  isValidMove(x, y, shape) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;

          if (newX < 0 || newX >= 10 || newY >= 20) return false;
          if (newY >= 0 && this.board[newY][newX]) return false;
        }
      }
    }
    return true;
  }

  freezePiece() {
    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const boardY = this.currentPiece.y + row;
          if (boardY >= 0) {
            // 색상 정보를 보드에 저장
            this.board[boardY][this.currentPiece.x + col] =
              this.colors[this.currentType];
          }
        }
      }
    }
  }

  clearLines() {
    let linesCleared = 0;
    for (let row = this.board.length - 1; row >= 0; row--) {
      if (this.board[row].every((cell) => cell !== 0)) {
        this.board.splice(row, 1);
        this.board.unshift(Array(10).fill(0));
        this.score += 100;
        document.getElementById("score").textContent = this.score;
        linesCleared++;
      }
    }
    if (linesCleared > 0) {
      this.playSound("clear"); // 라인 제거 시 사운드
    }
  }

  rotatePiece() {
    const rotated = this.currentPiece.shape[0].map((_, i) =>
      this.currentPiece.shape.map((row) => row[i]).reverse()
    );

    if (this.isValidMove(this.currentPiece.x, this.currentPiece.y, rotated)) {
      this.currentPiece.shape = rotated;
      this.draw();
      this.playSound("rotate"); // 회전 시 사운드
    }
  }

  // 가이드라인(고스트 피스) 위치 계산
  getGhostPosition() {
    let ghostY = this.currentPiece.y;

    // 블록이 더 이상 내려갈 수 없을 때까지 아래로 이동
    while (
      this.isValidMove(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)
    ) {
      ghostY++;
    }

    return ghostY;
  }

  draw() {
    this.gameBoard.innerHTML = "";

    // 보드에 있는 블록 그리기
    for (let row = 0; row < this.board.length; row++) {
      for (let col = 0; col < this.board[row].length; col++) {
        const cell = document.createElement("div");
        if (this.board[row][col]) {
          cell.style.backgroundColor = this.board[row][col];
        } else {
          cell.style.backgroundColor = "#111";
        }
        cell.style.border = "1px solid #222";
        this.gameBoard.appendChild(cell);
      }
    }

    // 현재 움직이는 블록 그리기
    if (this.currentPiece) {
      for (let row = 0; row < this.currentPiece.shape.length; row++) {
        for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
          if (this.currentPiece.shape[row][col]) {
            const y = this.currentPiece.y + row;
            const x = this.currentPiece.x + col;
            if (y >= 0) {
              const index = y * 10 + x;
              const cell = this.gameBoard.children[index];
              if (cell) {
                cell.style.backgroundColor = this.colors[this.currentType];
              }
            }
          }
        }
      }
    }
  }

  gameLoop() {
    const loop = () => {
      if (!this.gameOver) {
        this.movePiece(0, 1);
        this.draw();
        setTimeout(loop, 1000 - (this.level - 1) * 100);
      }
    };
    loop();
  }

  // 즉시 하강 기능 추가
  hardDrop() {
    let dropped = false;
    while (this.movePiece(0, 1)) {
      dropped = true;
    }
    if (dropped) {
      this.playSound("drop"); // 하드 드롭 시 사운드
    }
  }

  // 사운드 재생 함수
  playSound(soundName) {
    if (!this.isMuted && this.sounds[soundName]) {
      this.sounds[soundName].currentTime = 0;
      this.sounds[soundName]
        .play()
        .catch((e) => console.log("sound play error:", e));
    }
  }
}

// 게임 시작
window.onload = () => {
  new Tetris();
};
