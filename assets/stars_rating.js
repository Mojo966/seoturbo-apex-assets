var RATING_CONFIG = {
    minRating: 3.8,
    maxRating: 4.9,
    baseCountMin: 15,
    baseCountMax: 40,
    weeklyGrowthMin: 8,
    weeklyGrowthMax: 18,
    maxCount: 980
};

var ARTICLE_RATINGS_CACHE = {};

function getArticleUrlFromSchema(obj) {
    if (obj) {
        if (obj.url) {
            if (typeof obj.url === 'string') {
                if (obj.url.indexOf('http') === 0) {
                    return obj.url;
                }
            }
        }
        if (obj.item) {
            if (obj.item.url) {
                return obj.item.url;
            }
        }
        if (obj['@id']) {
            if (typeof obj['@id'] === 'string') {
                if (obj['@id'].indexOf('http') === 0) {
                    return obj['@id'];
                }
            }
        }
        if (obj.mainEntityOfPage) {
            if (obj.mainEntityOfPage['@id']) {
                return obj.mainEntityOfPage['@id'];
            }
        }
    }
    return null;
}

function getPublishedDateFromHTML() {
    var dataVault = document.getElementById('seoturbo-data-vault');
    if (dataVault) {
        var pubDate = dataVault.getAttribute('data-pub');
        if (pubDate) {
            return pubDate;
        }
    }
    var publishedDateElement = document.querySelector('.post-date, time.published, [itemprop="datePublished"]');
    if (publishedDateElement) {
        return publishedDateElement.getAttribute('datetime') || publishedDateElement.textContent;
    }
    return null;
}

function getPublishDateFromSchema(obj) {
    if (obj) {
        var dateFromHtml = getPublishedDateFromHTML();
        if (dateFromHtml) return dateFromHtml;

        if (obj.datePublished) return obj.datePublished;
        if (obj.dateCreated) return obj.dateCreated;
        if (obj.uploadDate) return obj.uploadDate;
    }
    return null;
}

function createHashFromUrl(url) {
    if (!url) return 0;
    var cleanUrl = url.toLowerCase().replace('https://', '').replace('http://', '').replace('www.', '').split('?')[0];
    var hash = 0;
    var i = 0;
    var len = cleanUrl.length;
    while (i != len) {
        hash = (hash * 31 + cleanUrl.charCodeAt(i)) | 0;
        i++;
    }
    return Math.abs(hash);
}

function generateHybridRating(articleIdentifier, publishDateStr) {
    if (ARTICLE_RATINGS_CACHE[articleIdentifier]) {
        return ARTICLE_RATINGS_CACHE[articleIdentifier];
    }
    var hash = createHashFromUrl(articleIdentifier);
    var ratingRange = (RATING_CONFIG.maxRating - RATING_CONFIG.minRating) * 10;
    var ratingValue = ((hash % ratingRange) / 10 + RATING_CONFIG.minRating).toFixed(1);
    var baseCountRange = RATING_CONFIG.baseCountMax - RATING_CONFIG.baseCountMin;
    var baseCount = (hash % baseCountRange) + RATING_CONFIG.baseCountMin;
    var weeksPassed = 0;
    if (publishDateStr) {
        var pDate = new Date(publishDateStr);
        var now = new Date();
        var diffInMs = now.getTime() - pDate.getTime();
        weeksPassed = (diffInMs > 0) ? Math.floor(diffInMs / 604800000) : 0;
    } else {
        weeksPassed = hash % 20;
    }
    var growthRateRange = RATING_CONFIG.weeklyGrowthMax - RATING_CONFIG.weeklyGrowthMin;
    var articleWeeklyGrowth = (hash % growthRateRange) + RATING_CONFIG.weeklyGrowthMin;
    var growth = (weeksPassed * articleWeeklyGrowth) + (hash % 10);
    var calculatedCount = baseCount + growth;
    var finalCount = Math.min(calculatedCount, RATING_CONFIG.maxCount);
    var ratingData = {
        ratingValue: parseFloat(ratingValue),
        ratingCount: parseInt(finalCount, 10)
    };
    ARTICLE_RATINGS_CACHE[articleIdentifier] = ratingData;
    return ratingData;
}

function findAndUpdateRatings(obj, parentObj) {
    if (obj === null) return;
    if (typeof obj !== 'object') return;
    
    if (obj.aggregateRating) {
        if (obj.aggregateRating['@type'] === 'AggregateRating') {
            var articleUrl = getArticleUrlFromSchema(obj) || getArticleUrlFromSchema(parentObj);
            if (!articleUrl) {
                articleUrl = window.location.href;
            }
            var pubDate = getPublishDateFromSchema(obj) || getPublishDateFromSchema(parentObj);
            var ratingData = generateHybridRating(articleUrl, pubDate);
            obj.aggregateRating.ratingValue = ratingData.ratingValue;
            obj.aggregateRating.ratingCount = ratingData.ratingCount;
            obj.aggregateRating.bestRating = "5";
            obj.aggregateRating.worstRating = "1";
        }
    }
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            var value = obj[key];
            if (value !== null) {
                if (typeof value === 'object') {
                    findAndUpdateRatings(value, obj);
                }
            }
        }
    }
}

function updateAllSchemaRatings() {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    var j = 0;
    var sLen = scripts.length;
    while (j != sLen) {
        try {
            var data = JSON.parse(scripts[j].textContent);
            findAndUpdateRatings(data, null);
            scripts[j].textContent = JSON.stringify(data, null, 2);
        } catch (e) {}
        j++;
    }
}

function initializeRatingScript() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            setTimeout(updateAllSchemaRatings, 100);
        });
    } else {
        setTimeout(updateAllSchemaRatings, 100);
    }
    setTimeout(updateAllSchemaRatings, 3000);
}
initializeRatingScript();
