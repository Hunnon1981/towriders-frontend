// booking-review.js - Review page logic

console.log('📄 booking-review.js loaded');

// Load booking data from sessionStorage
let bookingData = null;

// Load and display booking data
function loadBookingData() {
    console.log('🔍 Loading booking data from sessionStorage...');
    
    try {
        const dataString = sessionStorage.getItem('bookingData');
        
        if (!dataString) {
            console.warn('⚠️ No booking data found in sessionStorage');
            showError('No booking data found. Please start your booking again.');
            setTimeout(() => {
                window.location.href = 'booking.html';
            }, 3000);
            return;
        }
        
        bookingData = JSON.parse(dataString);
        console.log('✅ Booking data loaded:', bookingData);
        
        displayBookingReview();
        
    } catch (error) {
        console.error('❌ Error loading booking data:', error);
        showError('Error loading booking data. Please try again.');
        setTimeout(() => {
            window.location.href = 'booking.html';
        }, 3000);
    }
}

// Display booking review
function displayBookingReview() {
    const container = document.getElementById('reviewContent');
    
    if (!bookingData) {
        showError('No booking data available');
        return;
    }
    
    // Get vehicle condition badges
    const conditions = [];
    if (bookingData.vehicle.condition.drivable) conditions.push('Drivable');
    if (bookingData.vehicle.condition.deadBattery) conditions.push('Dead Battery');
    if (bookingData.vehicle.condition.accident) conditions.push('Accident');
    if (bookingData.vehicle.condition.flatTire) conditions.push('Flat Tire');
    
    const conditionBadges = conditions.length > 0
        ? conditions.map(c => `<span class="condition-badge">${c}</span>`).join('')
        : '<span class="condition-badge" style="background: var(--gray);">No issues reported</span>';
    
    // Build review HTML
    container.innerHTML = `
        <div class="booking-id">
            📋 Booking ID: ${bookingData.bookingId}
        </div>
        
        <!-- Service Section -->
        <div class="review-section">
            <div class="section-title">🚗 Service Information</div>
            <div class="review-grid">
                <div class="review-item">
                    <div class="review-label">Service Type</div>
                    <div class="review-value">${bookingData.service.name}</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Estimated Price</div>
                    <div class="review-value">${bookingData.service.price}</div>
                </div>
            </div>
        </div>
        
        <!-- Location Section -->
        <div class="review-section">
            <div class="section-title">📍 Location Details</div>
            <div class="review-grid">
                <div class="review-item" style="grid-column: 1 / -1;">
                    <div class="review-label">Pickup Location</div>
                    <div class="review-value">${bookingData.location.pickup}</div>
                </div>
                <div class="review-item" style="grid-column: 1 / -1;">
                    <div class="review-label">Drop-off Location</div>
                    <div class="review-value">${bookingData.location.dropoff}</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Distance</div>
                    <div class="review-value">${bookingData.location.distance}</div>
                </div>
            </div>
        </div>
        
        <!-- Vehicle Section -->
        <div class="review-section">
            <div class="section-title">🚙 Vehicle Information</div>
            <div class="review-grid">
                <div class="review-item">
                    <div class="review-label">Vehicle Type</div>
                    <div class="review-value">${bookingData.vehicle.type}</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Year</div>
                    <div class="review-value">${bookingData.vehicle.year || 'Not specified'}</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Make</div>
                    <div class="review-value">${bookingData.vehicle.make || 'Not specified'}</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Model</div>
                    <div class="review-value">${bookingData.vehicle.model || 'Not specified'}</div>
                </div>
                <div class="review-item" style="grid-column: 1 / -1;">
                    <div class="review-label">Vehicle Condition</div>
                    <div class="condition-badges">${conditionBadges}</div>
                </div>
            </div>
        </div>
        
        <!-- Contact Section -->
        <div class="review-section">
            <div class="section-title">👤 Contact Information</div>
            <div class="review-grid">
                <div class="review-item">
                    <div class="review-label">Name</div>
                    <div class="review-value">${bookingData.contact.firstName} ${bookingData.contact.lastName}</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Phone</div>
                    <div class="review-value">${bookingData.contact.phone}</div>
                </div>
                <div class="review-item">
                    <div class="review-label">Email</div>
                    <div class="review-value">${bookingData.contact.email}</div>
                </div>
                ${bookingData.contact.instructions !== 'None' ? `
                <div class="review-item" style="grid-column: 1 / -1;">
                    <div class="review-label">Special Instructions</div>
                    <div class="review-value">${bookingData.contact.instructions}</div>
                </div>
                ` : ''}
            </div>
        </div>
        
        <!-- Price Summary -->
        <div class="price-summary">
            <div class="price-summary-title">💵 Payment Summary</div>
            <div class="price-total">
                <span class="price-total-label">Total Amount</span>
                <span class="price-total-amount">${bookingData.service.price}</span>
            </div>
        </div>
        
        <!-- Action Buttons -->
        <div class="button-group">
            <button class="btn btn-secondary" onclick="goBack()">
                ← Edit Details
            </button>
            <button class="btn btn-primary" onclick="proceedToPayment()">
                Continue to Payment →
            </button>
        </div>
    `;
    
    console.log('✅ Review page rendered');
}

// Show error message
function showError(message) {
    const container = document.getElementById('reviewContent');
    container.innerHTML = `
        <div style="text-align: center; padding: 60px 20px;">
            <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h2 style="color: var(--primary); margin-bottom: 12px;">Oops!</h2>
            <p style="color: var(--gray); font-size: 16px;">${message}</p>
        </div>
    `;
}

// Go back to booking form
function goBack() {
    console.log('← Going back to booking form');
    window.location.href = 'booking.html';
}

// Proceed to payment
function proceedToPayment() {
    console.log('→ Proceeding to payment page');
    // Booking data is already in sessionStorage
    window.location.href = 'booking-payment.html';
}

// Initialize page on load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Review page loaded');
    loadBookingData();
});
