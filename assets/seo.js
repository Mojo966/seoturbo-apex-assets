
// MODULE 26
function processHomepageFeed(json) {
    if (json && json.feed && json.feed.entry && json.feed.entry.length > 0) {

        var vault = document.getElementById('homepage-identity-vault');
        var blogName = (vault && vault.getAttribute('data-name')) ? vault.getAttribute('data-name') : "إسم الموقع";
        
        var siteUrl = window.location.origin;
        
        var headerImg = document.querySelector('.header-widget img, #Header1_headerimg, .seoturbo-site-logo img, .seoturbo-site-management img');
        var publisherLogoUrl = headerImg ? headerImg.src : "";
        
        var logoWidth = 300, logoHeight = 100;
        if (headerImg && headerImg.naturalWidth > 0) {
            logoWidth = headerImg.naturalWidth;
            logoHeight = headerImg.naturalHeight;
        } else if (headerImg && headerImg.width) {
            logoWidth = headerImg.width;
            logoHeight = headerImg.height;
        }
        
        var siteTypeMeta = document.querySelector('meta[name="site-type"]');
        var rawSiteType = (siteTypeMeta && siteTypeMeta.content.trim() !== "") ? siteTypeMeta.content.trim() : "Organization";
        var publisherType = (rawSiteType === "NewsMediaOrganization") ? "NewsMediaOrganization" : "Organization";
        
        var SNIPPET_MAX_LENGTH = 310;

        function optimizeBloggerImage(currentSrc) {
            if (currentSrc && (currentSrc.indexOf('bp.blogspot.com') > -1 || currentSrc.indexOf('googleusercontent.com') > -1)) {
                return currentSrc.replace(/\/(s\d+|w\d+-h\d+|w\d+)(-[^/]*)*\//, '/w1200-h630-p-k-no-nu-rw-l50/').replace(/\.(jpe?g|png|gif|bmp)(\?.*)?$/i, '.webp');
            }
            return currentSrc;
        }

        function convertToCustomISO(dateString) {
            try { var date = new Date(dateString); return date.toISOString().replace(/(\.\d{3})?Z$/, '+02:00'); } catch (e) { return new Date().toISOString(); }
        }

        function getRealAboutMe(postId, blogTitle) {
            var authorBio = document.querySelector('.author-desc')?.textContent?.trim();
            if (authorBio && authorBio !== "") return authorBio;
            if (window.authorBios && window.authorBios[postId] && window.authorBios[postId] !== "") return window.authorBios[postId];
            return "كاتب ومحرر في موقع " + blogTitle + " | شغوف بمشاركة المعرفة وتقديم محتوى متميز يضيف قيمة حقيقية للقارئ.";
        }

        function extractQAFromSchema(rawContent) {
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = rawContent;
            var qaScript = tempDiv.querySelector('#qaData');
            if (!qaScript) return "";
            try {
                var qaData = JSON.parse(qaScript.textContent);
                var qaText = "\n\nأسئلة متعلقة بالموضوع:\n";
                var questions = (qaData.hasPart || []).concat(qaData.mainEntity ? [qaData.mainEntity] : []);
                questions.forEach(function(q) {
                    if (q.text) qaText += "سؤال: " + q.text.trim() + "\nجواب: " + (q.acceptedAnswer?.text || "") + "\n\n";
                });
                return qaText.trim();
            } catch (e) { return ""; }
        }

        function getArticleBodyFromContent(rawContent) {
            if (!rawContent) return "";
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = rawContent;
            tempDiv.querySelectorAll('svg, script, style, i, img').forEach(function(el) { el.remove(); });

            var unwanted = '.author-posts, .seoterbo-frame-container, .post-share-section, .seoturbo-Linked-blogs-Dual-Module-Container, .cooking-table, .HowTo-table, .author-pro-box, .post-labels, .post-tages-names, .seoturbo-related-link-box, .topcs7v, .commentsection, .seoturbo-readingalso, .seoturbo-posts1, .seoturbo-admin-tool, .post-actions-row, .seoturbo-breadcrumb-wrapper';
            
            var bodyText = '';
            var contentElements = tempDiv.querySelectorAll('p, h2, h3, h4, h5, h6, li, blockquote, table');
            
            for (var i = 0; i < contentElements.length; i++) {
                if (!contentElements[i].closest(unwanted)) {
                    var text = contentElements[i].textContent.trim();
                    if (text) bodyText += text + '\n\n';
                }
            }
            
            var qaText = extractQAFromSchema(rawContent);
            if (qaText) {
                bodyText += "\n\n" + qaText;
            }
            
            return bodyText.trim().replace(/\n\n+/g, '\n\n');
        }

        function getFinalKeywords(rawContent, articleSectionValue) {
            if (!rawContent) return articleSectionValue;
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = rawContent;
            
            var manualScript = tempDiv.querySelector('script#manual-keywords');
            if (manualScript) { 
                try { 
                    var kwData = JSON.parse(manualScript.textContent); 
                    if (kwData && kwData.keywords) return kwData.keywords.trim(); 
                } catch (e) {} 
            }
            
            var internalMeta = tempDiv.querySelector('meta[name="keywords"]');
            if (internalMeta) { 
                var metaContent = internalMeta.getAttribute('content'); 
                if (metaContent) return metaContent.trim(); 
            }
            
            return articleSectionValue;
        }

        function extractVideoDataFromPost(postBodyDiv, datePublished, articleHeadline, articleDescription) {
            if (!postBodyDiv) return null;
            var youtubeIframe = postBodyDiv.querySelector('iframe[src*="youtube.com/embed/"]');
            if (youtubeIframe) {
                var vIdMatch = youtubeIframe.getAttribute('src').match(/embed\/([^?]+)/);
                if (vIdMatch && vIdMatch[1]) {
                    return { 
                        "@type": "VideoObject", 
                        "name": youtubeIframe.getAttribute('title') || articleHeadline, 
                        "description": articleDescription.substring(0,150), 
                        "thumbnailUrl": "https://i.ytimg.com/vi/" + vIdMatch[1] + "/maxresdefault.jpg", 
                        "contentUrl": "https://www.youtube.com/watch?v=" + vIdMatch[1], 
                        "embedUrl": youtubeIframe.getAttribute('src'), 
                        "uploadDate": datePublished 
                    };
                }
            }
            return null;
        }

        function extractRecipeData(postBodyDiv, cleanUrl, finalImage) {
            var details = { recipeYield: "4 أشخاص", recipeIngredients: [], recipeInstructions: [], recipePrepTime: "15", recipeCookTime: "30", recipeCalories: null };
            if (!postBodyDiv) return details;
            
            postBodyDiv.querySelectorAll('.main-table, .cooking-table, .HowTo-table, table').forEach(function(table) {
                var headerText = table.querySelector('thead')?.textContent || "";
                
                if (headerText.indexOf('المكون') > -1 || headerText.indexOf('المقادير') > -1) { 
                    table.querySelectorAll('tbody tr').forEach(row => { 
                        var cells = row.querySelectorAll('td'); 
                        if (cells.length >= 2) {
                            var ingredient = cells[0].textContent.trim() + ' - ' + cells[1].textContent.trim();
                            if (ingredient && !ingredient.includes('---')) {
                                details.recipeIngredients.push(ingredient);
                            }
                        }
                    });
                } 
                else if (headerText.indexOf('الشرح') > -1 || headerText.indexOf('الطريقة') > -1) { 
                    table.querySelectorAll('tbody tr').forEach((row, index) => { 
                        var cells = row.querySelectorAll('td'); 
                        if (cells.length >= 3) {
                            var stepName = cells[1]?.textContent?.trim() || 'الخطوة ' + (index + 1);
                            var stepText = cells[2]?.textContent?.trim() || cells[1]?.textContent?.trim() || '';
                            if (stepText) {
                                details.recipeInstructions.push({ 
                                    "@type": "HowToStep", 
                                    "name": stepName, 
                                    "text": stepText, 
                                    "url": cleanUrl + '#step' + (index + 1), 
                                    "image": finalImage 
                                });
                            }
                        } else if (cells.length >= 2) {
                            details.recipeInstructions.push({ 
                                "@type": "HowToStep", 
                                "name": 'الخطوة ' + (index + 1), 
                                "text": cells[0].textContent.trim() + ' - ' + cells[1].textContent.trim(), 
                                "url": cleanUrl + '#step' + (index + 1), 
                                "image": finalImage 
                            });
                        }
                    });
                }
                else if (headerText.indexOf('المدة') > -1 || headerText.indexOf('الوقت') > -1) {
                    table.querySelectorAll('tbody tr').forEach(row => {
                        var cells = row.querySelectorAll('td');
                        if (cells.length >= 2) {
                            if (cells[0].textContent.includes('تحضير')) {
                                var prepMatch = cells[1].textContent.match(/\d+/);
                                if (prepMatch) details.recipePrepTime = prepMatch[0];
                            }
                            if (cells[0].textContent.includes('طهي') || cells[0].textContent.includes('طبخ')) {
                                var cookMatch = cells[1].textContent.match(/\d+/);
                                if (cookMatch) details.recipeCookTime = cookMatch[0];
                            }
                        }
                    });
                }
                else if (headerText.indexOf('السعرات') > -1) {
                    table.querySelectorAll('tbody tr').forEach(row => {
                        var cells = row.querySelectorAll('td');
                        if (cells.length >= 2 && cells[0].textContent.includes('السعرات')) {
                            details.recipeCalories = cells[1].textContent.trim();
                        }
                    });
                }
            });
            
            return details;
        }

        function extractHowToData(postBodyDiv) {
            var steps = [];
            if (!postBodyDiv) return null;
            var howToTable = postBodyDiv.querySelector('.HowTo-table');
            if (howToTable) {
                howToTable.querySelectorAll('tbody tr').forEach(function(row) {
                    var cell = row.querySelector('td:first-child');
                    if (cell) steps.push({ "@type": "HowToStep", "text": cell.textContent.trim() });
                });
                if (steps.length > 0) return { "@type": "HowTo", "step": steps, "aggregateRating": { "@type": "AggregateRating", "ratingValue": 3.8, "ratingCount": 15 } };
            }
            return null;
        }

        function extractSpeakableText(articleBodyText) {
            if (!articleBodyText || articleBodyText.length < 100) return '';
            
            var sentences = articleBodyText.split(/[.!?؟!]\s+/);
            var extractedText = '';
            var wordCount = 0;
            var maxWords = 200;
            var maxSentences = 5;
            
            for (var s = 0; s < Math.min(sentences.length, maxSentences * 2); s++) {
                var sentence = sentences[s].trim();
                if (sentence.length < 20) continue;
                
                var sentenceWords = sentence.split(/\s+/).length;
                if (wordCount + sentenceWords <= maxWords) {
                    extractedText += sentence + '. ';
                    wordCount += sentenceWords;
                } else {
                    var remaining = maxWords - wordCount;
                    if (remaining > 5) {
                        var truncatedWords = sentence.split(/\s+/).slice(0, remaining).join(' ');
                        extractedText += truncatedWords + '... ';
                    }
                    break;
                }
                if (s + 1 >= maxSentences && wordCount > 80) break;
            }
            
            return extractedText.length > 0 ? extractedText.substring(0, 2000) : '';
        }

        var schemaObjects = [];

        json.feed.entry.forEach(function(item) {
            var headline = item.title ? item.title.$t : blogName;
            var postUrl = item.link.find(function(link) { return link.rel === 'alternate'; })?.href;
            if (!postUrl) return;

            var postId = item.id.$t.split('post-')[1];
            var rawContent = item.content ? item.content.$t : '';
            var articleBody = getArticleBodyFromContent(rawContent);
            var wordCount = articleBody.split(/\s+/).length;
            var summary = articleBody.substring(0, SNIPPET_MAX_LENGTH) + '...';
            var postBodyDiv = document.createElement('div'); postBodyDiv.innerHTML = rawContent;

            var datePublished = convertToCustomISO(item.published.$t);
            var dateModified = convertToCustomISO(item.updated.$t);
            
            var authorName = item.author[0].name.$t;
            var authorUri = item.author[0].uri ? item.author[0].uri.$t : siteUrl;
            var fullBio = getRealAboutMe(postId, blogName);
            var jobTitle = "كاتب ومحرر محتوى", bioDesc = fullBio;
            if (fullBio.indexOf('|') > -1) { var parts = fullBio.split('|'); jobTitle = parts[0].trim(); bioDesc = parts[1].trim(); }

            var authorObject = { "@type": "Person", "name": authorName, "url": authorUri, "jobTitle": jobTitle, "description": bioDesc };

            var rawCategory = item.category ? item.category[0].term : 'موضوعات';
            var translatedCategory = window.seoturbo_translate_label ? window.seoturbo_translate_label(rawCategory) : rawCategory;
            var articleSection = translatedCategory;
            var schemaKeywords = getFinalKeywords(rawContent, articleSection);

            var imageUrl = item.media$thumbnail ? optimizeBloggerImage(item.media$thumbnail.url) : publisherLogoUrl;
            var videoObject = extractVideoDataFromPost(postBodyDiv, datePublished, headline, summary);
            
            var isRecipe = rawContent.includes('cooking-table');
            
            var articleType = 'BlogPosting'; 
            if (isRecipe) {
                articleType = 'Recipe';
            } else if (rawSiteType === 'TechnologyOrganization') {
                articleType = 'TechArticle';
            } else if (rawSiteType === 'NewsMediaOrganization') {
                articleType = 'NewsArticle';
            }

            var schemaData;

            if (articleType === 'Recipe') {
                var r = extractRecipeData(postBodyDiv, postUrl, imageUrl);
                schemaData = {
                    "@type": "Recipe", 
                    "name": headline, 
                    "headline": headline, 
                    "url": postUrl, 
                    "image": imageUrl,
                    "datePublished": datePublished, 
                    "dateModified": dateModified, 
                    "description": summary,
                    "author": authorObject, 
                    "recipeCategory": translatedCategory, 
                    "recipeCuisine": translatedCategory,
                    "recipeYield": r.recipeYield || "تكفي لعدة أشخاص", 
                    "keywords": schemaKeywords,
                    "prepTime": "PT" + (parseInt(r.recipePrepTime) || 15) + "M", 
                    "cookTime": "PT" + (parseInt(r.recipeCookTime) || 30) + "M",
                    "recipeIngredient": r.recipeIngredients.length > 0 ? r.recipeIngredients : ["انظر رابط الوصفة للمكونات"],
                    "recipeInstructions": r.recipeInstructions.length > 0 ? r.recipeInstructions : [{"@type":"HowToStep","name":"التحضير","text":"اتبع الخطوات في المقال"}],
                    "nutrition": { "@type": "NutritionInformation", "calories": r.recipeCalories || "250 kcal" },
                    "aggregateRating": { "@type": "AggregateRating", "ratingValue": 3.8, "ratingCount": 15 },
                    "video": videoObject || { 
                        "@type": "VideoObject", 
                        "name": headline, 
                        "description": summary, 
                        "thumbnailUrl": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj-hHIGluqSFnzzMB0MjtZalZl8azhcmY8kAJ06bBYTZzMLme38sT0igdo2-aWCE2ChKUEVI7ja6DK9BfGYlOQhqrQMRkDQuocWLMPCeQwyg-IbpWPuHXJGIBGo9z2_j1hADi924RPo6AJhpJry065PFl0Nt_rqJd4YsNihj5hW9qg4ENvyovw5nuEJCLK/s16000-rw/kitchen-bngr-recipes.webp", 
                        "contentUrl": "https://www.youtube.com/watch?v=0d930p5uPog", 
                        "embedUrl": "https://www.youtube.com/embed/0d930p5uPog", 
                        "uploadDate": datePublished, 
                        "duration": "PT1M10S" 
                    },
                    "publisher": { 
                        "@type": publisherType, 
                        "name": blogName, 
                        "logo": { 
                            "@type": "ImageObject", 
                            "url": publisherLogoUrl, 
                            "width": logoWidth, 
                            "height": logoHeight 
                        } 
                    }
                };
            } else {
                schemaData = {
                    "@type": articleType, 
                    "headline": headline, 
                    "url": postUrl, 
                    "image": [imageUrl],
                    "datePublished": datePublished, 
                    "dateModified": dateModified, 
                    "description": summary,
                    "articleBody": articleBody, 
                    "wordCount": wordCount, 
                    "articleSection": translatedCategory, 
                    "keywords": schemaKeywords,
                    "author": authorObject,
                    "publisher": { 
                        "@type": publisherType, 
                        "name": blogName, 
                        "logo": { 
                            "@type": "ImageObject", 
                            "url": publisherLogoUrl, 
                            "width": logoWidth, 
                            "height": logoHeight 
                        } 
                    }
                };
                if (videoObject) schemaData.video = videoObject;
                var howTo = extractHowToData(postBodyDiv);
                if (howTo) { 
                    howTo.name = headline; 
                    howTo.description = summary; 
                    howTo.image = imageUrl; 
                    schemaData.mainEntity = howTo; 
                }
                
                var speakableTextValue = extractSpeakableText(articleBody);
                if (speakableTextValue && speakableTextValue.length > 0) {
                    schemaData.speakable = {
                        "@type": "SpeakableSpecification",
                        "xpath": [
                            "/html/head/meta[@name='description']/@content"
                        ],
                        "value": speakableTextValue
                    };
                }
            }
            schemaData.mainEntityOfPage = { "@type": "WebPage", "@id": postUrl };
            
            schemaObjects.push(schemaData);
        });

        if (schemaObjects.length > 0) {
            var script = document.createElement('script');
            script.type = 'application/ld+json';
            script.text = JSON.stringify({ "@context": "https://schema.org", "@graph": schemaObjects });
            document.head.appendChild(script);
        }
    }
}
document.addEventListener('DOMContentLoaded', function() {
    var feedUrl = window.location.origin + '/feeds/posts/default?alt=json-in-script&max-results=10&callback=processHomepageFeed';
    var script = document.createElement('script'); 
    script.src = feedUrl; 
    document.body.appendChild(script);
});

// MODULE 27
(function() {
    'use strict';
    
    document.addEventListener('DOMContentLoaded', function() {

        function isRecipePage() {
            var postBody = document.querySelector('.post-body');
            if (!postBody) return false;
            
            var hasCookingTable = postBody.querySelector('.cooking-table') !== null;
            var postText = postBody.textContent || postBody.innerText;
            var hasIngredientsTable = postText.includes('جدول المقادير');
            
            if (!hasCookingTable && !hasIngredientsTable) {
                return false;
            }
            return true;
        }

        if (!isRecipePage()) {
            return;
        }

        var identityVault = document.getElementById('homepage-identity-vault');
        var blogName = (identityVault && identityVault.getAttribute('data-name')) ? 
                       identityVault.getAttribute('data-name') : "إسم الموقع";
        
        var postVault = document.getElementById('seoturbo-data-vault');
        if (!postVault) {
            return;
        }
        
        var datePublished = postVault.getAttribute('data-pub') || new Date().toISOString();
        var dateModified = postVault.getAttribute('data-mod') || datePublished;
        var rawTitle = postVault.getAttribute('data-title') || document.title;
        var rawLabel = postVault.getAttribute('data-label') || "وصفات";
        
        var translatedLabel = window.seoturbo_translate_label ? window.seoturbo_translate_label(rawLabel) : rawLabel;

        var siteUrl = window.location.origin;
        var postUrl = window.location.href.split(/[?#]/)[0];
        
        var headerImg = document.querySelector('.header-widget img, #Header1_headerimg, .seoturbo-site-logo img, .seoturbo-site-management img');
        var publisherLogoUrl = headerImg ? headerImg.src : "";

        function optimizeBloggerImage(currentSrc) {
            if (currentSrc && (currentSrc.indexOf('bp.blogspot.com') > -1 || currentSrc.indexOf('googleusercontent.com') > -1)) {
                return currentSrc.replace(/\/(s\d+|w\d+-h\d+|w\d+)(-[^/]*)*\//, '/w1200-h630-p-k-no-nu-rw-l50/').replace(/\.(jpe?g|png|gif|bmp)(\?.*)?$/i, '.webp');
            }
            return currentSrc;
        }
        publisherLogoUrl = optimizeBloggerImage(publisherLogoUrl);

        var logoWidth = 300, logoHeight = 100;
        if (headerImg && headerImg.naturalWidth > 0) {
            logoWidth = headerImg.naturalWidth;
            logoHeight = headerImg.naturalHeight;
        }

        var siteTypeMeta = document.querySelector('meta[name="site-type"]');
        var rawSiteType = (siteTypeMeta && siteTypeMeta.content.trim() !== "") ? siteTypeMeta.content.trim() : "Organization";
        var publisherType = (rawSiteType === "NewsMediaOrganization") ? "NewsMediaOrganization" : "Organization";

        function convertToCustomISO(dateString) {
            try { var date = new Date(dateString); return date.toISOString().replace(/(\.\d{3})?Z$/, '+02:00'); } catch (e) { return new Date().toISOString(); }
        }
        datePublished = convertToCustomISO(datePublished);
        dateModified = convertToCustomISO(dateModified);

        function getRealAboutMe() {
            var descEl = document.querySelector('.author-desc, .author-pro-box .description');
            var authorDesc = descEl ? (descEl.textContent || descEl.innerText || '').trim() : '';
            if (authorDesc) return authorDesc;
            return "كاتب ومحرر في موقع " + blogName + " | شغوف بمشاركة المعرفة وتقديم محتوى متميز يضيف قيمة حقيقية للقارئ في مختلف المجالات.";
        }

        function buildAuthorObject() {
            var nameEl = document.querySelector('.seoterbo-title-writer-name, .author-name, .post-author');
            var authorName = nameEl ? (nameEl.textContent || nameEl.innerText || '').trim() : blogName;
            var uriEl = document.querySelector('.authornameurl a, .author-profile a');
            var authorUri = uriEl ? uriEl.href : siteUrl;
            var fullBio = getRealAboutMe();
            var jobTitle = "كاتب ومحرر محتوى", bioDesc = fullBio;
            if (fullBio.indexOf('|') > -1) { var parts = fullBio.split('|'); jobTitle = parts[0].trim(); bioDesc = parts[1].trim(); }

            var authorObject = { "@type": "Person", "name": authorName, "url": authorUri, "jobTitle": jobTitle, "description": bioDesc };
            var authImg = document.querySelector('.seoterbo-title-writer-img, .author-avatar img');
            if (authImg && authImg.src) authorObject.image = optimizeBloggerImage(authImg.src);
            return authorObject;
        }

        function getMainImage() {
            var postImg = document.querySelector('.post-body img:not(.seoterbo-frame-img):not(.author-img)');
            if (postImg && postImg.src) return optimizeBloggerImage(postImg.src);
            return publisherLogoUrl;
        }

        function extractVideoData() {
            var postBody = document.querySelector('.post-body');
            if (!postBody) return null;
            var youtubeIframe = postBody.querySelector('iframe[src*="youtube.com/embed/"]');
            if (youtubeIframe) {
                var vIdMatch = youtubeIframe.getAttribute('src').match(/embed\/([^?]+)/);
                if (vIdMatch && vIdMatch[1]) {
                    return { 
                        "@type": "VideoObject", 
                        "name": youtubeIframe.getAttribute('title') || rawTitle, 
                        "description": rawTitle, 
                        "thumbnailUrl": "https://i.ytimg.com/vi/" + vIdMatch[1] + "/maxresdefault.jpg", 
                        "contentUrl": "https://www.youtube.com/watch?v=" + vIdMatch[1], 
                        "embedUrl": youtubeIframe.getAttribute('src'), 
                        "uploadDate": datePublished 
                    };
                }
            }
            return null;
        }

        function extractRecipeData(finalImage) {
            var details = { 
                recipeYield: "4 أشخاص", 
                recipeIngredients: [], 
                recipeInstructions: [], 
                recipePrepTime: "15", 
                recipeCookTime: "30", 
                recipeCalories: "250 kcal" 
            };
            
            var postBody = document.querySelector('.post-body');
            if (!postBody) return details;

            postBody.querySelectorAll('.main-table, .cooking-table, .HowTo-table, table').forEach(function(table) {
                var headerText = table.querySelector('thead')?.textContent || "";
                
                if (headerText.indexOf('المكون') > -1 || headerText.indexOf('المقادير') > -1) { 
                    table.querySelectorAll('tbody tr').forEach(row => { 
                        var cells = row.querySelectorAll('td'); 
                        if (cells.length >= 2) {
                            var ingredient = cells[0].textContent.trim() + ' - ' + cells[1].textContent.trim();
                            if (ingredient && !ingredient.includes('---')) {
                                details.recipeIngredients.push(ingredient);
                            }
                        }
                    });
                } 
                else if (headerText.indexOf('الشرح') > -1 || headerText.indexOf('الطريقة') > -1) { 
                    table.querySelectorAll('tbody tr').forEach((row, index) => { 
                        var cells = row.querySelectorAll('td'); 
                        if (cells.length >= 3) {
                            var stepName = cells[1]?.textContent?.trim() || 'الخطوة ' + (index + 1);
                            var stepText = cells[2]?.textContent?.trim() || cells[1]?.textContent?.trim() || '';
                            if (stepText) {
                                details.recipeInstructions.push({ 
                                    "@type": "HowToStep", 
                                    "name": stepName, 
                                    "text": stepText, 
                                    "url": postUrl + '#step' + (index + 1), 
                                    "image": finalImage 
                                });
                            }
                        } else if (cells.length >= 2) {
                            details.recipeInstructions.push({ 
                                "@type": "HowToStep", 
                                "name": 'الخطوة ' + (index + 1), 
                                "text": cells[0].textContent.trim() + ' - ' + cells[1].textContent.trim(), 
                                "url": postUrl + '#step' + (index + 1), 
                                "image": finalImage 
                            });
                        }
                    });
                }
                else if (headerText.indexOf('المدة') > -1 || headerText.indexOf('الوقت') > -1) {
                    table.querySelectorAll('tbody tr').forEach(row => {
                        var cells = row.querySelectorAll('td');
                        if (cells.length >= 2) {
                            if (cells[0].textContent.includes('تحضير')) {
                                var prepMatch = cells[1].textContent.match(/\d+/);
                                if (prepMatch) details.recipePrepTime = prepMatch[0];
                            }
                            if (cells[0].textContent.includes('طهي') || cells[0].textContent.includes('طبخ')) {
                                var cookMatch = cells[1].textContent.match(/\d+/);
                                if (cookMatch) details.recipeCookTime = cookMatch[0];
                            }
                        }
                    });
                }
                else if (headerText.indexOf('السعرات') > -1) {
                    table.querySelectorAll('tbody tr').forEach(row => {
                        var cells = row.querySelectorAll('td');
                        if (cells.length >= 2 && cells[0].textContent.includes('السعرات')) {
                            details.recipeCalories = cells[1].textContent.trim();
                        }
                    });
                }
            });

            if (details.recipeIngredients.length === 0) {
                var ingredientElements = postBody.querySelectorAll('h3, h4, p strong');
                ingredientElements.forEach(function(el) {
                    if (el.textContent.includes('المكونات') || el.textContent.includes('المقادير')) {
                        var nextEl = el.nextElementSibling;
                        if (nextEl && nextEl.tagName === 'UL') {
                            nextEl.querySelectorAll('li').forEach(function(li) {
                                details.recipeIngredients.push(li.textContent.trim());
                            });
                        }
                    }
                });
            }

            return details;
        }

        var mainImage = getMainImage();
        var videoObject = extractVideoData();
        var recipeDetails = extractRecipeData(mainImage);
        var totalTime = parseInt(recipeDetails.recipePrepTime || 15) + parseInt(recipeDetails.recipeCookTime || 30);
        var authorObject = buildAuthorObject();

        var schemaData = {
            "@context": "https://schema.org",
            "@type": "Recipe",
            "name": rawTitle,
            "headline": rawTitle,
            "url": postUrl,
            "image": mainImage,
            "datePublished": datePublished,
            "dateModified": dateModified,
            "description": rawTitle + " - وصفة شهية وسهلة التحضير",
            "author": authorObject,
            "recipeCategory": translatedLabel,
            "recipeCuisine": translatedLabel,
            "recipeYield": recipeDetails.recipeYield || "تكفي لعدة أشخاص",
            "keywords": translatedLabel + "، وصفة، طبخ، مطبخ، طعام",
            "prepTime": "PT" + (parseInt(recipeDetails.recipePrepTime) || 15) + "M",
            "cookTime": "PT" + (parseInt(recipeDetails.recipeCookTime) || 30) + "M",
            "totalTime": "PT" + (totalTime || 45) + "M",
            "recipeIngredient": recipeDetails.recipeIngredients.length > 0 ? recipeDetails.recipeIngredients : ["انظر رابط الوصفة للمكونات"],
            "recipeInstructions": recipeDetails.recipeInstructions.length > 0 ? recipeDetails.recipeInstructions : [{"@type":"HowToStep","name":"التحضير","text":"اتبع الخطوات في المقال","url": postUrl + '#step1',"image": mainImage}],
            "nutrition": { 
                "@type": "NutritionInformation", 
                "calories": recipeDetails.recipeCalories || "250 kcal" 
            },
            "aggregateRating": { 
                "@type": "AggregateRating", 
                "ratingValue": 3.8, 
                "ratingCount": 15 
            },
            "video": videoObject || { 
                "@type": "VideoObject", 
                "name": rawTitle, 
                "description": rawTitle, 
                "thumbnailUrl": "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEj-hHIGluqSFnzzMB0MjtZalZl8azhcmY8kAJ06bBYTZzMLme38sT0igdo2-aWCE2ChKUEVI7ja6DK9BfGYlOQhqrQMRkDQuocWLMPCeQwyg-IbpWPuHXJGIBGo9z2_j1hADi924RPo6AJhpJry065PFl0Nt_rqJd4YsNihj5hW9qg4ENvyovw5nuEJCLK/s16000-rw/kitchen-bngr-recipes.webp", 
                "contentUrl": "https://www.youtube.com/watch?v=0d930p5uPog", 
                "embedUrl": "https://www.youtube.com/embed/0d930p5uPog", 
                "uploadDate": datePublished,
                "duration": "PT1M10S"
            },
            "publisher": { 
                "@type": publisherType, 
                "name": blogName, 
                "logo": { 
                    "@type": "ImageObject", 
                    "url": publisherLogoUrl, 
                    "width": logoWidth, 
                    "height": logoHeight 
                } 
            },
            "mainEntityOfPage": { 
                "@type": "WebPage", 
                "@id": postUrl 
            }
        };

        var script = document.createElement('script');
        script.type = 'application/ld+json';
        script.text = JSON.stringify(schemaData);
        document.head.appendChild(script);
    });
})();

// MODULE 28
(function() {
    'use strict';
    
    function buildTranslationDictionary() {
        if (window.seoturbo_label_dictionary && Object.keys(window.seoturbo_label_dictionary).length > 0) {
            return;
        }
        window.seoturbo_label_dictionary = {};
        const menuLinks = document.querySelectorAll('#main-menu a[href*="/search/label/"], .main-menu a[href*="/search/label/"]');
        menuLinks.forEach(link => {
            try {
                const href = decodeURIComponent(link.getAttribute('href'));
                const match = href.match(/\/search\/label\/([^\/?#]+)/);
                if (match) {
                    const slug = match[1].toLowerCase().trim();
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = link.innerHTML.replace(/^_/, '').trim();
                    tempDiv.querySelectorAll('i, svg, img, span').forEach(el => el.remove());
                    const cleanText = tempDiv.textContent.trim();
                    if (slug && cleanText) {
                        window.seoturbo_label_dictionary[slug] = cleanText;
                    }
                }
            } catch(e) {}
        });
    }

    function translateLabel(label) {
        if (!label) return "موضوعات";
        const searchKey = label.toLowerCase().trim();
        if (window.seoturbo_label_dictionary && window.seoturbo_label_dictionary[searchKey]) {
            return window.seoturbo_label_dictionary[searchKey];
        }
        return label;
    }
    
    document.addEventListener('DOMContentLoaded', function() {

        function isRecipePage() {
            var postBody = document.querySelector('.post-body');
            if (!postBody) return false;
            if (postBody.querySelector('.cooking-table')) return true;
            var postText = postBody.textContent || postBody.innerText;
            if (postText.includes('جدول المقادير')) return true;
            return false;
        }

        if (isRecipePage()) {
            return;
        }

        buildTranslationDictionary();

        var vault = document.getElementById('homepage-identity-vault');
        var blogName = (vault && vault.getAttribute('data-name')) ? vault.getAttribute('data-name') : "إسم الموقع";
        
        var postVault = document.getElementById('seoturbo-data-vault');
        if (!postVault) return;
        
        var datePublished = postVault.getAttribute('data-pub') || new Date().toISOString();
        var dateModified = postVault.getAttribute('data-mod') || datePublished;
        var rawTitle = postVault.getAttribute('data-title') || document.title;
        var rawLabel = postVault.getAttribute('data-label') || "موضوعات";
        var authorUrl = postVault.getAttribute('data-author-url') || "";
        
        var translatedLabel = translateLabel(rawLabel);

        var siteUrl = window.location.origin;
        var postUrl = window.location.href.split(/[?#]/)[0];
        
        var headerImg = document.querySelector('.header-widget img, #Header1_headerimg, .seoturbo-site-logo img');
        var publisherLogoUrl = headerImg ? headerImg.src : "";
        
        var logoWidth = 300, logoHeight = 100;
        if (headerImg && headerImg.naturalWidth > 0) {
            logoWidth = headerImg.naturalWidth;
            logoHeight = headerImg.naturalHeight;
        } else if (headerImg && headerImg.width) {
            logoWidth = headerImg.width;
            logoHeight = headerImg.height;
        }
        
        var siteTypeMeta = document.querySelector('meta[name="site-type"]');
        var rawSiteType = (siteTypeMeta && siteTypeMeta.content.trim() !== "") ? siteTypeMeta.content.trim() : "Organization";
        var publisherType = (rawSiteType === "NewsMediaOrganization") ? "NewsMediaOrganization" : "Organization";
        
        var SNIPPET_MAX_LENGTH = 310;

        function optimizeBloggerImage(currentSrc) {
            if (currentSrc && (currentSrc.indexOf('bp.blogspot.com') > -1 || currentSrc.indexOf('googleusercontent.com') > -1)) {
                return currentSrc.replace(/\/(s\d+|w\d+-h\d+|w\d+)(-[^/]*)*\//, '/w1200-h630-p-k-no-nu-rw-l50/').replace(/\.(jpe?g|png|gif|bmp)(\?.*)?$/i, '.webp');
            }
            return currentSrc;
        }

        function convertToCustomISO(dateString) {
            try { var date = new Date(dateString); return date.toISOString().replace(/(\.\d{3})?Z$/, '+02:00'); } catch (e) { return new Date().toISOString(); }
        }
        datePublished = convertToCustomISO(datePublished);
        dateModified = convertToCustomISO(dateModified);

        function extractQAFromSchema() {
            var qaScript = document.getElementById('qaData');
            if (!qaScript) return "";
            try {
                var qaData = JSON.parse(qaScript.textContent);
                var qaText = "\n\nأسئلة متعلقة بالموضوع:\n";
                var questions = (qaData.hasPart || []).concat(qaData.mainEntity ? [qaData.mainEntity] : []);
                questions.forEach(function(q) {
                    if (q.text) qaText += "سؤال: " + q.text.trim() + "\nجواب: " + (q.acceptedAnswer?.text || "") + "\n\n";
                });
                return qaText.trim();
            } catch (e) { return ""; }
        }

        function getRealAboutMe() {
            var authorDesc = document.querySelector('.author-desc, .author-pro-box .description')?.textContent?.trim();
            if (authorDesc && authorDesc !== "") {
                return authorDesc;
            }
            return "كاتب ومحرر في موقع " + blogName + " | شغوف بمشاركة المعرفة وتقديم محتوى متميز يضيف قيمة حقيقية للقارئ في مختلف المجالات.";
        }

        function buildAuthorObject() {
            var authorName = document.querySelector('.seoterbo-title-writer-name, .author-name, .post-author')?.textContent?.trim() || blogName;
            
            var authorUri = authorUrl || siteUrl;

            var fullBio = getRealAboutMe();
            var jobTitle = "كاتب ومحرر محتوى", bioDesc = fullBio;
            if (fullBio.indexOf('|') > -1) { 
                var parts = fullBio.split('|'); 
                jobTitle = parts[0].trim(); 
                bioDesc = parts[1].trim(); 
            }

            var authorObject = { "@type": "Person", "name": authorName, "url": authorUri, "jobTitle": jobTitle, "description": bioDesc };
            var authImg = document.querySelector('.seoterbo-title-writer-img, .author-avatar img');
            if (authImg && authImg.src) authorObject.image = optimizeBloggerImage(authImg.src);
            return authorObject;
        }

        function getMainImage() {
            var postImg = document.querySelector('.post-body img:not(.seoterbo-frame-img):not(.author-img)');
            if (postImg && postImg.src) return optimizeBloggerImage(postImg.src);
            return publisherLogoUrl;
        }

        function getArticleBodyFromContent() {
            var postBody = document.querySelector('.post-body');
            if (!postBody) return "";
            
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = postBody.innerHTML;
            tempDiv.querySelectorAll('svg, script, style, i, img').forEach(function(el) { el.remove(); });
            
            var unwanted = '.author-posts, .seoterbo-frame-container, .post-share-section, .seoturbo-Linked-blogs-Dual-Module-Container, .cooking-table, .HowTo-table, .author-pro-box, .post-labels, .post-tages-names, .seoturbo-related-link-box, .topcs7v, .commentsection, .seoturbo-readingalso, .seoturbo-posts1, .seoturbo-admin-tool, .post-actions-row, .seoturbo-breadcrumb-wrapper';
            
            var bodyText = '';
            var contentElements = tempDiv.querySelectorAll('p, h2, h3, h4, h5, h6, li, blockquote, table');
            
            for (var i = 0; i < contentElements.length; i++) {
                if (!contentElements[i].closest(unwanted)) {
                    var text = contentElements[i].textContent.trim();
                    if (text) bodyText += text + '\n\n';
                }
            }
            
            var qaText = extractQAFromSchema();
            if (qaText) {
                bodyText += "\n\n" + qaText;
            }
            
            return bodyText.trim().replace(/\n\n+/g, '\n\n');
        }

        function extractVideoData() {
            var postBody = document.querySelector('.post-body');
            if (!postBody) return null;
            var youtubeIframe = postBody.querySelector('iframe[src*="youtube.com/embed/"]');
            if (youtubeIframe) {
                var vIdMatch = youtubeIframe.getAttribute('src').match(/embed\/([^?]+)/);
                if (vIdMatch && vIdMatch[1]) {
                    return { 
                        "@type": "VideoObject", 
                        "name": youtubeIframe.getAttribute('title') || rawTitle, 
                        "description": rawTitle.substring(0,150), 
                        "thumbnailUrl": "https://i.ytimg.com/vi/" + vIdMatch[1] + "/maxresdefault.jpg", 
                        "contentUrl": "https://www.youtube.com/watch?v=" + vIdMatch[1], 
                        "embedUrl": youtubeIframe.getAttribute('src'), 
                        "uploadDate": datePublished 
                    };
                }
            }
            return null;
        }

        function extractHowToData() {
            var steps = [];
            var postBody = document.querySelector('.post-body');
            if (!postBody) return null;
            
            var howToTable = postBody.querySelector('.HowTo-table');
            if (howToTable) {
                howToTable.querySelectorAll('tbody tr').forEach(function(row) {
                    var cell = row.querySelector('td:first-child');
                    if (cell) {
                        steps.push({ 
                            "@type": "HowToStep", 
                            "text": cell.textContent.trim() 
                        });
                    }
                });
                
                if (steps.length > 0) {
                    return { 
                        "@type": "HowTo", 
                        "step": steps, 
                        "aggregateRating": { 
                            "@type": "AggregateRating", 
                            "ratingValue": 3.8, 
                            "ratingCount": 15 
                        } 
                    };
                }
            }
            return null;
        }

        function getFinalKeywords() {
            var postBody = document.querySelector('.post-body');
            if (!postBody) return translatedLabel;
            
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = postBody.innerHTML;
            
            var manualScript = tempDiv.querySelector('script#manual-keywords');
            if (manualScript) { 
                try { 
                    var kwData = JSON.parse(manualScript.textContent); 
                    if (kwData && kwData.keywords) return kwData.keywords.trim(); 
                } catch (e) {} 
            }
            
            var internalMeta = tempDiv.querySelector('meta[name="keywords"]');
            if (internalMeta) { 
                var metaContent = internalMeta.getAttribute('content'); 
                if (metaContent) return metaContent.trim(); 
            }
            
            return translatedLabel;
        }

        var mainImage = getMainImage();
        var articleBody = getArticleBodyFromContent();
        var wordCount = articleBody.split(/\s+/).length;
        var summary = articleBody.substring(0, SNIPPET_MAX_LENGTH) + '...';
        var videoObject = extractVideoData();
        var authorObject = buildAuthorObject();
        var finalKeywords = getFinalKeywords();

        var articleType = 'BlogPosting'; 
        if (rawSiteType === 'TechnologyOrganization') {
            articleType = 'TechArticle';
        } else if (rawSiteType === 'NewsMediaOrganization') {
            articleType = 'NewsArticle';
        }

        var schemaData = {
            "@context": "https://schema.org",
            "@type": articleType,
            "headline": rawTitle,
            "url": postUrl,
            "image": [mainImage],
            "datePublished": datePublished,
            "dateModified": dateModified,
            "description": summary,
            "articleBody": articleBody,
            "wordCount": wordCount,
            "articleSection": translatedLabel,
            "keywords": finalKeywords,
            "author": authorObject,
            "publisher": { 
                "@type": publisherType, 
                "name": blogName, 
                "logo": { 
                    "@type": "ImageObject", 
                    "url": publisherLogoUrl, 
                    "width": logoWidth, 
                    "height": logoHeight 
                } 
            },
            "mainEntityOfPage": { 
                "@type": "WebPage", 
                "@id": postUrl 
            }
        };

        if (videoObject) {
            schemaData.video = videoObject;
        }

        var howToData = extractHowToData();
        if (howToData) {
            howToData.name = rawTitle;
            howToData.description = summary;
            howToData.image = mainImage;
            schemaData.mainEntity = howToData;
        }

        var oldScript = document.querySelector('script[data-st-article-schema]');
        if (oldScript) oldScript.remove();

        var script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-st-article-schema', 'true');
        script.text = JSON.stringify(schemaData);
        document.head.appendChild(script);
    });
})();

// MODULE 29
document.addEventListener('DOMContentLoaded', function() {
    function convertToISO8601(dateString) {
        if (!dateString) return null;
        try {
            var date = new Date(dateString);
            if (isNaN(date)) return null;
            var offset = 2 * 60 * 60 * 1000;
            var adjusted = new Date(date.getTime() + offset);
            return adjusted.toISOString().replace(/\.000Z$/, '+02:00');
        } catch (e) { return null; }
    }
    const identityVault = document.getElementById('homepage-identity-vault');
    const siteName = identityVault ? identityVault.getAttribute('data-name') : document.title.split(' - ')[0];
    const homepageUrl = window.location.origin;
    const headerLogo = document.querySelector('#Header1_headerimg, .header-widget img, .seoturbo-site-logo img');
    let logoUrl = headerLogo ? headerLogo.src : (document.querySelector('link[rel="icon"]')?.href || "");
    
    const rawSiteType = document.querySelector("meta[name='site-type']")?.getAttribute('content') || "Organization";
    const publisherType = (rawSiteType === "NewsMediaOrganization") ? "NewsMediaOrganization" : "Organization";
    const editorName = document.querySelector("meta[name='Editor-in-Chief']")?.getAttribute('content') || siteName;
    const editorUrl = document.querySelector("meta[name='Editor-in-Chief-url']")?.getAttribute('content') || homepageUrl;
    const pageDesc = document.querySelector("meta[name='description']")?.getAttribute('content') || ("اجابات الاسئلة الشائعة حول موقع " + siteName);
    const ogImage = document.querySelector("meta[property='og:image']")?.getAttribute('content') || logoUrl;
    const creationDateMeta = document.querySelector("meta[name='creationDate']")?.getAttribute('content');
    const finalDate = creationDateMeta ? convertToISO8601(creationDateMeta) : new Date().toISOString();
    
    const rawQuestions = [
      { q: "ما هي الخدمات التي يقدمها موقع " + siteName + "؟", a: "يقدم موقع " + siteName + " محتوى متنوع ومفيد في مجاله مع الحرص على تقديم معلومات دقيقة وحصرية للزوار" },
      { q: "هل المحتوى المنشور في " + siteName + " موثوق؟", a: "نعم نحن في " + siteName + " نحرص دائماً على التحقق من صحة المعلومات والمصادر لضمان تقديم أفضل تجربة للمستخدم" },
      { q: "هل تصفح موقع " + siteName + " مجاني؟", a: "نعم جميع الخدمات والمقالات المتوفرة على موقع " + siteName + " متاحة للزوار بشكل مجاني تماماً" },
      { q: "هل يدعم موقع " + siteName + " التصفح عبر الهاتف؟", a: "نعم تم تصميم موقع " + siteName + " ليكون متوافقاً مع جميع الأجهزة الذكية والهواتف المحمولة لتجربة تصفح سلسة" },
      { q: "كيف يمكنني التواصل مع إدارة " + siteName + "؟", a: "يمكنك التواصل معنا بسهولة عبر صفحة اتصل بنا الموجودة في الموقع لأي استفسارات أو اقتراحات" },
      { q: "هل يمكنني مشاركة المحتوى من " + siteName + "؟", a: "بالطبع ندعم ونشجع مشاركة المقالات والمحتوى المميز من " + siteName + " عبر منصات التواصل الاجتماعي المختلفة" }
    ];
    const mainEntityData = rawQuestions.map(item => ({
      "@type": "Question",
      "name": item.q,
      "acceptedAnswer": { "@type": "Answer", "text": item.a }
    }));
    const faqDataset = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "@id": homepageUrl + "#faqpage",
      "headline": "أسئلة شائعة حول موقع " + siteName,
      "name": "صفحة الأسئلة المتكررة لموقع " + siteName,
      "description": pageDesc,
      "datePublished": finalDate,
      "dateModified": finalDate,
      "image": { "@type": "ImageObject", "url": ogImage, "width": 1000, "height": 1000 },
      "author": {
        "@type": "Person",
        "name": editorName,
        "url": editorUrl
      },
      "publisher": {
        "@type": publisherType,
        "name": siteName,
        "url": homepageUrl,
        "logo": { "@type": "ImageObject", "url": logoUrl, "width": 300, "height": 100 }
      },
      "mainEntityOfPage": { "@type": "WebPage", "@id": homepageUrl },
      "mainEntity": mainEntityData
    };
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'seoturbo-faq-schema';
    const oldScript = document.getElementById('seoturbo-faq-schema');
    if (oldScript) { oldScript.remove(); }
    script.textContent = JSON.stringify(faqDataset);
    document.head.appendChild(script);
});

// MODULE 31
(function() {
    'use strict';
    
    var freeContainer = document.getElementById('seoturbo-qa-placeholder');
    if(freeContainer) freeContainer.remove();
    
    document.addEventListener('DOMContentLoaded', function() {
        const postBody = document.querySelector('.post-body.entry-content');
        if (!postBody) return;

        const dataVault = document.getElementById('seoturbo-data-vault');
        
        const getArticleInfo = () => {
            const headline = dataVault?.getAttribute('data-title') || document.title;
            const url = dataVault?.getAttribute('data-url') || window.location.href;
            const datePublished = dataVault?.getAttribute('data-pub') || new Date().toISOString();
            const dateModified = dataVault?.getAttribute('data-mod') || datePublished;
            const authorUrlFromVault = dataVault?.getAttribute('data-author-url') || '';
            
            const authorNameEl = document.querySelector('.seoterbo-title-writer-name');
            const authorRoleEl = document.querySelector('.seoterbo-title-writer-role');

            const authorName = authorNameEl?.textContent.trim() || 'تحرير الموقع';
            const authorUrl = authorUrlFromVault || window.location.origin;
            const authorJobTitle = authorRoleEl?.textContent.trim() || 'كاتب ومحرر محتوى';
            
            return { headline, url, datePublished, dateModified, author: { name: authorName, url: authorUrl, jobTitle: authorJobTitle } };
        };

        const populateAndGetQAData = () => {
            const qaScript = document.getElementById('qaData');
            if (!qaScript) return null;

            try {
                const articleData = getArticleInfo();
                let schemaString = qaScript.textContent;

                schemaString = schemaString.split('"__POST_DATE__"').join(JSON.stringify(articleData.datePublished));
                schemaString = schemaString.split('"__POST_MODIFIED_DATE__"').join(JSON.stringify(articleData.dateModified));
                schemaString = schemaString.split('"__AUTHOR_NAME__"').join(JSON.stringify(articleData.author.name.replace(/"/g, '\\"')));
                schemaString = schemaString.split('"__AUTHOR_URL__"').join(JSON.stringify(articleData.author.url));
                schemaString = schemaString.split('"__POST_URL__"').join(JSON.stringify(articleData.url));
                schemaString = schemaString.split('"لاتكتب فيها شئ يتم توليدها ديناميكيا"').join(JSON.stringify('أسئلة وأجوبة توثيقية عن: ' + articleData.headline));

                const qaData = JSON.parse(schemaString);

                const updateDetails = (entity) => {
                    if (entity) {
                        if (entity.author) {
                            entity.author['@type'] = 'Person';
                            entity.author.url = articleData.author.url;
                            if (!entity.author.jobTitle) entity.author.jobTitle = articleData.author.jobTitle;
                        }
                        if (entity.acceptedAnswer) {
                            entity.acceptedAnswer['@type'] = 'Answer';
                            entity.acceptedAnswer.url = articleData.url;
                            if (entity.acceptedAnswer.author) {
                                entity.acceptedAnswer.author['@type'] = 'Person';
                                entity.acceptedAnswer.author.url = articleData.author.url;
                            }
                            if (window.SeoTurboVotes && typeof window.SeoTurboVotes.generate === 'function') {
                                const voteId = (entity.text || articleData.headline) + articleData.url;
                                entity.acceptedAnswer.upvoteCount = window.SeoTurboVotes.generate(voteId, articleData.datePublished);
                            }
                        }
                    }
                };

                if (qaData.mainEntity) updateDetails(qaData.mainEntity);
                if (qaData.hasPart && Array.isArray(qaData.hasPart)) {
                    qaData.hasPart.forEach(part => updateDetails(part));
                }
                
                qaScript.textContent = JSON.stringify(qaData, null, 2);
                return qaData;
            } catch (e) {
                console.warn('QA Schema Error:', e);
                return null;
            }
        };

        const insertQAContainerIntoPlaceholder = () => {
            const qaData = populateAndGetQAData();
            if (!qaData) return;

            const questionsToDisplay = [];
            if (qaData.mainEntity?.text && qaData.mainEntity.acceptedAnswer?.text) {
                questionsToDisplay.push({
                    question: qaData.mainEntity.text,
                    answer: qaData.mainEntity.acceptedAnswer.text,
                    votes: qaData.mainEntity.acceptedAnswer.upvoteCount
                });
            }
            if (qaData.hasPart && Array.isArray(qaData.hasPart)) {
                qaData.hasPart.forEach(part => {
                    if (part['@type'] === 'Question' && part.text && part.acceptedAnswer?.text) {
                        questionsToDisplay.push({ 
                            question: part.text, 
                            answer: part.acceptedAnswer.text,
                            votes: part.acceptedAnswer.upvoteCount
                        });
                    }
                });
            }

            if (questionsToDisplay.length === 0) return;

            const placeholder = document.getElementById('qa-section-placeholder');
            if (!placeholder) return;

            const titleElement = document.createElement('h3');
            titleElement.className = 'qa-section-title';
            titleElement.textContent = 'الأسئلة الشائعة والمعلومات الموثقة';

            const qaContainer = document.createElement('div');
            qaContainer.className = 'qa-container-wrapper';

            const listElement = document.createElement('ul');
            listElement.className = 'qa-list';

            questionsToDisplay.forEach(item => {
                const listItem = document.createElement('li');
                listItem.className = 'qa-list-item';
                const questionDiv = document.createElement('div');
                questionDiv.className = 'qa-question';
                
                if (item.votes !== undefined && item.votes !== null && window.SeoTurboVotes) {
                    questionDiv.innerHTML = `<span>${item.question}</span> <small class="qa-vote-badge" style="display: inline-flex; align-items: center; font-size: 13px; color: #155f26; font-weight: bold; float: left; background: #f2f8f5; padding: 4px 12px; border-radius: 12px; border: 1px solid #c3e6cb; margin-top: 2px;">${item.votes} تصويت</small>`;
                } else {
                    questionDiv.innerHTML = `<span>${item.question}</span>`;
                }
                
                const answerDiv = document.createElement('div');
                answerDiv.className = 'qa-answer';
                answerDiv.innerHTML = item.answer;
                listItem.appendChild(questionDiv);
                listItem.appendChild(answerDiv);
                listElement.appendChild(listItem);
            });

            qaContainer.appendChild(listElement);
            placeholder.appendChild(titleElement);
            placeholder.appendChild(qaContainer);
            placeholder.style.display = 'block';
        };

        if ('requestIdleCallback' in window) {
            requestIdleCallback(insertQAContainerIntoPlaceholder, { timeout: 1000 });
        } else {
            setTimeout(insertQAContainerIntoPlaceholder, 500);
        }
    });
})();

// MODULE 32
(function() {
    'use strict';
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDatasetSchema);
    } else {
        initDatasetSchema();
    }
    
    function initDatasetSchema() {
        let siteName = '';
        
        const vaultElement = document.getElementById('homepage-identity-vault');
        if (vaultElement && vaultElement.getAttribute('data-name')) {
            siteName = vaultElement.getAttribute('data-name');
        }
        
        if (!siteName) {
            const metaSiteName = document.querySelector('meta[name="site-name"]');
            if (metaSiteName && metaSiteName.getAttribute('content')) {
                siteName = metaSiteName.getAttribute('content');
            }
        }
        
        if (!siteName) {
            const homeTitle = document.querySelector('.site-title a, .site-title');
            if (homeTitle) {
                siteName = homeTitle.textContent.trim();
            }
        }
        
        if (!siteName) {
            const ogSiteName = document.querySelector('meta[property="og:site_name"]');
            if (ogSiteName && ogSiteName.getAttribute('content')) {
                siteName = ogSiteName.getAttribute('content');
            }
        }
        
        if (!siteName) {
            siteName = 'الموقع الرسمي';
        }
        
        let logoUrl = '';
        const logoImg = document.querySelector('#Header1_headerimg, .header-widget img');
        if (logoImg && logoImg.src) {
            logoUrl = logoImg.src;
        }
        
        if (!logoUrl) {
            const favicon = document.querySelector('link[rel*="icon"]');
            if (favicon && favicon.href) {
                logoUrl = favicon.href;
            }
        }
        
        const homepageUrl = window.location.origin;
        const licenseUrl = homepageUrl + '/p/privacy-policy.html';
        
        const categoryMetas = document.querySelectorAll("meta[name='category']");
        const generatedDatasets = [];
        
        if (logoUrl && siteName) {
            categoryMetas.forEach(function(meta) {
                const content = meta.getAttribute('content');
                if (content) {
                    const parts = content.split(' | ');
                    if (parts.length === 2) {
                        const name = parts[0].trim();
                        let description = parts[1].trim();
                        
                        if (description.length < 60) {
                            description = description + " - تصفح مجموعة بيانات ومعلومات شاملة ومحدثة حول " + name + " مقدمة حصرياً من فريق " + siteName;
                        }
                        
                        const catUrl = homepageUrl + "/search/label/" + encodeURIComponent(name);
                        
                        const dataset = {
                            "@context": "https://schema.org",
                            "@type": "Dataset",
                            "name": "مجموعة بيانات قسم " + name,
                            "description": description,
                            "url": catUrl,
                            "disambiguatingDescription": "بيانات تفصيلية ومقالات حول " + name,
                            "creator": { 
                                "@type": "Organization", 
                                "name": "فريق " + siteName, 
                                "url": homepageUrl 
                            },
                            "keywords": [name],
                            "author": { 
                                "@type": "Organization", 
                                "name": "فريق " + siteName, 
                                "url": homepageUrl 
                            },
                            "publisher": {
                                "@type": "Organization",
                                "name": siteName,
                                "url": homepageUrl,
                                "logo": {
                                    "@type": "ImageObject",
                                    "name": "شعار " + siteName,
                                    "url": logoUrl,
                                    "encodingFormat": "image/webp",
                                    "width": 120,
                                    "height": 120
                                }
                            },
                            "license": licenseUrl,
                            "isAccessibleForFree": true,
                            "inLanguage": "ar"
                        };
                        generatedDatasets.push(dataset);
                    }
                }
            });
            
            if (generatedDatasets.length > 0) {
                const oldScript = document.getElementById('datasetSchema');
                if (oldScript) {
                    oldScript.remove();
                }
                
                const schemaScript = document.createElement('script');
                schemaScript.type = 'application/ld+json';
                schemaScript.id = 'datasetSchema';
                schemaScript.textContent = JSON.stringify(generatedDatasets, null, 2);
                document.head.appendChild(schemaScript);
                
                console.log('✅ Datasets Schema تم إنشاؤه بنجاح لـ ' + generatedDatasets.length + ' قسم');
            }
        }
    }
})();

// MODULE 38
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "name": "SEOTurbo Apex v12.0 | السجل التقني",
  "description": "البيانات التقنية لمنصة SEOTurbo Apex v12.0: 347 ميزة موثقة، 45+ نوع Schema، أداء متوافق مع معايير Core Web Vitals",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "SEOTurbo Apex v12.0 | المنصة التقنية",
      "item": "https://seoturbo-imperial.blogspot.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "347 ميزة تقنية | السجل الأكثر شمولاً في تاريخ بلوجر",
      "item": "https://seoturbo-imperial.blogspot.com/"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "45+ Schema Type | البنية الأكثر تكاملاً مع محركات البحث",
      "item": "https://seoturbo-imperial.blogspot.com/"
    },
    {
      "@type": "ListItem",
      "position": 4,
      "name": "SEOTurbo Apex v12.0 | الإصدار المعتمد",
      "item": "https://seoturbo-imperial.blogspot.com/"
    }
  ]
}

// MODULE 39
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "SEOTurbo Apex v12.0 | البيانات التقنية الموثقة",
  "description": "سجل تقني شامل لمنصة SEOTurbo Apex v12.0، يتضمن 347 ميزة تقنية موثقة، 45+ نوعاً من بيانات Schema المنظمة، وتوافقاً كاملاً مع معايير Core Web Vitals. البيانات مبنية على التحليل التقني والمواصفات الرسمية للمنصة.",
  "url": "https://seoturbo-imperial.blogspot.com/",
  "license": "https://seoturbo-imperial.blogspot.com/p/verify.html",
  "creator": {
    "@type": "Person",
    "name": "د. محمد الجندي",
    "url": "https://seoturbo-imperial.blogspot.com/"
  },
  "copyrightHolder": {
    "@type": "Organization",
    "name": "شركة SEOTurbo للبرمجيات الذكية"
  },
  "copyrightYear": "2026",
  "keywords": ["SEOTurbo Apex v12.0", "قالب بلوجر احترافي", "SEOTurbo Apex"],
  "variableMeasured": [
    "PageSpeed Performance Score",
    "Core Web Vitals Compliance (LCP, INP, CLS)",
    "Schema Markup Coverage (45+ Types)",
    "Strategic Ad Placements (15+ Positions)"
  ],
  "temporalCoverage": "2026-01-01/2026-12-31"
}

