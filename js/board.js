// 棋盘渲染模块

const BOARD_SIZE = 9;
const CELL_SIZE = 50;
const PADDING = 30;
const STONE_RADIUS = 20;

let canvas = null;
let ctx = null;

// 星位（9路棋盘的星位）
const STAR_POINTS = [
    [2, 2], [2, 6], [6, 2], [6, 6], [4, 4]
];

function initBoard() {
    canvas = document.getElementById('go-board');
    
    if (!canvas) {
        console.error('找不到 canvas 元素');
        return;
    }
    
    ctx = canvas.getContext('2d');
    
    const size = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2;
    canvas.width = size;
    canvas.height = size;
    
    // 移除旧事件监听器（防止重复绑定）
    canvas.removeEventListener('click', handleBoardClick);
    canvas.addEventListener('click', handleBoardClick);
    
    drawBoard();
}

function drawBoard() {
    if (!ctx || !canvas) return;
    
    const width = canvas.width;
    const height = canvas.height;
    
    // 清除画布
    ctx.clearRect(0, 0, width, height);
    
    // 绘制棋盘背景（木纹色）
    ctx.fillStyle = '#deb887';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制网格线
    ctx.strokeStyle = '#5c4033';
    ctx.lineWidth = 1;
    
    const boardSize = CELL_SIZE * (BOARD_SIZE - 1);
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        const pos = PADDING + i * CELL_SIZE;
        
        // 横线
        ctx.beginPath();
        ctx.moveTo(PADDING, pos);
        ctx.lineTo(PADDING + boardSize, pos);
        ctx.stroke();
        
        // 竖线
        ctx.beginPath();
        ctx.moveTo(pos, PADDING);
        ctx.lineTo(pos, PADDING + boardSize);
        ctx.stroke();
    }
    
    // 绘制星位点
    ctx.fillStyle = '#5c4033';
    for (const [r, c] of STAR_POINTS) {
        ctx.beginPath();
        ctx.arc(PADDING + c * CELL_SIZE, PADDING + r * CELL_SIZE, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // 绘制提示
    drawHints();
}

function drawHints() {
    if (!window.game || !window.game.showHints) return;
    
    const { currentBoard, currentPlayer } = window.game;
    
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (currentBoard[r][c] === 0) {
                try {
                    const validation = isValidMove(currentBoard, r, c, currentPlayer, true);
                    if (validation.valid) {
                        const x = PADDING + c * CELL_SIZE;
                        const y = PADDING + r * CELL_SIZE;
                        
                        ctx.strokeStyle = '#22c55e';
                        ctx.beginPath();
                        ctx.arc(x, y, STONE_RADIUS - 5, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                } catch (e) {
                    // 忽略验证错误
                }
            }
        }
    }
    
    ctx.globalAlpha = 1;
}

function drawStones(board) {
    if (!ctx) return;
    
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] !== 0) {
                drawStone(c, r, board[r][c]);
            }
        }
    }
}

function drawStone(col, row, color) {
    if (!ctx) return;
    
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
    if (!window.game || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    const col = Math.round((x - PADDING) / CELL_SIZE);
    const row = Math.round((y - PADDING) / CELL_SIZE);
    
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        window.game.handleMove(row, col);
    }
}

function redraw() {
    drawBoard();
    if (window.game) {
        drawStones(window.game.currentBoard);
    }
}

// 导出给外部使用
window.redraw = redraw;
