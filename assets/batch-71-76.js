// SEOTurbo Apex - Batch 71-76

// Module 71
(function() {
    'use strict';
    const cI = '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor;"><path d="M16 1H4C2.9 1 2 1.9 2 3v14h2V3h12V1zm5 4H8C6.9 5 6 5.9 6 7v14c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h13v14z"/></svg>';
    const sI = '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
    function hC(t, b) {
        const cT = t.replace(/<\/?xmp>/g, '').replace(/[\u00A0]/g, ' ').trim();
        navigator.clipboard.writeText(cT).then(() => {
            b.classList.add('copied');
            b.innerHTML = sI + ' <span>تم نسخ الكود!</span>';
            setTimeout(() => {
                b.classList.remove('copied');
                b.innerHTML = cI + ' <span>نسخ الكود</span>';
            }, 2000);
        });
    }
    function iC() {
        document.querySelectorAll('.post-body pre').forEach((p) => {
            if (p.querySelector('.seoturbo-copy-btn')) return;
            p.style.setProperty('position', 'relative', 'important');
            p.style.setProperty('overflow', 'hidden', 'important');
            const b = document.createElement('button');
            b.className = 'seoturbo-copy-btn';
            b.innerHTML = cI + ' <span>نسخ الكود</span>';
            b.style.cssText = 'position:absolute; top:5px; left:8px; z-index:5; cursor:pointer; background:var(--blogcolor); color:var(--softcolor); border:none; border-radius:6px; padding:4px 10px; font-size:10px; font-weight:800; display:flex; align-items:center; gap:5px; box-shadow: 0 4px 10px rgba(0,0,0,0.1); transition:0.3s; line-height:1;';
            if(!document.getElementById('st-btn-style')){
                const s = document.createElement('style');
                s.id = 'st-btn-style';
                s.textContent = '.seoturbo-copy-btn.copied { background: var(--google-green) !important; } .seoturbo-copy-btn:hover { filter: brightness(1.2); transform: translateY(-1px); }';
                document.head.appendChild(s);
            }
            p.prepend(b);
            b.onclick = (e) => { e.preventDefault(); hC((p.querySelector('code') || p).innerText, b); };
        });
        document.querySelectorAll('[id*="ultimate-monitor"]').forEach((h) => {
            const r = h.shadowRoot;
            if (!r || r.querySelector('.seoturbo-copy-btn')) return;
            
            const boxImages = r.querySelectorAll('img');
            boxImages.forEach(img => {
                if (!img.hasAttribute('alt') || img.getAttribute('alt').trim() === '') {
                    img.setAttribute('alt', 'شعار الموقع');
                }
            });

            const dA = r.getElementById('display'), mS = r.querySelector('section');
            const hD = r.querySelector('section section');
            const eI = r.getElementById('copy-icon');
            if (dA && mS) {
                mS.style.setProperty('position', 'relative', 'important');
                mS.style.setProperty('overflow', 'hidden', 'important');
                const s = document.createElement('style');
                s.textContent = `.seoturbo-copy-btn { position: absolute; top: 1px; left: 8px; z-index: 5; cursor: pointer; background: var(--blogcolor); color: var(--softcolor); border: none; border-radius: 6px; padding: 2px 6px; font-size: 14px; font-weight: 800; display: flex; align-items: center; gap: 5px; transition: 0.3s; box-shadow: 0 4px 10px rgba(0,0,0,0.3); line-height: 1; }.seoturbo-copy-btn.copied { background: #1e8e3e !important; }.seoturbo-copy-btn:hover { transform: translateY(-1px); filter: brightness(1.1); } #copy-icon { cursor: pointer; transition: 0.2s; } #copy-icon:hover { opacity: 0.6; }`;
                r.appendChild(s);
                const b = document.createElement('button');
                b.className = 'seoturbo-copy-btn';
                b.innerHTML = cI + ' <span>نسخ الكود</span>';
                if(hD) { hD.appendChild(b); } else { mS.appendChild(b); }
                const fN = (e) => { e.preventDefault(); hC(dA.textContent, b); };
                b.onclick = fN;
                if(eI) { eI.onclick = fN; }
            }
        });
    }
    if (document.readyState === 'complete') { iC(); } else { window.addEventListener('load', iC); }
    setTimeout(iC, 2000);
    setTimeout(iC, 5000);
})();

