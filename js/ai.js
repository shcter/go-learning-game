// 围棋AI模块 - 优化版
// 改进：分类落子类型、形状评估、征子判断、先手价值

// ==================== 辅助函数 ====================

// 落子类型分类
const MoveType = {
    CAPTURE: 'capture',       // 吃子
    ATTACK: 'attack',         // 攻击（威胁对手）
    SAVE: 'save',             // 救子
    CONNECT: 'connect',       // 连接
    EXPAND: 'expand',         // 扩张地盘
    DEFEND: 'defend',         // 防守
    EYE: 'eye',               // 做眼/破眼
    APPROACH: 'approach',     // 接近棋
    PINCER: 'pincer',         // 夹击
    CENTER: 'center',         // 围中
};

// 对落子进行类型分类
function classifyMove(board, row, col, color) {
    const opponent = color === BLACK ? WHITE : BLACK;
    const neighbors = getNeighbors(row, col);
    const types = [];
    let capturedStones = 0;
    let atariGroups = []; // 受到威胁的己方/敌方棋串

    // 创建临时棋盘并落子
    const tempBoard = copyBoard(board);
    tempBoard[row][col] = color;

    // 检查是否能吃子
    for (const [nr, nc] of neighbors) {
        if (board[nr][nc] === opponent) {
            const libs = countGroupLiberties(tempBoard, nr, nc);
            if (libs === 0) {
                const group = getGroup(tempBoard, nr, nc);
                capturedStones += group.length;
                types.push(MoveType.CAPTURE);
            }
        }
    }

    // 检查是否能救活自己的死子（连接/逃跑）
    for (const [nr, nc] of neighbors) {
        if (board[nr][nc] === color) {
            const libs = countGroupLiberties(board, nr, nc);
            if (libs === 1) {
                types.push(MoveType.SAVE);
                atariGroups.push({ r: nr, c: nc, type: 'our' });
            }
        }
    }

    // 检查是否能威胁对方（让对方气紧）
    for (const [nr, nc] of neighbors) {
        if (board[nr][nc] === opponent) {
            const libs = countGroupLiberties(board, nr, nc);
            if (libs === 2) {
                types.push(MoveType.ATTACK);
                atariGroups.push({ r: nr, c: nc, type: 'opp' });
            }
        }
    }

    // 检查连接价值
    let sameColorNeighbors = 0;
    let openEnds = 0;
    for (const [nr, nc] of neighbors) {
        if (board[nr][nc] === color) sameColorNeighbors++;
        if (board[nr][nc] === 0) openEnds++;
    }
    if (sameColorNeighbors >= 2 && openEnds >= 2) {
        types.push(MoveType.CONNECT);
    }

    // 星位/天元判断
    const isStar = (row === 2 || row === 6) && (col === 2 || col === 6);
    const isCenter = row === 4 && col === 4;
    const isApproach = isNearCorner(row, col);

    if (isCenter) types.push(MoveType.CENTER);
    else if (isStar) types.push(MoveType.DEFEND);
    else if (isApproach) types.push(MoveType.APPROACH);

    // 检查做眼/破眼
    const eyePotential = countEyePotential(tempBoard, row, col, color);
    if (eyePotential > 2) types.push(MoveType.EYE);

    return {
        types,
        capturedStones,
        atariGroups,
        openEnds
    };
}

// 判断是否接近角
function isNearCorner(row, col) {
    const corners = [[0, 0], [0, 8], [8, 0], [8, 8]];
    for (const [cr, cc] of corners) {
        if (Math.abs(row - cr) <= 1 && Math.abs(col - cc) <= 1) return true;
    }
    return false;
}

// 计算眼的潜力
function countEyePotential(board, row, col, color) {
    let eyePoints = 0;
    const neighbors = getNeighbors(row, col);

    for (const [nr, nc] of neighbors) {
        if (board[nr][nc] === 0) {
            // 统计这个空点周围同色棋子的数量
            const sameColor = getNeighbors(nr, nc).filter(([ar, ac]) => board[ar][ac] === color).length;
            if (sameColor >= 2) eyePoints++;
        }
    }
    return eyePoints;
}

