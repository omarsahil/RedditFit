# 🚀 Production Setup Guide

## Going Live with DodoPayments

### Step 1: Get Real DodoPayments Credentials

1. **Visit** https://app.dodopayments.com
2. **Sign up/Login** to your DodoPayments account
3. **Navigate to API Settings** to get your credentials

### Step 2: Update Environment Variables

Create/update your `.env.local` file with these production values:

```bash
# DodoPayments Production Configuration
DODOPAYMENT_API_KEY=your_real_api_key_here
DODOPAYMENT_ENVIRONMENT=production
DODOPAYMENT_WEBHOOK_SECRET=your_webhook_secret_here

# App Configuration (replace with your actual domain)
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Database
DATABASE_URL=your_neon_database_url

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# OpenRouter (for AI rewrites)
OPENROUTER_API_KEY=your_openrouter_key
```

### Step 3: Configure DodoPayments Webhooks

1. **In DodoPayments Dashboard**, go to Webhooks section
2. **Add webhook URL**: `https://your-domain.com/api/payment/webhook`
3. **Select events**: `checkout.session.completed`, `payment_intent.succeeded`
4. **Copy the webhook secret** and add it to your environment variables

### Step 4: Update DodoPayments API Configuration

The current code is trying to use `api-sandbox.dodopayments.com` which doesn't exist. You need to:

1. **Get the correct API endpoints** from DodoPayments documentation
2. **Update the base URLs** in `lib/dodopayment.ts`

### Step 5: Test the Real Payment Flow

1. **Deploy your app** to production (Vercel, Netlify, etc.)
2. **Test with real payment** using test card numbers
3. **Verify webhook processing** works correctly

### Step 6: Monitor and Debug

- **Check webhook logs** in your production environment
- **Monitor payment success/failure rates**
- **Set up error alerting** for failed payments

## Current Issues to Fix

1. **API Domain**: `api-sandbox.dodopayments.com` doesn't exist
2. **API Endpoints**: Need correct DodoPayments API paths
3. **Webhook Processing**: Ensure real webhooks work in production

## Next Steps

1. **Contact DodoPayments support** to get correct API documentation
2. **Update the API integration** with real endpoints
3. **Test thoroughly** before going live
4. **Set up monitoring** for payment processing

## Your Product ID

Your DodoPayments product ID: `pdt_1YatYZDS2O1kCtd53stEM`

This should be used in the real API calls once you have the correct endpoints.
