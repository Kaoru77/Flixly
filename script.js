// --- Konfigurasi TMDB API ---
const API_KEY  = '80d6001f02cf7b601c6a2d99cf51fcc9';
const BASE     = 'https://api.themoviedb.org/3';
const IMG_W300 = 'https://image.tmdb.org/t/p/w300';
const IMG_W185 = 'https://image.tmdb.org/t/p/w185';
const NO_POSTER = 'https://placehold.co/300x450/1a1a1a/888?text=No+Poster';
const NO_FACE   = 'https://placehold.co/185x185/1a1a1a/888?text=?';

// --- Platform streaming ---
const PLATFORMS = [
  { name: 'Netflix',     color: '#E50914', url: 'https://www.netflix.com/search?q=' },
  { name: 'Disney+',     color: '#1156BE', url: 'https://www.disneyplus.com/search/' },
  { name: 'Prime Video', color: '#00A8E0', url: 'https://www.amazon.com/s?k=' },
  { name: 'Vidio',       color: '#0066CC', url: 'https://www.vidio.com/search?q=' },
  { name: 'YouTube',     color: '#FF0000', url: 'https://www.youtube.com/results?search_query=' },
];

// --- Watchlist dari localStorage ---
let watchlist = JSON.parse(localStorage.getItem('Flixly_watchlist') || '[]');

// Simpan watchlist ke localStorage
function saveWatchlist() {
  localStorage.setItem('Flixly_watchlist', JSON.stringify(watchlist));
}

// Update badge jumlah di navbar
function updateBadge() {
  const badge = document.getElementById('navBadge');
  if (badge) badge.textContent = watchlist.length;
}

// ============================================================
//  TMDB — Fungsi fetch data
// ============================================================
async function tmdb(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'id-ID');
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  return res.json();
}

// ============================================================
//  MOVIE CARD — HTML kartu film
// ============================================================
function movieCardHTML(m) {
  const poster  = m.poster_path ? `${IMG_W300}${m.poster_path}` : NO_POSTER;
  const year    = (m.release_date || '').slice(0, 4) || '—';
  const rating  = m.vote_average ? m.vote_average.toFixed(1) : '—';
  const inList  = watchlist.some(w => w.id === m.id);
  const safe    = (m.title || '').replace(/'/g, "\\'");

  return `
    <a class="movie-card" href="detail.html?id=${m.id}" title="${m.title}">
      <div class="card-poster">
        <img src="${poster}" alt="${m.title}" loading="lazy" onerror="this.src='${NO_POSTER}'" />
        <div class="poster-rating">★ ${rating}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${m.title}</div>
        <div class="card-year">${year}</div>
        <button class="card-add-btn ${inList ? 'added' : ''}"
          onclick="event.preventDefault(); toggleWatch(this, ${m.id}, '${safe}', '${year}', '${poster}', '${rating}')">
          <i class="ti ${inList ? 'ti-check' : 'ti-plus'}"></i>
          ${inList ? 'Tersimpan' : 'Watchlist'}
        </button>
      </div>
    </a>`;
}

// ============================================================
//  WATCHLIST — Toggle tambah/hapus
// ============================================================
function toggleWatch(btn, id, title, year, poster, rating) {
  const idx = watchlist.findIndex(w => w.id === id);
  if (idx === -1) {
    watchlist.push({ id, title, year, poster, rating });
  } else {
    watchlist.splice(idx, 1);
  }
  saveWatchlist();
  updateBadge();

  const inList = watchlist.some(w => w.id === id);

  // Update semua tombol dengan id yang sama
  document.querySelectorAll('.card-add-btn').forEach(b => {
    const card = b.closest('.movie-card');
    if (card && card.href && card.href.includes(`id=${id}`)) {
      b.className = `card-add-btn ${inList ? 'added' : ''}`;
      b.innerHTML = `<i class="ti ${inList ? 'ti-check' : 'ti-plus'}"></i> ${inList ? 'Tersimpan' : 'Watchlist'}`;
    }
  });
}

// ============================================================
//  ROW — Isi baris horizontal dengan kartu film
// ============================================================
function fillRow(rowId, movies) {
  const el = document.getElementById(rowId);
  if (!el) return;
  el.innerHTML = movies.length
    ? movies.map(movieCardHTML).join('')
    : '<p style="color:var(--muted);padding:1rem;font-size:13px">Tidak ada film.</p>';
}

// Scroll baris ke kiri/kanan
function scrollRow(rowId, dir) {
  const el = document.getElementById(rowId);
  if (el) el.scrollBy({ left: dir * 560, behavior: 'smooth' });
}

// ============================================================
//  SEARCH — Cari film
// ============================================================
let searchTimer = null;

function handleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const q = document.getElementById('navSearch')?.value.trim();
    if (!q) { hideFilter(); return; }

    showFilter(`Hasil: "${q}"`);
    document.getElementById('filterGrid').innerHTML = skeletonCards(10);
    try {
      const data = await tmdb('/search/movie', { query: q });
      fillGrid(data.results || []);
    } catch {
      fillGrid([]);
    }
  }, 400);
}

