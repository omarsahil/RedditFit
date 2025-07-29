# Brevo Email Marketing Setup Guide

This guide will help you set up Brevo (formerly Sendinblue) for email marketing with RedditFit.

## 1. Create a Brevo Account

1. Go to [https://www.brevo.com/](https://www.brevo.com/)
2. Click "Start for free" and create an account
3. Verify your email address

## 2. Get Your API Key

1. Log in to your Brevo dashboard
2. Go to **Settings** → **API Keys** (or **SMTP & API** → **API Keys**)
3. Click **Generate a new API key**
4. Give it a name like "RedditFit Integration"
5. Copy the API key (it starts with `xkeysib-`)

## 3. Create a Contact List

1. Go to **Contacts** → **Lists**
2. Click **Create a new list**
3. Name it "RedditFit Newsletter" or similar
4. Note the List ID (you'll need this)

## 4. Set Up Email Templates (Optional)

### Welcome Email Template

1. Go to **Templates** → **Email Templates**
2. Click **Create a new template**
3. Name it "Welcome Email"
4. Design your template with variables like:
   - `{{params.name}}` - User's name
   - `{{params.signup_date}}` - Signup date
5. Note the Template ID

### Password Reset Template

1. Create another template for password resets
2. Use variables like:
   - `{{params.reset_url}}` - Password reset link
   - `{{params.expiry_hours}}` - Link expiry time

### Post Rewritten Template

1. Create a template for when posts are rewritten
2. Use variables like:
   - `{{params.post_title}}` - Original post title
   - `{{params.subreddit}}` - Target subreddit
   - `{{params.dashboard_url}}` - Dashboard link

## 5. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Brevo Configuration
BREVO_API_KEY=xkeysib-your-api-key-here
BREVO_LIST_ID=2
BREVO_WELCOME_TEMPLATE_ID=1
BREVO_RESET_TEMPLATE_ID=2
BREVO_REWRITE_TEMPLATE_ID=3
```

## 6. Test the Integration

1. Start your development server
2. Go to your website's footer
3. Try subscribing with a test email
4. Check your Brevo dashboard to see if the contact was added

## 7. Email Marketing Features

### Newsletter Signup

- Users can subscribe via the footer
- Contacts are automatically added to your list
- Duplicate emails are handled gracefully

### Welcome Emails

- Automatically sent when users sign up
- Can include onboarding tips and feature highlights

### Transactional Emails

- Password reset emails
- Post rewrite notifications
- Payment confirmations

### Analytics

- Track email open rates
- Monitor click-through rates
- Analyze subscriber engagement

## 8. Best Practices

### Email Content

- Keep subject lines clear and engaging
- Use a professional sender name
- Include clear call-to-action buttons
- Make emails mobile-friendly

### Frequency

- Don't overwhelm subscribers
- Start with weekly newsletters
- Monitor unsubscribe rates

### Compliance

- Include unsubscribe links
- Respect GDPR and CAN-SPAM laws
- Get explicit consent for marketing emails

## 9. Advanced Features

### Segmentation

- Segment contacts by signup source
- Create different lists for different user types
- Send targeted campaigns

### Automation

- Set up welcome email sequences
- Create drip campaigns for inactive users
- Automate re-engagement emails

### A/B Testing

- Test different subject lines
- Experiment with email content
- Optimize send times

## 10. Troubleshooting

### Common Issues

**API Key Not Working**

- Verify the API key is correct
- Check if the key has proper permissions
- Ensure the key is active

**Contacts Not Being Added**

- Check the List ID is correct
- Verify the API endpoint is accessible
- Review server logs for errors

**Emails Not Sending**

- Check template IDs are correct
- Verify sender email is configured
- Review Brevo sending limits

### Support

- Brevo Documentation: [https://developers.brevo.com/](https://developers.brevo.com/)
- Brevo Support: [https://www.brevo.com/support/](https://www.brevo.com/support/)
- Email: rfitappteam@gmail.com

## 11. Cost Considerations

### Brevo Pricing (as of 2024)

- **Free Plan**: 300 emails/day, 2,000 contacts
- **Starter**: $25/month, 20,000 emails/month
- **Business**: $100/month, 100,000 emails/month
- **Enterprise**: Custom pricing

### Recommendations

- Start with the free plan
- Upgrade when you reach limits
- Monitor usage to optimize costs

## 12. Security

### API Key Security

- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Use different keys for development/production

### Data Protection

- Only collect necessary data
- Encrypt sensitive information
- Follow data retention policies
- Respect user privacy preferences

---

**Need Help?** Contact us at rfitappteam@gmail.com for assistance with your Brevo setup.
