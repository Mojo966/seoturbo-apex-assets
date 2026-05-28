
// MODULE 5
window.ST_PRO_LOAD_MEGA = function(label, container) {
    if (container.hasAttribute('data-loaded') || container.hasAttribute('data-loading')) return;
    
    container.setAttribute('data-loading', 'true');
    container.innerHTML = '<div class="mega-loading"><svg width="14" height="14" viewBox="0 0 512 512" style="fill: currentColor;"><use href="#icon-spinner"/></svg></div>';
    
    var months = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    
    fetch('/feeds/posts/default/-/' + encodeURIComponent(label) + '?alt=json&max-results=3')
    .then(res => res.json())
    .then(data => {
        var entries = data.feed.entry || [];
        if (entries.length > 0) {
            var html = entries.map(e => {
                var t = e.title.$t, 
                    l = e.link.find(link => link.rel === 'alternate').href,
                    img = window.optimizeImage ? window.optimizeImage(e.media$thumbnail ? e.media$thumbnail.url : '', 'mega') : (e.media$thumbnail ? e.media$thumbnail.url : '');
                var d = new Date(e.published.$t); 
                var dateStr = d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
                
                return `<div class="mega-post">
                            <div class="mega-thumb"><a href="${l}"><img src="${img}" alt="${t}" loading="lazy"></a></div>
                            <h4 class="mega-title"><a href="${l}">${t}</a></h4>
                            <span class="mega-date"><svg width="10" height="10" viewBox="0 0 512 512" style="fill: currentColor;"><use href="#icon-clock"/></svg> ${dateStr}</span>
                        </div>`;
            }).join('');
            container.innerHTML = html;
        } else {
            container.innerHTML = '<div class="mega-loading">لا توجد مقالات</div>';
        }
        container.setAttribute('data-loaded', 'true');
        container.removeAttribute('data-loading');
    })
    .catch(err => {
        container.innerHTML = '<div class="mega-loading">خطأ في التحميل</div>';
        container.removeAttribute('data-loading');
    });
};

// MODULE 6
(function() {
    'use strict';
    
    var freeBox = document.getElementById('policies-free-box');
    var originalBox = document.getElementById('policies-original-box');
    
    if (freeBox) freeBox.style.display = 'none';
    if (originalBox) originalBox.style.display = 'block';
    
    function setupWidget() {
        const gm = (n) => document.querySelector(`meta[name='${n}']`)?.getAttribute('content') || '';

        function fill(cls, p, e) {
            const c = document.querySelector(`.${cls} .contact-pro-content`);
            if (!c) return;
            let htm = '';
            if (p) htm += `<a href="tel:${p}" class="contact-list-item"><div class="contact-list-icon"><svg width="12" height="12" viewBox="0 0 512 512" style="fill: currentColor;"><use href="#icon-phone"/></svg></div><span>${p}</span></a><a href="https://wa.me/${p.replace(/\D/g,'')}" class="contact-list-item"><div class="contact-list-icon"><svg width="12" height="12" viewBox="0 0 448 512" style="fill: currentColor;"><use href="#icon-whatsapp"/></svg></div><span>واتساب</span></a>`;
            if (e) htm += `<a href="mailto:${e}" class="contact-list-item"><div class="contact-list-icon"><svg width="12" height="12" viewBox="0 0 512 512" style="fill: currentColor;"><use href="#icon-email"/></svg></div><span>بريد إلكتروني</span></a>`;
            c.insertAdjacentHTML('beforeend', htm);
        }

        fill('headquarters-section', gm('site-telephone'), gm('site-email'));
        fill('support-section', gm('support-telephone'), gm('support-email'));

        const chName = gm('Chairman') || 'إدارة الموقع';
        const chImg = document.getElementById('chairman-contact-img');
        if (chImg) {
            chImg.src = gm('chairman-image') || '';
            if(!chImg.src) chImg.style.display = 'none';
            chImg.alt = chName;
        }
        const chNameEl = document.getElementById('chairman-name');
        if(chNameEl) chNameEl.textContent = chName;

        const edName = gm('Editor-in-Chief') || 'إدارة الموقع';
        const edImg = document.getElementById('editor-contact-img');
        if (edImg) {
            edImg.src = gm('editor-in-chief-image') || '';
            if(!edImg.src) edImg.style.display = 'none';
            edImg.alt = edName;
        }
        const edNameEl = document.getElementById('editor-name');
        if(edNameEl) edNameEl.textContent = edName;

        const mail = gm('site-email');
        if (mail) {
            const contactForm = document.getElementById('main-contact-form');
            if(contactForm) contactForm.action = `https://formsubmit.co/${mail}`;
            const rpd = document.getElementById('form-recipients-display');
            if (rpd) {
                rpd.innerHTML = `<div id="form-recipients-box">
                    <b>تصل رسالتك إلى:</b>
                    <span>${mail}</span>
                </div>`;
            }
        }
    }
    
    window.addEventListener('load', () => setTimeout(setupWidget, 600));
})();

// MODULE 7
(function() {
    'use strict';
    
    var freeBox = document.getElementById('team-free-box');
    var originalBox = document.getElementById('team-original-box');
    
    if (freeBox) freeBox.style.display = 'none';
    if (originalBox) originalBox.style.display = 'block';
    
    function initFooterTeamWidget() {
        const teamPageMeta = document.querySelector('meta[name="teamPageUrl"]');
        const newTeamBand = document.getElementById('st-team-band');
        const oldTeamBand = document.querySelector('.team-work-band');

        if (!newTeamBand && !oldTeamBand) return;

        const metaExists = teamPageMeta && teamPageMeta.content && teamPageMeta.content.trim() !== "";

        if (metaExists) {
            console.log("✅ تم العثور على رابط الفريق. سيتم إظهار الأقسام.");

            if (newTeamBand) newTeamBand.style.display = 'block';
            if (oldTeamBand) oldTeamBand.style.display = 'block';

            const teamContainer = document.getElementById('st-team-container');
            if (newTeamBand && teamContainer) {
                teamContainer.style.display = 'flex';

                const meta = (name) => document.querySelector(`meta[name="${name}"]`)?.content || null;

                const chairmanName = meta('Chairman');
                const chairmanCard = document.getElementById('st-chairman-card');
                if (chairmanCard && chairmanName) {
                    document.getElementById('st-chairman-name').textContent = chairmanName;
                    const chairmanImg = document.getElementById('st-chairman-image');
                    if (chairmanImg) chairmanImg.src = meta('chairman-image') || '';
                    chairmanCard.style.display = 'flex';
                }

                const editorName = meta('Editor-in-Chief');
                const editorCard = document.getElementById('st-editor-card');
                if (editorCard && editorName) {
                    document.getElementById('st-editor-name').textContent = editorName;
                    const editorImg = document.getElementById('st-editor-image');
                    if (editorImg) editorImg.src = meta('editor-in-chief-image') || '';
                    editorCard.style.display = 'flex';
                }

                const siteName = meta('site-name') || 'الموقع';
                const titleEl = document.getElementById('st-workTeamTitle');
                if (titleEl) titleEl.textContent = 'فريق عمل ' + siteName;

                const teamLink = document.getElementById('st-view-team-link');
                if (teamLink) {
                    teamLink.href = teamPageMeta.content;
                    teamLink.textContent = 'تعرف على كامل الفريق';
                    teamLink.style.display = 'inline-block';
                }
            }
        } else {
            console.log("❌ لم يتم العثور على رابط الفريق. سيتم إخفاء جميع أقسام فريق العمل.");
            if (newTeamBand) newTeamBand.style.display = 'none';
            if (oldTeamBand) oldTeamBand.style.display = 'none';
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initFooterTeamWidget);
    } else {
        initFooterTeamWidget();
    }
})();

