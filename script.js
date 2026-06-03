/*
============================================================
script.js — CineList
File ini mengatur SELURUH logika dan interaktivitas aplikasi.
Dipisah dari HTML agar lebih mudah dikembangkan dan dirawat.
============================================================
*/


/* ============================================================
   1. KONFIGURASI TMDB API
   - API_KEY  : kunci unik untuk mengakses TMDB API
   - BASE_URL : endpoint utama TMDB untuk pencarian film
   - IMG_URL  : base URL untuk menampilkan gambar poster
                w300 = lebar poster 300px (cukup untuk kartu)
   ============================================================ */
const API_KEY  = '80d6001f02cf7b601c6a2d99cf51fcc9';
const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL  = 'https://image.tmdb.org/t/p/w300';

/* Poster cadangan jika film tidak punya gambar di TMDB */
const FALLBACK_POSTER = 'https://via.placeholder.com/300x450?text=No+Poster';


/* ============================================================
   2. DATA PLATFORM STREAMING
   Array berisi objek setiap platform. Setiap objek punya:
   - name   : nama platform yang ditampilkan di popup
   - color  : warna titik identitas brand
   - search : URL pencarian — judul film ditambahkan di akhir
   ============================================================ */
const platforms = [
  { name: "Netflix",      color: "#E50914", search: "https://www.netflix.com/search?q=" },
  { name: "Disney+",      color: "#1156BE", search: "https://www.disneyplus.com/search/" },
  { name: "Prime Video",  color: "#00A8E0", search: "https://www.amazon.com/s?k=" },
  { name: "Apple TV+",    color: "#555555", search: "https://tv.apple.com/search?term=" },
  { name: "Vidio",        color: "#0066CC", search: "https://www.vidio.com/search?q=" },
  { name: "YouTube",      color: "#FF0000", search: "https://www.youtube.com/results?search_query=" },
];


/* ============================================================
   3. DATA FILM (DAFTAR AWAL)
   Array ini hanya berisi judul, tahun, genre, dan rating
   sebagai data awal. Poster akan di-fetch otomatis dari
   TMDB saat halaman dimuat pertama kali via fetchAllPosters().
   ============================================================ */
const movies = [
  { id:1,  title:"The Shawshank Redemption",           year:1994, genre:"Drama",     rating:9.3, poster:null },
  { id:2,  title:"The Godfather",                      year:1972, genre:"Drama",     rating:9.2, poster:null },
  { id:3,  title:"The Dark Knight",                    year:2008, genre:"Action",    rating:9.0, poster:null },
  { id:4,  title:"Interstellar",                       year:2014, genre:"Sci-Fi",    rating:8.7, poster:null },
  { id:5,  title:"Inception",                          year:2010, genre:"Sci-Fi",    rating:8.8, poster:null },
  { id:6,  title:"Parasite",                           year:2019, genre:"Thriller",  rating:8.5, poster:null },
  { id:7,  title:"Spirited Away",                      year:2001, genre:"Animation", rating:8.6, poster:null },
  { id:8,  title:"The Grand Budapest Hotel",           year:2014, genre:"Comedy",    rating:8.1, poster:null },
  { id:9,  title:"Avengers: Endgame",                  year:2019, genre:"Action",    rating:8.4, poster:null },
  { id:10, title:"Joker",                              year:2019, genre:"Drama",     rating:8.4, poster:null },
  { id:11, title:"Dune",                               year:2021, genre:"Sci-Fi",    rating:8.0, poster:null },
  { id:12, title:"Your Name",                          year:2016, genre:"Animation", rating:8.4, poster:null },
  { id:13, title:"Knives Out",                         year:2019, genre:"Thriller",  rating:7.9, poster:null },
  { id:14, title:"Superbad",                           year:2007, genre:"Comedy",    rating:7.6, poster:null },
  { id:15, title:"Mad Max: Fury Road",                 year:2015, genre:"Action",    rating:8.1, poster:null },
  { id:16, title:"Everything Everywhere All at Once",  year:2022, genre:"Sci-Fi",    rating:7.8, poster:null },
];


/* ============================================================
   4. STATE APLIKASI
   Variabel global yang menyimpan kondisi saat ini:
   - watchlist   : array film yang sudah ditambahkan user
   - activeGenre : genre yang sedang difilter (kosong = semua)
   - openPopup   : referensi ke elemen popup yang terbuka
   ============================================================ */
let watchlist   = [];
let activeGenre = '';
let openPopup   = null;


/* ============================================================
   5. FUNGSI: fetchPoster(movie)
   Mengambil URL poster satu film dari TMDB API.
   - Memanggil endpoint /search/movie dengan judul + tahun
   - Mengambil poster_path dari hasil pertama
   - Menggabungkan IMG_URL + poster_path jadi URL lengkap
   - Jika tidak ada poster, gunakan FALLBACK_POSTER
   Menggunakan async/await agar kode mudah dibaca.
   ============================================================ */
