document.addEventListener('DOMContentLoaded', () => {
    const CATEGORIES = ['철학', '문학', '역사', '경제', '사회', '정치', '심리학', '인류학', '자연과학', '공학', 'IT', '의학', '보건', '미술', '음악'];

    // 비상용 지식 10개 목록
    const FALLBACK_FACTS = [
        { category: '자연과학', title: '바나나의 진실', content: '바나나는 식물학적으로 베리(Berry)류에 속하지만, 딸기는 베리류가 아닙니다.', source_url: 'https://ko.wikipedia.org/wiki/바나나' },
        { category: '자연과학', title: '문어의 심장', content: '문어는 심장이 3개이며, 피에 헤모시아닌이 포함되어 있어 붉은색이 아닌 푸른색을 띱니다.', source_url: 'https://ko.wikipedia.org/wiki/문어' },
        { category: '보건', title: '상하지 않는 식품', content: '꿀은 수분 함량이 낮고 산성도가 높아 천연 상태에서는 수천 년이 지나도 상하지 않습니다.', source_url: 'https://ko.wikipedia.org/wiki/꿀' },
        { category: '철학', title: '데카르트의 명언', content: '데카르트의 "나는 생각한다, 고로 존재한다"는 원래 라틴어(Cogito, ergo sum)가 아니라 프랑스어로 먼저 쓰였습니다.', source_url: 'https://ko.wikipedia.org/wiki/르네_데카르트' },
        { category: '경제', title: '주 5일제의 시작', content: '주말 이틀을 쉬는 주 5일제는 1926년 헨리 포드가 자신의 자동차 공장에서 처음 도입하며 널리 퍼졌습니다.', source_url: 'https://ko.wikipedia.org/wiki/주_5일제' },
        { category: '역사', title: '가장 짧은 전쟁', content: '역사상 가장 짧은 전쟁은 1896년 영국과 잔지바르 간의 전쟁으로, 단 38분 만에 종료되었습니다.', source_url: 'https://ko.wikipedia.org/wiki/영국-잔지바르_전쟁' },
        { category: '의학', title: '인간의 세포', content: '성인 인간의 몸에는 약 37조 개의 세포가 있으며, 매초 약 380만 개의 새로운 세포가 생성됩니다.', source_url: 'https://ko.wikipedia.org/wiki/세포' },
        { category: '문학', title: '셰익스피어의 유산', content: '윌리엄 셰익스피어는 \'swag\', \'manager\' 등 약 1,700개의 영단어를 처음 발명하거나 기록으로 남겼습니다.', source_url: 'https://ko.wikipedia.org/wiki/윌리엄_셰익스피어' },
        { category: 'IT', title: '최초의 마우스', content: '세계 최초의 컴퓨터 마우스는 1964년 더그 엥겔바트가 나무를 깎아서 만들었으며 바퀴가 하나 달려 있었습니다.', source_url: 'https://ko.wikipedia.org/wiki/마우스_(컴퓨터)' },
        { category: '미술', title: '모나리자의 과거', content: '레오나르도 다 빈치의 명작 \'모나리자\'는 한때 프랑스 왕실의 화장실(목욕탕) 벽에 걸려있던 적이 있습니다.', source_url: 'https://ko.wikipedia.org/wiki/모나리자' }
    ];

    let currentUser = null;
    let userData = {};

    // --- 0. 유틸리티 함수 ---
    // API 과부하(Rate Limit) 방지를 위한 대기 함수
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // --- 1. 인증(로그인/회원가입) 처리 ---
    const authContainer = document.getElementById('auth-container');
    const appContainer = document.getElementById('app-container');
    const usersDB = JSON.parse(localStorage.getItem('registered_users')) || {};

    document.getElementById('tab-login').onclick = () => switchAuthTab('login');
    document.getElementById('tab-signup').onclick = () => switchAuthTab('signup');

    function switchAuthTab(tab) {
        document.getElementById('tab-login').classList.toggle('active', tab === 'login');
        document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
        document.getElementById('login-form').classList.toggle('hidden', tab !== 'login');
        document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
    }

    document.getElementById('btn-signup').onclick = () => {
        const id = document.getElementById('signup-id').value.trim();
        const pw = document.getElementById('signup-pw').value;
        const pwConfirm = document.getElementById('signup-pw-confirm').value;

        if (!id || !pw) return alert('아이디와 비밀번호를 모두 입력해주세요.');
        if (usersDB[id]) return alert('이미 존재하는 아이디입니다.');
        if (pw !== pwConfirm) return alert('비밀번호가 일치하지 않습니다.');

        usersDB[id] = pw;
        localStorage.setItem('registered_users', JSON.stringify(usersDB));
        alert('회원가입이 완료되었습니다! 로그인해주세요.');
        switchAuthTab('login');
    };

    document.getElementById('btn-login').onclick = () => {
        const id = document.getElementById('login-id').value.trim();
        const pw = document.getElementById('login-pw').value;

        if (!usersDB[id]) return alert('존재하지 않는 아이디입니다.');
        if (usersDB[id] !== pw) return alert('비밀번호가 틀렸습니다.');

        loginSuccess(id);
    };

    document.getElementById('logout-btn').onclick = () => {
        currentUser = null;
        appContainer.classList.add('hidden');
        authContainer.classList.remove('hidden');
        document.getElementById('login-pw').value = '';
    };

    function loginSuccess(username) {
        currentUser = username;
        const stored = localStorage.getItem(`facts_${username}`);
        userData = stored ? JSON.parse(stored) : { facts: {} };
        
        document.getElementById('user-greeting').textContent = `${username}님의 상식 달력`;
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        
        initApp();
    }

    // --- 2. 앱 구동 및 데이터 초기화 ---
    async function initApp() {
        setupTabs();
        setupModal();
        await fillMissingFacts();
        showTodayFact();
        renderCalendar();
    }

    // 접속한 월의 1일부터 오늘까지 상식이 비어있다면 API로 생성
    async function fillMissingFacts() {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const todayNum = date.getDate();

        // 중복 방지를 위해 기존에 저장된 상식 내용(Content)들을 수집
        const usedContents = new Set();
        for (const key in userData.facts) {
            usedContents.add(userData.facts[key].content);
        }

        for (let i = 1; i <= todayNum; i++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            if (!userData.facts[dateStr]) {
                document.getElementById('today-content').textContent = `과거 데이터를 구성 중입니다... (${i}일 생성 중, 잠시만 기다려주세요)`;
                
                // 중복되지 않은 상식을 가져와서 저장
                const newFact = await generateDynamicFact(year, month, i, usedContents);
                userData.facts[dateStr] = newFact;
                usedContents.add(newFact.content); // 다음 중복 검사를 위해 방금 가져온 상식 추가
                
                localStorage.setItem(`facts_${currentUser}`, JSON.stringify(userData));
                
                // ★ 서버 과부하 및 차단 방지를 위해 0.6초 대기
                await delay(600); 
            }
        }
    }

    // --- 3. 외부 API 기반 랜덤 상식 수집기 (중복 회피 적용) ---
    async function generateDynamicFact(year, month, day, usedContents) {
        const maxRetries = 3; // 중복 발생 시 최대 3번까지 재시도
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const randomSource = Math.random();
            let fact = null;

            try {
                // [40% 확률] 위키백과 "오늘의 역사/추천문서"
                if (randomSource < 0.4) {
                    const lang = Math.random() > 0.5 ? 'ko' : 'en';
                    const mm = String(month).padStart(2, '0');
                    const dd = String(day).padStart(2, '0');
                    
                    const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/feed/featured/${year}/${mm}/${dd}`);
                    const data = await res.json();

                    if (data.onthisday && data.onthisday.length > 0) {
                        // 중복을 피하기 위해 이벤트 배열을 무작위로 섞음
                        const events = data.onthisday.sort(() => 0.5 - Math.random());
                        const event = events[0];
                        fact = {
                            category: '역사',
                            title: `${month}월 ${day}일의 역사 (${event.year || year}년)`,
                            content: event.text,
                            source_url: event.pages[0]?.content_urls?.desktop?.page || `https://${lang}.wikipedia.org`,
                            is_wiki_random: false
                        };
                    } else if (data.tfa) {
                        fact = {
                            category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
                            title: data.tfa.title,
                            content: data.tfa.extract,
                            source_url: data.tfa.content_urls.desktop.page,
                            is_wiki_random: false
                        };
                    }
                } 
                // [30% 확률] Numbers API
                else if (randomSource < 0.7) {
                    const type = Math.random() > 0.5 ? 'date' : 'math';
                    const targetUrl = type === 'date' ? `http://numbersapi.com/${month}/${day}/date?json` : `http://numbersapi.com/${day}/math?json`;
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
                    
                    const res = await fetch(proxyUrl);
                    const data = await res.json();
                    
                    fact = {
                        category: '자연과학', 
                        title: type === 'date' ? `숫자 ${month}와 ${day}의 비밀` : `숫자 ${day}의 수학적 사실`,
                        content: `${data.text} (원문 제공: Numbers API)`,
                        source_url: 'http://numbersapi.com/',
                        is_wiki_random: false
                    };
                }
                // [15% 확률] Useless Facts API
                else if (randomSource < 0.85) {
                    const res = await fetch('https://uselessfacts.jsph.pl/api/v2/facts/random');
                    const data = await res.json();
                    
                    fact = {
                        category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
                        title: '오늘의 엉뚱한 상식',
                        content: `${data.text} (원문 제공: Useless Facts API)`,
                        source_url: data.source_url || 'https://uselessfacts.jsph.pl/',
                        is_wiki_random: false
                    };
                }
                // [15% 확률] 위키백과 완전 무작위 문서
                else {
                    const lang = Math.random() > 0.5 ? 'ko' : 'en';
                    const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/random/summary`);
                    const data = await res.json();
                    
                    fact = {
                        category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
                        title: data.title,
                        content: data.extract || "요약 내용이 없습니다. 출처를 직접 확인해보세요.",
                        source_url: data.content_urls.desktop.page,
                        is_wiki_random: true
                    };
                }

                // 가져온 상식이 정상적이고, 이전에 나온 적 없는 내용이라면 즉시 반환
                if (fact && fact.content && !usedContents.has(fact.content)) {
                    return fact;
                }
            } catch (error) {
                console.warn("API 연동 지연 혹은 실패 (재시도 진행 중...):", error);
            }
            
            // 중복이거나 오류가 났을 경우 다음 시도 전에 짧게 대기
            await delay(300);
        }

        // 3번 시도해도 고유한 상식을 찾지 못했거나 모든 API가 에러 났을 때 비상용 지식 중 하나를 랜덤으로 제공
        const fallbackFact = FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
        return {
            category: fallbackFact.category,
            title: `[비상용 지식] ${fallbackFact.title}`,
            content: `서버 지연으로 내장된 상식을 제공합니다. ${fallbackFact.content}`,
            source_url: fallbackFact.source_url,
            is_wiki_random: false
        };
    }

    // --- 4. 화면 렌더링 로직 (탭, 캘린더, 모달) ---
    function setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn[data-tab]');
        const tabContents = document.querySelectorAll('.tab-content');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabContents.forEach(c => c.classList.add('hidden'));
                btn.classList.add('active');
                document.getElementById(btn.dataset.tab).classList.remove('hidden');
            });
        });
    }

    function showTodayFact() {
        const todayStr = getTodayString();
        const fact = userData.facts[todayStr];
        if (fact) {
            document.getElementById('today-category').textContent = fact.category;
            document.getElementById('today-title').textContent = fact.title;
            document.getElementById('today-content').textContent = fact.content;
            
            const sourceBtn = document.getElementById('today-source');
            sourceBtn.href = fact.source_url;
            sourceBtn.style.display = "inline-block";
            
            const warning = document.getElementById('today-wiki-warning');
            fact.is_wiki_random ? warning.classList.remove('hidden') : warning.classList.add('hidden');
        }
    }

    function renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        grid.innerHTML = '';
        const monthYear = document.getElementById('month-year');
        
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth();
        const todayStr = getTodayString();

        monthYear.textContent = `${year}년 ${month + 1}월`;
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = ['일', '월', '화', '수', '목', '금', '토'];
        days.forEach(day => {
            const el = document.createElement('div');
            el.textContent = day;
            el.style.fontWeight = 'bold';
            grid.appendChild(el);
        });

        for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            dayEl.classList.add('day');
            dayEl.textContent = i;
            const currentStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;

            if (currentStr === todayStr) {
                dayEl.classList.add('today');
                dayEl.addEventListener('click', () => openModal(currentStr));
            } else if (currentStr < todayStr) {
                dayEl.classList.add('past');
                dayEl.addEventListener('click', () => openModal(currentStr));
            } else {
                dayEl.classList.add('future');
            }
            grid.appendChild(dayEl);
        }
    }

    function setupModal() {
        const modal = document.getElementById('fact-modal');
        document.querySelector('.close-btn').onclick = () => modal.classList.add('hidden');
        window.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); }
    }

    function openModal(dateStr) {
        const fact = userData.facts[dateStr];
        const modal = document.getElementById('fact-modal');
        if (fact) {
            document.getElementById('modal-category').textContent = fact.category;
            document.getElementById('modal-title').textContent = fact.title;
            document.getElementById('modal-fact').textContent = fact.content;
            document.getElementById('modal-source').href = fact.source_url;
            
            const warning = document.getElementById('modal-wiki-warning');
            fact.is_wiki_random ? warning.classList.remove('hidden') : warning.classList.add('hidden');
        }
        modal.classList.remove('hidden');
    }

    function getTodayString() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});
