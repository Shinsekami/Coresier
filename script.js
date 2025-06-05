const API_KEY = '7559dc323e6691904899ae9264d34e381ba8c7aa518bf804ba9d1df6b2d19352';
// Google Cloud Vision key used for object detection
const VISION_KEY = "AIzaSyDFPzGNHo_YYKZBWzDzKuxroncrgV6tGrw";
const EXCHANGE_RATES = {
    EUR: 1,
    USD: 0.92,
    GBP: 1.17,
    CAD: 0.68,
    AUD: 0.61,
    JPY: 0.0058
};
let activeInput = 'url'; // tracks which input was used last

function displayError(el, err) {
    console.error(err);
    if (el) el.textContent = `Error: ${err.message}`;
}

async function fetchJson(url, options = {}, direct = false) {
    const target = direct ? url : `https://r.jina.ai/${url}`;
    let resp;
    try {
        resp = await fetch(target, options);
    } catch (err) {
        throw new Error(`Fetch failed: ${err.message}`);
    }
    const text = await resp.text();
    if (!resp.ok) {
        throw new Error(`Request failed ${resp.status}: ${text.slice(0, 200)}`);
    }
    let jsonText = text.trim();
    const idx = jsonText.indexOf('{');
    if (idx > 0) {
        jsonText = jsonText.slice(idx);
    }
    try {
        return JSON.parse(jsonText);
    } catch (e) {
        throw new Error(`Invalid JSON: ${e.message}. Response: ${jsonText.slice(0, 200)}`);
    }
}

async function getImageData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Backwards compatible helper used in earlier revisions
async function uploadImage(file) {
    const data = await getImageData(file);
    return data.replace(/^data:image\/(png|jpe?g);base64,/, '');
}

async function lensSearch(base64, url) {
    let serpUrl = 'https://serpapi.com/search.json';
    const options = {};
    if (base64) {
        options.method = 'POST';
        options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        options.body = `engine=google_lens&api_key=${API_KEY}&encoded_image=${encodeURIComponent(base64)}`;
    } else if (url) {
        serpUrl += `?engine=google_lens&url=${encodeURIComponent(url)}&api_key=${API_KEY}`;
    }
    const data = await fetchJson(serpUrl, options);
    let items = parseLensResults(data);
    if (parseLensResults.needsFetch) {
        const extra = await fetchJson(parseLensResults.needsFetch);
        items = parseLensResults(extra);
        parseLensResults.needsFetch = null;
    }
    return items;
}

function parseLensResults(data) {
    let items = [];
    if (Array.isArray(data.shopping_results)) {
        items = data.shopping_results;
    } else if (data.serpapi_products_link) {
        const productUrl = `${data.serpapi_products_link}&api_key=${API_KEY}`;
        items = []; // will fetch below
        parseLensResults.needsFetch = productUrl;
    }
    if (!items.length && Array.isArray(data.visual_matches)) {
        items = data.visual_matches;
    }
    return items;
}

function normalizeItems(items, objectName) {
    return items.map(r => {
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
                    let cur = r.price.currency.trim();
                    if (cur === '$' || cur === 'US$') cur = 'USD';
                    else if (cur === '£') cur = 'GBP';
                    else if (cur === '€') cur = 'EUR';
                    else if (cur.toUpperCase() === 'C$' || cur.toUpperCase() === 'CAD$') cur = 'CAD';
                    else if (cur.toUpperCase() === 'A$' || cur.toUpperCase() === 'AUD$') cur = 'AUD';
                    else if (cur === '¥') cur = 'JPY';
                    currency = cur.toUpperCase();
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
            object: objectName,
            title: r.title || 'No title',
            link: r.link || '',
            price: priceEUR,
            priceText: priceEUR != null ? `€${priceEUR.toFixed(2)}` : 'N/A',
            source,
            thumbnail: r.thumbnail || r.image || ''
        };
    }).filter(i => i.link && i.price != null);
}

