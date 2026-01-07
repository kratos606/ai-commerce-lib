'use strict';

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.ts
var client_exports = {};
__export(client_exports, {
  AICommerce: () => exports.AICommerce,
  AICommerceError: () => exports.AICommerceError
});
exports.AICommerce = void 0; exports.AICommerceError = void 0;
var init_client = __esm({
  "src/client.ts"() {
    exports.AICommerce = class _AICommerce {
      constructor(config) {
        this.sessionToken = null;
        // ============================================
        // Products API
        // ============================================
        /**
         * Products API namespace
         */
        this.products = {
          /**
           * Create a new product
           */
          create: async (product) => {
            return this.request("/api/v1/products", {
              method: "POST",
              body: JSON.stringify(product)
            });
          },
          /**
           * Batch upsert products (create or update)
           */
          batchUpsert: async (products) => {
            return this.request("/api/v1/products", {
              method: "POST",
              body: JSON.stringify({ products })
            });
          },
          /**
           * List products with pagination
           */
          list: async (options) => {
            const params = new URLSearchParams();
            if (options?.page) params.set("page", String(options.page));
            if (options?.perPage) params.set("perPage", String(options.perPage));
            if (options?.search) params.set("search", options.search);
            if (options?.categoryId) params.set("categoryId", options.categoryId);
            if (options?.isActive !== void 0) params.set("isActive", String(options.isActive));
            const query = params.toString();
            return this.request(`/api/v1/products${query ? `?${query}` : ""}`);
          },
          /**
           * Get a single product by ID
           */
          get: async (productId) => {
            return this.request(`/api/v1/products/${productId}`);
          },
          /**
           * Update a product
           */
          update: async (productId, data) => {
            return this.request(`/api/v1/products/${productId}`, {
              method: "PUT",
              body: JSON.stringify(data)
            });
          },
          /**
           * Delete a product
           */
          delete: async (productId) => {
            return this.request(`/api/v1/products/${productId}`, {
              method: "DELETE"
            });
          }
        };
        if (!config.apiKey) {
          throw new Error("AICommerce: apiKey is required");
        }
        this.apiKey = config.apiKey;
        this.storeId = config.storeId;
        this.baseUrl = this.normalizeUrl(config.baseUrl || this.detectBaseUrl());
        this.timeout = config.timeout || 3e4;
      }
      /**
       * Detect the base URL based on environment
       */
      detectBaseUrl() {
        if (typeof window !== "undefined") {
          const script = document.querySelector("script[data-aicommerce-url]");
          if (script) {
            return script.getAttribute("data-aicommerce-url") || "https://api.aicommerce.dev";
          }
        }
        return "https://api.aicommerce.dev";
      }
      /**
       * Normalize URL (remove trailing slash)
       */
      normalizeUrl(url) {
        return url.replace(/\/$/, "");
      }
      /**
       * Make an API request
       */
      async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);
        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: {
              "Content-Type": "application/json",
              "x-api-key": this.apiKey,
              ...this.storeId && { "x-store-id": this.storeId },
              ...this.sessionToken && { "X-Session-Token": this.sessionToken },
              ...options.headers
            }
          });
          clearTimeout(timeoutId);
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const error = {
              code: errorData.code || "UNKNOWN_ERROR",
              message: errorData.message || errorData.error || `HTTP ${response.status}`,
              status: response.status
            };
            throw new exports.AICommerceError(error.message, error.code, error.status);
          }
          return response.json();
        } catch (error) {
          clearTimeout(timeoutId);
          if (error instanceof exports.AICommerceError) {
            throw error;
          }
          if (error instanceof Error && error.name === "AbortError") {
            throw new exports.AICommerceError("Request timeout", "TIMEOUT", 408);
          }
          throw new exports.AICommerceError(
            error instanceof Error ? error.message : "Unknown error",
            "NETWORK_ERROR",
            0
          );
        }
      }
      /**
       * Send a chat message and get product recommendations
       * 
       * @param message - The user's message or full ChatRequest object
       * @param context - Optional context for better recommendations
       * @returns Chat response with AI reply and products
       * 
       * @example
       * ```typescript
       * // Simple usage
       * const response = await client.chat('I need running shoes');
       * 
       * // With context
       * const response = await client.chat('I need running shoes', {
       *   budget: { max: 150 },
       *   preferences: ['comfortable', 'lightweight']
       * });
       * ```
       */
      async chat(message, context) {
        const request = typeof message === "string" ? { message, context, sessionToken: this.sessionToken || void 0 } : { ...message, sessionToken: message.sessionToken || this.sessionToken || void 0 };
        const response = await this.request("/api/v1/chat", {
          method: "POST",
          body: JSON.stringify(request)
        });
        if (response.sessionToken) {
          this.sessionToken = response.sessionToken;
        }
        return response;
      }
      /**
       * Send an audio message and get product recommendations
       * 
       * @param audioBlob - Audio blob (from MediaRecorder or file input)
       * @param context - Optional context for better recommendations
       * @returns Chat response with AI reply and products
       * 
       * @example
       * ```typescript
       * // Record audio using MediaRecorder
       * const mediaRecorder = new MediaRecorder(stream);
       * const chunks: Blob[] = [];
       * mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
       * mediaRecorder.onstop = async () => {
       *   const audioBlob = new Blob(chunks, { type: 'audio/webm' });
       *   const response = await client.chatWithAudio(audioBlob);
       *   console.log(response.reply);
       * };
       * ```
       */
      async chatWithAudio(audioBlob, context) {
        const arrayBuffer = await audioBlob.arrayBuffer();
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ""
          )
        );
        const request = {
          audioBase64: base64,
          audioMimeType: audioBlob.type || "audio/webm",
          context,
          sessionToken: this.sessionToken || void 0
        };
        const response = await this.request("/api/v1/chat", {
          method: "POST",
          body: JSON.stringify(request)
        });
        if (response.sessionToken) {
          this.sessionToken = response.sessionToken;
        }
        return response;
      }
      /**
       * Create a new chat session
       * 
       * @returns Session information with token
       */
      async createSession() {
        const response = await this.request("/api/v1/chat/session", {
          method: "POST"
        });
        this.sessionToken = response.session.token;
        return response.session;
      }
      /**
       * Clear the current session
       */
      clearSession() {
        this.sessionToken = null;
      }
      /**
       * Get the current session token
       */
      getSessionToken() {
        return this.sessionToken;
      }
      /**
       * Set a session token (for restoring sessions)
       */
      setSessionToken(token) {
        this.sessionToken = token;
      }
      // ============================================
      // Upload API
      // ============================================
      /**
       * Upload an image file
       * 
       * @example
       * ```typescript
       * // Upload from File input
       * const file = document.querySelector('input[type="file"]').files[0];
       * const result = await client.upload(file);
       * console.log(result.url);
       * 
       * // Upload and associate with product
       * const result = await client.upload(file, { productId: 'prod_123', isPrimary: true });
       * ```
       */
      async upload(file, options) {
        const formData = new FormData();
        formData.append("file", file);
        if (options?.folder) formData.append("folder", options.folder);
        if (options?.productId) formData.append("productId", options.productId);
        if (options?.isPrimary) formData.append("isPrimary", "true");
        const url = `${this.baseUrl}/api/v1/upload`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "X-API-Key": this.apiKey
          },
          body: formData
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new exports.AICommerceError(
            errorData.message || errorData.error || `HTTP ${response.status}`,
            errorData.code || "UPLOAD_ERROR",
            response.status
          );
        }
        return response.json();
      }
      /**
       * Static method for one-off chat requests
       * 
       * @example
       * ```typescript
       * const response = await AICommerce.quickChat({
       *   apiKey: 'your-api-key',
       *   message: 'I need a laptop'
       * });
       * ```
       */
      static async quickChat(options) {
        const client = new _AICommerce({
          apiKey: options.apiKey,
          baseUrl: options.baseUrl
        });
        return client.chat(options.message, options.context);
      }
    };
    exports.AICommerceError = class _AICommerceError extends Error {
      constructor(message, code, status) {
        super(message);
        this.name = "AICommerceError";
        this.code = code;
        this.status = status;
        Object.setPrototypeOf(this, _AICommerceError.prototype);
      }
    };
  }
});

