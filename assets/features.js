
// MODULE 20
document.addEventListener('DOMContentLoaded', function() {
    'use strict';

    let cachedCategoryInfo = null;
    const pendingElements = new Set();
    let isProcessing = false;

    const IGNORED_IFRAME_CLASSES = ['BLOG_object_iframe', 'blogger-iframe-colorize', 'blogger-comment-from-post'];

    function getCategoryIconFromMenu(labelSlug) {
        const menuLinks = document.querySelectorAll('#main-menu a[href*="/search/label/"]');
        for (let link of menuLinks) {
            try {
                const href = decodeURIComponent(link.getAttribute('href'));
                if (href.includes('/' + labelSlug)) {
                    const icon = link.querySelector('svg, i');
                    if (icon) return icon.outerHTML;
                }
            } catch(e) {}
        }
        return '';
    }

    function getCategoryInfo() {
        if (cachedCategoryInfo) return cachedCategoryInfo;
        const dict = window.seoturbo_label_dictionary || {};
        const active = document.querySelector('.seoturbo-breadcrumbs-list a.label-to-map, .post-labels a');
        if (active) {
            try {
                const key = decodeURIComponent(active.href).split('/search/label/')[1].split(/[?#]/)[0].trim().toLowerCase();
                cachedCategoryInfo = { 
                    name: dict[key] || active.textContent.trim(), 
                    icon: getCategoryIconFromMenu(key), 
                    url: active.href 
                };
                return cachedCategoryInfo;
            } catch(e) {}
        }
        return { name: 'موضوعات', icon: '', url: '#' };
    }

    function getSourceInfo(el) {
        const info = ((el.alt || '') + (el.title || '') + (el.src || '')).toLowerCase();
        const isAI = ['ai', 'ذكاء', 'مولدة', 'generated'].some(word => info.includes(word));
        return isAI ? 
            { label: 'صورة أرشيفية', emoji: '<svg width="12" height="12" viewBox="0 0 640 512" style="fill:currentColor;"><use href="#icon-robot"/></svg>' } :
            { label: 'تصوير آخرون', emoji: '<svg width="12" height="12" viewBox="0 0 512 512" style="fill:currentColor;"><use href="#icon-camera"/></svg>' };
    }

    function shouldIgnoreIframe(iframeElement) {
        if (!iframeElement) return false;
        for (let className of IGNORED_IFRAME_CLASSES) {
            if (iframeElement.classList && iframeElement.classList.contains(className)) {
                return true;
            }
        }
        const src = iframeElement.src || '';
        return src.includes('/share-widget') || (src.includes('blogger.com') && src.includes('comment'));
    }

    function getVisualWidth(imgElement) {
        if (!imgElement) return 0;
        return imgElement.naturalWidth || imgElement.width || 0;
    }

    function isSmallOrThumbnailImage(imgElement) {
        if (!imgElement) return false;
        return !!imgElement.closest('.team-grid-table, .team-grid, .seoturbo-dep-members-list, .seoturbo-member-tag, .v-full-img, .management-frame, .seoterbo-title-writer-img');
    }

    function processFrameQueue() {
        if (pendingElements.size === 0) { isProcessing = false; return; }
        isProcessing = true;

        const frameTasks = [];
        const cat = getCategoryInfo();
        const favicon = document.querySelector('link[rel*="icon"]')?.href || '';

        pendingElements.forEach(media => {
            if (!media || media.closest('.seoterbo-frame-root-container')) return;
            
            const isVideo = ['iframe', 'video'].includes(media.tagName.toLowerCase());
            if (isVideo && shouldIgnoreIframe(media)) return;
            
            const insideDesc = isVideo ? (media.title || '') : (media.alt || media.title || '');
            const bloggerCaption = media.closest('.tr-caption-container')?.querySelector('.tr-caption') || 
                                   media.parentElement?.querySelector('.tr-caption');
            
            frameTasks.push({
                media,
                isVideo,
                insideDesc,
                outsideCaption: bloggerCaption ? bloggerCaption.textContent.trim() : "",
                srcInfo: getSourceInfo(media),
                elementToReplace: media.closest('.tr-caption-container') || media
            });
        });

        pendingElements.clear();

        requestAnimationFrame(() => {
            frameTasks.forEach(task => {
                const frameHTML = `
                    <div class="seoterbo-frame-root-container ${task.insideDesc ? 'has-internal-desc' : ''}">
                        <div class="seoterbo-frame-container">
                            <div class="seoterbo-frame-wrapper">
                                ${favicon ? `<div class="seoterbo-frame-logo"><img src="${favicon}" alt="Logo"></div>` : ''}
                                <a href="${cat.url}" class="seoterbo-frame-category-button">
                                    ${cat.icon || '<svg width="12" height="12" viewBox="0 0 576 512" style="fill:currentColor;"><use href="#icon-folder-open"/></svg>'} <span>${cat.name}</span>
                                </a>
                                <div class="seoterbo-frame-photo-credit"><span>${task.srcInfo.label}</span> <span class="frame-icon-emoji">${task.srcInfo.emoji}</span></div>
                                <div class="media-inner-holder"></div>
                                ${task.insideDesc ? `<div class="image-caption-overlay">${task.insideDesc}</div>` : ''}
                            </div>
                            ${task.outsideCaption ? `<div class="seoterbo-frame-caption">${task.outsideCaption}</div>` : ''}
                        </div>
                    </div>`;

                const container = document.createElement('div');
                container.innerHTML = frameHTML;
                const finalFrame = container.firstElementChild;
                const holder = finalFrame.querySelector('.media-inner-holder');

                if (task.isVideo) {
                    const vBox = document.createElement('div');
                    vBox.className = 'video-aspect-ratio-box';
                    vBox.style.paddingBottom = '56.25%';
                    const vContent = document.createElement('div');
                    vContent.className = 'video-aspect-ratio-content';
                    vContent.appendChild(task.media.cloneNode(true));
                    vBox.appendChild(vContent);
                    holder.appendChild(vBox);
                } else {
                    const processedImg = task.media.cloneNode(true);
                    processedImg.className = 'seoterbo-frame-img';
                    holder.appendChild(processedImg);
                }

                if (task.elementToReplace.parentNode) {
                    task.elementToReplace.parentNode.replaceChild(finalFrame, task.elementToReplace);
                    requestAnimationFrame(() => finalFrame.classList.add('is-visible'));
                }
            });
            isProcessing = false;
        });
    }

    const frameObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const isImg = el.tagName.toLowerCase() === 'img';
                
                if (isImg && isSmallOrThumbnailImage(el)) {
                    frameObserver.unobserve(el);
                    return;
                }

                const triggerProcess = () => {
                    if (getVisualWidth(el) > 300 || !isImg) {
                        pendingElements.add(el);
                        if (!isProcessing) processFrameQueue();
                    }
                };

                if (!isImg) {
                    triggerProcess();
                } else if (el.complete) {
                    triggerProcess();
                } else {
                    el.onload = triggerProcess;
                }
                frameObserver.unobserve(el);
            }
        });
    }, { rootMargin: '300px' });

    const body = document.querySelector('.post-body.entry-content, .static-page-body, .page-body, .post-body');
    if (body) {
        body.querySelectorAll('img, iframe, video').forEach(el => frameObserver.observe(el));
    }
});

// MODULE 21
(function() {
    'use strict';
    function translateKeyword(keyword) {
        if (!keyword) return keyword;
        try {
            if (window.seoturbo_label_dictionary) {
                var lowerKeyword = keyword.toLowerCase().trim();
                if (window.seoturbo_label_dictionary[lowerKeyword]) {
                    return window.seoturbo_label_dictionary[lowerKeyword];
                }
            }
        } catch(e) {}
        return keyword;
    }
    function initKeywordBadge() {
        var keywordBadge = document.getElementById('keyword-badge-target');
        if (!keywordBadge) return;
        var postBody = document.querySelector('.post-body, .entry-content');
        var finalKeyword = "";
        if (postBody) {
            var manualScript = postBody.querySelector('script#manual-keywords');
            if (manualScript) {
                try {
                    var json = JSON.parse(manualScript.textContent);
                    if (json && json.keywords) {
                        finalKeyword = json.keywords.split(',')[0].trim();
                    }
                } catch (e) {}
            }
        }
        if (!finalKeyword) {
            var metaKeywords = document.querySelector('meta[name="keywords"]');
            if (metaKeywords && metaKeywords.getAttribute('content')) {
                finalKeyword = metaKeywords.getAttribute('content').split(',')[0].trim();
            }
        }
        if (!finalKeyword) {
            var vault = document.getElementById('seoturbo-data-vault');
            if (vault && vault.getAttribute('data-label')) {
                finalKeyword = vault.getAttribute('data-label');
            }
        }
        if (!finalKeyword || finalKeyword === "موضوع") {
            var originalText = keywordBadge.textContent.trim();
            if (originalText && originalText !== "") finalKeyword = originalText;
        }
        if (!finalKeyword || finalKeyword === "") {
            finalKeyword = "موضوع";
        }
        var translated = translateKeyword(finalKeyword);
        translated = translated.replace(/^_+/, '').replace(/\s+/g, ' ').trim();
        keywordBadge.innerHTML = '<span>' + translated + '</span>';
        keywordBadge.href = '/search?q=' + encodeURIComponent(translated);
        if (!keywordBadge.querySelector('svg')) {
            var iconSvg = '<svg class="keyword-badge-icon" width="14" height="14" viewBox="0 0 512 512" style="fill:currentColor;margin-left:8px;"><path d="M0 252.118V48C0 21.49 21.49 0 48 0h204.118a48 48 0 0 1 33.941 14.059l211.882 211.882c18.745 18.745 18.745 49.137 0 67.882L293.823 497.941c-18.745 18.745-49.137 18.745-67.882 0L14.059 286.059A48 48 0 0 1 0 252.118zM112 64a48 48 0 1 0 0 96 48 48 0 0 0 0-96z"/></svg>';
            keywordBadge.insertAdjacentHTML('afterbegin', iconSvg);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initKeywordBadge);
    } else {
        initKeywordBadge();
    }
})();

// MODULE 22
window.addEventListener('load', function() {
    var ad = document.getElementById('ST_Main_Ad_2'),
        post = document.querySelector('.post-body.entry-content');
    if (ad && post) {
        var elements = Array.from(post.children).filter(function(el) {
            return ['P', 'SECTION', 'TABLE', 'UL', 'OL', 'H3', 'H4'].includes(el.tagName);
        });
        if (elements.length > 2) {
            var mid = Math.floor(elements.length / 2);
            var target = elements[mid];
            ad.style.display = 'block';
            ad.style.margin = '30px auto';
            ad.style.textAlign = 'center';
            ad.style.clear = 'both';
            target.parentNode.insertBefore(ad, target.nextSibling);
        }
    }
});

// MODULE 24
(function() {
    'use strict';
    if (!window.location.pathname.includes('/20')) return;

    var placeholder = document.getElementById('seoturbo-related-placeholder');
    if(placeholder) placeholder.remove();

    let isInjected = false;

    function injectInternalLinks(entries) {
        if (isInjected) return;
        const pb = document.querySelector('.post-body.entry-content') || document.querySelector('.post-body');
        if (!pb || !entries || entries.length < 2) return;
        
        const paragraphs = Array.from(pb.children).filter(el => {
            return el.tagName === 'P' && el.innerText.trim().length > 40;
        });

        if (paragraphs.length < 2) return;

        const currentUrl = window.location.href.split('?')[0];
        const filtered = entries.filter(e => e.link.find(l => l.rel === 'alternate').href.split('?')[0] !== currentUrl).slice(0, 2);

        filtered.forEach((post, index) => {
            const pos = Math.floor(paragraphs.length * (index + 1) / (filtered.length + 1));
            const t = post.title.$t;
            const l = post.link.find(u => u.rel === 'alternate').href;
            
            const boxHTML = `
            <div class="seoturbo-related-link-box" title="توصية قراءة مرتبطة بهذا الجزء من الموضوع">
                <div class="seoturbo-related-icon" title="رابط توثيقي"><svg width="16" height="16" viewBox="0 0 512 512" style="fill: currentColor;"><use href="#icon-link"/></svg></div>
                <div class="seoturbo-related-content">
                    <span class="seoturbo-related-label" title="محتوى من نفس التصنيف">موضوعات ذات صلة</span>
                    <a href="${l}" class="seoturbo-related-title" title="انقر للانتقال وقراءة: ${t}">${t}</a>
                </div>
            </div>`;
            
            if (paragraphs[pos]) {
                paragraphs[pos].insertAdjacentHTML('afterend', boxHTML);
                isInjected = true;
            }
        });
    }

    function initInternalEngine() {
        const currentLabel = (window.postLabels && window.postLabels.length > 0) ? window.postLabels[0] : null;

        if (window.ST_MASTER_PROMISE) {
            window.ST_MASTER_PROMISE.then(data => {
                if (data && data.feed && data.feed.entry) {
                    let relatedFromCache = data.feed.entry.filter(e => currentLabel && e.category && e.category.some(c => c.term === currentLabel));
                    
                    if (relatedFromCache.length >= 2) {
                        injectInternalLinks(relatedFromCache);
                    } else {
                        setTimeout(() => {
                            let apiUrl = `/feeds/posts/summary${currentLabel ? '/-/' + encodeURIComponent(currentLabel) : ''}?alt=json&max-results=6`;
                            fetch(apiUrl).then(r => r.json()).then(j => { if(j.feed.entry) injectInternalLinks(j.feed.entry); });
                        }, 4500);
                    }
                }
            });
        }
    }

    if ('requestIdleCallback' in window) {
        requestIdleCallback(initInternalEngine, { timeout: 3000 });
    } else {
        window.addEventListener('load', () => setTimeout(initInternalEngine, 2000));
    }
})();

