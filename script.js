document.addEventListener('DOMContentLoaded', () => {
    // 15가지 전체 분야 (비율을 맞추기 위한 기준)
    const CATEGORIES = ['철학', '문학', '역사', '경제', '사회', '정치', '심리학', '인류학', '자연과학', '공학', 'IT', '의학', '보건', '미술', '음악'];

    // 비상용 지식 10개 목록
    const FALLBACK_FACTS = [
        { category: '자연과학', title: '바나나의 진실', content: '바나나는 식물학적으로 베리(Berry)류에 속하지만, 정작 딸기는 베리류가 아닙니다.', source_url: 'https://ko.wikipedia.org/wiki/바나나' },
        { category: '자연과학', title: '문어의 심장', content: '문어는 심장이 3개이며, 피에 헤모시아닌이 포함되어 있어 붉은색이 아닌 푸른색을 띱니다.', source_url: 'https://ko.wikipedia.org/wiki/문어' },
        { category: '보건', title: '상하지 않는 식품', content: '꿀은 수분 함량이 낮고 산성도가 높아 천연 상태에서는 수천 년이 지나도 상하지 않습니다.', source_url: 'https://ko.wikipedia.org/wiki/꿀' },
        { category: '철학', title: '데카르트의 명언', content: '데카르트의 "나는 생각한다, 고로 존재한다"는 원래 라틴어가 아니라 프랑스어로 먼저 쓰였습니다.', source_url: 'https://ko.wikipedia.org/wiki/르네_데카르트' },
        { category: '경제', title: '주 5일제의 시작', content: '주말 이틀을 쉬는 주 5일제는 1926년 헨리 포드가 자동차 공장에서 처음 도입하며 널리 퍼졌습니다.', source_url: 'https://ko.wikipedia.org/wiki/주_5일제' },
        { category: '역사', title: '가장 짧은 전쟁', content: '역사상 가장 짧은 전쟁은 1896년 영국과 잔지바르 간의 전쟁으로, 단 38분 만에 종료되었습니다.', source_url: 'https://ko.wikipedia.org/wiki/영국-잔지바르_전쟁' },
        { category: '의학', title: '인간의 세포', content: '성인 인간의 몸에는 약 37조 개의 세포가 있으며, 매초 약 380만 개의 새로운 세포가 생성됩니다.', source_url: 'https://ko.wikipedia.org/wiki/세포' },
        { category: '문학', title: '셰익스피어의 유산', content: '윌리엄 셰익스피어는 \'swag\', \'manager\' 등 약 1,700개의 영단어를 직접 만들어 냈습니다.', source_url: 'https://ko.wikipedia.org/wiki/윌리엄_셰익스피어' },
        { category: 'IT', title: '최초의 마우스', content: '세계 최초의 컴퓨터 마우스는 1964년 더그 엥겔바트가 나무를 깎아서 만들었으며 바퀴가 1개였습니다.', source_url: 'https://ko.wikipedia.org/wiki/마우스_(컴퓨터)' },
        { category: '미술', title: '모나리자의 과거', content: '레오나르도 다 빈치의 명작 \'모나리자\'는 한때 프랑스 왕실의 화장실(목욕탕) 벽에 걸려있었습니다.', source_url: 'https://ko.wikipedia.org/wiki/모나리자' }
    ];

    let currentUser = null;
    let userData = {};

    // --- 0. 유틸리티 함수 ---
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 텍스트를 다듬고 최대 5문장으로 제한하는 함수
    function formatFactText(text) {
        if (!text) return "내용이 없습니다.";
        
        // 괄호 안의 발음기호나 한자 등 불필요한 정보 제거 (기본적인 정제)
        let cleanedText = text.replace(/$$$[^)]*$$$/g, '');
        
        // 문장 단위(. ? !)로 분리
        let sentences = cleanedText.match(/[^.!?]+[.!?]+/g) || [cleanedText];
        
        // 5문장이 넘어가면 자르기
        if (sentences.length > 5) {
            sentences = sentences.slice(0, 5);
        }
        
        // 다시 합치고 공백 정리
        let finalFact = sentences.join(' ').replace(/\s+/g, ' ').trim();
        
        return "흥미로운 사실을 알려드릴게요! " + finalFact;
    }

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
        userData = stored ? JSON.parse(stored) : { facts: {}, categoryQueue: [] };
        
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

    async function fillMissingFacts() {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const todayNum = date.getDate();

        const usedContents = new Set();
        for (const key in userData.facts) {
            usedContents.add(userData.facts[key].content);
        }

        for (let i = 1; i <= todayNum; i++) {
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            if (!userData.facts[dateStr]) {
                document.getElementById('today-content').textContent = `분야별 상식을 고르게 수집 중입니다... (${i}일 생성 중)`;
                
                if (!userData.categoryQueue || userData.categoryQueue.length === 0) {
                    userData.categoryQueue = [...CATEGORIES].sort(() => Math.random() - 0.5);
                }
                const targetCategory = userData.categoryQueue.pop();
                
                const newFact = await generateDynamicFact(year, month, i, targetCategory, usedContents);
                userData.facts[dateStr] = newFact;
                usedContents.add(newFact.content);
                
                localStorage.setItem(`facts_${currentUser}`, JSON.stringify(userData));
                await delay(600); 
            }
        }
    }

    // --- 3. 할당된 분야(targetCategory)에 맞는 맞춤형 상식 수집기 ---
    async function generateDynamicFact(year, month, day, targetCategory, usedContents) {
        const maxRetries = 3; 
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
            let fact = null;
            const randomSource = Math.random();

            try {
                // 1. 타겟이 '역사'일 경우 (Useless API 제거 후 비중 조정)
                if (targetCategory === '역사' && randomSource < 0.6) {
                    const lang = Math.random() > 0.5 ? 'ko' : 'en';
                    const mm = String(month).padStart(2, '0');
                    const dd = String(day).padStart(2, '0');
                    const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/feed/onthisday/events/${mm}/${dd}`);
                    const data = await res.json();
                    
                    if (data.events && data.events.length > 0) {
                        const event = data.events[Math.floor(Math.random() * data.events.length)];
                        fact = {
                            category: targetCategory,
                            title: `${month}월 ${day}일의 역사 (${event.year || year}년)`,
                            content: formatFactText(event.text),
                            source_url: event.pages[0]?.content_urls?.desktop?.page || `https://${lang}.wikipedia.org`,
                            is_wiki_random: false
                        };
                    }
                }
                // 2. 수학/과학/경제 관련 분야일 경우 Numbers API 사용
                else if (['자연과학', '공학', 'IT', '경제'].includes(targetCategory) && randomSource < 0.5) {
                    const type = Math.random() > 0.5 ? 'date' : 'math';
                    const targetUrl = type === 'date' ? `http://numbersapi.com/${month}/${day}/date?json` : `http://numbersapi.com/${day}/math?json`;
                    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
                    const res = await fetch(proxyUrl);
                    const data = await res.json();
                    fact = {
                        category: targetCategory,
                        title: type === 'date' ? `숫자 ${month}와 ${day}의 비밀` : `숫자 ${day}의 사실`,
                        content: formatFactText(data.text),
                        source_url: 'http://numbersapi.com/',
                        is_wiki_random: false
                    };
                }
                // 3. 할당된 카테고리의 키워드로 위키백과를 직접 검색하여 연관 상식 추출
                else {
                    const searchKeywords = {
                        '철학': '철학자 OR 철학 이론', '문학': '문학 작품 OR 소설가', '역사': '역사적 사건 OR 세계사', 
                        '경제': '경제 현상 OR 금융', '사회': '사회 현상 OR 문화재', '정치': '정치사 OR 외교', 
                        '심리학': '심리학 효과 OR 인지편향', '인류학': '인류학 OR 고고학', '자연과학': '과학 발견 OR 천문학', 
                        '공학': '공학 기술 OR 발명품', 'IT': '소프트웨어 OR 컴퓨터 과학', '의학': '의학 질병 OR 인체', 
                        '보건': '공중 보건 OR 영양학', '미술': '미술가 OR 서양미술', '음악': '음악가 OR 클래식 악기'
                    };
                    const query = searchKeywords[targetCategory] || targetCategory;
                    const offset = Math.floor(Math.random() * 20); // 검색 결과 중 무작위 선택
                    
                    const searchRes = await fetch(`https://ko.wikipedia.org/w/api.php?action=query&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&sroffset=${offset}&origin=*`);
                    const searchData = await searchRes.json();
                    
                    if (searchData.query && searchData.query.search && searchData.query.search.length > 0) {
                        const title = searchData.query.search[0].title;
                        const summaryRes = await fetch(`https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
                        const summaryData = await summaryRes.json();
                        
                        fact = {
                            category: targetCategory,
                            title: summaryData.title,
                            content: formatFactText(summaryData.extract),
                            source_url: summaryData.content_urls?.desktop?.page || `https://ko.wikipedia.org/wiki/${encodeURIComponent(title)}`,
                            is_wiki_random: true
                        };
                    }
                }

                if (fact && fact.content && fact.content !== "내용이 없습니다." && !usedContents.has(fact.content)) {
                    return fact;
                }
            } catch (error) {
                console.warn(`[${targetCategory}] API 연동 지연 혹은 실패 (재시도 진행 중...)`);
            }
            
            await delay(300);
        }

        const fallbackFact = FALLBACK_FACTS.find(f => f.category === targetCategory) || FALLBACK_FACTS[Math.floor(Math.random() * FALLBACK_FACTS.length)];
        return {
            category: targetCategory,
            title: `[알아두면 좋은 상식] ${fallbackFact.title}`,
            content: `흥미로운 사실을 알려드릴게요! ${fallbackFact.content}`,
            source_url: fallbackFact.source_url,
            is_wiki_random: false
        };
    }

    // --- 4. 화면 렌더링 로직 ---
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
