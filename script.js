async function search() {
    const imageUrl = document.getElementById('image-url').value.trim();
    const apiKey = document.getElementById('serpapi-key').value.trim();
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';
    if (!imageUrl || !apiKey) {
        resultsDiv.textContent = 'Please provide both image URL and API key.';
        return;
    }

    const serpUrl = `https://serpapi.com/search.json?engine=google_lens&url=${encodeURIComponent(imageUrl)}&api_key=${apiKey}`;
    const fetchUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(serpUrl)}`;

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
        resultsDiv.textContent = 'Error fetching results. Ensure the API key is valid.';
    }
}

document.getElementById('search-btn').addEventListener('click', search);