async function fetchPoster(movie) {
  try {
    const url      = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(movie.title)}&year=${movie.year}&language=en-US`;
    const response = await fetch(url);
    const data     = await response.json();

    /* Ambil film pertama dari hasil pencarian */
    const result = data.results && data.results[0];

    /* Kembalikan URL poster lengkap, atau fallback jika tidak ada */
    return result && result.poster_path
      ? `${IMG_URL}${result.poster_path}`
      : FALLBACK_POSTER;

  } catch (err) {
    /* Jika fetch gagal (misal: offline), gunakan fallback */
    console.error(`Gagal fetch poster untuk: ${movie.title}`, err);
    return FALLBACK_POSTER;
  }
}


/* ============================================================
   6. FUNGSI: fetchAllPosters()
   Mengambil poster semua film secara bersamaan (paralel)
   menggunakan Promise.all agar lebih cepat daripada satu
   per satu. Setelah semua poster didapat, properti .poster
   di setiap objek film diperbarui, lalu grid di-render ulang.
   ============================================================ */
async function fetchAllPosters() {
  /* Tampilkan loading sementara poster diambil */
  showLoadingGrid();

  /* Fetch semua poster secara paralel */
  const posters = await Promise.all(movies.map(m => fetchPoster(m)));

  /* Simpan URL poster ke masing-masing objek film */
  movies.forEach((m, i) => { m.poster = posters[i]; });

  /* Render ulang grid dengan poster yang sudah ada */
  filterMovies();
}


/* ============================================================
   7. FUNGSI: showLoadingGrid()
   Menampilkan skeleton loading (kartu abu-abu beranimasi)
   sementara poster sedang di-fetch dari TMDB.
   Memberikan feedback visual kepada user bahwa data sedang
   dimuat, bukan halaman yang hang.
   ============================================================ */
function showLoadingGrid() {
  const grid = document.getElementById('movieGrid');
  grid.innerHTML = Array(8).fill(`
    <div class="card skeleton">
      <div class="card-poster skeleton-poster"></div>
      <div class="card-body">
        <div class="skeleton-line" style="width:80%;height:12px;margin-bottom:6px"></div>
        <div class="skeleton-line" style="width:50%;height:10px;margin-bottom:6px"></div>
        <div class="skeleton-line" style="width:60%;height:10px"></div>
      </div>
    </div>
  `).join('');
}


/* ============================================================
   8. FUNGSI: searchTMDB()
   Dipanggil saat user mengetik di search bar.
   Jika query >= 2 karakter, fetch hasil pencarian dari TMDB
   secara real-time dan tampilkan hasilnya.
   Jika query kosong, kembali tampilkan daftar film awal.
   ============================================================ */
async function searchTMDB() {
  const q = document.getElementById('searchInput').value.trim();

  /* Jika kosong atau terlalu pendek, tampilkan data awal */
  if (q.length < 2) {
    filterMovies();
    return;
  }

  showLoadingGrid();

  try {
    const minRating = parseFloat(document.getElementById('ratingFilter').value) || 0;
    const url       = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(q)}&language=en-US`;
    const response  = await fetch(url);
    const data      = await response.json();

    /* Ubah format data TMDB ke format yang dipakai app */
    const results = (data.results || [])
      .filter(m => m.poster_path && m.vote_average >= minRating)
      .slice(0, 20) /* Batasi 20 hasil */
      .map((m, i) => ({
        id:     `tmdb_${m.id}`,
        title:  m.title,
        year:   m.release_date ? m.release_date.slice(0, 4) : '—',
        genre:  'Film',              /* Genre detail butuh request tambahan */
        rating: m.vote_average.toFixed(1),
        poster: `${IMG_URL}${m.poster_path}`,
      }));

    renderGrid(results);

  } catch (err) {
    console.error('Gagal mencari film:', err);
    filterMovies(); /* Fallback ke data lokal */
  }
}


/* ============================================================
   9. FUNGSI: setGenre(genre)
   Dipanggil saat user mengklik tombol pil genre.
   ============================================================ */
function setGenre(g) {
  activeGenre = g;
  document.querySelectorAll('.pill').forEach(p =>
    p.classList.toggle('active', p.dataset.genre === g)
  );
  filterMovies();
}


/* ============================================================
   10. FUNGSI: filterMovies()
   Menyaring array movies lokal berdasarkan rating dan genre.
   Pencarian judul ditangani oleh searchTMDB() secara terpisah.
   ============================================================ */
function filterMovies() {
  const q         = document.getElementById('searchInput').value.toLowerCase();
  const minRating = parseFloat(document.getElementById('ratingFilter').value) || 0;

  const filtered = movies.filter(m =>
    m.title.toLowerCase().includes(q) &&
    m.rating >= minRating &&
    (activeGenre === '' || m.genre === activeGenre)
  );

  renderGrid(filtered);
}


/* ============================================================
   11. FUNGSI: renderGrid(list)
   Mengubah array film menjadi kartu HTML dan
   menyuntikkannya ke #movieGrid.
   ============================================================ */
