document.addEventListener('DOMContentLoaded', () => {
    const elementsContainer = document.getElementById('elements-container');
    const slot1 = document.getElementById('slot1');
    const slot2 = document.getElementById('slot2');
    const resultElement = document.getElementById('result-element');

    const API_KEY = 'AIzaSyAHRP0yERDF8brcR-Co9WGVTA9j9tpM2S0';
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=${API_KEY}`;

    // Начальные элементы
    const initialElements = new Set(['🔥 Огонь', '💧 Вода', '🌬️ Ветер', '🌍 Земля']);
    let discoveredElements = new Set();
    let selectedElements = []; // Массив для хранения выбранных элементов

    // --- Загрузка и сохранение ---
    function saveElements() {
        localStorage.setItem('infiniteCraftElements', JSON.stringify(Array.from(discoveredElements)));
    }

    function loadElements() {
        const savedElements = localStorage.getItem('infiniteCraftElements');
        if (savedElements) {
            discoveredElements = new Set(JSON.parse(savedElements));
        }
        // Если нет сохраненных элементов или они не соответствуют начальным, сбрасываем
        if (discoveredElements.size === 0 || !Array.from(initialElements).every(item => discoveredElements.has(item))) {
            discoveredElements = new Set(initialElements);
            saveElements();
        }
        renderElements();
    }

    // --- Создание и рендеринг элементов ---
    function createElementDiv(name) {
        const elementDiv = document.createElement('div');
        elementDiv.className = 'element';
        elementDiv.textContent = name;
        elementDiv.addEventListener('click', () => handleElementClick(name, elementDiv));
        return elementDiv;
    }

    function renderElements() {
        elementsContainer.innerHTML = '';
        Array.from(discoveredElements).sort((a, b) => a.localeCompare(b)).forEach(name => {
            elementsContainer.appendChild(createElementDiv(name));
        });
    }

    // --- Обработка кликов по элементам ---
    async function handleElementClick(name, elementDiv) {
        if (selectedElements.length === 0) {
            // Выбран первый элемент
            selectedElements.push(name);
            slot1.textContent = name;
            elementDiv.classList.add('selected');
            resultElement.textContent = ''; // Очищаем результат
        } else if (selectedElements.length === 1) {
            // Выбран второй элемент
            selectedElements.push(name);
            slot2.textContent = name;
            elementDiv.classList.add('selected');
            
            // Комбинируем
            await combineElements(selectedElements[0], selectedElements[1]);

            // Очищаем выбранные элементы и слоты после комбинации
            selectedElements = [];
            document.querySelectorAll('.element.selected').forEach(el => el.classList.remove('selected'));
            slot1.textContent = '';
            slot2.textContent = '';
        } else {
            // Если уже два элемента выбраны, сбрасываем и начинаем заново
            selectedElements = [];
            document.querySelectorAll('.element.selected').forEach(el => el.classList.remove('selected'));
            slot1.textContent = '';
            slot2.textContent = '';
            resultElement.textContent = '';
            handleElementClick(name, elementDiv); // Выбираем текущий элемент как первый
        }
    }

    // --- Комбинирование элементов ---
    async function combineElements(el1, el2) {
        resultElement.textContent = 'Смешиваем...';

        const prompt = `Что получится, если смешать ${el1} и ${el2}? Основывайся строго на логике алхимии и свойств элементов, обеспечивая логичное и постепенное развитие. Твой ответ должен быть на русском языке, быть креативным, но при этом реалистичным в контексте алхимии. В самом начале ответа поставь одно эмодзи, которое подходит новому элементу. Отвечай ТОЛЬКО эмодзи и названием нового элемента, без каких-либо дополнительных слов, объяснений или форматирования.`;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: prompt }]
                    }]
                })
            });

            if (!response.ok) {
                throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const newElementName = data.candidates[0].content.parts[0].text.trim().replace(/\n/g, '');

            if (newElementName) {
                resultElement.textContent = newElementName;
                if (!discoveredElements.has(newElementName)) {
                    discoveredElements.add(newElementName);
                    saveElements();
                    renderElements();
                }
            }
        } catch (error) {
            console.error('Ошибка алхимии:', error);
            resultElement.textContent = 'Ошибка! Попробуй снова.';
        }
    }

    // --- Инициализация ---
    loadElements();
});