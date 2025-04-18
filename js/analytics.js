// PostHog Analytics Configuration
!function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.async=!0,p.src=s.api_host+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="capture identify alias people.set people.set_once set_config register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset isFeatureEnabled onFeatureFlags getFeatureFlag getFeatureFlagPayload reloadFeatureFlags group updateEarlyAccessFeatureEnrollment getEarlyAccessFeatures getActiveMatchingSurveys getSurveys".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);

// Generate a random distinct_id for anonymous users
const generateDistinctId = () => {
    // Check if we already have a user ID in localStorage
    const existingId = localStorage.getItem('ph_user_id');
    if (existingId) {
        return existingId;
    }
    
    // Generate a new ID if we don't have one
    const newId = 'anon_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('ph_user_id', newId);
    return newId;
};

// Get user ID before initialization
const distinctId = generateDistinctId();
console.log('PostHog distinct ID:', distinctId);

// Initialize PostHog with minimal configuration
posthog.init('phc_LtwigGiWJKo91NSjtyY09ghDDwX82VPy7quao5TEMJB', {
    api_host: 'https://us.i.posthog.com',
    bootstrap: {
        distinctID: distinctId  // Set the distinct ID during bootstrap
    },
    loaded: function(posthog) {
        console.log('PostHog loaded successfully');
        console.log('PostHog session ID:', posthog.get_session_id());
        console.log('PostHog distinct ID:', posthog.get_distinct_id());
    }
});

// Make sure user is identified
document.addEventListener('DOMContentLoaded', function() {
    // Additional safety to ensure user is identified
    if (posthog && posthog.get_distinct_id() !== distinctId) {
        posthog.identify(distinctId);
    }
}); 