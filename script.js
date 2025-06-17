// Configurações do jogo
const BOARD_SIZE = 10;
const SHIP_SIZES = [3, 4, 5];

// Estado do jogo
let gameState = {
    currentPlayer: 1,
    gameStarted: false,
    gameEnded: false,
    player1Board: [],
    player2Board: [],
    player1Ships: [],
    player2Ships: [],
    player1Attacks: [],
    player2Attacks: []
};

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', function() {
    initializeGame();
});

/**
 * Inicializa o estado do jogo
 */
function initializeGame() {
    // Criar tabuleiros vazios
    gameState.player1Board = createEmptyBoard();
    gameState.player2Board = createEmptyBoard();
    gameState.player1Attacks = createEmptyBoard();
    gameState.player2Attacks = createEmptyBoard();
    
    // Gerar navios aleatoriamente para ambos os jogadores
    gameState.player1Ships = generateRandomShips();
    gameState.player2Ships = generateRandomShips();
    
    // Posicionar navios nos tabuleiros
    placeShipsOnBoard(gameState.player1Board, gameState.player1Ships);
    placeShipsOnBoard(gameState.player2Board, gameState.player2Ships);
    
    // Criar interface visual
    createBoardUI();
    updateDisplay();
}

/**
 * Cria um tabuleiro vazio 10x10
 */
function createEmptyBoard() {
    return Array(BOARD_SIZE).fill().map(() => Array(BOARD_SIZE).fill(0));
}

/**
 * Gera posições aleatórias para os navios
 */
function generateRandomShips() {
    const ships = [];
    const occupiedCells = new Set();
    
    for (let shipSize of SHIP_SIZES) {
        let placed = false;
        let attempts = 0;
        
        while (!placed && attempts < 100) {
            const horizontal = Math.random() < 0.5;
            const startRow = Math.floor(Math.random() * BOARD_SIZE);
            const startCol = Math.floor(Math.random() * BOARD_SIZE);
            
            if (canPlaceShip(startRow, startCol, shipSize, horizontal, occupiedCells)) {
                const shipCells = [];
                
                for (let i = 0; i < shipSize; i++) {
                    const row = horizontal ? startRow : startRow + i;
                    const col = horizontal ? startCol + i : startCol;
                    shipCells.push({row, col});
                    occupiedCells.add(`${row}-${col}`);
                }
                
                ships.push({
                    size: shipSize,
                    cells: shipCells,
                    hits: 0,
                    sunk: false
                });
                placed = true;
            }
            attempts++;
        }
    }
    
    return ships;
}

/**
 * Verifica se é possível posicionar um navio
 */
function canPlaceShip(startRow, startCol, size, horizontal, occupiedCells) {
    // Verificar se o navio cabe no tabuleiro
    if (horizontal && startCol + size > BOARD_SIZE) return false;
    if (!horizontal && startRow + size > BOARD_SIZE) return false;
    
    // Verificar se não há conflito com outros navios
    for (let i = 0; i < size; i++) {
        const row = horizontal ? startRow : startRow + i;
        const col = horizontal ? startCol + i : startCol;
        
        if (occupiedCells.has(`${row}-${col}`)) return false;
        
        // Verificar células adjacentes (incluindo diagonais)
        for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
                const adjRow = row + dr;
                const adjCol = col + dc;
                
                if (adjRow >= 0 && adjRow < BOARD_SIZE && 
                    adjCol >= 0 && adjCol < BOARD_SIZE &&
                    occupiedCells.has(`${adjRow}-${adjCol}`)) {
                    return false;
                }
            }
        }
    }
    
    return true;
}

/**
 * Posiciona os navios no tabuleiro
 */
function placeShipsOnBoard(board, ships) {
    ships.forEach(ship => {
        ship.cells.forEach(cell => {
            board[cell.row][cell.col] = 1;
        });
    });
}

/**
 * Cria a interface visual dos tabuleiros
 */
function createBoardUI() {
    const attackBoard = document.getElementById('attackBoard');
    const ownBoard = document.getElementById('ownBoard');
    
    // Limpar tabuleiros existentes
    attackBoard.innerHTML = '';
    ownBoard.innerHTML = '';
    
    // Criar células do tabuleiro de ataque
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell water';
            cell.dataset.row = row;
            cell.dataset.col = col;
            cell.addEventListener('click', () => handleAttack(row, col));
            attackBoard.appendChild(cell);
        }
    }
    
    // Criar células do próprio tabuleiro
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.row = row;
            cell.dataset.col = col;
            
            // Mostrar navios do jogador atual
            const currentPlayerBoard = gameState.currentPlayer === 1 ? 
                gameState.player1Board : gameState.player2Board;
            
            if (currentPlayerBoard[row][col] === 1) {
                cell.classList.add('ship');
            } else {
                cell.classList.add('water');
            }
            
            ownBoard.appendChild(cell);
        }
    }
}

/**
 * Processa um ataque
 */
