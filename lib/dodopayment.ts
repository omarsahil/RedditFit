// DodoPayment integration for RedditFit
export interface DodoPaymentConfig {
  apiKey: string;
  environment: "sandbox" | "production";
  webhookSecret?: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  interval: "month" | "year";
  features: string[];
  rewritesLimit: number;
}

export interface CreatePaymentIntentRequest {
  planId: string;
  userId: string;
  email: string;
  metadata?: Record<string, any>;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed";
  clientSecret: string;
  paymentMethod?: string;
  created: number;
  metadata?: Record<string, any>;
}

export interface WebhookEvent {
  id: string;
  type: string;
  data: any;
  created: number;
}

// DodoPayment API client
export class DodoPaymentClient {
  private config: DodoPaymentConfig;
  private baseUrl: string;

  constructor(config: DodoPaymentConfig) {
    this.config = config;
    this.baseUrl =
      config.environment === "production"
        ? "https://api.dodopayment.com/v1"
        : "https://api-sandbox.dodopayment.com/v1";
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.config.apiKey}`,
      "X-API-Key": this.config.apiKey,
      "Content-Type": "application/json",
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `DodoPayment API error: ${response.status} - ${
          error.message || response.statusText
        }`
      );
    }

    return response.json();
  }

  async createPaymentIntent(
    data: CreatePaymentIntentRequest
  ): Promise<PaymentIntent> {
    return this.request("/payment-intents", {
      method: "POST",
      body: JSON.stringify({
        amount: this.getPlanPrice(data.planId),
        currency: "usd",
        payment_method_types: ["card"],
        metadata: {
          userId: data.userId,
          planId: data.planId,
          ...data.metadata,
        },
        receipt_email: data.email,
      }),
    });
  }

  async getPaymentIntent(id: string): Promise<PaymentIntent> {
    return this.request(`/payment-intents/${id}`);
  }

  async confirmPaymentIntent(
    id: string,
    paymentMethod: string
  ): Promise<PaymentIntent> {
    return this.request(`/payment-intents/${id}/confirm`, {
      method: "POST",
      body: JSON.stringify({
        payment_method: paymentMethod,
      }),
    });
  }

  async createSubscription(data: {
    customerId: string;
    planId: string;
    paymentMethod: string;
  }) {
    return this.request("/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        customer: data.customerId,
        items: [{ price: this.getPlanPriceId(data.planId) }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
      }),
    });
  }

  async cancelSubscription(subscriptionId: string) {
    return this.request(`/subscriptions/${subscriptionId}/cancel`, {
      method: "POST",
    });
  }

  private getPlanPrice(planId: string): number {
    const plans = this.getAvailablePlans();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    return plan.price;
  }

  private getPlanPriceId(planId: string): string {
    // In a real implementation, you'd have price IDs from DodoPayment
    // For now, we'll use the plan ID as the price ID
    return planId;
  }

  getAvailablePlans(): PaymentPlan[] {
    return [
      {
        id: "basic-monthly",
        name: "Basic Plan",
        price: 900, // $9.00
        currency: "usd",
        interval: "month",
        features: [
          "50 rewrites per day",
          "Advanced AI models",
          "Bulk rewrite mode",
          "Custom AI tones",
          "Priority processing",
        ],
        rewritesLimit: 50,
      },
      {
        id: "pro-monthly",
        name: "Pro Plan",
        price: 1900, // $19.00
        currency: "usd",
        interval: "month",
        features: [
          "200 rewrites per day",
          "Advanced AI models",
          "Bulk rewrite mode",
          "Custom AI tones",
          "Priority processing",
          "Advanced analytics",
          "Advanced reporting",
          "Priority support",
        ],
        rewritesLimit: 200,
      },
      {
        id: "unlimited-monthly",
        name: "Unlimited Plan",
        price: 2900, // $29.00
        currency: "usd",
        interval: "month",
        features: [
          "Unlimited rewrites",
          "Advanced AI models",
          "Bulk rewrite mode",
          "Custom AI tones",
          "Priority processing",
          "Advanced analytics",
          "Advanced reporting",
          "Priority support",
          "API access",
        ],
        rewritesLimit: -1, // Unlimited
      },
    ];
  }

  verifyWebhookSignature(payload: string, signature: string): WebhookEvent {
    // In a real implementation, you'd verify the webhook signature
    // For now, we'll just parse the payload
    try {
      return JSON.parse(payload);
    } catch (error) {
      throw new Error("Invalid webhook payload");
    }
  }
}

// Initialize DodoPayment client
export function createDodoPaymentClient(): DodoPaymentClient {
  const config: DodoPaymentConfig = {
    apiKey: process.env.DODOPAYMENT_API_KEY || "",
    environment:
      (process.env.DODOPAYMENT_ENVIRONMENT as "sandbox" | "production") ||
      "sandbox",
    webhookSecret: process.env.DODOPAYMENT_WEBHOOK_SECRET,
  };

  if (!config.apiKey) {
    throw new Error("DODOPAYMENT_API_KEY environment variable is required");
  }

  return new DodoPaymentClient(config);
}
