// 围棋死活题模块

const TSUMEGO_LEVELS = {
    EASY: 'easy',
    MEDIUM: 'medium',
    HARD: 'hard'
};

// 死活题集合（简化版示例）
const TSUMEGO_PROBLEMS = [
    // 入门级 - 吃子题
    {
        level: TSUMEGO_LEVELS.EASY,
        title: "第一题：征吃",
        description: "黑先，如何吃掉白子？",
        setup: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,2,0,0,0,0,0],
            [0,0,0,2,0,0,0,0,0],
            [0,0,0,1,2,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ],
        solution: [[4, 2]], // 黑棋需要落子的位置
        hint: "利用对方的断点"
    },
    {
        level: TSUMEGO_LEVELS.EASY,
        title: "第二题：枷吃",
        description: "黑先，如何吃掉白子？",
        setup: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,2,1,0,0,0,0],
            [0,0,0,2,1,0,0,0,0],
            [0,0,0,0,2,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ],
        solution: [[2, 4]],
        hint: "堵住白棋的气"
    },
    // 中级 - 死活判断
    {
        level: TSUMEGO_LEVELS.MEDIUM,
        title: "第三题：做活",
        description: "黑先，如何让角上黑棋活棋？",
        setup: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,1,1,1,0,0,0,0],
            [0,0,1,0,1,0,0,0,0],
            [0,0,1,1,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ],
        solution: [[3, 3]],
        hint: "扩大眼位"
    },
    // 高级 - 杀棋
    {
        level: TSUMEGO_LEVELS.HARD,
        title: "第四题：聚杀",
        description: "黑先，如何杀死白棋？",
        setup: [
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,2,2,2,0,0,0,0],
            [0,0,2,0,2,0,0,0,0],
            [0,0,2,2,2,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0]
        ],
        solution: [[3, 3]],
        hint: "缩小眼位"
    }
];

class Tsumego {
    constructor(game) {
        this.game = game;
        this.currentProblem = null;
        this.currentIndex = 0;
        this.userMoves = [];
        this.isActive = false;
        this.displayBoard = null;
    }
    
    start(level = TSUMEGO_LEVELS.EASY) {
        this.isActive = true;
        this.currentIndex = 0;
        this.userMoves = [];
        
        // 筛选对应难度的题目
        const problems = TSUMEGO_PROBLEMS.filter(p => p.level === level);
        if (problems.length === 0) {
            this.showMessage('暂无该难度题目');
            return;
        }
        
        // 随机选择一题
        this.currentProblem = problems[Math.floor(Math.random() * problems.length)];
        this.displayBoard = this.currentProblem.setup.map(r => [...r]);
        
        this.showProblem();
    }
    
    showProblem() {
        this.createOverlay();
    }
    
