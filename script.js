const API_KEY = '7559dc323e6691904899ae9264d34e381ba8c7aa518bf804ba9d1df6b2d19352';

async function getImageData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function fetchJson(url) {
    const proxy = `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(url)}`;
    const resp = await fetch(proxy);
    return resp.json();
}
async function search() {
    const imageUrl = document.getElementById('image-url').value.trim();
    const fileInput = document.getElementById('image-file').files[0];
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    let url = imageUrl;
    let encodedImage = null;
    if (!url && fileInput) {
        const data = await getImageData(fileInput);
        encodedImage = data.replace(/^data:image\/(png|jpe?g);base64,/, '');
    }
    if (!url && !encodedImage) {
        resultsDiv.textContent = 'Please provide an image URL or upload a file.';
        return;
    }
    let serpUrl;
    if (encodedImage) {
        serpUrl = `https://serpapi.com/search.json?engine=google_lens&encoded_image=${encodeURIComponent(encodedImage)}&api_key=${API_KEY}`;
    } else {
        serpUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(url)}&api_key=${API_KEY}`;
    }
    try {
        const data = await fetchJson(serpUrl);

        let items = [];
        if (Array.isArray(data.shopping_results)) {
            items = data.shopping_results;
        } else if (data.serpapi_products_link) {
            const productUrl = `${data.serpapi_products_link}&api_key=${API_KEY}`;
            const productData = await fetchJson(productUrl);
            if (Array.isArray(productData.shopping_results)) {
                items = productData.shopping_results;
            }
        }
        if (!items.length && Array.isArray(data.visual_matches)) {
            items = data.visual_matches;
        }

        items = items.map(r => {
            let priceNum = Infinity;
            let priceText = 'N/A';
            if (r.price) {
                if (typeof r.price === 'string') {
                    priceText = r.price;
                    const n = parseFloat(r.price.replace(/[^0-9.]/g, ''));
                    if (!isNaN(n)) priceNum = n;
                } else {
                    if (typeof r.price.extracted_value === 'number') {
                        priceNum = r.price.extracted_value;
                    }
                    if (r.price.value) {
                        priceText = r.price.value;
                    } else if (r.price.currency) {
                        priceText = `${r.price.currency}${r.price.extracted_value}`;
                    }
                }
            }
            return {
                title: r.title || 'No title',
                link: r.link || r.source,
                price: priceNum,
                priceText,
                source: r.source || ''
            };
        }).filter(i => i.link);
        items.sort((a, b) => a.price - b.price);
        if (!items.length) {
            resultsDiv.textContent = 'No results found.';
            return;
        }
        items.forEach(i => {
            const div = document.createElement('div');
            div.className = 'result';
            div.innerHTML = `<a href="${i.link}" target="_blank">${i.title}</a> - <span class="price">${i.priceText}</span> (${i.source})`;
            resultsDiv.appendChild(div);
        });
    } catch (e) {
        console.error(e);
        resultsDiv.textContent = 'Error fetching results.';
    }
}

document.getElementById('search-btn').addEventListener('click', search);

