// 棋盘渲染模块

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
    console.log('initBoard called');
    
    canvas = document.getElementById('go-board');
    
    if (!canvas) {
        console.error('找不到 canvas 元素 #go-board');
        return false;
    }
    
    console.log('Canvas found:', canvas);
    
    ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('无法获取 canvas 2d context');
        return false;
    }
    
    // 设置 canvas 尺寸
    const size = CELL_SIZE * (BOARD_SIZE - 1) + PADDING * 2;
    canvas.width = size;
    canvas.height = size;
    
    console.log('Canvas size set:', size, 'x', size);
    
    // 移除旧事件监听器并添加新的
    canvas.removeEventListener('click', handleBoardClick);
    canvas.addEventListener('click', handleBoardClick);
    canvas.addEventListener('mousemove', handleBoardHover);
    canvas.addEventListener('mouseleave', () => {
        hoverPos = null;
        redraw();
    });
    
    // 初始绘制
    drawBoard();
    
    console.log('Board initialized successfully');
    return true;
}

function drawBoard() {
    if (!ctx || !canvas) {
        console.error('drawBoard: ctx or canvas is null', { ctx, canvas });
        return;
    }
    
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
    
    console.log('Drawing grid lines...');
    
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
    
    // 绘制坐标标签
    drawCoordinates();
    
    // 绘制提示
    drawHints();
    
    console.log('Grid lines drawn');
}

function drawCoordinates() {
    if (!ctx) return;
    
    ctx.fillStyle = '#5c4033';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 列标签 (A-I)
    for (let i = 0; i < BOARD_SIZE; i++) {
        const x = PADDING + i * CELL_SIZE;
        const y = PADDING - 12;
        ctx.fillText(String.fromCharCode(65 + i), x, y);
    }
    
    // 行标签 (1-9)
    ctx.textAlign = 'right';
    for (let i = 0; i < BOARD_SIZE; i++) {
        const x = PADDING - 8;
        const y = PADDING + i * CELL_SIZE;
        ctx.fillText(String(BOARD_SIZE - i), x, y);
    }
}

function drawHints() {
    if (!window.game || !window.game.showHints || window.game.reviewMode) return;
    if (!ctx) return;
    
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
                    console.warn('Error in drawHints:', e);
                }
            }
        }
    }
    
    ctx.globalAlpha = 1;
}

function drawStones(board) {
    if (!ctx) {
        console.error('drawStones: ctx is null');
        return;
    }
    
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

function drawLastMoveMarker(row, col) {
    if (!ctx) return;
    
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    
    // 最后一手红点标记
    ctx.beginPath();
    ctx.arc(x, y, 8, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();
    
    // 白色边框
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// 悬停效果
let hoverPos = null;

function drawHoverStone(row, col) {
    if (!ctx || !window.game || window.game.reviewMode) return;
    
    const { currentBoard, currentPlayer, showHints } = window.game;
    if (currentBoard[row][col] !== 0) return;
    
    // 检查是否是合法落点
    try {
        const validation = isValidMove(currentBoard, row, col, currentPlayer, true);
        if (!validation.valid) return;
    } catch (e) {
        return;
    }
    
    const x = PADDING + col * CELL_SIZE;
    const y = PADDING + row * CELL_SIZE;
    
    ctx.globalAlpha = 0.5;
    
    // 绘制半透明棋子
    const gradient = ctx.createRadialGradient(x - 5, y - 5, 0, x, y, STONE_RADIUS);
    if (currentPlayer === BLACK) {
        gradient.addColorStop(0, 'rgba(74, 74, 74, 0.7)');
        gradient.addColorStop(1, 'rgba(26, 26, 26, 0.7)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        gradient.addColorStop(1, 'rgba(208, 208, 208, 0.7)');
    }
    
    ctx.beginPath();
    ctx.arc(x, y, STONE_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    ctx.globalAlpha = 1;
}

function handleBoardHover(event) {
    if (!window.game || !canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    const col = Math.round((x - PADDING) / CELL_SIZE);
    const row = Math.round((y - PADDING) / CELL_SIZE);
    
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        if (!hoverPos || hoverPos.row !== row || hoverPos.col !== col) {
            hoverPos = { row, col };
            redraw();
            if (!window.game.reviewMode && window.game.currentBoard[row][col] === 0) {
                drawHoverStone(row, col);
            }
        }
    } else {
        if (hoverPos) {
            hoverPos = null;
            redraw();
        }
    }
}

function handleBoardClick(event) {
    if (!window.game || !canvas) {
        console.error('handleBoardClick: game or canvas is null');
        return;
    }
    if (window.game.reviewMode) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    
    const col = Math.round((x - PADDING) / CELL_SIZE);
    const row = Math.round((y - PADDING) / CELL_SIZE);
    
    console.log('Click at row:', row, 'col:', col);
    
    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
        window.game.handleMove(row, col);
    }
}

function redraw() {
    drawBoard();
    if (window.game) {
        drawStones(window.game.currentBoard);
        
        // 绘制最后一手标记
        if (window.game.lastMove && !window.game.reviewMode) {
            drawLastMoveMarker(window.game.lastMove.row, window.game.lastMove.col);
        }
    }
}

// 导出给外部使用
window.redraw = redraw;
window.initBoard = initBoard;

// 初始化
console.log('board.js loaded');
