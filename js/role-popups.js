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
            highlights: [],
            timeline: {
                career: [
                    {
                        year: 'July 2025 – Present',
                        title: 'Project Geologist — Seequent',
                        description: 'Technical subject-matter expert supporting geoscience users worldwide. Troubleshooting databases, APIs, and data pipelines. Assisting customers with data integrity, onboarding, and system integration.'
                    },
                    {
                        year: 'June 2025',
                        title: 'Began GeomindAI.com',
                        description: 'Mineral prospectivity platform. Ensembled CNN-GBT model processing magnetic imagery and geological features, trained on 450K+ geospatial samples. Dockerized inference pipeline with PostGIS backend.',
                        link: { label: 'GeomindAI.com', url: 'https://geomindai.com' }
                    },
                    {
                        year: '2025',
                        title: 'Began Hadoona.com',
                        description: 'Geospatial field data collection platform with offline-first mobile and web apps. Point, line, and polygon logging with cached satellite imagery and real-time GPS tracking.',
                        link: { label: 'Hadoona.com', url: 'https://hadoona.com' }
                    },
                    {
                        year: 'April 2025',
                        title: 'P.Geo Designation',
                        description: 'Registered Professional Geoscientist with the Professional Geoscientists of Ontario.'
                    },
                    {
                        year: 'June 2023 – July 2025',
                        title: 'Geophysicist — Sander Geophysics',
                        description: 'Processed and interpreted airborne geophysical data (magnetics, EM, gravity, radiometrics). Designed and led field surveys. Built Python ETL pipelines and automated anomaly detection with ML.'
                    },
                    {
                        year: 'Dec 2022',
                        title: 'GIT Designation',
                        description: 'Geologist-in-Training designation from the Professional Geoscientists of Ontario.'
                    },
                    {
                        year: 'Dec 2021 – June 2023',
                        title: 'Environmental Field Consultant — Stantec / Geospatial Geoscientist — Innovative Mining',
                        description: 'Led a team of 5 geoscientists in data extraction and feature engineering for ML pipelines. Led a team in sourcing data for CNN-based Mineral Prospectivity and model development. ArcGIS and QGIS geospatial analysis. Managed project budgets and stakeholder coordination.'
                    },
                    {
                        year: '2021–2022',
                        title: 'Co-Authored GIS Publications',
                        description: 'Jackfish Lake Project (Jan 2022) and McCivar Lake Project (Oct 2021). GeologyOntario assessment records.',
                        link: { label: 'Jackfish Lake — Assessment Record 20000020879', url: 'https://www.geologyontario.mines.gov.on.ca/' }
                    },
                    {
                        year: 'June 2020 – Dec 2021',
                        title: 'Field Geologist — Bayside Geoscience',
                        description: 'Hard-rock field mapping and prospecting of Orogenic gold-hosted deposits. Conducted ground IP surveys. Geospatial analysis of geochemical data with ArcGIS and QGIS. Co-authored technical assessment reports.'
                    },
                    {
                        year: '2016–2020',
                        title: 'BSc Geoscience & Applied Mathematics — Western University',
                        description: 'Bachelor of Science in Geology and Applied Mathematics.'
                    }
                ]
            }
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
            highlights: [],
            socialLinks: [
                { icon: 'https://cdn.worldvectorlogo.com/logos/linkedin-icon-2.svg', alt: 'LinkedIn', url: 'https://www.linkedin.com/in/ramihaider/' },
                { icon: 'https://cdn.worldvectorlogo.com/logos/kaggle-1.svg', alt: 'Kaggle', url: 'https://www.kaggle.com/ramiaboushamalah' },
                { icon: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Octicons-mark-github.svg', alt: 'GitHub', url: 'https://github.com/RamiHaider', invert: true }
            ],
            timeline: {
                career: [
                    {
                        year: 'Feb 2026',
                        title: 'Began ML Teaching Series',
                        description: 'Started creating content teaching deep intuitive math and visualizations of machine learning concepts.',
                        link: { label: 'Watch on YouTube', url: 'https://www.youtube.com/watch?v=I28UmlvljiM' }
                    },
                    {
                        year: 'June 2025',
                        title: 'Began GeomindAI.com',
                        description: 'Mineral prospectivity mapper powered by an ensembled CNN trained on geophysical and geochemical data to predict mineral deposit locations.',
                        link: { label: 'GeomindAI.com', url: 'https://geomindai.com' }
                    },
                    {
                        year: 'March 2025',
                        title: 'Began Hadoona.com',
                        description: 'Fullstack web application with a Flutter mobile app for offline capturing of field data. Node.js backend with a Flutter frontend for seamless offline-first geospatial data collection.',
                        link: { label: 'Hadoona.com', url: 'https://hadoona.com' }
                    },
                    {
                        year: 'Sept 2024',
                        title: 'Data Science Consultant — 1stoplaundry.com',
                        description: 'Consulted for a high-growth laundry startup. Built statistical forecasting models and a dynamic pricing engine that drove an 80% increase in sales.'
                    },
                    {
                        year: 'Nov 2024',
                        title: 'Speaker at KEGS Ottawa',
                        description: 'Talk titled "Detecting Anomalies in Ground Magnetic Data using Supervised Learning".',
                        link: { label: 'View Slides (PDF)', url: 'assets/images/TimeSeriesPresentation.pdf' }
                    },
                    {
                        year: 'June 2024',
                        title: 'Masters in Data Science — University of Michigan',
                        description: 'Began pursuing a Masters degree in Data Science.'
                    },
                    {
                        year: 'July 2021 – July 2025',
                        title: 'ML Engineer — Sander Geophysics',
                        description: 'Developed and fine-tuned a YOLO-based CNN for anomaly detection. Hosted model on AWS and built end-to-end ML pipelines.'
                    },
                    {
                        year: 'November 2020 – July 2021',
                        title: 'Data Analyst / Engineer — Innovative Mining Solutions',
                        description: 'Led a team in sourcing data for CNN-based Mineral Prospectivity and model development.'
                    },
                    {
                        year: 'June 2020',
                        title: 'BSc Applied Mathematics',
                        description: 'Completed Bachelor of Science in Applied Mathematics.'
                    }
                ]
            },
            projectCards: [
                {
                    title: 'The Illustrated CNN',
                    description: 'Interactive visual walkthrough of how Convolutional Neural Networks process images — from convolution to prediction.',
                    tags: ['CNN', 'Deep Learning', 'Visualization'],
                    link: 'blog/visualize-cnn.html'
                },
                {
                    title: 'GeomindAI — Mineral Targeting Platform',
                    description: 'Full implementation of the mineral targeting platform with ensembled CNN architecture and interactive mapping.',
                    tags: ['Platform', 'CNN', 'AWS'],
                    link: 'blog/quebecai.html'
                }
            ]
        },
        educator: {
            title: 'Math & Chess Educator',
            theme: 'theme-educator',
            bio: 'I have been personally tutoring Math since 2015 and teaching Chess to diverse groups. I enjoy breaking down complex topics into clear, visual explanations and producing quality educational videos.',
            highlights: [],
            timeline: {
                chess: [
                    {
                        year: '2023',
                        title: 'U1800 Prize Winner',
                        description: 'Won the U1800 prize at the London Chess Club 2023 Winter Active tournament.',
                        link: { label: 'London Chess Club Results', url: 'https://londonchessclub.ca/?p=10684' }
                    },
                    {
                        year: '2015–2016',
                        title: 'Chess Instructor — Amica of London',
                        description: 'Volunteered at Amica of London, an upscale retirement community. Taught senior residents the game of chess, making a lasting impact on the community.',
                        reference: 'Reference: Laura Cuthbertson, Life Enrichment Coordinator'
                    },
                    {
                        year: '2013',
                        title: 'Started Playing Chess',
                        description: 'Began playing chess and competing in tournaments across multiple countries.'
                    }
                ],
                math: [
                    {
                        year: '2025',
                        title: 'ML Fundamentals',
                        description: 'New playlist covering machine learning fundamentals.',
                        video: 'https://www.youtube.com/embed/I28UmlvljiM'
                    },
                    {
                        year: '2016',
                        title: 'Calculus Teaching',
                        description: 'Video playlists teaching Calculus.',
                        videos: [
                            { label: 'Calculus Playlist 1', url: 'https://www.youtube.com/embed/za3K3spZJwQ?list=PLxOmhqQoYAkzf4Ql4cmYXGyT009dJAtaF' },
                            { label: 'Calculus Playlist 2', url: 'https://www.youtube.com/embed/5Iw_0T_XUUw?list=PLxOmhqQoYAkwiJpphzYAri2xvGjlTy4Ys' }
                        ]
                    },
                    {
                        year: '2015',
                        title: 'Started Tutoring Math',
                        description: 'Began personally tutoring students in mathematics.',
                        testimonials: [
                            { label: 'Student Testimonial #1', url: 'assets/references/student-testimonial-1.pdf' },
                            { label: 'Student Testimonial #2', url: 'assets/references/student-testimonial-2.pdf' }
                        ]
                    }
                ]
            }
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
        populateHighlights(data.highlights, data.timeline, data.socialLinks, data.projectCards);

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
    function populateHighlights(highlights, timeline, socialLinks, projectCards) {
        highlightCards.innerHTML = '';
        var heading = document.getElementById('role-highlights-heading');

        // Render social icons near the bio if provided
        var existingIcons = document.querySelector('.role-social-icons');
        if (existingIcons) existingIcons.remove();
        if (socialLinks && socialLinks.length) {
            var iconsDiv = document.createElement('div');
            iconsDiv.className = 'role-social-icons';
            socialLinks.forEach(function (s) {
                var a = document.createElement('a');
                a.href = s.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                var img = document.createElement('img');
                img.src = s.icon;
                img.alt = s.alt;
                if (s.invert) img.style.filter = 'brightness(0) invert(0)';
                a.appendChild(img);
                iconsDiv.appendChild(a);
            });
            bioText.parentNode.insertBefore(iconsDiv, bioText.nextSibling);
        }

        if (timeline) {
            if (heading) heading.style.display = 'none';
            populateTimeline(timeline, projectCards);
            return;
        }

        if (heading) heading.style.display = '';

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
       POPULATE TIMELINE
    ────────────────────────────────────────────── */
    function populateTimeline(timeline, projectCards) {
        var keys = Object.keys(timeline);
        var isSingle = keys.length === 1;
        var hasCards = projectCards && projectCards.length > 0;

        var wrapper = document.createElement('div');
        if (isSingle && hasCards) {
            wrapper.className = 'timeline-with-cards';
        } else if (isSingle) {
            wrapper.className = 'single-timeline';
        } else {
            wrapper.className = 'educator-timeline';
        }

        function buildColumn(label, entries, hideHeading) {
            var col = document.createElement('div');
            col.className = 'timeline-column';

            if (!hideHeading) {
                var heading = document.createElement('h3');
                heading.className = 'timeline-column-heading';
                heading.textContent = label;
                col.appendChild(heading);
            }

            var line = document.createElement('div');
            line.className = 'timeline-line';

            entries.forEach(function (e) {
                var entry = document.createElement('div');
                entry.className = 'timeline-entry';

                var dot = document.createElement('span');
                dot.className = 'timeline-dot';
                entry.appendChild(dot);

                var year = document.createElement('span');
                year.className = 'timeline-year';
                year.textContent = e.year;
                entry.appendChild(year);

                var content = document.createElement('div');
                content.className = 'timeline-entry-content';

                var title = document.createElement('h4');
                title.textContent = e.title;
                content.appendChild(title);

                var desc = document.createElement('p');
                desc.textContent = e.description;
                content.appendChild(desc);

                if (e.reference) {
                    var ref = document.createElement('p');
                    ref.className = 'timeline-reference';
                    ref.textContent = e.reference;
                    content.appendChild(ref);
                }

                if (e.link) {
                    var linkEl = document.createElement('a');
                    linkEl.href = e.link.url;
                    linkEl.target = '_blank';
                    linkEl.rel = 'noopener noreferrer';
                    linkEl.className = 'timeline-link';
                    linkEl.textContent = e.link.label;
                    content.appendChild(linkEl);
                }

                if (e.testimonials) {
                    var list = document.createElement('ul');
                    list.className = 'timeline-testimonials';
                    e.testimonials.forEach(function (t) {
                        var li = document.createElement('li');
                        var a = document.createElement('a');
                        a.href = t.url;
                        a.target = '_blank';
                        a.rel = 'noopener noreferrer';
                        a.className = 'timeline-link';
                        a.textContent = t.label;
                        li.appendChild(a);
                        list.appendChild(li);
                    });
                    content.appendChild(list);
                }

                if (e.video) {
                    var iframe = document.createElement('iframe');
                    iframe.width = '280';
                    iframe.height = '158';
                    iframe.src = e.video;
                    iframe.frameBorder = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    iframe.className = 'timeline-video';
                    content.appendChild(iframe);
                }

                if (e.videos) {
                    var vidsWrap = document.createElement('div');
                    vidsWrap.className = 'timeline-videos';
                    e.videos.forEach(function (v) {
                        var vDiv = document.createElement('div');
                        var lbl = document.createElement('p');
                        lbl.className = 'timeline-video-label';
                        lbl.textContent = v.label;
                        vDiv.appendChild(lbl);
                        var iframe2 = document.createElement('iframe');
                        iframe2.width = '280';
                        iframe2.height = '158';
                        iframe2.src = v.url;
                        iframe2.frameBorder = '0';
                        iframe2.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                        iframe2.allowFullscreen = true;
                        iframe2.className = 'timeline-video';
                        vDiv.appendChild(iframe2);
                        vidsWrap.appendChild(vDiv);
                    });
                    content.appendChild(vidsWrap);
                }

                entry.appendChild(content);
                line.appendChild(entry);
            });

            col.appendChild(line);
            return col;
        }

        if (isSingle && hasCards) {
            // Timeline left, project cards right
            wrapper.appendChild(buildColumn(keys[0], timeline[keys[0]], true));

            var cardsCol = document.createElement('div');
            cardsCol.className = 'timeline-cards-column';

            var cardsHeading = document.createElement('h3');
            cardsHeading.className = 'timeline-column-heading';
            cardsHeading.textContent = 'Projects';
            cardsCol.appendChild(cardsHeading);

            projectCards.forEach(function (pc) {
                var card = document.createElement('a');
                card.href = pc.link;
                card.className = 'timeline-project-card';

                var t = document.createElement('h4');
                t.textContent = pc.title;
                card.appendChild(t);

                var d = document.createElement('p');
                d.textContent = pc.description;
                card.appendChild(d);

                if (pc.tags && pc.tags.length) {
                    var tagsDiv = document.createElement('div');
                    tagsDiv.className = 'highlight-card-tags';
                    pc.tags.forEach(function (tag) {
                        var span = document.createElement('span');
                        span.className = 'highlight-tag';
                        span.textContent = tag;
                        tagsDiv.appendChild(span);
                    });
                    card.appendChild(tagsDiv);
                }

                cardsCol.appendChild(card);
            });

            wrapper.appendChild(cardsCol);
        } else if (isSingle) {
            wrapper.appendChild(buildColumn(keys[0], timeline[keys[0]], true));
        } else {
            keys.forEach(function (k) {
                var label = k.charAt(0).toUpperCase() + k.slice(1);
                wrapper.appendChild(buildColumn(label, timeline[k], false));
            });
        }
        highlightCards.appendChild(wrapper);
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
    // Support clean URLs: /Geoscience, /MLEngineer, /DataScientist, /Educator
    if (!roleParam) {
        var pathRoleMap = { geoscience: 'geo', mlengineer: 'ml', datascientist: 'ds', educator: 'educator' };
        var seg = window.location.pathname.split('/').filter(Boolean)[0];
        if (seg) roleParam = pathRoleMap[seg.toLowerCase()] || null;
    }
    if (roleParam && ROLE_DATA[roleParam]) {
        (function () {
            var data = ROLE_DATA[roleParam];
            activeRole = roleParam;
            clearTimeout(nudgeTimer);

            // Prepare role-view content
            bioText.textContent = data.bio;
            populateHighlights(data.highlights, data.timeline, data.socialLinks, data.projectCards);

            // Hide landing and show role view immediately
            landingView.style.display = 'none';
            landingView.style.opacity = '0';

            removeAllThemes();
            document.body.classList.add(data.theme);
            profileImg.src = ROLE_IMAGES[roleParam];

            roleView.style.display = 'block';
            roleView.classList.add('visible');
            roleView.style.opacity = '1';
            roleView.style.transform = '';
        })();
    }

});
