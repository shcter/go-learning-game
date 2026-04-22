// 棋盘渲染模块

const BOARD_SIZE = 9;
const CELL_SIZE = 50;
const PADDING = 30;
const STONE_RADIUS = 20;

let canvas, ctx;

// 星位（天元和星位点）
const STAR_POINTS = [
    [2, 2], [2, 6], [6, 2], [6, 6], [4, 4]  // 9路棋盘的星位
];

function initBoard() {
    canvas = document.getElementById('go-board');
    ctx = canvas.getContext('2d');
    
    const size = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2;
    canvas.width = size;
    canvas.height = size;
    
    canvas.addEventListener('click', handleBoardClick);
    canvas.addEventListener('mousemove', handleBoardHover);
    
    drawBoard();
}

function drawBoard() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制棋盘背景
    ctx.fillStyle = '#deb887';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = '#5c4033';
    ctx.lineWidth = 1;
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        // 横线
        ctx.beginPath();
        ctx.moveTo(PADDING, PADDING + i * CELL_SIZE);
        ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, PADDING + i * CELL_SIZE);
        ctx.stroke();
        
        // 竖线
        ctx.beginPath();
        ctx.moveTo(PADDING + i * CELL_SIZE, PADDING);
        ctx.lineTo(PADDING + i * CELL_SIZE, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
        ctx.stroke();
    }
    
    // 绘制星位点
    ctx.fillStyle = '#5c4033';
    for (const [r, c] of STAR_POINTS) {
        ctx.beginPath();
        ctx.arc(PADDING + c * CELL_SIZE, PADDING + r * CELL_SIZE, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制提示（如果开启）
    if (window.game && window.game.showHints) {
        drawHints();
    }
}

function drawHints() {
    const { currentBoard, currentPlayer } = window.game;
    
    ctx.globalAlpha = 0.5;
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (currentBoard[r][c] === 0) {
                const validation = isValidMove(currentBoard, r, c, currentPlayer, true);
                if (validation.valid) {
                    // 合法落子提示
                    ctx.strokeStyle = '#4ade80';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.arc(PADDING + c * CELL_SIZE, PADDING + r * CELL_SIZE, STONE_RADIUS - 5, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        }
    }
    
    ctx.globalAlpha = 1;
}

function drawStones(board) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== 0) {
                drawStone(c, r, board[r][c]);
            }
        }
    }
}

function drawStone(col, row, color) {
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    
    // 棋子阴影
    ctx.beginPath();
    ctx.arc(x + 2, y + 2, STONE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fill();
    
    // 棋子主体
    const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, STONE_RADIUS);
    if (color === 1) { // 黑子
        gradient.addColorStop(0, '#4a4a4a');
        gradient.addColorStop(1, '#1a1a1a');
    } else { // 白子
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#d0d0d0');
    }
    
    ctx.beginPath();
    ctx.arc(x, y, STONE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // 高光
    ctx.beginPath();
    ctx.arc(x - 5, y - 5, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fill();
}

function handleBoardClick(event) {
    if (!window.game) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const col = Math.round((x - PADDING) / CELL_SIZE);
    const row = Math.round((y - PADDING) / CELL_SIZE);
    
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        window.game.handleMove(row, col);
    }
}

function handleBoardHover(event) {
    // 可扩展：显示悬停效果
}

function redraw() {
    drawBoard();
    if (window.game) {
        drawStones(window.game.currentBoard);
    }
}
