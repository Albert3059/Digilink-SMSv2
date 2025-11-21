# AWS EventBridge Setup for Subscription Renewal Alerts

This guide explains how to set up AWS EventBridge to automatically trigger renewal alerts for your subscription management system.

## Prerequisites

- AWS Account with EventBridge access
- Your Amplify-hosted application domain
- A secure CRON_SECRET_KEY environment variable

## Step 1: Set Environment Variable

In your AWS Amplify deployment settings, add:
- **Key**: `CRON_SECRET_KEY`
- **Value**: Generate a secure random string (e.g., `your-super-secret-key-12345`)

## Step 2: Create API Destination in EventBridge

1. Go to AWS EventBridge Console
2. Click **API destinations** in the left sidebar
3. Click **Create API destination**
4. Configure:
   - **Name**: `SubscriptionRenewalAlerts`
   - **API endpoint**: `https://your-amplify-domain.amplifyapp.com/api/cron/check-renewal-alerts`
   - **HTTP method**: POST
   - **Auth type**: API Key
   - **Invocation HTTP parameters**:
     - Headers: `Authorization: Bearer YOUR_CRON_SECRET_KEY`

5. Click **Create**

## Step 3: Create Connection

1. In EventBridge, go to **Connections**
2. Click **Create connection**
3. Configure:
   - **Name**: `SubscriptionRenewalConnection`
   - **Description**: Connection for subscription renewal alerts
   - **Authorization type**: API Key
   - **API Key name**: `Authorization`
   - **API Key value**: `Bearer YOUR_CRON_SECRET_KEY`

## Step 4: Create Scheduled Rule

1. Go to **Rules** in EventBridge
2. Click **Create rule**
3. Configure:
   - **Name**: `DailySubscriptionRenewalCheck`
   - **Description**: Daily renewal alerts check
   - **Rule type**: Scheduled
   - **Schedule pattern**: Cron expression
     - `cron(0 8 * * ? *)` - Daily at 8 AM UTC
     - Or customize as needed
   - **State**: Enabled

4. Click **Next**

## Step 5: Set Rule Target

1. **Target type**: API destination
2. **API destination**: Select `SubscriptionRenewalAlerts`
3. **HTTP method**: POST
4. **Role**: Create new role or use existing
5. **Dead-letter queue**: Optional

6. Click **Create rule**

## Verification

- Alerts will be checked daily at 8 AM UTC
- Check CloudWatch logs for execution details
- Verify emails are sent to configured admin email addresses
- Test manually by calling: `POST /api/cron/check-renewal-alerts` with the authorization header

## Troubleshooting

- **No emails sent**: Check RESEND_API_KEY is configured in Amplify
- **Authorization errors**: Verify CRON_SECRET_KEY matches in EventBridge
- **API timeouts**: Increase EventBridge timeout setting
- **Check logs**: View CloudWatch logs for the Lambda execution
