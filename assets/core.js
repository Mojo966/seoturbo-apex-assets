
// MODULE 1
  window.ST_MASTER_PROMISE = fetch('/feeds/posts/summary?alt=json&max-results=25', {
      method: 'GET',
      mode: 'cors',
      priority: 'high'
  }).then(r => r.ok ? r.json() : null).catch(e => null);

// MODULE 2
window.optimizeImage = function(url, type = 'default') {
  if (!url || typeof url !== 'string') return 'https://placehold.co/600x400/222/fff?text=No+Image';
  if (url.includes('placehold.co')) return url;
  const sizes = {
    'hd': 'w1200-h675-p-k-no-nu', 
    'story': 'w500-h889-c-rw-l80',
    'thumb': 's150-c-rw-l60', 
    'story-thumb': 's95-c-rw-l60',
    'dash-thumb': 'w120-h90-c-rw-l60',
    'related': 'w340-h220-c-rw-l60',
    'mega': 'w400-h225-c-rw-l60',
    'galaxy-grid': 'w640-h360-c-rw-l50',
    'galaxy-thumb': 'w500-h300-c-rw-l25',
    'wheel-grid': 'w640-h360-c-rw-l50',
    'wheel-thumb': 'w300-h169-c-rw-l20',
    'main-tool': 'w340-h191-c-rw-l30',
    'default': 's600-c-rw-l80'
  };
  let targetSize = sizes[type] || sizes['default'];
  if (url.match(/\/s[0-9]+(\-c)?/)) {
    return url.replace(/\/s[0-9]+(\-c)?/, '/' + targetSize);
  } else if (url.match(/\/w[0-9]+\-h[0-9]+(\-[a-zA-Z0-9\-]+)?/)) {
    return url.replace(/\/w[0-9]+\-h[0-9]+(\-[a-zA-Z0-9\-]+)?/, '/' + targetSize);
  } else if (url.includes('=s')) {
    return url.replace(/=s[0-9]+.*/, '=' + targetSize);
  }
  return url;
};

// MODULE 3
(function() {
    'use strict';
    
    var scrollTopBtn = document.getElementById('scrollToTop');
    var scrollBottomBtn = document.getElementById('scrollToBottom');
    var notifMoveBtn = document.getElementById('seoturboNotifMoveBtn');
    
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
    
    if (scrollBottomBtn) {
        scrollBottomBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var scrollHeight = document.documentElement.scrollHeight;
            window.scrollTo({ top: scrollHeight, behavior: 'smooth' });
        });
    }
    
    var curtainBtn = document.getElementById('curtain-btn');
    if (curtainBtn) {
        curtainBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var body = document.body;
            var isOpen = body.getAttribute('data-curtain') === 'open';
            body.setAttribute('data-curtain', isOpen ? 'closed' : 'open');
        });
    }
    
    function syncNotifMoveCount() {
        var moveCount = document.getElementById('seoturboNotifMoveCount');
        var originalBadge = document.querySelector('.seoturbo-notif-badge');
        if (moveCount && originalBadge) {
            moveCount.textContent = originalBadge.textContent;
        }
    }
    
    syncNotifMoveCount();
    
    var badgeObserver = new MutationObserver(function() {
        syncNotifMoveCount();
    });
    var originalBadge = document.querySelector('.seoturbo-notif-badge');
    if (originalBadge) {
        badgeObserver.observe(originalBadge, { childList: true, characterData: true, subtree: true });
    }
    
    function startNotifMoveAnimation() {
        var moveBtn = document.getElementById('seoturboNotifMoveBtn');
        if (!moveBtn) return;
        var bellIcon = document.getElementById('seoturbo-bell-icon');
        if (!bellIcon) return;
        bellIcon.style.transition = 'all 0.5s ease';
        var direction = 1;
        var interval = setInterval(function() {
            if (moveBtn && document.body.style.overflow !== 'hidden') {
                bellIcon.style.transform = 'rotate(' + direction * 12 + 'deg)';
                direction = direction * -1;
            }
        }, 600);
        moveBtn.addEventListener('mouseenter', function() {
            clearInterval(interval);
            bellIcon.style.transform = 'rotate(0deg)';
        });
        moveBtn.addEventListener('mouseleave', function() {
            direction = 1;
            interval = setInterval(function() {
                if (moveBtn && document.body.style.overflow !== 'hidden') {
                    bellIcon.style.transform = 'rotate(' + direction * 12 + 'deg)';
                    direction = direction * -1;
                }
            }, 600);
        });
    }
    
    startNotifMoveAnimation();
    
})();

