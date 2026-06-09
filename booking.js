// ========================================
// BOOKING.JS - OpenStreetMap Integration
// With Backend API Integration
// ========================================

// ========================================
// CONFIGURATION
// ========================================
const CONFIG = {
    PHONE: '6502746703',
    API_BASE_URL: window.location.hostname === 'localhost' 
        ? 'http://localhost:5000/api/v1'
        : 'https://api.towriders.com/api/v1',
    SERVICE_PRICES: {
        'Emergency Tow': { base: 75, perMile: 5 },
        'Jump Start': { base: 50, perMile: 0 },
        'Tire Change': { base: 60, perMile: 0 },
        'Lockout': { base: 55, perMile: 0 },
        'Fuel Delivery': { base: 45, perMile: 2 }
    },
    NOMINATIM_URL: 'https://nominatim.openstreetmap.org/search',
    OSRM_URL: 'https://router.project-osrm.org/route/v1/driving',
    DEBOUNCE_MS: 500,
    THROTTLE_MS: 1000, // 1 request per second per field
    MIN_QUERY_LENGTH: 3
};

// Map service names to backend enum values
const SERVICE_TYPE_MAP = {
    'Emergency Tow': 'EMERGENCY',
    'Jump Start': 'STANDARD',
    'Tire Change': 'STANDARD',
    'Lockout': 'STANDARD',
    'Fuel Delivery': 'STANDARD'
};

const VEHICLE_TYPE_MAP = {
    'Car': 'SEDAN',
    'SUV': 'SUV',
    'Truck': 'TRUCK',
    'Motorcycle': 'MOTORCYCLE',
    'Commercial': 'COMMERCIAL'
};

// ========================================
// GLOBAL STATE
// ========================================
let pickupLocation = null;
let dropoffLocation = null;
let debounceTimers = { pickup: null, dropoff: null };
let throttleTimers = { pickup: null, dropoff: null };
let lastRequestTime = { pickup: 0, dropoff: 0 };
let pendingRequests = { pickup: null, dropoff: null };
let requestCache = new Map();

// ========================================
// AUTOCOMPLETE SETUP
// ========================================
function setupPickupAutocomplete() {
    console.log('🔵 Setting up pickup autocomplete');
    const input = document.getElementById('pickupLocation');
    const container = createDropdownContainer('pickup');
    input.parentElement.appendChild(container);
    
    input.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Check if we should show calculate button
        updateCalculateButton();
        
        if (query.length < CONFIG.MIN_QUERY_LENGTH) {
            hideDropdown('pickup');
            return;
        }
        
        // Clear existing debounce timer
        if (debounceTimers.pickup) {
            clearTimeout(debounceTimers.pickup);
        }
        
        // Store the query for throttled execution
        pendingRequests.pickup = query;
        
        // Debounce first (wait for user to stop typing)
        debounceTimers.pickup = setTimeout(() => {
            throttledSearch('pickup');
        }, CONFIG.DEBOUNCE_MS);
    });
    
    input.addEventListener('blur', function() {
        setTimeout(() => hideDropdown('pickup'), 200);
    });
    
    input.addEventListener('focus', function() {
        if (pickupLocation && this.value !== pickupLocation.display_name) {
            console.log('🔄 Pickup address changed, clearing location');
            pickupLocation = null;
            clearDistance();
            updateCalculateButton();
            updateStatus('Select pickup address from suggestions', 'info');
        }
    });
}

function setupDropoffAutocomplete() {
    console.log('🔵 Setting up dropoff autocomplete');
    const input = document.getElementById('dropoffLocation');
    const container = createDropdownContainer('dropoff');
    input.parentElement.appendChild(container);
    
    input.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Check if we should show calculate button
        updateCalculateButton();
        
        if (query.length < CONFIG.MIN_QUERY_LENGTH) {
            hideDropdown('dropoff');
            return;
        }
        
        if (debounceTimers.dropoff) {
            clearTimeout(debounceTimers.dropoff);
        }
        
        pendingRequests.dropoff = query;
        
        debounceTimers.dropoff = setTimeout(() => {
            throttledSearch('dropoff');
        }, CONFIG.DEBOUNCE_MS);
    });
    
    input.addEventListener('blur', function() {
        setTimeout(() => hideDropdown('dropoff'), 200);
    });
    
    input.addEventListener('focus', function() {
        if (dropoffLocation && this.value !== dropoffLocation.display_name) {
            console.log('🔄 Dropoff address changed, clearing location');
            dropoffLocation = null;
            clearDistance();
            updateCalculateButton();
            updateStatus('Select dropoff address from suggestions', 'info');
        }
    });
}

