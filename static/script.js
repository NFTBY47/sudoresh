document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('sudokuGrid');
    const solveBtn = document.getElementById('solveBtn');
    const clearBtn = document.getElementById('clearBtn');
    const fallingNumbers = document.getElementById('fallingNumbers');
    const modal = document.getElementById('modal');
    const closeModal = document.getElementById('closeModal');

    // URL твоего бэкенда на PythonAnywhere
    const BACKEND_URL = 'https://almorozov.pythonanywhere.com';
    
    let isSolving = false;

    // Функции для модального окна
    function showModal() {
        modal.style.display = 'block';
    }

    function hideModal() {
        modal.style.display = 'none';
    }

    // Закрытие модального окна
    closeModal.addEventListener('click', hideModal);
    
    // Закрытие при клике вне окна
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideModal();
        }
    });
    
    // Закрытие на Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            hideModal();
        }
    });

    // Создаём сетку
    function createGrid() {
        grid.innerHTML = '';
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('input');
            cell.type = 'text';
            cell.maxLength = 1;
            cell.className = 'sudoku-cell';
            cell.dataset.index = i;
            
            cell.addEventListener('input', e => {
                if (!/^[1-9]?$/.test(e.target.value)) {
                    e.target.value = '';
                } else {
                    e.target.classList.add('user-input');
                }
            });
            
            // Добавляем обработчик для клавиш для лучшего UX
            cell.addEventListener('keydown', e => {
                if (e.key === 'Backspace' || e.key === 'Delete') {
                    setTimeout(() => {
                        if (cell.value === '') {
                            cell.classList.remove('user-input');
                        }
                    }, 0);
                }
                
                // Навигация стрелками
                if (e.key.startsWith('Arrow')) {
                    e.preventDefault();
                    navigateGrid(e.key, i);
                }
            });
            
            grid.appendChild(cell);
        }
    }

    // Навигация по сетке стрелками
    function navigateGrid(direction, currentIndex) {
        let newIndex = currentIndex;
        
        switch(direction) {
            case 'ArrowUp':
                newIndex = currentIndex - 9;
                break;
            case 'ArrowDown':
                newIndex = currentIndex + 9;
                break;
            case 'ArrowLeft':
                newIndex = currentIndex - 1;
                break;
            case 'ArrowRight':
                newIndex = currentIndex + 1;
                break;
        }
        
        if (newIndex >= 0 && newIndex < 81) {
            grid.children[newIndex].focus();
        }
    }

    // Получаем текущее состояние доски
    function getBoard() {
        const board = [];
        for (let i = 0; i < 81; i++) {
            const cell = grid.children[i];
            board.push(cell.value === '' ? 0 : parseInt(cell.value));
        }
        return board;
    }

    // Устанавливаем значения в клетки
    function setBoard(board) {
        for (let i = 0; i < 81; i++) {
            const cell = grid.children[i];
            const originalValue = cell.value;
            const newValue = board[i];
            
            if (newValue !== 0 && originalValue === '') {
                cell.value = newValue;
                cell.classList.add('solved');
                cell.classList.remove('user-input');
            }
        }
    }

    // Основная функция решения судоку
    async function solveSudoku() {
        if (isSolving) return;
        
        isSolving = true;
        solveBtn.disabled = true;
        solveBtn.textContent = '...';

        const originalBoard = getBoard();
        
        // Проверяем, есть ли вообще введенные цифры
        const hasInput = originalBoard.some(cell => cell !== 0);
        if (!hasInput) {
            alert('Введите хотя бы одну цифру в судоку!');
            isSolving = false;
            solveBtn.disabled = false;
            solveBtn.textContent = 'Решить';
            return;
        }
        
        try {
            console.log('Отправляем запрос на бэкенд:', BACKEND_URL);
            console.log('Доска для решения:', originalBoard);
            
            const response = await fetch(`${BACKEND_URL}/solve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    board: originalBoard 
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Получен ответ от бэкенда:', data);

            if (data.solved) {
                // Отображаем решение
                setBoard(data.board);
                console.log('Судоку решено успешно!');
            } else {
                console.log('Судоку не имеет решения');
                showModal();
            }
            
        } catch (error) {
            console.error('Ошибка при решении:', error);
            
            // Проверяем тип ошибки
            if (error.message.includes('Failed to fetch')) {
                const errorMessage = `Не удалось подключиться к серверу.\n\nПроверьте:\n1. Запущен ли бэкенд на PythonAnywhere\n2. Правильность URL: ${BACKEND_URL}\n3. Настройки CORS на бэкенде`;
                alert(errorMessage);
            } else {
                showModal();
            }
        } finally {
            isSolving = false;
            solveBtn.disabled = false;
            solveBtn.textContent = 'Решить';
        }
    }

    // Очистка сетки
    function clearGrid() {
        for (let i = 0; i < 81; i++) {
            const cell = grid.children[i];
            cell.value = '';
            cell.classList.remove('user-input', 'solved', 'trying', 'backtracking');
        }
    }

    // Падающие цифры
    function createFallingNumbers() {
        const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        setInterval(() => {
            const el = document.createElement('div');
            el.className = 'falling-number';
            el.textContent = nums[Math.floor(Math.random() * nums.length)];
            el.style.left = Math.random() * 100 + 'vw';
            el.style.animationDuration = (8 + Math.random() * 12) + 's';
            el.style.opacity = 0.1 + Math.random() * 0.2;
            
            fallingNumbers.appendChild(el);
            
            // Удаляем элемент после анимации
            setTimeout(() => {
                if (el.parentNode === fallingNumbers) {
                    fallingNumbers.removeChild(el);
                }
            }, 20000);
        }, window.innerWidth < 768 ? 800 : 400);
    }

    // Быстрая проверка соединения с бэкендом
    async function checkBackendConnection() {
        try {
            const response = await fetch(`${BACKEND_URL}/`, {
                method: 'GET'
            });
            console.log('Проверка соединения с бэкендом:', response.status);
            return response.ok;
        } catch (error) {
            console.warn('Бэкенд недоступен:', error.message);
            return false;
        }
    }

    // Обработчики событий
    solveBtn.addEventListener('click', solveSudoku);
    clearBtn.addEventListener('click', clearGrid);

    // Инициализация
    createGrid();
    createFallingNumbers();
    
    // Проверяем соединение при загрузке
    setTimeout(() => {
        checkBackendConnection().then(isConnected => {
            if (!isConnected) {
                console.warn('Внимание: бэкенд может быть недоступен');
            }
        });
    }, 1000);

    // Добавляем глобальную переменную для отладки
    window.sudokuApp = {
        getBoard,
        setBoard,
        clearGrid,
        checkBackendConnection,
        BACKEND_URL
    };
    
    console.log('SUDO.RESH инициализирован');
    console.log('Backend URL:', BACKEND_URL);
    console.log('Для отладки используйте window.sudokuApp');
});