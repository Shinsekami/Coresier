# FurniScout

FurniScout is a static website that uses the free [SerpApi Google Lens API](https://serpapi.com/google-lens-api) to reverse image search furniture and display pricing links. It has a modern dark look and requires no configuration: simply upload or link to a picture of the furniture.

Results show a preview image, the store name and product title, and the price in ascending order. When no price is available the card shows “N/A.”
## Usage
1. Host this repository on GitHub Pages.
2. Open the site and either upload an image of the furniture or paste a public image URL.
3. Click **Search** and FurniScout will query Google Lens through SerpApi.
4. Links are displayed (when available) with the detected price, sorted from lowest to highest.  The SerpApi key is embedded in the code so no extra input is required.
   Large uploads may exceed SerpApi's limits, so providing a URL to the image tends to be more reliable.

The site fetches the API through the free [Codetabs proxy](https://api.codetabs.com/v1/proxy) so it works purely as a client-side page. Uploaded files are encoded directly in the request using SerpApi's `encoded_image` parameter so no external hosting is required. If something goes wrong, detailed error messages appear on the page and in the browser console. The search helpers are exposed on `window` so you can invoke `search()` or `updateActive()` manually when debugging.

The interface sports a sleek purple theme with glowing gradients and animated cards. Search results are sorted by price in Euros and will display “N/A” if pricing information isn’t available. The URL and file inputs highlight whichever was used most recently so it’s clear what will be searched.
