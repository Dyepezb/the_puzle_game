const puzzleBoard = document.getElementById('puzzleBoard');
const puzzlePiecesContainer = document.getElementById('puzzlePiecesContainer');
const resetButton = document.getElementById('resetButton');
const timerDisplay = document.getElementById('timerDisplay');

const successModal = document.getElementById('successModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const closeButton = document.querySelector('.close-button');
const modalResetButton = document.getElementById('modalResetButton');

// --- Configuración del rompecabezas para 4x5 piezas con imagen de 738x398 ---
const IMAGE_SRC = 'images/puzzle_image.jpg'; // Ruta a tu imagen de 738x398px
const NUM_COLS = 4; // 4 columnas
const NUM_ROWS = 5; // 5 filas

// Las dimensiones de la imagen original (se usará para calcular porcentajes de fondo)
const ORIGINAL_IMAGE_WIDTH = 738;
const ORIGINAL_IMAGE_HEIGHT = 398;

let puzzlePieces = [];
let puzzleSlots = [];
let draggedPiece = null;
let isGameStarted = false;

let startTime; 
let timerInterval; 

// --- Función para inicializar el juego ---
async function initializeGame() {
    successModal.style.display = 'none';

    const img = new Image();
    img.src = IMAGE_SRC;
    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => {
            console.error("Error al cargar la imagen:", IMAGE_SRC);
            alert("No se pudo cargar la imagen del rompecabezas. Por favor, verifica la ruta y el nombre del archivo.");
            reject();
        };
    });

    // --- CAMBIO: Usar 'fr' para hacer el grid responsivo ---
    puzzleBoard.style.gridTemplateColumns = `repeat(${NUM_COLS}, 1fr)`;
    puzzleBoard.style.gridTemplateRows = `repeat(${NUM_ROWS}, 1fr)`;
    // --- Ya no necesitamos width/height en JS, el CSS se encarga con aspect-ratio ---
    // puzzleBoard.style.width = `${ORIGINAL_IMAGE_WIDTH}px`;
    // puzzleBoard.style.height = `${ORIGINAL_IMAGE_HEIGHT}px`;

    puzzlePiecesContainer.innerHTML = '';
    puzzleBoard.innerHTML = '';
    
    puzzlePieces = [];
    puzzleSlots = [];
    draggedPiece = null;
    isGameStarted = false;

    clearInterval(timerInterval);
    timerDisplay.textContent = '00:00';
    startTime = null; 

    // 1. Crear los espacios (slots) en el tablero
    for (let i = 0; i < NUM_COLS * NUM_ROWS; i++) {
        const slot = document.createElement('div');
        slot.classList.add('puzzle-piece-slot');
        slot.dataset.slotId = i;
        slot.dataset.currentPieceId = 'none';
        slot.classList.remove('correct-piece'); 
        puzzleBoard.appendChild(slot);
        puzzleSlots.push(slot);

        slot.addEventListener('dragover', dragOver);
        slot.addEventListener('dragleave', dragLeave);
        slot.addEventListener('drop', drop);
    }

    // 2. Crear las piezas del rompecabezas
    for (let i = 0; i < NUM_COLS * NUM_ROWS; i++) {
        const piece = document.createElement('div');
        piece.classList.add('puzzle-piece');
        piece.draggable = true;
        piece.dataset.pieceId = i;

        piece.classList.remove('fixed'); 

        const col = i % NUM_COLS;
        const row = Math.floor(i / NUM_COLS);
        
        // --- CAMBIO CLAVE: Posicionamiento de fondo en porcentajes ---
        // background-size: ${NUM_COLS * 100}% ${NUM_ROWS * 100}%
        // Esto estira la imagen de fondo para cubrir todo el espacio de la cuadrícula
        // (es decir, el ancho de la imagen es 4 veces el ancho de una pieza, y el alto es 5 veces el alto de una pieza).
        // Si la imagen es de 738x398, y una pieza es 1/4 de ancho y 1/5 de alto,
        // entonces el tamaño total de fondo para cada pieza debe ser 400% x 500% del tamaño de la pieza.
        piece.style.backgroundSize = `${NUM_COLS * 100}% ${NUM_ROWS * 100}%`;

        // background-position: -col*100/NUM_COLS % -row*100/NUM_ROWS %
        // Esto mueve el fondo para mostrar la porción correcta.
        const bgPosX = -(col * 100 / NUM_COLS);
        const bgPosY = -(row * 100 / NUM_ROWS);
        piece.style.backgroundPosition = `${bgPosX}% ${bgPosY}%`;

        // --- Ya no necesitamos width/height aquí, el CSS con 100% y grid se encarga ---
        // piece.style.width = `${PIECE_WIDTH}px`;
        // piece.style.height = `${PIECE_HEIGHT}px`;

        piece.style.backgroundImage = `url(${IMAGE_SRC})`;
        piece.style.backgroundRepeat = 'no-repeat'; // Asegurarse de que no se repita

        puzzlePieces.push(piece);
        
        piece.addEventListener('dragstart', dragStart);
        piece.addEventListener('dragend', dragEnd);
    }

    shuffleArray(puzzlePieces);
    puzzlePieces.forEach(piece => {
        puzzlePiecesContainer.appendChild(piece);
    });
}