// src/widget-styles.ts
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 99, g: 102, b: 241 };
}
function createWidgetStyles(config) {
  const primary = config.primaryColor;
  const rgb = hexToRgb(primary);
  const isLeft = config.position === "bottom-left";
  return `
/* AI Commerce Widget Styles */
#aicommerce-widget {
    --aic-primary: ${primary};
    --aic-primary-rgb: ${rgb.r}, ${rgb.g}, ${rgb.b};
    --aic-primary-light: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1);
    --aic-primary-dark: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.9);
    --aic-bg: #ffffff;
    --aic-bg-secondary: #f8fafc;
    --aic-text: #1e293b;
    --aic-text-secondary: #64748b;
    --aic-border: #e2e8f0;
    --aic-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    --aic-radius: 16px;
    --aic-z-index: ${config.zIndex};
    
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
    font-size: 14px;
    line-height: 1.5;
    position: fixed;
    bottom: 20px;
    ${isLeft ? "left: 20px;" : "right: 20px;"}
    z-index: var(--aic-z-index);
}

/* Dark theme */
#aicommerce-widget.aicommerce-theme-dark,
@media (prefers-color-scheme: dark) {
    #aicommerce-widget.aicommerce-theme-auto {
        --aic-bg: #1e293b;
        --aic-bg-secondary: #0f172a;
        --aic-text: #f1f5f9;
        --aic-text-secondary: #94a3b8;
        --aic-border: #334155;
    }
}

/* Launcher Button */
.aicommerce-launcher {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--aic-primary), var(--aic-primary-dark));
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(var(--aic-primary-rgb), 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    animation: aic-pulse 2s infinite;
}

.aicommerce-launcher:hover {
    transform: scale(1.1);
    box-shadow: 0 6px 30px rgba(var(--aic-primary-rgb), 0.5);
}

.aicommerce-launcher-icon {
    font-size: 24px;
}

.aicommerce-hidden {
    display: none !important;
}

@keyframes aic-pulse {
    0%, 100% { box-shadow: 0 4px 20px rgba(var(--aic-primary-rgb), 0.4); }
    50% { box-shadow: 0 4px 30px rgba(var(--aic-primary-rgb), 0.6); }
}

/* Chat Window */
.aicommerce-chat {
    position: absolute;
    bottom: 0;
    ${isLeft ? "left: 0;" : "right: 0;"}
    width: 380px;
    max-width: calc(100vw - 40px);
    height: 600px;
    max-height: calc(100vh - 100px);
    background: var(--aic-bg);
    border-radius: var(--aic-radius);
    box-shadow: var(--aic-shadow);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    transform-origin: bottom ${isLeft ? "left" : "right"};
}

.aicommerce-chat.aicommerce-closed {
    opacity: 0;
    transform: scale(0.9) translateY(20px);
    pointer-events: none;
}

.aicommerce-chat.aicommerce-open {
    opacity: 1;
    transform: scale(1) translateY(0);
}

/* Header */
.aicommerce-header {
    background: linear-gradient(135deg, var(--aic-primary), var(--aic-primary-dark));
    color: white;
    padding: 16px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

.aicommerce-header-info {
    display: flex;
    align-items: center;
    gap: 12px;
}

.aicommerce-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    overflow: hidden;
}

.aicommerce-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.aicommerce-header-text {
    display: flex;
    flex-direction: column;
}

.aicommerce-bot-name {
    font-weight: 600;
    font-size: 16px;
}

.aicommerce-status {
    font-size: 12px;
    opacity: 0.9;
}

.aicommerce-close {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    transition: background 0.2s;
}

.aicommerce-close:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Messages */
.aicommerce-messages {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: var(--aic-bg-secondary);
}

.aicommerce-message {
    max-width: 85%;
    animation: aic-slide-in 0.3s ease-out;
}

.aicommerce-message.aicommerce-user {
    align-self: flex-end;
}

.aicommerce-message.aicommerce-assistant {
    align-self: flex-start;
}

.aicommerce-message-content {
    padding: 12px 16px;
    border-radius: 16px;
    line-height: 1.5;
}

.aicommerce-user .aicommerce-message-content {
    background: var(--aic-primary);
    color: white;
    border-bottom-right-radius: 4px;
}

.aicommerce-assistant .aicommerce-message-content {
    background: var(--aic-bg);
    color: var(--aic-text);
    border-bottom-left-radius: 4px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@keyframes aic-slide-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
}

/* Typing Indicator */
.aicommerce-typing {
    display: flex;
    gap: 4px;
    padding: 12px 16px;
    background: var(--aic-bg);
    border-radius: 16px;
    width: fit-content;
}

.aicommerce-typing span {
    width: 8px;
    height: 8px;
    background: var(--aic-text-secondary);
    border-radius: 50%;
    animation: aic-bounce 1.4s infinite ease-in-out;
}

.aicommerce-typing span:nth-child(1) { animation-delay: -0.32s; }
.aicommerce-typing span:nth-child(2) { animation-delay: -0.16s; }

@keyframes aic-bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
}

/* Product Cards */
.aicommerce-products {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    overflow-x: auto;
    padding-bottom: 16px;
    width: 100%;
    max-width: 100%;
    cursor: grab;
    user-select: none;
    -webkit-user-select: none;
    scrollbar-width: none; /* Firefox */
}
.aicommerce-products::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
}

.aicommerce-product-card {
    flex-shrink: 0;
    width: 280px;
    background: var(--aic-bg);
    border-radius: 12px;
    overflow: hidden;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.aicommerce-product-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.aicommerce-product-image {
    width: 100%;
    aspect-ratio: 16/9;
    height: auto;
    object-fit: cover;
}

.aicommerce-product-placeholder {
    width: 100%;
    aspect-ratio: 16/9;
    height: auto;
    background: var(--aic-bg-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
}

.aicommerce-product-info {
    padding: 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.aicommerce-product-name {
    font-weight: 500;
    font-size: 13px;
    color: var(--aic-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.aicommerce-product-price {
    font-weight: 600;
    font-size: 14px;
    color: var(--aic-primary);
}

.aicommerce-product-desc {
    font-size: 12px;
    color: var(--aic-text-secondary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-top: 4px;
}

/* Audio Player */
.aicommerce-audio-player {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 240px;
    padding: 4px 0;
}

.aicommerce-audio-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    background: rgba(255, 255, 255, 0.25);
    color: white;
    flex-shrink: 0;
    padding: 0;
}

.aicommerce-audio-btn:hover {
    background: rgba(255, 255, 255, 0.35);
    transform: scale(1.05);
}

.aicommerce-audio-btn:active {
    transform: scale(0.95);
}

/* Invert colors for assistant (since background is white/gray) */
.aicommerce-assistant .aicommerce-audio-btn {
    background: var(--aic-primary);
    color: white;
}
.aicommerce-assistant .aicommerce-audio-btn:hover {
    background: var(--aic-primary-dark);
}

.aicommerce-audio-waveform {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
    min-width: 0; /* Prevent overflow */
}

.aicommerce-waveform-bars {
    display: flex;
    align-items: center;
    gap: 2px;
    height: 24px;
    cursor: pointer;
    width: 100%;
}

.aicommerce-waveform-bar {
    width: 3px;
    border-radius: 2px;
    min-height: 3px;
    transition: background-color 0.1s;
    flex-shrink: 0;
}

.aicommerce-audio-time {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    font-weight: 500;
}

.aicommerce-user .aicommerce-audio-time {
    color: rgba(255, 255, 255, 0.8);
}
.aicommerce-assistant .aicommerce-audio-time {
    color: var(--aic-text-secondary);
}

/* RTL Support */
.aicommerce-rtl {
    direction: rtl;
    text-align: right;
}
.aicommerce-ltr {
    direction: ltr;
    text-align: left;
}

/* Input Area */
.aicommerce-input-container {
    padding: 16px 20px;
    background: var(--aic-bg);
    border-top: 1px solid var(--aic-border);
    display: flex;
    gap: 12px;
}

.aicommerce-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid var(--aic-border);
    border-radius: 24px;
    background: var(--aic-bg-secondary);
    color: var(--aic-text);
    font-size: 14px;
    outline: none;
    transition: all 0.2s;
}

.aicommerce-input:focus {
    border-color: var(--aic-primary);
    box-shadow: 0 0 0 3px var(--aic-primary-light);
}

.aicommerce-input::placeholder {
    color: var(--aic-text-secondary);
}

.aicommerce-send {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--aic-primary);
    border: none;
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.aicommerce-send:hover:not(:disabled) {
    background: var(--aic-primary-dark);
    transform: scale(1.05);
}

.aicommerce-send:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Microphone Button */
.aicommerce-mic {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--aic-bg-secondary);
    border: 1px solid var(--aic-border);
    color: var(--aic-text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.aicommerce-mic:hover:not(:disabled) {
    background: var(--aic-primary-light);
    border-color: var(--aic-primary);
    color: var(--aic-primary);
}

.aicommerce-mic.aicommerce-recording {
    background: #ef4444;
    border-color: #ef4444;
    color: white;
    animation: aic-recording-pulse 1s infinite;
}

.aicommerce-mic:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

@keyframes aic-recording-pulse {
    0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
    50% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(239, 68, 68, 0); }
}

/* Mobile Responsive */
@media (max-width: 420px) {
    #aicommerce-widget {
        bottom: 16px;
        ${isLeft ? "left: 16px;" : "right: 16px;"}
    }
    
    .aicommerce-chat {
        width: calc(100vw - 32px);
        height: calc(100vh - 100px);
        border-radius: 12px;
    }
    
    .aicommerce-launcher {
        width: 56px;
        height: 56px;
    }
}

/* Scrollbar */
.aicommerce-messages::-webkit-scrollbar {
    width: 6px;
}

.aicommerce-messages::-webkit-scrollbar-track {
    background: transparent;
}

.aicommerce-messages::-webkit-scrollbar-thumb {
    background: var(--aic-border);
    border-radius: 3px;
}

.aicommerce-messages::-webkit-scrollbar-thumb:hover {
    background: var(--aic-text-secondary);
}
`;
}
function injectStyles(css) {
  const style = document.createElement("style");
  style.id = "aicommerce-widget-styles";
  style.textContent = css;
  const existing = document.getElementById("aicommerce-widget-styles");
  if (existing) {
    existing.remove();
  }
  document.head.appendChild(style);
  return style;
}
var init_widget_styles = __esm({
  "src/widget-styles.ts"() {
  }
});

