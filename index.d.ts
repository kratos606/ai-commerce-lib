/**
 * AI Commerce SDK Types
 */
/** SDK Configuration options */
interface AICommerceConfig {
    /** Your API key from the AI Commerce dashboard */
    apiKey: string;
    /** Your Store ID from the AI Commerce dashboard */
    storeId?: string;
    /** Base URL for the API (defaults to current origin or https://api.aicommerce.dev) */
    baseUrl?: string;
    /** Request timeout in milliseconds (default: 30000) */
    timeout?: number;
}
/** Chat message request */
interface ChatRequest {
    /** The user's message (optional if audio is provided) */
    message?: string;
    /** Base64-encoded audio data for voice input */
    audioBase64?: string;
    /** MIME type of the audio (e.g., 'audio/webm', 'audio/wav') */
    audioMimeType?: string;
    /** Optional session token for conversation continuity */
    sessionToken?: string;
    /** Optional context for better recommendations */
    context?: ChatContext;
}
/** Additional context for chat requests */
interface ChatContext {
    /** Budget range */
    budget?: {
        min?: number;
        max?: number;
        currency?: string;
    };
    /** User preferences */
    preferences?: string[];
    /** Category to focus on */
    category?: string;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/** Chat response from the API */
interface ChatResponse {
    /** AI-generated response text */
    reply: string;
    /** Recommended products */
    products: Product[];
    /** Session token for follow-up messages */
    sessionToken: string;
    /** Suggested follow-up questions */
    suggestions?: string[];
    /** AI confidence score (0-1) */
    confidence?: number;
}
/** Product information */
interface Product {
    /** Unique product ID */
    id: string;
    /** Product name */
    name: string;
    /** Product description */
    description?: string;
    /** Price in the store's currency */
    price: number;
    /** Currency code */
    currency?: string;
    /** Primary image URL */
    imageUrl?: string;
    /** Image URL (backend consistency) */
    image?: string;
    /** All image URLs */
    images?: string[];
    /** Product category */
    category?: string;
    /** Product attributes */
    attributes?: Record<string, string>;
    /** Relevance score (0-1) */
    relevanceScore?: number;
    /** Product URL */
    url?: string;
}
/** Session information */
interface Session {
    /** Session token */
    token: string;
    /** Session expiration time */
    expiresAt?: string;
}
/** API Error response */
interface APIError {
    /** Error code */
    code: string;
    /** Error message */
    message: string;
    /** HTTP status code */
    status: number;
}
/** Event types for callbacks */
type EventType = 'message' | 'products' | 'error' | 'session';
/** Event callback */
type EventCallback<T = unknown> = (data: T) => void;
/** Store configuration from API */
interface StoreConfig {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    primaryColor: string;
    chatBotName: string;
    welcomeMessage: string;
}
/** Widget display mode */
type WidgetDisplayMode = 'widget' | 'embedded';
/** Widget configuration options */
interface WidgetConfig {
    /** Your API key from the AI Commerce dashboard */
    apiKey: string;
    /** Your Store ID from the AI Commerce dashboard */
    storeId?: string;
    /** Base URL for the API (defaults to current origin or https://api.aicommerce.dev) */
    baseUrl?: string;
    /** Display mode: 'widget' (floating) or 'embedded' (inline container) */
    displayMode?: WidgetDisplayMode;
    /** Container element or selector for embedded mode */
    container?: HTMLElement | string;
    /** Height of the chat in embedded mode (default: '500px') */
    height?: string;
    /** Widget position on screen (only for widget mode) */
    position?: 'bottom-right' | 'bottom-left';
    /** Theme mode */
    theme?: 'light' | 'dark' | 'auto';
    /** Custom primary color (overrides store setting) */
    primaryColor?: string;
    /** Custom welcome message (overrides store setting) */
    welcomeMessage?: string;
    /** Custom bot name (overrides store setting) */
    botName?: string;
    /** Z-index for the widget (only for widget mode) */
    zIndex?: number;
    /** Custom button text when minimized */
    buttonText?: string;
    /** Hide the launcher button (for custom triggers) */
    hideLauncher?: boolean;
    /** Callback when widget is opened */
    onOpen?: () => void;
    /** Callback when widget is closed */
    onClose?: () => void;
    /** Callback when a product is clicked */
    onProductClick?: (product: Product) => void;
    /** Callback when a message is sent */
    onMessage?: (message: string, response: ChatResponse) => void;
}
/** Widget instance interface */
interface WidgetInstance {
    /** Open the chat widget */
    open: () => void;
    /** Close the chat widget */
    close: () => void;
    /** Toggle the chat widget */
    toggle: () => void;
    /** Destroy the widget and remove from DOM */
    destroy: () => void;
    /** Send a message programmatically */
    sendMessage: (message: string) => Promise<ChatResponse>;
    /** Update widget configuration */
    updateConfig: (config: Partial<WidgetConfig>) => void;
}

/**
 * AI Commerce SDK Client
 *
 * @example
 * ```typescript
 * import { AICommerce } from '@yassirbenmoussa/aicommerce-sdk';
 *
 * const client = new AICommerce({ apiKey: 'your-api-key' });
 * const response = await client.chat('I need a laptop under $1000');
 * console.log(response.products);
 * ```
 */
declare class AICommerce {
    private readonly apiKey;
    private readonly storeId;
    private readonly baseUrl;
    private readonly timeout;
    private sessionToken;
    constructor(config: AICommerceConfig);
    /**
     * Detect the base URL based on environment
     */
    private detectBaseUrl;
    /**
     * Normalize URL (remove trailing slash)
     */
    private normalizeUrl;
    /**
     * Make an API request
     */
    private request;
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
    chat(message: string | ChatRequest, context?: ChatContext): Promise<ChatResponse>;
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
    chatWithAudio(audioBlob: Blob, context?: ChatContext): Promise<ChatResponse>;
    /**
     * Create a new chat session
     *
     * @returns Session information with token
     */
    createSession(): Promise<Session>;
    /**
     * Clear the current session
     */
    clearSession(): void;
    /**
     * Get the current session token
     */
    getSessionToken(): string | null;
    /**
     * Set a session token (for restoring sessions)
     */
    setSessionToken(token: string): void;
    /**
     * Products API namespace
     */
    readonly products: {
        /**
         * Create a new product
         */
        create: (product: CreateProductInput) => Promise<ProductResponse>;
        /**
         * Batch upsert products (create or update)
         */
        batchUpsert: (products: CreateProductInput[]) => Promise<BatchUpsertResponse>;
        /**
         * List products with pagination
         */
        list: (options?: ListProductsOptions) => Promise<ListProductsResponse>;
        /**
         * Get a single product by ID
         */
        get: (productId: string) => Promise<ProductResponse>;
        /**
         * Update a product
         */
        update: (productId: string, data: UpdateProductInput) => Promise<ProductResponse>;
        /**
         * Delete a product
         */
        delete: (productId: string) => Promise<{
            success: boolean;
            deleted: boolean;
        }>;
    };
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
    upload(file: File | Blob, options?: UploadOptions): Promise<UploadResponse>;
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
    static quickChat(options: {
        apiKey: string;
        message: string;
        baseUrl?: string;
        context?: ChatContext;
    }): Promise<ChatResponse>;
}
interface CreateProductInput {
    name: string;
    slug: string;
    description?: string;
    sku?: string;
    barcode?: string;
    price: number;
    compareAtPrice?: number;
    currency?: string;
    quantity?: number;
    trackInventory?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    tags?: string;
    externalId?: string;
    categoryId?: string;
    images?: Array<{
        url: string;
        alt?: string;
        isPrimary?: boolean;
    }>;
}
interface UpdateProductInput {
    name?: string;
    slug?: string;
    description?: string | null;
    sku?: string | null;
    barcode?: string | null;
    price?: number;
    compareAtPrice?: number | null;
    currency?: string;
    quantity?: number;
    trackInventory?: boolean;
    isActive?: boolean;
    isFeatured?: boolean;
    tags?: string | null;
    categoryId?: string | null;
}
interface ProductResponse {
    success: boolean;
    product: Product;
}
interface BatchUpsertResponse {
    success: boolean;
    processed: number;
    errors: number;
    results: Array<{
        id: string;
        slug: string;
        status: 'created' | 'updated';
    }>;
    errorDetails?: Array<{
        slug: string;
        error: string;
    }>;
}
interface ListProductsOptions {
    page?: number;
    perPage?: number;
    search?: string;
    categoryId?: string;
    isActive?: boolean;
}
interface ListProductsResponse {
    success: boolean;
    data: Product[];
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
}
interface UploadOptions {
    folder?: string;
    productId?: string;
    isPrimary?: boolean;
}
interface UploadResponse {
    success: boolean;
    url: string;
    key: string;
    size: number;
    contentType: string;
    productImage?: {
        id: string;
        url: string;
        alt: string | null;
        isPrimary: boolean;
    };
}
/**
 * Custom error class for AI Commerce SDK
 */
declare class AICommerceError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(message: string, code: string, status: number);
}

