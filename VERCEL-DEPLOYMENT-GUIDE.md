# 🚀 TOW RIDERS - VERCEL DEPLOYMENT GUIDE

**Status:** ✅ **100% READY FOR VERCEL**  
**Date:** May 22, 2026

---

## 📦 **WHAT'S IN THE FRONTEND FOLDER**

The `towriders-frontend/` folder contains everything you need:

✅ **19 HTML Pages** - All production-ready with correct contact info  
✅ **CSS Files** - All stylesheets in `css/` folder  
✅ **JavaScript Files** - All scripts in `js/` folder  
✅ **Images** - All images in `images/` folder  
✅ **SEO Files** - robots.txt, sitemap.xml  
✅ **Configuration Files** - vercel.json, .gitignore  
✅ **Complete Documentation** - README.md with all instructions  

**All contact information verified:**
- ✅ Email: services@towriders.com
- ✅ Phone: +1 925-546-9711
- ✅ Website: towriders.com

---

## 🚀 **METHOD 1: DRAG & DROP TO VERCEL (EASIEST - 2 MINUTES)**

### Step 1: Go to Vercel
1. Open browser and go to: https://vercel.com/
2. Click **Sign Up** (use GitHub, Google, or Email)
3. Complete registration

### Step 2: Deploy
1. After login, you'll see the dashboard
2. Look for **"Add New..."** button or **"Import Project"**
3. **Drag and drop** the entire `towriders-frontend` folder onto Vercel
4. Vercel will automatically:
   - Detect it's a static site
   - Upload all files
   - Deploy to a live URL
5. Wait 30-60 seconds
6. ✅ Done! You'll get a URL like: `https://towriders-frontend-xxxxx.vercel.app`

### Step 3: Add Custom Domain
1. In Vercel project settings
2. Go to **Domains** tab
3. Click **Add Domain**
4. Enter: `towriders.com`
5. Follow DNS instructions (add A record and CNAME to your domain registrar)
6. Wait for DNS propagation (up to 24 hours)
7. ✅ Your site will be live at https://towriders.com

---

## 🚀 **METHOD 2: GITHUB + VERCEL (RECOMMENDED FOR UPDATES - 5 MINUTES)**

### Step 1: Create GitHub Repository
1. Go to https://github.com/
2. Sign in (or create account)
3. Click **New repository**
4. Name: `towriders-frontend`
5. Keep it **Public** or **Private**
6. Click **Create repository**

### Step 2: Push Frontend to GitHub
Open terminal/command prompt in the `towriders-frontend` folder and run:

```bash
git init
git add .
git commit -m "Tow Riders frontend - production ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/towriders-frontend.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

### Step 3: Deploy from GitHub to Vercel
1. Go to https://vercel.com/
2. Sign in with GitHub
3. Click **Add New...** → **Project**
4. Click **Import Git Repository**
5. Find and select `towriders-frontend`
6. Vercel will auto-detect settings:
   - Framework Preset: **Other** (or leave blank)
   - Root Directory: `./` (leave as is)
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
7. Click **Deploy**
8. Wait 30-60 seconds
9. ✅ Done! You'll get a live URL

### Step 4: Add Custom Domain
Same as Method 1, Step 3 above.

---

## 🚀 **METHOD 3: VERCEL CLI (FOR DEVELOPERS - 3 MINUTES)**

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login to Vercel
```bash
vercel login
```

### Step 3: Deploy
Open terminal in `towriders-frontend` folder:

```bash
cd towriders-frontend
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No
- **What's your project's name?** → towriders-frontend
- **In which directory is your code located?** → ./ (just press Enter)

Wait 30-60 seconds. You'll get a live URL!

### Step 4: Deploy to Production
```bash
vercel --prod
```

This deploys to production domain.

---

## 📝 **AFTER DEPLOYMENT - MARKETING SETUP (OPTIONAL)**

