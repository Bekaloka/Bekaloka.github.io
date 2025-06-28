document.addEventListener('DOMContentLoaded', () => {
    const elementsContainer = document.getElementById('elements-container');
    const slot1 = document.getElementById('slot1');
    const slot2 = document.getElementById('slot2');
    const resultElement = document.getElementById('result-element');
    const resetButton = document.getElementById('reset-button');
    const addCustomButton = document.getElementById('add-custom-button');
    const apiKeyInput = document.getElementById('api-key-input');
    const saveApiKeyButton = document.getElementById('save-api-key-button');
    const apiKeyStatus = document.getElementById('api-key-status');

    let currentApiKey = '';
    const API_BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite-preview-06-17:generateContent?key=`;

    // Начальные элементы
    const initialElements = new Set(['🔥 Огонь', '💧 Вода', '🌬️ Ветер', '🌎 Планета Земля', '🌱 Растение', '🧬 Жизнь', '🦠 Вирус', '💨 Кислород', '😡 Злость', '😊 Радость']);
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

        // Загрузка API ключа
        const savedApiKey = localStorage.getItem('geminiApiKey');
        if (savedApiKey) {
            currentApiKey = savedApiKey;
            apiKeyInput.value = savedApiKey;
            apiKeyStatus.textContent = 'Ключ загружен.';
            apiKeyStatus.style.color = 'green';
        } else {
            apiKeyStatus.textContent = 'Ключ не найден. Введите его.';
            apiKeyStatus.style.color = 'orange';
        }
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
        if (!currentApiKey) {
            alert('Пожалуйста, сначала введите и сохраните ваш API ключ!');
            return;
        }

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

        const prompt = `Что получится, если смешать ${el1} и ${el2}? Основывайся строго на логике алхимии и свойств элементов, обеспечивая логичное, последовательное и реалистичное развитие. Результат должен быть тесно связан с исходными элементами через их комбинацию, трансформацию или модификацию. Избегай абстрактных, слишком общих или умножающих понятий, если есть более прямое алхимическое следствие. В начале ответа поставь одно эмодзи, максимально подходящее новому элементу. Отвечай ТОЛЬКО эмодзи и названием нового элемента, без каких-либо дополнительных слов, объяснений или форматирования. Ответ должен быть на русском языке и не длиннее 5 слов. Если логичный результат невозможен, допускай креативные, фантастические или абсурдные варианты, но сохраняй максимально возможную связь с исходными элементами. Ты — создатель алхимии на сайте https://neal.fun/infinite-craft/.';
        try {
            const response = await fetch(API_BASE_URL + currentApiKey, {
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

    // --- Обработчики кнопок ---
    resetButton.addEventListener('click', () => {
        if (confirm('Вы уверены, что хотите сбросить весь прогресс? Все открытые элементы будут удалены.')) {
            localStorage.removeItem('infiniteCraftElements');
            discoveredElements = new Set(initialElements);
            saveElements();
            renderElements();
            slot1.textContent = '';
            slot2.textContent = '';
            resultElement.textContent = '';
            selectedElements = [];
        }
    });

    addCustomButton.addEventListener('click', () => {
        const customElementName = prompt('Введите название нового элемента (с эмодзи, например: 🌟 Звезда):');
        if (customElementName && customElementName.trim() !== '') {
            if (!discoveredElements.has(customElementName)) {
                discoveredElements.add(customElementName);
                saveElements();
                renderElements();
            } else {
                alert('Этот элемент уже существует!');
            }
        } else {
            alert('Название элемента не может быть пустым.');
        }
    });

    saveApiKeyButton.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            localStorage.setItem('geminiApiKey', key);
            currentApiKey = key;
            apiKeyStatus.textContent = 'Ключ сохранен!';
            apiKeyStatus.style.color = 'green';
        } else {
            apiKeyStatus.textContent = 'Ключ не может быть пустым.';
            apiKeyStatus.style.color = 'red';
        }
    });

    // --- Инициализация ---
    loadElements();
});
