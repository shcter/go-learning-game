// 围棋游戏主模块

const BLACK = 1;
const WHITE = 2;
const BOARD_SIZE = 9;

class GoGame {
    constructor() {
        this.currentBoard = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.history = [];
        this.captured = { black: 0, white: 0 };
        this.showHints = true;
        this.consecutivePasses = 0;
        
        // 重要：先设置 window.game，再调用其他初始化
        window.game = this;
        this.initUI();
        this.updateDisplay();
        redraw();
    }
    
    createEmptyBoard() {
        return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    }
    
    initUI() {
        const undoBtn = document.getElementById('undo-btn');
        const resetBtn = document.getElementById('reset-btn');
        const passBtn = document.getElementById('pass-btn');
        
        if (undoBtn) undoBtn.addEventListener('click', () => this.undo());
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
        if (passBtn) passBtn.addEventListener('click', () => this.pass());
    }
    
    handleMove(row, col) {
        const result = makeMove(this.currentBoard, row, col, this.currentPlayer);
        
        if (!result.success) {
            this.showMessage(result.reason);
            return;
        }
        
        // 保存历史
        this.history.push({
            board: this.currentBoard.map(r => [...r]),
            player: this.currentPlayer,
            move: [row, col],
            capturedCount: this.captured[this.currentPlayer === BLACK ? 'white' : 'black']
        });
        
        this.currentBoard = result.board;
        this.consecutivePasses = 0;
        
        // 更新提子数
        if (result.captured.length > 0) {
            if (this.currentPlayer === BLACK) {
                this.captured.white += result.captured.length;
            } else {
                this.captured.black += result.captured.length;
            }
        }
        
        // 切换玩家
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        
        this.updateDisplay();
        redraw();
        this.showMessage('');
    }
    
    undo() {
        if (this.history.length === 0) {
            this.showMessage('没有可以悔棋的步骤');
            return;
        }
        
        const lastState = this.history.pop();
        
        // 重建棋盘
        this.currentBoard = this.createEmptyBoard();
        for (const state of this.history) {
            const [r, c] = state.move;
            const result = makeMove(this.currentBoard, r, c, state.player);
            if (result.success) {
                this.currentBoard = result.board;
            }
        }
        
        // 恢复提子计数
        this.captured = { black: 0, white: 0 };
        for (const state of this.history) {
            const color = state.player === BLACK ? 'white' : 'black';
            this.captured[color] = state.capturedCount;
        }
        
        this.currentPlayer = lastState.player;
        this.consecutivePasses = 0;
        
        this.updateDisplay();
        redraw();
        this.showMessage('已悔棋');
    }
    
    reset() {
        if (this.history.length > 0 && !confirm('确定要重新开始吗？')) {
            return;
        }
        
        this.currentBoard = this.createEmptyBoard();
        this.currentPlayer = BLACK;
        this.history = [];
        this.captured = { black: 0, white: 0 };
        this.consecutivePasses = 0;
        
        this.updateDisplay();
        redraw();
        this.showMessage('游戏已重新开始');
    }
    
    pass() {
        this.consecutivePasses++;
        
        if (this.consecutivePasses >= 2) {
            this.endGame();
            return;
        }
        
        this.currentPlayer = this.currentPlayer === BLACK ? WHITE : BLACK;
        this.updateDisplay();
        redraw();
        this.showMessage(this.currentPlayer === BLACK ? '黑方连续 Pass' : '白方连续 Pass');
    }
    
    endGame() {
        const counts = countStones(this.currentBoard);
        const winner = counts.black > counts.white ? '黑方' : 
                       counts.white > counts.black ? '白方' : '双方';
        this.showMessage(`游戏结束！${winner}获胜（黑:${counts.black} 白:${counts.white}）`);
    }
    
    updateDisplay() {
        const playerSpan = document.getElementById('current-player');
        if (playerSpan) {
            playerSpan.textContent = `当前回合：${this.currentPlayer === BLACK ? '⚫ 黑方' : '⚪ 白方'}`;
        }
        
        const capturedSpan = document.getElementById('captured-stones');
        if (capturedSpan) {
            capturedSpan.textContent = `提子：黑 ${this.captured.black} / 白 ${this.captured.white}`;
        }
        
        const undoBtn = document.getElementById('undo-btn');
        if (undoBtn) {
            undoBtn.disabled = this.history.length === 0;
        }
    }
    
    showMessage(text) {
        const msgEl = document.getElementById('message');
        if (msgEl) msgEl.textContent = text;
    }
}

// 页面加载完成后初始化
function init() {
    try {
        initBoard();
        new GoGame();
        console.log('围棋游戏初始化成功');
    } catch (e) {
        console.error('初始化失败:', e);
    }
}

// 确保 DOM 加载完成
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
