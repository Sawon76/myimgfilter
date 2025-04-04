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
    // -- REMOVED references to old strength controls --
    // const strengthControl = document.getElementById('strengthControl');
    // const filterStrength = document.getElementById('filterStrength');
    // const strengthValue = document.getElementById('strengthValue');
    // const currentFilterNameSpan = document.getElementById('currentFilterName');
    const clearFiltersBtn = document.getElementById('clearFiltersBtn');
    const activeFiltersInfo = document.getElementById('activeFiltersInfo');
    const activeFilterNamesSpan = document.getElementById('activeFilterNames');
    const imageSection = document.getElementById('imageSection');
    const filterSection = document.getElementById('filterSection');
    const togglePreviewBtn = document.getElementById('togglePreviewBtn');


    // --- State Variables ---
    let originalImage = null;
    let activeFilters = []; // Stores { id, name, styleFn, strength }
    // -- REMOVED lastActiveFilterId --
    // let lastActiveFilterId = null;
    let isPreviewingOriginal = false;

    
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
        // --- END COLOR BOOST FILTERS ---

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
        // Existing NEW Filters
        { id: 'vivid', name: 'Vivid', styleFn: (s) => `saturate(${1 + s * 1}) contrast(${1 + s * 0.4}) brightness(1.1)` },
        { id: 'vividwarm', name: 'Vivid Warm', styleFn: (s) => `saturate(${1 + s * 1}) contrast(${1 + s * 0.3}) sepia(${s*0.25}) brightness(1.1)` },
        { id: 'vividcool', name: 'Vivid Cool', styleFn: (s) => `saturate(${1 + s * 1}) contrast(${1 + s * 0.3}) hue-rotate(${-15 * s}deg) brightness(1.1)` },
        { id: 'dramatic', name: 'Dramatic', styleFn: (s) => `contrast(${1 + s * 0.6}) brightness(${1 - s * 0.2}) saturate(${1 + s * 0.2}) grayscale(${s*0.2})` },
        { id: 'dramaticwarm', name: 'Dramatic Warm', styleFn: (s) => `contrast(${1 + s * 0.5}) brightness(${1 - s * 0.15}) sepia(${s*0.3}) saturate(1.2)` },
        { id: 'dramaticcool', name: 'Dramatic Cool', styleFn: (s) => `contrast(${1 + s * 0.5}) brightness(${1 - s * 0.1}) grayscale(${s*0.4}) hue-rotate(${-10 * s}deg) saturate(1.1)` },
        { id: 'mono', name: 'Mono', styleFn: (s) => `grayscale(1) contrast(${1 + s * 0.3}) brightness(${1 - s * 0.1})` },
        { id: 'silvertone', name: 'Silvertone', styleFn: (s) => `grayscale(1) contrast(${1 + s * 0.2}) brightness(${1 + s * 0.1}) sepia(${s*0.15})` },
        { id: 'noir', name: 'Noir', styleFn: (s) => `grayscale(1) contrast(${1 + s * 0.5}) brightness(${1 - s * 0.25})` },
    ];

   


    // --- Event Listeners ---
    imageUpload.addEventListener('change', handleImageUpload);
    downloadBtn.addEventListener('click', handleDownload);
    darkModeToggle.addEventListener('click', toggleDarkMode);
    // -- REMOVED old strength listener --
    // filterStrength.addEventListener('input', handleStrengthChange);
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
    // (Keep initDarkMode, toggleDarkMode functions)
     function initDarkMode() {
        const isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (isDarkMode) {
            body.classList.add('dark-mode');
            darkModeToggle.textContent = '☀️ Light Mode';
        } else {
            body.classList.remove('dark-mode');
            darkModeToggle.textContent = '🌙 Dark Mode';
        }
    }
    function toggleDarkMode() {
        body.classList.toggle('dark-mode');
        const isDarkMode = body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
        darkModeToggle.textContent = isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode';
    }

    // --- Layout Alignment ---
    // (Keep alignFilterPanelTop function)
     function alignFilterPanelTop() {
        if (imageSection && filterSection && window.getComputedStyle(filterSection).position === 'fixed') {
             const imageRect = imageSection.getBoundingClientRect();
             const targetTop = Math.max(0, imageRect.top);
             filterSection.style.top = `${targetTop}px`;
              filterSection.style.maxHeight = `calc(100vh - ${targetTop}px - 20px)`;
        } else if (filterSection) {
            filterSection.style.top = '';
            filterSection.style.maxHeight = '';
        }
    }

    // --- Image Handling ---
    // (Keep handleImageUpload function)
     function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            if (originalImage && imagePreview.src.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview.src);
            }
            originalImage = new Image();
            originalImage.onload = () => {
                imagePreview.src = originalImage.src;
                imagePreview.style.display = 'block';
                previewPlaceholder.style.display = 'none';
                downloadBtn.style.display = 'inline-block';
                clearAllFilters();
                populateFilterList(); // Populate AFTER image exists
                filterPlaceholder.style.display = 'none';
                clearFiltersBtn.style.display = 'inline-block';
                activeFiltersInfo.style.display = 'block';
                updateActiveFiltersUI();
                requestAnimationFrame(alignFilterPanelTop);
            };
            originalImage.onerror = () => {
                alert('Error loading image data.');
                resetUI();
            };
            originalImage.src = URL.createObjectURL(file);
        } else {
            if (file) { alert('Please select a valid image file.'); }
            imageUpload.value = null;
            if (file && originalImage) { resetUI(); }
        }
    }

    // --- Filter Logic ---

    function populateFilterList() {
        filterList.innerHTML = ''; // Clear placeholder or existing filters

        if (!originalImage) { // Should not happen if called correctly, but safe check
             filterPlaceholder.style.display = 'block';
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
            // Note: We set filterId on container, button doesn't strictly need it now
            // button.dataset.filterId = filter.id;
            button.addEventListener('click', () => toggleFilter(filter.id, filter.name, filter.styleFn));

            // 3. Create the slider control wrapper (initially hidden)
            const sliderWrapper = document.createElement('div');
            sliderWrapper.classList.add('slider-control-wrapper');
            // sliderWrapper.style.display = 'none'; // CSS handles default hide

            // 4. Create the range slider input
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.value = '100'; // Default strength
            slider.step = '1';
            slider.classList.add('filter-strength-slider');
            slider.dataset.filterId = filter.id; // Important: Link slider to filter ID

            // 5. Create the span to display the value
            const valueSpan = document.createElement('span');
            valueSpan.classList.add('filter-strength-value');
            valueSpan.textContent = '100%';

            // 6. Add event listener to THIS specific slider
            slider.addEventListener('input', handleIndividualStrengthChange);

            // 7. Append slider and value span to the wrapper
            sliderWrapper.appendChild(slider);
            sliderWrapper.appendChild(valueSpan);

            // 8. Append button and slider wrapper to the item container
            itemContainer.appendChild(button);
            itemContainer.appendChild(sliderWrapper);

            // 9. Append the item container to the main filter list
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
            sliderWrapper.style.display = 'none'; // Hide slider
        } else {
            // Activate Filter
            const defaultStrength = 1.0; // 100%
            activeFilters.push({ id: filterId, name: filterName, styleFn: styleFn, strength: defaultStrength });
            button.classList.add('active');
            slider.value = defaultStrength * 100; // Set slider value
            // Update the value display next to the slider
            const valueSpan = sliderWrapper.querySelector('.filter-strength-value');
            if(valueSpan) valueSpan.textContent = `${Math.round(defaultStrength * 100)}%`;
            sliderWrapper.style.display = 'block'; // Show slider
        }

        applyActiveFilters(); // Apply visual changes
        updateActiveFiltersUI(); // Update active filter names list
    }


    // NEW Handler for individual sliders
    function handleIndividualStrengthChange(event) {
        const slider = event.target;
        const filterId = slider.dataset.filterId;
        const strength = parseFloat(slider.value) / 100; // Convert 0-100 to 0-1

        // Find the corresponding filter in our active list
        const targetFilter = activeFilters.find(f => f.id === filterId);

        if (targetFilter) {
            targetFilter.strength = strength; // Update strength in the state array

            // Update the percentage display next to THIS slider
            const valueSpan = slider.nextElementSibling; // Assumes span is immediately after slider
            if (valueSpan && valueSpan.classList.contains('filter-strength-value')) {
                valueSpan.textContent = `${Math.round(strength * 100)}%`;
            }

            applyActiveFilters(); // Re-apply all filters with the new strength
        } else {
             console.warn(`Strength changed for inactive/unknown filter ID: ${filterId}`);
        }
    }

    // -- REMOVED old handleStrengthChange function --
    // -- REMOVED old updateStrengthSliderUI function --


    function applyActiveFilters() {
        if (isPreviewingOriginal) return; // Don't apply if showing original

        let combinedStyle = 'none';
        if (activeFilters.length > 0) {
            combinedStyle = activeFilters.map(filter => filter.styleFn(filter.strength)).join(' ');
        }

        imagePreview.style.filter = combinedStyle.trim();
        togglePreviewBtn.style.display = activeFilters.length > 0 ? 'flex' : 'none';
    }


    function clearAllFilters() {
        activeFilters = [];
        // Hide all individual sliders
        document.querySelectorAll('.slider-control-wrapper').forEach(wrapper => {
            wrapper.style.display = 'none';
        });
        // Deactivate all buttons
        document.querySelectorAll('.filter-button.active').forEach(btn => {
            btn.classList.remove('active');
        });
        applyActiveFilters();
        updateActiveFiltersUI();
    }

    // --- Before/After Preview Toggle Functions ---
    // (Keep showOriginalPreview, showFilteredPreview functions)
    function showOriginalPreview(event) {
        if (activeFilters.length > 0) {
             isPreviewingOriginal = true;
             imagePreview.style.transition = 'filter 0.1s ease';
             imagePreview.style.filter = 'none';
        }
         if (event.cancelable) event.preventDefault();
    }
    function showFilteredPreview() {
        if (isPreviewingOriginal) {
             isPreviewingOriginal = false;
             imagePreview.style.transition = 'filter 0.3s ease';
             applyActiveFilters();
        }
    }


    // --- UI Updates ---
    function updateActiveFiltersUI() {
        const names = activeFilters.map(f => f.name).join(', ');
        activeFilterNamesSpan.textContent = names || 'None';
        activeFiltersInfo.style.display = originalImage ? 'block' : 'none';
        clearFiltersBtn.style.display = originalImage ? 'inline-block' : 'none';
        togglePreviewBtn.style.display = originalImage && activeFilters.length > 0 ? 'flex' : 'none';
        // -- REMOVED logic for single strength slider --
    }


    function resetUI() {
        imagePreview.style.display = 'none';
        previewPlaceholder.style.display = 'block';
        downloadBtn.style.display = 'none';
        filterList.innerHTML = ''; // Clear filters and sliders
        filterPlaceholder.style.display = 'block';
        filterPlaceholder.textContent = "Upload an image to see filters.";
        // -- REMOVED reference to old strength control --
        // strengthControl.style.display = 'none';
        clearFiltersBtn.style.display = 'none';
        activeFiltersInfo.style.display = 'none';
        togglePreviewBtn.style.display = 'none';

        // Clear state
        if (originalImage && imagePreview.src.startsWith('blob:')) {
             URL.revokeObjectURL(imagePreview.src);
        }
        imagePreview.src = '#';
        imageUpload.value = null;
        originalImage = null;
        activeFilters = [];
        // -- REMOVED lastActiveFilterId reset --
        isPreviewingOriginal = false;
        applyActiveFilters();
        updateActiveFiltersUI();
        alignFilterPanelTop();
    }

    // --- Download Function ---
    // (Keep handleDownload function as is)
     function handleDownload() {
        if (!originalImage) {
            alert('Please upload an image first.');
            return;
        }
        imageCanvas.width = originalImage.naturalWidth;
        imageCanvas.height = originalImage.naturalHeight;
        let combinedFilterStyle = 'none';
         if (activeFilters.length > 0) {
            combinedFilterStyle = activeFilters.map(filter => filter.styleFn(filter.strength)).join(' ');
        }
        ctx.filter = combinedFilterStyle.trim();
        ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
        ctx.filter = 'none';
        const link = document.createElement('a');
        const filenameBase = activeFilters.length > 0 ? activeFilters.map(f => f.id).join('-') : 'original';
        link.download = `filtered-${filenameBase}-${Date.now()}.png`;
        try {
             link.href = imageCanvas.toDataURL('image/png');
             link.click();
        } catch (e) {
            console.error("Error creating data URL:", e);
            alert("Could not download image. If the image is from another website, try downloading it and uploading the file directly.");
        }
    }

});