// ========================================
// REQUEST THROTTLING
// ========================================
function throttledSearch(type) {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime[type];
    
    console.log(`⏱️ Throttle check for ${type}: ${timeSinceLastRequest}ms since last request`);
    
    if (timeSinceLastRequest >= CONFIG.THROTTLE_MS) {
        // Enough time has passed, execute immediately
        console.log(`✅ Throttle window passed, executing search for ${type}`);
        lastRequestTime[type] = now;
        
        if (pendingRequests[type]) {
            searchNominatim(pendingRequests[type], type);
            pendingRequests[type] = null;
        }
    } else {
        // Need to wait, schedule for later
        const waitTime = CONFIG.THROTTLE_MS - timeSinceLastRequest;
        console.log(`⏳ Throttling ${type} request, waiting ${waitTime}ms`);
        
        if (throttleTimers[type]) {
            clearTimeout(throttleTimers[type]);
        }
        
        throttleTimers[type] = setTimeout(() => {
            console.log(`✅ Throttle wait complete for ${type}, executing search`);
            lastRequestTime[type] = Date.now();
            
            if (pendingRequests[type]) {
                searchNominatim(pendingRequests[type], type);
                pendingRequests[type] = null;
            }
        }, waitTime);
    }
}

// ========================================
// DROPDOWN UI
// ========================================
function createDropdownContainer(type) {
    const container = document.createElement('div');
    container.id = `${type}Dropdown`;
    container.className = 'autocomplete-dropdown';
    container.style.cssText = `
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 2px solid #3b82f6;
        border-top: none;
        border-radius: 0 0 10px 10px;
        max-height: 250px;
        overflow-y: auto;
        z-index: 1000;
        display: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    return container;
}

function showDropdown(type, results) {
    const dropdown = document.getElementById(`${type}Dropdown`);
    if (!dropdown || !results || results.length === 0) {
        hideDropdown(type);
        return;
    }
    
    dropdown.innerHTML = '';
    
    results.forEach(result => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.style.cssText = `
            padding: 12px 16px;
            cursor: pointer;
            border-bottom: 1px solid #e5e7eb;
            transition: background 0.2s;
        `;
        item.textContent = result.display_name;
        
        item.addEventListener('mouseenter', function() {
            this.style.background = '#f3f4f6';
        });
        
        item.addEventListener('mouseleave', function() {
            this.style.background = 'white';
        });
        
        item.addEventListener('mousedown', function(e) {
            e.preventDefault();
            selectLocation(type, result);
        });
        
        dropdown.appendChild(item);
    });
    
    dropdown.style.display = 'block';
    console.log(`✅ Showing ${results.length} suggestions for ${type}`);
}

function hideDropdown(type) {
    const dropdown = document.getElementById(`${type}Dropdown`);
    if (dropdown) {
        dropdown.style.display = 'none';
    }
}

// ========================================
// NOMINATIM SEARCH
// ========================================
async function searchNominatim(query, type) {
    console.log(`🔍 Searching Nominatim for "${query}" (${type})`);
    
    const cacheKey = `nominatim:${query.toLowerCase()}`;
    if (requestCache.has(cacheKey)) {
        console.log('📦 Using cached results');
        showDropdown(type, requestCache.get(cacheKey));
        return;
    }
    
    try {
        const url = `${CONFIG.NOMINATIM_URL}?format=jsonv2&addressdetails=1&limit=5&countrycodes=us&q=${encodeURIComponent(query)}`;
        
        const response = await fetch(url, {
            headers: { 'User-Agent': 'ExpressTowBooking/1.0' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const results = await response.json();
        console.log(`✅ Nominatim returned ${results.length} results`);
        
        requestCache.set(cacheKey, results);
        showDropdown(type, results);
        
    } catch (error) {
        console.error(`❌ Nominatim search failed:`, error);
        updateStatus('⚠️ Address search unavailable. Type manually.', 'warning');
    }
}

// ========================================
// LOCATION SELECTION
// ========================================
function selectLocation(type, result) {
    console.log(`\n========================================`);
    console.log(`📍 ${type.toUpperCase()} SELECTED`);
    console.log(`Address: ${result.display_name}`);
    console.log(`Latitude: ${result.lat}`);
    console.log(`Longitude: ${result.lon}`);
    console.log(`========================================\n`);
    
    const location = {
        display_name: result.display_name,
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon)
    };
    
    if (type === 'pickup') {
        pickupLocation = location;
        document.getElementById('pickupLocation').value = location.display_name;
        hideDropdown('pickup');
        
        console.log('✅ Pickup location saved');
        console.log('🔍 Checking if dropoff exists:', !!dropoffLocation);
        
        updateStatus('✅ Pickup selected. Select drop-off location.', 'success');
        updateCalculateButton();
        
        if (dropoffLocation) {
            console.log('✅ Both locations available, triggering route calculation...');
            calculateRouteDistanceOSRM();
        }
    } else {
        dropoffLocation = location;
        document.getElementById('dropoffLocation').value = location.display_name;
        hideDropdown('dropoff');
        
        console.log('✅ Dropoff location saved');
        console.log('🔍 Checking if pickup exists:', !!pickupLocation);
        
        updateCalculateButton();
        
        if (pickupLocation) {
            console.log('✅ Both locations available, triggering route calculation...');
            calculateRouteDistanceOSRM();
        } else {
            updateStatus('✅ Drop-off selected. Select pickup location.', 'success');
        }
    }
}

// ========================================
// CALCULATE BUTTON MANAGEMENT
// ========================================
function updateCalculateButton() {
    const btn = document.getElementById('calculateDistanceBtn');
    const pickupInput = document.getElementById('pickupLocation');
    const dropoffInput = document.getElementById('dropoffLocation');
    
    if (!btn || !pickupInput || !dropoffInput) return;
    
    const hasPickupText = pickupInput.value.trim().length >= CONFIG.MIN_QUERY_LENGTH;
    const hasDropoffText = dropoffInput.value.trim().length >= CONFIG.MIN_QUERY_LENGTH;
    const hasPickupCoords = pickupLocation !== null;
    const hasDropoffCoords = dropoffLocation !== null;
    
    // Show button if both fields have text but at least one is missing coordinates
    const shouldShow = hasPickupText && hasDropoffText && (!hasPickupCoords || !hasDropoffCoords);
    
    btn.style.display = shouldShow ? 'inline-block' : 'none';
    
    if (shouldShow) {
        console.log('🔘 Calculate Distance button shown (manual entry detected)');
    }
}

// ========================================
// MANUAL GEOCODING & ROUTING
// ========================================
async function calculateDistanceFromManualEntry() {
    console.log(`\n========================================`);
    console.log(`📏 MANUAL DISTANCE CALCULATION`);
    console.log(`========================================`);
    
    const pickupInput = document.getElementById('pickupLocation');
    const dropoffInput = document.getElementById('dropoffLocation');
    
    const pickupText = pickupInput.value.trim();
    const dropoffText = dropoffInput.value.trim();
    
    console.log('Pickup text:', pickupText);
    console.log('Dropoff text:', dropoffText);
    
    if (!pickupText || !dropoffText) {
        updateStatus('⚠️ Please enter both pickup and drop-off addresses', 'error');
        return;
    }
    
    try {
        // Geocode pickup if needed
        if (!pickupLocation || pickupLocation.display_name !== pickupText) {
            console.log('📍 Geocoding pickup address...');
            updateStatus('⏳ Finding pickup location...', 'info');
            
            pickupLocation = await geocodeAddress(pickupText, 'pickup');
            
            if (!pickupLocation) {
                throw new Error('Could not find pickup address');
            }
            
            console.log('✅ Pickup geocoded:', pickupLocation.display_name);
        }
        
        // Geocode dropoff if needed
        if (!dropoffLocation || dropoffLocation.display_name !== dropoffText) {
            console.log('📍 Geocoding dropoff address...');
            updateStatus('⏳ Finding drop-off location...', 'info');
            
            dropoffLocation = await geocodeAddress(dropoffText, 'dropoff');
            
            if (!dropoffLocation) {
                throw new Error('Could not find drop-off address');
            }
            
            console.log('✅ Dropoff geocoded:', dropoffLocation.display_name);
        }
        
        // Now calculate route
        console.log('✅ Both locations geocoded, calculating route...');
        await calculateRouteDistanceOSRM();
        
        // Hide button after successful calculation
        const btn = document.getElementById('calculateDistanceBtn');
        if (btn) btn.style.display = 'none';
        
    } catch (error) {
        console.error('❌ Manual calculation failed:', error);
        updateStatus(`⚠️ ${error.message}. Enter miles manually.`, 'error');
    }
    
    console.log(`========================================\n`);
}

// ========================================
// GEOCODING HELPER
// ========================================
async function geocodeAddress(query, type) {
    console.log(`🌍 Geocoding "${query}" (${type})`);
    
    try {
        const url = `${CONFIG.NOMINATIM_URL}?format=jsonv2&limit=1&countrycodes=us&q=${encodeURIComponent(query)}`;
        
        console.log('📡 Nominatim geocode request:', url);
        
        const response = await fetch(url, {
            headers: { 'User-Agent': 'ExpressTowBooking/1.0' }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const results = await response.json();
        console.log('📊 Geocode results:', results);
        
        if (!results || results.length === 0) {
            throw new Error(`No results found for "${query}"`);
        }
        
        const result = results[0];
        const location = {
            display_name: result.display_name,
            lat: parseFloat(result.lat),
            lon: parseFloat(result.lon)
        };
        
        console.log(`✅ Geocoded to: ${location.display_name}`);
        console.log(`📍 Coordinates: ${location.lat}, ${location.lon}`);
        
        return location;
        
    } catch (error) {
        console.error(`❌ Geocoding failed for "${query}":`, error);
        throw error;
    }
}

// ========================================
// OSRM ROUTING
// ========================================
async function calculateRouteDistanceOSRM() {
    console.log(`\n========================================`);
    console.log(`🚗 CALCULATING ROUTE DISTANCE`);
    console.log(`========================================`);
    
    if (!pickupLocation || !dropoffLocation) {
        console.error('❌ Missing location data');
        console.log('Pickup:', pickupLocation);
        console.log('Dropoff:', dropoffLocation);
        return;
    }
    
    console.log('📍 From:', pickupLocation.display_name);
    console.log('📍 Coordinates:', pickupLocation.lat, pickupLocation.lon);
    console.log('📍 To:', dropoffLocation.display_name);
    console.log('📍 Coordinates:', dropoffLocation.lat, dropoffLocation.lon);
    
    updateStatus('⏳ Calculating route...', 'info');
    
    try {
        const url = `${CONFIG.OSRM_URL}/${pickupLocation.lon},${pickupLocation.lat};${dropoffLocation.lon},${dropoffLocation.lat}?overview=false&alternatives=false&steps=false`;
        
        console.log('📡 Calling OSRM routing API...');
        console.log('URL:', url);
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 OSRM response received:', data);
        
        if (data.code !== 'Ok') {
            throw new Error(`OSRM error: ${data.code}`);
        }
        
        if (!data.routes || data.routes.length === 0) {
            throw new Error('No routes found');
        }
        
        const route = data.routes[0];
        console.log('✅ Route found:', route);
        
        const distanceMeters = route.distance;
        const durationSeconds = route.duration;
        
        console.log('Raw distance (meters):', distanceMeters);
        console.log('Raw duration (seconds):', durationSeconds);
        
        const miles = distanceMeters / 1609.344;
        const minutes = Math.round(durationSeconds / 60);
        
        console.log('✅ Distance calculated:', miles.toFixed(1), 'miles');
        console.log('✅ Duration calculated:', minutes, 'minutes');
        
        const distanceInput = document.getElementById('distanceField');
        if (distanceInput) {
            const oldValue = distanceInput.value;
            distanceInput.value = miles.toFixed(1);
            console.log(`✅ Distance field updated: "${oldValue}" → "${miles.toFixed(1)}"`);
            
            console.log('🔔 Triggering input events for price update...');
            distanceInput.dispatchEvent(new Event('input', { bubbles: true }));
            distanceInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        const statusText = `✅ ${miles.toFixed(1)} miles • ~${minutes} min drive`;
        updateStatus(statusText, 'success');
        console.log('📢 Status updated:', statusText);
        
        console.log('💰 Calling calculatePrice()...');
        calculatePrice();
        console.log('✅ Price recalculation complete');
        
        console.log(`========================================\n`);
        
    } catch (error) {
        console.error('❌ OSRM routing failed:', error);
        console.log(`========================================\n`);
        updateStatus('⚠️ Could not calculate route. Enter miles manually.', 'error');
    }
}

// ========================================
// HELPER FUNCTIONS
// ========================================
function clearDistance() {
    const distanceInput = document.getElementById('distanceField');
    if (distanceInput) {
        distanceInput.value = '';
        console.log('🔄 Distance cleared');
    }
    calculatePrice();
}

function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('distanceStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = 'distance-status ' + type;
        statusElement.style.display = 'block';
    }
}

// ========================================
// ENHANCED PRICE CALCULATION
// ========================================
function calculatePrice() {
    console.log('💰 calculatePrice() called');
    
    const selectedCard = document.querySelector('.service-card.selected');
    if (!selectedCard) {
        console.log('⚠️ No service selected');
        return;
    }
    
    const serviceName = selectedCard.querySelector('.service-name').textContent;
    const servicePrice = CONFIG.SERVICE_PRICES[serviceName] || CONFIG.SERVICE_PRICES['Emergency Tow'];
    
    // Get input values
    const distanceInput = document.getElementById('distanceField');
    const distance = parseFloat(distanceInput?.value || 0);
    
    // Get vehicle condition (radio button)
    const conditionRadio = document.querySelector('input[name="vehicleCondition"]:checked');
    const condition = conditionRadio?.value || 'drivable';
    
    // Get time of day
    const timeSelect = document.getElementById('timeOfDay');
    const timeOfDay = timeSelect?.value || 'daytime';
    
    // Get urgency
    const urgencySelect = document.getElementById('urgency');
    const urgency = urgencySelect?.value || 'standard';
    
    console.log('Service:', serviceName);
    console.log('Distance:', distance, 'miles');
    console.log('Condition:', condition);
    console.log('Time of day:', timeOfDay);
    console.log('Urgency:', urgency);
    
    // PRICING CALCULATION
    // 1. Base Fee
    const baseFee = servicePrice.base;
    
    // 2. Distance Fee
    const distanceFee = distance * servicePrice.perMile;
    
    // 3. Vehicle Condition Surcharge
    const conditionFees = {
        'drivable': 0,
        'flatTire': 15,
        'deadBattery': 25,
        'accident': 50
    };
    const conditionFee = conditionFees[condition] || 0;
    
    // 4. Time-based Surcharge
    const timeFees = {
        'daytime': 0,
        'rush_hour': 20,
        'late_night': 35,
        'after_midnight': 50
    };
    const timeFee = timeFees[timeOfDay] || 0;
    
    // 5. Urgency Surcharge
    const urgencyFees = {
        'standard': 0,
        'priority': 30,
        'emergency': 50
    };
    const urgencyFee = urgencyFees[urgency] || 0;
    
    // Calculate total
    const total = baseFee + distanceFee + conditionFee + timeFee + urgencyFee;
    
    console.log('✅ Pricing Breakdown:');
    console.log('  Base Fee:', `$${baseFee}`);
    console.log('  Distance Fee:', `$${distanceFee.toFixed(2)}`);
    console.log('  Condition Fee:', `$${conditionFee}`);
    console.log('  Time Fee:', `$${timeFee}`);
    console.log('  Urgency Fee:', `$${urgencyFee}`);
    console.log('  TOTAL:', `$${Math.round(total)}`);
    
    // Update price display
    const priceAmount = document.querySelector('.price-amount');
    if (priceAmount) {
        const oldPrice = priceAmount.textContent;
        priceAmount.textContent = `$${Math.round(total)}`;
        console.log(`💰 Price updated: ${oldPrice} → $${Math.round(total)}`);
    }
    
    // Update breakdown display
    updatePriceBreakdown({
        base: baseFee,
        distance: distanceFee,
        distanceMiles: distance,
        condition: conditionFee,
        time: timeFee,
        urgency: urgencyFee,
        total: total
    });
}

function updatePriceBreakdown(breakdown) {
    const baseEl = document.getElementById('breakdownBase');
    const distanceEl = document.getElementById('breakdownDistance');
    const conditionEl = document.getElementById('breakdownCondition');
    const timeEl = document.getElementById('breakdownTime');
    const urgencyEl = document.getElementById('breakdownUrgency');
    
    // Base fee (always shown)
    if (baseEl) {
        baseEl.textContent = `Base: $${breakdown.base}`;
        baseEl.style.display = '';
    }
    
    // Distance fee
    if (distanceEl && breakdown.distance > 0) {
        distanceEl.textContent = `Distance (${breakdown.distanceMiles.toFixed(1)} mi): $${Math.round(breakdown.distance)}`;
        distanceEl.style.display = '';
    } else if (distanceEl) {
        distanceEl.style.display = 'none';
    }
    
    // Condition fee
    if (conditionEl && breakdown.condition > 0) {
        conditionEl.textContent = `Condition: +$${breakdown.condition}`;
        conditionEl.style.display = '';
    } else if (conditionEl) {
        conditionEl.style.display = 'none';
    }
    
    // Time fee
    if (timeEl && breakdown.time > 0) {
        timeEl.textContent = `Time: +$${breakdown.time}`;
        timeEl.style.display = '';
    } else if (timeEl) {
        timeEl.style.display = 'none';
    }
    
    // Urgency fee
    if (urgencyEl && breakdown.urgency > 0) {
        urgencyEl.textContent = `Urgency: +$${breakdown.urgency}`;
        urgencyEl.style.display = '';
    } else if (urgencyEl) {
        urgencyEl.style.display = 'none';
    }
    
    console.log('✅ Price breakdown UI updated');
}

// ========================================
// SERVICE CARD SELECTION
// ========================================
function initServiceCards() {
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', function() {
            document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
            this.classList.add('selected');
            console.log('🚗 Service selected:', this.querySelector('.service-name').textContent);
            calculatePrice();
        });
    });
}

// ========================================
// BACKEND API INTEGRATION
// ========================================
async function submitBookingToBackend(bookingData) {
    console.log('\n========================================');
    console.log('📡 SUBMITTING BOOKING TO BACKEND');
    console.log('========================================');
    
    try {
        // Map form data to backend API format
        const apiPayload = {
            // Customer information
            customerName: `${bookingData.contact.firstName} ${bookingData.contact.lastName}`,
            customerPhone: bookingData.contact.phone,
            customerEmail: bookingData.contact.email,
            
            // Location details
            pickupAddress: bookingData.location.pickup,
            pickupLat: bookingData.location.pickupCoords?.lat || null,
            pickupLng: bookingData.location.pickupCoords?.lon || null,
            dropoffAddress: bookingData.location.dropoff,
            dropoffLat: bookingData.location.dropoffCoords?.lat || null,
            dropoffLng: bookingData.location.dropoffCoords?.lon || null,
            
            // Vehicle information
            vehicleType: VEHICLE_TYPE_MAP[bookingData.vehicle.type] || 'SEDAN',
            vehicleMake: bookingData.vehicle.make || null,
            vehicleModel: bookingData.vehicle.model || null,
            vehicleYear: bookingData.vehicle.year ? parseInt(bookingData.vehicle.year) : null,
            vehicleColor: bookingData.vehicle.color || null,
            
            // Service details
            serviceType: SERVICE_TYPE_MAP[bookingData.service.name] || 'STANDARD',
            condition: determineVehicleCondition(bookingData.vehicle.condition),
            
            // Distance and pricing
            distance: parseFloat(bookingData.location.distance) || 0,
            estimatedTime: 0, // Will be calculated by backend
            
            // Price breakdown
            baseFee: parseFloat(bookingData.pricing?.baseFee || 0),
            distanceFee: parseFloat(bookingData.pricing?.distanceFee || 0),
            vehicleFee: 0,
            timeFee: 0,
            emergencyFee: 0,
            recoveryFee: 0,
            difficultyFee: 0,
            totalPrice: parseFloat(bookingData.pricing?.total || 0),
            
            // Additional notes
            notes: bookingData.contact.instructions || null
        };
        
        console.log('📦 API Payload:', apiPayload);
        
        // Show loading indicator
        showLoadingIndicator('Submitting booking...');
        
        // Make API request
        const response = await fetch(`${CONFIG.API_BASE_URL}/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(apiPayload)
        });
        
        console.log('📡 Response status:', response.status);
        
        const result = await response.json();
        console.log('📊 API Response:', result);
        
        hideLoadingIndicator();
        
        if (!response.ok) {
            // Log validation errors if present
            if (result.errors) {
                console.error('❌ Validation Errors:', result.errors);
            }
            throw new Error(result.message || result.errors?.[0]?.msg || 'Failed to create booking');
        }
        
        if (result.success && result.data) {
            console.log('✅ Booking created successfully');
            console.log('📝 Booking ID:', result.data.id);
            
            // Save booking ID and data for confirmation page
            const confirmationData = {
                ...bookingData,
                bookingId: result.data.id,
                backendData: result.data
            };
            
            sessionStorage.setItem('bookingData', JSON.stringify(confirmationData));
            
            console.log('✅ Booking data saved with backend ID');
            console.log('🔄 Redirecting to review page...');
            
            // Redirect to review page instead of confirmation
            window.location.href = 'booking-review.html';
            
        } else {
            throw new Error('Invalid response from server');
        }
        
        console.log('========================================\n');
        
    } catch (error) {
        console.error('❌ Backend submission failed:', error);
        hideLoadingIndicator();
        
        // Show user-friendly error message
        showErrorMessage(
            'Booking Submission Failed',
            error.message || 'Unable to submit booking. Please try again or call us directly.',
            CONFIG.PHONE
        );
        
        console.log('========================================\n');
    }
}

