// API Configuration - Your actual Railway backend
const API_BASE = 'https://tow-riders-production.up.railway.app';

// Constants
const PHONE = "9255469711";

// Service pricing (for reference/fallback only - backend is source of truth)
const SERVICE = {
    towing_drivable: {
        base: 100,
        perMile: 5.5
    },
    towing_nondrivable: {
        base: 125,
        perMile: 6.0
    },
    jump_start: {
        base: 85,
        perMile: 0
    },
    tire_change: {
        base: 95,
        perMile: 0
    },
    lockout: {
        base: 95,
        perMile: 0
    },
    fuel_delivery: {
        base: 110,
        perMile: 0
    }
};

// Additional fees (for reference only)
const TIME_FEE = {
    day: 0,
    night: 40
};

const LEVEL_FEE = {
    standard: 0,
    priority: 30,
    rush: 60
};

// State
let selectedService = null;
let pickupAddress = null;
let dropoffAddress = null;
let pickupAutocomplete = null;
let dropoffAutocomplete = null;
let calculatedDistance = null;
let serverPricing = null;

// Utility: format as money
function money(amount) {
    return '$' + amount.toFixed(0);
}

// Get distance in miles
function getDistanceMiles() {
    const dist = parseFloat(document.getElementById('distance').value) || 0;
    return Math.max(0, dist);
}

// Show status message
function showStatus(message, type = 'info') {
    const statusDiv = document.getElementById('distanceStatus');
    statusDiv.textContent = message;
    statusDiv.className = `distance-status ${type}`;
}

// Calculate distance using backend Google Maps API
async function calculateDistanceFromBackend() {
    if (!pickupAddress || !dropoffAddress) {
        return;
    }

    try {
        showStatus('📍 Calculating distance...', 'info');

        const response = await fetch(`${API_BASE}/api/calculate-distance`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                origin: pickupAddress,
                destination: dropoffAddress
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            calculatedDistance = data.distance;
            document.getElementById('distance').value = calculatedDistance.miles.toFixed(1);
            showStatus(`✓ ${calculatedDistance.text} (${calculatedDistance.duration})`, 'success');
            
            // Recalculate pricing with accurate distance
            await calculatePricingFromBackend();
        } else {
            throw new Error(data.error || 'Distance calculation failed');
        }

    } catch (error) {
        console.error('Distance calculation error:', error);
        showStatus('⚠️ Could not calculate distance. Please enter manually.', 'error');
    }
}

// Calculate pricing using backend API
async function calculatePricingFromBackend() {
    if (!selectedService) {
        document.getElementById('total').textContent = '$0';
        document.getElementById('base').textContent = '$0';
        document.getElementById('distFee').textContent = '$0';
        document.getElementById('timeFee').textContent = '$0';
        document.getElementById('levelFee').textContent = '$0';
        document.getElementById('distLabel').textContent = '(0 mi)';
        return;
    }

    const distance = getDistanceMiles();
    const timeOfDay = document.getElementById('timeOfDay').value;
    const serviceLevel = document.getElementById('serviceLevel').value;

    try {
        const response = await fetch(`${API_BASE}/api/calculate-pricing`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                service: selectedService,
                distance: distance,
                options: {
                    timeOfDay: timeOfDay,
                    serviceLevel: serviceLevel
                }
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        if (data.success) {
            serverPricing = data.pricing;
            
            // Update UI with server pricing
            document.getElementById('total').textContent = money(serverPricing.total);
            document.getElementById('base').textContent = money(serverPricing.base);
            document.getElementById('distFee').textContent = money(serverPricing.distance);
            document.getElementById('timeFee').textContent = money(serverPricing.time);
            document.getElementById('levelFee').textContent = money(serverPricing.level);
            document.getElementById('distLabel').textContent = `(${distance.toFixed(1)} mi)`;
            
            // Show/hide fee rows
            document.getElementById('distRow').classList.toggle('hidden', serverPricing.distance === 0);
            document.getElementById('timeRow').classList.toggle('hidden', serverPricing.time === 0);
            document.getElementById('levelRow').classList.toggle('hidden', serverPricing.level === 0);
        } else {
            throw new Error(data.error || 'Pricing calculation failed');
        }

    } catch (error) {
        console.error('Pricing calculation error:', error);
        // Fallback to client-side calculation
        calcFallback();
    }
}

// Fallback client-side calculation
function calcFallback() {
    if (!selectedService) {
        document.getElementById('total').textContent = '$0';
        document.getElementById('base').textContent = '$0';
        document.getElementById('distFee').textContent = '$0';
        document.getElementById('timeFee').textContent = '$0';
        document.getElementById('levelFee').textContent = '$0';
        document.getElementById('distLabel').textContent = '(0 mi)';
        return;
    }
    
    const pricing = SERVICE[selectedService];
    const distance = getDistanceMiles();
    const timeOfDay = document.getElementById('timeOfDay').value;
    const serviceLevel = document.getElementById('serviceLevel').value;
    
    const baseFee = pricing.base;
    const distanceFee = distance * pricing.perMile;
    const timeFee = TIME_FEE[timeOfDay];
    const levelFee = LEVEL_FEE[serviceLevel];
    
    const total = baseFee + distanceFee + timeFee + levelFee;
    
    document.getElementById('total').textContent = money(total);
    document.getElementById('base').textContent = money(baseFee);
    document.getElementById('distFee').textContent = money(distanceFee);
    document.getElementById('timeFee').textContent = money(timeFee);
    document.getElementById('levelFee').textContent = money(levelFee);
    document.getElementById('distLabel').textContent = `(${distance.toFixed(1)} mi)`;
    
    document.getElementById('distRow').classList.toggle('hidden', distanceFee === 0);
    document.getElementById('timeRow').classList.toggle('hidden', timeFee === 0);
    document.getElementById('levelRow').classList.toggle('hidden', levelFee === 0);
}

// Initialize Google Maps Autocomplete
function initAutocomplete() {
    const pickupInput = document.getElementById('pickup');
    const dropoffInput = document.getElementById('dropoff');

    // Check if Google Maps API is loaded
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        console.warn('⚠️ Google Maps API not loaded. Autocomplete disabled.');
        return;
    }

    // Configure autocomplete options (restrict to US)
    const options = {
        componentRestrictions: { country: 'us' },
        fields: ['formatted_address', 'geometry', 'name'],
        types: ['address']
    };

    // Initialize pickup autocomplete
    pickupAutocomplete = new google.maps.places.Autocomplete(pickupInput, options);
    pickupAutocomplete.addListener('place_changed', () => {
        const place = pickupAutocomplete.getPlace();
        if (place.formatted_address) {
            pickupAddress = place.formatted_address;
            console.log('Pickup address selected:', pickupAddress);
            
            // Calculate distance if both addresses are selected
            if (dropoffAddress) {
                calculateDistanceFromBackend();
            }
        }
    });

    // Initialize dropoff autocomplete
    dropoffAutocomplete = new google.maps.places.Autocomplete(dropoffInput, options);
    dropoffAutocomplete.addListener('place_changed', () => {
        const place = dropoffAutocomplete.getPlace();
        if (place.formatted_address) {
            dropoffAddress = place.formatted_address;
            console.log('Dropoff address selected:', dropoffAddress);
            
            // Calculate distance if both addresses are selected
            if (pickupAddress) {
                calculateDistanceFromBackend();
            }
        }
    });

    console.log('✅ Google Maps Autocomplete initialized');
}

