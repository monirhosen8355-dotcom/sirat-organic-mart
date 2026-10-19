import type {LookupAddress} from "node:dns";
import {lookup} from "node:dns/promises";
import {isIP} from "node:net";
import http from "node:http";
import https from "node:https";
import type {IncomingMessage, RequestOptions} from "node:http";
import {load} from "cheerio";

const MAX_HTML_BYTES = 1_500_000;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_REDIRECTS = 5;

export interface LinkPreview {
  title: string;
  description: string;
  imageUrl: string;
  price?: number;
  currency?: string;
  finalUrl: string;
  siteName: string;
}

export type PreviewErrorCode =
  | "invalid-url"
  | "blocked"
  | "timeout"
  | "fetch-failed"
  | "no-data";

export class LinkPreviewError extends Error {
  constructor(
    public readonly code: PreviewErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "LinkPreviewError";
  }
}

type Resolver = (
  hostname: string,
  options: {all: true; verbatim: true},
) => Promise<LookupAddress[]>;

function isBlockedIPv4(address: string): boolean {
  const parts = address.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [first, second] = parts;
  return first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && (second === 0 || second === 168)) ||
    (first === 198 && (second === 18 || second === 19 || second === 51)) ||
    (first === 203 && second === 0) ||
    first >= 224;
}

function isBlockedIPv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized.startsWith("::ffff:")) {
    const mappedIPv4 = normalized.slice("::ffff:".length);
    if (isIP(mappedIPv4) === 4) return isBlockedIPv4(mappedIPv4);
    return true;
  }

  const groups = normalized.split(":");
  const firstGroup = parseInt(groups[0] || "0", 16);
  const secondGroup = parseInt(groups[1] || "0", 16);
  return normalized === "::" ||
    normalized === "::1" ||
    (firstGroup & 0xfe00) === 0xfc00 ||
    (firstGroup & 0xffc0) === 0xfe80 ||
    (firstGroup & 0xff00) === 0xff00 ||
    (firstGroup & 0xe000) !== 0x2000 ||
    (firstGroup === 0x2001 && (secondGroup <= 0x01ff || secondGroup === 0x0db8)) ||
    firstGroup === 0x2002;
}

function isBlockedAddress(address: string): boolean {
  const normalized = address.replace(/^\[|\]$/g, "");
  const version = isIP(normalized);
  return version === 4 ?
    isBlockedIPv4(normalized) :
    version === 6 ?
      isBlockedIPv6(normalized) :
      true;
}

function isBlockedHostname(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/\.$/, "");
  return normalized === "localhost" ||
    normalized === "metadata" ||
    normalized.endsWith(".localhost") ||
    normalized.endsWith(".local") ||
    normalized.endsWith(".internal") ||
    normalized.endsWith(".test");
}

export async function validateAndResolveUrl(
  input: string,
  resolver: Resolver = lookup,
): Promise<{url: URL; addresses: LookupAddress[]}> {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new LinkPreviewError("invalid-url", "Enter a valid product URL.");
  }

  if (
    (url.protocol !== "http:" && url.protocol !== "https:") ||
    url.username ||
    url.password
  ) {
    throw new LinkPreviewError("invalid-url", "Only HTTP and HTTPS product URLs are supported.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isBlockedHostname(hostname)) {
    throw new LinkPreviewError("blocked", "This URL points to a blocked host.");
  }

  if (isIP(hostname)) {
    if (isBlockedAddress(hostname)) {
      throw new LinkPreviewError("blocked", "This URL points to a private or reserved IP address.");
    }
    return {url, addresses: [{address: hostname, family: isIP(hostname)}]};
  }

  let addresses: LookupAddress[];
  try {
    addresses = await resolver(hostname, {all: true, verbatim: true});
  } catch {
    throw new LinkPreviewError("fetch-failed", "The product site hostname could not be resolved.");
  }

  if (addresses.length === 0 || addresses.some(({address}) => isBlockedAddress(address))) {
    throw new LinkPreviewError("blocked", "This URL resolves to a private or reserved IP address.");
  }

  return {url, addresses};
}