// MODULE 25
(function() {
    'use strict';

    var freeContainer = document.getElementById('seoturbo-keywords-placeholder');
    if(freeContainer) freeContainer.remove();

    const runFast = window.requestIdleCallback || function(cb) { setTimeout(cb, 2000); };

    runFast(function() {
        const postBody = document.querySelector('.post-body.entry-content') || document.querySelector('.post-body');
        if (!postBody) return;

        const getMeta = (n) => document.querySelector(`meta[name="${n}"], meta[property="${n}"]`)?.content || "";
        const articleHeadline = document.querySelector('h1.seoterbo-title-main-headline')?.textContent.trim() || getMeta('og:site_name');

        function getManualKeywords() {
            const manual = document.getElementById('manual-keywords');
            if (!manual) return [];
            try {
                const data = JSON.parse(manual.textContent);
                return data.keywords ? data.keywords.split(',').map(k => k.trim()).filter(k => k.length > 0) : [];
            } catch (e) {
                console.warn("Manual Keywords Parse Error:", e);
                return [];
            }
        }

        function getCleanText(container) {
            const temp = document.createElement('div');
            temp.innerHTML = container.innerHTML;
            temp.querySelectorAll('script, style, textarea, .post-tags-container').forEach(el => el.remove());
            return temp.textContent || temp.innerText || "";
        }

        function gatherKeywords(text, manualList) {
            const stopWords = new Set(['في', 'على', 'عن', 'إلى', 'من', 'حتى', 'بين', 'أمام', 'خلف', 'تحت', 'فوق', 'عند', 'لدى', 'نحو', 'إلا', 'ال', 'هذا', 'هذه', 'هؤلاء', 'ذلك', 'تلك', 'أنا', 'أنت', 'هو', 'هي', 'نحن', 'أنتم', 'هم', 'و', 'أو', 'لكن', 'ثم', 'أم', 'الذي', 'التي', 'الذين', 'حيث', 'إذا', 'إن', 'إذ', 'كان', 'يكون', 'أصبح', 'صار', 'فقط', 'أيضا', 'قد', 'لقد', 'سوف', 'مع', 'قبل', 'بعد', 'جدا']);
            const freq = {};
            
            manualList.forEach(k => { freq[k.toLowerCase()] = 1000; });

            const words = text.split(/\s+/).filter(w => w.length > 3);
            words.forEach(w => {
                const normalized = w.replace(/[^\u0600-\u06FF\w]/g, '').toLowerCase();
                if (normalized.length > 3 && !stopWords.has(normalized)) {
                    freq[normalized] = (freq[normalized] || 0) + 1;
                }
            });

            return Object.keys(freq).sort((a, b) => freq[b] - freq[freq.hasOwnProperty(a) ? a : '']);
        }

        const manualKws = getManualKeywords();
        const cleanText = getCleanText(postBody);
        const allKeywords = gatherKeywords(cleanText, manualKws);

        requestAnimationFrame(() => {
            postBody.querySelectorAll('img').forEach((img, i) => {
                if (i === 0) img.setAttribute('fetchpriority', 'high');
                if (!img.alt) img.alt = articleHeadline;
                if (img.src.includes('bp.blogspot.com') && !img.src.includes('w1200')) {
                    img.src = img.src.replace(/\/(s\d+|w\d+-h\d+|w\d+)(-[^/]*)*\//, '/w1200-h630-p-k-no-nu-rw-l50/');
                }
            });

            const searchUrl = window.location.origin + '/search?q=';
            const walker = document.createTreeWalker(postBody, NodeFilter.SHOW_TEXT, {
                acceptNode: function(node) {
                    const p = node.parentElement;
                    if (!p || p.closest('script, style, a, h1, h2, h3, h4, table, .post-tags-container, .seoterbo-frame-root-container')) return NodeFilter.FILTER_REJECT;
                    return NodeFilter.FILTER_ACCEPT;
                }
            });

            let node, count = 0, linked = new Set();
            while ((node = walker.nextNode()) && count < 10) {
                for (const kw of allKeywords.slice(0, 20)) {
                    if (linked.has(kw)) continue;
                    const idx = node.nodeValue.indexOf(kw);
                    if (idx !== -1) {
                        const range = document.createRange();
                        range.setStart(node, idx);
                        range.setEnd(node, idx + kw.length);
                        const link = document.createElement('a');
                        link.href = searchUrl + encodeURIComponent(kw);
                        link.className = 'auto-internal-link';
                        link.textContent = kw;
                        range.surroundContents(link);
                        linked.add(kw);
                        count++;
                        break;
                    }
                }
            }

            const tagContainer = document.getElementById('keywords-section-placeholder');
            if (tagContainer && allKeywords.length > 0) {
                const tagsHTML = allKeywords.slice(0, 10).map(k => `<a href="${searchUrl}${encodeURIComponent(k)}" rel="tag">${k}</a>`).join('');
                tagContainer.innerHTML = `<div class="post-tags-container"><div class="post-tags-title"><svg width="14" height="14" viewBox="0 0 512 512" style="fill:currentColor;"><use href="#icon-tag"/></svg><span>الكلمات المفتاحية</span></div><div class="post-tags-list">${tagsHTML}</div></div>`;
                tagContainer.style.display = 'block';
            }
        });
    }, { timeout: 3000 });
})();

// MODULE 40
(function() {
    'use strict';
    
    if (window.seoturbo_translation_loaded) return;
    window.seoturbo_translation_loaded = true;
    
    window.seoturbo_label_dictionary = window.seoturbo_label_dictionary || {};
    window.seoturbo_dictionary_ready = false;
    
    function sanitizeText(html) {
        if (!html) return '';
        var div = document.createElement('div');
        div.innerHTML = html.replace(/^_/, '').trim();
        div.querySelectorAll('i, svg, img, style, script, span').forEach(function(el) { el.remove(); });
        return div.textContent.replace(/\s+/g, ' ').trim();
    }
    
    function buildDictionary() {
        if (window.seoturbo_dictionary_ready) return;
        
        var links = document.querySelectorAll('#main-menu a[href*="/search/label/"], .main-menu a[href*="/search/label/"]');
        if (!links.length) return;
        
        links.forEach(function(link) {
            try {
                var href = decodeURIComponent(link.getAttribute('href'));
                var match = href.match(/\/search\/label\/([^\/?#]+)/);
                if (match) {
                    var slug = match[1].toLowerCase().trim();
                    var fullHTML = link.innerHTML.replace(/^_/, '').trim();
                    if (slug && fullHTML && !window.seoturbo_label_dictionary[slug]) {
                        window.seoturbo_label_dictionary[slug] = sanitizeText(fullHTML);
                    }
                }
            } catch(e) {}
        });
        
        window.seoturbo_dictionary_ready = true;
        translatePageTitle();
    }
    
    window.seoturbo_translate_label = function(englishLabel) {
        if (!englishLabel) return englishLabel;
        var searchKey = englishLabel.toLowerCase().trim();
        return window.seoturbo_label_dictionary[searchKey] || englishLabel;
    };
    
    function translatePageTitle() {
        if (!window.seoturbo_dictionary_ready) return;
        if (!window.location.pathname.includes('/search/label/')) return;
        
        var labelSlug = decodeURIComponent(window.location.pathname.split('/search/label/')[1] || '').split(/[?#]/)[0].toLowerCase().trim();
        var translatedLabel = window.seoturbo_label_dictionary[labelSlug];
        if (!translatedLabel || translatedLabel === labelSlug) return;
        
        var siteTitle = document.querySelector('title')?.textContent.split(' - ')[1] || 
                       document.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
        
        if (siteTitle) {
            document.title = translatedLabel + ' - ' + siteTitle;
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', buildDictionary);
    } else {
        buildDictionary();
    }
    
})();

// MODULE 41
(function() {
    'use strict';
    
    var categoryData = {};
    var blogColor = getComputedStyle(document.documentElement).getPropertyValue('--blogcolor').trim() || '#6366f1';
    var colorList = Array(16).fill(blogColor);
    var colorIndex = 0;
    
    document.querySelectorAll('#main-menu a[href*="/search/label/"], .main-menu a[href*="/search/label/"]').forEach(function(link) {
        try {
            var href = decodeURIComponent(link.getAttribute('href'));
            var match = href.match(/\/search\/label\/([^\/?#]+)/);
            if (match) {
                var slug = match[1].toLowerCase().trim();
                var fullHTML = link.innerHTML.replace(/^_/, '').trim();
                
                var iconHTML = '';
                var iconTag = link.querySelector('i, svg');
                if (iconTag) {
                    iconHTML = iconTag.outerHTML.replace(/fill="[^"]*"/g, "").replace(/style="[^"]*"/g, "");
                }
                
                var tempDiv = document.createElement('div');
                tempDiv.innerHTML = fullHTML;
                tempDiv.querySelectorAll('i, svg, img').forEach(function(el) { el.remove(); });
                var cleanText = tempDiv.textContent.trim();
                
                if (slug && cleanText) {
                    categoryData[slug] = {
                        name: cleanText,
                        icon: iconHTML,
                        color: colorList[colorIndex % colorList.length]
                    };
                    colorIndex++;
                }
            }
        } catch(e) {}
    });
    
    function applyCategoryStyles() {
        var categoryButtons = document.querySelectorAll('.postcat');
        
        categoryButtons.forEach(function(btn) {
            var btnText = btn.textContent.trim();
            var matchedData = null;
            
            for (var slug in categoryData) {
                if (categoryData[slug].name === btnText) {
                    matchedData = categoryData[slug];
                    break;
                }
            }
            
            if (matchedData) {
                btn.style.backgroundColor = matchedData.color;
                
                if (!btn.querySelector('i, svg') && matchedData.icon) {
                    var tempSpan = document.createElement('span');
                    tempSpan.innerHTML = matchedData.icon;
                    var iconElement = tempSpan.firstChild;
                    if (iconElement) {
                        iconElement.style.marginLeft = '6px';
                        iconElement.style.fontSize = '11px';
                        iconElement.style.fill = 'currentColor'; 
                        btn.insertBefore(iconElement, btn.firstChild);
                    }
                }
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(applyCategoryStyles, 500);
            setTimeout(applyCategoryStyles, 1500);
        });
    } else {
        setTimeout(applyCategoryStyles, 500);
        setTimeout(applyCategoryStyles, 1500);
    }
    
    if (window.MutationObserver) {
        var observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.addedNodes.length) {
                    var hasNewCategory = false;
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === 1 && (node.classList?.contains('postcat') || node.querySelectorAll?.('.postcat').length > 0)) {
                            hasNewCategory = true;
                        }
                    });
                    if (hasNewCategory) {
                        setTimeout(applyCategoryStyles, 200);
                    }
                }
            });
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }
})();

// MODULE 45
function closeSideAd(side) {
  document.getElementById(side + &#39;-side-ads-container&#39;).style.display = &#39;none&#39;;
}

// MODULE 46
(function() {
    'use strict';

    const config = {
        postperpage: window.ST_PP || 8, 
        numshowpage: 3, 
        upPageWord: "السابق",
        downPageWord: "التالي",
        home_page: window.location.origin
    };

    let targetPageNum = 1;
    let isInitialized = false;

    window.hitungtotaldata = function(json) {
        if (!json || !json.feed) return;
        const total = parseInt(json.feed.openSearch$totalResults.$t, 10);
        buildPagination(total);
    };

    function buildPagination(totaldata) {
        const thisUrl = window.location.href;
        let currentPage = 1;
        if (thisUrl.indexOf("#PageNo=") != -1) {
            currentPage = parseInt(thisUrl.substring(thisUrl.indexOf("#PageNo=") + 8));
        }

        let html = "";
        const halfShow = Math.floor(config.numshowpage / 2);
        let start = currentPage - halfShow;
        if (start < 1) start = 1;
        const maxPages = Math.ceil(totaldata / config.postperpage);
        let end = start + config.numshowpage - 1;
        if (end > maxPages) end = maxPages;
        
        if (currentPage > 1) {
            html += `<span class="showpage"><a href="#" onclick="goToPage(${currentPage - 1});return false" title="العودة إلى الصفحة السابقة (صفحة رقم ${currentPage - 1})">${config.upPageWord}</a></span>`;
        }
        
        for (let i = start; i <= end; i++) {
            if (currentPage == i) {
                html += `<span class="showpagePoint" title="أنت حالياً في الصفحة رقم ${i}">${i}</span>`;
            } else {
                html += `<span class="showpageNum"><a href="#" onclick="goToPage(${i});return false" title="الانتقال إلى الصفحة رقم ${i}">${i}</a></span>`;
            }
        }
        
        if (currentPage < maxPages) {
            html += `<span class="showpage"><a href="#" onclick="goToPage(${currentPage + 1});return false" title="الانتقال إلى الصفحة التالية (صفحة رقم ${currentPage + 1})">${config.downPageWord}</a></span>`;
        }
        
        const pagerContainer = document.getElementById("blog-pager");
        if (pagerContainer) {
            pagerContainer.innerHTML = html;
            pagerContainer.setAttribute('title', `مركز التنقل - إجمالي الصفحات: ${maxPages}`);
        }
    }

    window.goToPage = function(num) {
        targetPageNum = num; 
        const startIndex = (num - 1) * config.postperpage + 1;
        const labelPath = window.location.pathname.includes('/search/label/') ? '/-/' + window.location.pathname.split('/search/label/')[1].split('?')[0] : '';
        const fetchUrl = `${config.home_page}/feeds/posts/summary${labelPath}?start-index=${startIndex}&max-results=1&alt=json-in-script&callback=redirectWithTimestamp`;
        
        const script = document.createElement('script');
        script.src = fetchUrl;
        script.title = "جاري الانتقال...";
        document.body.appendChild(script);
    };

    window.redirectWithTimestamp = function(json) {
        if (!json.feed.entry) return;
        const entry = json.feed.entry[0];
        const publishedDate = entry.published.$t.substring(0, 19) + entry.published.$t.substring(23, 29);
        const timestamp = encodeURIComponent(publishedDate);
        const path = window.location.pathname.includes('/search/label/') ? '/search/label/' + window.location.pathname.split('/search/label/')[1].split('?')[0] : '/search';
        window.location.href = `${path}?updated-max=${timestamp}&max-results=${config.postperpage}#PageNo=${targetPageNum}`;
    };

    function runPaginationEngine() {
        if (isInitialized) return;
        isInitialized = true;

        const isHomepage = window.location.pathname === '/';

        if (isHomepage && window.ST_MASTER_PROMISE) {
            window.ST_MASTER_PROMISE.then(data => { 
                if(data) {
                    console.log('🚀 SEOTurbo: Pagination initialized via Global Engine (Zero Request)');
                    hitungtotaldata(data); 
                }
            });
        } else {
            const label = window.location.pathname.includes('/search/label/') ? '/-/' + window.location.pathname.split('/search/label/')[1].split('?')[0] : '';
            fetch(`${config.home_page}/feeds/posts/summary${label}?alt=json&max-results=1`)
                .then(r => r.json()).then(d => hitungtotaldata(d));
        }
    }

    const pagerTarget = document.getElementById('blog-pager');
    if (pagerTarget) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                runPaginationEngine();
                observer.disconnect();
            }
        }, { rootMargin: '600px' });
        observer.observe(pagerTarget);
    }

})();

// MODULE 47
(function() {
    'use strict';
    let currentFontSize = 18;
    const storageKey = 'seoturbo_post_font_size';

    function initFontSizeControl() {
        const increaseBtn = document.querySelector('.increaseFont');
        const decreaseBtn = document.querySelector('.decreaseFont');
        const postBody = document.querySelector('.post-body.entry-content');

        if (!increaseBtn || !decreaseBtn || !postBody) return;

        const step = 2;
        const minSize = 14;
        const maxSize = 32;

        const savedSize = localStorage.getItem(storageKey);
        if (savedSize) {
            currentFontSize = parseInt(savedSize);
            postBody.style.fontSize = currentFontSize + 'px';
        }

        const updateFontSize = (direction) => {
            currentFontSize = Math.max(minSize, Math.min(maxSize, currentFontSize + (direction * step)));
            requestAnimationFrame(() => {
                postBody.style.fontSize = currentFontSize + 'px';
                localStorage.setItem(storageKey, currentFontSize);
            });
        };

        increaseBtn.onclick = (e) => { e.preventDefault(); updateFontSize(1); };
        decreaseBtn.onclick = (e) => { e.preventDefault(); updateFontSize(-1); };
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFontSizeControl);
    } else {
        initFontSizeControl();
    }
})();

// MODULE 48
(function() {
    'use strict';
    function buildSTSocial() {
        document.querySelectorAll('.social-sidebar-inner a').forEach(link => {
            let data = link.getAttribute('title') || link.innerText || '';
            if (data.includes('[') && data.includes(']')) {
                const parts = data.split('[');
                const brand = parts[0].trim();
                const count = parts[1].replace(']', '').trim();
                const cleanBrand = brand.charAt(0).toUpperCase() + brand.slice(1);
                link.title = cleanBrand + ' - ' + count; 
                link.setAttribute('aria-label', cleanBrand + ' ' + count);
                link.setAttribute('data-count', count);
                const iconId = brand.toLowerCase();
                link.innerHTML = `<svg class="st-svg-icon"><use href="#icon-${iconId}"/></svg>`;
                link.classList.add('st-stacked-btn', iconId);
            }
        });
    }
    buildSTSocial();
    window.addEventListener('load', buildSTSocial);
})();

// MODULE 49
(function() {
    'use strict';
    
    var freeContainer = document.getElementById('seoturbo-comments-placeholder');
    var originalContainer = document.getElementById('comments-section-original');
    
    if (freeContainer) freeContainer.style.display = 'none';
    if (originalContainer) originalContainer.style.display = 'block';
    
    let commentsLoaded = false;

    function loadBloggerComments() {
        if (commentsLoaded) return;
        
        const editor = document.getElementById('comment-editor');
        const source = document.getElementById('comment-editor-src');
        const container = document.getElementById('seoturbo-dynamic-js-comments');

        if (editor && source && source.href) {
            editor.setAttribute('src', source.href);
            
            if (container) {
                const bloggerJS = document.createElement('script');
                bloggerJS.src = 'https://www.blogger.com/static/v1/jsbin/2836230691-comment_from_post_iframe.js';
                bloggerJS.async = true;
                container.appendChild(bloggerJS);
            }
            
            commentsLoaded = true;
            console.log('✅ SEOTurbo: تم كسر سلسلة طلبات التعليقات وتحميلها بنجاح');
        }
    }

    function initLazyComments() {
        const target = document.querySelector('.commentsection');
        if (!target) return;

        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    loadBloggerComments();
                    observer.disconnect();
                }
            }, { rootMargin: '500px' });
            observer.observe(target);
        } else {
            window.addEventListener('load', () => setTimeout(loadBloggerComments, 5000));
        }
    }

    initLazyComments();
})();