// MODULE 8
(function() {
    'use strict';
    const blogUrl = window.location.origin;

    function injectManagementCard() {
        const originalCard = document.querySelector('.header-main .management-card');
        const stickyPlaceholder = document.getElementById('seoturbo-sticky-management-placeholder');
        if (!originalCard) return;
        const extractManagementData = () => {
            const photos = originalCard.querySelectorAll('.management-frame img');
            const roles = originalCard.querySelectorAll('.management-role span');
            const names = originalCard.querySelectorAll('.management-name');
            const data = [];
            if (photos[0] && roles[0] && names[0]) {
                data.push({ imgSrc: photos[0].src, role: roles[0].textContent.trim(), name: names[0].textContent.trim() });
            }
            if (photos[1] && roles[1] && names[1]) {
                data.push({ imgSrc: photos[1].src, role: roles[1].textContent.trim(), name: names[1].textContent.trim() });
            }
            return data;
        };
        const createCompactCard = (data) => {
            const card = document.createElement('div');
            card.className = 'management-card compact-version';
            const photosContainer = document.createElement('div');
            photosContainer.className = 'management-photos';
            data.forEach(item => {
                const managementItem = document.createElement('div');
                managementItem.className = 'management-item';
                const frame = document.createElement('div');
                frame.className = 'management-frame';
                const img = document.createElement('img');
                img.src = item.imgSrc;
                img.alt = item.name;
                img.loading = 'lazy';
                frame.appendChild(img);
                const infoWrapper = document.createElement('div');
                infoWrapper.className = 'management-info';
                const nameRoleWrapper = document.createElement('div');
                nameRoleWrapper.className = 'name-role-wrapper';
                const roleSpan = document.createElement('span');
                roleSpan.className = 'management-role';
                roleSpan.textContent = item.role;
                const nameSpan = document.createElement('span');
                nameSpan.className = 'management-name';
                nameSpan.textContent = item.name;
                nameRoleWrapper.appendChild(roleSpan);
                nameRoleWrapper.appendChild(nameSpan);
                infoWrapper.appendChild(nameRoleWrapper);
                managementItem.appendChild(frame);
                managementItem.appendChild(infoWrapper);
                photosContainer.appendChild(managementItem);
            });
            card.appendChild(photosContainer);
            return card;
        };
        const managementData = extractManagementData();
        if (managementData.length === 0) return;
        const newCard = createCompactCard(managementData);
        if (stickyPlaceholder) {
            stickyPlaceholder.innerHTML = '';
            stickyPlaceholder.appendChild(newCard.cloneNode(true));
        }
    }

    function initDynamicDropdowns() {
        var menu = document.getElementById('main-menu') || document.querySelector('.main-menu');
        if (!menu || menu.classList.contains('dropdowns-initialized')) return;
        menu.style.visibility = 'hidden'; 
        var topLevelItems = Array.from(menu.children).filter(item => item.tagName === 'LI');
        var parentItems = [], currentParent = null;
        menu.innerHTML = '';
        topLevelItems.forEach(item => {
            var link = item.querySelector('a');
            if (!link) return;
            var linkText = link.innerHTML.trim();
            if (linkText.startsWith('_')) {
                link.innerHTML = linkText.replace(/^_/, '');
                if (currentParent) {
                    var subMenu = currentParent.querySelector('ul.sub-menu');
                    if (!subMenu) {
                        subMenu = document.createElement('ul');
                        subMenu.className = 'sub-menu';
                        currentParent.appendChild(subMenu);
                        currentParent.classList.add('has-sub');
                    }
                    subMenu.appendChild(item);
                }
            } else {
                menu.appendChild(item);
                currentParent = item;
                parentItems.push(item);
            }
        });
        menu.classList.add('dropdowns-initialized');
        requestAnimationFrame(() => { menu.style.visibility = 'visible'; });
        if(typeof initHamburgerEngine === 'function') initHamburgerEngine();
        
        initMegaMenu();
        
        injectManagementCard();
    }

    function initMegaMenu() {
        if (typeof ST_PRO_LOAD_MEGA !== 'function') {
            console.log("SEOTurbo: Pro Engine not detected. Using Standard Menu.");
            return; 
        }

        document.querySelectorAll('.main-menu li a[href*="/search/label/"]').forEach(link => {
            var item = link.parentElement; 
            if (item.querySelector('.mega-menu-box, .sub-mega-menu-box')) return;
            var label = decodeURIComponent(link.getAttribute('href').split('/search/label/')[1].split('?')[0]);
            var megaBox = document.createElement('div');
            megaBox.className = item.closest('.sub-menu') ? 'sub-mega-menu-box' : 'mega-menu-box';
            item.appendChild(megaBox);

            item.addEventListener('mouseenter', () => {
                if (window.innerWidth > 992) {
                    ST_PRO_LOAD_MEGA(label, megaBox);
                }
            });
        });
    }

    function initHamburgerEngine() {
        const menuBtn = document.getElementById('seoturbo-menuHamburgerBtn'), 
              closeBtn = document.getElementById('seoturbo-closeMenuBtn'), 
              overlay = document.getElementById('seoturbo-hamburgerOverlay'), 
              menu = document.getElementById('seoturbo-hamburgerMenu'), 
              searchBtn = document.getElementById('seoturbo-searchHamburgerBtn'), 
              container = document.getElementById('seoturbo-hamburgerMenuContent'), 
              mainBar = document.getElementById('seoturbo-hamburgerContainer');
        if (!menuBtn || !menu || !container) return;
        window.addEventListener('scroll', () => { if(mainBar) mainBar.classList.toggle('is-sticky', window.scrollY > 150); }, { passive: true });
        const toggleMenu = (show) => {
            menu.classList.toggle('active', show);
            if (overlay) overlay.classList.toggle('active', show);
            document.body.style.overflow = show ? 'hidden' : '';
        };
        menuBtn.onclick = () => toggleMenu(true);
        if(closeBtn) closeBtn.onclick = () => toggleMenu(false);
        if(overlay) overlay.onclick = () => toggleMenu(false);
        if(searchBtn) searchBtn.onclick = () => { toggleMenu(false); const mainSearch = document.getElementById('seoturbo-search'); if(mainSearch) mainSearch.click(); };
        buildSmartMenu(container);
    }

    function buildSmartMenu(container) {
        let html = '';
        const socials = document.querySelectorAll('.seoturbo-topbar-social-icons a');
        if (socials.length > 0) {
            html += `<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:20px;padding-bottom:20px;border-bottom:1px solid rgba(0,0,0,0.05);">`;
            socials.forEach(s => { html += `<a href="${s.href}" target="_blank" class="social-circle" aria-label="${s.title || 'تابعنا'}">${s.innerHTML}</a>`; });
            html += `</div>`;
        }
        const sourceMenu = document.getElementById('main-menu');
        if (sourceMenu) {
            html += '<div class="seoturbo-hamburger-section-title"><svg width="14" height="14" viewBox="0 0 512 512" style="fill: currentColor;"><use href="#icon-list"/></svg> الأقسام</div>';
            Array.from(sourceMenu.children).filter(el => el.tagName === 'LI').forEach(li => {
                const parentLink = li.querySelector('a');
                if (!parentLink) return;
                let iconHtml = parentLink.querySelector('svg, i') ? parentLink.querySelector('svg, i').outerHTML : '<svg width="12" height="12" viewBox="0 0 320 512" style="fill: currentColor;"><use href="#icon-chevron-left"/></svg>';
                if (li.classList.contains('has-sub')) {
                    const subMenuUl = li.querySelector('ul.sub-menu');
                    if (subMenuUl) {
                        html += `<div class="seoturbo-hamburger-parent"><div class="seoturbo-hamburger-parent-title" data-trigger="drop"><span>${iconHtml} ${parentLink.textContent.trim()}</span><span class="arrow">▼</span></div><div class="seoturbo-hamburger-submenu">`;
                        subMenuUl.querySelectorAll('li > a').forEach(subA => {
                            let subIconHtml = subA.querySelector('svg, i') ? subA.querySelector('svg, i').outerHTML : '<svg width="8" height="8" viewBox="0 0 448 512" style="fill: currentColor;"><use href="#icon-minus"/></svg>';
                            html += `<a class="seoturbo-hamburger-link" href="${subA.getAttribute('href')}">${subIconHtml} ${subA.textContent.trim()}</a>`;
                        });
                        html += `</div></div>`;
                    }
                } else { html += `<a class="seoturbo-hamburger-link" href="${parentLink.getAttribute('href')}">${iconHtml} ${parentLink.textContent.trim()}</a>`; }
            });
        }
        const staticLinks = document.querySelectorAll('.seoturbo-compact-nav a:not([onclick])');
        if (staticLinks.length > 0) {
            html += '<div class="seoturbo-hamburger-section" style="margin-top:20px;"><div class="seoturbo-hamburger-section-title"><svg width="14" height="14" viewBox="0 0 576 512" style="fill: currentColor;"><use href="#icon-file-alt"/></svg> تعرف علينا</div>';
            staticLinks.forEach(page => { 
                let pageIconHtml = page.querySelector('svg, i') ? page.querySelector('svg, i').outerHTML : '<svg width="12" height="12" viewBox="0 0 576 512" style="fill: currentColor;"><use href="#icon-file-alt"/></svg>';
                html += `<a class="seoturbo-hamburger-link" href="${page.getAttribute('href')}">${pageIconHtml} ${page.textContent.trim()}</a>`; 
            });
            html += '</div>';
        }
        container.innerHTML = html;
        container.querySelectorAll('[data-trigger="drop"]').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const submenu = btn.nextElementSibling, isOpen = btn.classList.contains('is-open');
                if (!isOpen) { btn.classList.add('is-open'); submenu.style.display = 'flex'; submenu.classList.add('is-open'); } 
                else { btn.classList.remove('is-open'); submenu.style.display = 'none'; submenu.classList.remove('is-open'); }
            };
        });
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', initDynamicDropdowns); } 
    else { initDynamicDropdowns(); }
})();

