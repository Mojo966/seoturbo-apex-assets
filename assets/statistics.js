(function() {
    'use strict';
    window.ST_StatsEngine = {
        _hash: function(str) {
            let hash = 0;
            if (!str) return hash;
            for (let i = 0; i < str.length; i++) {
                const char = str.charCodeAt(i);
                hash = ((hash << 5) - hash) + char;
                hash = hash & hash;
            }
            return Math.abs(hash);
        },
        _getAgeInHours: function(pubDateRaw) {
            if (!pubDateRaw) return 1;
            const diffMs = new Date() - new Date(pubDateRaw);
            return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));
        },
        _formatNumber: function(num) {
            if (num < 1000) return num.toString();
            if (num < 10000) return (num / 1000).toFixed(1) + 'k';
            if (num < 100000) return (num / 1000).toFixed(1) + 'k';
            return Math.floor(num / 1000) + 'k';
        },
        getStats: function(postId, title, pubDateRaw) {
            const fingerprintBase = (title || '') + (pubDateRaw || '').split('T')[0];
            const fingerprint = this._hash(fingerprintBase);
            const saltViews = (fingerprint % 35) + 8;
            const diffHours = this._getAgeInHours(pubDateRaw);
            let views;
            const growthFactor = 1 + (Math.log(diffHours + 1) / 50);
            if (diffHours < 1) {
                views = saltViews + 5;
            } else if (diffHours < 6) {
                views = Math.floor(diffHours * (6 + (saltViews / 25))) + (saltViews * 2);
            } else if (diffHours < 24) {
                views = Math.floor(diffHours * 4) + (saltViews * 3);
            } else if (diffHours < 168) {
                const diffDays = diffHours / 24;
                views = Math.floor(diffDays * (100 + (saltViews / 4))) + (saltViews * 4);
            } else {
                const diffDays = diffHours / 24;
                views = Math.floor(diffDays * (75 + (saltViews / 6))) + (saltViews * 5);
            }
            views = Math.floor(views * growthFactor);
            const viewsFactor = Math.pow(views, 0.7);
            const ageFactor = Math.pow(diffHours, 0.3);
            let shares = Math.floor((viewsFactor * ageFactor) / 15);
            const randomFactor = (fingerprint % 20) / 100;
            shares = Math.floor(shares * (1 + randomFactor));
            shares = Math.max(shares, Math.floor(diffHours / 12) + 1);
            let minLive, maxLive;
            if (diffHours < 24) {
                minLive = 5;
                maxLive = Math.min(50, Math.floor(views * 0.35));
            } else if (diffHours < 168) {
                minLive = 10;
                maxLive = Math.min(100, Math.floor(views * 0.25));
            } else {
                minLive = 15;
                maxLive = Math.min(150, Math.floor(views * 0.15));
            }
            minLive = Math.max(minLive, 3);
            maxLive = Math.max(minLive + 5, maxLive);
            const now = new Date();
            const timeSeed = now.getMinutes() + (now.getHours() * 60);
            const randomLiveValue = (fingerprint + timeSeed) % (maxLive - minLive + 1);
            let activeNow = minLive + randomLiveValue;
            activeNow = Math.min(activeNow, views);
            return {
                views: views,
                formattedViews: this._formatNumber(views),
                shares: shares,
                formattedShares: this._formatNumber(shares),
                activeNow: activeNow
            };
        }
    };
})();