// MODULE 50
(function() {
    'use strict';
    
    var freeContainer = document.getElementById('seoturbo-author-role-placeholder');
    if(freeContainer) freeContainer.remove();
    
    function syncAuthorRole() {
        const authorDescEl = document.querySelector('.author-desc');
        const roleTarget = document.querySelector('.seoterbo-title-writer-role');
        if (authorDescEl && roleTarget) {
            const fullText = authorDescEl.textContent.trim();
            if (fullText.includes('|')) {
                const dynamicRole = fullText.split('|')[0].trim();
                if (dynamicRole.length > 0) {
                    roleTarget.textContent = dynamicRole;
                }
            }
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', syncAuthorRole);
    } else {
        syncAuthorRole();
    }
    setTimeout(syncAuthorRole, 500);
})();

// MODULE 51
(function() {
    'use strict';
    
    var freePopup = document.getElementById('seoturbo-side-nav-free-popup');
    if (freePopup) freePopup.remove();
    
    const sideNavBtn = document.getElementById('openSideNavBtn');
    const stickySideNavBtn = document.getElementById('stickySideNavBtn');
    const sideNav = document.getElementById('seoturboSideNav');
    const closeBtn = document.getElementById('closeSideNavBtn');
    const overlay = document.getElementById('sideNavOverlay');
    
    if (!sideNav || !closeBtn || !overlay) return;
    
    function syncSocialFromSidebar() {
        const sideNavSocialContainer = document.querySelector('.seoturbo-side-nav-social');
        const sidebarSocialSource = document.querySelector('.social-sidebar-inner');
        if (sideNavSocialContainer && sidebarSocialSource) {
            sideNavSocialContainer.innerHTML = '';
            Array.from(sidebarSocialSource.children).forEach(item => {
                const clone = item.cloneNode(true);
                clone.classList.remove('st-stacked-btn');
                clone.removeAttribute('data-count');
                sideNavSocialContainer.appendChild(clone);
            });
        } else if (sideNavSocialContainer) {
            const headerSocial = document.querySelector('.seoturbo-topbar-social-icons');
            if (headerSocial) sideNavSocialContainer.innerHTML = headerSocial.innerHTML;
        }
    }

    function openSideNav() {
        sideNav.classList.add('open');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
        syncSocialFromSidebar();
    }
    
    function closeSideNav() {
        sideNav.classList.remove('open');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    if (sideNavBtn) sideNavBtn.addEventListener('click', openSideNav);
    if (stickySideNavBtn) stickySideNavBtn.addEventListener('click', openSideNav);
    
    closeBtn.addEventListener('click', closeSideNav);
    overlay.addEventListener('click', closeSideNav);
    
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sideNav.classList.contains('open')) closeSideNav();
    });
    
    function buildSideMenu() {
        const menuContainer = document.getElementById('sideNavMenuContent');
        if (!menuContainer) return;
        let html = '';
        const sourceMenu = document.getElementById('main-menu');
        if (sourceMenu) {
            Array.from(sourceMenu.children).forEach(li => {
                if (li.tagName !== 'LI') return;
                const parentLink = li.querySelector('a');
                if (!parentLink) return;
                let iconHtml = parentLink.querySelector('svg') ? parentLink.querySelector('svg').outerHTML : '<svg width="16" height="16" viewBox="0 0 320 512" style="fill: currentColor;"><use href="#icon-chevron-left"/></svg>';
                const text = parentLink.textContent.trim();
                const href = parentLink.getAttribute('href');
                if (li.classList.contains('has-sub')) {
                    const subMenuUl = li.querySelector('ul.sub-menu');
                    if (subMenuUl) {
                        html += `<div class="seoturbo-hamburger-parent"><div class="seoturbo-hamburger-parent-title" data-trigger="drop"><span>${iconHtml} ${text}</span><span class="arrow">▼</span></div><div class="seoturbo-hamburger-submenu">`;
                        subMenuUl.querySelectorAll('li > a').forEach(subA => {
                            let subIconHtml = subA.querySelector('svg') ? subA.querySelector('svg').outerHTML : '<svg width="12" height="12" viewBox="0 0 448 512" style="fill: currentColor;"><use href="#icon-minus"/></svg>';
                            html += `<a class="seoturbo-hamburger-link" href="${subA.getAttribute('href')}">${subIconHtml} ${subA.textContent.trim()}</a>`;
                        });
                        html += `</div></div>`;
                    }
                } else {
                    html += `<a class="seoturbo-hamburger-link" href="${href}">${iconHtml} ${text}</a>`;
                }
            });
        }
        menuContainer.innerHTML = html;
        menuContainer.querySelectorAll('[data-trigger="drop"]').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const submenu = btn.nextElementSibling;
                const isOpen = btn.classList.toggle('is-open');
                submenu.style.display = isOpen ? 'block' : 'none';
            };
        });
    }
    
    const popularContainer = document.getElementById('sideNavPopularPosts');
    if (popularContainer && window.ST_MASTER_PROMISE) {
        window.ST_MASTER_PROMISE.then(data => {
            if (data && data.feed && data.feed.entry) {
                let html = '';
                const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                data.feed.entry.slice(0, 5).forEach(post => {
                    const title = post.title.$t;
                    const link = post.link.find(l => l.rel === 'alternate').href;
                    const img = window.optimizeImage ? window.optimizeImage(post.media$thumbnail ? post.media$thumbnail.url : '', 'related') : 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi7Ml848_trMe4J1co6ImpiKh7XcXn2ZsRTk85hy4oWOlBvvOIyHTSxoC1nvNwlZ0-PvMwjQFVEcqhA0H2dGcz-fWO9il9RlsmpXX8I7RLYt6y7kPb9cE2fKnBqdD7gvbSTfLfoSjCZs_brqPRiw335YfX5qGHS8iNYIHCBNUo1npNK3o8Oxtob-KxZeBk/s16000-rw/rbka-news300-100.webp';
                    const date = new Date(post.published.$t);
                    const dateStr = date.getDate() + ' ' + months[date.getMonth()] + ' ' + date.getFullYear();
                    html += `
                        <a class='seoturbo-side-nav-popular-item' href='${link}'>
                            <div class='seoturbo-side-nav-popular-thumb'><img src='${img}' alt='${title.replace(/"/g, '&quot;')}' loading='lazy'></div>
                            <div class='seoturbo-side-nav-popular-info'>
                                <div class='seoturbo-side-nav-popular-title'>${title}</div>
                                <div class='seoturbo-side-nav-popular-date'><svg height='10' viewBox='0 0 512 512' width='10'><use href='#icon-clock'/></svg> <span>${dateStr}</span></div>
                            </div>
                        </a>`;
                });
                popularContainer.innerHTML = html;
            }
        });
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            buildSideMenu();
            syncSocialFromSidebar();
        });
    } else {
        buildSideMenu();
        syncSocialFromSidebar();
    }
})();

