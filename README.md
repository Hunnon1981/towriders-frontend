# 🚗 Tow Riders - Frontend (Public Website)

**Official Business Contact Information:**
- **Email:** services@towriders.com ✅
- **Phone:** +1 925-546-9711 ✅
- **Website:** towriders.com

---

## 📦 What's Inside

This folder contains the **complete production-ready frontend** for the Tow Riders website:

### Public Website Pages
- `index.html` - Homepage with SEO, marketing tracking, mobile optimization
- `services.html` - Service listings page
- `about.html` - About Us page
- `contact.html` - Contact form page
- `booking.html` - Multi-step booking wizard
- `service-areas.html` - Service coverage areas
- `become-partner.html` - Partner recruitment page
- `partner.html` - Partner portal page

### Instant Quote System (4-Step Flow)
- `quote.html` - Step 1: Enter service details
- `quote-review.html` - Step 2: Review quote
- `quote-payment.html` - Step 3: Payment (Stripe)
- `quote-confirmation.html` - Step 4: Confirmation

### Admin/Dispatch/Driver Dashboards
- `admin/` - Admin dashboard files
- `dispatch/` - Dispatch dashboard files
- `driver/` - Driver mobile dashboard files
- `partner/` - Partner portal files

### Assets
- `css/` - All stylesheets
- `js/` - All JavaScript files (including quote-free.js)
- `images/` - All images and graphics

### Configuration Files
- `robots.txt` - SEO crawler instructions
- `sitemap.xml` - SEO sitemap
- `netlify.toml` - Netlify deployment configuration

---

## 🚀 Quick Deployment to Netlify

### Option 1: Drag & Drop (Easiest)
1. Go to https://app.netlify.com/
2. Sign up / Log in
3. Drag this **entire `towriders-frontend` folder** onto Netlify
4. Done! Your site is live

### Option 2: GitHub + Netlify (Recommended)
1. Create a new GitHub repository named `towriders-frontend`
2. Open terminal in this folder
3. Run these commands:

```bash
git init
git add .
git commit -m "Tow Riders frontend - production ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/towriders-frontend.git
git push -u origin main
```

4. Go to Netlify → New Site from Git → Connect GitHub repo
5. Build settings: Leave empty (static site)
6. Deploy!

---

## 🔧 Custom Domain Setup (towriders.com)

After deploying to Netlify:

1. In Netlify, go to **Domain Settings**
2. Click **Add custom domain**
3. Enter: `towriders.com`
4. Follow DNS instructions (add A record and CNAME)
5. Wait 24 hours for DNS propagation
6. Done! Your site is live at towriders.com

---

## 📝 Marketing Integration Setup

### 1. Google Analytics 4
- **File to edit:** `index.html` (line 108)
- **Find:** `GA_MEASUREMENT_ID`
- **Replace with:** Your GA4 Measurement ID (format: G-XXXXXXXXXX)
- **Get it from:** https://analytics.google.com/

### 2. Google Ads Conversion Tracking
- **File to edit:** `index.html` (lines 116-119)
- **Find:** `AW-CONVERSION_ID/CONVERSION_LABEL`
- **Replace with:** Your Google Ads conversion ID
- **Get it from:** Google Ads → Goals → Conversions

### 3. Meta Pixel (Facebook/Instagram)
- **File to edit:** `index.html` (line 134)
- **Find:** `YOUR_PIXEL_ID`
- **Replace with:** Your Meta Pixel ID (format: XXXXXXXXXXXXXXX)
- **Get it from:** Meta Events Manager

---

## ✅ Pre-Deployment Checklist

- [ ] All files copied to `towriders-frontend` folder
- [ ] Verified contact info (services@towriders.com, +1 925-546-9711)
- [ ] Created GitHub repository
- [ ] Pushed to GitHub
- [ ] Connected to Netlify
- [ ] Custom domain configured (towriders.com)
- [ ] Google Analytics ID replaced
- [ ] Google Ads conversion ID replaced
- [ ] Meta Pixel ID replaced
- [ ] Tested all pages load correctly
- [ ] Tested mobile responsive design
- [ ] Tested all links work
- [ ] Tested contact forms
- [ ] Tested instant quote flow

---

## 📞 Support

All contact information is unified to:
- **Email:** services@towriders.com
- **Phone:** +1 925-546-9711

---

## 🎯 Next Steps After Deployment

1. **Test Website:** Visit towriders.com and test all features
2. **Setup Google Business Profile:** Use services@towriders.com
3. **Start Google Ads Campaign:** Phone call tracking enabled
4. **Start Facebook/Instagram Ads:** Meta Pixel tracking enabled
5. **Monitor Analytics:** Check Google Analytics dashboard daily

---

**Status:** ✅ **PRODUCTION READY - DEPLOY NOW**
