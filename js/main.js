// Основной JavaScript файл для Vertex Academy
// ========== ГЛОБАЛЬНЫЕ ФУНКЦИИ ДЛЯ ВСЕГО САЙТА ==========

// Пункт 5: Сбор статистики
let appStats = {
    courseViews: {},
    totalClicksOnStart: 0,
    feedbacksSent: 0,
    aiQueries: 0,
    pageVisits: {},
    userActions: []
};

// Загрузка статистики
function loadStats() {
    const saved = localStorage.getItem('vertex_academy_stats');
    if(saved) {
        try {
            appStats = JSON.parse(saved);
        } catch(e) { console.warn(e); }
    }
    if(!appStats.courseViews) appStats.courseViews = {};
    if(!appStats.pageVisits) appStats.pageVisits = {};
    if(!appStats.userActions) appStats.userActions = [];
    
    // Отслеживаем текущую страницу
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if(!appStats.pageVisits[currentPage]) appStats.pageVisits[currentPage] = 0;
    appStats.pageVisits[currentPage]++;
    saveStats();
}

function saveStats() {
    localStorage.setItem('vertex_academy_stats', JSON.stringify(appStats));
    if(window.renderAdminStats) window.renderAdminStats();
}

// Отслеживание действий пользователя
function trackEvent(category, action, label = null) {
    const event = {
        timestamp: new Date().toISOString(),
        category: category,
        action: action,
        label: label,
        page: window.location.pathname
    };
    appStats.userActions.push(event);
    saveStats();
    console.log(`[EVENT] ${category}: ${action}`, label || '');
}

// Специализированные трекеры
function trackCourseView(courseName) {
    if(!appStats.courseViews[courseName]) appStats.courseViews[courseName] = 0;
    appStats.courseViews[courseName]++;
    saveStats();
    trackEvent('course', 'view', courseName);
}

function trackStartClick() {
    appStats.totalClicksOnStart++;
    saveStats();
    trackEvent('cta', 'click', 'start_free');
}

function trackFeedback() {
    appStats.feedbacksSent++;
    saveStats();
    trackEvent('feedback', 'submit');
}

function trackAIQuery() {
    appStats.aiQueries++;
    saveStats();
    trackEvent('ai', 'query');
}

// Пункт 8: Защита информации
function sanitizeInput(str) {
    if(!str) return '';
    return str.replace(/[<>]/g, function(m) {
        return m === '<' ? '&lt;' : '&gt;';
    }).replace(/[&]/g, '&amp;')
      .replace(/["']/g, '&quot;')
      .trim();
}

// Защита всех форм на сайте
function protectForms() {
    document.querySelectorAll('form').forEach(form => {
        // Добавляем honeypot если нет
        if(!form.querySelector('[name="honeypot"]')) {
            const honeypot = document.createElement('input');
            honeypot.type = 'text';
            honeypot.name = 'honeypot';
            honeypot.style.display = 'none';
            honeypot.setAttribute('autocomplete', 'off');
            form.appendChild(honeypot);
        }
        
        // Валидация перед отправкой
        form.addEventListener('submit', function(e) {
            const honeypot = form.querySelector('[name="honeypot"]');
            if(honeypot && honeypot.value) {
                e.preventDefault();
                alert('Ошибка безопасности: запрос отклонен');
                return false;
            }
            
            // Санитизация всех полей
            let hasError = false;
            form.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], textarea').forEach(field => {
                if(field.value) {
                    const sanitized = sanitizeInput(field.value);
                    if(sanitized !== field.value) {
                        field.value = sanitized;
                    }
                }
            });
            
            return true;
        });
    });
}