// ============================================================
//  FILTER GENRE — Filter film berdasarkan genre
// ============================================================
async function applyFilter() {
  const genreId = document.getElementById('navGenre')?.value;
  if (!genreId) { hideFilter(); return; }

  const label = document.getElementById('navGenre')?.selectedOptions[0]?.text || 'Genre';
  showFilter(label);
  document.getElementById('filterGrid').innerHTML = skeletonCards(10);

  try {
    const data = await tmdb('/discover/movie', {
      with_genres: genreId,
      sort_by: 'popularity.desc',
    });
    fillGrid(data.results || []);
  } catch {
    fillGrid([]);
  }
}

function showFilter(title) {
  const sec = document.getElementById('filterSection');
  if (sec) {
    sec.style.display = 'block';
    document.getElementById('filterTitle').innerHTML = `<i class="ti ti-filter"></i> ${title}`;
    // Sembunyikan section utama
    const main = document.getElementById('mainSections');
    if (main) main.style.display = 'none';
  }
}

function hideFilter() {
  const sec = document.getElementById('filterSection');
  if (sec) sec.style.display = 'none';

  const main = document.getElementById('mainSections');
  if (main) main.style.display = 'block';

  const genre = document.getElementById('navGenre');
  if (genre) genre.value = '';
}

function clearFilter() {
  const search = document.getElementById('navSearch');
  if (search) search.value = '';
  hideFilter();
}

function fillGrid(movies) {
  const el = document.getElementById('filterGrid');
  if (!el) return;
  el.innerHTML = movies.length
    ? movies.map(movieCardHTML).join('')
    : '<p style="color:var(--muted);font-size:13px;grid-column:1/-1;padding:1rem">Film tidak ditemukan.</p>';
}

// ============================================================
//  SKELETON loading placeholder
// ============================================================
function skeletonCards(n) {
  const item = `
    <div class="movie-card" style="pointer-events:none">
      <div class="card-poster" style="aspect-ratio:2/3;
        background:linear-gradient(90deg,#1a1a1a 25%,#242424 50%,#1a1a1a 75%);
        background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
      <div class="card-body">
        <div style="height:11px;width:80%;border-radius:4px;margin-bottom:6px;
          background:linear-gradient(90deg,#1a1a1a 25%,#242424 50%,#1a1a1a 75%);
          background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
        <div style="height:10px;width:45%;border-radius:4px;
          background:linear-gradient(90deg,#1a1a1a 25%,#242424 50%,#1a1a1a 75%);
          background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
      </div>
    </div>`;
  return Array(n).fill(item).join('');
}

// ============================================================
//  INIT INDEX — Inisialisasi halaman index.html
// ============================================================
async function initIndex() {
  updateBadge();

  try {
    const [trending, popular, topRated] = await Promise.all([
      tmdb('/trending/movie/day'),
      tmdb('/movie/popular'),
      tmdb('/movie/top_rated'),
    ]);
    fillRow('trendingRow', trending.results  || []);
    fillRow('popularRow',  popular.results   || []);
    fillRow('topRatedRow', topRated.results  || []);
  } catch (err) {
    console.error('Gagal load data film:', err);
  }
}