// MODULE 9
(function() {
    'use strict';
    function performMasterSync() {
        const vault = document.getElementById('homepage-identity-vault');
        let logoUrl = null;
        let faviconUrl = null;
        let siteName = null;
        if (vault) {
            logoUrl = vault.getAttribute('data-logo');
            faviconUrl = vault.getAttribute('data-favicon');
            siteName = vault.getAttribute('data-name');
        }
        if (!logoUrl) {
            const headerLogo = document.querySelector('#Header1_headerimg, .header-widget img, .seoturbo-site-logo img');
            logoUrl = headerLogo ? headerLogo.src : null;
        }
        if (!faviconUrl) {
            const faviconLink = document.querySelector('link[rel="icon"][href], link[rel="shortcut icon"][href]');
            faviconUrl = faviconLink ? faviconLink.href : null;
        }
        const sourceCard = document.querySelector('.management-card.desktop-version');
        let managementData = null;
        if (sourceCard) {
            const imgs = sourceCard.querySelectorAll('.management-frame img');
            const names = sourceCard.querySelectorAll('.management-name');            
            const roles = sourceCard.querySelectorAll('.management-role span');
            if (imgs.length >= 2 && names.length >= 2 && roles.length >= 2) {
                managementData = {
                    images: [imgs[0].src, imgs[1].src],
                    names: [names[0].textContent.trim(), names[1].textContent.trim()],
                    roles: [roles[0].textContent.trim(), roles[1].textContent.trim()]
                };
            }
        }
        requestAnimationFrame(() => {
            if (logoUrl) {
                const logoTargets = document.querySelectorAll('.seoturbo-hamburger-header-logo img, .seoturbo-sticky-logo-img, .seoturbo-side-nav-logo img, #seoturbo-sticky-logo, .mega-logo');
                logoTargets.forEach(img => {
                    if (img && img.src !== logoUrl) {
                        img.src = logoUrl;
                    }
                });
            }
            if (faviconUrl) {
                const favTarget = document.getElementById('mobile-favicon-target');
                if (favTarget && favTarget.src !== faviconUrl) {
                    favTarget.src = faviconUrl;
                }
                const notifIcons = document.querySelectorAll('.seoturbo-notif-icon, .notif-icon');
                notifIcons.forEach(icon => {
                    if (icon.src && icon.src !== faviconUrl) {
                        icon.src = faviconUrl;
                    }
                });
            }
            if (siteName) {
                const nameTargets = document.querySelectorAll('.seoturbo-side-nav-site-name, .seoturbo-mobile-site-name, .mega-site-info .mega-welcome span');
                nameTargets.forEach(el => {
                    if (el && el.textContent !== siteName) {
                        el.textContent = siteName;
                    }
                });
            }
            if (managementData) {
                const targetCards = document.querySelectorAll('.seoturbo-full-vertical-card');
                targetCards.forEach(card => {
                    const tImgs = card.querySelectorAll('.v-full-img img');
                    const tNames = card.querySelectorAll('.v-full-name');
                    const tRoles = card.querySelectorAll('.v-full-role'); 
                    managementData.images.forEach((src, i) => {
                        if (tImgs[i] && tImgs[i].src !== src) {
                            tImgs[i].src = src;
                        }
                    });
                    managementData.names.forEach((name, i) => {
                        if (tNames[i] && tNames[i].textContent !== name) {
                            tNames[i].textContent = name;
                        }
                    });
                    managementData.roles.forEach((role, i) => {
                        if (tRoles[i]) {
                            const icon = tRoles[i].querySelector('svg');
                            if (icon) {
                                tRoles[i].innerHTML = icon.outerHTML + ' ' + role;
                            } else {
                                tRoles[i].textContent = role;
                            }
                        }
                    });
                });
            }
        });
    }
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            setTimeout(performMasterSync, 400);
            setTimeout(performMasterSync, 3000);
        });
    } else {
        window.addEventListener('load', () => {
            setTimeout(performMasterSync, 1000);
        });
    }
    window.addEventListener('seoturboDarkModeChange', () => {
        setTimeout(performMasterSync, 100);
    });
})();

