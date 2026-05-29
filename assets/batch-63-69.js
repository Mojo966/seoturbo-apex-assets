// SEOTurbo Apex — Batch: Modules 63-69
// ======================================================
// Module 63: QR Code Generator - ينشئ رمز QR للرابط
(function() {
    'use strict';    
    function initQRCode() {
        var siteUrl = window.location.origin;
        var megaQr = document.getElementById('mega-qr-code');
        if (megaQr && (!megaQr.src || megaQr.src === '' || megaQr.src === window.location.href)) {
            megaQr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=100x100&margin=10&data=' + encodeURIComponent(siteUrl);
        }
        var stickyQr = document.getElementById('sticky-qr-code');
        if (stickyQr && (!stickyQr.src || stickyQr.src === '' || stickyQr.src === window.location.href)) {
            stickyQr.src = 'https://api.qrserver.com/v1/create-qr-code/?size=80x80&margin=8&data=' + encodeURIComponent(siteUrl);
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initQRCode);
    } else {
        initQRCode();
    }
})();

// ======================================================
// Module 64: Schema Identity Updater - يحدث سكيما الهوية
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
        } catch (e) { console.warn("Schema Patcher v8 Failed", e); }
    });
})();

// ======================================================
// Module 65: Homepage Description - وصف رئيسي للصفحة الرئيسية
(function() {
  var source = document.getElementById('header-desc-source');
  var target = document.getElementById('dynamic-home-description');
  if (source && target) {
    var text = source.textContent.trim();
    if (text.length > 0) {
      target.setAttribute('content', text);
    }
  }
})();

// ======================================================
// Module 68: Dark Mode Tables/Boxes - الوضع المظلم للجداول
(function() {
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
})();

// ======================================================
// Module 69: Google Share Widget - أداة مشاركة جوجل
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
            style.textContent = '.st-share-master{display:block!important;width:100%!important;margin:35px 0!important;background:#fff;border:1px solid #e5e7eb;border-right:6px solid var(--blogcolor,#CC0000);border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);direction:rtl}.st-share-header{display:flex;align-items:center;gap:10px;padding:8px 15px;background:#f9fafb;border-bottom:1px solid #e5e7eb}.st-share-header span{font-size:12px;font-weight:800;color:var(--blogcolor,#CC0000)}.st-share-header img{width:18px;height:18px;border-radius:4px}.st-share-body-central{display:flex!important;padding:15px 5px!important;background:#fff;overflow-x:auto}.st-share-body-central iframe{width:560px!important;height:130px!important;border:none!important;display:block!important;margin:0!important;background:transparent!important}body.dark-mode .st-share-master{background:#111;border-color:#333}body.dark-mode .st-share-header{background:#1a1a1a;border-bottom-color:#2a2a2a}body.dark-mode .st-share-header span{color:#fff}body.dark-mode .st-share-body-central{background:#111}';
            document.head.appendChild(style);
        }
        iframes.forEach(iframe => {
            if (iframe.closest('.st-share-master')) return;
            const masterDiv = document.createElement('div');
            masterDiv.className = 'st-share-master';
            const headerDiv = document.createElement('div');
            headerDiv.className = 'st-share-header';
            headerDiv.innerHTML = '<img src="' + favicon + '" alt="icon"> <span>\ud83d\udd0d \u0628\u062d\u062b \u0648\u0645\u0634\u0627\u0631\u0643\u0629 \u0641\u064a ' + document.title.split(' - ')[0] + '</span>';
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
// ======================================================
// Module 70: Ad-Block Detection - فحص حجب الإعلانات
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