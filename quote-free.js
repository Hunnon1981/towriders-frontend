// Constants
const PHONE = "9255469711";

// Service pricing
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

// Additional fees
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
let pickupCoords = null;
let dropoffCoords = null;
let geocoder = null;

// Utility: format as money
function money(amount) {
    return '$' + amount.toFixed(0);
}

// Get distance in miles
function getDistanceMiles() {
    const dist = parseFloat(document.getElementById('distance').value) || 0;
    return Math.max(0, dist);
}

// Calculate distance between two coordinates (Haversine formula)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Update distance when both locations are selected
function updateDistance() {
    if (pickupCoords && dropoffCoords) {
        const distance = calculateHaversineDistance(
            pickupCoords.lat,
            pickupCoords.lng,
            dropoffCoords.lat,
            dropoffCoords.lng
        );
        
        document.getElementById('distance').value = distance.toFixed(1);
        
        const statusDiv = document.getElementById('distanceStatus');
        statusDiv.textContent = `✓ ${distance.toFixed(1)} miles (straight-line distance)`;
        statusDiv.className = 'distance-status success';
        
        calc();
    }
}

// Calculate and update pricing
function calc() {
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

// Wire up service tiles
function wireTiles() {
    const tiles = document.querySelectorAll('.service-tile');
    tiles.forEach(tile => {
        tile.addEventListener('click', () => {
            tiles.forEach(t => t.classList.remove('selected'));
            tile.classList.add('selected');
            selectedService = tile.dataset.service;
            calc();
        });
    });
}

// Wire up form inputs
function wireInputs() {
    const inputs = ['vehicleType', 'condition', 'timeOfDay', 'serviceLevel', 'distance'];
    inputs.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', calc);
            el.addEventListener('input', calc);
        }
    });
}

// Search for address using Nominatim (OpenStreetMap)
async function searchAddress(query, resultsDiv, coordsVar) {
    if (query.length < 3) {
        resultsDiv.classList.remove('active');
        return;
    }
    
    try {
        // Search California addresses with Nominatim
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?` +
            `q=${encodeURIComponent(query)},California,USA&` +
            `format=json&` +
            `addressdetails=1&` +
            `limit=5&` +
            `countrycodes=us`
        );
        
        const results = await response.json();
        
        if (results.length === 0) {
            resultsDiv.innerHTML = '<div class="autocomplete-item"><div class="name">No results found</div></div>';
            resultsDiv.classList.add('active');
            return;
        }
        
        resultsDiv.innerHTML = '';
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            
            const name = document.createElement('div');
            name.className = 'name';
            name.textContent = result.display_name.split(',')[0];
            
            const address = document.createElement('div');
            address.className = 'address';
            address.textContent = result.display_name;
            
            item.appendChild(name);
            item.appendChild(address);
            
            item.addEventListener('click', () => {
                const input = resultsDiv.id === 'pickup-results' ? 
                    document.getElementById('pickup') : 
                    document.getElementById('dropoff');
                
                input.value = result.display_name;
                
                if (resultsDiv.id === 'pickup-results') {
                    pickupCoords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
                } else {
                    dropoffCoords = { lat: parseFloat(result.lat), lng: parseFloat(result.lon) };
                }
                
                resultsDiv.classList.remove('active');
                updateDistance();
            });
            
            resultsDiv.appendChild(item);
        });
        
        resultsDiv.classList.add('active');
        
    } catch (error) {
        console.error('Address search error:', error);
        resultsDiv.innerHTML = '<div class="autocomplete-item"><div class="name">Search error. Please try again.</div></div>';
        resultsDiv.classList.add('active');
    }
}

// Set up autocomplete
function setupAutocomplete() {
    const pickupInput = document.getElementById('pickup');
    const dropoffInput = document.getElementById('dropoff');
    const pickupResults = document.getElementById('pickup-results');
    const dropoffResults = document.getElementById('dropoff-results');
    
    let pickupTimeout;
    let dropoffTimeout;
    
    pickupInput.addEventListener('input', (e) => {
        clearTimeout(pickupTimeout);
        pickupTimeout = setTimeout(() => {
            searchAddress(e.target.value, pickupResults, 'pickup');
        }, 300);
    });
    
    dropoffInput.addEventListener('input', (e) => {
        clearTimeout(dropoffTimeout);
        dropoffTimeout = setTimeout(() => {
            searchAddress(e.target.value, dropoffResults, 'dropoff');
        }, 300);
    });
    
    // Close results when clicking outside
    document.addEventListener('click', (e) => {
        if (!pickupInput.contains(e.target) && !pickupResults.contains(e.target)) {
            pickupResults.classList.remove('active');
        }
        if (!dropoffInput.contains(e.target) && !dropoffResults.contains(e.target)) {
            dropoffResults.classList.remove('active');
        }
    });
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
            base: parseFloat(document.getElementById('base').textContent.replace('$', '')),
            distance: parseFloat(document.getElementById('distFee').textContent.replace('$', '')),
            time: parseFloat(document.getElementById('timeFee').textContent.replace('$', '')),
            level: parseFloat(document.getElementById('levelFee').textContent.replace('$', '')),
            total: parseFloat(document.getElementById('total').textContent.replace('$', ''))
        }
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
    console.log('🆓 FREE Mode - OpenStreetMap autocomplete & distance calculation');
    
    wireTiles();
    wireInputs();
    setupAutocomplete();
    calc();
    
    console.log('✅ Quote calculator ready - 100% FREE with autocomplete!');
});
