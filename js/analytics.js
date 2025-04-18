// PostHog Analytics Configuration
(function() {
    // Generate a UUID for consistency with PostHog's expected format
    function generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
    
    // Get or create user ID
    var userId = localStorage.getItem('ph_user_id');
    if (!userId) {
        userId = generateUUID();
        localStorage.setItem('ph_user_id', userId);
    }
    
    // Create global object before loading the script
    window.posthog = window.posthog || function() {
        (window.posthog.q = window.posthog.q || []).push(arguments);
    };
    
    // Queue identification BEFORE initialization
    window.posthog('identify', userId);
    
    // Now load and initialize
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    
    // Initialize with capture_pageview disabled at first
    window.posthog.init('phc_LtwigGiWJKo91NSjtyY09ghDDwX82VPy7quao5TEMJB', {
        api_host: 'https://us.i.posthog.com',
        capture_pageview: false,
        debug: false, // Turn off debug mode to reduce noise
        loaded: function(posthog) {
            // Make absolutely sure we're identified
            posthog.identify(userId);
            
            // Now manually capture pageview
            setTimeout(function() {
                posthog.capture('$pageview');
                console.log('PostHog loaded successfully');
                console.log('PostHog session ID:', posthog.get_session_id());
                console.log('PostHog distinct ID:', posthog.get_distinct_id());
            }, 500);
        }
    });
})(); 