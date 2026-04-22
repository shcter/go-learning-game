// 围棋教程模块

const TUTORIAL_STEPS = [
    {
        title: "欢迎学习围棋！",
        content: "围棋是一种有着4000多年历史的策略棋类游戏。让我们一步步学会它。",
        highlight: null
    },
    {
        title: "棋盘",
        content: "围棋使用19x19、13x13或9x9的棋盘。我们从9x9开始，适合初学者。\n\n交叉点可以放置棋子。",
        highlight: "board"
    },
    {
        title: "棋子",
        content: "围棋使用黑白两色棋子。\n\n⚫ 黑方先手\n⚪ 白方后手\n\n双方轮流在交叉点放置棋子。",
        highlight: null
    },
    {
        title: "气的概念",
        content: "每颗棋子周围相连的空点叫做"气"。\n\n角上：2-4气\n边上：3-5气\n中央：4气\n\n当一颗棋子的气全部被对方堵住，它就被提走。",
        highlight: null
    },
    {
        title: "提子",
        content: "当你的棋子围住了对方的棋子（对方棋子没有气了），对方的棋子被提走。\n\n被提走的棋子成为你的"俘子"。",
        highlight: null
    },
    {
        title: "禁着点",
        content: "两种情况不能落子：\n\n1. 自杀禁手：落子后自己没有气且不能提对方子\n2. 打劫：不能立即提回刚被提走的子（需隔一手）",
        highlight: null
    },
    {
        title: "地与目",
        content: "围棋的目标是围取更大的地盘（地）。\n\n棋子围住的空点叫做"目"。\n\n游戏结束时会计算双方的目数和俘子。",
        highlight: null
    },
    {
        title: "开始游戏！",
        content: "现在你已经了解了基本规则！\n\n点击棋盘上的绿点（合法落点）开始你的第一局围棋吧！\n\n祝你好运！🎮",
        highlight: null,
        isLast: true
    }
];

class Tutorial {
    constructor(game) {
        this.game = game;
        this.currentStep = 0;
        this.overlay = null;
        this.isActive = false;
    }
    
    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.currentStep = 0;
        this.showStep();
    }
    
    showStep() {
        const step = TUTORIAL_STEPS[this.currentStep];
        this.createOverlay(step);
    }
    
    createOverlay(step) {
        this.removeOverlay();
        
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.innerHTML = `
            <div class="tutorial-box">
                <div class="tutorial-progress">${this.currentStep + 1} / ${TUTORIAL_STEPS.length}</div>
                <h2>${step.title}</h2>
                <p>${step.content.replace(/\n/g, '<br>')}</p>
                <div class="tutorial-buttons">
                    ${this.currentStep > 0 ? '<button class="tutorial-btn prev">◀ 上一步</button>' : ''}
                    ${step.isLast ? '<button class="tutorial-btn start">开始游戏！</button>' : '<button class="tutorial-btn next">下一步 ▶</button>'}
                </div>
                <button class="tutorial-skip">跳过教程</button>
            </div>
        `;
        
        document.body.appendChild(overlay);
        this.overlay = overlay;
        
        // 事件绑定
        overlay.querySelector('.next')?.addEventListener('click', () => this.next());
        overlay.querySelector('.prev')?.addEventListener('click', () => this.prev());
        overlay.querySelector('.start')?.addEventListener('click', () => this.end());
        overlay.querySelector('.skip')?.addEventListener('click', () => this.end());
    }
    
    next() {
        this.currentStep++;
        if (this.currentStep >= TUTORIAL_STEPS.length) {
            this.end();
        } else {
            this.showStep();
        }
    }
    
    prev() {
        this.currentStep--;
        if (this.currentStep < 0) {
            this.currentStep = 0;
        }
        this.showStep();
    }
    
    end() {
        this.removeOverlay();
        this.isActive = false;
        localStorage.setItem('goTutorialCompleted', 'true');
        this.game.showMessage('教程结束，祝你玩得开心！');
    }
    
    removeOverlay() {
        const existing = document.querySelector('.tutorial-overlay');
        if (existing) existing.remove();
        this.overlay = null;
    }
}
