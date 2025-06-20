const puzzleBoard = document.getElementById('puzzleBoard');
const puzzlePiecesContainer = document.getElementById('puzzlePiecesContainer');
const resetButton = document.getElementById('resetButton');
const timerDisplay = document.getElementById('timerDisplay');

// --- NUEVO: Elementos del Modal ---
const successModal = document.getElementById('successModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const closeButton = document.querySelector('.close-button');
const modalResetButton = document.getElementById('modalResetButton');
// --- FIN NUEVO ---

// --- Configuración del rompecabezas para 4x5 piezas con imagen de 738x398 ---
const IMAGE_SRC = 'images/puzzle_image.jpg'; // Ruta a tu imagen de 738x398px
const NUM_COLS = 4; // 4 columnas
const NUM_ROWS = 5; // 5 filas

const PIECE_WIDTH = 738 / NUM_COLS; // Ancho de cada pieza: 738 / 4 = 184.5px
const PIECE_HEIGHT = 398 / NUM_ROWS; // Alto de cada pieza: 398 / 5 = 79.6px

let puzzlePieces = [];
let puzzleSlots = [];
let draggedPiece = null;
let isGameStarted = false;

// Variables para el cronómetro
let startTime; 
let timerInterval; 

// --- Función para inicializar el juego ---
async function initializeGame() {
    // Ocultar el modal si está visible
    successModal.style.display = 'none';

    // Cargar la imagen primero para obtener sus dimensiones reales
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

    // Ajustar el tamaño del tablero dinámicamente
    puzzleBoard.style.gridTemplateColumns = `repeat(${NUM_COLS}, ${PIECE_WIDTH}px)`;
    puzzleBoard.style.gridTemplateRows = `repeat(${NUM_ROWS}, ${PIECE_HEIGHT}px)`;
    puzzleBoard.style.width = `${NUM_COLS * PIECE_WIDTH}px`;
    puzzleBoard.style.height = `${NUM_ROWS * PIECE_HEIGHT}px`;

    puzzlePiecesContainer.innerHTML = '';
    puzzleBoard.innerHTML = '';
    
    puzzlePieces = [];
    puzzleSlots = [];
    draggedPiece = null;
    isGameStarted = false;

    // Detener y reiniciar el cronómetro
    clearInterval(timerInterval);
    timerDisplay.textContent = '00:00';
    startTime = null; 

    // 1. Crear los espacios (slots) en el tablero
    for (let i = 0; i < NUM_COLS * NUM_ROWS; i++) {
        const slot = document.createElement('div');
        slot.classList.add('puzzle-piece-slot');
        slot.dataset.slotId = i;
        slot.dataset.currentPieceId = 'none';
        // Remover la clase 'correct-piece' al reiniciar
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

        // Remover la clase 'fixed' al reiniciar
        piece.classList.remove('fixed'); 

        const col = i % NUM_COLS;
        const row = Math.floor(i / NUM_COLS);
        const bgPosX = -(col * PIECE_WIDTH);
        const bgPosY = -(row * PIECE_HEIGHT);

        piece.style.width = `${PIECE_WIDTH}px`;
        piece.style.height = `${PIECE_HEIGHT}px`;
        piece.style.backgroundImage = `url(${IMAGE_SRC})`;
        piece.style.backgroundPosition = `${bgPosX}px ${bgPosY}px`;
        piece.style.backgroundSize = `${NUM_COLS * PIECE_WIDTH}px ${NUM_ROWS * PIECE_HEIGHT}px`;

        puzzlePieces.push(piece);
        
        piece.addEventListener('dragstart', dragStart);
        piece.addEventListener('dragend', dragEnd);
    }

    // 3. Mezclar las piezas y añadirlas al contenedor de piezas
    shuffleArray(puzzlePieces);
    puzzlePieces.forEach(piece => {
        puzzlePiecesContainer.appendChild(piece);
    });
}

// --- Función para mezclar un array (Algoritmo Fisher-Yates) ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// --- Eventos de arrastre (Drag & Drop) ---

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

// --- Función para verificar la condición de victoria ---
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
        clearInterval(timerInterval); // Detener el cronómetro

        // Asegurarse de que todas las piezas estén fijas y no arrastrables al final
        puzzlePieces.forEach(piece => {
            piece.classList.add('fixed');
            piece.draggable = false;
        });

        // --- NUEVO: Mostrar el modal de felicitaciones ---
        modalMessage.textContent = `¡Has resuelto el rompecabezas en ${timerDisplay.textContent}!`;
        successModal.style.display = 'flex'; // Mostrar el modal
        // --- FIN NUEVO ---
    }
}

// --- Función para actualizar el cronómetro ---
function updateTimer() {
    const elapsedTime = Date.now() - startTime; 
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(seconds).padStart(2, '0');

    timerDisplay.textContent = `${formattedMinutes}:${formattedSeconds}`;
}

// --- Event listeners para los botones de reiniciar y cerrar modal ---
resetButton.addEventListener('click', initializeGame);
modalResetButton.addEventListener('click', initializeGame); // Reiniciar desde el modal

// Cierra el modal cuando se hace clic en la 'x'
closeButton.addEventListener('click', () => {
    successModal.style.display = 'none';
});

// Cierra el modal si el usuario hace clic fuera del contenido del modal
window.addEventListener('click', (event) => {
    if (event.target === successModal) {
        successModal.style.display = 'none';
    }
});

// --- Iniciar el juego cuando la página carga ---
document.addEventListener('DOMContentLoaded', initializeGame);