document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const body = document.body;
    const imageUpload = document.getElementById('imageUpload');
    const imagePreview = document.getElementById('imagePreview');
    const previewPlaceholder = document.getElementById('previewPlaceholder');
    const imageCanvas = document.getElementById('imageCanvas');
    const ctx = imageCanvas.getContext('2d');
    const filterList = document.getElementById('filterList');
    const filterPlaceholder = document.getElementById('filterPlaceholder');
    const downloadBtn = document.getElementById('downloadBtn');
    const darkModeToggle = document.getElementById('darkModeToggle');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const activeFiltersInfo = document.getElementById('activeFiltersInfo');
    const activeFilterNamesSpan = document.getElementById('activeFilterNames');
    const imageSection = document.getElementById('imageSection');
    const filterSection = document.getElementById('filterSection');
    const togglePreviewBtn = document.getElementById('togglePreviewBtn');


    // --- State Variables ---
    let originalImage = null;
    let activeFilters = []; // Stores { id, name, styleFn, strength }
    let isPreviewingOriginal = false;


    // --- SVG Path Data Constants (Optional but cleaner) ---
    const SVG_XMLNS = "http://www.w3.org/2000/svg";
    const CURVE_VIEWBOX = "0 0 100 100";
    const DIAGONAL_PATH = "M5,95 L95,5"; // Simple diagonal line path data


    // --- Filter Definitions ---
    const filters = [
        // Basic Filters
        { id: 'grayscale', name: 'Grayscale', styleFn: (s) => `grayscale(${s})` },
        { id: 'sepia', name: 'Sepia', styleFn: (s) => `sepia(${s})` },
        { id: 'invert', name: 'Invert', styleFn: (s) => `invert(${s})` },
        { id: 'brightness', name: 'Brighten', styleFn: (s) => `brightness(${1 + s * 0.5})` },
        { id: 'darken', name: 'Darken', styleFn: (s) => `brightness(${1 - s * 0.5})` },
        { id: 'contrast', name: 'High Contrast', styleFn: (s) => `contrast(${1 + s})` },
        { id: 'lowcontrast', name: 'Low Contrast', styleFn: (s) => `contrast(${1 - s * 0.5})` },
        { id: 'saturate', name: 'Saturate', styleFn: (s) => `saturate(${1 + s * 1.5})` },
        { id: 'desaturate', name: 'Desaturate', styleFn: (s) => `saturate(${1 - s})` },
        { id: 'huerotate90', name: 'Hue Rotate 90deg', styleFn: (s) => `hue-rotate(${s * 90}deg)` },
        { id: 'huerotate180', name: 'Hue Rotate 180deg', styleFn: (s) => `hue-rotate(${s * 180}deg)` },

        // --- COLOR BOOST FILTERS ---
        { id: 'boost_red', name: 'Boost Reds', styleFn: (s) => `saturate(${1 + s * 0.8}) contrast(${1 + s * 0.15})` },
        { id: 'boost_green', name: 'Boost Greens', styleFn: (s) => `saturate(${1 + s * 0.8}) contrast(${1 + s * 0.1}) brightness(${1 + s * 0.05})` },
        { id: 'boost_blue', name: 'Boost Blues', styleFn: (s) => `saturate(${1 + s * 0.8}) contrast(${1 + s * 0.2})` },

        // Blur Filters
        { id: 'blur_subtle', name: 'Blur - Subtle', styleFn: (s) => `blur(${s * 3}px)` },
        { id: 'blur_medium', name: 'Blur - Medium', styleFn: (s) => `blur(${s * 6}px)` },
        { id: 'blur_heavy', name: 'Blur - Heavy', styleFn: (s) => `blur(${s * 10}px)` },
        { id: 'sharp_focus', name: 'Sharp Focus (Sim.)', styleFn: (s) => `blur(${s*1.5}px) contrast(1.1) saturate(1.2)` },
        { id: 'dreamy_glow', name: 'Dreamy Glow', styleFn: (s) => `blur(${s*4}px) brightness(1.1) contrast(0.9)` },

        // Artistic & Combined
        { id: 'vintage', name: 'Vintage', styleFn: (s) => `sepia(${s * 0.6}) contrast(1.1) brightness(${1 - s * 0.1}) saturate(${1 + s * 0.2})` },
        { id: 'coolblue', name: 'Cool Blue', styleFn: (s) => `contrast(1.1) brightness(1.1) sepia(${s*0.3}) hue-rotate(${-20 + s*-10}deg) saturate(1.3)` },
        { id: 'warmglow', name: 'Warm Glow', styleFn: (s) => `contrast(0.9) brightness(1.1) sepia(${s*0.4}) saturate(${1 + s * 0.5})` },
        { id: 'lomo', name: 'Lomo', styleFn: (s) => `contrast(${1 + s * 0.4}) saturate(${1 + s * 0.3}) brightness(${1 - s * 0.1}) hue-rotate(${-5 * s}deg)` },
        { id: 'fadedfilm', name: 'Faded Film', styleFn: (s) => `contrast(${1 - s * 0.2}) brightness(${1 + s*0.1}) saturate(${1 - s*0.3}) sepia(${s * 0.3})` },
        { id: 'vivid', name: 'Vivid', styleFn: (s) => `saturate(${1 + s * 1}) contrast(${1 + s * 0.4}) brightness(1.1)` },
        { id: 'vividwarm', name: 'Vivid Warm', styleFn: (s) => `saturate(${1 + s * 1}) contrast(${1 + s * 0.3}) sepia(${s*0.25}) brightness(1.1)` },
        { id: 'vividcool', name: 'Vivid Cool', styleFn: (s) => `saturate(${1 + s * 1}) contrast(${1 + s * 0.3}) hue-rotate(${-15 * s}deg) brightness(1.1)` },
        { id: 'dramatic', name: 'Dramatic', styleFn: (s) => `contrast(${1 + s * 0.6}) brightness(${1 - s * 0.2}) saturate(${1 + s * 0.2}) grayscale(${s*0.2})` },
        { id: 'dramaticwarm', name: 'Dramatic Warm', styleFn: (s) => `contrast(${1 + s * 0.5}) brightness(${1 - s * 0.15}) sepia(${s*0.3}) saturate(1.2)` },
        { id: 'dramaticcool', name: 'Dramatic Cool', styleFn: (s) => `contrast(${1 + s * 0.5}) brightness(${1 - s * 0.1}) grayscale(${s*0.4}) hue-rotate(${-10 * s}deg) saturate(1.1)` },
        { id: 'mono', name: 'Mono', styleFn: (s) => `grayscale(1) contrast(${1 + s * 0.3}) brightness(${1 - s * 0.1})` },
        { id: 'silvertone', name: 'Silvertone', styleFn: (s) => `grayscale(1) contrast(${1 + s * 0.2}) brightness(${1 + s * 0.1}) sepia(${s*0.15})` },
        { id: 'noir', name: 'Noir', styleFn: (s) => `grayscale(1) contrast(${1 + s * 0.5}) brightness(${1 - s * 0.25})` },

        // --- CURVES (PRESETS) ---
        { id: 'curve_s', name: 'Curves: S-Curve', styleFn: (s) => `contrast(${1 + s * 0.4}) brightness(${1 + s * 0.05})`,
          curvePathData: 'M5,95 C 35,85 65,15 95,5' }, // S-Curve path
        { id: 'curve_flat', name: 'Curves: Flat', styleFn: (s) => `contrast(${1 - s * 0.3}) brightness(${1 + s * 0.1})`,
          curvePathData: 'M5,95 C 35,70 65,30 95,5' }, // Flatter curve path
        { id: 'curve_liftshadow', name: 'Curves: Lift Shadows', styleFn: (s) => `brightness(${1 + s * 0.15}) contrast(${1 - s * 0.1})`,
          curvePathData: 'M5,95 Q 25,50 50,30 T 95,5' }, // Lifted Shadows path (starts higher)
        { id: 'curve_crushblack', name: 'Curves: Crush Blacks', styleFn: (s) => `contrast(${1 + s * 0.2}) brightness(${1 - s * 0.1})`,
          curvePathData: 'M5,95 L 25,95 C 50,80 75,20 95,5' }, // Crushed Blacks path (flat at start)

        // --- COLOR GRADING (PRESETS) ---
        { id: 'grade_coolshadows', name: 'Grade: Cool Shadows', styleFn: (s) => `contrast(1.05) sepia(${s * 0.1}) hue-rotate(${-5 * s}deg) brightness(${1 - s * 0.05})` }, // Slight blue/cyan tint
        { id: 'grade_warmhighs', name: 'Grade: Warm Highlights', styleFn: (s) => `sepia(${s * 0.2}) saturate(${1 + s * 0.1}) brightness(${1 + s * 0.05})` }, // Add warmth
        { id: 'grade_bleach', name: 'Grade: Bleach Bypass', styleFn: (s) => `contrast(${1 + s * 0.5}) saturate(${1 - s * 0.6}) brightness(${1 + s*0.1})` }, // High contrast, desaturated
        { id: 'grade_crossprocess_gb', name: 'Grade: Cross Process (G/B)', styleFn: (s) => `contrast(${1 + s * 0.2}) saturate(${1 + s * 0.3}) hue-rotate(${45 + s * 15}deg) brightness(1.05)` }, // Shift green/blue
        { id: 'grade_crossprocess_rm', name: 'Grade: Cross Process (R/M)', styleFn: (s) => `contrast(${1 + s * 0.2}) saturate(${1 + s * 0.3}) hue-rotate(${-45 - s * 15}deg) sepia(${s*0.15}) brightness(1.05)` }, // Shift red/magenta
    ];


    // --- Event Listeners ---
    imageUpload.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', handleDownload);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    clearFiltersBtn.addEventListener('click', clearAllFilters);
    window.addEventListener('resize', alignFilterPanelTop);
    togglePreviewBtn.addEventListener('mousedown', showOriginalPreview);
    togglePreviewBtn.addEventListener('mouseup', showFilteredPreview);
    togglePreviewBtn.addEventListener('mouseleave', showFilteredPreview);
    togglePreviewBtn.addEventListener('touchstart', showOriginalPreview, { passive: true });
    togglePreviewBtn.addEventListener('touchend', showFilteredPreview);
    togglePreviewBtn.addEventListener('touchcancel', showFilteredPreview);


    // --- Initialization ---
    initDarkMode();
    resetUI();


    // --- Dark Mode Functions ---
     function initDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️ Light Mode';
            updateGlassmorphismClasses(true);
        } else {
            body.classList.remove('dark-mode');
            darkModeToggle.textContent = '🌙 Dark Mode';
            updateGlassmorphismClasses(false);
        }
    }
    function toggleDarkMode() {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        darkModeToggle.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
        updateGlassmorphismClasses(isDarkMode);
    }

    function updateGlassmorphismClasses(isDarkMode) {
        const glassElements = document.querySelectorAll('.glassmorphism, .glassmorphism-light');
        // Currently, light/dark modes handle this via CSS variables,
        // so direct class toggling might not be needed unless specific overrides exist.
        // If you needed to swap classes:
        // glassElements.forEach(el => {
        //     if (el.classList.contains('glassmorphism-light')) {
        //         // Swap or adjust based on dark mode if needed
        //     } else if (el.classList.contains('glassmorphism')) {
        //         // Swap or adjust based on dark mode if needed
        //     }
        // });
         // Force repaint/reflow if needed for backdrop-filter transitions
        // document.body.offsetHeight;
    }


    // --- Layout Alignment ---
     function alignFilterPanelTop() {
        if (imageSection && filterSection && window.getComputedStyle(filterSection).position === 'fixed') {
             const headerHeight = document.querySelector('header')?.offsetHeight || 60;
             const imageRect = imageSection.getBoundingClientRect();
             // Align with image top, but not higher than header bottom
             const targetTop = Math.max(headerHeight + 15, imageRect.top);
             filterSection.style.top = `${targetTop}px`;
              // Adjust max-height calculation
             const viewportHeight = window.innerHeight;
             const availableHeight = viewportHeight - targetTop - 20; // 20px bottom margin
             filterSection.style.maxHeight = `${Math.max(200, availableHeight)}px`; // Min height 200px
        } else if (filterSection) {
            filterSection.style.top = '';
            filterSection.style.maxHeight = ''; // Revert to CSS defined max-height
        }
    }

    // --- Image Handling ---
     function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (originalImage && imagePreview.src.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview.src); // Clean up previous blob
            }
            originalImage = new Image();
            originalImage.onload = () => {
                // Check aspect ratio or size if needed here before proceeding
                imagePreview.src = originalImage.src;
                imagePreview.style.display = 'block';
                previewPlaceholder.style.display = 'none';
                downloadBtn.style.display = 'inline-block';

                clearAllFilters(); // Reset filters for new image
                populateFilterList(); // Populate filters now that image exists
                filterPlaceholder.style.display = 'none'; // Hide placeholder in filter list
                clearFiltersBtn.style.display = 'inline-block';
                activeFiltersInfo.style.display = 'block';
                updateActiveFiltersUI(); // Update active list (will show 'None')

                // Delay alignment slightly to ensure layout is stable
                requestAnimationFrame(() => {
                    alignFilterPanelTop();
                    // Re-align after image might have loaded and changed layout
                     window.addEventListener('resize', alignFilterPanelTop, { passive: true }); // Re-add listener after image load
                });

            };
            originalImage.onerror = () => {
                alert('Error loading image data. The file might be corrupt or unsupported.');
                resetUI();
            };
            // Create blob URL for preview
            try {
                 imagePreview.src = URL.createObjectURL(file); // Use preview src immediately
                 originalImage.src = imagePreview.src;       // Load originalImage from the same blob
            } catch (error) {
                console.error("Error creating object URL:", error);
                alert('Could not create a preview for this file.');
                resetUI();
            }


        } else {
            if (file) { alert('Please select a valid image file (e.g., JPG, PNG, GIF, WEBP).'); }
            imageUpload.value = null; // Reset file input
            // Only reset UI if an image was previously loaded
            if (originalImage) {
                resetUI();
            }
        }
    }


    // --- Filter Logic ---

    function populateFilterList() {
        filterList.innerHTML = ''; // Clear placeholder or existing filters

        if (!originalImage) { // Safety check
             filterPlaceholder.style.display = 'block';
             filterPlaceholder.textContent = "Upload an image to see filters.";
             return;
        }
        filterPlaceholder.style.display = 'none'; // Hide placeholder

        filters.forEach(filter => {
            // 1. Create the main container for this filter item
            const itemContainer = document.createElement('div');
            itemContainer.classList.add('filter-item-container');
            itemContainer.dataset.filterId = filter.id; // Link container too

            // 2. Create the filter button
            const button = document.createElement('button');
            button.textContent = filter.name;
            button.classList.add('filter-button');
            button.addEventListener('click', () => toggleFilter(filter.id, filter.name, filter.styleFn));

            // 3. Create the slider control wrapper (initially hidden via CSS/JS logic)
            const sliderWrapper = document.createElement('div');
            sliderWrapper.classList.add('slider-control-wrapper');
            sliderWrapper.style.display = 'none'; // Start hidden

            // 4. Add SVG Curve Graphic if data exists
            if (filter.curvePathData) {
                const svg = document.createElementNS(SVG_XMLNS, 'svg');
                svg.setAttribute('viewBox', CURVE_VIEWBOX);
                svg.classList.add('curve-svg');

                const bgRect = document.createElementNS(SVG_XMLNS, 'rect');
                bgRect.setAttribute('width', '100');
                bgRect.setAttribute('height', '100');
                bgRect.classList.add('curve-bg');
                svg.appendChild(bgRect);

                const diagonalLine = document.createElementNS(SVG_XMLNS, 'path');
                diagonalLine.setAttribute('d', DIAGONAL_PATH);
                diagonalLine.classList.add('curve-diagonal');
                svg.appendChild(diagonalLine);

                const curvePath = document.createElementNS(SVG_XMLNS, 'path');
                curvePath.setAttribute('d', filter.curvePathData);
                curvePath.classList.add('curve-line');
                svg.appendChild(curvePath);

                sliderWrapper.appendChild(svg); // Add SVG to the slider area
            }

            // 5. Create the slider controls container (for slider + value)
            const sliderControls = document.createElement('div');
            sliderControls.classList.add('slider-controls');

            // 6. Create the range slider input
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.value = '100'; // Default strength 100%
            slider.step = '1';
            slider.classList.add('filter-strength-slider');
            slider.dataset.filterId = filter.id; // Link slider to filter ID

            // 7. Create the span to display the value
            const valueSpan = document.createElement('span');
            valueSpan.classList.add('filter-strength-value');
            valueSpan.textContent = '100%';

            // 8. Add event listener to THIS specific slider
            slider.addEventListener('input', handleIndividualStrengthChange);

            // 9. Append slider and value span to the controls container
            sliderControls.appendChild(slider);
            sliderControls.appendChild(valueSpan);

            // 10. Append the slider controls container to the wrapper
            sliderWrapper.appendChild(sliderControls);


            // 11. Append button and slider wrapper to the item container
            itemContainer.appendChild(button);
            itemContainer.appendChild(sliderWrapper);

            // 12. Append the item container to the main filter list
            filterList.appendChild(itemContainer);
        });
    }


    function toggleFilter(filterId, filterName, styleFn) {
        const existingIndex = activeFilters.findIndex(f => f.id === filterId);
        const itemContainer = filterList.querySelector(`.filter-item-container[data-filter-id="${filterId}"]`);
        const button = itemContainer?.querySelector('.filter-button');
        const sliderWrapper = itemContainer?.querySelector('.slider-control-wrapper');
        const slider = sliderWrapper?.querySelector('.filter-strength-slider');

        if (!button || !sliderWrapper || !slider) {
            console.error("Could not find elements for filter:", filterId);
            return;
        }

        if (existingIndex > -1) {
            // Deactivate Filter
            activeFilters.splice(existingIndex, 1);
            button.classList.remove('active');
            sliderWrapper.style.display = 'none'; // Hide slider wrapper
        } else {
            // Activate Filter
            const defaultStrength = 1.0; // Default strength is 1 (100%)
            activeFilters.push({ id: filterId, name: filterName, styleFn: styleFn, strength: defaultStrength });
            button.classList.add('active');
            slider.value = defaultStrength * 100; // Set slider visually
            // Update the value display next to the slider
            const valueSpan = sliderWrapper.querySelector('.filter-strength-value');
            if(valueSpan) valueSpan.textContent = `${Math.round(defaultStrength * 100)}%`;
            sliderWrapper.style.display = 'flex'; // Show slider wrapper using flex
        }

        applyActiveFilters(); // Apply visual changes to preview
        updateActiveFiltersUI(); // Update active filter names list below
    }


    // Handler for individual filter strength sliders
    function handleIndividualStrengthChange(event) {
        const slider = event.target;
        const filterId = slider.dataset.filterId;
        const strength = parseFloat(slider.value) / 100; // Convert 0-100 range to 0-1 scale

        // Find the corresponding filter in our active list
        const targetFilter = activeFilters.find(f => f.id === filterId);

        if (targetFilter) {
            targetFilter.strength = strength; // Update strength in the state array

            // Update the percentage display next to THIS slider
            const valueSpan = slider.nextElementSibling; // Assumes span is immediately after slider within .slider-controls
            if (valueSpan && valueSpan.classList.contains('filter-strength-value')) {
                valueSpan.textContent = `${Math.round(strength * 100)}%`;
            }

            applyActiveFilters(); // Re-apply all filters with the updated strength
        } else {
             console.warn(`Strength changed for inactive/unknown filter ID: ${filterId}`);
        }
    }


    // Applies the combined filter styles to the image preview
    function applyActiveFilters() {
        if (isPreviewingOriginal) return; // Don't apply if showing original

        let combinedStyle = 'none';
        if (activeFilters.length > 0) {
            // Map each active filter object to its CSS filter string using its styleFn and strength
            combinedStyle = activeFilters
                .map(filter => filter.styleFn(filter.strength))
                .join(' '); // Concatenate all filter strings
        }

        imagePreview.style.filter = combinedStyle.trim();
        // Show/hide toggle button based on whether filters are active
        togglePreviewBtn.style.display = activeFilters.length > 0 ? 'flex' : 'none';
    }


    // Clears all active filters and resets their UI elements
    function clearAllFilters() {
        activeFilters = []; // Clear the state array

        // Hide all individual sliders and deactivate buttons
        document.querySelectorAll('.filter-item-container').forEach(container => {
            const button = container.querySelector('.filter-button');
            const sliderWrapper = container.querySelector('.slider-control-wrapper');
            if (button) button.classList.remove('active');
            if (sliderWrapper) sliderWrapper.style.display = 'none';
            // Optionally reset slider value visually if needed, though hiding is usually sufficient
             const slider = container.querySelector('.filter-strength-slider');
             const valueSpan = container.querySelector('.filter-strength-value');
             if (slider) slider.value = '100';
             if (valueSpan) valueSpan.textContent = '100%';
        });

        applyActiveFilters(); // Remove filters from preview
        updateActiveFiltersUI(); // Update the 'Active Filters' text
    }

    // --- Before/After Preview Toggle Functions ---
    function showOriginalPreview(event) {
        if (activeFilters.length > 0) {
             isPreviewingOriginal = true;
             // Use faster transition when hiding filters
             imagePreview.style.transition = 'filter 0.1s ease-out';
             imagePreview.style.filter = 'none'; // Remove filters
        }
        // Prevent default behavior for touch events if needed (like scrolling)
         if (event && event.cancelable) event.preventDefault();
    }
    function showFilteredPreview() {
        if (isPreviewingOriginal) {
             isPreviewingOriginal = false;
             // Use slightly slower transition when reapplying filters
             imagePreview.style.transition = 'filter 0.3s ease-in-out';
             applyActiveFilters(); // Reapply the stored active filters
        }
    }


    // --- UI Updates ---
    function updateActiveFiltersUI() {
        // Update the list of active filter names displayed at the bottom
        const names = activeFilters.map(f => f.name).join(', ') || 'None';
        activeFilterNamesSpan.textContent = names;

        // Show/hide elements based on whether an image is loaded/filters active
        activeFiltersInfo.style.display = originalImage ? 'block' : 'none';
        clearFiltersBtn.style.display = originalImage ? 'inline-block' : 'none';
        togglePreviewBtn.style.display = originalImage && activeFilters.length > 0 ? 'flex' : 'none';
    }


    // Resets the entire UI to its initial state
    function resetUI() {
        // Hide image preview, show placeholder
        imagePreview.style.display = 'none';
        imagePreview.style.filter = 'none'; // Ensure no filters linger
        previewPlaceholder.style.display = 'block';

        // Hide buttons that require an image
        downloadBtn.style.display = 'none';
        clearFiltersBtn.style.display = 'none';
        togglePreviewBtn.style.display = 'none';

        // Clear the filter list and show its placeholder
        filterList.innerHTML = ''; // Clear filters and sliders
        filterPlaceholder.style.display = 'block';
        filterPlaceholder.textContent = "Upload an image to see filters.";
        activeFiltersInfo.style.display = 'none';

        // Clear state variables
        if (originalImage && imagePreview.src.startsWith('blob:')) {
             URL.revokeObjectURL(imagePreview.src); // Clean up blob URL
        }
        imagePreview.src = '#'; // Reset src
        imageUpload.value = null; // Reset file input
        originalImage = null;
        activeFilters = [];
        isPreviewingOriginal = false;

        // Update UI displays
        // applyActiveFilters(); // Already handled by setting imagePreview.style.filter = 'none'
        updateActiveFiltersUI();

        // Ensure panel alignment is correct for the reset state
        alignFilterPanelTop();
         window.removeEventListener('resize', alignFilterPanelTop); // Remove listener until image loaded
    }

    // --- Download Function ---
     function handleDownload() {
        if (!originalImage || !originalImage.complete || originalImage.naturalWidth === 0) {
            alert('Please upload a valid image first.');
            return;
        }

        // Set canvas dimensions to the *natural* dimensions of the original image
        imageCanvas.width = originalImage.naturalWidth;
        imageCanvas.height = originalImage.naturalHeight;

        // Apply the *same* combined filter string used for the preview
        let combinedFilterStyle = 'none';
         if (activeFilters.length > 0) {
            combinedFilterStyle = activeFilters
                .map(filter => filter.styleFn(filter.strength))
                .join(' ');
        }

        // Apply filters to the canvas context before drawing
        ctx.filter = combinedFilterStyle.trim();

        // Draw the original image onto the canvas. Filters are applied during this draw operation.
        try {
            ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
        } catch (e) {
             console.error("Error drawing image to canvas:", e);
             alert("An error occurred while preparing the image for download.");
             ctx.filter = 'none'; // Reset filter on error
             return;
        }


        // IMPORTANT: Reset the canvas filter *after* drawing to prevent it affecting future operations
        // (though toDataURL should capture the filtered state)
         ctx.filter = 'none';

        // Create the download link
        const link = document.createElement('a');
        const filenameBase = activeFilters.length > 0
            ? activeFilters.map(f => f.id.replace(/[:\s]/g, '_')).join('-') // Sanitize IDs for filename
            : 'original';
        link.download = `filtered-${filenameBase}-${Date.now()}.png`; // Use PNG for transparency support

        try {
             // Get the image data from the canvas as a PNG data URL
             link.href = imageCanvas.toDataURL('image/png');
             // Trigger the download
             link.click();
        } catch (e) {
            console.error("Error creating data URL or triggering download:", e);
            // Handle potential CORS issues if the original image source was cross-origin
            // and wasn't loaded properly via blob URL. Also handle large image errors.
            if (e.name === 'SecurityError') {
                 alert("Could not download image due to security restrictions (CORS). If the image is from another website, please download it first and upload the file directly.");
            } else {
                 alert("Could not download image. The image might be too large or an unknown error occurred.");
            }
        }
    }

});