// MODULE 10
(function(){
    'use strict';
    
    var freeContainer = document.getElementById('seoturbo-breaking-placeholder');
    var originalContainer = document.getElementById('breaking-bar-original');
    
    if (freeContainer) freeContainer.style.display = 'none';
    if (originalContainer) originalContainer.style.display = 'block';
    
    var months = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    
    var vault = document.getElementById('homepage-identity-vault');
    var blogName = (vault && vault.getAttribute('data-name')) ? vault.getAttribute('data-name') : "";

    function getArDate(dStr) {
        var d = new Date(dStr);
        return d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    }

    function generateTooltipText(title, category, date) {
        var cleanCategory = category.replace(/<[^>]*>/g, '').trim();
        return '📰 ' + title + '\n📁 القسم: ' + cleanCategory + '\n📅 النشر: ' + date;
    }

    function getMappedCategory(label) {
        var cleanLabel = decodeURIComponent(label).toLowerCase().trim();
        if (window.seoturbo_label_dictionary && window.seoturbo_label_dictionary[cleanLabel]) {
            return window.seoturbo_label_dictionary[cleanLabel];
        }
        var menuLinks = document.querySelectorAll('#main-menu a[href*="/search/label/"], .sub-menu a[href*="/search/label/"]');
        for (var i = 0; i < menuLinks.length; i++) {
            var href = decodeURIComponent(menuLinks[i].getAttribute('href'));
            var slugInMenu = href.substring(href.lastIndexOf('/') + 1).split('?')[0].toLowerCase().trim();
            if (slugInMenu === cleanLabel) {
                return menuLinks[i].textContent.trim().replace(/^_/, '');
            }
        }
        return label;
    }

    function initBreakingBar() {
        var barArea = document.getElementById('single_seoterbobar_area'); 
        if (!barArea) return;

        if (window.ST_MASTER_PROMISE) {
            window.ST_MASTER_PROMISE.then(function(d) {
                if (!d || !d.feed.entry) return;
                var entries = d.feed.entry.slice(9, 19);
                var seoterboHtml = entries.map(function(e) {
                    var t = e.title.$t;
                    var link = e.link.find(function(l){return l.rel === 'alternate'}).href;
                    var rawCat = (e.category && e.category.length > 0) ? e.category[0].term : 'موضوعات';
                    var mappedCat = getMappedCategory(rawCat);
                    var dateStr = getArDate(e.published.$t);
                    var tooltipText = generateTooltipText(t, mappedCat, dateStr);
                    
                    return '<a class="single-seoterbobar-item" href="' + link + '" style="cursor: pointer;" title="' + tooltipText + '">' +
                           '<span class="single-seoterbobar-source" style="cursor: pointer;" title="' + mappedCat + '">من موضوعاتنا</span> ' + t + '</a>';
                }).join('');
                barArea.innerHTML = seoterboHtml;
            });
        }
    }

    setTimeout(initBreakingBar, 3000);
})();

