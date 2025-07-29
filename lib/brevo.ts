const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_URL = "https://api.brevo.com/v3";

export interface BrevoContact {
  email: string;
  attributes?: Record<string, any>;
  listIds?: number[];
  updateEnabled?: boolean;
}

export interface BrevoEmailTemplate {
  id: number;
  name: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
}

export class BrevoClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY is not configured");
    }
    this.apiKey = BREVO_API_KEY;
    this.baseUrl = BREVO_API_URL;
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "api-key": this.apiKey,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        `Brevo API error: ${response.status} - ${
          error.message || response.statusText
        }`
      );
    }

    return response.json();
  }

  async addContact(contact: BrevoContact) {
    return this.makeRequest("/contacts", {
      method: "POST",
      body: JSON.stringify(contact),
    });
  }

  async updateContact(email: string, attributes: Record<string, any>) {
    return this.makeRequest(`/contacts/${email}`, {
      method: "PUT",
      body: JSON.stringify({ attributes }),
    });
  }

  async deleteContact(email: string) {
    return this.makeRequest(`/contacts/${email}`, {
      method: "DELETE",
    });
  }

  async getContact(email: string) {
    return this.makeRequest(`/contacts/${email}`);
  }

  async sendTransactionalEmail(
    templateId: number,
    to: string,
    params: Record<string, any> = {}
  ) {
    return this.makeRequest("/smtp/email", {
      method: "POST",
      body: JSON.stringify({
        templateId,
        to: [{ email: to }],
        params,
      }),
    });
  }

  async getTemplates() {
    return this.makeRequest("/smtp/templates");
  }

  async getTemplate(templateId: number): Promise<BrevoEmailTemplate> {
    return this.makeRequest(`/smtp/templates/${templateId}`);
  }

  async getLists() {
    return this.makeRequest("/contacts/lists");
  }

  async getListContacts(listId: number, limit = 50, offset = 0) {
    return this.makeRequest(
      `/contacts/lists/${listId}/contacts?limit=${limit}&offset=${offset}`
    );
  }
}

// Utility functions
export async function addToNewsletter(email: string, source = "website") {
  const client = new BrevoClient();
  const listId = parseInt(process.env.BREVO_LIST_ID || "2");

  return client.addContact({
    email,
    listIds: [listId],
    updateEnabled: true,
    attributes: {
      SIGNUP_SOURCE: source,
      SIGNUP_DATE: new Date().toISOString(),
      LAST_ACTIVITY: new Date().toISOString(),
    },
  });
}

export async function sendWelcomeEmail(email: string, name?: string) {
  const client = new BrevoClient();
  const templateId = parseInt(process.env.BREVO_WELCOME_TEMPLATE_ID || "1");

  return client.sendTransactionalEmail(templateId, email, {
    name: name || "there",
    signup_date: new Date().toLocaleDateString(),
  });
}

export async function sendPasswordResetEmail(
  email: string,
  resetToken: string
) {
  const client = new BrevoClient();
  const templateId = parseInt(process.env.BREVO_RESET_TEMPLATE_ID || "2");

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;

  return client.sendTransactionalEmail(templateId, email, {
    reset_url: resetUrl,
    expiry_hours: "24",
  });
}

export async function sendPostRewrittenEmail(
  email: string,
  postTitle: string,
  subreddit: string
) {
  const client = new BrevoClient();
  const templateId = parseInt(process.env.BREVO_REWRITE_TEMPLATE_ID || "3");

  return client.sendTransactionalEmail(templateId, email, {
    post_title: postTitle,
    subreddit: subreddit,
    dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
}
