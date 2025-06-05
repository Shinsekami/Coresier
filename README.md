# FurniScout

FurniScout is a static website that detects furniture inside an image, reverse searches each item through the [SerpApi Google Lens API](https://serpapi.com/google-lens-api) and lists prices. Object detection is performed with the Google Cloud Vision API. You can then download all results as an Excel spreadsheet.

Results show a preview image, the store name and product title, and the price in ascending order. When no price is available the card shows “N/A.”
## Usage
1. Host this repository on GitHub Pages.
2. Open the site and either upload an image of the furniture or paste a public image URL.
3. Click **Search** and FurniScout will detect furniture using Google Cloud Vision and search each piece with Google Lens.
4. Links are displayed (when available) with the detected price, sorted from lowest to highest.  The SerpApi key is embedded in the code. The Vision API key is included for convenience but can be replaced or removed in `script.js`.
5. Press **Export Excel** to download a spreadsheet of all results.
   Large uploads may exceed SerpApi's limits, so providing a URL to the image tends to be more reliable.

SerpApi requests are routed through the free [r.jina.ai](https://r.jina.ai) proxy so the page works purely client-side. Calls to Google Vision are sent directly because that API already supports CORS. Uploaded files are encoded directly in the request using SerpApi's `encoded_image` parameter so no external hosting is required. If something goes wrong, detailed error messages appear on the page and in the browser console. The search helpers are exposed on `window` so you can invoke `search()`, `uploadImage()` or `updateActive()` manually when debugging.


The interface sports a sleek purple theme with glowing gradients and animated cards. Search results are sorted by price in Euros and will display “N/A” if pricing information isn’t available. The URL and file inputs highlight whichever was used most recently so it’s clear what will be searched.
