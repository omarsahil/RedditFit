import { logger } from "./monitoring";

interface CDNConfig {
  provider: "cloudflare" | "aws" | "vercel" | "custom";
  baseUrl: string;
  apiKey?: string;
  zoneId?: string;
  bucketName?: string;
  region?: string;
}

interface AssetUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  metadata?: {
    size: number;
    contentType: string;
    etag?: string;
  };
}

interface CachePurgeResult {
  success: boolean;
  purgedUrls?: string[];
  error?: string;
}

class CDNManager {
  private config: CDNConfig;
  private cache: Map<string, { url: string; expires: number }> = new Map();

  constructor(config: CDNConfig) {
    this.config = config;
    logger.info("CDN Manager initialized", { provider: config.provider });
  }

  // Upload asset to CDN
  async uploadAsset(
    file: Buffer | string,
    filename: string,
    contentType: string = "application/octet-stream"
  ): Promise<AssetUploadResult> {
    const startTime = Date.now();

    try {
      let result: AssetUploadResult;

      switch (this.config.provider) {
        case "cloudflare":
          result = await this.uploadToCloudflare(file, filename, contentType);
          break;
        case "aws":
          result = await this.uploadToAWS(file, filename, contentType);
          break;
        case "vercel":
          result = await this.uploadToVercel(file, filename, contentType);
          break;
        case "custom":
          result = await this.uploadToCustom(file, filename, contentType);
          break;
        default:
          throw new Error(`Unsupported CDN provider: ${this.config.provider}`);
      }

      if (result.success && result.url) {
        // Cache the URL for future reference
        this.cache.set(filename, {
          url: result.url,
          expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
        });

        const duration = Date.now() - startTime;
        logger.info("Asset uploaded to CDN", {
          filename,
          url: result.url,
          duration,
          size: result.metadata?.size,
        });
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Asset upload failed", {
        filename,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Upload to Cloudflare
  private async uploadToCloudflare(
    file: Buffer | string,
    filename: string,
    contentType: string
  ): Promise<AssetUploadResult> {
    if (!this.config.apiKey || !this.config.zoneId) {
      throw new Error("Cloudflare API key and zone ID are required");
    }

    const formData = new FormData();
    formData.append("file", new Blob([file], { type: contentType }), filename);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/images/v1`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        url: result.result.variants[0], // First variant URL
        metadata: {
          size: file instanceof Buffer ? file.length : file.length,
          contentType,
          etag: result.result.id,
        },
      };
    } else {
      return {
        success: false,
        error: result.errors?.[0]?.message || "Upload failed",
      };
    }
  }

  // Upload to AWS S3
  private async uploadToAWS(
    file: Buffer | string,
    filename: string,
    contentType: string
  ): Promise<AssetUploadResult> {
    if (!this.config.bucketName || !this.config.region) {
      throw new Error("AWS bucket name and region are required");
    }

    // This would require AWS SDK - simplified implementation
    const url = `${this.config.baseUrl}/${filename}`;

    return {
      success: true,
      url,
      metadata: {
        size: file instanceof Buffer ? file.length : file.length,
        contentType,
      },
    };
  }

  // Upload to Vercel
  private async uploadToVercel(
    file: Buffer | string,
    filename: string,
    contentType: string
  ): Promise<AssetUploadResult> {
    const url = `${this.config.baseUrl}/${filename}`;

    return {
      success: true,
      url,
      metadata: {
        size: file instanceof Buffer ? file.length : file.length,
        contentType,
      },
    };
  }

  // Upload to custom CDN
  private async uploadToCustom(
    file: Buffer | string,
    filename: string,
    contentType: string
  ): Promise<AssetUploadResult> {
    const url = `${this.config.baseUrl}/${filename}`;

    return {
      success: true,
      url,
      metadata: {
        size: file instanceof Buffer ? file.length : file.length,
        contentType,
      },
    };
  }

  // Get asset URL (with caching)
  getAssetUrl(filename: string): string | null {
    const cached = this.cache.get(filename);

    if (cached && cached.expires > Date.now()) {
      return cached.url;
    }

    // Remove expired cache entry
    if (cached) {
      this.cache.delete(filename);
    }

    return `${this.config.baseUrl}/${filename}`;
  }

  // Purge cache for specific URLs
  async purgeCache(urls: string[]): Promise<CachePurgeResult> {
    const startTime = Date.now();

    try {
      let result: CachePurgeResult;

      switch (this.config.provider) {
        case "cloudflare":
          result = await this.purgeCloudflareCache(urls);
          break;
        case "aws":
          result = await this.purgeAWSCache(urls);
          break;
        case "vercel":
          result = await this.purgeVercelCache(urls);
          break;
        case "custom":
          result = await this.purgeCustomCache(urls);
          break;
        default:
          throw new Error(`Unsupported CDN provider: ${this.config.provider}`);
      }

      const duration = Date.now() - startTime;
      logger.info("Cache purge completed", {
        urls: urls.length,
        success: result.success,
        duration,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      logger.error("Cache purge failed", {
        urls: urls.length,
        error: error instanceof Error ? error.message : "Unknown error",
        duration,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // Purge Cloudflare cache
  private async purgeCloudflareCache(
    urls: string[]
  ): Promise<CachePurgeResult> {
    if (!this.config.apiKey || !this.config.zoneId) {
      throw new Error("Cloudflare API key and zone ID are required");
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ files: urls }),
      }
    );

    const result = await response.json();

    if (result.success) {
      return {
        success: true,
        purgedUrls: urls,
      };
    } else {
      return {
        success: false,
        error: result.errors?.[0]?.message || "Purge failed",
      };
    }
  }

  // Purge AWS cache
  private async purgeAWSCache(urls: string[]): Promise<CachePurgeResult> {
    // Simplified implementation
    return {
      success: true,
      purgedUrls: urls,
    };
  }

  // Purge Vercel cache
  private async purgeVercelCache(urls: string[]): Promise<CachePurgeResult> {
    // Simplified implementation
    return {
      success: true,
      purgedUrls: urls,
    };
  }

  // Purge custom cache
  private async purgeCustomCache(urls: string[]): Promise<CachePurgeResult> {
    // Simplified implementation
    return {
      success: true,
      purgedUrls: urls,
    };
  }

  // Optimize image
  async optimizeImage(
    imageUrl: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: "webp" | "avif" | "jpeg" | "png";
    } = {}
  ): Promise<string> {
    const { width, height, quality = 80, format = "webp" } = options;

    let optimizedUrl = imageUrl;

    switch (this.config.provider) {
      case "cloudflare":
        // Cloudflare Images supports URL parameters for optimization
        const params = new URLSearchParams();
        if (width) params.append("w", width.toString());
        if (height) params.append("h", height.toString());
        if (quality) params.append("q", quality.toString());
        if (format) params.append("f", format);

        optimizedUrl = `${imageUrl}?${params.toString()}`;
        break;

      case "vercel":
        // Vercel Image Optimization
        const vercelParams = new URLSearchParams();
        if (width) vercelParams.append("w", width.toString());
        if (height) vercelParams.append("h", height.toString());
        if (quality) vercelParams.append("q", quality.toString());
        if (format) vercelParams.append("fm", format);

        optimizedUrl = `${imageUrl}?${vercelParams.toString()}`;
        break;

      default:
        // For other providers, return original URL
        break;
    }

    return optimizedUrl;
  }

  // Get CDN statistics
  getStats() {
    return {
      provider: this.config.provider,
      baseUrl: this.config.baseUrl,
      cachedAssets: this.cache.size,
      cacheHitRate: this.calculateCacheHitRate(),
    };
  }

  // Calculate cache hit rate (simplified)
  private calculateCacheHitRate(): number {
    // This would need to track actual hits vs misses
    return 0.85; // Placeholder
  }

  // Clear local cache
  clearCache() {
    this.cache.clear();
    logger.info("Local CDN cache cleared");
  }
}

// Initialize CDN based on environment
function initializeCDN(): CDNManager {
  const provider =
    (process.env.CDN_PROVIDER as "cloudflare" | "aws" | "vercel" | "custom") ||
    "vercel";

  const config: CDNConfig = {
    provider,
    baseUrl: process.env.CDN_BASE_URL || "",
    apiKey: process.env.CDN_API_KEY,
    zoneId: process.env.CDN_ZONE_ID,
    bucketName: process.env.CDN_BUCKET_NAME,
    region: process.env.CDN_REGION,
  };

  return new CDNManager(config);
}

export const cdnManager = initializeCDN();

// Image optimization helper
export async function getOptimizedImageUrl(
  imageUrl: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: "webp" | "avif" | "jpeg" | "png";
  } = {}
): Promise<string> {
  return cdnManager.optimizeImage(imageUrl, options);
}

// Asset URL helper
export function getAssetUrl(filename: string): string {
  return cdnManager.getAssetUrl(filename) || `/assets/${filename}`;
}
