# Digilink IT Solutions SMS - AWS Amplify Deployment Guide

## Pre-Deployment Checklist

### 1. Code Preparation
- [ ] All API routes are configured
- [ ] Environment variables are ready
- [ ] Database migrations have been created
- [ ] Email templates are finalized with info@digilinkict.co.za
- [ ] Cron endpoint security key is generated
- [ ] Git repository is up to date

### 2. Required Environment Variables (Ready)
You already have these configured in your project:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- ✅ `RESEND_API_KEY` - Resend email API key
- ✅ Digilink domain verified in Resend

### 3. New Environment Variable Needed
- ⚠️ `CRON_SECRET_KEY` - Generate a secure random key (you'll add this in Amplify)

---

## Deployment Steps

### Step 1: Prepare Your GitHub Repository (5 minutes)

1. **Push your code to GitHub**
   \`\`\`bash
   git add .
   git commit -m "Ready for Amplify deployment"
   git push origin main
   \`\`\`

2. **Ensure your main branch is clean and production-ready**

---

### Step 2: Deploy to AWS Amplify (10 minutes)

1. **Go to AWS Amplify Console**
   - URL: https://console.aws.amazon.com/amplify/

2. **Click "New app" → "Host web app"**

3. **Select GitHub**
   - Connect your GitHub account if not already connected
   - Select your repository
   - Select branch: `main`

4. **Configure build settings**
   - Framework: Next.js
   - Build command: `npm run build` (or `bun run build`)
   - Start command: (leave default)
   - Amplify will auto-detect Next.js configuration

5. **Review and deploy**
   - Click "Deploy app"
   - Amplify will build and deploy automatically
   - Watch the deployment progress in the console
   - **Deployment typically takes 5-10 minutes**

6. **Get your Amplify domain**
   - Once deployed, you'll see: `https://main.xxxxx.amplifyapp.com`
   - Note this URL for EventBridge configuration

---

### Step 3: Configure Environment Variables in Amplify (10 minutes)

1. **In Amplify Console:**
   - Go to "App settings" → "Environment variables"

2. **Add ALL these variables:**

   \`\`\`
   NEXT_PUBLIC_SUPABASE_URL=https://lmromhvsztedrlztxsjc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key...
   RESEND_API_KEY=re_N5qYccFk_Fm6APA9SCHv298eV7TCikGkk
   CRON_SECRET_KEY=your-super-secret-key-123456789
   \`\`\`

3. **Save and redeploy**
   - Click "Redeploy app" to apply environment variables
   - Wait for deployment to complete (~5 minutes)

---

### Step 4: Set Up AWS EventBridge for Automatic Alerts (15 minutes)

#### 4.1: Create API Destination

1. **Go to AWS EventBridge Console**
   - URL: https://console.aws.amazon.com/events/

2. **Click "API destinations"** in the left sidebar

3. **Click "Create API destination"**

4. **Fill in the form:**
   - **Name**: `SubscriptionRenewalAlerts`
   - **API endpoint**: `https://your-amplify-domain.amplifyapp.com/api/cron/check-renewal-alerts`
     - Replace `your-amplify-domain` with your actual Amplify domain
   - **HTTP method**: POST
   - **Rate limit**: 10 (requests per second)
   - **Invocation HTTP parameters**:
     - **Headers**: Add header `Authorization` with value `Bearer YOUR_CRON_SECRET_KEY`
     - Replace `YOUR_CRON_SECRET_KEY` with the key you set in Amplify

5. **Click "Create API destination"**

#### 4.2: Create Connection

1. **Click "Connections"** in the left sidebar

2. **Click "Create connection"**

3. **Configure:**
   - **Name**: `SubscriptionRenewalConnection`
   - **Authorization type**: API Key
   - **API Key**: 
     - **Key name**: `Authorization`
     - **Key value**: `Bearer YOUR_CRON_SECRET_KEY`

4. **Click "Create connection"**

#### 4.3: Create Scheduled Rule

1. **Click "Rules"** in the left sidebar

2. **Make sure you're on the "Default" event bus**

3. **Click "Create rule"**

4. **Configure the rule:**
   - **Name**: `DailySubscriptionRenewalCheck`
   - **Description**: Daily check for subscription renewals (60, 30, 14, 7 days)
   - **Rule type**: Scheduled
   - **Schedule pattern**: Cron expression
     - Enter: `cron(0 8 * * ? *)` (Daily at 8 AM UTC)
     - Or customize: `cron(0 9 * * ? *)` for 9 AM UTC, etc.
   - **State**: Enabled

5. **Click "Next"**

#### 4.4: Set Rule Target

1. **Target 1 - API Destination:**
   - **Target type**: API destination
   - **API destination**: `SubscriptionRenewalAlerts` (select from dropdown)
   - **HTTP method**: POST
   - **Path parameters**: Leave empty
   - **Query string parameters**: Leave empty
   - **Header parameters**: Already configured in API destination
   - **Role or connection**: Create new service role

2. **Configure dead-letter queue (optional):**
   - Leave unchecked for now (can add later if needed)

3. **Click "Create rule"**

---

### Step 5: Verify Deployment (10 minutes)

#### 5.1: Test the Website
1. **Visit your Amplify URL**
   - https://main.xxxxx.amplifyapp.com
   - Should see the Digilink IT Solutions SMS homepage

2. **Test core functionality:**
   - [ ] Login page loads
   - [ ] Can create new account (or login)
   - [ ] Dashboard displays correctly
   - [ ] Subscriptions list loads
   - [ ] Can create a new subscription
   - [ ] Can view/edit subscriptions
   - [ ] Can delete subscriptions
   - [ ] Export CSV works
   - [ ] Settings page loads
   - [ ] Can upload company logo

#### 5.2: Test Email Functionality
1. **Test Report Email:**
   - Go to Subscriptions page
   - Click "Email Report"
   - Check your admin email for the report
   - Should come from `info@digilinkict.co.za`

2. **Test EventBridge (Optional - Manual Trigger):**
   - You can manually test by calling the cron endpoint:
   \`\`\`bash
   curl -X POST https://your-amplify-domain.amplifyapp.com/api/cron/check-renewal-alerts \
     -H "Authorization: Bearer YOUR_CRON_SECRET_KEY" \
     -H "Content-Type: application/json"
   \`\`\`

#### 5.3: Check EventBridge Logs
1. **In EventBridge Console:**
   - Go to your rule: `DailySubscriptionRenewalCheck`
   - Click "Metrics" tab
   - Verify invocations are being tracked

2. **Check CloudWatch Logs:**
   - Go to CloudWatch console
   - Look for logs from Amplify and EventBridge
   - Verify no errors

---

### Step 6: Custom Domain (Optional, 5 minutes)

To use your own domain instead of `amplifyapp.com`:

1. **In Amplify Console:**
   - Go to "Domain management"
   - Click "Add domain"
   - Enter your domain (e.g., `sms.digilinkict.co.za`)
   - Follow DNS configuration steps

2. **Update EventBridge:**
   - Update the API destination endpoint URL to use your custom domain
   - Update the Authorization header if needed

---

### Step 7: Monitoring & Maintenance

#### Daily Monitoring
- [ ] Check Amplify deployment status
- [ ] Monitor email delivery (Resend dashboard)
- [ ] Check EventBridge rule execution (CloudWatch)

#### Weekly Tasks
- [ ] Review subscription data in Supabase
- [ ] Check for any failed email deliveries
- [ ] Monitor API response times

#### Monthly Tasks
- [ ] Review usage and costs
- [ ] Update subscriptions as needed
- [ ] Backup database (Supabase handles this)
- [ ] Review EventBridge logs for patterns

---

## Troubleshooting

### Issue: "Failed to send report" Error

**Solution:**
1. Verify `RESEND_API_KEY` is set in Amplify environment variables
2. Check that `info@digilinkict.co.za` domain is verified in Resend
3. Ensure recipient email is configured in Settings (admin profile)

### Issue: EventBridge Not Triggering

**Solution:**
1. Verify `CRON_SECRET_KEY` matches in both Amplify and EventBridge
2. Check CloudWatch logs for EventBridge execution errors
3. Verify API destination endpoint URL is correct
4. Test with manual curl request

### Issue: Subscriptions Not Loading

**Solution:**
1. Check Supabase environment variables are set correctly
2. Verify Supabase project is accessible
3. Check browser console for error messages
4. Clear browser cache and reload

### Issue: Static Asset 404 Errors

**Solution:**
1. Ensure public folder images are committed to git
2. Verify image paths start with `/` (not relative)
3. Check Amplify build logs for asset processing

---

## Post-Deployment Checklist

- [ ] Website is live and accessible
- [ ] All pages load correctly
- [ ] Email functionality works
- [ ] EventBridge rule is created and enabled
- [ ] Manual cron test successful
- [ ] Team members can access the app
- [ ] Backup strategy confirmed
- [ ] Monitoring dashboards set up
- [ ] Documentation updated for team

---

## Support & Documentation

- **Amplify Docs**: https://docs.aws.amazon.com/amplify/
- **EventBridge Docs**: https://docs.aws.amazon.com/eventbridge/
- **Supabase Docs**: https://supabase.com/docs
- **Resend Docs**: https://resend.com/docs

---

## Timeline Summary

| Step | Time | Status |
|------|------|--------|
| 1. Prepare GitHub | 5 min | Before deployment |
| 2. Deploy to Amplify | 10 min | First time only |
| 3. Configure Environment Variables | 10 min | First time only |
| 4. Set Up EventBridge | 15 min | First time only |
| 5. Verify Deployment | 10 min | Every deployment |
| **Total First-Time Setup** | **~50 minutes** | |

---

**You're now ready to deploy!** Follow the steps above and your Subscription Management System will be live on AWS Amplify with automatic renewal alerts via EventBridge.
