// EXPRESS TOW - Main JavaScript File
// Handles mobile menu, form submission, and interactive features

document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    initMobileMenu();
    
    // Form Handling
    initFormHandling();
    
    // Smooth Scrolling for Anchor Links
    initSmoothScrolling();
    
    // Floating Call Button Animation
    initFloatingButton();
});

// ===== MOBILE MENU =====
function initMobileMenu() {
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (mobileMenuToggle && navMenu) {
        mobileMenuToggle.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            
            // Change icon between bars and times
            const icon = this.querySelector('i');
            if (navMenu.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-times');
            } else {
                icon.classList.remove('fa-times');
                icon.classList.add('fa-bars');
            }
        });
        
        // Close menu when clicking on a link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                if (window.innerWidth <= 768) {
                    navMenu.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(event) {
            if (!navMenu.contains(event.target) && !mobileMenuToggle.contains(event.target)) {
                if (navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                }
            }
        });
    }
}

// ===== FORM HANDLING =====
function initFormHandling() {
    const towRequestForm = document.getElementById('towRequestForm');
    
    if (towRequestForm) {
        towRequestForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = {
                name: document.getElementById('name').value,
                phone: document.getElementById('phone').value,
                email: document.getElementById('email').value,
                location: document.getElementById('location').value,
                destination: document.getElementById('destination').value,
                service: document.getElementById('service').value,
                vehicle: document.getElementById('vehicle').value,
                description: document.getElementById('description').value,
                urgent: document.getElementById('urgent').checked,
                timestamp: new Date().toISOString()
            };
            
            // Validate required fields
            if (!formData.name || !formData.phone || !formData.location || !formData.service) {
                showMessage('Please fill in all required fields.', 'error');
                return;
            }
            
            // Show loading state
            const submitButton = towRequestForm.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SENDING...';
            
            // Simulate form submission (replace with actual API call)
            setTimeout(() => {
                // Success
                showMessage('Thank you! We\'ve received your request and will contact you immediately. For urgent assistance, please call (650) 274-6703.', 'success');
                
                // Reset form
                towRequestForm.reset();
                
                // Reset button
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                
                // Log form data (in production, send to backend)
                console.log('Tow Request Submitted:', formData);
                
                // If urgent, suggest calling
                if (formData.urgent) {
                    setTimeout(() => {
                        if (confirm('This is marked as urgent. Would you like to call us now for immediate assistance?')) {
                            window.location.href = 'tel:6502746703';
                        }
                    }, 1000);
                }
            }, 1500);
        });
    }
}

// Show form message
function showMessage(message, type) {
    const messageDiv = document.getElementById('formMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = 'form-message ' + type;
        messageDiv.style.display = 'block';
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Auto hide success messages after 10 seconds
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 10000);
        }
    }
}

// ===== SMOOTH SCROLLING =====
function initSmoothScrolling() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#' && href !== '') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    const headerOffset = 120; // Account for fixed header
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });
}

// ===== FLOATING BUTTON ANIMATION =====
function initFloatingButton() {
    const floatingBtn = document.querySelector('.floating-call-btn');
    
    if (floatingBtn) {
        // Hide on scroll down, show on scroll up
        let lastScrollTop = 0;
        let scrollTimeout;
        
        window.addEventListener('scroll', function() {
            clearTimeout(scrollTimeout);
            
            scrollTimeout = setTimeout(() => {
                let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                
                // Show button after scrolling down 300px
                if (scrollTop > 300) {
                    floatingBtn.style.opacity = '1';
                    floatingBtn.style.pointerEvents = 'auto';
                } else {
                    floatingBtn.style.opacity = '0';
                    floatingBtn.style.pointerEvents = 'none';
                }
                
                lastScrollTop = scrollTop;
            }, 10);
        });
        
        // Initial state
        if (window.pageYOffset < 300) {
            floatingBtn.style.opacity = '0';
            floatingBtn.style.pointerEvents = 'none';
        }
    }
}

// ===== PHONE NUMBER FORMATTING =====
// Format phone number input as user types
const phoneInputs = document.querySelectorAll('input[type="tel"]');
phoneInputs.forEach(input => {
    input.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value.length <= 3) {
                value = '(' + value;
            } else if (value.length <= 6) {
                value = '(' + value.slice(0, 3) + ') ' + value.slice(3);
            } else {
                value = '(' + value.slice(0, 3) + ') ' + value.slice(3, 6) + '-' + value.slice(6, 10);
            }
        }
        e.target.value = value;
    });
});

// ===== INTERSECTION OBSERVER FOR ANIMATIONS =====
// Add fade-in animations for elements as they scroll into view
if ('IntersectionObserver' in window) {
    const animateOnScroll = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
                animateOnScroll.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observe elements
    document.querySelectorAll('.service-card, .review-card, .badge, .area-card, .why-item, .feature-card').forEach(el => {
        animateOnScroll.observe(el);
    });
}

// ===== UTILITY FUNCTIONS =====

// Track call button clicks (for analytics)
document.querySelectorAll('a[href^="tel:"]').forEach(link => {
    link.addEventListener('click', function() {
        console.log('Call button clicked:', this.href);
        // Add your analytics tracking here
        // Example: gtag('event', 'call_click', { 'phone_number': '6502746703' });
    });
});

// Track form starts (for analytics)
const formInputs = document.querySelectorAll('#towRequestForm input, #towRequestForm select, #towRequestForm textarea');
let formStarted = false;
formInputs.forEach(input => {
    input.addEventListener('focus', function() {
        if (!formStarted) {
            formStarted = true;
            console.log('User started filling out tow request form');
            // Add your analytics tracking here
            // Example: gtag('event', 'form_start', { 'form_name': 'tow_request' });
        }
    });
});

// Console log for debugging
console.log('EXPRESS TOW Website Loaded Successfully');
console.log('For immediate assistance, call (650) 274-6703');