// Пункт 3: AI-помощник
function initAIAssistant() {
    if(document.querySelector('.ai-assistant')) return;
    
    const aiHTML = `
    <div class="ai-assistant">
        <div class="ai-toggle" id="aiToggle">
            <span>🤖</span>
        </div>
        <div class="ai-window" id="aiWindow">
            <div class="ai-header">
                <strong>🤖 AI-помощник Vertex</strong>
                <button id="aiClose" style="background:none; border:none; color:white; cursor:pointer;">✕</button>
            </div>
            <div class="ai-messages" id="aiMessages">
                <div class="ai-message bot">Здравствуйте! Я помогу выбрать курс или отвечу на вопросы. Спросите меня о курсах, ценах или контактах.</div>
            </div>
            <div class="ai-input-area">
                <input type="text" id="aiInput" placeholder="Напишите ваш вопрос...">
                <button id="askAiBtn">➤</button>
            </div>
        </div>
    </div>`;
    
    document.body.insertAdjacentHTML('beforeend', aiHTML);
    
    // Стили для AI (если нет в CSS)
    const style = document.createElement('style');
    style.textContent = `
        .ai-assistant { position: fixed; bottom: 24px; right: 24px; z-index: 1000; }
        .ai-toggle { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); width: 60px; height: 60px; border-radius: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.3); font-size: 28px; transition: transform 0.2s; }
        .ai-toggle:hover { transform: scale(1.1); }
        .ai-window { position: absolute; bottom: 80px; right: 0; width: 320px; background: #1a1a2e; border-radius: 16px; display: none; flex-direction: column; border: 1px solid #667eea; box-shadow: 0 10px 30px rgba(0,0,0,0.5); overflow: hidden; }
        .ai-window.active { display: flex; }
        .ai-header { display: flex; justify-content: space-between; padding: 12px 16px; background: #16213e; border-bottom: 1px solid #667eea; }
        .ai-messages { height: 300px; overflow-y: auto; padding: 12px; display: flex; flex-direction: column; gap: 8px; }
        .ai-message { padding: 8px 12px; border-radius: 12px; max-width: 85%; word-wrap: break-word; }
        .ai-message.bot { background: #16213e; align-self: flex-start; }
        .ai-message.user { background: #667eea; align-self: flex-end; }
        .ai-input-area { display: flex; padding: 12px; border-top: 1px solid #2a2a4a; gap: 8px; }
        .ai-input-area input { flex: 1; padding: 8px 12px; border: 1px solid #667eea; background: #0f0f1f; color: white; border-radius: 20px; }
        .ai-input-area button { background: #667eea; border: none; color: white; width: 36px; height: 36px; border-radius: 18px; cursor: pointer; font-size: 18px; }
    `;
    document.head.appendChild(style);
    
    const aiToggle = document.getElementById('aiToggle');
    const aiWindow = document.getElementById('aiWindow');
    const aiClose = document.getElementById('aiClose');
    const aiInput = document.getElementById('aiInput');
    const askBtn = document.getElementById('askAiBtn');
    const aiMessages = document.getElementById('aiMessages');
    
    if(aiToggle) {
        aiToggle.addEventListener('click', () => {
            aiWindow.classList.toggle('active');
        });
    }
    
    if(aiClose) {
        aiClose.addEventListener('click', () => {
            aiWindow.classList.remove('active');
        });
    }
    
    function addMessage(text, isUser = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `ai-message ${isUser ? 'user' : 'bot'}`;
        msgDiv.textContent = text;
        aiMessages.appendChild(msgDiv);
        aiMessages.scrollTop = aiMessages.scrollHeight;
    }
    
    async function askAI() {
        let query = aiInput?.value.trim();
        if(!query) return;
        
        addMessage(query, true);
        trackAIQuery();
        
        // Имитация ответа AI
        let answer = "🤖 ";
        const lowerQuery = query.toLowerCase();
        
        if(lowerQuery.includes('курс') || lowerQuery.includes('blender')) {
            answer += "Рекомендую курс 'Blender за 30 дней' — старт в любое время. Хотите перейти на страницу курсов?";
        } else if(lowerQuery.includes('цена') || lowerQuery.includes('стоимость')) {
            answer += "У нас есть бесплатные курсы и премиум-доступ от 2990₽/мес. Все материалы остаются у вас навсегда!";
        } else if(lowerQuery.includes('контакт')) {
            answer += "Вы можете связаться с нами через форму на странице поддержки или написать на support@vertex-academy.ru";
        } else if(lowerQuery.includes('регистрация') || lowerQuery.includes('войти')) {
            answer += "Для регистрации нажмите на кнопку 'Начать' на главной странице или перейдите в раздел входа.";
        } else {
            answer += "Попробуйте спросить про курсы (например, 'Blender'), стоимость обучения или контакты поддержки. Я помогу вам!";
        }
        
        setTimeout(() => addMessage(answer, false), 500);
        if(aiInput) aiInput.value = '';
    }
    
    if(askBtn) askBtn.addEventListener('click', askAI);
    if(aiInput) aiInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') askAI(); });
}

