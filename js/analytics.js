// PostHog Analytics Configuration
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

// Initialize PostHog with your project API key and host
posthog.init('phc_LtwigGiWJKo91NSjtyY09ghDDwX82VPy7quao5TEMJB', {
    api_host: 'https://us.i.posthog.com',
    // Enable session recording with enhanced settings
    session_recording: {
        enabled: true,
        recordCrossOriginIframes: true,
        maskAllInputs: false,
        maskInputOptions: {
            password: true,
            email: false,
            number: false,
            textArea: false,
            select: false
        },
        // Minimum time between snapshots in ms
        minTimeBetweenSessionsMilliseconds: 500,
        // Maximum duration of session in minutes
        sessionDurationMinutes: 30,
        // Advanced replay configuration
        maskNetworkRequests: false,
        recordPerformance: true,
        recordCanvas: true
    },
    // Capture page views automatically
    capture_pageview: true,
    // Capture all clicks, forms and changes
    autocapture: true,
    // Respect Do Not Track settings
    respect_dnt: true,
    // Add additional context to events
    property_blacklist: ['$current_url', '$pathname'],
    // Project information
    project_id: '149131',
    // Disable cookies for better compliance
    disable_cookieless_tracking: true,
    // Region specification
    region: 'us',
    // Advanced configuration
    persistence: 'localStorage',
    bootstrap: {
        distinctID: null
    },
    // Debug mode for development
    debug: true,
    // Cross-domain tracking
    cross_subdomain_cookie: true,
    loaded: function(posthog) {
        console.log('PostHog loaded successfully');
        console.log('PostHog session ID:', posthog.get_session_id());
        console.log('PostHog distinct ID:', posthog.get_distinct_id());
    },
    // Error handling
    error: function(error) {
        console.error('PostHog error:', error);
    }
});

// Log page view
console.log('Sending page view event');
posthog.capture('$pageview', {
    $current_url: window.location.href,
    $pathname: window.location.pathname
}); 