// Wire up service tiles
function wireTiles() {
    const tiles = document.querySelectorAll('.service-tile');
    tiles.forEach(tile => {
        tile.addEventListener('click', () => {
            tiles.forEach(t => t.classList.remove('selected'));
            tile.classList.add('selected');
            selectedService = tile.dataset.service;
            calculatePricingFromBackend();
        });
    });
}

// Wire up form inputs
function wireInputs() {
    const inputs = ['vehicleType', 'condition', 'timeOfDay', 'serviceLevel'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', () => calculatePricingFromBackend());
        }
    });
    
    // Distance input - recalculate pricing when manually changed
    const distanceInput = document.getElementById('distance');
    if (distanceInput) {
        distanceInput.addEventListener('input', () => {
            const distance = getDistanceMiles();
            if (distance > 0) {
                calculatePricingFromBackend();
            }
        });
    }
}

// Proceed to review page with quote data
function proceedToReview() {
    // Validate required fields
    const pickup = document.getElementById('pickup').value;
    const distance = document.getElementById('distance').value;
    
    if (!selectedService) {
        alert('⚠️ Please select a service type');
        return;
    }
    
    if (!pickup) {
        alert('⚠️ Please enter a pickup location');
        return;
    }
    
    if (!distance || distance <= 0) {
        alert('⚠️ Please enter a valid distance');
        return;
    }
    
    // Get current pricing
    const currentTotal = document.getElementById('total').textContent.replace('$', '');
    const currentBase = document.getElementById('base').textContent.replace('$', '');
    const currentDistFee = document.getElementById('distFee').textContent.replace('$', '');
    const currentTimeFee = document.getElementById('timeFee').textContent.replace('$', '');
    const currentLevelFee = document.getElementById('levelFee').textContent.replace('$', '');
    
    // Collect quote data
    const quoteData = {
        service: selectedService,
        serviceName: document.querySelector('.service-tile.selected .title')?.textContent || 'Towing Service',
        vehicleType: document.getElementById('vehicleType').value,
        condition: document.getElementById('condition').value,
        pickup: pickup,
        dropoff: document.getElementById('dropoff').value,
        distance: distance,
        timeOfDay: document.getElementById('timeOfDay').value,
        serviceLevel: document.getElementById('serviceLevel').value,
        pricing: {
            base: parseFloat(currentBase) || 0,
            distance: parseFloat(currentDistFee) || 0,
            time: parseFloat(currentTimeFee) || 0,
            level: parseFloat(currentLevelFee) || 0,
            total: parseFloat(currentTotal) || 0
        },
        calculatedDistance: calculatedDistance // Include Google Maps distance data
    };
    
    // Save to sessionStorage
    sessionStorage.setItem('quoteData', JSON.stringify(quoteData));
    
    // Redirect to review page
    window.location.href = 'quote-review.html';
}

// Make function global
window.proceedToReview = proceedToReview;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Initializing Tow Riders Quote Calculator...');
    console.log('🗺️ Google Maps integration mode');
    
    wireTiles();
    wireInputs();
    
    // Initialize Google Maps Autocomplete when API is ready
    if (typeof google !== 'undefined' && google.maps && google.maps.places) {
        initAutocomplete();
    } else {
        // Wait for Google Maps API to load
        window.initAutocomplete = initAutocomplete;
    }
    
    calcFallback(); // Initial calculation
    
    console.log('✅ Quote calculator ready with Google Maps integration!');
});

// Callback for Google Maps API
window.initMap = function() {
    initAutocomplete();
};