// 简单征子检测（基础版）
function wouldBeCapturedLadder(board, row, col, color, depth = 8) {
    const opponent = color === BLACK ? WHITE : BLACK;
    let r = row, c = col;

    for (let i = 0; i < depth; i++) {
        // 模拟在这个位置放对手的棋子
        const testBoard = copyBoard(board);
        testBoard[r][c] = opponent;

        // 检查气紧的棋子
        const libs = countGroupLiberties(testBoard, r, c);
        if (libs > 1) return false; // 还有气，不是征子

        if (libs === 0) return true; // 被吃了，是征子

        // 找逃跑方向（往中间跑）
        const neighbors = getNeighbors(r, c);
        let escaped = false;
        let bestR = r, bestC = c;

        for (const [nr, nc] of neighbors) {
            if (testBoard[nr][nc] === 0) {
                // 往中间跑优先
                if (nr > 0 && nr < 8 && nc > 0 && nc < 8) {
                    bestR = nr;
                    bestC = nc;
                    escaped = true;
                    break;
                } else if (!escaped) {
                    bestR = nr;
                    bestC = nc;
                    escaped = true;
                }
            }
        }

        if (!escaped) return false;
        r = bestR;
        c = bestC;
    }
    return false;
}

// 形状评估（简单版）
function evaluateShape(board, row, col, color) {
    let shapeScore = 0;
    const opponent = color === BLACK ? WHITE : BLACK;

    // 好的形状特征
    // 1. 避免愚形（尖、愚形三角）
    const neighbors = getNeighbors(row, col);
    const diagonalNeighbors = getDiagonals(row, col);

    // 检查是否是"愚形三角"（三个子围一个空）
    let diagonalEmpty = 0;
    let diagonalSame = 0;
    for (const [dr, dc] of diagonalNeighbors) {
        if (dr >= 0 && dr < BOARD_SIZE && dc >= 0 && dc < BOARD_SIZE) {
            if (board[dr][dc] === 0) diagonalEmpty++;
            if (board[dr][dc] === color) diagonalSame++;
        }
    }

    // 2. 好的连接（避免断点）
    let sameColorCount = 0;
    let hasOpponentNeighbor = false;
    for (const [nr, nc] of neighbors) {
        if (board[nr][nc] === color) sameColorCount++;
        if (board[nr][nc] === opponent) hasOpponentNeighbor = true;
    }

    // 棋子分布评估（不要挤在一起）
    const myGroups = new Set();
    for (const [nr, nc] of neighbors) {
        if (board[nr][nc] === color) {
            const group = getGroup(board, nr, nc);
            myGroups.add(`${group[0][0]},${group[0][1]}`);
        }
    }

    if (sameColorCount >= 3) {
        // 过于密集，惩罚
        shapeScore -= sameColorCount;
    }

    // 中央位置加分
    const centerDist = Math.abs(row - 4) + Math.abs(col - 4);
    shapeScore += (8 - centerDist) * 0.5;

    return shapeScore;
}

// 获取对角位置
function getDiagonals(row, col) {
    return [
        [row - 1, col - 1], [row - 1, col + 1],
        [row + 1, col - 1], [row + 1, col + 1]
    ];
}

// ==================== 核心评估函数 ====================