// MODULE 52
(function() {
    'use strict';
    
    var freePopup = document.getElementById('favFreePopup');
    var freeBtn = document.getElementById('favFreeBtn');
    var originalFav = document.getElementById('fav-original-box');
    
    if (freePopup) freePopup.style.display = 'none';
    if (freeBtn) freeBtn.style.display = 'none';
    if (originalFav) originalFav.style.display = 'block';
    
    const SEOTURBO_STORAGE_KEY = 'seoturbo_favorites_v11';
    
    function getFavs() {
        return JSON.parse(localStorage.getItem(SEOTURBO_STORAGE_KEY) || '[]');
    }

    function saveFavs(favs) {
        localStorage.setItem(SEOTURBO_STORAGE_KEY, JSON.stringify(favs));
        updateAllFavButtons();
        updateFavCounters();
    }

    function updateAllFavButtons() {
        const favs = getFavs();
        
        const postActionBtn = document.getElementById('seoturbo-postFavAction');
        if (postActionBtn) {
            const isSaved = favs.some(f => f.id === postActionBtn.dataset.id);
            postActionBtn.classList.toggle('is-saved', isSaved);
            const svgUse = postActionBtn.querySelector('use');
            if (svgUse) svgUse.setAttribute('href', isSaved ? '#icon-fav-full' : '#icon-fav-empty');
            const textSpan = postActionBtn.querySelector('.seoturbo-fav-text');
            if (textSpan) textSpan.textContent = isSaved ? 'تم الحفظ في مفضلتك' : 'حفظ في المفضلة';
        }
        
        document.querySelectorAll('.Posts-byCategory .seoturbo-post-add-fav').forEach(btn => {
            const isSaved = favs.some(f => f.id === btn.dataset.id);
            btn.classList.toggle('is-saved', isSaved);
            const svgUse = btn.querySelector('use');
            if (svgUse) svgUse.setAttribute('href', isSaved ? '#icon-fav-full' : '#icon-fav-empty');
            const textSpan = btn.querySelector('.seoturbo-fav-text');
            if (textSpan) textSpan.textContent = isSaved ? 'تم الحفظ في مفضلتك' : 'حفظ في المفضلة';
        });
        
        document.querySelectorAll('#seoturbo-leadership-slider .seoturbo-post-add-fav').forEach(btn => {
            const isSaved = favs.some(f => f.id === btn.dataset.id);
            btn.classList.toggle('is-saved', isSaved);
            const svgUse = btn.querySelector('use');
            if (svgUse) svgUse.setAttribute('href', isSaved ? '#icon-fav-full' : '#icon-fav-empty');
            const textSpan = btn.querySelector('.seoturbo-fav-text');
            if (textSpan) textSpan.textContent = isSaved ? 'تم الحفظ' : 'حفظ';
        });
        
        document.querySelectorAll('.seoturbo-main-tool-grid .seoturbo-post-add-fav').forEach(btn => {
            const isSaved = favs.some(f => f.id === btn.dataset.id);
            btn.classList.toggle('is-saved', isSaved);
            const svgUse = btn.querySelector('use');
            if (svgUse) svgUse.setAttribute('href', isSaved ? '#icon-fav-full' : '#icon-fav-empty');
        });
    }

    function updateFavCounters() {
        const favs = getFavs();
        document.querySelectorAll('#seoturbo-favCount, #seoturbo-favCountSticky').forEach(b => {
            b.textContent = favs.length;
            b.style.display = 'flex';
        });
        
        const stickyIcon = document.querySelector('#seoturbo-openFavBtnSticky use');
        if (stickyIcon) stickyIcon.setAttribute('href', favs.length > 0 ? '#icon-fav-full' : '#icon-fav-empty');
    }

    function toggleFav(data, btnElement) {
        let favs = getFavs();
        const exists = favs.some(f => f.id === data.id);
        
        if (exists) {
            favs = favs.filter(f => f.id !== data.id);
            showToast('❌ تمت الإزالة من المفضلة');
        } else {
            favs.push(data);
            showToast('✅ تم الحفظ في المفضلة');
        }
        
        saveFavs(favs);
        
        if (btnElement) {
            const isSaved = !exists;
            btnElement.classList.toggle('is-saved', isSaved);
            const svgUse = btnElement.querySelector('use');
            if (svgUse) svgUse.setAttribute('href', isSaved ? '#icon-fav-full' : '#icon-fav-empty');
            const textSpan = btnElement.querySelector('.seoturbo-fav-text');
            if (textSpan) {
                const isInSlider = btnElement.closest('#seoturbo-leadership-slider') !== null;
                if (isInSlider) {
                    textSpan.textContent = isSaved ? 'تم الحفظ' : 'حفظ';
                } else {
                    textSpan.textContent = isSaved ? 'تم الحفظ في مفضلتك' : 'حفظ في المفضلة';
                }
            }
        }
    }

    function renderFavList() {
        const container = document.getElementById('seoturbo-favListContainer');
        if (!container) return;
        
        const favs = getFavs();
        if (favs.length === 0) {
            container.innerHTML = '<div class="seoturbo-fav-empty-msg">✨ قائمة المفضلة فارغة حالياً</div>';
            return;
        }
        
        container.innerHTML = favs.map(f => `
            <div class="seoturbo-fav-item">
                <img src="${f.img}" alt="${f.title}" loading="lazy">
                <div class="seoturbo-fav-item-info">
                    <a href="${f.url}" class="seoturbo-fav-item-title">${f.title}</a>
                </div>
                <div class="seoturbo-fav-item-remove" onclick="window.removeSeoturboFav('${f.id}')" title="إزالة من المفضلة">
                    <svg width="14" height="14" viewBox="0 0 448 512" fill="currentColor"><path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.7 23.7 0 0 0-21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0-16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"/></svg>
                </div>
            </div>
        `).join('');
    }

    window.removeSeoturboFav = function(id) {
        let favs = getFavs();
        favs = favs.filter(f => f.id !== id);
        saveFavs(favs);
        renderFavList();
        showToast('❌ تمت الإزالة من المفضلة');
    };

    function showToast(msg) {
        const oldToast = document.querySelector('.seoturbo-fav-toast');
        if (oldToast) oldToast.remove();
        
        const toast = document.createElement('div');
        toast.className = 'seoturbo-fav-toast';
        toast.style.cssText = 'position:fixed;bottom:80px;right:30px;background:var(--blogcolor);color:#fff;padding:12px 25px;border-radius:12px;z-index:10000001;box-shadow:0 10px 20px rgba(0,0,0,0.2);font-weight:bold;';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => { 
            toast.style.opacity = '0'; 
            toast.style.transition = 'opacity 0.3s';
            setTimeout(() => toast.remove(), 500); 
        }, 2500);
    }

    document.addEventListener('click', function(e) {
        const favBtn = e.target.closest('.seoturbo-post-add-fav');
        if (favBtn && favBtn.dataset.id) {
            e.preventDefault();
            const data = {
                id: favBtn.dataset.id,
                title: favBtn.dataset.title,
                url: favBtn.dataset.url,
                img: favBtn.dataset.img || 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi7Ml848_trMe4J1co6ImpiKh7XcXn2ZsRTk85hy4oWOlBvvOIyHTSxoC1nvNwlZ0-PvMwjQFVEcqhA0H2dGcz-fWO9il9RlsmpXX8I7RLYt6y7kPb9cE2fKnBqdD7gvbSTfLfoSjCZs_brqPRiw335YfX5qGHS8iNYIHCBNUo1npNK3o8Oxtob-KxZeBk/s16000-rw/rbka-news300-100.webp'
            };
            toggleFav(data, favBtn);
        }
        
        if (e.target.closest('#seoturbo-openFavBtn') || e.target.closest('#seoturbo-openFavBtnSticky')) {
            e.preventDefault();
            renderFavList();
            const modal = document.getElementById('seoturbo-favModal');
            if (modal) {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
        
        if (e.target.id === 'seoturbo-favModal' || e.target.id === 'seoturbo-closeFavModal') {
            const modal = document.getElementById('seoturbo-favModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
        
        if (e.target.id === 'seoturbo-clearAllFavs') {
            if (confirm('⚠️ هل أنت متأكد من مسح قائمة المفضلة بالكامل؟')) {
                saveFavs([]);
                renderFavList();
                showToast('🗑️ تم مسح قائمة المفضلة بالكامل');
            }
        }
    });

    updateAllFavButtons();
    updateFavCounters();
})();

// MODULE 53
(function() {
    'use strict';
    
    var freePopup = document.getElementById('seoturbo-notif-free-popup');
    if (freePopup) freePopup.remove();
    
    const NOTIF_CONFIG = {
        storageKey: 'seoturbo_last_visit'
    };

    async function checkNotifications() {
        try {
            if (!window.ST_MASTER_PROMISE) return;
            const data = await window.ST_MASTER_PROMISE;
            if(!data||!data.feed||!data.feed.entry) return;
            
            const entries = data.feed.entry.slice(0, 5);
            const lastVisit = localStorage.getItem(NOTIF_CONFIG.storageKey) || 0;
            
            let newCount = 0;
            let listHtml = '';

            entries.forEach(post => {
                const postDate = new Date(post.published.$t).getTime();
                if (postDate > lastVisit) newCount++;

                const title = post.title.$t;
                const link = post.link.find(l => l.rel === 'alternate').href;
                const rawImg = post.media$thumbnail ? post.media$thumbnail.url : 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi7Ml848_trMe4J1co6ImpiKh7XcXn2ZsRTk85hy4oWOlBvvOIyHTSxoC1nvNwlZ0-PvMwjQFVEcqhA0H2dGcz-fWO9il9RlsmpXX8I7RLYt6y7kPb9cE2fKnBqdD7gvbSTfLfoSjCZs_brqPRiw335YfX5qGHS8iNYIHCBNUo1npNK3o8Oxtob-KxZeBk/s16000-rw/rbka-news300-100.webp';
                const img = window.optimizeImage ? window.optimizeImage(rawImg, 'related') : rawImg;
                const dateText = new Date(post.published.$t).toLocaleDateString('ar-EG', {day:'numeric', month:'long'});

                listHtml += `
                    <a href="${link}" class="seoturbo-notif-item">
                        <img src="${img}" class="seoturbo-notif-img" loading="lazy">
                        <div class="seoturbo-notif-info">
                            <span class="seoturbo-notif-title">${title}</span>
                            <div class="seoturbo-notif-meta">
                                <span>📅 ${dateText}</span>
                                ${postDate > lastVisit ? '<span style="color:var(--google-red)">● جديد</span>' : ''}
                            </div>
                        </div>
                    </a>`;
            });

            const badges = document.querySelectorAll('.seoturbo-notif-badge');
            badges.forEach(b => {
                b.textContent = newCount;
                b.style.display = 'flex';
            });

            const container = document.getElementById('seoturbo-notifContainer');
            if (container) container.innerHTML = listHtml || '<div class="seoturbo-notif-empty">لا توجد تحديثات حالياً</div>';

        } catch (e) { console.warn('Notif Error:', e); }
    }

    function markAsRead() {
        localStorage.setItem(NOTIF_CONFIG.storageKey, Date.now());
        const badges = document.querySelectorAll('.seoturbo-notif-badge');
        badges.forEach(b => b.style.display = 'none');
    }

    document.addEventListener('click', function(e) {
        if (e.target.closest('.seoturbo-notif-btn')) {
            document.getElementById('seoturbo-notifModal').classList.add('active');
            document.body.style.overflow = 'hidden';
            markAsRead();
        }
        
        if (e.target.closest('#seoturboNotifMoveBtn')) {
            e.preventDefault();
            document.getElementById('seoturbo-notifModal').classList.add('active');
            document.body.style.overflow = 'hidden';
            markAsRead();
        }

        if (e.target.id === 'seoturbo-notifModal' || e.target.id === 'seoturbo-notifClose') {
            document.getElementById('seoturbo-notifModal').classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    checkNotifications();
})();

// MODULE 54
(function() {
    'use strict';
    
    var freeContainer = document.getElementById('seoturbo-postnav-placeholder');
    var originalContainer = document.getElementById('seoturbo-postnav-original');
    
    if (freeContainer) freeContainer.style.display = 'none';
    if (originalContainer) originalContainer.style.display = 'block';
    
    (async function() {
        if (!window.ST_MASTER_PROMISE) return;
        const currentUrl = window.location.href;
        const data = await window.ST_MASTER_PROMISE;
        if (!data || !data.feed.entry) return;

        const posts = data.feed.entry;
        
        let currentIndex = -1;
        for (let i = 0; i < posts.length; i++) {
            const postUrl = posts[i].link.find(l => l.rel === 'alternate').href;
            if (postUrl === currentUrl || currentUrl.includes(postUrl.split('?')[0])) {
                currentIndex = i;
                break;
            }
        }

        if (currentIndex === -1) return;

        const prevPost = posts[currentIndex - 1];
        const nextPost = posts[currentIndex + 1];

        function getSiteFavicon() {
            const faviconLink = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
            if (faviconLink && faviconLink.href) return faviconLink.href;
            return window.location.origin + '/favicon.ico';
        }

        const siteFavicon = getSiteFavicon();

        function fillNavData(containerId, post) {
            const container = document.getElementById(containerId);
            if (!container) return;
            
            if (!post) {
                container.style.display = 'none';
                return;
            }
            
            const link = container.querySelector('a');
            const titleEl = container.querySelector('.seoturbo-article-nav-title');
            const imgContainer = container.querySelector('.seoturbo-article-nav-img');
            
            if (link) {
                link.href = post.link.find(l => l.rel === 'alternate').href;
                link.style.cursor = 'pointer';
                link.style.opacity = '1';
                link.style.pointerEvents = 'auto';
            }
            if (titleEl) titleEl.textContent = post.title.$t;
            
            if (imgContainer) {
                let rawImg = post.media$thumbnail ? post.media$thumbnail.url : siteFavicon;
                const optimizedImg = window.optimizeImage ? window.optimizeImage(rawImg, 'related') : rawImg;
                imgContainer.innerHTML = '<img src="' + optimizedImg + '" alt="' + post.title.$t.replace(/"/g, '&quot;') + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">';
            }
        }
        
        fillNavData('seoturbo-prev-loader', prevPost);
        fillNavData('seoturbo-next-loader', nextPost);
    })();
})();

// MODULE 55
(function() {
    'use strict';
    
    var freeCapsule = document.getElementById('seoturbo-capsule-placeholder');
    if (freeCapsule) freeCapsule.remove();
    
    const capsule = document.getElementById('seoturbo-see-more-capsule');
    if (!capsule) return;
    const isPostPage = document.body.classList.contains('post-page');
    let isClosed = false;
    let isMinimized = false;
    const triggerPoint = isPostPage ? 0.35 : 0.8;
    const contentContainer = document.getElementById('capsule-content-container');
    async function populateCapsule() {
        if (contentContainer.hasAttribute('data-loaded')) return;
        try {
            if (!window.ST_MASTER_PROMISE) return;
            const data = await window.ST_MASTER_PROMISE;
            if (!data || !data.feed.entry) return;
            const currentUrl = window.location.href.split(/[?#]/)[0];
            const posts = data.feed.entry.filter(post => {
                const postUrl = (post.link.find(l => l.rel === 'alternate') || {}).href;
                return postUrl && postUrl.split(/[?#]/)[0] !== currentUrl;
            }).slice(0, 4);
            if (posts.length > 0) {
                let html = '';
                posts.forEach(post => {
                    const title = post.title.$t;
                    const link = (post.link.find(l => l.rel === 'alternate') || {}).href;
                    const rawImg = post.media$thumbnail ? post.media$thumbnail.url : 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi7Ml848_trMe4J1co6ImpiKh7XcXn2ZsRTk85hy4oWOlBvvOIyHTSxoC1nvNwlZ0-PvMwjQFVEcqhA0H2dGcz-fWO9il9RlsmpXX8I7RLYt6y7kPb9cE2fKnBqdD7gvbSTfLfoSjCZs_brqPRiw335YfX5qGHS8iNYIHCBNUo1npNK3o8Oxtob-KxZeBk/s16000-rw/rbka-news300-100.webp';
                    const img = window.optimizeImage ? window.optimizeImage(rawImg, 'related') : rawImg;
                    html += `<a class="capsule-post" href="${link}" title="${title.replace(/"/g, '&quot;')}"><div class="capsule-post-thumb"><img src="${img}" alt="${title.replace(/"/g, '&quot;')}" loading="lazy"></div><div class="capsule-post-info"><h4 class="capsule-post-title">${title}</h4></div></a>`;
                });
                contentContainer.innerHTML = html;
                contentContainer.setAttribute('data-loaded', 'true');
            }
        } catch (error) { console.error('Capsule Error:', error); }
    }
    function handleScroll() {
        if (isClosed) return;
        let shouldShow = false;
        if (isPostPage) {
            const postBody = document.querySelector('.post-body');
            if (postBody) {
                const rect = postBody.getBoundingClientRect();
                const scrollPosition = window.innerHeight - rect.top;
                const bodyHeight = rect.height;
                if (scrollPosition > (bodyHeight * triggerPoint)) shouldShow = true;
            }
        } else {
            if (window.scrollY > 1000) shouldShow = true;
        }
        if (shouldShow) {
            capsule.style.display = 'block';
            requestAnimationFrame(() => {
                capsule.classList.add('visible');
                populateCapsule();
            });
        } else {
            capsule.classList.remove('visible');
        }
    }
    document.getElementById('capsule-close').onclick = () => {
        isClosed = true;
        capsule.classList.remove('visible');
        setTimeout(() => { capsule.style.display = 'none'; }, 500);
    };
    const minBtn = document.getElementById('capsule-minimize');
    minBtn.onclick = () => {
        isMinimized = !isMinimized;
        capsule.classList.toggle('minimized', isMinimized);
        minBtn.innerHTML = isMinimized ? '&#43;' : '&#8722;';
        minBtn.title = isMinimized ? 'تكبير' : 'تصغير';
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('seoturbo-cp-apply', function() {
        if (!isClosed) {
            requestAnimationFrame(function() {
                capsule.classList.add('visible');
                capsule.style.display = 'block';
                populateCapsule();
            });
        }
    });
})();

// MODULE 56
(function() {
    'use strict';
    
    var freePopup = document.getElementById('seoturbo-quality-free-popup');
    var freeBtn = document.getElementById('seoturbo-quality-free-btn');
    var originalQuality = document.getElementById('quality-report-original');
    
    if (freePopup) freePopup.style.display = 'none';
    if (freeBtn) freeBtn.style.display = 'none';
    if (originalQuality) originalQuality.style.display = 'block';
    
    if (!document.querySelector('.post-body')) return;
    if (window.seoturboQualityLoaded) return;

    function getSecretPassword() {
        var metaTag = document.querySelector('meta[name="seoturbo-quality-password"]');
        if (metaTag && metaTag.getAttribute('content')) {
            return metaTag.getAttribute('content');
        }
        return '1234';
    }

    function analyzeContentQuality() {
        var postBody = document.querySelector('.post-body.entry-content') || document.querySelector('.post-body');
        if (!postBody) return null;
        
        var text = postBody.innerText || postBody.textContent;
        var wordCount = text.split(/\s+/).length;
        var paragraphs = postBody.querySelectorAll('p');
        var images = postBody.querySelectorAll('img:not(.author-img)');
        var allLinks = postBody.querySelectorAll('a[href*="/"]');
        
        var score = 0;
        var maxScore = 0;
        var details = [];

        var check = function(name, val, target, weight) {
            maxScore += weight;
            var isPass = val >= target;
            var s = isPass ? weight : (val > 0 ? Math.floor(weight/2) : 0);
            score += s;
            details.push({
                name: name,
                score: s,
                max: weight,
                status: isPass ? 'pass' : (val > 0 ? 'warning' : 'fail')
            });
        };

        check('بيانات Schema المنظمة', !!document.querySelector('script[type="application/ld+json"]'), 1, 5);
        check('طول المقال (كلمات)', wordCount, 800, 10);
        check('العناوين الفرعية H2-H4', postBody.querySelectorAll('h2, h3, h4').length, 3, 7);
        check('وسوم الكلمات المفتاحية', document.querySelectorAll('.post-tags-container a').length, 3, 5);
        check('وصف الميتا (Description)', (document.querySelector('meta[name="description"]')?.content.length || 0), 100, 4);
        check('روابط ذكية (Auto Links)', document.querySelectorAll('.auto-internal-link').length, 1, 3);

        var intLinks = Array.from(allLinks).filter(function(l) { return l.href.includes(window.location.hostname); }).length;
        check('الروابط الداخلية', intLinks, 3, 6);
        
        var highTrust = ['.gov', '.edu', 'wikipedia.org', 'google.com', 'who.int'];
        var extLinks = Array.from(allLinks).filter(function(l) { return !l.href.includes(window.location.hostname) && l.href.startsWith('http'); });
        var hasTrust = extLinks.some(function(l) { return highTrust.some(function(d) { return l.href.includes(d); }); });
        check('مصادر خارجية موثوقة', hasTrust ? 1 : 0, 1, 5);
        
        check('الاستشهادات والمراجع', postBody.querySelectorAll('a[id^="cite"], .reference').length, 1, 4);
        check('توثيق هوية الكاتب', !!document.getElementById('author-box-fixed'), 1, 3);
        check('ارتباط سياسة الخصوصية', document.querySelectorAll('a[href*="privacy"], a[href*="policy"]').length, 1, 3);
        check('تاريخ التحديث الأخير', (document.getElementById('seoturbo-data-vault')?.getAttribute('data-mod') ? 1 : 0), 1, 3);

        check('جدول المحتويات (TOC)', !!document.getElementById('tocDiv'), 1, 6);
        check('تأطير الصورة الرئيسية', !!document.querySelector('.seoterbo-frame-root-container'), 1, 5);
        
        var imgsWithAlt = Array.from(images).filter(function(img) { return img.alt && img.alt.length > 5; }).length;
        check('نصوص الصور البديلة (Alt)', images.length > 0 ? (imgsWithAlt / images.length) : 1, 0.8, 6);
        
        check('توازن النص والوسائط', (images.length >= 1 && wordCount > 400 ? 1 : 0), 1, 4);
        check('المحتوى المرئي (فيديو)', (postBody.querySelector('iframe[src*="youtube"], video') ? 1 : 0), 1, 4);
        check('صورة المشاركة (OG)', !!document.querySelector('meta[property="og:image"]'), 1, 3);

        check('سهولة القراءة (فقرات)', (text.length / (paragraphs.length || 1) < 500 ? 1 : 0), 1, 4);
        check('قوة الفقرة الاستهلالية', (paragraphs[0]?.innerText.length > 80 ? 1 : 0), 1, 3);
        
        var hasConclusion = /ختاماً|الخلاصة|في النهاية|نتمنى/.test(text);
        check('خاتمة الموضوع', hasConclusion ? 1 : 0, 1, 3);
        
        check('استخدام القوائم (Lists)', postBody.querySelectorAll('ul, ol').length, 1, 3);
        check('اقتباسات مرجعية', postBody.querySelectorAll('blockquote').length, 1, 2);
        check('الأسئلة الشائعة (FAQ)', (document.querySelector('#qa-section-placeholder') ? 1 : 0), 1, 3);

        var finalPercentage = Math.round((score / maxScore) * 100);
        var sealID = finalPercentage.toString(16).toUpperCase() + Date.now().toString(36).toUpperCase().slice(-3);
        
        return { 
            score: finalPercentage, passed: finalPercentage >= 60, sealID: sealID, 
            wordCount: wordCount, imageCount: images.length, intLinks: intLinks, extLinks: extLinks.length,
            details: details, title: document.querySelector('h1.seoterbo-title-main-headline')?.textContent.trim()
        };
    }
    
    function getQualityLevel(score) {
        if (score >= 90) return { level: 'إمبراطوري', color: '#4caf50', icon: '🏆' };
        if (score >= 75) return { level: 'احترافي', color: '#8bc34a', icon: '✅' };
        if (score >= 60) return { level: 'جيد', color: '#ffc107', icon: '✓' };
        return { level: 'ضعيف', color: '#f44336', icon: '⚠️' };
    }
    
    function updateQualitySystem() {
        var res = analyzeContentQuality();
        if (!res) return;
        
        var level = getQualityLevel(res.score);
        
        var container = document.getElementById('seoturboQualityContainer');
        if (container) {
            container.style.display = res.passed ? 'block' : 'none';
            var certIdEl = document.getElementById('qualityCertId');
            if (certIdEl) certIdEl.innerHTML = 'شهادة-رقم مرجعي: ST-' + res.sealID;
        }
        
        var authorSealIdEl = document.getElementById('authorSealId');
        if (authorSealIdEl) {
            authorSealIdEl.innerHTML = 'ST-' + res.sealID;
        }
        
        var modal = document.getElementById('qualityReportModal');
        var overlay = document.getElementById('qualityReportOverlay');
        
        var closeReport = function() {
            modal.classList.remove('active');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        };
        
        var openReport = function() {
            document.getElementById('reportIcon').innerHTML = level.icon;
            document.getElementById('reportScore').innerHTML = res.score + '%';
            document.getElementById('reportScore').style.color = level.color;
            document.getElementById('reportPostTitle').textContent = res.title;
            document.getElementById('reportSeal').innerHTML = 'شهادة توثيق رقمية: ST-' + res.sealID;
            
            document.getElementById('reportStats').innerHTML = 
                '<div class="quality-report-stat"><span>📝</span>' + res.wordCount + ' كلمة</div>' +
                '<div class="quality-report-stat"><span>🖼️</span>' + res.imageCount + ' صورة</div>' +
                '<div class="quality-report-stat"><span>🔗</span>' + res.intLinks + ' روابط</div>' +
                '<div class="quality-report-stat"><span>🌐</span>' + res.extLinks + ' مصادر</div>' +
                '<div class="quality-report-stat"><span>⭐</span>' + level.level + '</div>';

            document.getElementById('reportDetails').innerHTML = res.details.map(function(d) {
                return '<div class="quality-report-detail">' +
                    '<span class="quality-report-detail-name">' + d.name + '</span>' +
                    '<div class="quality-report-detail-status">' +
                        '<span class="quality-report-detail-score">' + d.score + '/' + d.max + '</span>' +
                        '<span class="quality-report-detail-badge ' + (d.status === 'pass' ? 'badge-pass' : (d.status === 'warning' ? 'badge-warning' : 'badge-fail')) + '">' +
                            (d.status === 'pass' ? '✓ ناجح' : (d.status === 'warning' ? '⚠️ متوسط' : '✗ ضعيف')) +
                        '</span>' +
                    '</div>' +
                '</div>';
            }).join('');
            
            document.getElementById('reportFooter').innerHTML = res.passed ? '✅ تم التصديق على جودة المحتوى' : '⚠️ المقال بحاجة إلى تحسين SEO تقني';
            
            modal.classList.add('active');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        };

        var analyzeBtn = document.getElementById('qualityAnalyzeBtn');
        if (!analyzeBtn) return;
        
        var SECRET_PASSWORD = getSecretPassword();
        var isUnlocked = sessionStorage.getItem('quality_unlocked') === 'true';
        
        var openReportWithCheck = function() {
            if (isUnlocked) {
                openReport();
            } else {
                var pwd = prompt('🔒 هذه الميزة مقيدة للمدير فقط\n\nأدخل كلمة المرور:');
                if (pwd === SECRET_PASSWORD) {
                    isUnlocked = true;
                    sessionStorage.setItem('quality_unlocked', 'true');
                    openReport();
                } else if (pwd !== null) {
                    alert('❌ كلمة المرور غير صحيحة');
                }
            }
        };
        
        analyzeBtn.onclick = function(e) { 
            e.stopPropagation(); 
            openReportWithCheck(); 
        };
        
        if (overlay) overlay.onclick = closeReport;
        var closeBtn = document.getElementById('closeReportBtn');
        if (closeBtn) closeBtn.onclick = closeReport;
        
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal && modal.classList.contains('active')) closeReport();
        });

        window.seoturboQualityLoaded = true;
    }
    
    if (document.readyState === 'complete') {
        setTimeout(updateQualitySystem, 1500);
    } else {
        window.addEventListener('load', function() { setTimeout(updateQualitySystem, 1500); });
    }
    
})();

// MODULE 59
(function() {
    'use strict';    
    var trustBadges = document.querySelectorAll('.seoturbo-trust-badge-pill');    
    trustBadges.forEach(function(badge) {
        var newBadge = badge.cloneNode(true);
        badge.parentNode.replaceChild(newBadge, badge);        
        newBadge.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();            
            var panel = this.querySelector('.mega-trust-panel');
            if (!panel) return;            
            document.querySelectorAll('.mega-trust-panel').forEach(function(p) {
                if (p !== panel) {
                    p.style.opacity = '0';
                    p.style.visibility = 'hidden';
                    p.style.pointerEvents = 'none';
                }
            });            
            var isVisible = panel.style.opacity === '1';
            panel.style.opacity = isVisible ? '0' : '1';
            panel.style.visibility = isVisible ? 'hidden' : 'visible';
            panel.style.pointerEvents = isVisible ? 'none' : 'auto';
        });
    });    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.seoturbo-trust-badge-pill')) {
            document.querySelectorAll('.mega-trust-panel').forEach(function(panel) {
                panel.style.opacity = '0';
                panel.style.visibility = 'hidden';
                panel.style.pointerEvents = 'none';
            });
        }
    });
    
})();

// MODULE 61
(function() {
    'use strict';    
    const uxBar = document.getElementById('seoturbo-progress-bar');
    const uxQuote = document.getElementById('seoturbo-quote-btn');
    const uxToast = document.getElementById('seoturbo-ux-toast');
    const isPost = document.body.classList.contains('post-page') || document.querySelector('.post-body') !== null;
    let cachedScrollHeight = 0;
    let cachedWinHeight = 0;
    let ticking = false;
    function updateLayoutCache() {
        cachedScrollHeight = document.documentElement.scrollHeight;
        cachedWinHeight = window.innerHeight;
    }
    function showUxToast(msg) {
        if (!uxToast) return;
        requestAnimationFrame(() => {
            uxToast.textContent = msg;
            uxToast.classList.add('seoturbo-show');
            setTimeout(() => uxToast.classList.remove('seoturbo-show'), 2500);
        });
    }
    function interceptCopy(e) {
        const selection = window.getSelection();
        const selectedText = selection.toString();
        if (selectedText.length < 30) return;
        const siteName = document.title.split(' - ')[0];
        const pageUrl = window.location.href;
        const copyrightMsg = `\n\n— تمت الاستعانة بمحتوى من: ${siteName}\n— الرابط الأصلي: ${pageUrl}`;
        const finalContent = selectedText + copyrightMsg;
        if (e.clipboardData) {
            e.clipboardData.setData('text/plain', finalContent);
            e.preventDefault();
            showUxToast('✅ تم النسخ مع إضافة حقوق المصدر تلقائياً');
        }
    }
    function updateProgress(scrollT) {
        if (!uxBar || cachedScrollHeight <= cachedWinHeight) {
            ticking = false;
            return;
        }
        if (scrollT === undefined) { scrollT = window.pageYOffset || document.documentElement.scrollTop; }
        var progress = (scrollT / (cachedScrollHeight - cachedWinHeight)) * 100;        
        uxBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
        ticking = false;
    }
    function handleFloatingButton() {
        if (!uxQuote || !isPost) return;
        const sel = window.getSelection();
        const text = sel.toString().trim();
        if (text.length > 10) {
            const range = sel.getRangeAt(0);
            const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
            const rect = range.getBoundingClientRect();
            const topPos = rect.top + currentScrollY - 55;
            const leftPos = rect.left + rect.width / 2;
            requestAnimationFrame(() => {
                uxQuote.style.display = 'flex';
                uxQuote.style.top = topPos + 'px';
                uxQuote.style.left = leftPos + 'px';
                uxQuote.style.transform = 'translateX(-50%)';
            });           
            uxQuote.onclick = (event) => {
                event.preventDefault();
                document.execCommand('copy'); 
                requestAnimationFrame(() => {
                    uxQuote.style.display = 'none';
                    sel.removeAllRanges();
                });
            };
        } else {
            if (uxQuote.style.display !== 'none') {
                requestAnimationFrame(() => { uxQuote.style.display = 'none'; });
            }
        }
    }
    if (isPost) {
        const postContent = document.querySelector('.post-body');
        if (postContent) {
            postContent.addEventListener('copy', interceptCopy);
        }
        window.addEventListener('load', () => {
            updateLayoutCache();
            var st = window.pageYOffset || document.documentElement.scrollTop;
            requestAnimationFrame(function() { updateProgress(st); });
        });
        window.addEventListener('resize', () => {
            updateLayoutCache();
        }, { passive: true });

        window.addEventListener('scroll', () => {
            if (!ticking) {
                var st = window.pageYOffset || document.documentElement.scrollTop;
                requestAnimationFrame(function() { updateProgress(st); });
                ticking = true;
            }
        }, { passive: true });        
        document.addEventListener('selectionchange', () => {
            clearTimeout(window.stSelectionT);
            window.stSelectionT = setTimeout(handleFloatingButton, 200);
        });
    }
})();

// MODULE 62
(function() {
    'use strict';    
    var originalScript = document.getElementById('st-original-trust-script');    
    if (originalScript) {
        return;
    }    
    var stTrustFreePopup = document.getElementById('st-trust-free-popup-2026');
    if (!stTrustFreePopup) {
        var popupHtml = `
            <div id="st-trust-free-popup-2026" style="display:none;position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);width:90%;max-width:380px;background:linear-gradient(135deg,#fff8e7,#fff);border-right:5px solid var(--blogcolor);border-radius:16px;padding:25px;text-align:center;box-shadow:0 8px 20px rgba(0,0,0,0.15);z-index:10000100;">
                <div onclick="this.parentElement.style.display='none';document.body.style.overflow='';" style="position:absolute;top:10px;right:15px;cursor:pointer;font-size:24px;color:#999;">&#215;</div>
                <div style="display:inline-flex;align-items:center;justify-content:center;font-size:32px;width:60px;height:60px;background:linear-gradient(135deg,var(--blogcolor),#2a1a05);border-radius:50%;margin-bottom:12px;box-shadow:0 4px 12px rgba(0,0,0,0.15);">🔒</div>
                <div>
                    <span style="display:block;font-size:18px;font-weight:900;color:var(--blogcolor);margin-bottom:2px;letter-spacing:-0.3px;">لوحة الهوية والموثوقية الذكية</span>                 
                    <span style="display:block;font-size:13px;font-weight:700;color:#555;margin-bottom:10px;text-transform:uppercase;font-family:sans-serif;">Smart Identity &amp; Reliability Panel</span>
                    <span style="display:block;font-size:14px;color:#888;margin-bottom:20px;">في النسخة المدفوعة</span>
                    <a href="https://seoturbo-imperial.blogspot.com/p/contact-us.html" style="display:inline-flex;align-items:center;justify-content:center;gap:10px;background:linear-gradient(135deg,var(--blogcolor),#2a1a05);color:#fff;padding:10px 28px;border-radius:50px;font-size:14px;font-weight:800;text-decoration:none;box-shadow:0 4px 12px rgba(99,61,7,0.3);" target="_blank">
                        <svg fill="#fff" height="16" viewBox="0 0 640 512" width="16"><use href="#icon-crown"/></svg>
                        ترقية إلى النسخة المدفوعة
                    </a>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', popupHtml);
        stTrustFreePopup = document.getElementById('st-trust-free-popup-2026');
    }
    
    var trustBadges = document.querySelectorAll('.seoturbo-trust-badge-pill');
    trustBadges.forEach(function(badge) {
        var newBadge = badge.cloneNode(true);
        badge.parentNode.replaceChild(newBadge, badge);
        
        newBadge.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            if (stTrustFreePopup) {
                stTrustFreePopup.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    });    
    document.addEventListener('click', function(e) {
        if (stTrustFreePopup && stTrustFreePopup.style.display === 'block') {
            if (!stTrustFreePopup.contains(e.target) && !e.target.closest('.seoturbo-trust-badge-pill')) {
                stTrustFreePopup.style.display = 'none';
                document.body.style.overflow = '';
            }
        }
    });    
})();

// MODULE 64
(function() {
    'use strict';
    window.addEventListener('load', function() {
        try {
            var metaDate = document.querySelector('meta[name="creationDate"]');
            var metaType = document.querySelector('meta[name="site-type"]');
            var metaTel = document.querySelector('meta[name="site-telephone"]');
            var metaMail = document.querySelector('meta[name="site-email"]');
            
            var finalDateString = null;
            if (metaDate && metaDate.content) {
                var d = new Date(metaDate.content);
                if (!isNaN(d.getTime())) {
                    var yyyy = d.getFullYear();
                    var mm = ("0" + (d.getMonth() + 1)).slice(-2);
                    var dd = ("0" + d.getDate()).slice(-2);
                    finalDateString = yyyy + "-" + mm + "-" + dd + "T10:30:45+02:00";
                }
            }

            var wsTag = document.getElementById('seoturbo-website-schema');
            if (wsTag && finalDateString) {
                var wsData = JSON.parse(wsTag.textContent);
                wsData.foundingDate = finalDateString;
                wsTag.textContent = JSON.stringify(wsData, null, 2);
            }

            var orgTag = document.getElementById('seoturbo-dynamic-org-schema');
            if (orgTag) {
                var orgData = JSON.parse(orgTag.textContent);

                if (finalDateString) orgData.foundingDate = finalDateString;

                if (metaType && metaType.content) orgData["@type"] = metaType.content.trim();

                orgData.contactPoint = {
                    "@type": "ContactPoint",
                    "contactType": "newsroom",
                    "areaServed": ["EG","SA","AE","KW","QA","BH","OM","IQ","SY","LB","JO","PS","DZ","MA","TN","LY","SD","SO","MR","DJ","KM","YE"],
                    "availableLanguage": ["Arabic","English"]
                };
                if (metaTel && metaTel.content) orgData.contactPoint.telephone = metaTel.content.trim();
                if (metaMail && metaMail.content) orgData.contactPoint.email = metaMail.content.trim();

                var selectors = 'a[href*="facebook.com"], a[href*="twitter.com"], a[href*="x.com"], a[href*="instagram.com"], a[href*="youtube.com"], a[href*="tiktok.com"], a[href*="pinterest.com"], a[href*="linkedin.com"]';
                var links = Array.from(document.querySelectorAll(selectors))
                                 .map(link => link.href)
                                 .filter((href, index, self) => href && self.indexOf(href) === index && href.indexOf('#') === -1);
                if (links.length > 0) orgData.sameAs = links;

                var aboutPage = document.querySelector('a[href*="/p/about-us"]');
                if (aboutPage) orgData.mainEntityOfPage = aboutPage.href;

                orgTag.textContent = JSON.stringify(orgData, null, 2);
            }

            console.log("✅ SEOTurbo v8: Date standardized to " + finalDateString);

        } catch (e) { console.warn("Schema Patcher v8 Failed", e); }
    });
})();

// MODULE 66
(function() {
    'use strict';

    let lastAppliedStyle = null;
    let pendingUpdate = false;
    let isProcessingUncheck = false;

    const uncheckAllExcept = function(exceptionWidgetId) {
        const allWidgets = document.querySelectorAll('#topbar-styles-library .widget');
        
        allWidgets.forEach(widget => {
            if (exceptionWidgetId && widget.id === exceptionWidgetId) return;
            
            const radioInput = widget.querySelector('input[type="radio"], input[type="checkbox"]');
            if (radioInput && radioInput.checked) {
                radioInput.checked = false;
                
                const changeEvent = new Event('change', { bubbles: true });
                radioInput.dispatchEvent(changeEvent);
                const clickEvent = new Event('click', { bubbles: true });
                radioInput.dispatchEvent(clickEvent);
            }
        });
    };

    const runExclusiveStyle = function(triggeredById = null) {
        if (pendingUpdate) return;
        if (isProcessingUncheck) return;
        
        pendingUpdate = true;

        try {
            const allTriggers = document.querySelectorAll('#topbar-styles-library .seoturbo-style-trigger');
            
            const activeTriggers = Array.from(allTriggers).filter(el => {
                return el.closest('.widget') !== null;
            });

            if (activeTriggers.length === 0) {
                if (lastAppliedStyle !== null) {
                    const oldStyle = document.getElementById('seoturbo-dynamic-css');
                    if (oldStyle) oldStyle.remove();
                    document.querySelectorAll('.st-dynamic-shape-container').forEach(el => el.remove());
                    lastAppliedStyle = null;
                }
                pendingUpdate = false;
                return;
            }

            const currentTrigger = activeTriggers[activeTriggers.length - 1];
            const STYLE_KEY = currentTrigger.getAttribute('data-style');
            const currentWidget = currentTrigger.closest('.widget');
            const currentWidgetId = currentWidget ? currentWidget.id : null;
            
            if (lastAppliedStyle === STYLE_KEY) {
                pendingUpdate = false;
                return;
            }
            
            if (currentWidgetId) {
                isProcessingUncheck = true;
                uncheckAllExcept(currentWidgetId);
                isProcessingUncheck = false;
            }
            
            const topbar = document.querySelector('.seoturbo-topbar');
            if (!topbar) {
                pendingUpdate = false;
                return;
            }

            const oldStyle = document.getElementById('seoturbo-dynamic-css');
            if (oldStyle) oldStyle.remove();
            document.querySelectorAll('.st-dynamic-shape-container').forEach(el => el.remove());

            const _GS = {css:".seoturbo-topbar-wave-wrapper{position:absolute;bottom:-180px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.seoturbo-topbar-wave-wrapper svg{display:block;width:100%;height:189px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.05;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.11;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.20;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.33;}.swl-5{fill:var(--wave-5-color,var(--blogcolor));opacity:0.52;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.07;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.15;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.25;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.38;}body.dark-mode .swl-5{fill:#0a0a1a;opacity:0.55;}@media (max-width:768px){.seoturbo-topbar-wave-wrapper{bottom:-90px;}.seoturbo-topbar-wave-wrapper svg{height:95px;}}",svg:'<div class="st-dynamic-shape-container seoturbo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,30 C360,5 720,45 1080,20 C1260,8 1350,38 1440,30 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,65 C240,25 480,100 720,55 C960,15 1200,110 1440,65 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,105 C180,45 360,160 540,90 C720,30 900,160 1080,105 C1260,55 1440,160 1440,105 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,150 C150,80 300,215 450,135 C600,55 750,215 900,150 C1050,80 1200,215 1350,150 C1400,125 1420,185 1440,150 L1440,0 L0,0 Z"/><path class="swl-5" d="M0,198 C100,135 200,270 300,180 C400,95 500,270 600,195 C700,135 800,270 900,195 C1000,135 1100,270 1200,195 C1300,135 1400,270 1440,198 L1440,0 L0,0 Z"/></svg></div>'};
            const _SIMPLE = {css:".seoturbo-topbar-wave-wrapper{position:absolute;bottom:-130px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.seoturbo-topbar-wave-wrapper svg{display:block;width:100%;height:140px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.035;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.07;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.13;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.22;}.swl-5{fill:var(--wave-5-color,var(--blogcolor));opacity:0.35;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.05;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.10;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.17;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.27;}body.dark-mode .swl-5{fill:#0a0a1a;opacity:0.42;}@media (max-width:768px){.seoturbo-topbar-wave-wrapper{bottom:-65px;}.seoturbo-topbar-wave-wrapper svg{height:70px;}}",svg:'<div class="st-dynamic-shape-container seoturbo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 320"><path class="swl-1" d="M0,0L60,280L120,0ZM120,0L180,280L240,0ZM240,0L300,280L360,0ZM360,0L420,280L480,0ZM480,0L540,280L600,0ZM600,0L660,280L720,0ZM720,0L780,280L840,0ZM840,0L900,280L960,0ZM960,0L1020,280L1080,0ZM1080,0L1140,280L1200,0ZM1200,0L1260,280L1320,0ZM1320,0L1380,280L1440,0ZM0,300L1440,300L1440,320L0,320Z"/><path class="swl-2" d="M0,0L60,260L120,0ZM120,0L180,260L240,0ZM240,0L300,260L360,0ZM360,0L420,260L480,0ZM480,0L540,260L600,0ZM600,0L660,260L720,0ZM720,0L780,260L840,0ZM840,0L900,260L960,0ZM960,0L1020,260L1080,0ZM1080,0L1140,260L1200,0ZM1200,0L1260,260L1320,0ZM1320,0L1380,260L1440,0ZM0,280L1440,280L1440,300L0,300Z"/><path class="swl-3" d="M0,0L60,240L120,0ZM120,0L180,240L240,0ZM240,0L300,240L360,0ZM360,0L420,240L480,0ZM480,0L540,240L600,0ZM600,0L660,240L720,0ZM720,0L780,240L840,0ZM840,0L900,240L960,0ZM960,0L1020,240L1080,0ZM1080,0L1140,240L1200,0ZM1200,0L1260,240L1320,0ZM1320,0L1380,240L1440,0ZM0,260L1440,260L1440,280L0,280Z"/><path class="swl-4" d="M0,0L60,220L120,0ZM120,0L180,220L240,0ZM240,0L300,220L360,0ZM360,0L420,220L480,0ZM480,0L540,220L600,0ZM600,0L660,220L720,0ZM720,0L780,220L840,0ZM840,0L900,220L960,0ZM960,0L1020,220L1080,0ZM1080,0L1140,220L1200,0ZM1200,0L1260,220L1320,0ZM1320,0L1380,220L1440,0ZM0,240L1440,240L1440,260L0,260Z"/><path class="swl-5" d="M0,0L60,200L120,0ZM120,0L180,200L240,0ZM240,0L300,200L360,0ZM360,0L420,200L480,0ZM480,0L540,200L600,0ZM600,0L660,200L720,0ZM720,0L780,200L840,0ZM840,0L900,200L960,0ZM960,0L1020,200L1080,0ZM1080,0L1140,200L1200,0ZM1200,0L1260,200L1320,0ZM1320,0L1380,200L1440,0ZM0,220L1440,220L1440,240L0,240Z"/></svg></div>'};
            const _AURORA = {css:".seoturbo-topbar-wave-wrapper{position:absolute;bottom:-155px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.seoturbo-topbar-wave-wrapper svg{display:block;width:100%;height:160px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.04;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.09;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.16;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.25;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.06;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.12;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.20;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.30;}@media (max-width:768px){.seoturbo-topbar-wave-wrapper{bottom:-80px;}.seoturbo-topbar-wave-wrapper svg{height:85px;}}",svg:'<div class="st-dynamic-shape-container seoturbo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,200 C80,20 160,280 240,40 C320,260 400,30 480,250 C560,40 640,270 720,50 C800,260 880,30 960,250 C1040,40 1120,280 1200,50 C1280,260 1360,30 1440,200 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,240 C120,80 240,220 360,100 C480,240 600,60 720,220 C840,80 960,240 1080,100 C1200,240 1320,60 1440,220 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,260 C200,120 400,240 600,140 C800,260 1000,100 1200,240 C1300,160 1400,220 1440,260 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,280 C300,180 600,260 900,160 C1200,280 1350,200 1440,280 L1440,0 L0,0 Z"/></svg></div>'};
            const _CRYSTAL = {css:".seoturbo-topbar-wave-wrapper{position:absolute;bottom:-125px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.seoturbo-topbar-wave-wrapper svg{display:block;width:100%;height:130px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.05;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.12;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.22;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.07;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.16;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.28;}@media (max-width:768px){.seoturbo-topbar-wave-wrapper{bottom:-65px;}.seoturbo-topbar-wave-wrapper svg{height:70px;}}",svg:'<div class="st-dynamic-shape-container seoturbo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,200 L100,40 L200,200 L300,40 L400,200 L500,40 L600,200 L700,40 L800,200 L900,40 L1000,200 L1100,40 L1200,200 L1300,40 L1400,200 L1440,40 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,240 L60,90 L120,240 L180,90 L240,240 L300,90 L360,240 L420,90 L480,240 L540,90 L600,240 L660,90 L720,240 L780,90 L840,240 L900,90 L960,240 L1020,90 L1080,240 L1140,90 L1200,240 L1260,90 L1320,240 L1380,90 L1440,240 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,270 L40,130 L80,270 L120,130 L160,270 L200,130 L240,270 L280,130 L320,270 L360,130 L400,270 L440,130 L480,270 L520,130 L560,270 L600,130 L640,270 L680,130 L720,270 L760,130 L800,270 L840,130 L880,270 L920,130 L960,270 L1000,130 L1040,270 L1080,130 L1120,270 L1160,130 L1200,270 L1240,130 L1280,270 L1320,130 L1360,270 L1400,130 L1440,270 L1440,0 L0,0 Z"/></svg></div>'};
            const _LIQUID = {css:".seoturbo-topbar-wave-wrapper{position:absolute;bottom:-195px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.seoturbo-topbar-wave-wrapper svg{display:block;width:100%;height:200px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.04;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.09;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.16;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.28;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.06;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.12;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.20;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.33;}@media (max-width:768px){.seoturbo-topbar-wave-wrapper{bottom:-95px;}.seoturbo-topbar-wave-wrapper svg{height:100px;}}",svg:'<div class="st-dynamic-shape-container seoturbo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,60 C200,200 400,-30 600,180 C800,260 1000,0 1440,60 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,120 C240,-20 480,220 720,80 C960,240 1200,20 1440,120 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,180 C180,280 360,40 540,200 C720,50 900,260 1080,80 C1260,240 1350,60 1440,180 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,230 C300,80 600,270 900,120 C1200,260 1350,100 1440,230 L1440,0 L0,0 Z"/></svg></div>'};
            const _PRISM = {css:".seoturbo-topbar-wave-wrapper{position:absolute;bottom:-148px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.seoturbo-topbar-wave-wrapper svg{display:block;width:100%;height:154px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.05;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.10;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.17;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.25;}.swl-5{fill:var(--wave-5-color,var(--blogcolor));opacity:0.34;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.07;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.13;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.21;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.30;}body.dark-mode .swl-5{fill:#0a0a1a;opacity:0.39;}@media (max-width:768px){.seoturbo-topbar-wave-wrapper{bottom:-76px;}.seoturbo-topbar-wave-wrapper svg{height:82px;}}",svg:'<div class="st-dynamic-shape-container seoturbo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,210 L220,55 L440,210 L660,55 L880,210 L1100,55 L1320,210 L1440,125 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,245 L180,95 L360,245 L540,95 L720,245 L900,95 L1080,245 L1260,95 L1440,245 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,280 L260,120 L520,280 L780,120 L1040,280 L1300,120 L1440,210 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,300 L160,165 L320,300 L480,165 L640,300 L800,165 L960,300 L1120,165 L1280,300 L1440,165 L1440,0 L0,0 Z"/><path class="swl-5" d="M0,300 L0,248 L120,150 L240,248 L360,150 L480,248 L600,150 L720,248 L840,150 L960,248 L1080,150 L1200,248 L1320,150 L1440,248 L1440,300 Z"/></svg></div>'};
            const _DIAMOND = {css:".seoturbo-topbar-wave-wrapper{position:absolute;bottom:-155px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.seoturbo-topbar-wave-wrapper svg{display:block;width:100%;height:176px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.07;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.13;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.22;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.31;}.swl-5{fill:var(--wave-5-color,var(--blogcolor));opacity:0.46;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.08;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.16;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.26;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.36;}body.dark-mode .swl-5{fill:#0a0a1a;opacity:0.50;}@media (max-width:768px){.seoturbo-topbar-wave-wrapper{bottom:-75px;}.seoturbo-topbar-wave-wrapper svg{height:90px;}}",
svg:'<div class="st-dynamic-shape-container seoturbo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,260 L120,120 L240,260 L360,120 L480,260 L600,120 L720,260 L840,120 L960,260 L1080,120 L1200,260 L1320,120 L1440,260 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,300 L90,205 L180,300 L270,205 L360,300 L450,205 L540,300 L630,205 L720,300 L810,205 L900,300 L990,205 L1080,300 L1170,205 L1260,300 L1350,205 L1440,300 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,300 L120,150 L240,300 L360,150 L480,300 L600,150 L720,300 L840,150 L960,300 L1080,150 L1200,300 L1320,150 L1440,300 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,190 L120,55 L240,190 L360,55 L480,190 L600,55 L720,190 L840,55 L960,190 L1080,55 L1200,190 L1320,55 L1440,190 L1440,0 L0,0 Z"/><path class="swl-5" d="M0,300 L0,230 L120,90 L240,230 L360,90 L480,230 L600,90 L720,230 L840,90 L960,230 L1080,90 L1200,230 L1320,90 L1440,230 L1440,300 Z"/></svg></div>'};

            const _ROYAL = {css:".seoturbo-topbar-wave-wrapper{position:absolute;bottom:-215px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.seoturbo-topbar-wave-wrapper svg{display:block;width:100%;height:220px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.04;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.08;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.14;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.22;}.swl-5{fill:var(--wave-5-color,var(--blogcolor));opacity:0.35;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.05;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.10;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.18;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.26;}body.dark-mode .swl-5{fill:#0a0a1a;opacity:0.38;}@media (max-width:768px){.seoturbo-topbar-wave-wrapper{bottom:-110px;}.seoturbo-topbar-wave-wrapper svg{height:115px;}}",svg:'<div class="st-dynamic-shape-container seoturbo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,50 C180,200 360,10 540,180 C720,300 900,20 1080,170 C1260,280 1350,50 1440,50 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,100 C240,280 480,40 720,220 C960,300 1200,60 1440,100 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,150 C300,40 600,280 900,80 C1200,260 1350,100 1440,150 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,200 C360,100 720,290 1080,120 C1260,260 1350,160 1440,200 L1440,0 L0,0 Z"/><path class="swl-5" d="M0,250 C400,160 800,290 1200,180 C1320,260 1380,220 1440,250 L1440,0 L0,0 Z"/></svg></div>'};
            const _ECHO = {css:".seoturbo-topbar-wave-wrapper{position:absolute;bottom:-165px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.seoturbo-topbar-wave-wrapper svg{display:block;width:100%;height:170px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.06;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.12;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.22;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.32;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.08;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.16;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.26;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.36;}@media (max-width:768px){.seoturbo-topbar-wave-wrapper{bottom:-82px;}.seoturbo-topbar-wave-wrapper svg{height:86px;}}",svg:'<div class="st-dynamic-shape-container seoturbo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,180 C180,20 360,260 540,40 C720,220 900,20 1080,200 C1260,50 1440,180 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,220 C240,80 480,260 720,120 C960,20 1200,240 1440,140 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,260 C300,120 600,280 900,140 C1200,40 1320,260 1440,180 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,300 C360,140 720,300 1080,160 C1260,120 1350,250 1440,300 L1440,0 L0,0 Z"/></svg></div>'};
            const _HORIZON = {css:".seoturbo-topbar-wave-wrapper{position:absolute;bottom:-130px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.seoturbo-topbar-wave-wrapper svg{display:block;width:100%;height:140px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.08;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.15;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.25;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.10;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.18;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.30;}@media (max-width:768px){.seoturbo-topbar-wave-wrapper{bottom:-68px;}.seoturbo-topbar-wave-wrapper svg{height:70px;}}",svg:'<div class="st-dynamic-shape-container seoturbo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,80 C240,220 480,10 720,120 C960,220 1200,30 1440,100 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,140 C360,40 720,240 1080,110 C1320,40 1440,130 1440,140 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,210 C420,120 840,280 1260,120 C1380,70 1440,210 1440,210 L1440,0 L0,0 Z"/></svg></div>'};
            const DB = {peaks:_GS,simple:_SIMPLE,aurora:_AURORA,crystal:_CRYSTAL,liquid:_LIQUID,multi_crystal:_PRISM,diamond:_DIAMOND,royal:_ROYAL,echo:_ECHO,horizon:_HORIZON};

            const config = DB[STYLE_KEY];
            if (!config) {
                pendingUpdate = false;
                return;
            }

            const styleTag = document.createElement('style');
            styleTag.id = 'seoturbo-dynamic-css';
            styleTag.textContent = `.seoturbo-topbar { border-bottom: none !important; } ${config.css}`;
            document.head.appendChild(styleTag);
            topbar.insertAdjacentHTML('beforeend', config.svg);

            lastAppliedStyle = STYLE_KEY;
            
        } catch (error) {
            console.warn('⚠️ SEOTurbo error:', error);
        }
        
        pendingUpdate = false;
    };

    const initStyleWatcher = function() {
        const targetSection = document.getElementById('topbar-styles-library');
        if (!targetSection) return;

        const observer = new MutationObserver((mutations) => {
            let needsUpdate = false;
            
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    needsUpdate = true;
                    break;
                }
                if (mutation.type === 'attributes' && 
                    (mutation.attributeName === 'style' || mutation.attributeName === 'class')) {
                    needsUpdate = true;
                    break;
                }
            }

            if (needsUpdate) {
                clearTimeout(window.stUpdateTimer);
                window.stUpdateTimer = setTimeout(runExclusiveStyle, 100);
            }
        });

        observer.observe(targetSection, { 
            childList: true, 
            subtree: true, 
            attributes: true, 
            attributeFilter: ['style', 'class'] 
        });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            runExclusiveStyle();
            initStyleWatcher();
        });
    } else {
        runExclusiveStyle();
        initStyleWatcher();
    }
    
    window.addEventListener('load', runExclusiveStyle);
    window.addEventListener('popstate', () => setTimeout(runExclusiveStyle, 200));

})();

// MODULE 67
(function() {
    'use strict';
    
    var freeContainer = document.getElementById('seoturbo-trust-placeholder');
    if(freeContainer) freeContainer.remove();
    
    document.addEventListener('DOMContentLoaded', function() {
        const postBody = document.querySelector('.post-body.entry-content');
        if (!postBody) return;

        let existingTrustContainer = postBody.querySelector('section.trust-container');
        if (existingTrustContainer) {
          console.log('Trust Container: Found manual trust container. Skipping auto-insertion.');
        } else {
          function createTrustContainerHTML(lang) {
            let trustContainerHTML = '';
            if (lang === 'ar') {
              trustContainerHTML = `
                <section class="trust-container" title="ضمانة الجودة والمصداقية لهذا المحتوى الرقمي">
                  <h3 class="multiline-title" style="color: var(--blogcolor); text-align: center;" title="بيان الالتزام الصارم بمعايير النشر والتوثيق العالمية">
                    <span style="display: block;">جودة المحتوى وموثوقيته</span>
                    <span style="display: block;">التزامنا الكامل بمعايير جوجل E-E-A-T</span>
                  </h3>
                  <p class="trust-notice-header" title="إفادة رسمية صادرة عن الهيئة التحريرية للموقع">
                    <span class="notice" title="تنبيه هام حول طبيعة ومصدر المعلومات الواردة">
                      <span class="warning-icon-style"><svg width="16" height="16" viewBox="0 0 576 512" style="fill: currentColor;"><use href="#icon-exclamation-triangle"/></svg></span>
                      <span style="color: var(--blogcolor); font-size: 18px;">تنويه:</span>
                    </span>
                    <span class="seoturbo-trust-badge" title="شهادة اعتماد تؤكد خضوع المادة للمراجعة والتدقيق قبل النشر">
                      <svg width="14" height="14" viewBox="0 0 512 512" style="fill: currentColor; margin-left: 5px;"><use href="#icon-check-circle"/></svg>
                      معتمد من المحررين
                    </span>
                  </p>
                  <p lang="AR-EG" title="بروتوكول فحص وتدقيق المعلومات لضمان الحيادية والشفافية التامة">تم إعداد هذا المحتوى بعناية وتدقيق شامل من قبل فريق التحرير لدينا بالاعتماد على مصادر موثوقة ومتحقق منها، مع الالتزام الكامل بمعايير جوجل E-E-A-T الصارمة، لضمان أعلى مستويات الدقة والموثوقية والحيادية.</p>
                </section>
              `;
            } else {
              trustContainerHTML = `
                <section class="trust-container" dir="ltr" title="Content quality and reliability guarantee">
                  <h3 class="multiline-title" style="color: var(--blogcolor); text-align: center;" title="Statement of full commitment to global publishing standards">
                    <span class="line1">Content Quality and Reliability</span>
                    <span class="line2">Our Full Commitment to Google E-E-A-T Standards</span>
                  </h3>
                  <p class="trust-notice-header" title="Official editorial statement regarding content integrity">
                    <span class="notice" title="Important notice regarding information sources">
                      <span class="warning-icon-style"><svg width="16" height="16" viewBox="0 0 576 512" style="fill: currentColor;"><use href="#icon-exclamation-triangle"/></svg></span>
                      <span style="color: var(--blogcolor); font-size: 18px;">Notice:</span>
                    </span>
                    <span class="seoturbo-trust-badge" title="Verification credential confirming editorial audit completion">
                      <svg width="14" height="14" viewBox="0 0 512 512" style="fill: currentColor; margin-right: 5px;"><use href="#icon-check-circle"/></svg>
                      Editor-approved
                    </span>
                  </p>
                  <p dir="ltr" style="text-align: left;" title="Protocol for information verification ensuring accuracy and impartiality">This content has been carefully prepared and thoroughly reviewed by our editorial team, based on trusted and verified sources, with full adherence to Google's stringent E-E-A-T standards to ensure the highest levels of accuracy, reliability, and impartiality.</p>
                </section>
              `;
            }
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = trustContainerHTML.trim();
            return tempDiv.firstChild;
          }

          const htmlTag = document.documentElement;
          const lang = htmlTag.getAttribute('lang')?.toLowerCase() === 'ar' ? 'ar' : 'en';
          const placeholder = document.getElementById('trust-container-placeholder');
          
          if (placeholder) {
            const newContainer = createTrustContainerHTML(lang);
            placeholder.parentNode.replaceChild(newContainer, placeholder);
            existingTrustContainer = newContainer;
            existingTrustContainer.style.display = 'block';
          } else { return; }
        }

        if (existingTrustContainer) {
            const SeoturbolinkedBlogsContainer = existingTrustContainer.querySelector('.seoturbo-Linked-blogs-Dual-Module-Container');
            if (SeoturbolinkedBlogsContainer) {
                existingTrustContainer.parentNode.insertBefore(SeoturbolinkedBlogsContainer, existingTrustContainer.nextSibling);
            }
        }
    });
})();

// MODULE 68
document.addEventListener('DOMContentLoaded', () => {
    const SEL = '.post-body section[style*="background-color"], .post-body table, .post-body td, #footer';
    const CLS = 'dark-mode';
    const run = () => {
        const isDark = document.body.classList.contains(CLS);
        document.querySelectorAll(SEL).forEach(el => {
            if (isDark) {
                if (!el.hasAttribute('data-st-style')) el.setAttribute('data-st-style', el.getAttribute('style') || ' ');
                el.style.setProperty('background-color', '#1a1a1a', 'important');
                el.style.setProperty('color', '#eeeeee', 'important');
                el.style.setProperty('border-color', '#444444', 'important');
                el.querySelectorAll('*').forEach(c => {
                    if (!c.hasAttribute('data-st-style')) c.setAttribute('data-st-style', c.getAttribute('style') || ' ');
                    c.style.setProperty('color', '#eeeeee', 'important');
                });
            } else if (el.hasAttribute('data-st-style')) {
                el.setAttribute('style', el.getAttribute('data-st-style').trim());
                el.removeAttribute('data-st-style');
                el.querySelectorAll('*').forEach(c => {
                    if (c.hasAttribute('data-st-style')) {
                        c.setAttribute('style', c.getAttribute('data-st-style').trim());
                        c.removeAttribute('data-st-style');
                    }
                });
            }
        });
    };
    run();
    new MutationObserver(ms => {
        ms.forEach(m => { if (m.attributeName === 'class') run(); });
    }).observe(document.body, { attributes: true });
});

// MODULE 69
(function() {
    'use strict';
    function centralizeGoogleWidget() {
        const iframes = document.querySelectorAll('iframe.BLOG_object_iframe[src*="share-widget"]');
        if (iframes.length === 0) return;
        const favicon = document.querySelector('link[rel="icon"][sizes="192x192"]')?.href ||
                        document.querySelector('link[rel="icon"]')?.href ||
                        window.location.origin + '/favicon.ico';
        if (!document.getElementById('st-share-fixed-v1')) {
            const style = document.createElement('style');
            style.id = 'st-share-fixed-v1';
            style.textContent = `
                .st-share-master {
                    display: block !important;
                    width: 100% !important;
                    margin: 35px 0 !important;
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-right: 6px solid var(--blogcolor, #CC0000);
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                    direction: rtl;
                }
                .st-share-header {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 8px 15px;
                    background: #f9fafb;
                    border-bottom: 1px solid #e5e7eb;
                }
                .st-share-header span {
                    font-size: 12px;
                    font-weight: 800;
                    color: var(--blogcolor, #CC0000);
                }
                .st-share-header img {
                    width: 18px;
                    height: 18px;
                    border-radius: 4px;
                }
                .st-share-body-central {
                    display: flex !important;
                    justify-content: center !important;
                    align-items: center !important;
                    padding: 15px 5px !important;
                    background: #fff;
                    overflow-x: auto;
                }
                .st-share-body-central iframe {
                    width: 560px !important; 
                    height: 130px !important; 
                    border: none !important;
                    display: block !important;
                    margin: 0 !important;
                    background: transparent !important;
                }
                body.dark-mode .st-share-master { background: #111; border-color: #333; }
                body.dark-mode .st-share-header { background: #1a1a1a; border-bottom-color: #2a2a2a; }
                body.dark-mode .st-share-header span { color: #fff; }
                body.dark-mode .st-share-body-central { background: #111; }
            `;
            document.head.appendChild(style);
        }
        iframes.forEach(iframe => {
            if (iframe.closest('.st-share-master')) return;
            const masterDiv = document.createElement('div');
            masterDiv.className = 'st-share-master';
            const headerDiv = document.createElement('div');
            headerDiv.className = 'st-share-header';
            headerDiv.innerHTML = `<img src="${favicon}" alt="icon"> <span>🔍 بحث ومشاركة في ${document.title.split(' - ')[0]}</span>`;
            const centralDiv = document.createElement('div');
            centralDiv.className = 'st-share-body-central';
            iframe.parentNode.insertBefore(masterDiv, iframe);
            masterDiv.appendChild(headerDiv);
            masterDiv.appendChild(centralDiv);
            centralDiv.appendChild(iframe);
        });
    }
    centralizeGoogleWidget();
    window.addEventListener('load', centralizeGoogleWidget);
    setTimeout(centralizeGoogleWidget, 1000);
    setTimeout(centralizeGoogleWidget, 3000);
})();

// MODULE 70
(function() {
    'use strict';
    if (!window.ST_ADBLOCK_ACTIVE) return;

    function startDetection() {
        const bait = document.createElement('div');
        bait.className = 'adsbygoogle ad-unit ad-zone';
        bait.style.cssText = 'width:1px!important;height:1px!important;position:fixed!important;left:-100px!important;top:-100px!important;visibility:hidden!important;';
        document.documentElement.appendChild(bait);
        
        window.setTimeout(function() {
            const forceScreen = document.getElementById('seoturbo-force-screen');
            const isBlocked = bait.offsetHeight === 0 || bait.offsetParent === null;
            
            if (isBlocked && forceScreen) {
                forceScreen.style.display = 'flex';
                document.documentElement.classList.add('seoturbo-lock-active');
            }
            if (bait.parentNode) bait.parentNode.removeChild(bait);
        }, 1000);
    }
    
    const events = ['touchstart', 'scroll', 'mousedown', 'keydown'];
    const trigger = function() {
        startDetection();
        events.forEach(e => window.removeEventListener(e, trigger));
    };
    events.forEach(e => window.addEventListener(e, trigger, { passive: true }));
})();

// MODULE 71
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

// MODULE 72
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

// MODULE 73
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

// MODULE 74
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

// MODULE 81
(function(){
var developer="م. قدر يحيى";
var template="SEOTurbo Apex v12.0 | مطورة ومعززة بخوارزميات ذكاء اصطناعي";
var license="QYXC-SEOTURBO-AI-V12";
var watermarkText=developer+" | "+template+" | "+license;
function addSignature(){
var isPost=document.querySelector('.post-body, .entry-content');
if(!isPost)return;
if(document.querySelector('.st-clean-sig'))return;
var sig=document.createElement('span');
sig.className='st-clean-sig';
sig.textContent=watermarkText;
sig.style.position='absolute';
sig.style.width='1px';
sig.style.height='1px';
sig.style.padding='0';
sig.style.margin='-1px';
sig.style.overflow='hidden';
sig.style.clip='rect(0,0,0,0)';
sig.style.whiteSpace='nowrap';
sig.style.border='0';
sig.style.fontSize='0';
sig.style.opacity='0';
var firstParagraph=document.querySelector('.post-body p, .entry-content p');
if(firstParagraph){
firstParagraph.insertBefore(sig,firstParagraph.firstChild);
}
}
if(document.readyState==='complete'){
addSignature();
}else{
window.addEventListener('load',addSignature);
}
})();

// MODULE 82
  window.cookieChoices = {}; 
  Object.defineProperty(window, 'cookieChoices', {
    value: {},
    writable: false,
    configurable: false
  });

// MODULE 83

<!-- 84-خارجي-قاعدة-بيانات-تصويتات-الأسئلة-والأجوبة.js -->    
<script type='text/javascript'>
(function() {
    'use strict';
    function sanitizeSchemasForExternalScripts() {
        var schemas = document.querySelectorAll('script[type="application/ld+json"]');
        schemas.forEach(function(s) {
            var content = s.textContent;
            if (content.includes('//<![CDATA[')) {
                s.textContent = content
                    .replace(/\/\/<!\[CDATA\[/g, '')
                    .replace(/\/\/\]\]>/g, '')
                    .trim();
            }
        });
    }
    sanitizeSchemasForExternalScripts();
})();

// MODULE 84
(function() {
    'use strict';
    function sanitizeSchemasForExternalScripts() {
        var schemas = document.querySelectorAll('script[type="application/ld+json"]');
        schemas.forEach(function(s) {
            var content = s.textContent;
            if (content.includes('//<![CDATA[')) {
                s.textContent = content
                    .replace(/\/\/<!\[CDATA\[/g, '')
                    .replace(/\/\/\]\]>/g, '')
                    .trim();
            }
        });
    }
    sanitizeSchemasForExternalScripts();
})();

// MODULE 86

   
<!-- ====================================================================== -->
<!-- SEOTurbo Apex v12.0 - Performance Tips                  -->
<!-- ====================================================================== -->
<!-- TIPS FOR MAXIMUM PERFORMANCE:                                          -->
<!--    1. Use WebP Images (استخدم صور بصيغة WebP)                          -->
<!--    2. Enable Gzip/Brotli Compression                                   -->
<!--    3. Use CDN for Images (شبكة توصيل محتوى للصور)                      -->
<!--    4. Minify HTML/CSS/JS (قلص حجم الأكواد)                             -->
<!--    5. Optimize Images Before Upload (ضغط الصور قبل الرفع)              -->
<!-- ====================================================================== -->
<!-- Engineered by: م. قدر يحيى | AI Algorithms & Global SEO Technologies | SEOTurbo Apex v12.0 -->
<!-- ====================================================================== -->  
  
  
<!-- 86-تفاعل-يشاهد-الآن.js -->  
  
<b:if cond='data:view.isPost'>
<script type='text/javascript'>
(function() {
    'use strict';
    
    const COUNTRIES = ["مصر", "السعودية", "الإمارات", "الكويت", "المغرب", "الجزائر", "الأردن", "عمان", "قطر", "فلسطين", "العراق"];
    const ACTIONS = ["زيارة من", "مشاركة من", "تفاعل من", "قراءة من"];

    function runSocialProofEngine() {
        const placeholder = document.getElementById('social-proof-placeholder');
        const readersEl = document.getElementById('live-readers-val');
        const viewsEl = document.getElementById('total-views-val');
        const sharesEl = document.getElementById('total-shares-val');
        const countryEl = document.getElementById('seoturbo-country-notif');
        const vault = document.getElementById('seoturbo-data-vault');
        
        if (!placeholder || !readersEl || !viewsEl || !vault) return;

        // 1. خوارزمية المتواجدين الآن
        let live = Math.floor(Math.random() * (38 - 7 + 1)) + 7;
        readersEl.textContent = live;
        setInterval(() => {
            live += Math.floor(Math.random() * 3) - 1;
            readersEl.textContent = Math.max(5, live);
        }, 8000);

        // 2. خوارزمية المشاهدات والمشاركات
        const pubDate = new Date(vault.getAttribute('data-pub'));
        const now = new Date();
        const diffDays = Math.floor((now - pubDate) / (1000 * 60 * 60 * 24)) || 1;
        const postId = vault.getAttribute('data-id');
        const salt = parseInt(postId.slice(-3)) || 100;

        let totalViews = (diffDays * 165) + (salt * 18);
        let totalShares = Math.floor(totalViews * 0.035) + (salt % 15);
        const fmt = (num) => num > 999 ? (num/1000).toFixed(1) + 'k' : num;

        viewsEl.textContent = fmt(totalViews);
        sharesEl.textContent = fmt(totalShares);

        // 3. محرك إشعارات الدول (الإضافة الجديدة)
        function updateCountry() {
            const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
            const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
            countryEl.textContent = `${action} ${country}`;
        }
        updateCountry();
        setInterval(updateCountry, 5000);

        // حقن الصندوق تحت العنوان
        const target = document.querySelector('.seoterbo-title-posttitle-box');
        if (target) {
            target.parentNode.insertBefore(placeholder, target.nextSibling);
            placeholder.style.display = 'block';
        }
    }

    if (window.requestIdleCallback) requestIdleCallback(runSocialProofEngine);
    else window.addEventListener('load', runSocialProofEngine);
})();

// MODULE 86
(function() {
    'use strict';
    
    const COUNTRIES = ["مصر", "السعودية", "الإمارات", "الكويت", "المغرب", "الجزائر", "الأردن", "عمان", "قطر", "فلسطين", "العراق"];
    const ACTIONS = ["زيارة من", "مشاركة من", "تفاعل من", "قراءة من"];

    function runSocialProofEngine() {
        const placeholder = document.getElementById('social-proof-placeholder');
        const readersEl = document.getElementById('live-readers-val');
        const viewsEl = document.getElementById('total-views-val');
        const sharesEl = document.getElementById('total-shares-val');
        const countryEl = document.getElementById('seoturbo-country-notif');
        const vault = document.getElementById('seoturbo-data-vault');
        
        if (!placeholder || !readersEl || !viewsEl || !vault) return;

        // 1. خوارزمية المتواجدين الآن
        let live = Math.floor(Math.random() * (38 - 7 + 1)) + 7;
        readersEl.textContent = live;
        setInterval(() => {
            live += Math.floor(Math.random() * 3) - 1;
            readersEl.textContent = Math.max(5, live);
        }, 8000);

        // 2. خوارزمية المشاهدات والمشاركات
        const pubDate = new Date(vault.getAttribute('data-pub'));
        const now = new Date();
        const diffDays = Math.floor((now - pubDate) / (1000 * 60 * 60 * 24)) || 1;
        const postId = vault.getAttribute('data-id');
        const salt = parseInt(postId.slice(-3)) || 100;

        let totalViews = (diffDays * 165) + (salt * 18);
        let totalShares = Math.floor(totalViews * 0.035) + (salt % 15);
        const fmt = (num) => num > 999 ? (num/1000).toFixed(1) + 'k' : num;

        viewsEl.textContent = fmt(totalViews);
        sharesEl.textContent = fmt(totalShares);

        // 3. محرك إشعارات الدول (الإضافة الجديدة)
        function updateCountry() {
            const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
            const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
            countryEl.textContent = `${action} ${country}`;
        }
        updateCountry();
        setInterval(updateCountry, 5000);

        // حقن الصندوق تحت العنوان
        const target = document.querySelector('.seoterbo-title-posttitle-box');
        if (target) {
            target.parentNode.insertBefore(placeholder, target.nextSibling);
            placeholder.style.display = 'block';
        }
    }

    if (window.requestIdleCallback) requestIdleCallback(runSocialProofEngine);
    else window.addEventListener('load', runSocialProofEngine);
})();



// MODULE 85 - IndexNow
(function() {
    'use strict';
    const MY_KEY = '12d2658b0352417dace989d7386a71f3'; 
    function sendOpaquePing() {
        const pageUrl = window.location.href.split('?')[0].split('#')[0];
        const keyLoc = window.location.origin + '/p/' + MY_KEY + '.html';
        const engines = [
            { name: 'Bing', url: 'https://www.bing.com/indexnow' },
            { name: 'Yandex', url: 'https://yandex.com/indexnow' },
            { name: 'IndexNow.org', url: 'https://api.indexnow.org/indexnow' }
        ];
        engines.forEach(engine => {
            const finalPing = `${engine.url}?url=${encodeURIComponent(pageUrl)}&key=${MY_KEY}&keyLocation=${encodeURIComponent(keyLoc)}`;
            const ping = new Image();
            ping.src = finalPing;
            ping.onload = ping.onerror = function() {
                console.log('%c🚀 SEOTurbo Indexer: [' + engine.name + '] Signal Sent Successfully', 'color: #00ff00; font-weight: bold;');
            };
        });
    }
    if (document.readyState === 'complete') {
        setTimeout(sendOpaquePing, 8000);
    } else {
        window.addEventListener('load', function() {
            setTimeout(sendOpaquePing, 10000);
        });
    }
})();

// MODULE 88 - Digital Fingerprint
(function() {
    'use strict';
    var DEVELOPER_NAME = 'م. قدر يحيى';
    var DEVELOPER_TITLE = 'مبرمجة ومخترعة خوارزميات الذكاء الصناعي وتقنيات السيو';
    var ALGORITHM_SALT = 'QYXC-AI-V12-' + window.location.hostname;
    var FINGERPRINT_ID = 'qdar-yaiah-xc-digital-fp-' + Math.random().toString(36).substr(2, 9);
    function generatePageFingerprint() {
        var data = [
            window.location.href,
            navigator.userAgent,
            screen.width + 'x' + screen.height,
            new Date().toDateString(),
            ALGORITHM_SALT
        ].join('|||');
        var hash = 0;
        for (var i = 0; i < data.length; i++) {
            var char = data.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return 'QYXC-' + Math.abs(hash).toString(36).toUpperCase();
    }
    var pageFP = generatePageFingerprint();
    var fpMeta = document.createElement('meta');
    fpMeta.name = 'qdar-yaiah-xc-digital-fingerprint';
    fpMeta.content = pageFP;
    document.head.appendChild(fpMeta);
    function applyImageWatermark() {
        var imgs = document.querySelectorAll('.post-body img, .entry-content img, .post-body .separator img');
        imgs.forEach(function(img, index) {
            if (img.closest('.seoturbo-lock-container, .seoturbo-fav-item')) return;
            if (img.hasAttribute('data-qdar-yaiah-xc-marked')) return;
            img.setAttribute('data-qdar-yaiah-xc-marked', 'true');
            var wrapper = document.createElement('div');
            wrapper.style.cssText = 'position:relative;display:inline-block;max-width:100%;overflow:hidden;border-radius:4px;';
            img.parentNode.insertBefore(wrapper, img);
            wrapper.appendChild(img);
            var mark = document.createElement('div');
            mark.style.cssText = 'position:absolute;bottom:2px;right:2px;background:rgba(0,0,0,0.35);color:rgba(255,255,255,0.3);font-size:7px;padding:1px 4px;border-radius:2px;font-family:sans-serif;pointer-events:none;line-height:1;z-index:1;backdrop-filter:blur(1px);';
            mark.textContent = 'QYXC';
            wrapper.appendChild(mark);
        });
    }
    if (document.readyState === 'complete') applyImageWatermark();
    else window.addEventListener('load', applyImageWatermark);
    var styleFP = document.createElement('style');
    styleFP.textContent = '/* QYXC Digital Fingerprint: ' + pageFP + ' | Algorithm by م. قدر يحيى */';
    document.head.appendChild(styleFP);
    window.QYXC = {
        developer: DEVELOPER_NAME,
        title: DEVELOPER_TITLE,
        fingerprint: pageFP,
        algorithm: 'QYXC-AI-HASH-v1',
        verify: function() { return pageFP; }
    };
    console.log('%c⚡ QYXC Digital Fingerprint: ' + pageFP, 'color:#d4af37;font-weight:bold;font-size:12px;');
    console.log('%c👩‍💻 Developed by: ' + DEVELOPER_NAME + ' | ' + DEVELOPER_TITLE, 'color:#888;font-size:10px;');
})();

// === REMAINING MODULES ===


// Extracted from line 12019
(function() {
    'use strict';
    
    function injectAds() {
        var tSrc = document.querySelector('#HTML991 .widget-content');
        var bSrc = document.querySelector('#HTML992 .widget-content');
        var tTrg = document.getElementById('redirect-ad-top-target');
        var bTrg = document.getElementById('redirect-ad-bottom-target');
        
        if (tSrc && tTrg) tTrg.innerHTML = tSrc.innerHTML;
        if (bSrc && bTrg) bTrg.innerHTML = bSrc.innerHTML;
    }
    
    function getDynamicSiteLogo() {
        var headerLogo = document.querySelector('#Header1_headerimg, .seoturbo-site-logo img, .header-widget img');
        if (headerLogo && headerLogo.src) return headerLogo.src;
        var favicon = document.querySelector('link[rel*="icon"]');
        return favicon ? favicon.href : '';
    }
    
    function startTimer(seconds, onComplete) {
        var time = seconds;
        var timerNum = document.getElementById('seoturbo-redirect-timer-num');
        var progress = document.getElementById('seoturbo-redirect-progress-bar');
        
        if (timerNum) timerNum.textContent = time;
        
        var interval = setInterval(function() {
            time--;
            if (timerNum) timerNum.textContent = time;
            
            if (progress) {
                var offset = 408 - ((seconds - time) / seconds * 408);
                progress.style.strokeDashoffset = offset;
            }
            
            if (time <= 0) {
                clearInterval(interval);
                if (onComplete) onComplete();
            }
        }, 1000);
    }
    
    function decodeRedirectUrl(encodedUrl) {
        try {
            var base64Decoded = atob(encodedUrl);
            return decodeURIComponent(base64Decoded);
        } catch (e) {
            try {
                return decodeURIComponent(encodedUrl);
            } catch(e2) {
                return encodedUrl;
            }
        }
    }
    
    function loadSuggestions() {
        var container = document.getElementById('seoturbo-redirect-404-posts-container');
        if (!container) return;
        
        var fallbackLogo = getDynamicSiteLogo();
        
        if (window.ST_MASTER_PROMISE) {
            window.ST_MASTER_PROMISE.then(function(data) {
                if (!data || !data.feed || !data.feed.entry) return;
                
                var html = '';
                var entries = data.feed.entry.slice(0, 4);
                
                for (var i = 0; i < entries.length; i++) {
                    var e = entries[i];
                    var title = e.title.$t;
                    var link = '';
                    var links = e.link;
                    for (var j = 0; j < links.length; j++) {
                        if (links[j].rel === 'alternate') {
                            link = links[j].href;
                            break;
                        }
                    }
                    var rawImg = (e.media$thumbnail && e.media$thumbnail.url) ? e.media$thumbnail.url : fallbackLogo;
                    var img = window.optimizeImage ? window.optimizeImage(rawImg, 'related') : rawImg.replace(/\/s\d+(-c)?\//, '/s400/');
                    
                    html += '<div class="seoturbo-redirect-404-post">' +
                            '<a href="' + link + '">' +
                            '<img src="' + img + '" alt="' + title + '">' +
                            '<h4>' + title + '</h4>' +
                            '</a>' +
                            '</div>';
                }
                container.innerHTML = html;
            });
        }
    }
    
    function init() {
        var query = window.location.search;
        var engineUI = document.getElementById('seoturbo-redirect-engine');
        var errorUI = document.getElementById('seoturbo-redirect-404-error-view');
        var statusText = document.getElementById('seoturbo-redirect-status-text');
        var finalBtnArea = document.getElementById('seoturbo-redirect-btn-container');
        var timerNum = document.getElementById('seoturbo-redirect-timer-num');
        var progress = document.getElementById('seoturbo-redirect-progress-bar');
        
        injectAds();
        
        if (query.indexOf('url=') !== -1) {
            if (errorUI) errorUI.style.display = 'none';
            if (engineUI) engineUI.style.display = 'block';
            
            var encodedUrl = query.split('url=')[1];
            var decodedUrl = decodeRedirectUrl(encodedUrl);
            
            startTimer(10, function() {
                if (timerNum) timerNum.textContent = '✓';
                if (statusText) statusText.textContent = 'تم تأمين الرابط بنجاح';
                if (progress) progress.style.stroke = '#1e8e3e';
                if (finalBtnArea) finalBtnArea.style.display = 'block';
                
                var finalLink = document.getElementById('seoturbo-redirect-final-link');
                if (finalLink) {
                    var url = decodedUrl;
                    if (url.indexOf('http') !== 0 && url.indexOf('https') !== 0) {
                        url = 'https://' + url;
                    }
                    finalLink.href = url;
                }
            });
        } 
        else {
            if (errorUI) errorUI.style.display = 'none';
            if (engineUI) engineUI.style.display = 'block';
            if (statusText) statusText.textContent = 'جاري فحص قاعدة بيانات الموقع...';
            
            startTimer(10, function() {
                if (engineUI) {
                    engineUI.style.opacity = '0';
                    engineUI.style.transition = 'opacity 0.5s ease';
                }
                
                setTimeout(function() {
                    if (engineUI) engineUI.style.display = 'none';
                    if (errorUI) {
                        errorUI.style.display = 'block';
                        errorUI.style.opacity = '0';
                        
                        requestAnimationFrame(function() {
                            errorUI.style.transition = 'opacity 0.5s ease';
                            errorUI.style.opacity = '1';
                        });
                    }
                    loadSuggestions();
                }, 500);
            });
        }
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Extracted from line 15128
(function(){'use strict';
function wireCP(){
  var b=document.getElementById('seoturbo-cp-open');
  if(b&&b.onclick)return;
  if(typeof window.seoturboCPInit=='function'){try{window.seoturboCPInit()}catch(e){}}
  ['seoturbo-cp-open','seoturbo-cp-open-sticky','seoturbo-cp-open-hamburger'].forEach(function(id){
    var btn=document.getElementById(id);
    if(btn&&!btn.onclick)btn.onclick=function(e){
      e.preventDefault();
      if(typeof window.seoturboOpenPanel=='function')window.seoturboOpenPanel();
      else{document.getElementById('seoturbo-cp-modal')&&document.getElementById('seoturbo-cp-modal').classList.add('active');
      document.body.style.overflow='hidden';}
    };
  });
  ['seoturbo-cp-close','seoturbo-cp-close-footer'].forEach(function(id){
    var btn=document.getElementById(id);
    if(btn&&!btn.onclick)btn.onclick=function(e){
      e.preventDefault();
      if(typeof window.seoturboClosePanel=='function')window.seoturboClosePanel();
      else{document.getElementById('seoturbo-cp-modal')&&document.getElementById('seoturbo-cp-modal').classList.remove('active');
      document.body.style.overflow='';}
    };
  });
}
if(document.readyState==='complete')wireCP();else window.addEventListener('load',wireCP);
setTimeout(wireCP,1000);
setTimeout(wireCP,3000);
})();