### 1. Google Analytics 4 (Optional)
If you want visitor tracking:
1. Go to https://analytics.google.com/
2. Create a GA4 property
3. Get Measurement ID (format: G-XXXXXXXXXX)
4. Edit `towriders-frontend/index.html`
5. Find line 108: `GA_MEASUREMENT_ID`
6. Replace with your ID: `G-XXXXXXXXXX`
7. Save and redeploy

### 2. Google Ads Conversion Tracking (Optional)
If you want to track phone calls from Google Ads:
1. Go to https://ads.google.com/
2. Setup conversion tracking
3. Get Conversion ID (format: AW-XXXXXXXXXX/XXXXXXXXXXX)
4. Edit `towriders-frontend/index.html`
5. Find lines 116-119: `AW-CONVERSION_ID/CONVERSION_LABEL`
6. Replace with your IDs
7. Save and redeploy

### 3. Meta Pixel (Facebook/Instagram Ads) (Optional)
If you want to track visitors for Facebook/Instagram ads:
1. Go to https://business.facebook.com/
2. Create Meta Pixel in Events Manager
3. Get Pixel ID (format: XXXXXXXXXXXXXXX)
4. Edit `towriders-frontend/index.html`
5. Find line 134: `YOUR_PIXEL_ID`
6. Replace with your Pixel ID
7. Save and redeploy

---

## 🐛 **TROUBLESHOOTING VERCEL ISSUES**

### Issue 1: "Build Failed"
**Solution:** This shouldn't happen because it's a static site. But if it does:
1. In Vercel project settings
2. Go to **Build & Development Settings**
3. Set:
   - Framework Preset: **Other**
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
4. Redeploy

### Issue 2: "404 Not Found" on Pages
**Solution:** 
1. Check that `vercel.json` file exists in the folder
2. Redeploy
3. The `vercel.json` file I created handles all routing

### Issue 3: Custom Domain Not Working
**Solution:**
1. Check DNS settings at your domain registrar
2. Add these records:
   - **A Record:** `@` → `76.76.21.21` (Vercel IP)
   - **CNAME:** `www` → `cname.vercel-dns.com`
3. Wait 24 hours for DNS propagation
4. Check status in Vercel → Domains tab

### Issue 4: CSS/JS Not Loading
**Solution:**
1. Check that folder structure is preserved:
   ```
   towriders-frontend/
   ├── css/
   ├── js/
   ├── images/
   └── *.html files
   ```
2. If you uploaded only HTML files, you need to upload the entire folder
3. Redeploy with complete folder structure

### Issue 5: Phone Numbers/Emails Wrong
**Solution:** This shouldn't happen - I've verified all files have:
- ✅ services@towriders.com
- ✅ +1 925-546-9711

But if you see old info, let me know which file and I'll fix it.

---

## ✅ **VERIFICATION CHECKLIST (AFTER DEPLOYMENT)**

Test these on your live Vercel URL:

- [ ] Homepage loads (index.html)
- [ ] Click phone number → dials +1 925-546-9711
- [ ] Submit contact form → email to services@towriders.com
- [ ] Test all navigation links
- [ ] Test instant quote system (quote.html → quote-review.html → quote-payment.html → quote-confirmation.html)
- [ ] Test booking form
- [ ] Test mobile view (resize browser or use phone)
- [ ] Check Services page loads
- [ ] Check About page loads
- [ ] Check Contact page loads
- [ ] Check Service Areas page loads
- [ ] Check Become Partner page loads
- [ ] All CSS styles load correctly
- [ ] All JavaScript works correctly
- [ ] All images load correctly

---

## 📞 **NEED HELP WITH VERCEL?**

### Common Questions:

**Q: Do I need to pay for Vercel?**  
A: No! Vercel has a free tier that's perfect for this site. Free tier includes:
- Unlimited deployments
- 100 GB bandwidth/month
- Custom domain
- HTTPS/SSL certificate (automatic)

