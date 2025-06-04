
# FurniScout

FurniScout is a static website that uses the free [SerpApi Google Lens API](https://serpapi.com/google-lens-api) to reverse image search furniture and display shopping results sorted by price. It has a modern dark look and requires no configuration: simply upload or link to a picture of the furniture.


## Usage
1. Host this repository on GitHub Pages.
2. Open the site and either upload an image of the furniture or paste a public image URL.
3. Click **Search** and FurniScout will query Google Lens through SerpApi.
4. Shopping links (when available) appear below, sorted from lowest to highest price.
   The SerpApi key is embedded in the code so no extra input is required.

The site fetches the API through the free [Codetabs](https://api.codetabs.com) CORS proxy so it works purely as a client-side page.

The interface sports a sleek dark theme. Shopping links are displayed as cards, listing the title, price and source.
