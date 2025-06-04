# FurniScout

FurniScout is a static website that uses the free [SerpApi Google Lens API](https://serpapi.com/google-lens-api) to reverse image search furniture and display pricing links.  It has a modern dark look and requires no configuration: simply upload or link to a picture of the furniture.

Results show a preview image, the store name and product title, and the price in ascending order. Listings without a price are also displayed when available.
## Usage
1. Host this repository on GitHub Pages.
2. Open the site and either upload an image of the furniture or paste a public image URL.
3. Click **Search** and FurniScout will query Google Lens through SerpApi.
4. Links are displayed (when available) with the detected price, sorted from lowest to highest.  The SerpApi key is embedded in the code so no extra input is required.
   Large uploads may fail with the proxy, so providing a URL to the image tends to be more reliable.

The site fetches the API through the free [corsproxy.io](https://corsproxy.io/) service so it works purely as a client-side page. Keep in mind that extremely large file uploads might still fail, so providing a direct URL to the image is usually the most reliable method.


The interface sports a sleek dark theme. Shopping links are displayed as cards, listing the title, price and source.
When SerpApi doesn't provide direct shopping results, FurniScout falls back to the visual match data.