// 综合评估落子分数
function evaluateMove(board, row, col, color, isAI = false, difficulty = AI_LEVEL.MEDIUM) {
    const moveInfo = classifyMove(board, row, col, color);
    let score = 0;

    // ========== 类型优先级（最重要）==========

    // 1. 吃子：基础分高，但需要权衡
    if (moveInfo.capturedStones > 0) {
        score += moveInfo.capturedStones * 15;

        // 多吃加分（非线性）
        if (moveInfo.capturedStones >= 2) {
            score += moveInfo.capturedStones * 5;
        }
    }

    // 2. 救活自己的死子
    if (moveInfo.types.includes(MoveType.SAVE)) {
        score += 12;
    }

    // 3. 攻击对方气紧的棋
    if (moveInfo.types.includes(MoveType.ATTACK)) {
        score += 10;
    }

    // 4. 扩张地盘
    if (moveInfo.types.includes(MoveType.CENTER)) {
        score += isAI ? 8 : 5;
    }

    // 5. 防守星位
    if (moveInfo.types.includes(MoveType.DEFEND)) {
        score += isAI ? 6 : 3;
    }

    // 6. 连接
    if (moveInfo.types.includes(MoveType.CONNECT)) {
        score += 4;
    }

    // 7. 接近手
    if (moveInfo.types.includes(MoveType.APPROACH)) {
        score += 3;
    }

    // ========== 形状评估 ==========
    score += evaluateShape(board, row, col, color);

    // ========== 位置价值 ==========
    // 中央优先（9路棋盘）
    const centerDist = Math.abs(row - 4) + Math.abs(col - 4);
    const posValue = (8 - centerDist) * 1.5;
    score += posValue;

    // 边界惩罚
    if (row === 0 || row === 8 || col === 0 || col === 8) {
        score -= 2;
    }

    // ========== 难度差异 ==========
    if (isAI) {
        // 星位偏好
        if ((row === 2 || row === 6) && (col === 2 || col === 6)) {
            score += 3;
        }
        if (row === 4 && col === 4) {
            score += 5;
        }

        // 困难模式下增加前瞻评估
        if (difficulty === AI_LEVEL.HARD) {
            score += evaluateTacticalValue(board, row, col, color);
        }
    }

    // ========== 征子检查（惩罚）==========
    // 如果这步棋会被征子吃掉，大幅降低分数
    const wouldBeCaptured = wouldBeCapturedLadder(board, row, col, color);
    if (wouldBeCaptured) {
        score -= 30;
    }

    return score;
}

// 战术价值评估（困难模式）
function evaluateTacticalValue(board, row, col, color) {
    const opponent = color === BLACK ? WHITE : BLACK;
    let tacticalScore = 0;

    // 创建临时棋盘
    const tempBoard = copyBoard(board);
    tempBoard[row][col] = color;

    // 1. 这步棋之后，对方有哪些威胁？
    const myLiberties = countGroupLiberties(tempBoard, row, col);
    if (myLiberties <= 2) {
        tacticalScore -= (3 - myLiberties) * 3; // 气少容易被吃
    }

    // 2. 能否利用这步棋封锁对方？
    const neighbors = getNeighbors(row, col);
    for (const [nr, nc] of neighbors) {
        if (board[nr][nc] === opponent) {
            const oppLibs = countGroupLiberties(board, nr, nc);
            if (oppLibs === 3) {
                tacticalScore += 3; // 威胁对方
            }
        }
    }

    // 3. 后续手段：如果落子后能继续进攻，价值更高
    const followMoves = getAllValidMoves(tempBoard, color);
    let bestFollowScore = 0;
    for (const move of followMoves.slice(0, 5)) {
        const s = evaluateMove(tempBoard, move.row, move.col, color, false, AI_LEVEL.MEDIUM);
        if (s > bestFollowScore) bestFollowScore = s;
    }
    tacticalScore += bestFollowScore * 0.2;

    return tacticalScore;
}

// 获取所有合法落子
function getAllValidMoves(board, color) {
    const moves = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const validation = isValidMove(board, r, c, color, true);
            if (validation.valid) {
                const moveInfo = classifyMove(board, r, c, color);
                moves.push({ row: r, col: c, validation, moveInfo });
            }
        }
    }
    return moves;
}

// ==================== 各难度AI ====================

// 简单AI：有点章法的随机
function aiMoveEasy(board, color) {
    const validMoves = getAllValidMoves(board, color);
    if (validMoves.length === 0) return null;

    // 30%概率选最优，70%概率从好位置中随机
    const scoredMoves = validMoves.map(m => ({
        ...m,
        score: evaluateMove(board, m.row, m.col, color, true, AI_LEVEL.EASY)
    }));

    // 取前50%的好棋
    scoredMoves.sort((a, b) => b.score - a.score);
    const topCount = Math.max(3, Math.floor(validMoves.length * 0.5));
    const topMoves = scoredMoves.slice(0, topCount);

    // 80%概率选好棋，20%概率随便选（增加变化）
    if (Math.random() < 0.8) {
        return topMoves[Math.floor(Math.random() * topMoves.length)];
    }
    return validMoves[Math.floor(Math.random() * validMoves.length)];
}

