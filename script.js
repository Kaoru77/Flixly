
 //tempat penyimpadan data base url dan api key
const API_KEY  = '80d6001f02cf7b601c6a2d99cf51fcc9';
const BASE     = 'https://api.themoviedb.org/3';
const IMG_W300 = 'https://image.tmdb.org/t/p/w300';
const IMG_W780 = 'https://image.tmdb.org/t/p/w780';
const IMG_ORIG = 'https://image.tmdb.org/t/p/original';
const IMG_FACE = 'https://image.tmdb.org/t/p/w185';
const NO_POSTER= 'https://placehold.co/300x450/1a1a1a/888?text=No+Poster';
const NO_FACE  = 'https://placehold.co/185x185/1a1a1a/888?text=?';



  //tempat nonton dimana saja film tersebut ada
const platforms = [
  { name:"Netflix",     color:"#E50914", url:"https://www.netflix.com/search?q=" },
  { name:"Disney+",     color:"#1156BE", url:"https://www.disneyplus.com/search/" },
  { name:"Prime Video", color:"#00A8E0", url:"https://www.amazon.com/s?k=" },
  { name:"Apple TV+",   color:"#555",    url:"https://tv.apple.com/search?term=" },
  { name:"Vidio",       color:"#0066CC", url:"https://www.vidio.com/search?q=" },
  { name:"YouTube",     color:"#FF0000", url:"https://www.youtube.com/results?search_query=" },
];

  //watchlisht yang disimpan dilocal srorage broser, dan fitur untuk popup pilihan platform saat klik tombol detail,
  // Tidak lemot saat kamu mengetik judul film di kolom pencarian
  
let watchlist  = JSON.parse(localStorage.getItem('Flixly_watchlist') || '[]');
let openPopup  = null;
let searchTimer = null;


  // simpan watchlist ke localStorage
  // Agar watchlist tidak hilang saat halaman di-refresh.
  
function saveWatchlist() {
  localStorage.setItem('Flixly_watchlist', JSON.stringify(watchlist));
}

   
   ///Memanggil TMDB API dan mengembalikan data JSON.
async function tmdb(path, params = {}) {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set('api_key', API_KEY);
  url.searchParams.set('language', 'id-ID'); /* Bahasa Indonesia jika tersedia */
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url);
  return res.json();
}


