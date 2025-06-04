const API_KEY = '7559dc323e6691904899ae9264d34e381ba8c7aa518bf804ba9d1df6b2d19352';

async function getImageData(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function search() {
    const imageUrl = document.getElementById('image-url').value.trim();
    const fileInput = document.getElementById('image-file').files[0];
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    let url = imageUrl;
    if (!url && fileInput) {
        url = await getImageData(fileInput);
    }
    if (!url) {
        resultsDiv.textContent = 'Please provide an image URL or upload a file.';
        return;
    }

    const serpUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(url)}&api_key=${API_KEY}`;

    try {
        const resp = await fetch(fetchUrl);
        const data = await resp.json();
        const items = (data.shopping_results || []).map(r => ({
            title: r.title || 'No title',
            link: r.link || r.source, // fall back to source link
            price: parseFloat((r.price || '').replace(/[^0-9\.]/g, '')) || 0,
            source: r.source || ''
        })).filter(i => i.link);
        items.sort((a, b) => a.price - b.price);
        if (!items.length) {
            resultsDiv.textContent = 'No results found.';
            return;
        }
        items.forEach(i => {
            const div = document.createElement('div');
            div.className = 'result';
            div.innerHTML = `<a href="${i.link}" target="_blank">${i.title}</a> - <span class="price">$${i.price.toFixed(2)}</span> (${i.source})`;
            resultsDiv.appendChild(div);
        });
    } catch (e) {
        console.error(e);
        resultsDiv.textContent = 'Error fetching results.';
    }
}

document.getElementById('search-btn').addEventListener('click', search);

