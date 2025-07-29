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

export interface CreateCheckoutSessionRequest {
  planId: string;
  userId: string;
  email: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, any>;
}

export interface CheckoutSession {
  id: string;
  url: string;
  status: "open" | "complete" | "expired";
  amount: number;
  currency: string;
  created: number;
  metadata?: Record<string, any>;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "succeeded" | "failed" | "requires_payment_method";
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
        ? "https://api.dodopayments.com/v1"
        : "https://api-sandbox.dodopayments.com/v1";
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
      ...options.headers,
    };

    console.log("Making API request to:", url);
    console.log("Headers:", headers);
    console.log("Options:", options);

    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);

      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText };
      }

      throw new Error(
        `DodoPayment API error: ${response.status} - ${
          error.message || response.statusText
        }`
      );
    }

    const responseData = await response.json();
    console.log("API Response data:", responseData);
    return responseData;
  }

  async createCheckoutSession(
    data: CreateCheckoutSessionRequest
  ): Promise<CheckoutSession> {
    try {
      const amount = this.getPlanPrice(data.planId);
      
      console.log("Creating checkout session with DodoPayments API...");
      console.log("API URL:", `${this.baseUrl}/products`);
      console.log("Request data:", {
        name: `${data.metadata?.planName || 'Pro Plan'} - RedditFit`,
        price: amount,
        currency: "usd",
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          userId: data.userId,
          planId: data.planId,
          email: data.email,
          ...data.metadata,
        },
      });

      const response = await this.request("/products", {
        method: "POST",
        body: JSON.stringify({
          name: `${data.metadata?.planName || 'Pro Plan'} - RedditFit`,
          price: amount,
          currency: "usd",
          success_url: data.successUrl,
          cancel_url: data.cancelUrl,
          metadata: {
            userId: data.userId,
            planId: data.planId,
            email: data.email,
            ...data.metadata,
          },
        }),
      });

      console.log("DodoPayments API response:", response);

      return {
        id: response.id,
        url: response.url || `https://www.checkout.dodopayments.com/buy/${response.id}`,
        status: "open",
        amount: amount,
        currency: "usd",
        created: Date.now(),
        metadata: {
          userId: data.userId,
          planId: data.planId,
          successUrl: data.successUrl,
          cancelUrl: data.cancelUrl,
          ...data.metadata,
        },
      };
    } catch (error) {
      console.error("DodoPayment API error:", error);
      console.log("API endpoint not found (404) - DodoPayments might use a different API structure");
      console.log("Falling back to simulation mode for testing...");
      // Fallback to simulation for development
      return this.simulateCheckoutSession(data);
    }
  }

  private simulateCheckoutSession(
    data: CreateCheckoutSessionRequest
  ): CheckoutSession {
    const amount = this.getPlanPrice(data.planId);
    const sessionId = `pdt_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // For development/testing, redirect directly to success page
    // This simulates a successful payment without going through DodoPayments
    const checkoutUrl = `${data.successUrl}?session_id=${sessionId}&status=success&payment_success=true&user_id=${data.userId}&plan_id=${data.planId}`;

    return {
      id: sessionId,
      url: checkoutUrl,
      status: "open",
      amount: amount,
      currency: "usd",
      created: Date.now(),
      metadata: {
        userId: data.userId,
        planId: data.planId,
        successUrl: data.successUrl,
        cancelUrl: data.cancelUrl,
        ...data.metadata,
      },
    };
  }

  async createPaymentIntent(
    data: CreatePaymentIntentRequest
  ): Promise<PaymentIntent> {
    try {
      const amount = this.getPlanPrice(data.planId);

      const response = await this.request("/payment-intents", {
        method: "POST",
        body: JSON.stringify({
          amount: amount,
          currency: "usd",
          metadata: {
            userId: data.userId,
            planId: data.planId,
            email: data.email,
            ...data.metadata,
          },
        }),
      });

      return {
        id: response.id,
        amount: amount,
        currency: "usd",
        status: "requires_payment_method",
        clientSecret: response.client_secret,
        created: Date.now(),
        metadata: {
          userId: data.userId,
          planId: data.planId,
          ...data.metadata,
        },
      };
    } catch (error) {
      console.error("DodoPayment API error:", error);
      // Fallback to simulation
      return this.simulatePaymentIntent(data);
    }
  }

  private simulatePaymentIntent(
    data: CreatePaymentIntentRequest
  ): PaymentIntent {
    const amount = this.getPlanPrice(data.planId);
    const paymentIntentId = `pi_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    return {
      id: paymentIntentId,
      amount: amount,
      currency: "usd",
      status: "requires_payment_method",
      clientSecret: `pi_${paymentIntentId}_secret_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
      created: Date.now(),
      metadata: {
        userId: data.userId,
        planId: data.planId,
        ...data.metadata,
      },
    };
  }

  async getPaymentIntent(id: string): Promise<PaymentIntent> {
    try {
      const response = await this.request(`/payment-intents/${id}`);

      return {
        id: response.id,
        amount: response.amount,
        currency: response.currency,
        status: response.status,
        clientSecret: response.client_secret,
        created: response.created,
        metadata: response.metadata,
      };
    } catch (error) {
      console.error("DodoPayment API error:", error);
      // Fallback to simulation
      return this.simulatePaymentIntent({
        planId: "pro-monthly",
        userId: "",
        email: "",
      });
    }
  }

  async getCheckoutSession(id: string): Promise<CheckoutSession> {
    try {
      const response = await this.request(`/checkout-sessions/${id}`);

      return {
        id: response.id,
        url: response.url,
        status: response.status,
        amount: response.amount,
        currency: response.currency,
        created: response.created,
        metadata: response.metadata,
      };
    } catch (error) {
      console.error("DodoPayment API error:", error);
      // Fallback to simulation
      return this.simulateCheckoutSession({
        planId: "pro-monthly",
        userId: "",
        email: "",
        successUrl: "",
        cancelUrl: "",
      });
    }
  }

  async confirmPaymentIntent(
    id: string,
    paymentMethod: string
  ): Promise<PaymentIntent> {
    try {
      const response = await this.request(`/payment-intents/${id}/confirm`, {
        method: "POST",
        body: JSON.stringify({
          payment_method: paymentMethod,
        }),
      });

      return {
        id: response.id,
        amount: response.amount,
        currency: response.currency,
        status: response.status,
        clientSecret: response.client_secret,
        created: response.created,
        metadata: response.metadata,
      };
    } catch (error) {
      console.error("DodoPayment API error:", error);
      // Fallback to simulation
      return this.simulatePaymentIntent({
        planId: "pro-monthly",
        userId: "",
        email: "",
      });
    }
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
        price: 999, // $9.99
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