// Membuat HTML untuk kartu film, dipakai di banyak tempat (row, grid, rekomendasi).
function movieCardHTML(m) {
  const poster   = m.poster_path ? `${IMG_W300}${m.poster_path}` : NO_POSTER;
  const year     = (m.release_date || '').slice(0,4) || '—';
  const rating   = m.vote_average ? m.vote_average.toFixed(1) : '—';
  const inList   = watchlist.some(w => w.id === m.id);
  const safeTitle = (m.title || '').replace(/'/g, "\\'");

  return `
    <a class="movie-card" href="detail.html?id=${m.id}" title="${m.title}">
      <div class="card-poster">
        <img src="${poster}" alt="${m.title}" loading="lazy"
             onerror="this.src='${NO_POSTER}'" />
        <div class="poster-rating">★ ${rating}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${m.title}</div>
        <div class="card-year">${year}</div>
        <button class="card-add-btn ${inList ? 'added' : ''}"
                onclick="event.preventDefault(); toggleWatchCard(this, ${m.id}, '${safeTitle}', '${year}', '${poster}', '${rating}')">
          <i class="ti ${inList ? 'ti-check' : 'ti-plus'}"></i>
          ${inList ? 'Tersimpan' : 'Watchlist'}
        </button>
      </div>
    </a>`;
}


// isi horizontal (trending, popular, top rated) dengan data film.
function fillRow(rowId, movies) {
  const el = document.getElementById(rowId);
  if (!el) return;
  el.innerHTML = movies.map(movieCardHTML).join('');
}


// scroll saat tombol panah diklik.
function scrollRow(rowId, dir) {
  const el = document.getElementById(rowId);
  if (el) el.scrollBy({ left: dir * 600, behavior: 'smooth' });
}


//saat tombol di card diklik. Jika film belum ada di watchlist, tambahkan. Jika sudah ada, hapus.
function toggleWatchCard(btn, id, title, year, poster, rating) {
  const idx = watchlist.findIndex(w => w.id === id);
  if (idx === -1) {
    watchlist.push({ id, title, year, poster, rating });
  } else {
    watchlist.splice(idx, 1);
  }
  saveWatchlist();

  // tampilan tombol yang diklik (update)
  const inList = watchlist.some(w => w.id === id);
  btn.className = `card-add-btn ${inList ? 'added' : ''}`;
  btn.innerHTML = `<i class="ti ${inList ? 'ti-check' : 'ti-plus'}"></i> ${inList ? 'Tersimpan' : 'Watchlist'}`;

  // update semua tombol lainnya id sama (misal di rekomendasi atau detail page)
  document.querySelectorAll('.card-add-btn').forEach(b => {
    if (b !== btn && b.closest('.movie-card') &&
        b.closest('.movie-card').href && b.closest('.movie-card').href.includes(`id=${id}`)) {
      b.className = `card-add-btn ${inList ? 'added' : ''}`;
      b.innerHTML = `<i class="ti ${inList ? 'ti-check' : 'ti-plus'}"></i> ${inList ? 'Tersimpan' : 'Watchlist'}`;
    }
  });

  // Re-render watchlist section jika ada
  renderWatchlistSection();
}


//menampilkan daftar film yang sudah disimpan di watchlist. Jika kosong, tampilkan pesan kosong.
function renderWatchlistSection() {
  const el = document.getElementById('watchlistItems');
  const countEl = document.getElementById('watchCount');
  if (!el) return;

  if (countEl) countEl.textContent = watchlist.length;

  if (!watchlist.length) {
    el.innerHTML = '<p class="empty-text"><i class="ti ti-bookmark"></i><br>Belum ada film di watchlist</p>';
    return;
  }

  el.innerHTML = watchlist.map(m => {
    const safeTitle = m.title.replace(/'/g, "\\'");
    return `
      <div class="watch-item" id="witem_${m.id}">
        <div class="watch-thumb" onclick="window.location='detail.html?id=${m.id}'">
          <img src="${m.poster}" alt="${m.title}" onerror="this.src='${NO_POSTER}'" />
        </div>
        <div class="watch-info" onclick="window.location='detail.html?id=${m.id}'">
          <div class="watch-title">${m.title}</div>
          <div class="watch-meta">${m.year} · ★ ${m.rating}</div>
        </div>
        <div class="watch-actions">
          <button class="btn-sm" onclick="showWatchPopup(this, '${safeTitle}')">
            <i class="ti ti-player-play"></i> Tonton
          </button>
          <button class="btn-sm danger" onclick="removeFromWatchlist(${m.id})">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}


//hapus film dari watchlist berdasarkan id, lalu update tampilan.
function removeFromWatchlist(id) {
  watchlist = watchlist.filter(w => w.id !== id);
  saveWatchlist();
  renderWatchlistSection();
}


//tampilkan popup pilihan platform saat tombol tonton diklik. Jika popup sudah terbuka, klik lagi untuk tutup.
function showWatchPopup(btn, title) {
  if (openPopup) { openPopup.remove(); openPopup = null; return; }
  const popup = document.createElement('div');
  popup.className = 'platform-popup';
  popup.innerHTML = platforms.map(p => `
    <a class="platform-item" href="${p.url}${encodeURIComponent(title)}"
       target="_blank" rel="noopener noreferrer">
      <span class="platform-dot" style="background:${p.color}"></span>
      ${p.name}
      <i class="ti ti-external-link" style="margin-left:auto;font-size:12px;color:#555"></i>
    </a>`).join('');
  btn.closest('.watch-item').appendChild(popup);
  openPopup = popup;
}

document.addEventListener('click', e => {
  if (openPopup && !openPopup.contains(e.target) && !e.target.closest('.btn-sm')) {
    openPopup.remove();
    openPopup = null;
  }
});


//menangani pencara film di navbar.tunggu hasil pencarian saat user berhenti mengetik selama 400ms,
// lalu tampilkan hasilnya di filterSection.
function handleSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(async () => {
    const q = document.getElementById('navSearch').value.trim();
    if (!q) {
      hideFilterSection();
      return;
    }
    showFilterSection(`Hasil: "${q}"`);
    document.getElementById('filterGrid').innerHTML = skeletonGrid(12);
    try {
      const data = await tmdb('/search/movie', { query: q });
      fillGrid('filterGrid', data.results || []);
    } catch { fillGrid('filterGrid', []); }
  }, 400);
}


//filter film berdasarkan genre dan/atau tahun rilis yang dipilih di navbar
async function applyNavFilter() {
  const genreId = document.getElementById('navGenre')?.value || '';
  const year    = document.getElementById('navYear')?.value  || '';

  if (!genreId && !year) { hideFilterSection(); return; }

  const genreLabel = document.getElementById('navGenre')?.selectedOptions[0]?.text || '';
  const yearLabel  = document.getElementById('navYear')?.selectedOptions[0]?.text  || '';
  const label      = [genreLabel, yearLabel].filter(Boolean).join(' · ');

  showFilterSection(label);
  document.getElementById('filterGrid').innerHTML = skeletonGrid(12);

  const params = {};
  if (genreId) params.with_genres = genreId;
  if (year)    params.primary_release_year = year;

  try {
    const data = await tmdb('/discover/movie', { ...params, sort_by: 'popularity.desc' });
    fillGrid('filterGrid', data.results || []);
  } catch { fillGrid('filterGrid', []); }
}


//tampilkan section hasil filter/search dengan judul sesuai kriteria yang dipilih.
function showFilterSection(title) {
  const sec = document.getElementById('filterSection');
  if (sec) {
    sec.style.display = 'block';
    document.getElementById('filterTitle').innerHTML = `<i class="ti ti-filter"></i> ${title}`;
  }
}
function hideFilterSection() {
  const sec = document.getElementById('filterSection');
  if (sec) sec.style.display = 'none';
}


//dan tampilkan hasil pencarian atau filter di grid.
// Jika tidak ada hasil, tampilkan pesan kosong.
function fillGrid(gridId, movies) {
  const el = document.getElementById(gridId);
  if (!el) return;
  if (!movies.length) {
    el.innerHTML = '<p class="empty-text" style="grid-column:1/-1">Film tidak ditemukan</p>';
    return;
  }
  el.innerHTML = movies.map(movieCardHTML).join('');
}


//untuk tampilan sementara asaat menuggu hasil penncarian
function skeletonGrid(n) {
  return Array(n).fill(`
    <div class="movie-card" style="pointer-events:none">
      <div class="card-poster" style="aspect-ratio:2/3;background:linear-gradient(90deg,#1a1a1a 25%,#242424 50%,#1a1a1a 75%);background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
      <div class="card-body">
        <div style="height:12px;width:80%;border-radius:4px;margin-bottom:6px;background:linear-gradient(90deg,#1a1a1a 25%,#242424 50%,#1a1a1a 75%);background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
        <div style="height:10px;width:50%;border-radius:4px;background:linear-gradient(90deg,#1a1a1a 25%,#242424 50%,#1a1a1a 75%);background-size:200% 100%;animation:shimmer 1.4s infinite"></div>
      </div>
    </div>`).join('');
}

//untuk inisialisasi halaman index.html. Fetch data untuk semua section (trending, popular, top rated)
async function initIndex() {
  /* Cek apakah ada query search dari URL (dari detail page) */
  const urlQ = new URLSearchParams(location.search).get('q');
  if (urlQ) {
    document.getElementById('navSearch').value = urlQ;
    handleSearch();
  }

  renderWatchlistSection();

  /* Fetch semua section sekaligus (paralel) */
  const [trending, popular, topRated] = await Promise.all([
    tmdb('/trending/movie/day'),
    tmdb('/movie/popular'),
    tmdb('/movie/top_rated'),
  ]);

  /* Hero: pakai film trending pertama */
  renderHero(trending.results?.[0]);

  /* Isi setiap row */
  fillRow('trendingRow',  trending.results  || []);
  fillRow('popularRow',   popular.results   || []);
  fillRow('topRatedRow',  topRated.results  || []);
}


//untuk emanmpilkan gambar backdrop besar,judul,info utama film di bagian hero.
// Data diambil dari film trending pertama di tmdb
function renderHero(movie) {
  const hero = document.getElementById('heroSection');
  if (!hero || !movie) return;

  const backdrop = movie.backdrop_path
    ? `${IMG_ORIG}${movie.backdrop_path}`
    : (movie.poster_path ? `${IMG_W780}${movie.poster_path}` : '');

  const year   = (movie.release_date || '').slice(0,4);
  const rating = movie.vote_average?.toFixed(1) || '—';
  const inList = watchlist.some(w => w.id === movie.id);
  const poster = movie.poster_path ? `${IMG_W300}${movie.poster_path}` : NO_POSTER;
  const safeTitle = movie.title.replace(/'/g, "\\'");

  hero.innerHTML = `
    <div class="hero-bg" style="background-image:url('${backdrop}')"></div>
    <div class="hero-content">
      <div class="hero-badge"><i class="ti ti-flame"></i> Trending #1</div>
      <h1 class="hero-title">${movie.title}</h1>
      <div class="hero-meta">
        <span class="star">★</span><span>${rating}</span>
        <span>${year}</span>
      </div>
      <div class="hero-actions">
        <a class="btn-primary" href="detail.html?id=${movie.id}">
          <i class="ti ti-info-circle"></i> Lihat Detail
        </a>
        <button class="btn-secondary" id="heroBtnAdd"
                onclick="toggleWatchCard(this, ${movie.id}, '${safeTitle}', '${year}', '${poster}', '${rating}')">
          <i class="ti ${inList ? 'ti-check' : 'ti-plus'}"></i>
          ${inList ? 'Tersimpan' : 'Simpan ke Watchlist'}
        </button>
      </div>
    </div>`;
}



//untuk inisialisasi halaman detail.html

async function initDetail() {
  const id = new URLSearchParams(location.search).get('id');
  if (!id) { window.location = 'index.html'; return; }

  try {
    const [detail, credits, similar] = await Promise.all([
      tmdb(`/movie/${id}`),
      tmdb(`/movie/${id}/credits`),
      tmdb(`/movie/${id}/similar`),
    ]);

    renderDetailHero(detail);
    renderSynopsis(detail);
    renderCast(credits.cast || []);
    renderRecommendations(similar.results || []);

    /* Update title tab browser */
    document.title = `${detail.title} — Flixly`;

  } catch (err) {
    console.error('Gagal load detail film:', err);
    document.getElementById('detailHero').innerHTML =
      '<p class="empty-text">Gagal memuat data film. Coba lagi.</p>';
  }
}


// emanmplkan gambar backdrop besar,judul,info utama film di bagian hero halaman detail.
function renderDetailHero(m) {
  const hero = document.getElementById('detailHero');
  if (!hero) return;

  const backdrop = m.backdrop_path
    ? `${IMG_ORIG}${m.backdrop_path}`
    : (m.poster_path ? `${IMG_W780}${m.poster_path}` : '');

  const poster   = m.poster_path ? `${IMG_W300}${m.poster_path}` : NO_POSTER;
  const year     = (m.release_date || '').slice(0,4);
  const rating   = m.vote_average?.toFixed(1) || '—';
  const runtime  = m.runtime ? `${Math.floor(m.runtime/60)}j ${m.runtime%60}m` : '';
  const genres   = (m.genres || []).map(g => `<span class="genre-badge">${g.name}</span>`).join('');
  const inList   = watchlist.some(w => w.id === m.id);
  const safeTitle = m.title.replace(/'/g, "\\'");

  hero.innerHTML = `
    <div class="detail-backdrop" style="background-image:url('${backdrop}')"></div>
    <div class="detail-content">
      <div class="detail-poster">
        <img src="${poster}" alt="${m.title}" onerror="this.src='${NO_POSTER}'" />
      </div>
      <div class="detail-info">
        <div class="detail-genres">${genres}</div>
        <h1 class="detail-title">${m.title}</h1>
        <div class="detail-meta">
          <span class="rating">★ ${rating}</span>
          <span>${year}</span>
          ${runtime ? `<span>${runtime}</span>` : ''}
          ${m.original_language ? `<span>${m.original_language.toUpperCase()}</span>` : ''}
        </div>
        <div class="detail-actions">
          <button class="btn-primary" id="detailBtnAdd"
                  onclick="toggleWatchDetail(${m.id}, '${safeTitle}', '${year}', '${poster}', '${rating}')">
            <i class="ti ${inList ? 'ti-check' : 'ti-plus'}"></i>
            ${inList ? 'Tersimpan' : 'Simpan ke Watchlist'}
          </button>
          ${platforms.slice(0,3).map(p => `
            <a class="btn-secondary" href="${p.url}${encodeURIComponent(m.title)}"
               target="_blank" rel="noopener">
              <span class="platform-dot" style="background:${p.color}"></span> ${p.name}
            </a>`).join('')}
        </div>
      </div>
    </div>`;
}


// sama saja dengan toggleWatchCard, tapi khusus untuk tombol di halaman detail.
// Karena tombol di detail page tidak punya atribut "added" seperti di card, jadi kita update tampilannya secara manual.
function toggleWatchDetail(id, title, year, poster, rating) {
  const idx = watchlist.findIndex(w => w.id === id);
  if (idx === -1) watchlist.push({ id, title, year, poster, rating });
  else            watchlist.splice(idx, 1);
  saveWatchlist();

  const inList = watchlist.some(w => w.id === id);
  const btn    = document.getElementById('detailBtnAdd');
  if (btn) {
    btn.innerHTML = `<i class="ti ${inList ? 'ti-check' : 'ti-plus'}"></i> ${inList ? 'Tersimpan' : 'Simpan ke Watchlist'}`;
  }
}


//menamplkan sinopsis film di halaman detail diambil dari tmdb
function renderSynopsis(m) {
  const sec = document.getElementById('synopsisSection');
  const el  = document.getElementById('synopsis');
  if (!sec || !el) return;

  if (m.overview) {
    el.textContent = m.overview;
    sec.style.display = 'block';
  }
}


//utuk menampilakn pemeran utama di film seperti biasa data diambil dari tmdb
function renderCast(cast) {
  const sec = document.getElementById('castSection');
  const row = document.getElementById('castRow');
  if (!sec || !row || !cast.length) return;

  row.innerHTML = cast.slice(0, 20).map(c => {
    const photo = c.profile_path
      ? `${IMG_FACE}${c.profile_path}`
      : NO_FACE;
    return `
      <div class="cast-card">
        <div class="cast-photo">
          <img src="${photo}" alt="${c.name}" loading="lazy"
               onerror="this.src='${NO_FACE}'" />
        </div>
        <div class="cast-name">${c.name}</div>
        <div class="cast-role">${c.character || '—'}</div>
      </div>`;
  }).join('');

  sec.style.display = 'block';
}


//film yang serupa beeada dengan film yang sedang dilihat, data diambil dari tmdb juga
function renderRecommendations(movies) {
  const sec = document.getElementById('recSection');
  const row = document.getElementById('recRow');
  if (!sec || !row) return;

  if (!movies.length) return;

  row.innerHTML = movies.slice(0, 20).map(movieCardHTML).join('');
  sec.style.display = 'block';
}


// simpelnya, cek halaman mana yang sedang dibuka dengan melihat elemen unik di setiap halaman
// lalu panggil fungsi inisialisasi yang sesuai.
if (document.getElementById('heroSection')) {
  /* Halaman index.html */
  initIndex();
} else if (document.getElementById('detailHero')) {
  /* Halaman detail.html */
  initDetail();
}