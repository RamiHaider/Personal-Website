// analytics.js - Use our custom PostHog implementation for static sites
// The original snippet had a typo (__SV vs .SV) which we've fixed with a custom approach

// Instead of using the standard snippet, we'll use our custom implementation
// which is more robust for static sites and handles identification better

// Reference to our custom implementation with absolute path to work in all directories
document.write('<script src="/js/posthog-custom.js"></script>'); 