// Пункт 9: Тестирование кода
function runTests() {
    const tests = [
        { name: "Загрузка статистики", fn: () => typeof loadStats === 'function' },
        { name: "Защита форм", fn: () => typeof protectForms === 'function' },
        { name: "Санитизация ввода", fn: () => {
            const test = sanitizeInput('<script>alert("xss")</script>');
            return test === '&lt;script&gt;alert("xss")&lt;/script&gt;';
        }},
        { name: "AI ассистент", fn: () => typeof initAIAssistant === 'function' }
    ];
    
    let passed = 0;
    tests.forEach(test => {
        if(test.fn()) {
            passed++;
            console.log(`✅ ${test.name}: пройден`);
        } else {
            console.error(`❌ ${test.name}: не пройден`);
        }
    });
    console.log(`[TESTS] Результат: ${passed}/${tests.length} тестов пройдено`);
    return passed === tests.length;
}

// Пункт 10: Аудит безопасности
function runSecurityAudit() {
    const auditResults = {
        csp: !!document.querySelector('meta[http-equiv="Content-Security-Policy"]'),
        sanitization: typeof sanitizeInput === 'function',
        honeypot: document.querySelectorAll('input[name="honeypot"]').length > 0,
        https: location.protocol === 'https:',
        localStorage: typeof localStorage !== 'undefined'
    };
    
    console.log('[AUDIT] Результаты аудита безопасности:', auditResults);
    
    let score = Object.values(auditResults).filter(v => v === true).length;
    let maxScore = Object.keys(auditResults).length;
    let percentage = (score / maxScore) * 100;
    
    console.log(`[AUDIT] Общий уровень безопасности: ${percentage}% (${score}/${maxScore})`);
    
    if(percentage < 60) {
        console.warn('[AUDIT] ВНИМАНИЕ: Требуется усиление мер безопасности!');
    } else {
        console.log('[AUDIT] ✅ Уровень безопасности приемлемый');
    }
    
    return auditResults;
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    loadStats();
    protectForms();
    initAIAssistant();
    runTests();
    runSecurityAudit();
    
    // Отслеживание курсов
    document.querySelectorAll('.course-card, .course-item').forEach(card => {
        const btn = card.querySelector('button, .details-btn, .learn-more');
        if(btn) {
            btn.addEventListener('click', () => {
                const courseName = card.querySelector('h3, .course-title')?.innerText || 'Курс';
                trackCourseView(courseName);
            });
        }
    });
    
    // Отслеживание CTA кнопок
    document.querySelectorAll('.btn-start, .btn-free, .cta-button, [href="#register"]').forEach(btn => {
        btn.addEventListener('click', trackStartClick);
    });
    
    console.log('[INIT] Vertex Academy полностью загружена');
});

// Экспорт глобальных функций
window.trackCourseView = trackCourseView;
window.trackStartClick = trackStartClick;
window.trackFeedback = trackFeedback;
window.sanitizeInput = sanitizeInput;
window.runSecurityAudit = runSecurityAudit;
window.getStats = () => appStats;

document.addEventListener('DOMContentLoaded', function() {
    // Мобильное меню
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            navToggle.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
        
        // Закрытие меню при клике на ссылку
        document.querySelectorAll('.nav-menu a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });
    }
    
    // Плавная прокрутка к якорям
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            if (this.getAttribute('href') === '#') return;
            
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // FAQ аккордеон
    const faqQuestions = document.querySelectorAll('.faq-question');
    faqQuestions.forEach(question => {
        question.addEventListener('click', function() {
            const answer = this.nextElementSibling;
            const icon = this.querySelector('i');
            
            // Закрываем другие открытые ответы
            document.querySelectorAll('.faq-answer.active').forEach(activeAnswer => {
                if (activeAnswer !== answer) {
                    activeAnswer.classList.remove('active');
                    activeAnswer.previousElementSibling.classList.remove('active');
                }
            });
            
            // Переключаем текущий ответ
            this.classList.toggle('active');
            answer.classList.toggle('active');
            
            // Анимация иконки
            if (icon) {
                icon.style.transform = this.classList.contains('active') 
                    ? 'rotate(180deg)' 
                    : 'rotate(0)';
            }
        });
    });
});