function withTimeout<T>(promise: Promise<T>, remainingMs: number): Promise<T> {
  if (remainingMs <= 0) {
    return Promise.reject(new LinkPreviewError("timeout", "Fetching the product page timed out."));
  }

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(
      () => reject(new LinkPreviewError("timeout", "Fetching the product page timed out.")),
      remainingMs,
    );
    promise.then(resolve, reject).finally(() => clearTimeout(timeout));
  });
}

function readHtmlResponse(response: IncomingMessage): Promise<Buffer> {
  const contentLength = Number(response.headers["content-length"]);
  if (Number.isFinite(contentLength) && contentLength > MAX_HTML_BYTES) {
    response.destroy();
    return Promise.reject(new LinkPreviewError("fetch-failed", "The product page is too large to preview."));
  }

  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;

    response.on("data", (chunk: Buffer | string) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.length;
      if (size > MAX_HTML_BYTES) {
        response.destroy();
        reject(new LinkPreviewError("fetch-failed", "The product page is too large to preview."));
        return;
      }
      chunks.push(buffer);
    });
    response.on("end", () => resolve(Buffer.concat(chunks)));
    response.on("error", reject);
  });
}

function requestHtml(
  url: URL,
  addresses: LookupAddress[],
  timeoutMs: number,
): Promise<{statusCode: number; headers: IncomingMessage["headers"]; body: Buffer}> {
  const client = url.protocol === "https:" ? https : http;
  const options: RequestOptions = {
    protocol: url.protocol,
    hostname: url.hostname.replace(/^\[|\]$/g, ""),
    port: url.port || undefined,
    path: `${url.pathname}${url.search}`,
    method: "GET",
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; ShoplexLinkPreview/1.0)",
      "Accept": "text/html",
      "Accept-Language": "en-US,en;q=0.9",
    },
    signal: AbortSignal.timeout(timeoutMs),
    lookup: (_hostname, lookupOptions, callback) => {
      if (lookupOptions.all) {
        callback(null, addresses);
      } else {
        callback(null, addresses[0].address, addresses[0].family);
      }
    },
  };

  return new Promise((resolve, reject) => {
    const request = client.request(options, async (response) => {
      try {
        const body = await readHtmlResponse(response);
        resolve({
          statusCode: response.statusCode ?? 0,
          headers: response.headers,
          body,
        });
      } catch (error) {
        reject(error);
      }
    });
    request.setTimeout(timeoutMs, () => {
      request.destroy(new LinkPreviewError("timeout", "Fetching the product page timed out."));
    });
    request.on("error", reject);
    request.end();
  });
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function productJsonLd($: ReturnType<typeof load>): Record<string, unknown>[] {
  const products: Record<string, unknown>[] = [];

  const collect = (value: unknown) => {
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (!value || typeof value !== "object") return;

    const record = value as Record<string, unknown>;
    const type = record["@type"];
    const isProductType = (entry: unknown) =>
      typeof entry === "string" && (entry === "Product" || /[/#]Product$/.test(entry));
    if (isProductType(type) || (Array.isArray(type) && type.some(isProductType))) {
      products.push(record);
    }
    collect(record["@graph"]);
  };

  $("script[type=\"application/ld+json\"]").each((_, element) => {
    try {
      collect(JSON.parse($(element).contents().text()));
    } catch {
      // Ignore malformed JSON-LD and continue to other preview metadata.
    }
  });
  return products;
}

export function parseLinkPreview(html: string, finalUrl: string): LinkPreview {
  const $ = load(html);
  const products = productJsonLd($);
  const firstProduct = products[0];
  const offersValue = firstProduct?.offers;
  const offer = Array.isArray(offersValue) ?
    offersValue[0] as Record<string, unknown> | undefined :
    offersValue as Record<string, unknown> | undefined;
  const rawImage = firstProduct?.image;
  const jsonLdImage = Array.isArray(rawImage) ?
    rawImage.map(stringValue).find(Boolean) :
    typeof rawImage === "object" && rawImage !== null ?
      stringValue((rawImage as Record<string, unknown>).url) :
      stringValue(rawImage);

  const title =
    stringValue($("meta[property=\"og:title\"]").attr("content")) ??
    stringValue($("meta[name=\"twitter:title\"]").attr("content")) ??
    stringValue($("title").first().text()) ??
    products.map((product) => stringValue(product.name)).find(Boolean) ??
    "";
  const description =
    stringValue($("meta[property=\"og:description\"]").attr("content")) ??
    stringValue($("meta[name=\"description\"]").attr("content")) ??
    products.map((product) => stringValue(product.description)).find(Boolean) ??
    "";
  const image =
    stringValue($("meta[property=\"og:image\"]").attr("content")) ??
    stringValue($("meta[name=\"twitter:image\"]").attr("content")) ??
    jsonLdImage ??
    "";

  if (!title && !description && !image) {
    throw new LinkPreviewError("no-data", "No product preview information was found on that page.");
  }

  let absoluteImageUrl = "";
  if (image) {
    try {
      absoluteImageUrl = new URL(image, finalUrl).toString();
      if (!["http:", "https:"].includes(new URL(absoluteImageUrl).protocol)) {
        absoluteImageUrl = "";
      }
    } catch {
      absoluteImageUrl = "";
    }
  }

  const priceSpecification = offer?.["priceSpecification"] as Record<string, unknown> | undefined;
  const metadataPrice =
    $("meta[property=\"product:price:amount\"]").attr("content") ??
    $("meta[property=\"og:price:amount\"]").attr("content");
  const rawPrice = offer?.price ?? offer?.lowPrice ?? priceSpecification?.price ?? metadataPrice;
  const numericPrice = typeof rawPrice === "number" ?
    rawPrice :
    typeof rawPrice === "string" ?
      Number(rawPrice.replace(/,/g, "")) :
      NaN;
  const currency = stringValue(offer?.priceCurrency) ??
    stringValue($("meta[property=\"product:price:currency\"]").attr("content")) ??
    stringValue($("meta[property=\"og:price:currency\"]").attr("content"));
  let parsedFinalUrl: URL;
  try {
    parsedFinalUrl = new URL(finalUrl);
  } catch {
    throw new LinkPreviewError("invalid-url", "The final product URL is invalid.");
  }

  return {
    title,
    description,
    imageUrl: absoluteImageUrl,
    ...(Number.isFinite(numericPrice) && numericPrice >= 0 ? {price: numericPrice} : {}),
    ...(currency ? {currency} : {}),
    finalUrl: parsedFinalUrl.toString(),
    siteName: stringValue($("meta[property=\"og:site_name\"]").attr("content")) ?? parsedFinalUrl.hostname,
  };
}

export async function fetchLinkPreview(input: string): Promise<LinkPreview> {
  const deadline = Date.now() + REQUEST_TIMEOUT_MS;
  let currentUrl = input;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const remainingMs = deadline - Date.now();
    const {url, addresses} = await withTimeout(
      validateAndResolveUrl(currentUrl),
      remainingMs,
    );
    let response: Awaited<ReturnType<typeof requestHtml>>;
    try {
      response = await withTimeout(
        requestHtml(url, addresses, Math.max(1, deadline - Date.now())),
        deadline - Date.now(),
      );
    } catch (error) {
      if (error instanceof LinkPreviewError) throw error;
      if (
        error instanceof Error &&
        (error.name === "AbortError" || error.name === "TimeoutError")
      ) {
        throw new LinkPreviewError("timeout", "Fetching the product page timed out.");
      }
      throw new LinkPreviewError("fetch-failed", "The product site could not be reached.");
    }

    if (response.statusCode >= 300 && response.statusCode < 400) {
      const location = response.headers.location;
      if (!location) {
        throw new LinkPreviewError("fetch-failed", "The product site returned an invalid redirect.");
      }
      if (redirects === MAX_REDIRECTS) {
        throw new LinkPreviewError("fetch-failed", "The product page redirected too many times.");
      }
      try {
        currentUrl = new URL(location, url).toString();
      } catch {
        throw new LinkPreviewError("fetch-failed", "The product site returned an invalid redirect.");
      }
      continue;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new LinkPreviewError("fetch-failed", "The product site could not provide a preview.");
    }
    const contentType = response.headers["content-type"]?.toLowerCase() ?? "";
    if (contentType.split(";")[0].trim() !== "text/html") {
      throw new LinkPreviewError("fetch-failed", "The product URL did not return an HTML page.");
    }

    return parseLinkPreview(response.body.toString("utf8"), url.toString());
  }

  throw new LinkPreviewError("fetch-failed", "The product page redirected too many times.");
}