// ============================================================
//  INIT DETAIL — Inisialisasi halaman detail.html
// ============================================================
async function initDetail() {
  updateBadge();

  const id = new URLSearchParams(location.search).get('id');
  if (!id) { window.location = 'index.html'; return; }

  try {
    const [detail, credits, similar] = await Promise.all([
      tmdb(`/movie/${id}`),
      tmdb(`/movie/${id}/credits`),
      tmdb(`/movie/${id}/similar`),
    ]);

    renderDetailBox(detail);
    renderSynopsis(detail);
    renderCast(credits.cast || []);
    renderRecommendations(similar.results || []);

    document.title = `${detail.title} — FLIXLY`;
  } catch (err) {
    console.error('Gagal load detail:', err);
    document.getElementById('detailBox').innerHTML =
      '<p style="color:var(--muted);padding:1.5rem;font-size:14px">Gagal memuat data film.</p>';
  }
}

// Render kotak info film di detail
function renderDetailBox(m) {
  const box    = document.getElementById('detailBox');
  if (!box) return;

  const poster  = m.poster_path ? `${IMG_W300}${m.poster_path}` : NO_POSTER;
  const year    = (m.release_date || '').slice(0, 4) || '—';
  const rating  = m.vote_average?.toFixed(1) || '—';
  const runtime = m.runtime ? `${Math.floor(m.runtime/60)}j ${m.runtime%60}m` : '';
  const genres  = (m.genres || []).map(g => `<span class="genre-badge">${g.name}</span>`).join('');
  const inList  = watchlist.some(w => w.id === m.id);
  const safe    = m.title.replace(/'/g, "\\'");

  box.innerHTML = `
    <div class="detail-poster-wrap">
      <img src="${poster}" alt="${m.title}" onerror="this.src='${NO_POSTER}'" />
    </div>
    <div class="detail-info">
      <div class="detail-genres">${genres}</div>
      <h1 class="detail-title">${m.title}</h1>
      <div class="detail-meta">
        <span class="rating">★ ${rating}</span>
        <span>${year}</span>
        ${runtime ? `<span>${runtime}</span>` : ''}
      </div>
      <div class="detail-actions">
        <button class="btn-primary ${inList ? 'saved' : ''}" id="detailAddBtn"
          onclick="toggleWatchDetail(${m.id}, '${safe}', '${year}', '${poster}', '${rating}')">
          <i class="ti ${inList ? 'ti-check' : 'ti-bookmark'}"></i>
          ${inList ? 'Tersimpan' : 'Simpan ke Watchlist'}
        </button>
        <a class="btn-outline" href="watchlist.html">
          <i class="ti ti-list"></i> Lihat Watchlist
        </a>
      </div>
    </div>`;
}

// Toggle watchlist dari halaman detail
function toggleWatchDetail(id, title, year, poster, rating) {
  const idx = watchlist.findIndex(w => w.id === id);
  if (idx === -1) watchlist.push({ id, title, year, poster, rating });
  else            watchlist.splice(idx, 1);
  saveWatchlist();
  updateBadge();

  const inList = watchlist.some(w => w.id === id);
  const btn = document.getElementById('detailAddBtn');
  if (btn) {
    btn.className = `btn-primary ${inList ? 'saved' : ''}`;
    btn.innerHTML = `<i class="ti ${inList ? 'ti-check' : 'ti-bookmark'}"></i> ${inList ? 'Tersimpan' : 'Simpan ke Watchlist'}`;
  }
}

// Render sinopsis
function renderSynopsis(m) {
  const sec = document.getElementById('synopsisSection');
  const el  = document.getElementById('synopsis');
  if (!sec || !el || !m.overview) return;
  el.textContent = m.overview;
  sec.style.display = 'block';
}

// Render pemeran
function renderCast(cast) {
  const sec = document.getElementById('castSection');
  const row = document.getElementById('castRow');
  if (!sec || !row || !cast.length) return;

  row.innerHTML = cast.slice(0, 20).map(c => {
    const photo = c.profile_path ? `${IMG_W185}${c.profile_path}` : NO_FACE;
    return `
      <div class="cast-card">
        <div class="cast-photo">
          <img src="${photo}" alt="${c.name}" loading="lazy" onerror="this.src='${NO_FACE}'" />
        </div>
        <div class="cast-name">${c.name}</div>
        <div class="cast-role">${c.character || '—'}</div>
      </div>`;
  }).join('');

  sec.style.display = 'block';
}

// Render film serupa
function renderRecommendations(movies) {
  const sec = document.getElementById('recSection');
  const row = document.getElementById('recRow');
  if (!sec || !row || !movies.length) return;
  row.innerHTML = movies.slice(0, 20).map(movieCardHTML).join('');
  sec.style.display = 'block';
}

// ============================================================
//  INIT WATCHLIST — Inisialisasi halaman watchlist.html
// ============================================================
function initWatchlist() {
  updateBadge();
  renderWatchlistPage();
}

function renderWatchlistPage() {
  const container = document.getElementById('watchlistContainer');
  const subtitle  = document.getElementById('wlSubtitle');
  if (!container) return;

  if (subtitle) {
    subtitle.textContent = watchlist.length
      ? `${watchlist.length} film tersimpan`
      : '';
  }

  if (!watchlist.length) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="ti ti-bookmark"></i>
        <p>Belum ada film di watchlist kamu.</p>
        <a href="index.html"><i class="ti ti-arrow-left"></i> Kembali ke Beranda</a>
      </div>`;
    return;
  }

  container.innerHTML = watchlist.map(m => `
    <div class="wl-item" id="wl_${m.id}">
      <div class="wl-poster" onclick="window.location='detail.html?id=${m.id}'">
        <img src="${m.poster}" alt="${m.title}" onerror="this.src='${NO_POSTER}'" />
      </div>
      <div class="wl-info" onclick="window.location='detail.html?id=${m.id}'">
        <div class="wl-title">${m.title}</div>
        <div class="wl-meta">${m.year} · <span>★ ${m.rating}</span></div>
      </div>
      <div class="wl-actions">
        <button class="btn-sm" onclick="openPlatformModal('${m.title.replace(/'/g, "\\'")}')">
          <i class="ti ti-player-play"></i> <span class="btn-label">Tonton</span>
        </button>
        <button class="btn-sm danger" onclick="removeFromWatchlist(${m.id})">
          <i class="ti ti-trash"></i> <span class="btn-label">Hapus</span>
        </button>
      </div>
    </div>`).join('');
}

// Hapus film dari watchlist
function removeFromWatchlist(id) {
  watchlist = watchlist.filter(w => w.id !== id);
  saveWatchlist();
  renderWatchlistPage();
  updateBadge();
}

// ============================================================
//  MODAL PLATFORM
// ============================================================
function openPlatformModal(title) {
  const modal = document.getElementById('platformModal');
  const links = document.getElementById('platformLinks');
  if (!modal || !links) return;

  links.innerHTML = PLATFORMS.map(p => `
    <a class="platform-link" href="${p.url}${encodeURIComponent(title)}"
       target="_blank" rel="noopener noreferrer">
      <span class="platform-dot" style="background:${p.color}"></span>
      ${p.name}
      <i class="ti ti-external-link"></i>
    </a>`).join('');

  modal.style.display = 'flex';
}

function closePlatformModal(e) {
  // Tutup jika klik di luar modal-box
  if (e.target.id === 'platformModal') {
    document.getElementById('platformModal').style.display = 'none';
  }
}

// ============================================================
//  ROUTER — Deteksi halaman dan jalankan init yang sesuai
// ============================================================
if (document.getElementById('trendingRow')) {
  initIndex();
} else if (document.getElementById('detailBox')) {
  initDetail();
} else if (document.getElementById('watchlistContainer')) {
  initWatchlist();
}