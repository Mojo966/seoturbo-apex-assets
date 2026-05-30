//<![CDATA[
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
            const allTriggers = document.querySelectorAll('#topbar-styles-library .RankTurboSeo-style-trigger');
            
            const activeTriggers = Array.from(allTriggers).filter(el => {
                const widget = el.closest('.widget');
                if (!widget) return false;
                return widget.offsetParent !== null;
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
            
            const topbar = document.querySelector('.RankTurboSeo-topbar');
            if (!topbar) {
                pendingUpdate = false;
                return;
            }

            const oldStyle = document.getElementById('seoturbo-dynamic-css');
            if (oldStyle) oldStyle.remove();
            document.querySelectorAll('.st-dynamic-shape-container').forEach(el => el.remove());

            const _GS = {css:".RankTurboSeo-topbar-wave-wrapper{position:absolute;bottom:-180px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.RankTurboSeo-topbar-wave-wrapper svg{display:block;width:100%;height:189px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.05;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.11;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.20;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.33;}.swl-5{fill:var(--wave-5-color,var(--blogcolor));opacity:0.52;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.07;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.15;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.25;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.38;}body.dark-mode .swl-5{fill:#0a0a1a;opacity:0.55;}@media (max-width:768px){.RankTurboSeo-topbar-wave-wrapper{bottom:-90px;}.RankTurboSeo-topbar-wave-wrapper svg{height:95px;}}",svg:'<div class="st-dynamic-shape-container RankTurboSeo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,30 C360,5 720,45 1080,20 C1260,8 1350,38 1440,30 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,65 C240,25 480,100 720,55 C960,15 1200,110 1440,65 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,105 C180,45 360,160 540,90 C720,30 900,160 1080,105 C1260,55 1440,160 1440,105 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,150 C150,80 300,215 450,135 C600,55 750,215 900,150 C1050,80 1200,215 1350,150 C1400,125 1420,185 1440,150 L1440,0 L0,0 Z"/><path class="swl-5" d="M0,198 C100,135 200,270 300,180 C400,95 500,270 600,195 C700,135 800,270 900,195 C1000,135 1100,270 1200,195 C1300,135 1400,270 1440,198 L1440,0 L0,0 Z"/></svg></div>'};
            const _SIMPLE = {css:".RankTurboSeo-topbar-wave-wrapper{position:absolute;bottom:-130px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.RankTurboSeo-topbar-wave-wrapper svg{display:block;width:100%;height:140px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.035;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.07;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.13;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.22;}.swl-5{fill:var(--wave-5-color,var(--blogcolor));opacity:0.35;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.05;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.10;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.17;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.27;}body.dark-mode .swl-5{fill:#0a0a1a;opacity:0.42;}@media (max-width:768px){.RankTurboSeo-topbar-wave-wrapper{bottom:-65px;}.RankTurboSeo-topbar-wave-wrapper svg{height:70px;}}",svg:'<div class="st-dynamic-shape-container RankTurboSeo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 320"><path class="swl-1" d="M0,0L60,280L120,0ZM120,0L180,280L240,0ZM240,0L300,280L360,0ZM360,0L420,280L480,0ZM480,0L540,280L600,0ZM600,0L660,280L720,0ZM720,0L780,280L840,0ZM840,0L900,280L960,0ZM960,0L1020,280L1080,0ZM1080,0L1140,280L1200,0ZM1200,0L1260,280L1320,0ZM1320,0L1380,280L1440,0ZM0,300L1440,300L1440,320L0,320Z"/><path class="swl-2" d="M0,0L60,260L120,0ZM120,0L180,260L240,0ZM240,0L300,260L360,0ZM360,0L420,260L480,0ZM480,0L540,260L600,0ZM600,0L660,260L720,0ZM720,0L780,260L840,0ZM840,0L900,260L960,0ZM960,0L1020,260L1080,0ZM1080,0L1140,260L1200,0ZM1200,0L1260,260L1320,0ZM1320,0L1380,260L1440,0ZM0,280L1440,280L1440,300L0,300Z"/><path class="swl-3" d="M0,0L60,240L120,0ZM120,0L180,240L240,0ZM240,0L300,240L360,0ZM360,0L420,240L480,0ZM480,0L540,240L600,0ZM600,0L660,240L720,0ZM720,0L780,240L840,0ZM840,0L900,240L960,0ZM960,0L1020,240L1080,0ZM1080,0L1140,240L1200,0ZM1200,0L1260,240L1320,0ZM1320,0L1380,240L1440,0ZM0,260L1440,260L1440,280L0,280Z"/><path class="swl-4" d="M0,0L60,220L120,0ZM120,0L180,220L240,0ZM240,0L300,220L360,0ZM360,0L420,220L480,0ZM480,0L540,220L600,0ZM600,0L660,220L720,0ZM720,0L780,220L840,0ZM840,0L900,220L960,0ZM960,0L1020,220L1080,0ZM1080,0L1140,220L1200,0ZM1200,0L1260,220L1320,0ZM1320,0L1380,220L1440,0ZM0,240L1440,240L1440,260L0,260Z"/><path class="swl-5" d="M0,0L60,200L120,0ZM120,0L180,200L240,0ZM240,0L300,200L360,0ZM360,0L420,200L480,0ZM480,0L540,200L600,0ZM600,0L660,200L720,0ZM720,0L780,200L840,0ZM840,0L900,200L960,0ZM960,0L1020,200L1080,0ZM1080,0L1140,200L1200,0ZM1200,0L1260,200L1320,0ZM1320,0L1380,200L1440,0ZM0,220L1440,220L1440,240L0,240Z"/></svg></div>'};
            const _AURORA = {css:".RankTurboSeo-topbar-wave-wrapper{position:absolute;bottom:-155px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.RankTurboSeo-topbar-wave-wrapper svg{display:block;width:100%;height:160px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.04;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.09;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.16;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.25;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.06;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.12;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.20;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.30;}@media (max-width:768px){.RankTurboSeo-topbar-wave-wrapper{bottom:-80px;}.RankTurboSeo-topbar-wave-wrapper svg{height:85px;}}",svg:'<div class="st-dynamic-shape-container RankTurboSeo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,200 C80,20 160,280 240,40 C320,260 400,30 480,250 C560,40 640,270 720,50 C800,260 880,30 960,250 C1040,40 1120,280 1200,50 C1280,260 1360,30 1440,200 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,240 C120,80 240,220 360,100 C480,240 600,60 720,220 C840,80 960,240 1080,100 C1200,240 1320,60 1440,220 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,260 C200,120 400,240 600,140 C800,260 1000,100 1200,240 C1300,160 1400,220 1440,260 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,280 C300,180 600,260 900,160 C1200,280 1350,200 1440,280 L1440,0 L0,0 Z"/></svg></div>'};
            const _CRYSTAL = {css:".RankTurboSeo-topbar-wave-wrapper{position:absolute;bottom:-125px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.RankTurboSeo-topbar-wave-wrapper svg{display:block;width:100%;height:130px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.05;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.12;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.22;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.07;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.16;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.28;}@media (max-width:768px){.RankTurboSeo-topbar-wave-wrapper{bottom:-65px;}.RankTurboSeo-topbar-wave-wrapper svg{height:70px;}}",svg:'<div class="st-dynamic-shape-container RankTurboSeo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,200 L100,40 L200,200 L300,40 L400,200 L500,40 L600,200 L700,40 L800,200 L900,40 L1000,200 L1100,40 L1200,200 L1300,40 L1400,200 L1440,40 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,240 L60,90 L120,240 L180,90 L240,240 L300,90 L360,240 L420,90 L480,240 L540,90 L600,240 L660,90 L720,240 L780,90 L840,240 L900,90 L960,240 L1020,90 L1080,240 L1140,90 L1200,240 L1260,90 L1320,240 L1380,90 L1440,240 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,270 L40,130 L80,270 L120,130 L160,270 L200,130 L240,270 L280,130 L320,270 L360,130 L400,270 L440,130 L480,270 L520,130 L560,270 L600,130 L640,270 L680,130 L720,270 L760,130 L800,270 L840,130 L880,270 L920,130 L960,270 L1000,130 L1040,270 L1080,130 L1120,270 L1160,130 L1200,270 L1240,130 L1280,270 L1320,130 L1360,270 L1400,130 L1440,270 L1440,0 L0,0 Z"/></svg></div>'};
            const _LIQUID = {css:".RankTurboSeo-topbar-wave-wrapper{position:absolute;bottom:-195px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.RankTurboSeo-topbar-wave-wrapper svg{display:block;width:100%;height:200px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.04;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.09;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.16;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.28;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.06;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.12;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.20;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.33;}@media (max-width:768px){.RankTurboSeo-topbar-wave-wrapper{bottom:-95px;}.RankTurboSeo-topbar-wave-wrapper svg{height:100px;}}",svg:'<div class="st-dynamic-shape-container RankTurboSeo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,60 C200,200 400,-30 600,180 C800,260 1000,0 1440,60 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,120 C240,-20 480,220 720,80 C960,240 1200,20 1440,120 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,180 C180,280 360,40 540,200 C720,50 900,260 1080,80 C1260,240 1350,60 1440,180 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,230 C300,80 600,270 900,120 C1200,260 1350,100 1440,230 L1440,0 L0,0 Z"/></svg></div>'};
            const _PRISM = {css:".RankTurboSeo-topbar-wave-wrapper{position:absolute;bottom:-148px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.RankTurboSeo-topbar-wave-wrapper svg{display:block;width:100%;height:154px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.05;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.10;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.17;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.25;}.swl-5{fill:var(--wave-5-color,var(--blogcolor));opacity:0.34;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.07;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.13;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.21;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.30;}body.dark-mode .swl-5{fill:#0a0a1a;opacity:0.39;}@media (max-width:768px){.RankTurboSeo-topbar-wave-wrapper{bottom:-76px;}.RankTurboSeo-topbar-wave-wrapper svg{height:82px;}}",svg:'<div class="st-dynamic-shape-container RankTurboSeo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,210 L220,55 L440,210 L660,55 L880,210 L1100,55 L1320,210 L1440,125 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,245 L180,95 L360,245 L540,95 L720,245 L900,95 L1080,245 L1260,95 L1440,245 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,280 L260,120 L520,280 L780,120 L1040,280 L1300,120 L1440,210 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,300 L160,165 L320,300 L480,165 L640,300 L800,165 L960,300 L1120,165 L1280,300 L1440,165 L1440,0 L0,0 Z"/><path class="swl-5" d="M0,300 L0,248 L120,150 L240,248 L360,150 L480,248 L600,150 L720,248 L840,150 L960,248 L1080,150 L1200,248 L1320,150 L1440,248 L1440,300 Z"/></svg></div>'};
            const _DIAMOND = {css:".RankTurboSeo-topbar-wave-wrapper{position:absolute;bottom:-155px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.RankTurboSeo-topbar-wave-wrapper svg{display:block;width:100%;height:176px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.07;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.13;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.22;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.31;}.swl-5{fill:var(--wave-5-color,var(--blogcolor));opacity:0.46;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.08;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.16;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.26;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.36;}body.dark-mode .swl-5{fill:#0a0a1a;opacity:0.50;}@media (max-width:768px){.RankTurboSeo-topbar-wave-wrapper{bottom:-75px;}.RankTurboSeo-topbar-wave-wrapper svg{height:90px;}}",
svg:'<div class="st-dynamic-shape-container RankTurboSeo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,260 L120,120 L240,260 L360,120 L480,260 L600,120 L720,260 L840,120 L960,260 L1080,120 L1200,260 L1320,120 L1440,260 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,300 L90,205 L180,300 L270,205 L360,300 L450,205 L540,300 L630,205 L720,300 L810,205 L900,300 L990,205 L1080,300 L1170,205 L1260,300 L1350,205 L1440,300 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,300 L120,150 L240,300 L360,150 L480,300 L600,150 L720,300 L840,150 L960,300 L1080,150 L1200,300 L1320,150 L1440,300 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,190 L120,55 L240,190 L360,55 L480,190 L600,55 L720,190 L840,55 L960,190 L1080,55 L1200,190 L1320,55 L1440,190 L1440,0 L0,0 Z"/><path class="swl-5" d="M0,300 L0,230 L120,90 L240,230 L360,90 L480,230 L600,90 L720,230 L840,90 L960,230 L1080,90 L1200,230 L1320,90 L1440,230 L1440,300 Z"/></svg></div>'};

            const _ROYAL = {css:".RankTurboSeo-topbar-wave-wrapper{position:absolute;bottom:-215px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.RankTurboSeo-topbar-wave-wrapper svg{display:block;width:100%;height:220px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.04;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.08;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.14;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.22;}.swl-5{fill:var(--wave-5-color,var(--blogcolor));opacity:0.35;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.05;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.10;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.18;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.26;}body.dark-mode .swl-5{fill:#0a0a1a;opacity:0.38;}@media (max-width:768px){.RankTurboSeo-topbar-wave-wrapper{bottom:-110px;}.RankTurboSeo-topbar-wave-wrapper svg{height:115px;}}",svg:'<div class="st-dynamic-shape-container RankTurboSeo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,50 C180,200 360,10 540,180 C720,300 900,20 1080,170 C1260,280 1350,50 1440,50 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,100 C240,280 480,40 720,220 C960,300 1200,60 1440,100 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,150 C300,40 600,280 900,80 C1200,260 1350,100 1440,150 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,200 C360,100 720,290 1080,120 C1260,260 1350,160 1440,200 L1440,0 L0,0 Z"/><path class="swl-5" d="M0,250 C400,160 800,290 1200,180 C1320,260 1380,220 1440,250 L1440,0 L0,0 Z"/></svg></div>'};
            const _ECHO = {css:".RankTurboSeo-topbar-wave-wrapper{position:absolute;bottom:-165px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.RankTurboSeo-topbar-wave-wrapper svg{display:block;width:100%;height:170px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.06;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.12;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.22;}.swl-4{fill:var(--wave-4-color,var(--blogcolor));opacity:0.32;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.08;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.16;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.26;}body.dark-mode .swl-4{fill:#0a0a1a;opacity:0.36;}@media (max-width:768px){.RankTurboSeo-topbar-wave-wrapper{bottom:-82px;}.RankTurboSeo-topbar-wave-wrapper svg{height:86px;}}",svg:'<div class="st-dynamic-shape-container RankTurboSeo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,180 C180,20 360,260 540,40 C720,220 900,20 1080,200 C1260,50 1440,180 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,220 C240,80 480,260 720,120 C960,20 1200,240 1440,140 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,260 C300,120 600,280 900,140 C1200,40 1320,260 1440,180 L1440,0 L0,0 Z"/><path class="swl-4" d="M0,300 C360,140 720,300 1080,160 C1260,120 1350,250 1440,300 L1440,0 L0,0 Z"/></svg></div>'};
            const _HORIZON = {css:".RankTurboSeo-topbar-wave-wrapper{position:absolute;bottom:-130px;left:0;width:100%;line-height:0;z-index:0;pointer-events:none;}.RankTurboSeo-topbar-wave-wrapper svg{display:block;width:100%;height:140px;}.swl-1{fill:var(--wave-1-color,var(--blogcolor));opacity:0.08;}.swl-2{fill:var(--wave-2-color,var(--blogcolor));opacity:0.15;}.swl-3{fill:var(--wave-3-color,var(--blogcolor));opacity:0.25;}body.dark-mode .swl-1{fill:#0a0a1a;opacity:0.10;}body.dark-mode .swl-2{fill:#0a0a1a;opacity:0.18;}body.dark-mode .swl-3{fill:#0a0a1a;opacity:0.30;}@media (max-width:768px){.RankTurboSeo-topbar-wave-wrapper{bottom:-68px;}.RankTurboSeo-topbar-wave-wrapper svg{height:70px;}}",svg:'<div class="st-dynamic-shape-container RankTurboSeo-topbar-wave-wrapper"><svg preserveAspectRatio="none" viewBox="0 0 1440 300"><path class="swl-1" d="M0,80 C240,220 480,10 720,120 C960,220 1200,30 1440,100 L1440,0 L0,0 Z"/><path class="swl-2" d="M0,140 C360,40 720,240 1080,110 C1320,40 1440,130 1440,140 L1440,0 L0,0 Z"/><path class="swl-3" d="M0,210 C420,120 840,280 1260,120 C1380,70 1440,210 1440,210 L1440,0 L0,0 Z"/></svg></div>'};
            const DB = {peaks:_GS,simple:_SIMPLE,aurora:_AURORA,crystal:_CRYSTAL,liquid:_LIQUID,multi_crystal:_PRISM,diamond:_DIAMOND,royal:_ROYAL,echo:_ECHO,horizon:_HORIZON};

            const config = DB[STYLE_KEY];
            if (!config) {
                pendingUpdate = false;
                return;
            }

            const styleTag = document.createElement('style');
            styleTag.id = 'seoturbo-dynamic-css';
            styleTag.textContent = `.RankTurboSeo-topbar { border-bottom: none !important; } ${config.css}`;
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
//]]>