/**
 * AI Commerce Chat Widget
 *
 * Embeddable chat widget for e-commerce stores
 * Uses store's primaryColor for theming
 */

/**
 * Create and initialize the AI Commerce chat widget
 */
declare function createWidget(config: WidgetConfig): WidgetInstance;
/**
 * Global widget initialization for script tag usage
 */
declare const AICommerceWidget: {
    init: typeof createWidget;
    VERSION: string;
};

/**
 * AI Commerce SDK
 *
 * AI-powered product recommendations for e-commerce
 *
 * @packageDocumentation
 * @module @yassirbenmoussa/aicommerce-sdk
 *
 * @example
 * ```typescript
 * // npm usage - Client API
 * import { AICommerce } from '@yassirbenmoussa/aicommerce-sdk';
 *
 * const client = new AICommerce({ apiKey: 'your-api-key' });
 * const response = await client.chat('I need a laptop');
 * console.log(response.products);
 * ```
 *
 * @example
 * ```html
 * <!-- Widget usage -->
 * <script src="https://cdn.aicommerce.dev/widget.min.js"></script>
 * <script>
 *   AICommerceWidget.init({
 *     apiKey: 'your-api-key',
 *     position: 'bottom-right',
 *     theme: 'auto'
 *   });
 * </script>
 * ```
 */

declare const VERSION = "1.0.0";

export { AICommerce, type AICommerceConfig, AICommerceError, AICommerceWidget, type APIError, type ChatContext, type ChatRequest, type ChatResponse, type EventCallback, type EventType, type Product, type Session, type StoreConfig, VERSION, type WidgetConfig, type WidgetInstance, createWidget };
