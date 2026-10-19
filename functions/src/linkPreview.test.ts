import {describe, expect, it} from "vitest";
import {
  LinkPreviewError,
  parseLinkPreview,
  validateAndResolveUrl,
} from "./linkPreview.js";

describe("link preview URL validation", () => {
  it("accepts HTTP(S) hosts that resolve only to public addresses", async () => {
    const result = await validateAndResolveUrl(
      "https://shop.example/item?id=7",
      async () => [{address: "93.184.216.34", family: 4}],
    );

    expect(result.url.href).toBe("https://shop.example/item?id=7");
    expect(result.addresses[0].address).toBe("93.184.216.34");
  });

  it("blocks loopback literals and hostnames resolving to private addresses", async () => {
    await expect(validateAndResolveUrl("http://127.0.0.1/"))
      .rejects.toMatchObject({code: "blocked"});
    await expect(validateAndResolveUrl("http://[::1]/"))
      .rejects.toMatchObject({code: "blocked"});
    await expect(validateAndResolveUrl("http://169.254.169.254/"))
      .rejects.toMatchObject({code: "blocked"});
    await expect(validateAndResolveUrl(
      "https://shop.example/",
      async () => [{address: "10.0.0.8", family: 4}],
    )).rejects.toMatchObject({code: "blocked"});
  });

  it("rejects non-HTTP protocols", async () => {
    await expect(validateAndResolveUrl("file:///etc/passwd"))
      .rejects.toBeInstanceOf(LinkPreviewError);
  });
});

describe("link preview parsing", () => {
  it("reads metadata and JSON-LD product details from sample HTML", () => {
    const html = `
      <html>
        <head>
          <title>Fallback title</title>
          <meta property="og:title" content="Organic Honey">
          <meta property="og:description" content="Pure honey from the hills">
          <meta property="og:image" content="/images/honey.jpg">
          <meta property="og:site_name" content="Example Shop">
          <script type="application/ld+json">
            {"@type":"Product","name":"Honey","offers":{"price":"12.50","priceCurrency":"USD"}}
          </script>
        </head>
      </html>`;

    expect(parseLinkPreview(html, "https://shop.example/products/honey")).toEqual({
      title: "Organic Honey",
      description: "Pure honey from the hills",
      imageUrl: "https://shop.example/images/honey.jpg",
      price: 12.5,
      currency: "USD",
      finalUrl: "https://shop.example/products/honey",
      siteName: "Example Shop",
    });
  });

  it("reports when no product preview metadata is available", () => {
    expect(() => parseLinkPreview("<html><body>No metadata</body></html>", "https://shop.example/"))
      .toThrowError("No product preview information was found on that page.");
  });

  it("reads price metadata when structured product data is absent", () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Product">
          <meta property="og:image" content="/product.jpg">
          <meta property="product:price:amount" content="1,299">
          <meta property="product:price:currency" content="BDT">
        </head>
      </html>`;

    expect(parseLinkPreview(html, "https://shop.example/product").price).toBe(1299);
    expect(parseLinkPreview(html, "https://shop.example/product").currency).toBe("BDT");
  });
});