// 中等AI：认真下棋
function aiMoveMedium(board, color) {
    const validMoves = getAllValidMoves(board, color);
    if (validMoves.length === 0) return null;

    const scoredMoves = validMoves.map(m => ({
        ...m,
        score: evaluateMove(board, m.row, m.col, color, true, AI_LEVEL.MEDIUM)
    }));

    scoredMoves.sort((a, b) => b.score - a.score);

    // 70%概率选最优，30%概率选择次优（增加变化）
    if (scoredMoves.length > 2 && Math.random() < 0.3) {
        const threshold = scoredMoves[0].score - 5;
        const nearTop = scoredMoves.filter(m => m.score >= threshold);
        return nearTop[Math.floor(Math.random() * nearTop.length)];
    }

    return scoredMoves[0];
}

// 困难AI：更深思考 + 考虑对方应手
function aiMoveHard(board, color) {
    const validMoves = getAllValidMoves(board, color);
    if (validMoves.length === 0) return null;

    const opponent = color === BLACK ? WHITE : BLACK;
    let bestMove = validMoves[0];
    let bestScore = -Infinity;

    for (const move of validMoves) {
        // 模拟落子
        const tempBoard = copyBoard(board);
        const result = makeMove(tempBoard, move.row, move.col, color);
        if (!result.success) continue;

        let score = 0;

        // 基础评估
        score += evaluateMove(board, move.row, move.col, color, true, AI_LEVEL.HARD) * 1.2;

        // 对方最佳应对
        const oppMoves = getAllValidMoves(result.board, opponent);
        if (oppMoves.length > 0) {
            let worstCase = Infinity;
            let bestOppScore = -Infinity;

            for (const oppMove of oppMoves) {
                const oppScore = evaluateMove(result.board, oppMove.row, oppMove.col, opponent, false, AI_LEVEL.MEDIUM);
                if (oppScore > bestOppScore) bestOppScore = oppScore;
                if (oppScore < worstCase) worstCase = oppScore;
            }

            // 对手越难应对越好
            score += (15 - worstCase) * 0.4;
            // 对手能得到的越少越好
            score -= bestOppScore * 0.3;
        }

        // 棋盘控制力
        score += evaluateBoardControl(result.board, color) * 0.3;

        // 地形因素
        score += evaluateTerritory(result.board, color) * 0.2;

        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }

    // 80%选最优，20%选次优
    const topMoves = validMoves.filter(m => {
        const s = evaluateMove(board, m.row, m.col, color, true, AI_LEVEL.HARD);
        return s >= bestScore / 1.1;
    });

    if (topMoves.length > 1 && Math.random() < 0.2) {
        return topMoves[Math.floor(Math.random() * topMoves.length)];
    }

    return bestMove;
}

// 评估棋盘控制力
function evaluateBoardControl(board, color) {
    let control = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === color) {
                control += 1;
                control += (8 - Math.abs(r - 4) + 8 - Math.abs(c - 4)) * 0.1;
            }
        }
    }
    return control;
}

// 评估地盘价值（简化版）
function evaluateTerritory(board, color) {
    let territory = 0;
    const opponent = color === BLACK ? WHITE : BLACK;

    // 统计边界控制
    for (let i = 0; i < BOARD_SIZE; i++) {
        if (board[0][i] === color) territory += 0.5;
        if (board[8][i] === color) territory += 0.5;
        if (board[i][0] === color) territory += 0.5;
        if (board[i][8] === color) territory += 0.5;
    }

    return territory;
}

// ==================== 主入口 ====================

function getAIMove(board, color, difficulty = AI_LEVEL.MEDIUM) {
    switch (difficulty) {
        case AI_LEVEL.EASY:
            return aiMoveEasy(board, color);
        case AI_LEVEL.MEDIUM:
            return aiMoveMedium(board, color);
        case AI_LEVEL.HARD:
            return aiMoveHard(board, color);
        default:
            return aiMoveMedium(board, color);
    }
}
