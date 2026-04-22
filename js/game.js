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
        
        this.initUI();
        this.updateDisplay();
        redraw();
    }
    
    createEmptyBoard() {
        return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(0));
    }
    
    initUI() {
        document.getElementById('undo-btn').addEventListener('click', () => this.undo());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        document.getElementById('pass-btn').addEventListener('click', () => this.pass());
        
        window.game = this;
    }
    
    handleMove(row, col) {
        const result = makeMove(this.currentBoard, row, col, this.currentPlayer);
        
        if (!result.success) {
            this.showMessage(result.reason);
            return;
        }
        
        // 保存历史
        this.history.push({
            board: this.currentBoard,
            player: this.currentPlayer,
            move: [row, col],
            captured: this.captured[this.currentPlayer === BLACK ? 'white' : 'black']
        });
        
        this.currentBoard = result.board;
        this.consecutivePasses = 0;
        
        // 更新提子数
        if (result.captured.length > 0) {
            if (this.currentPlayer === BLACK) {
                this.captured.black += result.captured.length;
            } else {
                this.captured.white += result.captured.length;
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
        this.currentBoard = this.createEmptyBoard();
        
        // 重新应用历史（除了最后一手）
        for (const state of this.history) {
            const [r, c] = state.move;
            const result = makeMove(this.currentBoard, r, c, state.player);
            if (result.success) {
                this.currentBoard = result.board;
            }
        }
        
        // 恢复提子计数
        const lastPlayer = lastState.player;
        const opponent = lastPlayer === BLACK ? WHITE : BLACK;
        this.captured[opponent === BLACK ? 'black' : 'white'] -= lastState.captured;
        
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
        playerSpan.textContent = `当前回合：${this.currentPlayer === BLACK ? '⚫ 黑方' : '⚪ 白方'}`;
        
        const capturedSpan = document.getElementById('captured-stones');
        capturedSpan.textContent = `提子：黑 ${this.captured.black} / 白 ${this.captured.white}`;
        
        const undoBtn = document.getElementById('undo-btn');
        undoBtn.disabled = this.history.length === 0;
    }
    
    showMessage(text) {
        const msgEl = document.getElementById('message');
        msgEl.textContent = text;
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    initBoard();
    new GoGame();
});