// --- Resto del código (sin cambios significativos) ---

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function dragStart(e) {
    if (!isGameStarted) {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
        isGameStarted = true;
    }

    draggedPiece = this; 
    if (draggedPiece.classList.contains('fixed')) {
        e.preventDefault();
        draggedPiece = null;
        return;
    }

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.dataset.pieceId);
    
    if (this.parentNode.classList.contains('puzzle-piece-slot')) {
        this.parentNode.dataset.currentPieceId = 'none'; 
        this.parentNode.classList.remove('correct-piece');
    }
    
    setTimeout(() => {
        this.style.opacity = '0.5'; 
    }, 0);
}

function dragEnd() {
    if (draggedPiece) {
        this.style.opacity = '1';
    }
    draggedPiece = null;
}

function dragOver(e) {
    e.preventDefault(); 
    if (this.dataset.currentPieceId === 'none') { 
        this.classList.add('drag-over');
    }
}

function dragLeave() {
    this.classList.remove('drag-over');
}

function drop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');

    if (this.dataset.currentPieceId === 'none') {
        const pieceId = draggedPiece.dataset.pieceId;
        const targetSlotId = parseInt(this.dataset.slotId);

        this.appendChild(draggedPiece);
        this.dataset.currentPieceId = pieceId;

        if (parseInt(pieceId) === targetSlotId) {
            draggedPiece.classList.add('fixed');
            this.classList.add('correct-piece');
            draggedPiece.draggable = false;
        } else {
            draggedPiece.classList.remove('fixed');
            this.classList.remove('correct-piece');
        }

        checkWinCondition(); 
    }
}

function checkWinCondition() {
    let allInPlace = true;
    for (let i = 0; i < puzzleSlots.length; i++) {
        const slot = puzzleSlots[i];
        if (slot.dataset.currentPieceId !== String(slot.dataset.slotId)) {
            allInPlace = false;
            break;
        }
    }

    if (allInPlace) {
        clearInterval(timerInterval);

        puzzlePieces.forEach(piece => {
            piece.classList.add('fixed');
            piece.draggable = false;
        });

        modalMessage.textContent = `¡Has resuelto el rompecabezas en ${timerDisplay.textContent}!`;
        successModal.style.display = 'flex';
    }
}

function updateTimer() {
    const elapsedTime = Date.now() - startTime; 
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
}

resetButton.addEventListener('click', initializeGame);
modalResetButton.addEventListener('click', initializeGame);

closeButton.addEventListener('click', () => {
    successModal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === successModal) {
        successModal.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', initializeGame);