    createOverlay() {
        this.removeOverlay();
        
        const overlay = document.createElement('div');
        overlay.className = 'tsumego-overlay';
        overlay.innerHTML = `
            <div class="tsumego-box">
                <div class="tsumego-header">
                    <span class="tsumego-level">${this.getLevelText()}</span>
                    <span class="tsumego-title">${this.currentProblem.title}</span>
                </div>
                <p class="tsumego-desc">${this.currentProblem.description}</p>
                <div class="tsumego-board-container">
                    <canvas id="tsumego-board"></canvas>
                </div>
                <div class="tsumego-hint">
                    <button class="hint-btn">💡 提示</button>
                    <span class="hint-text" style="display:none">${this.currentProblem.hint}</span>
                </div>
                <div class="tsumego-buttons">
                    <button class="tsumego-btn quit">退出</button>
                    <button class="tsumego-btn next-problem" style="display:none">下一题</button>
                </div>
                <div class="tsumego-result" style="display:none"></div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        
        // 初始化棋盘
        this.initTsumegoBoard();
        
        // 事件绑定
        overlay.querySelector('.quit').addEventListener('click', () => this.quit());
        overlay.querySelector('.hint-btn').addEventListener('click', () => this.showHint());
        overlay.querySelector('.next-problem').addEventListener('click', () => this.nextProblem());
    }
    
    initTsumegoBoard() {
        const canvas = document.getElementById('tsumego-board');
        const ctx = canvas.getContext('2d');
        
        canvas.width = 360;
        canvas.height = 360;
        
        this.drawTsumegoBoard(ctx);
        
        canvas.addEventListener('click', (e) => this.handleClick(e));
    }
    
    drawTsumegoBoard(ctx) {
        const CELL_SIZE = 40;
        const PADDING = 20;
        const BOARD_SIZE = 9;
        
        // 清空
        ctx.fillStyle = '#deb887';
        ctx.fillRect(0, 0, 360, 360);
        
        // 绘制网格
        ctx.strokeStyle = '#5c4033';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < BOARD_SIZE; i++) {
            const pos = PADDING + i * CELL_SIZE;
            
            ctx.beginPath();
            ctx.moveTo(PADDING, pos);
            ctx.lineTo(PADDING + (BOARD_SIZE - 1) * CELL_SIZE, pos);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(pos, PADDING);
            ctx.lineTo(pos, PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
            ctx.stroke();
        }
        
        // 绘制棋子
        for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
                if (this.displayBoard[r][c] !== 0) {
                    this.drawStone(ctx, PADDING + c * CELL_SIZE, PADDING + r * CELL_SIZE, this.displayBoard[r][c]);
                }
            }
        }
    }
    
    drawStone(ctx, x, y, color) {
        const STONE_RADIUS = 16;
        
        ctx.beginPath();
        ctx.arc(x + 2, y + 2, STONE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.fill();
        
        const gradient = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, STONE_RADIUS);
        if (color === 1) {
            gradient.addColorStop(0, '#4a4a4a');
            gradient.addColorStop(1, '#1a1a1a');
        } else {
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(1, '#d0d0d0');
        }
        
        ctx.beginPath();
        ctx.arc(x, y, STONE_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
    }
    
    handleClick(event) {
        const canvas = document.getElementById('tsumego-board');
        const rect = canvas.getBoundingClientRect();
        
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        const CELL_SIZE = 40;
        const PADDING = 20;
        
        const col = Math.round((x - PADDING) / CELL_SIZE);
        const row = Math.round((y - PADDING) / CELL_SIZE);
        
        if (row >= 0 && row < 9 && col >= 0 && col < 9) {
            this.tryMove(row, col);
        }
    }
    
    tryMove(row, col) {
        // 检查是否是解决方案的第一步
        const solution = this.currentProblem.solution;
        
        if (this.userMoves.length < solution.length) {
            const expected = solution[this.userMoves.length];
            if (row === expected[0] && col === expected[1]) {
                // 正确
                this.displayBoard[row][col] = 1; // 黑棋
                this.userMoves.push([row, col]);
                
                // 重新绘制
                const canvas = document.getElementById('tsumego-board');
                const ctx = canvas.getContext('2d');
                this.drawTsumegoBoard(ctx);
                
                if (this.userMoves.length === solution.length) {
                    this.showSuccess();
                }
            } else {
                // 错误
                this.showFailure();
            }
        }
    }
    
    showSuccess() {
        const result = document.querySelector('.tsumego-result');
        result.textContent = '🎉 回答正确！';
        result.style.display = 'block';
        result.style.color = '#22c55e';
        
        document.querySelector('.next-problem').style.display = 'inline-block';
    }
    
    showFailure() {
        const result = document.querySelector('.tsumego-result');
        result.textContent = '❌ 回答错误，请重试！';
        result.style.display = 'block';
        result.style.color = '#ef4444';
        
        setTimeout(() => {
            result.style.display = 'none';
        }, 1500);
    }
    
    showHint() {
        const hintText = document.querySelector('.hint-text');
        hintText.style.display = 'inline';
    }
    
    nextProblem() {
        this.start(this.currentProblem.level);
    }
    
    quit() {
        this.removeOverlay();
        this.isActive = false;
    }
    
    removeOverlay() {
        const existing = document.querySelector('.tsumego-overlay');
        if (existing) existing.remove();
    }
    
    getLevelText() {
        switch (this.currentProblem.level) {
            case TSUMEGO_LEVELS.EASY: return '入门';
            case TSUMEGO_LEVELS.MEDIUM: return '中级';
            case TSUMEGO_LEVELS.HARD: return '高级';
            default: return '入门';
        }
    }
}
