# Furniture Price Finder

This is a small static website that uses the free [SerpApi Google Lens API](https://serpapi.com/google-lens-api) to reverse image search furniture and display shopping results sorted by price.

## Usage
1. Host this repository on GitHub Pages.
2. Open the site and either upload an image of the furniture or paste a public image URL.
3. Click **Search** to see shopping results (if available) sorted by lowest price.
   The required SerpApi key is already built into the app.

The site fetches the API through the free [Codetabs](https://api.codetabs.com) CORS proxy so it works purely as a client-side page.

The interface uses a dark theme and displays any returned shopping links with their prices sorted from lowest to highest.
