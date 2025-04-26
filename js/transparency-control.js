/**
 * Transparency Control - Allows users to adjust background transparency
 * This script can be included on any page that has content with transparency
 */

// Initialize and add transparency controls when the page is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Add the control elements to the page
    addTransparencyControls();
    
    // Initialize the functionality
    setupTransparencyControls();
});

// Add the necessary HTML elements for the transparency control
function addTransparencyControls() {
    // Create button element
    const button = document.createElement('div');
    button.className = 'transparency-button';
    button.id = 'transparency-toggle';
    button.innerHTML = '<div class="transparency-icon"></div>';
    
    // Create panel element
    const panel = document.createElement('div');
    panel.className = 'transparency-panel';
    panel.id = 'transparency-panel';
    
    // Get saved value or use default
    const savedValue = localStorage.getItem('backgroundTransparency') || 75;
    
    // Add content to panel
    panel.innerHTML = `
        <label for="transparency-slider">Background Transparency</label>
        <input type="range" id="transparency-slider" min="5" max="98" value="${savedValue}" class="slider">
        <div class="transparency-value" id="transparency-value">${savedValue}%</div>
    `;
    
    // Add elements to the page
    document.body.appendChild(button);
    document.body.appendChild(panel);
    
    // Also add the necessary CSS if not already included
    if (!document.getElementById('transparency-styles')) {
        const style = document.createElement('style');
        style.id = 'transparency-styles';
        style.textContent = `
        /* Dropdown Transparency Control - Button and Panel */
        .transparency-button {
            position: fixed;
            top: 150px;
            right: 20px;
            background-color: rgba(255, 255, 255, 0.8);
            color: #212121;
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            z-index: 1000;
            transition: all 0.3s ease;
        }
        
        .transparency-button:hover {
            background-color: rgba(255, 255, 255, 0.9);
            transform: scale(1.05);
        }
        
        .transparency-panel {
            position: fixed;
            top: 195px;
            right: 20px;
            background-color: rgba(255, 255, 255, 0.8);
            padding: 15px;
            border-radius: 10px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            z-index: 999;
            width: 200px;
            display: none;
            flex-direction: column;
            border: 1px solid rgba(0, 0, 0, 0.1);
        }
        
        .transparency-panel.visible {
            display: flex;
            animation: slideDown 0.3s ease;
        }
        
        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .transparency-panel label {
            margin-bottom: 10px;
            font-weight: 600;
            font-size: 0.8rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #212121;
        }
        
        .transparency-panel input {
            width: 100%;
            margin: 0;
            cursor: pointer;
        }
        
        .transparency-value {
            text-align: center;
            margin-top: 8px;
            font-size: 0.8rem;
            color: #555;
        }
        
        /* Icon styling for transparency button */
        .transparency-icon {
            width: 20px;
            height: 20px;
            position: relative;
        }
        
        .transparency-icon:before,
        .transparency-icon:after {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            width: 100%;
            height: 2px;
            background-color: #212121;
            transform: translateY(-50%);
        }
        
        .transparency-icon:after {
            opacity: 0.3;
        }
        
        /* Responsive adjustments */
        @media (max-width: 768px) {
            .transparency-button {
                top: 120px;
                right: 15px;
                width: 35px;
                height: 35px;
            }
            
            .transparency-panel {
                top: 160px;
                right: 15px;
                width: 180px;
            }
        }
        `;
        document.head.appendChild(style);
    }
}

// Set up the transparency control functionality
function setupTransparencyControls() {
    // Get DOM elements
    const transparencyToggle = document.getElementById('transparency-toggle');
    const transparencyPanel = document.getElementById('transparency-panel');
    const transparencySlider = document.getElementById('transparency-slider');
    const transparencyValue = document.getElementById('transparency-value');
    
    // Toggle panel visibility when button is clicked
    transparencyToggle.addEventListener('click', function(event) {
        event.stopPropagation();
        transparencyPanel.classList.toggle('visible');
    });
    
    // Close panel when clicking outside
    document.addEventListener('click', function(event) {
        if (!transparencyToggle.contains(event.target) && 
            !transparencyPanel.contains(event.target)) {
            transparencyPanel.classList.remove('visible');
        }
    });
    
    // Prevent clicks inside panel from closing it
    transparencyPanel.addEventListener('click', function(event) {
        event.stopPropagation();
    });
    
    // Update transparency and display value
    function updateTransparency() {
        const value = transparencySlider.value;
        transparencyValue.textContent = value + '%';
        
        // Calculate opacity (inverted from slider value)
        const opacity = (100 - value) / 100;
        const bgColor = `rgba(255, 255, 255, ${opacity})`;
        
        // Apply to all content sections (but not top nav)
        // Target sections with content backgrounds
        const contentSections = document.querySelectorAll('.hero-section, .main-content-wrapper, [data-transparent]');
        contentSections.forEach(section => {
            section.style.backgroundColor = bgColor;
        });
        
        // Save preference to localStorage
        localStorage.setItem('backgroundTransparency', value);
    }
    
    // Load saved transparency preference
    const savedTransparency = localStorage.getItem('backgroundTransparency');
    if (savedTransparency) {
        transparencySlider.value = savedTransparency;
        updateTransparency();
    } else {
        updateTransparency(); // Use default
    }
    
    // Update when slider is moved
    transparencySlider.addEventListener('input', updateTransparency);
} 