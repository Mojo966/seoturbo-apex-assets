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

