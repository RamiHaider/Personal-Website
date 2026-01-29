document.addEventListener('DOMContentLoaded', function () {

    /* ──────────────────────────────────────────────
       ROLE IMAGES
    ────────────────────────────────────────────── */
    var DEFAULT_PROFILE_IMAGE = 'assets/images/Gemini_Generated_Image_k26qxlk26qxlk26q.png';
    var ROLE_IMAGES = {
        geo: 'assets/images/Geoscientist.png',
        ds: 'assets/images/Data-Scientist-ML-Engineer.png',
        ml: 'assets/images/Data-Scientist-ML-Engineer.png',
        educator: 'assets/images/Math-Teacher.png'
    };

    /* ──────────────────────────────────────────────
       ROLE DATA
    ────────────────────────────────────────────── */
    var ROLE_DATA = {
        geo: {
            title: 'Geoscientist',
            theme: 'theme-geo',
            bio: 'I am a P.Geo accredited geoscientist registered with the Professional Geoscientists of Ontario. My work spans induced polarization (IP) surveys, airborne geophysics, and mineral exploration targeting. I apply data science and machine learning to geoscientific problems\u2014geospatial analysis, deposit modeling, and integrating geological and geophysical datasets to identify high-potential exploration targets.',
            highlights: [
                {
                    title: 'P.Geo Accreditation \u2014 Professional Geoscientists Ontario',
                    description: 'Licensed professional geoscientist, recognized for competence in geological and geophysical practice across Ontario.',
                    tags: ['Accreditation', 'Ontario', 'P.Geo']
                },
                {
                    title: 'Induced Polarization (IP) Survey Programs',
                    description: 'Designed and executed IP survey programs for mineral exploration, interpreting chargeability and resistivity data to delineate subsurface targets.',
                    tags: ['IP Surveys', 'Chargeability', 'Resistivity']
                },
                {
                    title: 'Airborne Geophysics Interpretation',
                    description: 'Processed and interpreted airborne magnetic and electromagnetic datasets to map geological structures and identify prospective mineral zones.',
                    tags: ['Airborne', 'Magnetics', 'EM']
                },
                {
                    title: 'Geospatial Mineral Deposit Targeting',
                    description: 'Used CNNs and geospatial analysis to associate geophysics images with geological data, predicting geochemical signatures for mineral deposit inference.',
                    tags: ['Machine Learning', 'CNN', 'Geospatial'],
                    link: 'portfolio/quebec-minerals.html'
                }
            ]
        },
        ds: {
            title: 'Data Scientist',
            theme: 'theme-ds',
            bio: 'I work with data to extract insights through statistical modeling, visualization, and analysis. Experienced in Python, R, and SQL across scientific and business domains.',
            highlights: []
        },
        ml: {
            title: 'ML Engineer',
            theme: 'theme-ml',
            bio: 'I build and deploy machine learning models including deep learning, CNNs, and time series systems. Focused on practical solutions from prototype to production.',
            highlights: []
        },
        educator: {
            title: 'Math & Chess Educator',
            theme: 'theme-educator',
            bio: 'I create math content and teach chess. I enjoy breaking down complex topics into clear, visual explanations and producing quality educational videos.',
            highlights: []
        }
    };

    /* ──────────────────────────────────────────────
       DOM REFERENCES
    ────────────────────────────────────────────── */
    var landingView    = document.getElementById('landing-view');
    var roleView       = document.getElementById('role-view');
    var bioTitle       = document.getElementById('role-bio-title');
    var bioText        = document.getElementById('role-bio-text');
    var highlightCards = document.getElementById('highlight-cards');
    var landingChips   = document.querySelectorAll('#landing-view .role-chip');
    var profileImg     = document.querySelector('.profile-image');

    var activeRole = null;
    var isAnimating = false;

    /* ──────────────────────────────────────────────
       LANDING CHIP CLICKS
    ────────────────────────────────────────────── */
    landingChips.forEach(function (chip) {
        chip.addEventListener('click', function () {
            showRoleView(this.dataset.role);
        });
    });

    /* ──────────────────────────────────────────────
       SEQUENTIAL CHIP NUDGE (hint to click)
    ────────────────────────────────────────────── */
    var nudgeTimer = null;
    function nudgeChips() {
        if (activeRole !== null) return;
        landingChips.forEach(function (chip, i) {
            setTimeout(function () {
                if (activeRole !== null) return;
                chip.classList.add('nudge');
                chip.addEventListener('animationend', function handler() {
                    chip.classList.remove('nudge');
                    chip.removeEventListener('animationend', handler);
                });
            }, i * 200);
        });
        var totalDuration = (landingChips.length - 1) * 200 + 600;
        nudgeTimer = setTimeout(nudgeChips, totalDuration + 1500);
    }
    nudgeTimer = setTimeout(nudgeChips, 600);

    /* ──────────────────────────────────────────────
       SHOW ROLE VIEW
       0ms        image clone moves to center + crossfades,
                  landing content fades out
       ~500ms     clone at center with new image
       500–1500ms hold (1 s)
       1500ms     clone fades out, role view fades in
       1900ms     cleanup
    ────────────────────────────────────────────── */
    function showRoleView(key) {
        var data = ROLE_DATA[key];
        if (!data || isAnimating) return;
        isAnimating = true;
        activeRole = key;
        clearTimeout(nudgeTimer);

        // Prepare role-view content (still hidden)
        bioText.textContent  = data.bio;
        populateHighlights(data.highlights);

        // Snapshot current image position & size
        var rect = profileImg.getBoundingClientRect();
        var targetSize = rect.width * 1.6;

        // Old image clone — stays visible, moves to center
        var oldClone = profileImg.cloneNode();
        oldClone.style.cssText =
            'position:fixed;z-index:9998;border-radius:50%;object-fit:cover;' +
            'border:2px solid #d4d4d4;pointer-events:none;' +
            'left:' + rect.left + 'px;top:' + rect.top + 'px;' +
            'width:' + rect.width + 'px;height:' + rect.height + 'px;' +
            'transition:left 0.5s ease,top 0.5s ease,width 0.5s ease,height 0.5s ease;';

        // New image clone — fades in on top while both move
        var newClone = document.createElement('img');
        newClone.src = ROLE_IMAGES[key];
        newClone.alt = data.title;
        newClone.style.cssText =
            'position:fixed;z-index:9999;border-radius:50%;object-fit:cover;' +
            'border:2px solid #d4d4d4;pointer-events:none;opacity:0;' +
            'left:' + rect.left + 'px;top:' + rect.top + 'px;' +
            'width:' + rect.width + 'px;height:' + rect.height + 'px;' +
            'transition:left 0.5s ease,top 0.5s ease,width 0.5s ease,height 0.5s ease,opacity 0.4s ease;';

        document.body.appendChild(oldClone);
        document.body.appendChild(newClone);

        // Hide original
        profileImg.style.visibility = 'hidden';

        // Fade out landing content
        landingView.style.opacity = '0';

        // Move both to center at larger size
        var centerX = (window.innerWidth - targetSize) / 2;
        var centerY = (window.innerHeight - targetSize) / 2;
        void newClone.offsetWidth;
        oldClone.style.left = centerX + 'px';
        oldClone.style.top = centerY + 'px';
        oldClone.style.width = targetSize + 'px';
        oldClone.style.height = targetSize + 'px';
        newClone.style.left = centerX + 'px';
        newClone.style.top = centerY + 'px';
        newClone.style.width = targetSize + 'px';
        newClone.style.height = targetSize + 'px';

        // New image fades in over the old one during the move
        newClone.style.opacity = '1';

        // After arrival (~500ms) + 1 s hold → fade out, reveal role view
        setTimeout(function () {
            oldClone.style.transition = 'opacity 0.3s ease';
            newClone.style.transition = 'opacity 0.3s ease';
            oldClone.style.opacity = '0';
            newClone.style.opacity = '0';

            removeAllThemes();
            document.body.classList.add(data.theme);
            profileImg.src = ROLE_IMAGES[key];
            profileImg.style.visibility = '';

            landingView.style.display = 'none';
            roleView.style.display = 'block';
            roleView.classList.add('visible');
            roleView.classList.add('cinematic-enter');
            void roleView.offsetWidth;
            roleView.classList.add('reveal');

            setTimeout(function () {
                oldClone.remove();
                newClone.remove();
                roleView.classList.remove('cinematic-enter', 'reveal');
                roleView.style.opacity = '1';
                roleView.style.transform = '';
                isAnimating = false;
            }, 400);
        }, 1500);
    }

    /* ──────────────────────────────────────────────
       SHOW LANDING VIEW
    ────────────────────────────────────────────── */
    function showLandingView() {
        activeRole = null;
        removeAllThemes();

        roleView.style.opacity = '0';
        setTimeout(function () {
            roleView.style.display = 'none';
            roleView.classList.remove('visible');

            profileImg.src = DEFAULT_PROFILE_IMAGE;

            landingView.style.display = '';
            void landingView.offsetWidth;
            landingView.style.opacity = '1';
        }, 400);
    }

    /* ──────────────────────────────────────────────
       POPULATE HIGHLIGHTS
    ────────────────────────────────────────────── */
    function populateHighlights(highlights) {
        highlightCards.innerHTML = '';

        if (!highlights || highlights.length === 0) {
            var p = document.createElement('p');
            p.className = 'coming-soon-text';
            p.textContent = 'Coming soon.';
            highlightCards.appendChild(p);
            return;
        }

        highlights.forEach(function (h) {
            var card;
            if (h.link) {
                card = document.createElement('a');
                card.href = h.link;
                card.className = 'highlight-card';
            } else {
                card = document.createElement('div');
                card.className = 'highlight-card';
            }

            var title = document.createElement('h4');
            title.className = 'highlight-card-title';
            title.textContent = h.title;
            card.appendChild(title);

            var desc = document.createElement('p');
            desc.className = 'highlight-card-desc';
            desc.textContent = h.description;
            card.appendChild(desc);

            if (h.tags && h.tags.length) {
                var tagsDiv = document.createElement('div');
                tagsDiv.className = 'highlight-card-tags';
                h.tags.forEach(function (t) {
                    var tag = document.createElement('span');
                    tag.className = 'highlight-tag';
                    tag.textContent = t;
                    tagsDiv.appendChild(tag);
                });
                card.appendChild(tagsDiv);
            }

            highlightCards.appendChild(card);
        });
    }

    /* ──────────────────────────────────────────────
       THEME HELPERS
    ────────────────────────────────────────────── */
    function removeAllThemes() {
        document.body.classList.remove('theme-geo', 'theme-ds', 'theme-ml', 'theme-educator');
    }

    /* ──────────────────────────────────────────────
       LOGO CLICK -> RETURN TO LANDING
    ────────────────────────────────────────────── */
    document.addEventListener('click', function (e) {
        var logo = e.target.closest('.logo');
        if (logo && activeRole !== null) {
            e.preventDefault();
            showLandingView();
        }
    });

    /* ──────────────────────────────────────────────
       DEEP-LINK: ?role=geo | ds | ml | educator
       Shows role image centered, holds, then reveals content
    ────────────────────────────────────────────── */
    var params = new URLSearchParams(window.location.search);
    var roleParam = params.get('role');
    if (roleParam && ROLE_DATA[roleParam]) {
        (function () {
            var data = ROLE_DATA[roleParam];
            activeRole = roleParam;
            clearTimeout(nudgeTimer);

            // Prepare role-view content
            bioText.textContent = data.bio;
            populateHighlights(data.highlights);

            // Hide landing immediately
            landingView.style.display = 'none';
            landingView.style.opacity = '0';

            // Create centered image
            var imgSize = 300;
            var centerX = (window.innerWidth - imgSize) / 2;
            var centerY = (window.innerHeight - imgSize) / 2;
            var img = document.createElement('img');
            img.src = ROLE_IMAGES[roleParam];
            img.alt = data.title;
            img.style.cssText =
                'position:fixed;z-index:9999;border-radius:50%;object-fit:cover;' +
                'border:2px solid #d4d4d4;pointer-events:none;' +
                'left:' + centerX + 'px;top:' + centerY + 'px;' +
                'width:' + imgSize + 'px;height:' + imgSize + 'px;' +
                'opacity:0;transition:opacity 0.4s ease;';
            document.body.appendChild(img);

            // Fade image in
            void img.offsetWidth;
            img.style.opacity = '1';

            // After 1s hold → fade out image, reveal role view
            setTimeout(function () {
                img.style.opacity = '0';

                removeAllThemes();
                document.body.classList.add(data.theme);
                profileImg.src = ROLE_IMAGES[roleParam];

                roleView.style.display = 'block';
                roleView.classList.add('visible');
                roleView.classList.add('cinematic-enter');
                void roleView.offsetWidth;
                roleView.classList.add('reveal');

                setTimeout(function () {
                    img.remove();
                    roleView.classList.remove('cinematic-enter', 'reveal');
                    roleView.style.opacity = '1';
                    roleView.style.transform = '';
                }, 400);
            }, 1400);
        })();
    }

});