// MODULE 12
(function(){
    'use strict';
    var months = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    var defaultAuthorImg = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiayFqZQb-C_QKZf9LtsQLGCL2V_DucX9ex335dtsQ8ISn7jC3XFwWaXB2gHRqTF7Ng_48_TiUTgbLkXlMfhbHa3wGwvjPfB5YCKI2AqYue1cwIWtvPZNeCrqRl-ufBpqoGe2N5Dr13SOQ46-U__Xmb6C4keVLoNqSiUEMojk3MFVnQhOkA1yfnByshdRQB/w159-h200-rw/user.webp';
    var allEntries = [];
    var shownCount = 0;
    function getArDate(dStr) {
        var d = new Date(dStr);
        if (isNaN(d)) return '';
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }
    function cleanHtmlFast(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function extractFirstRealParagraph(content, isFeatured) {
        if (!content) return '';
        var text = cleanHtmlFast(content);
        var sentences = text.split(/[.!?؟!]\s+/);
        var maxLength = isFeatured ? 500 : 250;
        for (var i = 0; i < sentences.length; i++) {
            var sentence = sentences[i].trim();
            if (sentence.length > 35) {
                if (sentence.length > maxLength) {
                    sentence = sentence.substring(0, maxLength);
                }
                return sentence + '...';
            }
        }
        if (text.length > 35) {
            var result = text.substring(0, maxLength);
            return result + '...';
        }
        return '';
    }
    function cleanText(html) {
        if (!html) return '';
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = html.replace(/^_/, '').trim();
        tempDiv.querySelectorAll('i, svg, img, span').forEach(function(el) { el.remove(); });
        return tempDiv.textContent.replace(/\s+/g, ' ').trim();
    }
    function getMappedCategory(label) {
        var cleanLabel = decodeURIComponent(label).toLowerCase().trim();
        if (window.seoturbo_label_dictionary && window.seoturbo_label_dictionary[cleanLabel]) {
            return window.seoturbo_label_dictionary[cleanLabel];
        }
        var menuLinks = document.querySelectorAll('#main-menu a[href*="/search/label/"]');
        for (var i = 0; i < menuLinks.length; i++) {
            var href = decodeURIComponent(menuLinks[i].getAttribute('href'));
            var slugInMenu = href.substring(href.lastIndexOf('/') + 1).split('?')[0].toLowerCase().trim();
            if (slugInMenu === cleanLabel) {
                return cleanText(menuLinks[i].innerHTML);
            }
        }
        return label;
    }
    function getAuthorImageFromPost(entry) {
        if (entry.author && entry.author[0] && entry.author[0].gd$image && entry.author[0].gd$image.src) {
            return entry.author[0].gd$image.src.replace(/\/(s\d+|w\d+-h\d+|w\d+)(-[^/]*)*\//, '/s30-c/');
        }
        return null;
    }
    function formatLCPImage(url, isFeatured) {
        if (!url) return '';
        
        if (url.includes('img.youtube.com') || url.includes('ytimg.com')) {
            return url.replace('default.jpg', isFeatured ? 'maxresdefault.jpg' : 'hqdefault.jpg');
        }
        var imgSize = isFeatured ? 'w800-h450-c' : 'w600-h338-c';
        
        if (url.includes('=')) {
            return url.split('=')[0] + '=' + (isFeatured ? 'w800-h450-c' : 'w600-h338-c');
        }
        return url.replace(/\/s\d+(-[^\/]*)?\//, '/' + imgSize + '/');
    }
    function populateArticleData(article, e, i) {
        if (!article) return;
        var title = e.title.$t;
        var link = e.link.find(function(u){return u.rel==='alternate'}).href;
        var img = e.media$thumbnail ? formatLCPImage(e.media$thumbnail.url, i === 0) : '';
        if (i === 0 && window.ST_LCP_IMG) {
            img = window.ST_LCP_IMG.indexOf('-rw') === -1 ? window.ST_LCP_IMG.replace(/(w\d+-h\d+-p-k-no-nu)([/])/, '$1-rw/') : window.ST_LCP_IMG;
        }
        var rawCat = (e.category && e.category.length > 0) ? e.category[0].term : 'موضوعات';
        var mappedCat = getMappedCategory(rawCat);
        var dateStr = getArDate(e.published.$t);
        var snippet = '';
        if (e.summary && e.summary.$t) {
            snippet = extractFirstRealParagraph(e.summary.$t, i === 0);
        }
        var postId = e.id.$t.split('post-')[1] || i;
        var cleanTitle = title.replace(/"/g, '&quot;');
        var cleanImg = img.replace(/"/g, '&quot;');
        var cleanSnippet = snippet ? snippet.replace(/"/g, '&quot;') : '';
        var authorName = (e.author && e.author[0] && e.author[0].name && e.author[0].name.$t) ? e.author[0].name.$t : 'تحرير';
        var authorImg = getAuthorImageFromPost(e);
        if (!authorImg) authorImg = defaultAuthorImg;
        var thumbLink = article.querySelector('.seoturbo-main-tool-thumb a') || article.querySelector('.thumb');
        if (thumbLink) thumbLink.href = link;
        var catSpan = article.querySelector('.postcat');
        if (catSpan) catSpan.textContent = mappedCat;
        var thumbImg = article.querySelector('.seoturbo-main-tool-thumb img') || article.querySelector('.thumb img');
        if (thumbImg) {
            thumbImg.src = img;
            thumbImg.alt = title;
            if (i === 0) {
                thumbImg.setAttribute('fetchpriority', 'high');
                thumbImg.setAttribute('loading', 'eager');
                thumbImg.setAttribute('decoding', 'sync');
            } else {
                thumbImg.setAttribute('loading', 'lazy');
                thumbImg.setAttribute('decoding', 'async');
            }
        }
        var titleLink = article.querySelector('.seoturbo-main-tool-title-card a') || article.querySelector('.rnav-title a');
        if (titleLink) {
            titleLink.href = link;
            titleLink.textContent = title;
        }
        var snippetDiv = article.querySelector('.leadership-snippet');
        if (snippetDiv) snippetDiv.textContent = cleanSnippet || '';
        var authorImgSmall = article.querySelector('.author-img-small');
        if (authorImgSmall) {
            authorImgSmall.src = authorImg;
            authorImgSmall.alt = authorName;
        }
        var authorNameSpan = article.querySelector('.name') || article.querySelector('.author-name-small');
        if (authorNameSpan) authorNameSpan.textContent = authorName;
        var dateBadge = article.querySelector('.post-date-badge');
        if (dateBadge) dateBadge.innerHTML = '📅 ' + dateStr;
        var readMore = article.querySelector('.seoturbo-main-tool-read-more') || article.querySelector('.read-more-btn');
        if (readMore) readMore.href = link;
        var favBtn = article.querySelector('.seoturbo-post-add-fav');
        if (favBtn) {
            favBtn.setAttribute('data-id', postId);
            favBtn.setAttribute('data-title', cleanTitle);
            favBtn.setAttribute('data-url', link);
            favBtn.setAttribute('data-img', cleanImg);
        }
    }
    function generateDynamicPostHTML(e, i) {
        var title = e.title.$t;
        var link = e.link.find(function(u){return u.rel==='alternate'}).href;
        var img = e.media$thumbnail ? formatLCPImage(e.media$thumbnail.url, false) : '';
        var rawCat = (e.category && e.category.length > 0) ? e.category[0].term : 'موضوعات';
        var mappedCat = getMappedCategory(rawCat);
        var dateStr = getArDate(e.published.$t);
        var snippet = '';
        if (e.summary && e.summary.$t) {
            snippet = extractFirstRealParagraph(e.summary.$t, false);
        }
        var postId = e.id.$t.split('post-')[1] || i;
        var cleanTitle = title.replace(/"/g, '&quot;');
        var cleanImg = img.replace(/"/g, '&quot;');
        var cleanSnippet = snippet ? snippet.replace(/"/g, '&quot;') : '';
        var authorName = (e.author && e.author[0] && e.author[0].name && e.author[0].name.$t) ? e.author[0].name.$t : 'تحرير';
        var authorImg = getAuthorImageFromPost(e);
        if (!authorImg) authorImg = defaultAuthorImg;
        var catClass = 'catnum' + (i % 5);
        return `
        <article class="posts postnum${i}">
            <a class="thumb" href="${link}">
                <span class="postcat ${catClass}">${mappedCat}</span>
                <img alt="${cleanTitle}" class="post-thumb" height="158" loading="lazy" decoding="async" src="${img}" width="280"/>
                <div class="seoturbo-fav-btn seoturbo-post-add-fav" data-id="${postId}" data-title="${cleanTitle}" data-url="${link}" data-img="${cleanImg}">
                    <svg><use href="#icon-fav-empty"/></svg>
                    <span class="seoturbo-fav-text">حفظ</span>
                </div>
            </a>
            <div class="cont">
                <h3 class="rnav-title"><a href="${link}">${title}</a></h3>
                <div class="leadership-snippet">${cleanSnippet}</div>
                <div class="post-meta-bar">
                    <div class="author-info-wrap">
                        <img alt="${authorName}" class="author-img-small" height="20" loading="lazy" src="${authorImg}" width="20"/>
                        <span class="author-name-small">${authorName}</span>
                    </div>
                    <div class="post-date-badge">📅 ${dateStr}</div>
                </div>
            </div>
        </article>`;
    }
    function loadMoreProcess() {
        var slider = document.getElementById('seoturbo-leadership-slider');
        if (!slider || allEntries.length === 0) return;
        if (shownCount === 0) {
            var limit = Math.min(9, allEntries.length);
            for (var i = 0; i < limit; i++) {
                var article = slider.querySelector('.posts.postnum' + i);
                if (article) {
                    populateArticleData(article, allEntries[i], i);
                }
            }
            shownCount = limit;
        }
    }
    var sliderInterval = null;
    var sliderIdx = 1;
    function rotateFeatured() {}
    function startSliderRotation() {}
    function initLeadershipSlider() {
        if (window.ST_MASTER_PROMISE) {
            window.ST_MASTER_PROMISE.then(function(d) {
                if (!d || !d.feed || !d.feed.entry) return;
                allEntries = d.feed.entry; 
                shownCount = 0;
                loadMoreProcess();
                setTimeout(startSliderRotation, 2000);
            });
        }
    }
    initLeadershipSlider();
})();

// MODULE 13
(function(){
    'use strict';
    var freeContainer = document.getElementById('seoturbo-sections-placeholder');
    var originalContainer = document.getElementById('sections-grid-original');
    if (freeContainer) freeContainer.style.display = 'none';
    if (originalContainer) originalContainer.style.display = 'block';
    var months = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
    var vault = document.getElementById('homepage-identity-vault');
    var blogName = (vault && vault.getAttribute('data-name')) ? vault.getAttribute('data-name') : "";
    function getArDate(dStr) {
        var d = new Date(dStr);
        return d.getUTCDate() + ' ' + months[d.getUTCMonth()] + ' ' + d.getUTCFullYear();
    }
    function generateTooltipText(title, category, date) {
        var cleanCategory = category.replace(/<[^>]*>/g, '').trim();
        return '📰 ' + title + '\n📁 القسم: ' + cleanCategory + '\n📅 النشر: ' + date;
    }
    function cleanText(html) {
        if (!html) return '';
        return html.replace(/^_+/, '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    }
    var cachedMenuLinks = null;
    function getMenuLinks() {
        if (!cachedMenuLinks) cachedMenuLinks = Array.from(document.querySelectorAll('#main-menu a[href*="/search/label/"], .sub-menu a[href*="/search/label/"]'));
        return cachedMenuLinks;
    }
    function getMappedCategory(label) {
        var cleanLabel = decodeURIComponent(label).toLowerCase().trim();
        if (window.seoturbo_label_dictionary && window.seoturbo_label_dictionary[cleanLabel]) {
            return window.seoturbo_label_dictionary[cleanLabel];
        }
        var menuLinks = getMenuLinks();
        for (var i = 0; i < menuLinks.length; i++) {
            var href = decodeURIComponent(menuLinks[i].getAttribute('href'));
            var slugInMenu = href.substring(href.lastIndexOf('/') + 1).split('?')[0].toLowerCase().trim();
            if (slugInMenu === cleanLabel) {
                return cleanText(menuLinks[i].innerHTML);
            }
        }
        return label;
    }
    function optimizeSectionImage(url) {
        if (!url) return '';
        if (url.includes('img.youtube.com') || url.includes('ytimg.com')) {
            return url.replace('default.jpg', 'hqdefault.jpg');
        }
        if (url.includes('=')) {
            return url.split('=')[0] + '=w150-h150-c';
        }
        return url.replace(/\/s\d+(-[^\/]*)?\//, '/w150-h150-c/');
    }
    function initSectionsGrid() {
        var secGrid = document.getElementById('sections-grid-container');
        if (!secGrid) return;
        var menuLinks = getMenuLinks();
        var blogSecs = [];
        var seenLabels = {};
        menuLinks.forEach(l => {
            var linkText = l.textContent.trim();
            if (linkText.indexOf('تحميل') !== -1) return;
            var labelPart = l.getAttribute('href').split('/search/label/')[1];
            if (labelPart) {
                var label = decodeURIComponent(labelPart.split(/[?#]/)[0]);
                if (!seenLabels[label]) {
                    seenLabels[label] = true;
                    blogSecs.push({ label: label, name: l.innerHTML, cleanName: cleanText(l.innerHTML) });
                }
            }
        });
        if (blogSecs.length === 0) return;
        var colors = ['#b71c1c', '#0d47a1', '#1a252f', '#1b5e20', '#6a1b9a', '#006064', '#4a148c', '#004d40', '#bf360c', '#3e2723', '#263238', '#880e4f'];
        var skeletonItem = '<div class="section-post-item"><div class="section-post-thumb" style="background:var(--border-color);"></div><div class="section-post-info"><div style="height:14px;background:var(--border-color);width:80%;margin-bottom:8px"></div><div style="height:10px;background:var(--border-color);width:40%"></div></div></div>';
        blogSecs.forEach((s, j) => {
            var card = document.createElement('div');
            card.className = 'section-card';
            card.setAttribute('data-label', s.label);
            card.id = 'sec-card-' + j;
            card.style.cursor = "pointer";
            var sectionTooltip = '📂 قسم ' + s.cleanName + '\n📊 أحدث المقالات المنشورة في هذا القسم\n🔍 اضغط للمزيد';
            card.innerHTML = '<h2 class="section-header" style="background: ' + colors[j % colors.length] + '; cursor: pointer;" title="' + sectionTooltip + '">' + s.name + '</h2>' +
                '<div class="section-posts-list" id="sec-posts-' + j + '" style="cursor: pointer;">' + skeletonItem + skeletonItem + skeletonItem + '</div>' +
                '<div class="section-footer" style="cursor: pointer;">' +
                '<a href="/search/label/' + encodeURIComponent(s.label) + '" style="cursor: pointer;" title="استكشاف المزيد من مقالات قسم ' + s.cleanName + '">المزيد من هذا القسم</a></div>';
            secGrid.appendChild(card);
        });
        var secObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    var card = entry.target;
                    fetchSectionData(card.getAttribute('data-label'), card.id.replace('sec-card-', ''));
                    observer.unobserve(card);
                }
            });
        }, { rootMargin: '400px' });
        document.querySelectorAll('.section-card').forEach(card => secObserver.observe(card));
    }
    function fetchSectionData(label, index) {
        fetch('/feeds/posts/summary/-/' + encodeURIComponent(label) + '?alt=json&max-results=3')
        .then(res => res.json())
        .then(data => {
            var listContainer = document.getElementById('sec-posts-' + index);
            if (data.feed.entry) {
                var html = '';
                data.feed.entry.forEach(e => {
                    var title = e.title.$t;
                    var link = e.link.find(u => u.rel === 'alternate').href;
                    var img = optimizeSectionImage(e.media$thumbnail ? e.media$thumbnail.url : '');
                    var dateStr = getArDate(e.published.$t);
                    var rawCategory = (e.category && e.category.length > 0) ? e.category[0].term : label;
                    var mappedCategory = getMappedCategory(rawCategory);
                    var tooltipText = generateTooltipText(title, mappedCategory, dateStr);
                    html += '<div class="section-post-item" style="cursor: pointer;" title="' + tooltipText + '">' +
                            '<a class="section-post-thumb" href="' + link + '" style="cursor: pointer;" title="' + tooltipText + '">' +
                                '<img src="' + img + '" alt="' + title + '" loading="lazy" style="cursor: pointer;" title="' + tooltipText + '">' +
                            '</a>' +
                            '<div class="section-post-info" style="cursor: pointer;">' +
                                '<h3 class="section-post-title" style="cursor: pointer;">' +
                                    '<a href="' + link + '" style="cursor: pointer;" title="' + tooltipText + '">' + title + '</a>' +
                                '</h3>' +
                                '<div class="section-post-date" style="cursor: pointer;" title="' + tooltipText + '">' +
                                    '<svg width="10" height="10" viewBox="0 0 512 512" style="fill: currentColor;"><use href="#icon-clock"/></svg> ' + dateStr +
                                '</div>' +
                            '</div>' +
                        '</div>';
                });
                listContainer.innerHTML = html;
            }
        });
    }
    setTimeout(initSectionsGrid, 1500);
})();

// MODULE 14
(function() {
    'use strict';
    const gridContainer = document.getElementById('seoturbo-main-tool-grid');
    if (!gridContainer) return;
    let allPosts = [];
    const months = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    function cleanHtmlFast(html) {
        if (!html) return '';
        return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    function formatDate(dateStr) {
        const d = new Date(dateStr);
        if (isNaN(d)) return '';
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }
    function getSiteLogo() {
        const headerImg = document.querySelector('#Header1_headerimg, .header-widget img, .seoturbo-site-logo img');
        if (headerImg && headerImg.src) return headerImg.src;
        const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
        if (favicon && favicon.href) return favicon.href;
        return 'https://www.blogger.com/favicon.ico';
    }
    const defaultAuthorImg = 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiayFqZQb-C_QKZf9LtsQLGCL2V_DucX9ex335dtsQ8ISn7jC3XFwWaXB2gHRqTF7Ng_48_TiUTgbLkXlMfhbHa3wGwvjPfB5YCKI2AqYue1cwIWtvPZNeCrqRl-ufBpqoGe2N5Dr13SOQ46-U__Xmb6C4keVLoNqSiUEMojk3MFVnQhOkA1yfnByshdRQB/w159-h200-rw/user.webp';
    
    function translateCategory(category) {
        if (!category) return 'موضوعات';
        if (window.seoturbo_label_dictionary && window.seoturbo_label_dictionary[category.toLowerCase()]) {
            return window.seoturbo_label_dictionary[category.toLowerCase()];
        }
        return category;
    }
    function getCategoryIcon(categoryName) {
        const menuLinks = document.querySelectorAll('#main-menu a[href*="/search/label/"], .sub-menu a[href*="/search/label/"]');
        for (const link of menuLinks) {
            const href = decodeURIComponent(link.getAttribute('href'));
            const slug = href.split('/search/label/')[1]?.split(/[?#]/)[0];
            if (slug && slug.toLowerCase() === categoryName.toLowerCase()) {
                const icon = link.querySelector('svg, i');
                if (icon) return icon.cloneNode(true).outerHTML;
            }
        }
        return '<svg width="12" height="12" viewBox="0 0 576 512" style="fill:currentColor;"><use href="#icon-folder-open"/></svg>';
    }
    function getCategoryColorIndex(categoryName) {
        const menuLinks = document.querySelectorAll('#main-menu a[href*="/search/label/"], .sub-menu a[href*="/search/label/"]');
        let index = 0;
        for (const link of menuLinks) {
            const href = decodeURIComponent(link.getAttribute('href'));
            const slug = href.split('/search/label/')[1]?.split(/[?#]/)[0];
            if (slug && slug.toLowerCase() === categoryName.toLowerCase()) return index % 16;
            index++;
        }
        return categoryName.length % 16;
    }
    function getAuthorImage(post) {
        if (post.author?.[0]?.gd$image?.src) {
            return post.author[0].gd$image.src.replace(/\/(s\d+|w\d+-h\d+|w\d+)(-[^/]*)*\//, '/s40-c/');
        }
        return null;
    }
    function seoturboOptimizeImage(url) {
        if (!url) return '';
        if (url.includes('img.youtube.com') || url.includes('ytimg.com')) {
            return url.replace('default.jpg', 'hqdefault.jpg');
        }
        if (url.includes('=')) {
            return url.split('=')[0] + '=w500-h281-c';
        }
        return url.replace(/\/s\d+(-[^\/]*)?\//, '/w500-h281-c-rw-l30/');
    }
    function processPostFromCache(entry) {
        if (!entry) return null;
        const title = entry.title?.$t || 'بدون عنوان';
        const link = entry.link?.find(l => l.rel === 'alternate')?.href || '#';
        let img = entry.media$thumbnail?.url;
        const fallbackImg = getSiteLogo();
        const authorName = entry.author?.[0]?.name?.$t || 'تحرير';
        const dateFormatted = formatDate(entry.published?.$t);
        let authorImg = getAuthorImage(entry);
        if (!authorImg) authorImg = defaultAuthorImg;
        const category = entry.category?.[0]?.term || 'موضوعات';
        const translatedCat = translateCategory(category);
        const categoryIcon = getCategoryIcon(category);
        const colorIndex = getCategoryColorIndex(category);
        const catColorClass = 'seoturbo-catnum' + (colorIndex % 16);
        let snippet = '';
        if (entry.summary?.$t) {
            snippet = cleanHtmlFast(entry.summary.$t);
            if (snippet.length > 250) snippet = snippet.substring(0, 250) + '...';
        }
        if (!snippet && title) {
            snippet = title.length > 100 ? title.substring(0, 100) + '...' : title;
        }
        if (!snippet) snippet = 'اضغط لقراءة المزيد من التفاصيل...';
        return {
            id: entry.id?.$t?.split('post-')[1] || link,
            title, link, snippet,
            img: img ? seoturboOptimizeImage(img) : fallbackImg,
            authorName, authorImg, dateFormatted, category, translatedCat, categoryIcon, catColorClass
        };
    }
    function shuffleArray(array) {
        let currentIndex = array.length, randomIndex;
        while (currentIndex !== 0) {
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;
            [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
        }
        return array;
    }
    function renderCard(post, isFirstPost) {
        const imgLoadingAttr = isFirstPost ? 'fetchpriority="high" loading="eager" decoding="sync"' : 'loading="lazy" decoding="async"';
        const postId = post.id || ('post_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6));
        const escTitle = post.title.replace(/"/g, '&quot;').replace(/</g, '&lt;');
        const escSnippet = post.snippet ? post.snippet.replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        const escAuthor = post.authorName.replace(/</g, '&lt;');
        const escCat = post.translatedCat.replace(/</g, '&lt;');
        return `
            <div class="seoturbo-main-tool-card" data-post-id="${postId}">
                <div class="seoturbo-main-tool-thumb">
                    <a href="${post.link}" title="${escTitle}">
                        <img src="${post.img}" alt="${escTitle}" width="340" height="191" ${imgLoadingAttr} onerror="this.src='${getSiteLogo()}'">
                    </a>
                    <span class="seoturbo-main-tool-badge ${post.catColorClass}">
                        ${post.categoryIcon} ${escCat}
                    </span>
                </div>
                <div class="seoturbo-main-tool-content">
                    <h3 class="seoturbo-main-tool-title-card">
                        <a href="${post.link}" title="${escTitle}">${escTitle}</a>
                    </h3>
                    ${post.snippet ? `<p class="seoturbo-main-tool-snippet">${escSnippet}</p>` : ''}
                    <div class="seoturbo-main-tool-footer">
                        <div class="seoturbo-main-tool-author-meta">
                            <img src="${post.authorImg}" alt="${escAuthor}" width="36" height="36" loading="lazy" onerror="this.src='${defaultAuthorImg}'">
                            <div class="seoturbo-main-tool-author-info">
                                <span class="name">${escAuthor}</span>
                                <span>📅 ${post.dateFormatted}</span>
                            </div>
                        </div>
                        <div class="seoturbo-main-tool-post-actions">
                            <a href="${post.link}" class="seoturbo-main-tool-read-more" title="${escTitle}">قراءة المزيد</a>
                            <div class="seoturbo-main-tool-fav-btn seoturbo-post-add-fav" data-id="${postId}" data-title="${escTitle}" data-url="${post.link}" data-img="${post.img}">
                                <svg width="44" height="44" viewBox="0 0 24 24"><use href="#icon-fav-empty"/></svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
    function renderGrid() {
        if (!allPosts.length) {
            gridContainer.innerHTML = '<div class="seoturbo-main-tool-skeleton">⚠️ لا توجد مقالات</div>';
            return;
        }
        let html = '';
        allPosts.forEach((post, idx) => {
            html += renderCard(post, false);
        });
        gridContainer.innerHTML = html;
    }
    async function init() {
        if (!window.ST_MASTER_PROMISE) {
            gridContainer.innerHTML = '<div class="seoturbo-main-tool-skeleton">⚠️ النظام غير جاهز</div>';
            return;
        }
        try {
            const data = await window.ST_MASTER_PROMISE;
            if (data?.feed?.entry?.length) {
                const remainingEntries = data.feed.entry.slice(9);
                const shuffledEntries = shuffleArray(remainingEntries);
                allPosts = shuffledEntries.slice(0, 8).map(processPostFromCache).filter(Boolean);
                renderGrid();
            } else {
                gridContainer.innerHTML = '<div class="seoturbo-main-tool-skeleton">⚠️ لا توجد مقالات</div>';
            }
        } catch(e) {
            console.warn('SEOTurbo Main Tool Error:', e);
            gridContainer.innerHTML = '<div class="seoturbo-main-tool-skeleton">⚠️ حدث خطأ في تحميل البيانات</div>';
        }
    }
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// MODULE 16
(function() {
    'use strict';
    
    var freeContainer = document.getElementById('seoturbo-reading-placeholder');
    var originalContainer = document.getElementById('reading-also-original');
    
    if (freeContainer) freeContainer.style.display = 'none';
    if (originalContainer) originalContainer.style.display = 'block';
    
    const numberOfPosts = 6;
    let isInitialized = false;

    function renderReadingAlso(posts) {
        const container = document.getElementById('reading-also-container');
        if (!container || posts.length === 0) return;

        const months = ["يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        let html = '';

        posts.slice(0, numberOfPosts).forEach(e => {
            const t = e.title.$t;
            const l = e.link.find(link => link.rel === 'alternate').href;
            const date = new Date(e.published.$t);
            const dateStr = `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
            const img = e.media$thumbnail ? e.media$thumbnail.url.replace(/\/s\d+(-[^\/]*)?\//, '/s400/') : 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi7Ml848_trMe4J1co6ImpiKh7XcXn2ZsRTk85hy4oWOlBvvOIyHTSxoC1nvNwlZ0-PvMwjQFVEcqhA0H2dGcz-fWO9il9RlsmpXX8I7RLYt6y7kPb9cE2fKnBqdD7gvbSTfLfoSjCZs_brqPRiw335YfX5qGHS8iNYIHCBNUo1npNK3o8Oxtob-KxZeBk/s16000-rw/rbka-news300-100.webp';

            html += `<a class="related-thumb" href="${l}">
                        <img src="${img}" alt="${t}" loading="lazy">
                    </a>`;
        });
        container.innerHTML = html;
    }

    function initReadingAlsoEngine() {
        if (isInitialized) return;
        isInitialized = true;

        const currentUrl = window.location.href.split('?')[0];
        const currentLabel = (window.postLabels && window.postLabels.length > 0) ? window.postLabels[0] : "موضوعات";

        if (window.ST_MASTER_PROMISE) {
            window.ST_MASTER_PROMISE.then(data => {
                if (data && data.feed && data.feed.entry) {
                    let filtered = data.feed.entry.filter(e => {
                        let link = e.link.find(l => l.rel === 'alternate').href.split('?')[0];
                        return link !== currentUrl && e.category && e.category.some(c => c.term === currentLabel);
                    });

                    if (filtered.length >= numberOfPosts) {
                        console.log('🚀 SEOTurbo: تم ملء "مواضيع ذات صلة" من الذاكرة العالمية');
                        renderReadingAlso(filtered);
                    } else {
                        console.log('📡 SEOTurbo: جلب بيانات تكميلية لقسم "مواضيع ذات صلة"');
                        fetch(`/feeds/posts/summary/-/${encodeURIComponent(currentLabel)}?alt=json&max-results=12`)
                        .then(res => res.json()).then(j => {
                            if(j.feed.entry) {
                                let combined = j.feed.entry.filter(e => e.link.find(l => l.rel === 'alternate').href.split('?')[0] !== currentUrl);
                                renderReadingAlso(combined);
                            }
                        });
                    }
                }
            });
        }
    }

    const container = document.getElementById('reading-also-container');
    if (container) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                initReadingAlsoEngine();
                observer.unobserve(container);
            }
        }, { rootMargin: '400px' }); 
        observer.observe(container);
    }

})();

// MODULE 17
(function() {
    'use strict';
    function encodeBase64(str) { try { return btoa(encodeURIComponent(str)); } catch(e) { return encodeURIComponent(str); } }
    
    function initImperialLinkConverter() {
        if (!window.ST_REDIRECT_SYSTEM_ACTIVE) return;
        if (window.location.pathname.includes('/404') || window.location.search.includes('url=')) return;

        const currentDomain = window.location.hostname;
        const redirectBase = window.location.origin + "/404?url=";
        const containers = document.querySelectorAll('.post-body, .entry-content, .static-page-body');
        
        containers.forEach(container => {
            const links = container.getElementsByTagName('a');
            for (let i = 0; i < links.length; i++) {
                let link = links[i];
                let href = link.href;
                if (href && href.indexOf('http') === 0 && href.indexOf(currentDomain) === -1 && !href.startsWith('#') && href.indexOf('javascript') === -1) {
                    link.href = redirectBase + encodeBase64(href);
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";
                }
            }
        });
    }
    if (window.requestIdleCallback) { requestIdleCallback(initImperialLinkConverter); } 
    else { window.addEventListener('load', initImperialLinkConverter); }
})();

