// posthog-custom.js - A more robust implementation designed for static sites
document.addEventListener('DOMContentLoaded', function() {
  // Add the funny console message
  console.clear();
  console.log("Nothing at all suspicious happening behind the hood. Nope. Nothing, Close this and keep exploring (Yes, I am using posthog to record your session :( ))");
  
  // Override console.log to suppress ALL debugging logs
  const originalConsoleLog = console.log;
  const originalConsoleWarn = console.warn;
  const originalConsoleError = console.error;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
  // Only allow our custom message to show
  console.log = function() {
    if (arguments[0] === "Nothing at all suspicious happening behind the hood. Nope. Nothing, Close this and keep exploring (Yes, I am using posthog to record your session :( ))") {
      originalConsoleLog.apply(console, arguments);
    }
    // Suppress all other logs
  };
  
  console.warn = function() {
    // Suppress all warnings
  };
  
  console.error = function() {
    // Allow errors to show through if they're not related to PostHog
    if (arguments[0] && typeof arguments[0] === 'string' && 
        !(arguments[0].includes('PostHog') || arguments[0].includes('posthog'))) {
      originalConsoleError.apply(console, arguments);
    }
  };
  
  console.info = function() {
    // Suppress all info logs
  };
  
  console.debug = function() {
    // Suppress all debug logs
  };

  // Define error handler first
  window.addEventListener('error', function(e) {
    if (e.filename && e.filename.includes('posthog')) {
      // Suppress PostHog errors in console
      e.preventDefault();
      return true;
    }
  });

  // Create a random ID if we need one
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get or create persistent ID
  var userId = localStorage.getItem('posthog_distinct_id');
  if (!userId) {
    userId = generateId();
    localStorage.setItem('posthog_distinct_id', userId);
  }

  // Get page info for better analytics
  var currentPath = window.location.pathname;
  var pageTitle = document.title || 'Untitled Page';
  var referrer = document.referrer || '';

  // Load PostHog script manually
  var script = document.createElement('script');
  script.type = 'text/javascript';
  script.crossOrigin = 'anonymous';
  script.async = true;
  script.src = 'https://us-assets.i.posthog.com/static/array.js';
  script.onload = function() {
    // Initialize PostHog after script loads
    window.posthog.init('phc_LtwigGiWJKo91NSjtyY09ghDDwX82VPy7quao5TEMJB', {
      api_host: 'https://us.i.posthog.com',
      persistence: 'localStorage',
      cross_subdomain_cookie: false,
      capture_pageview: false, // We'll manually capture for better control
      autocapture: true, // Enable autocapture for clicks and other interactions
      session_recording: {
        enabled: true,
        recordCrossOriginIframes: true
      },
      loaded: function(ph) {
        // Force identification with our manually created ID
        ph.identify(userId);
        
        // Capture page properties
        ph.register({
          'page_path': currentPath,
          'page_title': pageTitle,
          'referrer': referrer
        });
        
        // Capture detailed pageview with additional properties
        setTimeout(function() {
          ph.capture('$pageview', {
            $current_url: window.location.href,
            $pathname: currentPath,
            page_title: pageTitle,
            referrer: referrer,
            hostname: window.location.hostname,
            section: currentPath.split('/')[1] || 'home'
          });
          
          // Also track engagement
          ph.capture('page_engagement', {
            page_type: getPageType(),
            timestamp: new Date().toISOString()
          });
        }, 500);
      }
    });
    
    // Disable debug mode
    window.posthog.debug(false);
  };
  
  // Helper to determine page type
  function getPageType() {
    if (currentPath.includes('/blog/')) {
      return 'blog';
    } else if (currentPath.includes('/portfolio/')) {
      return 'portfolio';
    } else if (currentPath.includes('/activities/')) {
      return 'activities';
    } else {
      return 'main';
    }
  }
  
  // Add script to page
  document.head.appendChild(script);
}); 