function handleAttack(row, col) {
    if (!gameState.gameStarted || gameState.gameEnded) return;
    
    const attackBoard = gameState.currentPlayer === 1 ? 
        gameState.player1Attacks : gameState.player2Attacks;
    const enemyBoard = gameState.currentPlayer === 1 ? 
        gameState.player2Board : gameState.player1Board;
    const enemyShips = gameState.currentPlayer === 1 ? 
        gameState.player2Ships : gameState.player1Ships;
    
    // Verificar se a célula já foi atacada
    if (attackBoard[row][col] !== 0) return;
    
    // Processar o ataque
    const isHit = enemyBoard[row][col] === 1;
    attackBoard[row][col] = isHit ? 2 : 1; // 2 = acerto, 1 = erro
    
    if (isHit) {
        // Encontrar e atualizar o navio atingido
        const hitShip = enemyShips.find(ship => 
            ship.cells.some(cell => cell.row === row && cell.col === col)
        );
        
        if (hitShip) {
            hitShip.hits++;
            if (hitShip.hits >= hitShip.size) {
                hitShip.sunk = true;
            }
        }
        
        // Verificar vitória
        if (enemyShips.every(ship => ship.sunk)) {
            endGame(`Jogador ${gameState.currentPlayer} Venceu! 🎉`);
            return;
        }
        
        showMessage(`Jogador ${gameState.currentPlayer} acertou! 💥`);
    } else {
        showMessage(`Jogador ${gameState.currentPlayer} errou! 💧`);
    }
    
    // Atualizar visual do tabuleiro de ataque
    updateAttackBoard();
    
    // Trocar jogador
    gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
    
    // Atualizar tabuleiro próprio para o novo jogador
    updateOwnBoard();
    updateDisplay();
}

/**
 * Atualiza o tabuleiro de ataque visual
 */
function updateAttackBoard() {
    const attackBoard = document.getElementById('attackBoard');
    const attacks = gameState.currentPlayer === 1 ? 
        gameState.player1Attacks : gameState.player2Attacks;
    
    const cells = attackBoard.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        const row = Math.floor(index / BOARD_SIZE);
        const col = index % BOARD_SIZE;
        const cellState = attacks[row][col];
        
        // Remover classes anteriores
        cell.classList.remove('water', 'hit', 'miss');
        
        if (cellState === 2) {
            cell.classList.add('hit');
        } else if (cellState === 1) {
            cell.classList.add('miss');
        } else {
            cell.classList.add('water');
        }
    });
}

/**
 * Atualiza o próprio tabuleiro visual
 */
function updateOwnBoard() {
    const ownBoard = document.getElementById('ownBoard');
    const currentPlayerBoard = gameState.currentPlayer === 1 ? 
        gameState.player1Board : gameState.player2Board;
    const enemyAttacks = gameState.currentPlayer === 1 ? 
        gameState.player2Attacks : gameState.player1Attacks;
    
    const cells = ownBoard.querySelectorAll('.cell');
    cells.forEach((cell, index) => {
        const row = Math.floor(index / BOARD_SIZE);
        const col = index % BOARD_SIZE;
        const hasShip = currentPlayerBoard[row][col] === 1;
        const wasAttacked = enemyAttacks[row][col] !== 0;
        const wasHit = enemyAttacks[row][col] === 2;
        
        // Remover classes anteriores
        cell.classList.remove('water', 'ship', 'hit', 'miss');
        
        if (wasAttacked && hasShip) {
            cell.classList.add('hit');
        } else if (wasAttacked && !hasShip) {
            cell.classList.add('miss');
        } else if (hasShip) {
            cell.classList.add('ship');
        } else {
            cell.classList.add('water');
        }
    });
}

/**
 * Atualiza a interface do usuário
 */
function updateDisplay() {
    const turnDisplay = document.getElementById('turnDisplay');
    
    if (!gameState.gameStarted) {
        turnDisplay.textContent = 'Clique em "Iniciar Jogo" para começar!';
    } else if (gameState.gameEnded) {
        turnDisplay.textContent = 'Jogo finalizado!';
    } else {
        turnDisplay.textContent = `Turno do Jogador ${gameState.currentPlayer}`;
    }
}

/**
 * Inicia o jogo
 */
function startGame() {
    gameState.gameStarted = true;
    gameState.gameEnded = false;
    gameState.currentPlayer = 1;
    
    document.getElementById('startBtn').disabled = true;
    updateDisplay();
    updateOwnBoard();
    showMessage('Jogo iniciado! Jogador 1 começa! 🚀');
}

/**
 * Reinicia o jogo
 */
function resetGame() {
    gameState.gameStarted = false;
    gameState.gameEnded = false;
    gameState.currentPlayer = 1;
    
    document.getElementById('startBtn').disabled = false;
    hideMessage();
    
    initializeGame();
    showMessage('Jogo reiniciado! 🔄');
}

/**
 * Finaliza o jogo
 */
function endGame(message) {
    gameState.gameEnded = true;
    showMessage(message, true);
    updateDisplay();
}

/**
 * Mostra uma mensagem temporária
 */
function showMessage(message, permanent = false) {
    const messageDiv = document.getElementById('gameMessage');
    messageDiv.textContent = message;
    messageDiv.classList.add('show');
    
    if (!permanent) {
        setTimeout(() => {
            hideMessage();
        }, 2000);
    }
}

/**
 * Esconde a mensagem
 */
function hideMessage() {
    const messageDiv = document.getElementById('gameMessage');
    messageDiv.classList.remove('show');
}