# DodoPayment Integration Setup Guide

This guide will help you set up DodoPayment integration for RedditFit.

## Overview

The DodoPayment integration includes:

- Payment processing for subscription plans
- Webhook handling for payment events
- Subscription management
- User plan upgrades/downgrades

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# DodoPayment Configuration
DODOPAYMENT_API_KEY=your_dodopayment_api_key
DODOPAYMENT_ENVIRONMENT=sandbox  # or 'production'
DODOPAYMENT_WEBHOOK_SECRET=your_webhook_secret
```

## Setup Steps

### 1. DodoPayment Account Setup

1. Create a DodoPayment account at [dodopayment.com](https://dodopayment.com)
2. Navigate to your dashboard
3. Get your API keys from the API section
4. Set up webhook endpoints

### 2. Webhook Configuration

Configure the following webhook endpoint in your DodoPayment dashboard:

```
URL: https://yourdomain.com/api/payment/webhook
Events to listen for:
- payment.processing
- payment.failed
- payment.cancelled
- subscription.active
- subscription.renewed
- subscription.cancelled
- subscription.expired
- subscription.failed
- subscription.plan_changed
```

### 3. Plan Configuration

The integration includes three subscription plans:

- **Basic Plan**: $9/month - 50 rewrites per day
- **Pro Plan**: $9.99/month - 200 rewrites per day
- **Unlimited Plan**: $29/month - Unlimited rewrites

You can modify these plans in `lib/dodopayment.ts` in the `getAvailablePlans()` method.

### 4. Database Migration

Run the database migration to ensure the users table has the correct structure:

```bash
npm run db:migrate
```

## API Endpoints

### Payment Intent Creation

```
POST /api/payment/create-intent
Body: { planId: string }
```

### Webhook Handler

```
POST /api/payment/webhook
Headers: { "dodo-signature": string }
```

### Subscription Management

```
GET /api/subscription
POST /api/subscription/[id]/cancel
```

## Frontend Components

### PaymentForm

Located in `components/PaymentForm.tsx`

- Handles payment processing
- Shows payment status
- Redirects after successful payment

### SubscriptionManager

Located in `components/SubscriptionManager.tsx`

- Displays subscription details
- Allows subscription cancellation
- Shows billing information

## Integration Points

### Pricing Page

The pricing page (`app/pricing/page.tsx`) now includes:

- Payment modal integration
- Plan selection
- Payment form display

### Dashboard

The dashboard can include the SubscriptionManager component for users to manage their subscriptions.

## Testing

### Sandbox Mode

1. Set `DODOPAYMENT_ENVIRONMENT=sandbox`
2. Use test API keys
3. Test payment flows with test cards

### Production Mode

1. Set `DODOPAYMENT_ENVIRONMENT=production`
2. Use live API keys
3. Ensure webhook endpoints are publicly accessible

## Security Considerations

1. **Webhook Verification**: Always verify webhook signatures
2. **API Key Security**: Keep API keys secure and never expose them in client-side code
3. **HTTPS**: Ensure all webhook endpoints use HTTPS in production
4. **Input Validation**: Validate all payment data before processing

## Error Handling

The integration includes comprehensive error handling:

- Payment failures
- Network errors
- Invalid webhook signatures
- Database errors

## Monitoring

All payment events are logged using the monitoring system:

- Payment successes/failures
- Subscription changes
- Webhook events
- Error tracking

## Customization

### Adding New Plans

1. Update `getAvailablePlans()` in `lib/dodopayment.ts`
2. Add plan features and pricing
3. Update the pricing page UI

### Custom Payment Methods

1. Modify the `createPaymentIntent()` method
2. Add new payment method types
3. Update frontend payment form

### Webhook Events

1. Add new event handlers in `app/api/payment/webhook/route.ts`
2. Implement custom business logic
3. Update database schema if needed

## Support

For issues with the DodoPayment integration:

1. Check the logs for error messages
2. Verify webhook configuration
3. Test with sandbox mode first
4. Contact DodoPayment support for API issues

## Notes

- This is a custom implementation since DodoPayment doesn't have an official SDK
- The integration simulates some functionality for demonstration purposes
- In production, you'll need to implement actual DodoPayment API calls
- Consider adding retry logic for failed payments
- Implement proper subscription lifecycle management