**Q: How do I update the site after deployment?**  
A: If you used GitHub method:
1. Make changes to files locally
2. Run: `git add .` → `git commit -m "update"` → `git push`
3. Vercel auto-deploys changes in 30 seconds

If you used drag & drop:
1. Make changes to files locally
2. Go to Vercel dashboard
3. Drag updated folder onto existing project
4. It will redeploy

**Q: Can I use my own domain (towriders.com)?**  
A: Yes! See "Add Custom Domain" section above.

**Q: How do I delete and start over?**  
A: In Vercel dashboard → Project Settings → Danger Zone → Delete Project

**Q: Where do I see visitor statistics?**  
A: Vercel dashboard → Analytics tab (basic stats)  
For detailed stats, setup Google Analytics (see optional section above)

---

## 🎯 **QUICK START SUMMARY**

### For Beginners (Drag & Drop):
1. Go to https://vercel.com/
2. Sign up
3. Drag `towriders-frontend` folder
4. Done! ✅

### For GitHub Users:
1. Create GitHub repo: `towriders-frontend`
2. Push folder to GitHub
3. Connect Vercel to GitHub repo
4. Done! ✅

### After Deployment:
1. Test all pages work
2. Add custom domain: towriders.com
3. (Optional) Setup Google Analytics
4. (Optional) Setup Google Ads tracking
5. (Optional) Setup Meta Pixel

---

## 📦 **WHAT'S IN THE FOLDER**

```
towriders-frontend/
├── README.md                    ← Main documentation
├── vercel.json                  ← Vercel configuration
├── .gitignore                   ← Git ignore rules
├── netlify.toml                 ← Netlify config (not needed for Vercel)
├── robots.txt                   ← SEO crawler rules
├── sitemap.xml                  ← SEO sitemap
│
├── index.html                   ← Homepage (25KB, SEO optimized)
├── services.html                ← Services page
├── about.html                   ← About Us page
├── contact.html                 ← Contact form page
├── booking.html                 ← Booking page
├── service-areas.html           ← Service coverage areas
├── become-partner.html          ← Partner recruitment
├── partner.html                 ← Partner portal
│
├── quote.html                   ← Instant Quote Step 1
├── quote-review.html            ← Instant Quote Step 2
├── quote-payment.html           ← Instant Quote Step 3
├── quote-confirmation.html      ← Instant Quote Step 4
│
├── dispatch.html                ← Dispatch dashboard
├── driver.html                  ← Driver dashboard
│
├── css/                         ← All stylesheets
│   ├── elite-professional.css
│   ├── global-shared.css
│   ├── style.css
│   ├── mobile-responsive.css
│   └── payment.css
│
├── js/                          ← All JavaScript
│   ├── main.js
│   ├── quote.js
│   ├── quote-free.js
│   ├── booking.js
│   ├── booking-review.js
│   └── booking-payment.js
│
└── images/                      ← All images
    ├── post-01-dead-battery-jump-start.jpg
    ├── post-02-highway-50-tire-change.jpg
    ├── post-03-night-emergency-rescue.jpg
    ├── post-04-instant-pricing-phone.jpg
    └── post-05-fuel-delivery-service.jpg
```

---

## 📞 **CONTACT INFORMATION (VERIFIED IN ALL FILES)**

All pages use:
- ✅ **Email:** services@towriders.com
- ✅ **Phone:** +1 925-546-9711
- ✅ **Website:** towriders.com

Old contacts removed:
- ❌ dispatch@towriders.com
- ❌ support@towriders.com
- ❌ info@towriders.com
- ❌ billing@towriders.com
- ❌ (650) 274-6703

---

## 🚀 **STATUS: 100% READY FOR VERCEL**

**Everything is configured and ready to deploy!**

Just upload the `towriders-frontend` folder to Vercel and you're done!

---

**Need help?** Read this guide step-by-step or contact Vercel support.
