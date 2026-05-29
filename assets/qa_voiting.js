(function() {
    'use strict';
    
    const VOTE_CONFIG = {
        minBase: 15,
        maxBase: 45,
        weeklyGrowthMin: 4,
        weeklyGrowthMax: 12,
        maxLimitMin: 750,
        maxLimitMax: 850
    };
    
    const VOTE_CACHE = {};
    
    const createHash = (str) => {
        if (!str) return 0;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash = hash & hash;
        }
        return Math.abs(hash);
    };
    
    const generateHybridVotes = (identifier, publishDateStr) => {
        if (VOTE_CACHE[identifier]) return VOTE_CACHE[identifier];
        
        const hash = createHash(identifier);
        const dynamicMaxLimit = VOTE_CONFIG.maxLimitMin + (hash % (VOTE_CONFIG.maxLimitMax - VOTE_CONFIG.maxLimitMin + 1));
        const baseCountRange = VOTE_CONFIG.maxBase - VOTE_CONFIG.minBase;
        const baseCount = (hash % baseCountRange) + VOTE_CONFIG.minBase;
        
        let weeksPassed = 0;
        if (publishDateStr) {
            const pDate = new Date(publishDateStr);
            const now = new Date();
            const diffInMs = now.getTime() - pDate.getTime();
            weeksPassed = (diffInMs > 0) ? Math.floor(diffInMs / 604800000) : 0;
        } else {
            weeksPassed = hash % 15;
        }
        
        const growthRateRange = VOTE_CONFIG.weeklyGrowthMax - VOTE_CONFIG.weeklyGrowthMin;
        const weeklyGrowth = (hash % growthRateRange) + VOTE_CONFIG.weeklyGrowthMin;
        const growth = (weeksPassed * weeklyGrowth) + (hash % 10);
        const finalVotes = Math.min(baseCount + growth, dynamicMaxLimit);
        
        VOTE_CACHE[identifier] = finalVotes;
        return finalVotes;
    };
    
    const findAndUpdateVotes = () => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        
        scripts.forEach((script, scriptIndex) => {
            try {
                let data = JSON.parse(script.textContent);
                let modified = false;
                
                const traverseAndUpdate = (obj, path = '') => {
                    if (!obj || typeof obj !== 'object') return;
                    
                    if (obj.acceptedAnswer && typeof obj.acceptedAnswer === 'object') {
                        if (obj.acceptedAnswer.hasOwnProperty('upvoteCount')) {
                            const questionText = obj.text || (obj.name) || '';
                            const identifier = questionText + (obj.url || '') + scriptIndex;
                            const publishDate = obj.datePublished || null;
                            const votes = generateHybridVotes(identifier, publishDate);
                            
                            if (obj.acceptedAnswer.upvoteCount !== votes) {
                                obj.acceptedAnswer.upvoteCount = votes;
                                modified = true;
                                console.log(`✅ تم تحديث التصويتات: ${votes} للسؤال: ${questionText.substring(0, 50)}...`);
                            }
                        }
                    }
                    
                    if (Array.isArray(obj)) {
                        obj.forEach(item => traverseAndUpdate(item, path));
                    }
                    else {
                        Object.keys(obj).forEach(key => {
                            if (obj[key] && typeof obj[key] === 'object') {
                                traverseAndUpdate(obj[key], `${path}.${key}`);
                            }
                        });
                    }
                };
                
                traverseAndUpdate(data);
                
                if (modified) {
                    script.textContent = JSON.stringify(data, null, 2);
                }
            } catch(e) {
                console.warn('خطأ في معالجة السكيما:', e);
            }
        });
    };
    
    window.SeoTurboVotes = {
        generate: generateHybridVotes,
        config: VOTE_CONFIG,
        clearCache: () => {
            for (let key in VOTE_CACHE) delete VOTE_CACHE[key];
        },
        scanAndUpdate: findAndUpdateVotes  
    };
    
    const init = () => {
        setTimeout(() => {
            findAndUpdateVotes();
            console.log('🔍 SEOTurbo: تم مسح الصفحة وتحديث التصويتات');
        }, 500);
    };
    
    if (document.readyState === 'complete') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
    
})();