// MODULE 4
(function() {
    'use strict';
    function initStickyEngine() {
        const addonBar = document.getElementById('seoturbo-sticky-bar');
        const navWrapper = document.querySelector('.nav-menu .outer-wrapper');
        const originalCard = document.querySelector('.header-main .management-card');
        if (!addonBar || !navWrapper) return;
        let chairmanHTML = "";
        let editorHTML = "";
        if (originalCard) {
            const photos = originalCard.querySelectorAll('.management-frame img');
            const items = originalCard.querySelectorAll('.management-item');
            if (items[0]) {
                const n1 = items[0].querySelector('.management-name')?.textContent.trim() || "";
                const r1 = items[0].querySelector('.management-role span')?.textContent.trim() || "إدارة الموقع";
                const img1 = photos[0]?.src || "";                
                if (n1) {
                    chairmanHTML = `<div class="sticky-person-item" title="${r1}: ${n1}">
                        <div class="sp-img"><img src="${img1}" alt="${n1}"></div>
                        <div class="sp-info"><span class="sp-role">${r1}</span><span class="sp-name">${n1}</span></div></div>`;
                }
            }
            if (items[1]) {
                const n2 = items[1].querySelector('.management-name')?.textContent.trim() || "";
                const r2 = items[1].querySelector('.management-role span')?.textContent.trim() || "هيئة التحرير";
                const img2 = photos[1]?.src || "";
                if (n2) {
                    editorHTML = `<div class="sticky-person-item" title="${r2}: ${n2}">
                        <div class="sp-info"><span class="sp-role">${r2}</span><span class="sp-name">${n2}</span></div>
                        <div class="sp-img"><img src="${img2}" alt="${n2}"></div></div>`;
                }
            }
        }
        requestAnimationFrame(() => {
            if (addonBar.parentNode !== navWrapper) {
                navWrapper.prepend(addonBar);
            }            
            const chPlaceholder = document.getElementById('sticky-chairman-placeholder');
            const edPlaceholder = document.getElementById('sticky-editor-placeholder');            
            if (chPlaceholder) chPlaceholder.innerHTML = chairmanHTML;
            if (edPlaceholder) edPlaceholder.innerHTML = editorHTML;
            initStickyObserver();
        });
    }
    function initStickyObserver() {
        if (document.getElementById('sticky-sentinel')) return;        
        const sentinel = document.createElement('div');
        sentinel.id = 'sticky-sentinel';
        sentinel.style.cssText = 'position:absolute; top:150px; width:1px; height:1px; pointer-events:none; visibility:hidden;';
        document.body.prepend(sentinel);
        const observer = new IntersectionObserver((entries) => {
            const isOutside = !entries[0].isIntersecting;
            requestAnimationFrame(() => {
                if (document.body.classList.contains('seoturbo-sticky-active') !== isOutside) {
                    document.body.classList.toggle('seoturbo-sticky-active', isOutside);
                }
            });
        }, { 
            rootMargin: '0px',
            threshold: 0 
        });
        observer.observe(sentinel);
    }
    function bindStickyButtons() {
        const actions = {
            'seoturbo-sticky-share-btn': 'seoturbo-share',
            'seoturbo-sticky-dark-mode-btn': 'seoturbo-dark-mode',
            'seoturbo-sticky-search-btn': 'seoturbo-search'
        };
        Object.keys(actions).forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.onclick = (e) => {
                    e.preventDefault();
                    const target = document.getElementById(actions[id]);
                    if (target) target.click();
                };
            }
        });
    }
    if (document.readyState === 'complete') {
        initStickyEngine();
        bindStickyButtons();
    } else {
        window.addEventListener('load', () => {
            initStickyEngine();
            bindStickyButtons();
        });
    }
})();