// Module 72
(function() {
    'use strict';
    
    var freeContainer = document.getElementById('seoturbo-kp-placeholder');
    var originalContainer = document.getElementById('knowledge-path-original');
    
    if (freeContainer) freeContainer.style.display = 'none';
    if (originalContainer) originalContainer.style.display = 'block';
    
    async function runSeoturboCluster() {
        const box = document.getElementById('seoturbo-kp-main-box');
        const vault = document.getElementById('seoturbo-data-vault');
        if (!box || !vault) return;
        const rawLabel = vault.getAttribute('data-label');
        const currentUrl = window.location.href.split(/[?#]/)[0];
        try {
            let entries = [];
            const globalData = await window.ST_MASTER_PROMISE;
            if (globalData && globalData.feed.entry) {
                entries = globalData.feed.entry.filter(e => e.category && e.category.some(c => c.term === rawLabel));
            }
            if (entries.length < 2) {
                const res = await fetch(`/feeds/posts/summary/-/${encodeURIComponent(rawLabel)}?alt=json&max-results=8`);
                const json = await res.json();
                entries = json.feed.entry || [];
            }
            if (entries.length < 2) { box.remove(); return; }
            let posts = entries.map(e => ({
                title: e.title.$t,
                url: e.link.find(l => l.rel === 'alternate').href.split(/[?#]/)[0],
                thumb: e.media$thumbnail ? e.media$thumbnail.url.replace(/\/s\d+(-c)?\//, '/s120-c-rw/') : null
            })).sort((a, b) => a.url.localeCompare(b.url));
            const idx = posts.findIndex(p => p.url === currentUrl);
            if (idx === -1) { box.remove(); return; }
            document.getElementById('seoturbo-kp-label-text').textContent = (window.seoturbo_label_dictionary && window.seoturbo_label_dictionary[rawLabel.toLowerCase()]) || rawLabel;
            document.getElementById('seoturbo-kp-count-badge').textContent = (idx + 1) + ' / ' + posts.length;
            posts.slice(0, 5).forEach((p, i) => {
                const node = document.getElementById(`seoturbo-node-${i+1}`);
                if (node) {
                    node.classList.add('seoturbo-show');
                    if (p.url === currentUrl) node.classList.add('seoturbo-current');
                    node.querySelector('a').href = p.url;
                    node.querySelector('.seoturbo-timeline-title').textContent = (p.url === currentUrl ? '📖 ' : '') + p.title;
                    if (p.thumb) node.querySelector('img').src = p.thumb;
                    if (p.url === currentUrl) node.querySelector('.seoturbo-timeline-badge').innerHTML = '<span class="seoturbo-badge-status" style="background:var(--blogcolor)">أنت هنا الآن</span>';
                }
            });
            const prev = posts[idx-1], next = posts[idx+1];
            if (prev) { 
                const b = document.getElementById('seoturbo-kp-btn-prev'); b.href = prev.url; b.style.display = 'flex';
                document.getElementById('seoturbo-kp-title-prev').textContent = prev.title;
            }
            if (next) {
                const b = document.getElementById('seoturbo-kp-btn-next'); b.href = next.url; b.style.display = 'flex';
                document.getElementById('seoturbo-kp-title-next').textContent = next.title;
            }
            document.getElementById('seoturbo-kp-inner-body').classList.add('seoturbo-is-ready');
        } catch (e) { box.remove(); }
    }
    if (window.requestIdleCallback) requestIdleCallback(runSeoturboCluster);
    else setTimeout(runSeoturboCluster, 600);
})();

// Module 73
(function() {
    'use strict';
    var freePopup = document.getElementById('seoturbo-search-free-popup');
    var originalSearch = document.getElementById('search-original');
    
    if (freePopup) freePopup.style.display = 'none';
    if (originalSearch) originalSearch.style.display = 'block';
    
    let searchTimeout;
    let allPostsData = [];
    const arabicMonths = {
        '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'إبريل',
        '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
        '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
    };
    
    const searchOverlay = document.getElementById('seoturbo-search-overlay');
    const searchInput = document.getElementById('seoturbo-search-input');
    const resultsContainer = document.getElementById('seoturbo-results-container');
    const filterCategory = document.getElementById('seoturbo-filter-category');
    const filterDate = document.getElementById('seoturbo-filter-date');
    const clearFiltersBtn = document.getElementById('seoturbo-clear-filters');
    
    async function loadSearchData() {
        if (allPostsData.length > 0) return allPostsData;
        try {
            const data = await window.ST_MASTER_PROMISE;
            if (data && data.feed && data.feed.entry) {
                allPostsData = data.feed.entry;
                populateCategories();
                return allPostsData;
            }
        } catch (e) { console.error(e); }
        return [];
    }
    
    function populateCategories() {
        if (!filterCategory || !window.seoturbo_label_dictionary || filterCategory.options.length > 1) return;
        Object.entries(window.seoturbo_label_dictionary).forEach(([slug, name]) => {
            const opt = document.createElement('option');
            opt.value = slug;
            opt.textContent = name;
            filterCategory.appendChild(opt);
        });
    }
    
    async function performSearch() {
        if (!resultsContainer || !searchInput) return;
        
        const query = searchInput.value.trim().toLowerCase();
        const category = filterCategory?.value || 'all';
        const dateFilter = filterDate?.value || 'all';
        
        if (query.length < 2 && category === 'all' && dateFilter === 'all') {
            resultsContainer.style.display = 'none';
            return;
        }
        
        resultsContainer.style.display = 'block';
        resultsContainer.innerHTML = '<div class="seoturbo-is-loading"><svg viewBox="0 0 512 512"><use href="#icon-spinner"/></svg> جاري البحث والفلترة...</div>';
        
        const posts = await loadSearchData();
        const now = new Date();
        
        const filtered = posts.filter(post => {
            const t = post.title.$t.toLowerCase();
            const c = (post.content?.$t || "").toLowerCase();
            const pLabels = (post.category || []).map(l => l.term.toLowerCase());
            const pDate = new Date(post.published.$t);

            const matchQuery = t.includes(query) || c.includes(query);
            const matchCat = (category === 'all') || pLabels.includes(category);
            
            let matchDate = true;
            if (dateFilter === 'today') matchDate = pDate.toDateString() === now.toDateString();
            else if (dateFilter === 'week') matchDate = (now - pDate) < 604800000;
            else if (dateFilter === 'month') matchDate = (now - pDate) < 2592000000;
            else if (dateFilter === 'year') matchDate = pDate.getFullYear() === now.getFullYear();

            return matchQuery && matchCat && matchDate;
        });
        
        if (filtered.length === 0) {
            resultsContainer.innerHTML = '<div class="seoturbo-is-no-res">❌ لا توجد نتائج تطابق بحثك وفلاترك</div>';
            return;
        }
        
        let html = filtered.slice(0, 8).map(p => {
            const l = p.link.find(link => link.rel === 'alternate').href;
            const rawImg = p.media$thumbnail ? p.media$thumbnail.url : '';
            const img = window.optimizeImage ? window.optimizeImage(rawImg, 'related') : rawImg;
            const d = new Date(p.published.$t);
            const dStr = `${d.getDate()} ${arabicMonths[(d.getMonth() + 1).toString().padStart(2, '0')]} ${d.getFullYear()}`;
            
            return `<a class="seoturbo-is-item" href="${l}">
                <div class="seoturbo-is-img">${img ? `<img src="${img}" alt="thumb">` : '📄'}</div>
                <div class="seoturbo-is-info">
                    <div class="seoturbo-is-title">${p.title.$t}</div>
                    <div class="seoturbo-is-meta">📅 ${dStr}</div>
                </div>
            </a>`;
        }).join('');
        
        html += `<a class="seoturbo-is-item seoturbo-is-view-all" href="/search?q=${encodeURIComponent(query)}">🔍 عرض كافة النتائج (${filtered.length})</a>`;
        resultsContainer.innerHTML = html;
    }
    
    function init() {
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(performSearch, 400);
            });
        }
        
        [filterCategory, filterDate].forEach(el => {
            el?.addEventListener('change', performSearch);
        });
        
        if (clearFiltersBtn) {
            clearFiltersBtn.onclick = () => {
                if (searchInput) searchInput.value = '';
                if (filterCategory) filterCategory.value = 'all';
                if (filterDate) filterDate.value = 'all';
                performSearch();
            };
        }
    }
    
    window.addEventListener('load', () => {
        loadSearchData();
        init();
    });
})();

// Module 74
(function() {
    'use strict';
    
    var freeContainer = document.getElementById('seoturbo-support-placeholder');
    var originalContainer = document.getElementById('support-box-original');
    
    if (freeContainer) freeContainer.style.display = 'none';
    if (originalContainer) originalContainer.style.display = 'block';
    
    const CONFIG = {
        paypalEmail: 'your-paypal@example.com',
        coffeeUser: 'your-username',
        currency: 'USD',
        options: [
            {v: 5, l: '☕ فنجان قهوة', d: 'دعم بسيط'},
            {v: 10, l: '🍕 وجبة بيتزا', d: 'دعم متوسط'},
            {v: 50, l: '🌟 دعم مميز', d: 'دعم سخي'}
        ]
    };

    function initSeoturboSupport() {
        const box = document.getElementById('seoturbo-support-main-box');
        const isPost = document.body.classList.contains('post-page') || document.querySelector('.post-body') !== null;
        
        if (!box || !isPost) return;

        const grid = document.getElementById('seoturbo-support-options-grid');
        if (grid) {
            grid.innerHTML = CONFIG.options.map(opt => `
                <div class="seoturbo-support-opt" data-amount="${opt.v}">
                    <span class="seoturbo-support-opt-val">${opt.v} ${CONFIG.currency}</span>
                    <span style="font-size:12px;font-weight:700;">${opt.l}</span>
                    <span style="font-size:10px;opacity:0.8;">${opt.d}</span>
                </div>
            `).join('');
        }

        const gateways = document.getElementById('seoturbo-support-gateways-list');
        if (gateways) {
            gateways.innerHTML = `
                <a href="https://www.paypal.com/donate?business=${encodeURIComponent(CONFIG.paypalEmail)}&currency_code=${CONFIG.currency}" target="_blank" class="seoturbo-support-gate">PayPal</a>
                <a href="https://www.buymeacoffee.com/${CONFIG.coffeeUser}" target="_blank" class="seoturbo-support-gate">Buy Me a Coffee</a>
            `;
        }

        if (grid) {
            grid.querySelectorAll('.seoturbo-support-opt').forEach(opt => {
                opt.onclick = () => {
                    const amount = opt.dataset.amount;
                    if (window.PaymentRequest) {
                        executeNativePay(amount);
                    } else {
                        window.open(`https://www.paypal.com/donate?business=${encodeURIComponent(CONFIG.paypalEmail)}&amount=${amount}`, '_blank');
                    }
                };
            });
        }

        box.style.display = 'block';
    }

    async function executeNativePay(amt) {
        const methods = [{ supportedMethods: 'https://google.com/pay', data: { merchantId: 'seoturbo-merchant-id' } }];
        const details = { total: { label: 'دعم المحتوى', amount: { currency: CONFIG.currency, value: amt } } };
        try {
            const request = new PaymentRequest(methods, details);
            const response = await request.show();
            await response.complete('success');
            alert('تم استلام دعمك بنجاح. شكراً لك!');
        } catch (e) {
            window.open(`https://www.paypal.com/donate?business=${encodeURIComponent(CONFIG.paypalEmail)}&amount=${amt}`, '_blank');
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSeoturboSupport);
    else initSeoturboSupport();
})();

// Module 75
(function() {
    'use strict';
    var freePopup = document.getElementById('seoturbo-fav-free-popup');
    if (freePopup) freePopup.remove();
    
    const K_F = 'seoturbo_favs_v12';
    const K_H = 'seoturbo_history_v12';
    const K_I = 'seoturbo_interests_v12';
    
    function track() {
        const v = document.getElementById('seoturbo-data-vault');
        if (!v) return;
        
        let rawImg = document.querySelector('meta[property="og:image"]')?.content || document.querySelector('.post-body img')?.src || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi7Ml848_trMe4J1co6ImpiKh7XcXn2ZsRTk85hy4oWOlBvvOIyHTSxoC1nvNwlZ0-PvMwjQFVEcqhA0H2dGcz-fWO9il9RlsmpXX8I7RLYt6y7kPb9cE2fKnBqdD7gvbSTfLfoSjCZs_brqPRiw335YfX5qGHS8iNYIHCBNUo1npNK3o8Oxtob-KxZeBk/s16000-rw/rbka-news300-100.webp';
        
        let optimizedImg = window.optimizeImage ? window.optimizeImage(rawImg, 'dash-thumb') : rawImg;

        const d = {
            id: v.getAttribute('data-id') || window.location.pathname,
            title: v.getAttribute('data-title'),
            url: window.location.href.split('?')[0],
            img: optimizedImg, 
            label: v.getAttribute('data-label')
        };
        
        let h = JSON.parse(localStorage.getItem(K_H) || '[]');
        h = h.filter(p => p.url !== d.url);
        h.unshift(d);
        localStorage.setItem(K_H, JSON.stringify(h.slice(0, 10)));
        let i = JSON.parse(localStorage.getItem(K_I) || '{}');
        i[d.label] = (i[d.label] || 0) + 1;
        localStorage.setItem(K_I, JSON.stringify(i));
    }
    
    async function suggest() {
        const i = JSON.parse(localStorage.getItem(K_I) || '{}');
        const h = JSON.parse(localStorage.getItem(K_H) || '[]');
        const top = Object.keys(i).sort((a, b) => i[b] - i[a])[0] || 'موضوعات';
        const tag = document.getElementById('user-interest-tag');
        if (tag) tag.textContent = (window.seoturbo_label_dictionary && window.seoturbo_label_dictionary[top.toLowerCase()]) || top;
        
        const data = await window.ST_MASTER_PROMISE;
        if (!data || !data.feed.entry) return [];
        return data.feed.entry.filter(e => {
            const u = e.link.find(l => l.rel === 'alternate').href.split('?')[0];
            const has = e.category && e.category.some(c => c.term === top);
            const nr = !h.some(p => p.url === u);
            return has && nr;
        }).slice(0, 5);
    }
    
    function render(id, d, listType = 'fav') {
        const c = document.getElementById(id);
        if (!c) return;
        if (!d || d.length === 0) {
            c.innerHTML = '<div class="seoturbo-fav-empty-msg">لا توجد بيانات حالياً</div>';
            return;
        }
        c.innerHTML = d.map(p => {
            const t = (listType === 'suggested') ? p.title.$t : p.title;
            const u = (listType === 'suggested') ? p.link.find(l => l.rel === 'alternate').href : p.url;
            
            let rawMedia = (listType === 'suggested' && p.media$thumbnail) ? p.media$thumbnail.url : 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi7Ml848_trMe4J1co6ImpiKh7XcXn2ZsRTk85hy4oWOlBvvOIyHTSxoC1nvNwlZ0-PvMwjQFVEcqhA0H2dGcz-fWO9il9RlsmpXX8I7RLYt6y7kPb9cE2fKnBqdD7gvbSTfLfoSjCZs_brqPRiw335YfX5qGHS8iNYIHCBNUo1npNK3o8Oxtob-KxZeBk/s16000-rw/rbka-news300-100.webp';
            const m = (listType === 'suggested') ? (window.optimizeImage ? window.optimizeImage(rawMedia, 'dash-thumb') : rawMedia) : p.img;
            
            let btn = '';
            if (listType === 'fav') {
                btn = `<div class="seoturbo-fav-item-remove" onclick="window.removeSeoturboDashFav('${p.id}')">✕</div>`;
            } else if (listType === 'history') {
                btn = `<div class="seoturbo-fav-item-remove" onclick="window.removeSeoturboDashHistory('${p.id}')">✕</div>`;
            }
            
            return `<div class="seoturbo-fav-item"><img src="${m}" loading="lazy"><div class="seoturbo-fav-item-info"><a href="${u}" class="seoturbo-fav-item-title">${t}</a></div>${btn}</div>`;
        }).join('');
    }
    
    window.removeSeoturboDashFav = function(id) {
        let f = JSON.parse(localStorage.getItem(K_F) || '[]');
        f = f.filter(x => x.id !== id);
        localStorage.setItem(K_F, JSON.stringify(f));
        render('dash-saved-list', f, 'fav');
        updateUI();
    };
    
    window.removeSeoturboDashHistory = function(id) {
        let h = JSON.parse(localStorage.getItem(K_H) || '[]');
        h = h.filter(x => x.id !== id);
        localStorage.setItem(K_H, JSON.stringify(h));
        render('dash-history-list', h, 'history');
    };

    function updateUI() {
        const f = JSON.parse(localStorage.getItem(K_F) || '[]');        
        document.querySelectorAll('#seoturbo-favCount, #seoturbo-favCountSticky').forEach(b => {
            if (b) b.textContent = f.length;
        });
        document.querySelectorAll('#seoturbo-openFavBtn, #seoturbo-openFavBtnSticky').forEach(btn => {
            const icon = btn.querySelector('use');
            if (icon) {
                icon.setAttribute('href', '#icon-user-dash');
                icon.setAttribute('xlink:href', '#icon-user-dash');
            }
        });
        const pBtn = document.getElementById('seoturbo-postFavAction');
        if (pBtn) {
            const saved = f.some(x => x.id === pBtn.dataset.id);
            pBtn.classList.toggle('is-saved', saved);
            const pIcon = pBtn.querySelector('use');
            if (pIcon) {
                const iconId = saved ? '#icon-fav-full' : '#icon-fav-empty';
                pIcon.setAttribute('href', iconId);
                pIcon.setAttribute('xlink:href', iconId);
            }
            const txt = pBtn.querySelector('.seoturbo-fav-text');
            if (txt) txt.textContent = saved ? 'تم الحفظ في مفضلتك' : 'حفظ في المفضلة';
        }
    }
    
    async function openDashboard() {
        const dash = document.getElementById('seoturbo-user-dashboard');
        if (!dash) return;
        dash.classList.add('active');
        document.body.style.overflow = 'hidden';
        render('dash-saved-list', JSON.parse(localStorage.getItem(K_F) || '[]'), 'fav');
        render('dash-history-list', JSON.parse(localStorage.getItem(K_H) || '[]'), 'history');
        const s = await suggest();
        render('dash-suggested-list', s, 'suggested');
    }
    
    function init() {
        document.addEventListener('click', async (e) => {
            const openBtn = e.target.closest('#seoturbo-openFavBtn, #seoturbo-openFavBtnSticky');
            if (openBtn) {
                e.preventDefault();
                await openDashboard();
            }
            if (e.target.closest('#seoturbo-closeDash') || (e.target.id === 'seoturbo-user-dashboard')) {
                document.getElementById('seoturbo-user-dashboard').classList.remove('active');
                document.body.style.overflow = '';
            }
            const tabBtn = e.target.closest('.dash-tab-btn');
            if (tabBtn) {
                document.querySelectorAll('.dash-tab-btn, .dash-tab-content').forEach(el => el.classList.remove('active'));
                tabBtn.classList.add('active');
                const content = document.getElementById(tabBtn.dataset.tab);
                if (content) content.classList.add('active');
            }
            const favAction = e.target.closest('.seoturbo-post-add-fav');
            if (favAction && favAction.dataset.id) {
                e.preventDefault();
                let f = JSON.parse(localStorage.getItem(K_F) || '[]');
                const ex = f.findIndex(x => x.id === favAction.dataset.id);
                if (ex > -1) f.splice(ex, 1);
                else f.push({id: favAction.dataset.id, title: favAction.dataset.title, url: favAction.dataset.url, img: favAction.dataset.img});
                localStorage.setItem(K_F, JSON.stringify(f));
                updateUI();
            }
        });
        const clearBtn = document.getElementById('seoturbo-clearAllFavs');
        if(clearBtn) clearBtn.onclick = () => { if(confirm('مسح المفضلة؟')) { localStorage.setItem(K_F, '[]'); render('dash-saved-list', [], 'fav'); updateUI(); }};

        updateUI();
    }

    if (window.location.pathname.includes('/20')) track();
    window.addEventListener('load', init);
})();

// Module 76
(function() {
    'use strict';
    var freePopup = document.getElementById('seoturbo-acc-free-popup');
    if (freePopup) freePopup.remove();
    
    const storageKey = 'seoturbo_acc_state_v12';
    const fontKey = 'seoturbo_post_font_size';

    function runSeoturboAccessSystem() {
        const modal = document.getElementById('seoturbo-acc-modal');
        const postBody = document.querySelector('.post-body.entry-content, .post-body');
        if (!modal) return;
        let currentFS = parseInt(localStorage.getItem(fontKey)) || 18;
        if (postBody) postBody.style.fontSize = currentFS + 'px';
        const savedClasses = JSON.parse(localStorage.getItem(storageKey) || '[]');
        savedClasses.forEach(cls => {
            document.body.classList.add(cls);
            document.querySelector(`.seoturbo-acc-opt[data-acc="${cls}"]`)?.classList.add('seoturbo-active');
        });
        document.getElementById('seoturbo-acc-proxy-inc').onclick = function(e) {
            e.preventDefault();
            if (postBody && currentFS < 34) {
                currentFS += 2;
                postBody.style.fontSize = currentFS + 'px';
                localStorage.setItem(fontKey, currentFS);
            }
        };
        document.getElementById('seoturbo-acc-proxy-dec').onclick = function(e) {
            e.preventDefault();
            if (postBody && currentFS > 14) {
                currentFS -= 2;
                postBody.style.fontSize = currentFS + 'px';
                localStorage.setItem(fontKey, currentFS);
            }
        };
        document.addEventListener('click', function(e) {
            const target = e.target;            
            const trigger = target.closest('.seoturbo-acc-trigger');
            if (trigger) {
                e.preventDefault();
                e.stopPropagation();
                const isBottom = trigger.id.includes('sticky') || trigger.id.includes('mobile');
                modal.classList.remove('seoturbo-open-top', 'seoturbo-open-bottom');
                modal.classList.add(isBottom ? 'seoturbo-open-bottom' : 'seoturbo-open-top');
                modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
                return;
            }
            if (modal.style.display === 'flex' && !target.closest('.seoturbo-acc-content') && !target.closest('.seoturbo-acc-trigger')) {
                modal.style.display = 'none';
            }
            if (target.id === 'seoturbo-acc-close-x' || target.id === 'seoturbo-acc-close-btn') {
                modal.style.display = 'none';
            }
            const opt = target.closest('.seoturbo-acc-opt');
            if (opt) {
                const cls = opt.dataset.acc;
                const active = document.body.classList.toggle(cls);
                opt.classList.toggle('seoturbo-active', active);
                const current = Array.from(document.body.classList).filter(c => c.startsWith('seoturbo-acc-'));
                localStorage.setItem(storageKey, JSON.stringify(current));
            }
            if (target.id === 'seoturbo-acc-reset-btn') {
                Array.from(document.body.classList).filter(c => c.startsWith('seoturbo-acc-')).forEach(c => document.body.classList.remove(c));
                document.querySelectorAll('.seoturbo-acc-opt').forEach(el => el.classList.remove('seoturbo-active'));
                localStorage.removeItem(storageKey);
                localStorage.removeItem(fontKey);
                window.location.reload(); 
            }
        }, true);
    }
    if (document.readyState === 'complete') runSeoturboAccessSystem();
    else window.addEventListener('load', runSeoturboAccessSystem);
})();