const API_KEY = '7559dc323e6691904899ae9264d34e381ba8c7aa518bf804ba9d1df6b2d19352';
const EXCHANGE_RATES = {
    EUR: 1,
    USD: 0.92,
    GBP: 1.17,
    CAD: 0.68,
    AUD: 0.61,
    JPY: 0.0058
};
let activeInput = 'url';

async function getImageData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function fetchJson(url, options = {}) {
    const proxy = `https://thingproxy.freeboard.io/fetch/${url}`;
    const resp = await fetch(proxy, options);
    if (!resp.ok) {
        throw new Error(`Request failed: ${resp.status}`);
    }
    return resp.json();
}
async function search() {
    const imageUrl = document.getElementById('image-url').value.trim();
    const fileInput = document.getElementById('image-file').files[0];
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    let url = imageUrl;
    let encodedImage = null;
    if (activeInput === 'file' && fileInput) {
        const data = await getImageData(fileInput);
        encodedImage = data.replace(/^data:image\/(png|jpe?g);base64,/, '');
    }
    if (activeInput === 'url' && !url && fileInput) {
        const data = await getImageData(fileInput);
        encodedImage = data.replace(/^data:image\/(png|jpe?g);base64,/, '');
        activeInput = 'file';
    }
    if (!url && !encodedImage) {
        resultsDiv.textContent = 'Please provide an image URL or upload a file.';
        return;
    }
    let serpUrl = 'https://serpapi.com/search.json';
    let options = {};
    if (encodedImage) {
        options.method = 'POST';
        options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        options.body = `engine=google_lens&api_key=${API_KEY}&encoded_image=${encodeURIComponent(encodedImage)}`;
    } else {
        serpUrl += `?engine=google_lens&url=${encodeURIComponent(url)}&api_key=${API_KEY}`;
    }
    try {
        const data = await fetchJson(serpUrl, options);

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
            let priceNum = null;
            let currency = 'EUR';
            if (r.price) {
                if (typeof r.price === 'string') {
                    const n = parseFloat(r.price.replace(/[^0-9.,]/g, '').replace(/,/g, ''));
                    if (!isNaN(n)) priceNum = n;
                    if (/\$/.test(r.price)) currency = 'USD';
                    if (/£/.test(r.price)) currency = 'GBP';
                    if (/€/.test(r.price)) currency = 'EUR';
                } else {
                    if (typeof r.price.extracted_value === 'number') {
                        priceNum = r.price.extracted_value;
                    }
                    if (r.price.currency) {
                        currency = r.price.currency.toUpperCase();
                    }
                }
            }
            let source = r.source || '';
            if (!source && r.link) {
                try {
                    const host = new URL(r.link).hostname.replace(/^www\./, '');
                    source = host.split('.')[0];
                    source = source.charAt(0).toUpperCase() + source.slice(1);
                } catch {}
            }
            let priceEUR = null;
            if (priceNum != null && EXCHANGE_RATES[currency]) {
                priceEUR = priceNum * EXCHANGE_RATES[currency];
            }
            return {
                title: r.title || 'No title',
                link: r.link || '',
                price: priceEUR,
                priceText: priceEUR != null ? `€${priceEUR.toFixed(2)}` : 'N/A',
                source,
                thumbnail: r.thumbnail || r.image || ''
            };
        }).filter(i => i.link);
        items.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
        if (!items.length) {
            resultsDiv.textContent = 'No results found.';
            return;
        }
        items.forEach((i, idx) => {
            const div = document.createElement('div');
            div.className = 'result';
            div.innerHTML = `
                <img src="${i.thumbnail}" alt="">
                <div class="info">
                    <a href="${i.link}" target="_blank">${i.source}: ${i.title}</a>
                    <div class="price">${i.priceText}</div>
                </div>`;
            resultsDiv.appendChild(div);
            requestAnimationFrame(() => {
                setTimeout(() => div.classList.add('show'), idx * 50);
            });
        });
    } catch (e) {
        console.error(e);
        resultsDiv.textContent = 'Error fetching results.';
    }
}

const urlInputEl = document.getElementById('image-url');
const fileInputEl = document.getElementById('image-file');

function updateActive(type) {
    activeInput = type;
    urlInputEl.classList.toggle('active', type === 'url');
    fileInputEl.classList.toggle('active', type === 'file');
}

urlInputEl.addEventListener('input', () => updateActive('url'));
fileInputEl.addEventListener('change', () => updateActive('file'));
document.getElementById('search-btn').addEventListener('click', search);

updateActive('url');