// src/widget.ts
var widget_exports = {};
__export(widget_exports, {
  AICommerceWidget: () => exports.AICommerceWidget,
  createWidget: () => createWidget
});
function createWidget(config) {
  if (!config.apiKey) {
    throw new Error("AICommerceWidget: apiKey is required");
  }
  const client = new exports.AICommerce({
    apiKey: config.apiKey,
    storeId: config.storeId,
    baseUrl: config.baseUrl
  });
  const state = {
    isOpen: false,
    isLoading: true,
    isRecording: false,
    messages: [],
    storeConfig: null
  };
  let mediaRecorder = null;
  let audioChunks = [];
  let container = null;
  let styleElement = null;
  let resolvedConfig;
  async function fetchStoreConfig() {
    try {
      const baseUrl = config.baseUrl || detectBaseUrl();
      const response = await fetch(`${baseUrl}/api/v1/store`, {
        headers: { "x-api-key": config.apiKey }
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.store;
    } catch (error) {
      console.error("Failed to fetch store config:", error);
      return null;
    }
  }
  function detectBaseUrl() {
    if (typeof window !== "undefined") {
      const script = document.querySelector("script[data-aicommerce-url]");
      if (script) {
        return script.getAttribute("data-aicommerce-url") || "";
      }
    }
    return "https://api.aicommerce.dev";
  }
  async function initialize() {
    state.storeConfig = await fetchStoreConfig();
    resolvedConfig = {
      apiKey: config.apiKey,
      storeId: config.storeId,
      baseUrl: config.baseUrl || detectBaseUrl(),
      position: config.position || "bottom-right",
      theme: config.theme || "auto",
      primaryColor: config.primaryColor || state.storeConfig?.primaryColor || "#6366f1",
      welcomeMessage: config.welcomeMessage || state.storeConfig?.welcomeMessage || "Hi! How can I help you find the perfect product today?",
      botName: config.botName || state.storeConfig?.chatBotName || "Shopping Assistant",
      zIndex: config.zIndex || 9999,
      buttonText: config.buttonText || "\u{1F4AC}",
      hideLauncher: config.hideLauncher || false,
      onOpen: config.onOpen,
      onClose: config.onClose,
      onProductClick: config.onProductClick,
      onMessage: config.onMessage
    };
    const styles = createWidgetStyles(resolvedConfig);
    styleElement = injectStyles(styles);
    container = document.createElement("div");
    container.id = "aicommerce-widget";
    container.className = `aicommerce-widget aicommerce-${resolvedConfig.position} aicommerce-theme-${resolvedConfig.theme}`;
    document.body.appendChild(container);
    render();
    state.messages.push({
      role: "assistant",
      content: resolvedConfig.welcomeMessage
    });
    state.isLoading = false;
    render();
  }
  function render() {
    if (!container) return;
    const html = `
            ${!resolvedConfig.hideLauncher ? `
                <button class="aicommerce-launcher ${state.isOpen ? "aicommerce-hidden" : ""}" aria-label="Open chat">
                    <span class="aicommerce-launcher-icon">${resolvedConfig.buttonText}</span>
                </button>
            ` : ""}
            
            <div class="aicommerce-chat ${state.isOpen ? "aicommerce-open" : "aicommerce-closed"}">
                <div class="aicommerce-header">
                    <div class="aicommerce-header-info">
                        <div class="aicommerce-avatar">
                            ${state.storeConfig?.logo ? `<img src="${state.storeConfig.logo}" alt="${resolvedConfig.botName}" />` : `<span>\u{1F916}</span>`}
                        </div>
                        <div class="aicommerce-header-text">
                            <span class="aicommerce-bot-name">${resolvedConfig.botName}</span>
                            <span class="aicommerce-status">Online</span>
                        </div>
                    </div>
                    <button class="aicommerce-close" aria-label="Close chat">\u2715</button>
                </div>
                
                <div class="aicommerce-messages">
                    ${state.messages.map((msg, index) => {
      const isRtl = isArabic(msg.content);
      const isUser = msg.role === "user";
      return `
                        <div class="aicommerce-message aicommerce-${msg.role}">
                            <div class="aicommerce-message-content ${isRtl ? "aicommerce-rtl" : "aicommerce-ltr"}">
                                ${msg.audioUrl ? renderAudioPlayer(msg, index, isUser) : escapeHtml(msg.content)}
                            </div>
                            ${msg.products && msg.products.length > 0 ? `
                                <div class="aicommerce-products">
                                    ${msg.products.map((product) => `
                                        <div class="aicommerce-product-card" data-product-id="${product.id}">
                                            ${product.image || product.imageUrl ? `
                                                <img src="${product.image || product.imageUrl}" alt="${escapeHtml(product.name)}" class="aicommerce-product-image" />
                                            ` : `
                                                <div class="aicommerce-product-placeholder">\u{1F4E6}</div>
                                            `}
                                            <div class="aicommerce-product-info">
                                                <span class="aicommerce-product-name" title="${escapeHtml(product.name)}">${escapeHtml(product.name)}</span>
                                                ${product.description ? `<p class="aicommerce-product-desc">${escapeHtml(product.description)}</p>` : ""}
                                                <span class="aicommerce-product-price">${formatPrice(product.price, product.currency)}</span>
                                            </div>
                                        </div>
                                    `).join("")}
                                </div>
                            ` : ""}
                        </div>
                    `;
    }).join("")}
                    ${state.isLoading ? `
                        <div class="aicommerce-message aicommerce-assistant">
                            <div class="aicommerce-typing">
                                <span></span><span></span><span></span>
                            </div>
                        </div>
                    ` : ""}
                </div>
                
                <div class="aicommerce-input-container">
                    <input 
                        type="text" 
                        class="aicommerce-input" 
                        placeholder="Type your message..."
                        ${state.isLoading || state.isRecording ? "disabled" : ""}
                    />
                    <button class="aicommerce-mic ${state.isRecording ? "aicommerce-recording" : ""}" ${state.isLoading ? "disabled" : ""} aria-label="${state.isRecording ? "Stop recording" : "Voice input"}">
                        ${state.isRecording ? `
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                <rect x="6" y="6" width="12" height="12" rx="2"/>
                            </svg>
                        ` : `
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                <line x1="12" y1="19" x2="12" y2="23"/>
                                <line x1="8" y1="23" x2="16" y2="23"/>
                            </svg>
                        `}
                    </button>
                    <button class="aicommerce-send" ${state.isLoading || state.isRecording ? "disabled" : ""} aria-label="Send message">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    container.innerHTML = html;
    attachEventListeners();
    const messagesEl = container.querySelector(".aicommerce-messages");
    if (messagesEl) {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }
  }
  function renderAudioPlayer(msg, index, isUser) {
    return `
            <div class="aicommerce-audio-player" data-message-index="${index}">
                <button class="aicommerce-audio-btn">
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                </button>
                <div class="aicommerce-audio-waveform">
                    <div class="aicommerce-waveform-bars">
                        ${(msg.waveformBars || Array(40).fill(10)).map((height) => `
                            <div class="aicommerce-waveform-bar" style="height: ${height}%; background-color: ${isUser ? "rgba(255,255,255,0.4)" : "rgba(99,102,241,0.3)"}"></div>
                        `).join("")}
                    </div>
                    <div class="aicommerce-audio-time">
                        <span class="aicommerce-current-time">0:00</span>
                        <span>${formatTime(msg.audioDuration || 0)}</span>
                    </div>
                </div>
                <audio src="${msg.audioUrl}" preload="metadata"></audio>
            </div>
        `;
  }
  function attachEventListeners() {
    if (!container) return;
    const launcherEl = container.querySelector(".aicommerce-launcher");
    if (launcherEl) {
      launcherEl.addEventListener("click", () => open());
    }
    const closeEl = container.querySelector(".aicommerce-close");
    if (closeEl) {
      closeEl.addEventListener("click", () => close());
    }
    const inputEl = container.querySelector(".aicommerce-input");
    const sendEl = container.querySelector(".aicommerce-send");
    if (inputEl) {
      inputEl.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && inputEl.value.trim()) {
          handleSend(inputEl.value.trim());
          inputEl.value = "";
        }
      });
    }
    if (sendEl && inputEl) {
      sendEl.addEventListener("click", () => {
        if (inputEl.value.trim()) {
          handleSend(inputEl.value.trim());
          inputEl.value = "";
        }
      });
    }
    const micEl = container.querySelector(".aicommerce-mic");
    if (micEl) {
      micEl.addEventListener("click", () => handleMicClick());
    }
    const productCards = container.querySelectorAll(".aicommerce-product-card");
    productCards.forEach((card) => {
      card.addEventListener("click", () => {
        const productId = card.getAttribute("data-product-id");
        const product = state.messages.flatMap((m) => m.products || []).find((p) => p.id === productId);
        if (product && resolvedConfig.onProductClick) {
          resolvedConfig.onProductClick(product);
        }
      });
    });
    const sliders = container.querySelectorAll(".aicommerce-products");
    sliders.forEach((slider) => {
      let isDown = false;
      let startX = 0;
      let scrollLeft = 0;
      slider.addEventListener("mousedown", (e) => {
        isDown = true;
        slider.style.cursor = "grabbing";
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      slider.addEventListener("mouseleave", () => {
        isDown = false;
        slider.style.cursor = "grab";
      });
      slider.addEventListener("mouseup", () => {
        isDown = false;
        slider.style.cursor = "grab";
      });
      slider.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
      });
    });
    const audioPlayers = container.querySelectorAll(".aicommerce-audio-player");
    audioPlayers.forEach((player) => {
      const audio = player.querySelector("audio");
      const btn = player.querySelector(".aicommerce-audio-btn");
      const bars = player.querySelectorAll(".aicommerce-waveform-bar");
      const timeDisplay = player.querySelector(".aicommerce-current-time");
      if (!audio || !btn) return;
      btn.addEventListener("click", () => {
        const isPlaying = !audio.paused;
        if (!isPlaying) {
          container?.querySelectorAll("audio").forEach((a) => {
            if (a !== audio && !a.paused) {
              a.pause();
              const parent = a.closest(".aicommerce-audio-player");
              const otherBtn = parent?.querySelector(".aicommerce-audio-btn");
              if (otherBtn) otherBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
            }
          });
          audio.play();
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;
        } else {
          audio.pause();
          btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
        }
      });
      audio.addEventListener("timeupdate", () => {
        if (timeDisplay) timeDisplay.textContent = formatTime(audio.currentTime);
        if (audio.duration) {
          const progress = audio.currentTime / audio.duration * 100;
          bars.forEach((bar, i) => {
            const barPos = i / bars.length * 100;
            if (barPos <= progress) {
              bar.style.backgroundColor = player.closest(".aicommerce-user") ? "rgba(255,255,255,1)" : "var(--aic-primary)";
            } else {
              bar.style.backgroundColor = player.closest(".aicommerce-user") ? "rgba(255,255,255,0.4)" : "rgba(99,102,241,0.3)";
            }
          });
        }
      });
      audio.addEventListener("ended", () => {
        btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      });
      const waveform = player.querySelector(".aicommerce-waveform-bars");
      if (waveform) {
        waveform.addEventListener("click", (e) => {
          const rect = waveform.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = x / rect.width;
          if (audio.duration) {
            audio.currentTime = percent * audio.duration;
          }
        });
      }
    });
  }
  async function handleMicClick() {
    if (state.isRecording) {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioChunks = [];
        mediaRecorder = new MediaRecorder(stream, {
          mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4"
        });
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunks.push(e.data);
          }
        };
        mediaRecorder.onstop = async () => {
          stream.getTracks().forEach((track) => track.stop());
          if (audioChunks.length > 0) {
            const audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || "audio/webm" });
            await handleAudioSend(audioBlob);
          }
          state.isRecording = false;
          render();
        };
        mediaRecorder.start();
        state.isRecording = true;
        render();
      } catch (error) {
        console.error("Failed to start recording:", error);
        state.messages.push({
          role: "assistant",
          content: "Unable to access microphone. Please check your permissions."
        });
        render();
      }
    }
  }
  async function handleAudioSend(audioBlob) {
    const audioUrl = URL.createObjectURL(audioBlob);
    let waveformBars = Array(40).fill(10);
    let audioDuration = 0;
    try {
      waveformBars = await analyzeAudio(audioBlob);
      const audio = new Audio(audioUrl);
      await new Promise((resolve) => {
        audio.onloadedmetadata = () => {
          audioDuration = audio.duration;
          resolve();
        };
        audio.onerror = () => resolve();
      });
    } catch (e) {
      console.error("Audio analysis failed", e);
    }
    state.messages.push({
      role: "user",
      content: "Voice message",
      audioUrl,
      audioDuration,
      waveformBars
    });
    state.isLoading = true;
    render();
    try {
      const response = await client.chatWithAudio(audioBlob);
      state.messages.push({
        role: "assistant",
        content: response.reply,
        products: response.products
      });
      if (resolvedConfig.onMessage) {
        resolvedConfig.onMessage("Voice message", response);
      }
      return response;
    } catch (error) {
      state.messages.push({
        role: "assistant",
        content: "Sorry, I encountered an error processing your voice message. Please try again."
      });
      throw error;
    } finally {
      state.isLoading = false;
      render();
    }
  }
  function isArabic(text) {
    return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
  }
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }
  async function analyzeAudio(blob) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const channelData = audioBuffer.getChannelData(0);
      const bars = 40;
      const step = Math.floor(channelData.length / bars);
      const calculatedBars = [];
      for (let i = 0; i < bars; i++) {
        const start = i * step;
        const end = start + step;
        let sum = 0;
        for (let j = start; j < end; j++) {
          if (channelData[j]) sum += channelData[j] * channelData[j];
        }
        const rms = Math.sqrt(sum / step);
        const height = Math.min(100, Math.max(10, rms * 400));
        calculatedBars.push(height);
      }
      return calculatedBars;
    } catch (e) {
      console.error("Analysis error", e);
      return Array.from({ length: 40 }, () => 20 + Math.random() * 60);
    }
  }
  async function handleSend(message) {
    state.messages.push({ role: "user", content: message });
    state.isLoading = true;
    render();
    try {
      const response = await client.chat(message);
      state.messages.push({
        role: "assistant",
        content: response.reply,
        products: response.products
      });
      if (resolvedConfig.onMessage) {
        resolvedConfig.onMessage(message, response);
      }
      return response;
    } catch (error) {
      state.messages.push({
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again."
      });
      throw error;
    } finally {
      state.isLoading = false;
      render();
    }
  }
  function open() {
    state.isOpen = true;
    render();
    resolvedConfig.onOpen?.();
    setTimeout(() => {
      const input = container?.querySelector(".aicommerce-input");
      input?.focus();
    }, 100);
  }
  function close() {
    state.isOpen = false;
    render();
    resolvedConfig.onClose?.();
  }
  function toggle() {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }
  function destroy() {
    if (container) {
      container.remove();
      container = null;
    }
    if (styleElement) {
      styleElement.remove();
      styleElement = null;
    }
  }
  function updateConfig(newConfig) {
    Object.assign(resolvedConfig, newConfig);
    if (newConfig.primaryColor) {
      const styles = createWidgetStyles(resolvedConfig);
      if (styleElement) {
        styleElement.textContent = styles;
      }
    }
    render();
  }
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  function formatPrice(price, currency) {
    const symbols = {
      USD: "$",
      EUR: "\u20AC",
      GBP: "\xA3",
      MAD: "DH",
      SAR: "SAR",
      AED: "AED",
      JPY: "\xA5",
      CNY: "\xA5"
    };
    const symbol = symbols[currency || "USD"] || currency || "$";
    return `${price.toFixed(2)} ${symbol}`;
  }
  initialize();
  return {
    open,
    close,
    toggle,
    destroy,
    sendMessage: handleSend,
    updateConfig
  };
}
exports.AICommerceWidget = void 0;
var init_widget = __esm({
  "src/widget.ts"() {
    init_client();
    init_widget_styles();
    exports.AICommerceWidget = {
      init: createWidget,
      VERSION: "1.0.0"
    };
    if (typeof window !== "undefined") {
      window.AICommerceWidget = exports.AICommerceWidget;
    }
  }
});

// src/index.ts
init_client();
init_widget();
var VERSION = "1.0.0";
if (typeof window !== "undefined") {
  window.AICommerce = (init_client(), __toCommonJS(client_exports)).AICommerce;
  window.AICommerceError = (init_client(), __toCommonJS(client_exports)).AICommerceError;
  window.AICommerceWidget = (init_widget(), __toCommonJS(widget_exports)).AICommerceWidget;
}

exports.VERSION = VERSION;
exports.createWidget = createWidget;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map