async function detectObjects(base64, url) {
    if (!VISION_KEY) {
        return [];
    }
    const request = {
        requests: [{
            image: base64 ? { content: base64 } : { source: { imageUri: url } },
            features: [{ type: 'OBJECT_LOCALIZATION', maxResults: 10 }]
        }]
    };
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_KEY}`;
    try {
        const res = await fetchJson(visionUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request)
        }, true);
        return (res.responses[0]?.localizedObjectAnnotations) || [];
    } catch (err) {
        console.warn('Vision detection failed', err);
        return [];
    }
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function cropRegion(img, vertices) {
    const xs = vertices.map(v => v.x);
    const ys = vertices.map(v => v.y);
    const x = Math.min(...xs) * img.width;
    const y = Math.min(...ys) * img.height;
    const w = (Math.max(...xs) - Math.min(...xs)) * img.width;
    const h = (Math.max(...ys) - Math.min(...ys)) * img.height;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg').replace(/^data:image\/jpeg;base64,/, '');
}

function renderResults(items, container) {
    container.innerHTML = '';
    items.forEach((i, idx) => {
        const div = document.createElement('div');
        div.className = 'result';
        div.innerHTML = `
            <img src="${i.thumbnail}" alt="">
            <div class="info">
                <div class="object-name">${i.object}</div>
                <a href="${i.link}" target="_blank">${i.source}: ${i.title}</a>
                <div class="price">${i.priceText}</div>
            </div>`;
        container.appendChild(div);
        requestAnimationFrame(() => {
            setTimeout(() => div.classList.add('show'), idx * 50);
        });
    });
}

let lastResults = [];
function exportResults() {
    if (!lastResults.length || typeof XLSX === 'undefined') return;
    const rows = [
        ['Object', 'Source', 'Title', 'Price (EUR)', 'Link']
    ];
    lastResults.forEach(r => {
        rows.push([r.object, r.source, r.title, r.priceText.replace('€',''), r.link]);
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'furniscout-results.xlsx');
}
async function search() {
    const imageUrl = document.getElementById('image-url').value.trim();
    const fileInput = document.getElementById('image-file').files[0];
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    let url = imageUrl;
    let encodedImage = null;
    if (activeInput === 'file' && fileInput) {
        encodedImage = await uploadImage(fileInput);
    }
    if (activeInput === 'url' && !url && fileInput) {
        encodedImage = await uploadImage(fileInput);
        activeInput = 'file';
    }
    if (!url && !encodedImage) {
        resultsDiv.textContent = 'Please provide an image URL or upload a file.';
        return;
    }

    let img;
    try {
        img = await loadImage(encodedImage ? `data:image/jpeg;base64,${encodedImage}` : url);
    } catch (e) {
        displayError(resultsDiv, e);
        return;
    }

    let objects = await detectObjects(encodedImage, url);
    let all = [];
    if (!objects.length) {
        const lensItems = await lensSearch(encodedImage, url);
        all = normalizeItems(lensItems, 'Image');
    } else {
        for (const obj of objects.slice(0,5)) {
            const crop = cropRegion(img, obj.boundingPoly.normalizedVertices);
            const lensItems = await lensSearch(crop, null);
            all = all.concat(normalizeItems(lensItems, obj.name));
        }
    }
    all.sort((a,b)=> (a.price ?? Infinity) - (b.price ?? Infinity));
    if (!all.length) {
        resultsDiv.textContent = 'No results found.';
        return;
    }
    lastResults = all;
    renderResults(all, resultsDiv);
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
const exportBtn = document.getElementById('export-btn');
if (exportBtn) exportBtn.addEventListener('click', exportResults);

updateActive('url');

// Expose for easier debugging in the console
window.search = search;
window.updateActive = updateActive;
window.uploadImage = uploadImage;
window.exportResults = exportResults;