function renderGrid(list) {
  const grid = document.getElementById('movieGrid');

  if (!list.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <i class="ti ti-movie-off"></i>
        Film tidak ditemukan
      </div>`;
    return;
  }

  grid.innerHTML = list.map(m => {
    const inList     = watchlist.find(w => w.id === m.id);
    const posterSrc  = m.poster || FALLBACK_POSTER;

    return `
      <div class="card-wrap">
        <div class="card">
          <div class="card-poster">
            <img src="${posterSrc}"
                 alt="Poster ${m.title}"
                 onerror="this.src='${FALLBACK_POSTER}'" />
          </div>
          <div class="card-body">
            <div class="card-title">${m.title}</div>
            <div class="card-year">${m.year}</div>
            <div class="card-rating">
              <span class="star">★</span>
              <span class="rating-val">${m.rating}</span>
            </div>
            <span class="badge">${m.genre}</span>
            <div class="btn-row">
              <button class="add-btn ${inList ? 'added' : ''}"
                      onclick="toggleWatch('${m.id}')">
                <i class="ti ${inList ? 'ti-check' : 'ti-plus'}"></i>
              </button>
              <button class="stream-btn"
                      onclick="showPlatformPopup(this, '${m.title.replace(/'/g,"\\'")}')">
                <i class="ti ti-player-play"></i> Tonton
              </button>
            </div>
          </div>
        </div>
      </div>`;
  }).join('');
}


/* ============================================================
   12. FUNGSI: toggleWatch(id)
   Menambah atau menghapus film dari watchlist.
   Mencari di movies lokal dulu, jika tidak ada (hasil TMDB
   search), ambil dari data yang sudah dirender di DOM.
   ============================================================ */
function toggleWatch(id) {
  /* Cari di data lokal dulu */
  let movie = movies.find(m => m.id == id);

  /* Jika tidak ada (hasil search TMDB), cari di watchlist */
  if (!movie) {
    movie = watchlist.find(w => w.id == id);
  }

  if (!movie) return;

  const idx = watchlist.findIndex(w => w.id == id);
  if (idx === -1) watchlist.push(movie);
  else            watchlist.splice(idx, 1);

  filterMovies();
  renderWatchlist();
}


/* ============================================================
   13. FUNGSI: renderWatchlist()
   Mengubah array watchlist menjadi daftar HTML.
   ============================================================ */
function renderWatchlist() {
  const el = document.getElementById('watchlistItems');
  document.getElementById('watchCount').textContent = watchlist.length;

  if (!watchlist.length) {
    el.innerHTML = `
      <div class="empty">
        <i class="ti ti-bookmark"></i>
        Belum ada film di watchlist
      </div>`;
    return;
  }

  el.innerHTML = watchlist.map(m => {
    const posterSrc = m.poster || FALLBACK_POSTER;
    return `
      <div class="watch-item">
        <div class="watch-thumb">
          <img src="${posterSrc}" alt="Poster ${m.title}"
               onerror="this.src='${FALLBACK_POSTER}'" />
        </div>
        <div class="watch-info">
          <div class="watch-title">${m.title}</div>
          <div class="watch-meta">${m.year} · ${m.genre} · ★ ${m.rating}</div>
        </div>
        <div class="watch-actions">
          <button class="watch-stream-btn"
                  onclick="showPlatformPopup(this, '${m.title.replace(/'/g,"\\'")}')">
            <i class="ti ti-player-play"></i> Tonton
          </button>
          <button class="remove-btn" onclick="toggleWatch('${m.id}')">
            <i class="ti ti-trash"></i>
          </button>
        </div>
      </div>`;
  }).join('');
}


/* ============================================================
   14. FUNGSI: showPlatformPopup(btn, movieTitle)
   Menampilkan popup pilihan platform streaming.
   ============================================================ */
function showPlatformPopup(btn, movieTitle) {
  if (openPopup) { openPopup.remove(); openPopup = null; return; }

  const popup = document.createElement('div');
  popup.className = 'platform-popup';
  popup.innerHTML = platforms.map(p => `
    <a class="platform-item"
       href="${p.search}${encodeURIComponent(movieTitle)}"
       target="_blank"
       rel="noopener noreferrer">
      <span class="platform-dot" style="background:${p.color}"></span>
      ${p.name}
      <i class="ti ti-external-link" style="margin-left:auto;font-size:12px;color:#aaa"></i>
    </a>
  `).join('');

  btn.closest('.card-wrap, .watch-item').appendChild(popup);
  openPopup = popup;
}

document.addEventListener('click', function(e) {
  if (openPopup &&
      !openPopup.contains(e.target) &&
      !e.target.closest('.stream-btn, .watch-stream-btn')) {
    openPopup.remove();
    openPopup = null;
  }
});


/* ============================================================
   15. INISIALISASI
   Saat halaman dimuat:
   1. fetchAllPosters() — ambil poster semua film dari TMDB
   2. renderWatchlist() — tampilkan watchlist (kosong dulu)
   ============================================================ */
fetchAllPosters();
renderWatchlist();