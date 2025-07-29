# Payment Integration Setup Guide

This guide will help you set up the DodoPayments integration for RedditFit.

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/redditfit"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key

# OpenRouter API (for AI rewrites)
OPENROUTER_API_KEY=your_openrouter_api_key

# DodoPayments Configuration
DODOPAYMENT_API_KEY=your_dodopayments_api_key
DODOPAYMENT_ENVIRONMENT=sandbox  # or 'production'
DODOPAYMENT_WEBHOOK_SECRET=your_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Your app URL for payment redirects
```

## Setup Steps

### 1. DodoPayments Account Setup

1. Create a DodoPayments account at [app.dodopayments.com](https://app.dodopayments.com)
2. Navigate to your dashboard
3. Get your API keys from the API section
4. Set up webhook endpoints

### 2. Webhook Configuration

Configure the following webhook endpoint in your DodoPayments dashboard:

```
URL: https://yourdomain.com/api/payment/webhook
Events to listen for:
- checkout.session.completed
- payment.processing
- payment.succeeded
- payment.failed
- payment.cancelled
- subscription.active
- subscription.renewed
- subscription.cancelled
- subscription.expired
- subscription.failed
- subscription.plan_changed
```

### 3. Database Migration

Run the database migration to ensure the users table has the correct structure:

```bash
npm run db:migrate
```

## How It Works

### Payment Flow

1. **User clicks "Start Pro Trial"** on the pricing page
2. **System checks authentication** - redirects to sign-in if not authenticated
3. **Creates checkout session** - calls `/api/payment/create-intent` with plan ID
4. **Redirects to DodoPayments** - user completes payment on DodoPayments' hosted checkout
5. **Webhook notification** - DodoPayments sends webhook to `/api/payment/webhook`
6. **Plan activation** - system updates user's plan in database
7. **Success redirect** - user is redirected back to dashboard with success message

### Plan Management

The system supports three plans:

- **Free Plan**: 3 rewrites per day
- **Pro Plan**: 200 rewrites per day (or unlimited based on configuration)
- **Unlimited Plan**: Unlimited rewrites

### Testing

Visit `/test` to test the payment flow and verify your setup:

- Check user authentication status
- View current plan details
- Test payment intent creation
- Verify environment variables

## API Endpoints

### Payment Intent Creation

```
POST /api/payment/create-intent
Body: { planId: string }
Response: { checkoutUrl: string, sessionId: string }
```

### Webhook Handler

```
POST /api/payment/webhook
Headers: { "dodo-signature": string }
```

### User Plan

```
GET /api/user/plan
Response: { plan: string, rewritesUsed: number, rewritesLimit: number, canRewrite: boolean }
```

## DodoPayments API Endpoints

The integration uses the following DodoPayments API endpoints:

- **Production**: `https://api.dodopayments.com/v1`
- **Sandbox**: `https://api-sandbox.dodopayments.com/v1`

### Available Endpoints:

- `POST /checkout-sessions` - Create checkout session
- `GET /checkout-sessions/{id}` - Get checkout session
- `POST /payment-intents` - Create payment intent
- `GET /payment-intents/{id}` - Get payment intent
- `POST /payment-intents/{id}/confirm` - Confirm payment intent

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **API Key Security**: Keep API keys secure and never expose them in client-side code
3. **HTTPS**: Ensure all webhook endpoints use HTTPS in production
4. **Input Validation**: Validate all payment data before processing

## Troubleshooting

### Common Issues

1. **"DODOPAYMENT_API_KEY environment variable is required"**

   - Make sure you've set the `DODOPAYMENT_API_KEY` in your `.env.local` file

2. **"Missing DodoPayments signature"**

   - Ensure your webhook endpoint is properly configured in DodoPayments dashboard

3. **Payment not activating plan**

   - Check webhook logs for errors
   - Verify webhook endpoint is publicly accessible
   - Ensure webhook events are properly configured

4. **Checkout URL not generated**

   - Verify your DodoPayments API key is valid
   - Check that the plan ID exists in your DodoPayments account

5. **DNS errors for api-sandbox.dodopayments.com**
   - Verify the API key is correct
   - Check if you're using the right environment (sandbox vs production)
   - Ensure your DodoPayments account is properly set up

### Testing in Development

1. Use sandbox mode for testing
2. Test with the `/test` page
3. Check browser console for errors
4. Monitor webhook logs
5. The system will fallback to simulation mode if API calls fail

## Production Deployment

1. Set `DODOPAYMENT_ENVIRONMENT=production`
2. Use production API keys
3. Ensure webhook endpoint is publicly accessible
4. Set up proper monitoring and logging
5. Test the complete payment flow before going live

## Support

For issues with the payment integration:

1. Check the logs for error messages
2. Verify webhook configuration
3. Test with sandbox mode first
4. Contact DodoPayments support for API issues
5. Visit [app.dodopayments.com](https://app.dodopayments.com) for account management