function determineVehicleCondition(condition) {
    // condition is now a string value: 'drivable', 'deadBattery', 'accident', 'flatTire'
    switch(condition) {
        case 'accident':
            return 'ACCIDENT';
        case 'deadBattery':
            return 'BREAKDOWN';
        case 'flatTire':
            return 'BREAKDOWN';
        case 'drivable':
            return 'DRIVABLE';
        default:
            return 'NOT_DRIVABLE';
    }
}

function showLoadingIndicator(message) {
    // Create loading overlay
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;
    
    const spinner = document.createElement('div');
    spinner.style.cssText = `
        background: white;
        padding: 30px 40px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    
    spinner.innerHTML = `
        <div style="
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        "></div>
        <p style="font-size: 18px; color: #1f2937; margin: 0;">${message}</p>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    overlay.appendChild(spinner);
    document.body.appendChild(overlay);
}

function hideLoadingIndicator() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.remove();
    }
}

function showErrorMessage(title, message, phone) {
    const overlay = document.createElement('div');
    overlay.id = 'errorOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        padding: 20px;
    `;
    
    const errorBox = document.createElement('div');
    errorBox.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 500px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
    `;
    
    errorBox.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <div style="
                width: 60px;
                height: 60px;
                background: #fee2e2;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 15px;
            ">
                <i class="fas fa-exclamation-triangle" style="font-size: 30px; color: #dc2626;"></i>
            </div>
            <h3 style="font-size: 24px; color: #1f2937; margin: 0 0 10px 0;">${title}</h3>
            <p style="font-size: 16px; color: #6b7280; margin: 0 0 20px 0;">${message}</p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button onclick="this.closest('#errorOverlay').remove()" style="
                flex: 1;
                padding: 12px 20px;
                background: #3b82f6;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                min-width: 120px;
            ">Try Again</button>
            <a href="tel:${phone}" style="
                flex: 1;
                padding: 12px 20px;
                background: #dc2626;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-weight: 600;
                text-decoration: none;
                text-align: center;
                min-width: 120px;
            ">Call ${phone}</a>
        </div>
    `;
    
    overlay.appendChild(errorBox);
    document.body.appendChild(overlay);
    
    // Click outside to close
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.remove();
        }
    });
}

// ========================================
// FORM SUBMISSION
// ========================================
function initFormSubmit() {
    const form = document.querySelector('.booking-form');
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Collect all form data
            const pickup = document.getElementById('pickupLocation')?.value;
            const dropoff = document.getElementById('dropoffLocation')?.value;
            const distance = document.getElementById('distanceField')?.value;
            const selectedCard = document.querySelector('.service-card.selected');
            const serviceName = selectedCard?.querySelector('.service-name')?.textContent || 'Emergency Tow';
            const priceText = document.querySelector('.price-amount')?.textContent || '$125';
            const price = parseFloat(priceText.replace('$', ''));
            
            // Vehicle information
            const vehicleType = document.getElementById('vehicleType')?.value;
            const vehicleYear = document.getElementById('vehicleYear')?.value;
            const vehicleMake = document.getElementById('vehicleMake')?.value;
            const vehicleModel = document.getElementById('vehicleModel')?.value;
            const vehicleColor = document.getElementById('vehicleColor')?.value;
            
            // Vehicle condition (radio button)
            const conditionRadio = document.querySelector('input[name="vehicleCondition"]:checked');
            const vehicleCondition = conditionRadio?.value || 'drivable';
            
            // Time of day and urgency
            const timeOfDay = document.getElementById('timeOfDay')?.value || 'daytime';
            const urgency = document.getElementById('urgency')?.value || 'standard';
            
            // Contact information
            const firstName = document.getElementById('firstName')?.value;
            const lastName = document.getElementById('lastName')?.value;
            const phone = document.getElementById('phone')?.value;
            const email = document.getElementById('email')?.value;
            const instructions = document.getElementById('instructions')?.value;
            
            // Validation
            if (!pickup) {
                alert('⚠️ Please enter a pickup location');
                return;
            }
            
            if (!firstName || !lastName || !phone || !email) {
                alert('⚠️ Please fill in all contact information');
                return;
            }
            
            // Email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                alert('⚠️ Please enter a valid email address');
                return;
            }
            
            // Calculate enhanced pricing breakdown
            const servicePrice = CONFIG.SERVICE_PRICES[serviceName] || CONFIG.SERVICE_PRICES['Emergency Tow'];
            const distanceValue = parseFloat(distance || 0);
            
            // Base and distance fees
            const baseFee = servicePrice.base;
            const distanceFee = distanceValue * servicePrice.perMile;
            
            // Condition surcharge
            const conditionFees = {
                'drivable': 0,
                'flatTire': 15,
                'deadBattery': 25,
                'accident': 50
            };
            const conditionFee = conditionFees[vehicleCondition] || 0;
            
            // Time-based surcharge
            const timeFees = {
                'daytime': 0,
                'rush_hour': 20,
                'late_night': 35,
                'after_midnight': 50
            };
            const timeFee = timeFees[timeOfDay] || 0;
            
            // Urgency surcharge
            const urgencyFees = {
                'standard': 0,
                'priority': 30,
                'emergency': 50
            };
            const urgencyFee = urgencyFees[urgency] || 0;
            
            // Calculate total
            const totalPrice = baseFee + distanceFee + conditionFee + timeFee + urgencyFee;
            
            // Create booking data object
            const bookingData = {
                service: {
                    name: serviceName,
                    price: `$${Math.round(totalPrice)}`
                },
                location: {
                    pickup: pickup,
                    dropoff: dropoff || 'To be determined',
                    distance: distanceValue,
                    pickupCoords: pickupLocation,
                    dropoffCoords: dropoffLocation
                },
                vehicle: {
                    type: vehicleType || 'Car',
                    year: vehicleYear || '',
                    make: vehicleMake || '',
                    model: vehicleModel || '',
                    color: vehicleColor || '',
                    condition: vehicleCondition
                },
                timeOfDay: timeOfDay,
                urgency: urgency,
                contact: {
                    firstName: firstName,
                    lastName: lastName,
                    phone: phone,
                    email: email,
                    instructions: instructions || 'None'
                },
                pricing: {
                    baseFee: baseFee,
                    distanceFee: distanceFee,
                    conditionFee: conditionFee,
                    timeFee: timeFee,
                    urgencyFee: urgencyFee,
                    total: totalPrice
                },
                timestamp: new Date().toISOString(),
                bookingId: 'TOW-' + Date.now()
            };
            
            console.log('💾 Booking data prepared:', bookingData);
            
            // Track: Continue to Review
            if (window.ExpressTowTracking) {
                window.ExpressTowTracking.trackContinueToReview({
                    serviceType: bookingData.serviceType,
                    distance: bookingData.distance,
                    price: bookingData.totalPrice
                });
            }
            
            // Save booking data to sessionStorage and redirect to review page
            console.log('🔄 Saving data and redirecting to review page...');
            sessionStorage.setItem('bookingData', JSON.stringify(bookingData));
            window.location.href = 'booking-review.html';
        });
    }
}

// ========================================
// GPS LOCATION
// ========================================
function initGPSButton() {
    const gpsButton = document.querySelector('.btn-secondary');
    if (gpsButton) {
        gpsButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!navigator.geolocation) {
                alert('❌ GPS not available in this browser');
                return;
            }
            
            updateStatus('📍 Getting your location...', 'info');
            
            navigator.geolocation.getCurrentPosition(
                async position => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    console.log('📍 GPS coordinates:', lat, lon);
                    
                    try {
                        const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`;
                        const response = await fetch(url, {
                            headers: { 'User-Agent': 'ExpressTowBooking/1.0' }
                        });
                        
                        if (!response.ok) throw new Error('Geocoding failed');
                        
                        const data = await response.json();
                        const address = data.display_name;
                        
                        console.log('✅ Geocoded address:', address);
                        
                        pickupLocation = {
                            display_name: address,
                            lat: lat,
                            lon: lon
                        };
                        
                        document.getElementById('pickupLocation').value = address;
                        updateStatus('✅ Location detected. Select drop-off.', 'success');
                        updateCalculateButton();
                        
                        if (dropoffLocation) {
                            calculateRouteDistanceOSRM();
                        }
                        
                    } catch (error) {
                        console.error('❌ Geocoding failed:', error);
                        document.getElementById('pickupLocation').value = `GPS (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
                        updateStatus('✅ GPS location set', 'success');
                    }
                },
                error => {
                    console.error('❌ GPS error:', error);
                    updateStatus('❌ GPS not available. Enter address manually.', 'error');
                }
            );
        });
    }
}

// ========================================
// MANUAL DISTANCE INPUT
// ========================================
function initManualDistanceInput() {
    const distanceInput = document.getElementById('distanceField');
    if (distanceInput) {
        distanceInput.addEventListener('input', function() {
            console.log('📝 Manual distance input:', this.value);
            calculatePrice();
        });
        
        distanceInput.addEventListener('change', function() {
            console.log('📝 Manual distance changed:', this.value);
            calculatePrice();
        });
    }
}

// ========================================
// CALCULATE BUTTON HANDLER
// ========================================
function initCalculateButton() {
    const btn = document.getElementById('calculateDistanceBtn');
    if (btn) {
        btn.addEventListener('click', function() {
            console.log('🔘 Calculate Distance button clicked');
            calculateDistanceFromManualEntry();
        });
    }
}

// ========================================
// PRICING INPUTS LISTENERS
// ========================================
function initPricingInputs() {
    // Add listeners for vehicle condition radio buttons
    const conditionRadios = document.querySelectorAll('input[name="vehicleCondition"]');
    conditionRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            console.log('🚗 Condition changed:', this.value);
            calculatePrice();
        });
    });
    
    // Add listener for time of day select
    const timeSelect = document.getElementById('timeOfDay');
    if (timeSelect) {
        timeSelect.addEventListener('change', function() {
            console.log('🕐 Time of day changed:', this.value);
            calculatePrice();
        });
    }
    
    // Add listener for urgency select
    const urgencySelect = document.getElementById('urgency');
    if (urgencySelect) {
        urgencySelect.addEventListener('change', function() {
            console.log('⚡ Urgency changed:', this.value);
            calculatePrice();
        });
    }
    
    console.log('✅ Pricing input listeners initialized');
}

// ========================================
// INITIALIZE ON PAGE LOAD
// ========================================
document.addEventListener('DOMContentLoaded', function() {
    console.log('\n========================================');
    console.log('🔵 BOOKING PAGE LOADED');
    console.log('========================================');
    console.log('Using OpenStreetMap services:');
    console.log('- Nominatim (autocomplete + geocoding)');
    console.log('- OSRM (routing)');
    console.log('Backend API:', CONFIG.API_BASE_URL);
    console.log('Rate limiting: 1 req/sec per field');
    console.log('========================================\n');
    
    // Track booking started on first interaction
    let bookingStartedTracked = false;
    const trackBookingStarted = () => {
        if (!bookingStartedTracked && window.ExpressTowTracking) {
            const serviceType = document.querySelector('.service-card.selected')?.getAttribute('data-service') || 'unknown';
            window.ExpressTowTracking.trackBookingStarted({ serviceType });
            bookingStartedTracked = true;
        }
    };
    
    // Track on first input in any form field
    document.querySelectorAll('input, select').forEach(field => {
        field.addEventListener('focus', trackBookingStarted, { once: true });
    });
    
    // Track on service card selection
    document.querySelectorAll('.service-card').forEach(card => {
        card.addEventListener('click', trackBookingStarted, { once: true });
    });
    
    const pickupGroup = document.getElementById('pickupLocation')?.parentElement;
    const dropoffGroup = document.getElementById('dropoffLocation')?.parentElement;
    if (pickupGroup) pickupGroup.style.position = 'relative';
    if (dropoffGroup) dropoffGroup.style.position = 'relative';
    
    setupPickupAutocomplete();
    setupDropoffAutocomplete();
    initServiceCards();
    initFormSubmit();
    initGPSButton();
    initManualDistanceInput();
    initCalculateButton();
    initPricingInputs();
    
    updateStatus('✅ Ready! Start typing an address.', 'info');
    console.log('✅ All features initialized\n');
});
