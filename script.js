/*
============================================================
script.js — CineList
File ini mengatur SELURUH logika dan interaktivitas aplikasi.
Dipisah dari HTML agar lebih mudah dikembangkan dan dirawat.
============================================================
*/


/* ============================================================
   1. DATA PLATFORM STREAMING
   Array berisi objek setiap platform. Setiap objek punya:
   - name   : nama platform yang ditampilkan di popup
   - color  : warna titik identitas brand
   - search : URL pencarian — judul film ditambahkan di akhir
              URL ini agar langsung ke halaman pencarian
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
   2. DATA FILM
   Array berisi objek setiap film. Setiap film punya:
   - id     : identifikasi unik untuk operasi watchlist
   - title  : judul film
   - year   : tahun rilis
   - genre  : genre (harus cocok dengan tombol filter di HTML)
   - rating : nilai 0–10
   - emoji  : dipakai sebagai "poster" pengganti gambar asli
   ============================================================ */
const movies = [
  { id:1,  title:"The Shawshank Redemption",           year:1994, genre:"Drama",     rating:9.3, emoji:"<img src='https://link-poster.jpg' />" },
  { id:2,  title:"The Godfather",                      year:1972, genre:"Drama",     rating:9.2, emoji:"<img src='https://link-poster.jpg' />" },
  { id:3,  title:"The Dark Knight",                    year:2008, genre:"Action",    rating:9.0, emoji:"<img src='https://link-poster.jpg' />" },
  { id:4,  title:"Interstellar",                       year:2014, genre:"Sci-Fi",    rating:8.7, emoji:"<img src='https://link-poster.jpg' />" },
  { id:5,  title:"Inception",                          year:2010, genre:"Sci-Fi",    rating:8.8, emoji:"<img src='https://link-poster.jpg' />" },
  { id:6,  title:"Parasite",                           year:2019, genre:"Thriller",  rating:8.5, emoji:"<img src='https://link-poster.jpg' />" },
  { id:7,  title:"Spirited Away",                      year:2001, genre:"Animation", rating:8.6, emoji:"<img src='https://link-poster.jpg' />" },
  { id:8,  title:"The Grand Budapest Hotel",           year:2014, genre:"Comedy",    rating:8.1, emoji:"<img src='https://link-poster.jpg' />" },
  { id:9,  title:"Avengers: Endgame",                  year:2019, genre:"Action",    rating:8.4, emoji:"<img src='https://link-poster.jpg' />" },
  { id:10, title:"Joker",                              year:2019, genre:"Drama",     rating:8.4, emoji:"<img src='https://link-poster.jpg' />" },
  { id:11, title:"Dune",                               year:2021, genre:"Sci-Fi",    rating:8.0, emoji:"<img src='https://link-poster.jpg' />" },
  { id:12, title:"Your Name",                          year:2016, genre:"Animation", rating:8.4, emoji:"<img src='https://link-poster.jpg' />" },
  { id:13, title:"Knives Out",                         year:2019, genre:"Thriller",  rating:7.9, emoji:"<img src='https://link-poster.jpg' />" },
  { id:14, title:"Superbad",                           year:2007, genre:"Comedy",    rating:7.6, emoji:"<img src='https://link-poster.jpg' />" },
  { id:15, title:"Mad Max: Fury Road",                 year:2015, genre:"Action",    rating:8.1, emoji:"<img src='https://link-poster.jpg' />" },
  { id:16, title:"Everything Everywhere All at Once",  year:2022, genre:"Sci-Fi",    rating:7.8, emoji:"<img src='https://link-poster.jpg' />" },
];


/* ============================================================
   3. STATE APLIKASI
   Variabel global yang menyimpan kondisi saat ini:
   - watchlist   : array film yang sudah ditambahkan user
   - activeGenre : genre yang sedang difilter (kosong = semua)
   - openPopup   : referensi ke elemen popup yang terbuka
   ============================================================ */
let watchlist   = [];
let activeGenre = '';
let openPopup   = null;


/* ============================================================
   4. TUTUP POPUP SAAT KLIK DI LUAR
   Event listener global di document: jika user mengklik di
   luar elemen popup, popup otomatis dihapus dari DOM.
   Pengecekan .closest() memastikan popup tidak tertutup
   saat user mengklik tombol "Tonton" itu sendiri.
   ============================================================ */
document.addEventListener('click', function(e) {
  if (
    openPopup &&
    !openPopup.contains(e.target) &&
    !e.target.closest('.stream-btn, .watch-stream-btn')
  ) {
    openPopup.remove();
    openPopup = null;
  }
});


/* ============================================================
   5. FUNGSI: setGenre(genre)
   Dipanggil saat user mengklik tombol pil genre.
   - Menyimpan genre aktif ke variabel activeGenre
   - Memperbarui class "active" pada semua tombol pil
   - Memanggil filterMovies() untuk memperbarui grid
   ============================================================ */
function setGenre(g) {
  activeGenre = g;
  document.querySelectorAll('.pill').forEach(p =>
    p.classList.toggle('active', p.dataset.genre === g)
  );
  filterMovies();
}


/* ============================================================
   6. FUNGSI: filterMovies()
   Dipanggil setiap ada perubahan di input pencarian,
   dropdown rating, atau tombol genre.
   Menyaring array movies berdasarkan tiga kondisi:
   1. Judul mengandung kata kunci (case-insensitive)
   2. Rating >= nilai minimum yang dipilih
   3. Genre cocok dengan activeGenre (kosong = semua genre)
   Hasil array yang sudah difilter dikirim ke renderGrid().
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
   7. FUNGSI: renderGrid(list)
   Menerima array film hasil filter, mengubahnya menjadi
   string HTML kartu, lalu menyuntikkannya ke #movieGrid.
   Teknik ini disebut "DOM injection" — lebih cepat daripada
   membuat elemen DOM satu per satu dengan createElement.
   ============================================================ */
function renderGrid(list) {
  const grid = document.getElementById('movieGrid');

  /* Jika tidak ada hasil pencarian, tampilkan pesan kosong */
  if (!list.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <i class="ti ti-movie-off"></i>
        Film tidak ditemukan
      </div>`;
    return;
  }

  /* Buat HTML kartu untuk setiap film dengan Array.map() */
  grid.innerHTML = list.map(m => {
    /* Cek apakah film sudah ada di watchlist */
    const inList = watchlist.find(w => w.id === m.id);

    return `
      <div class="card-wrap">
        <div class="card">
          <div class="card-poster">${m.emoji}</div>
          <div class="card-body">
            <div class="card-title">${m.title}</div>
            <div class="card-year">${m.year}</div>
            <div class="card-rating">
              <span class="star">★</span>
              <span class="rating-val">${m.rating}</span>
            </div>
            <span class="badge">${m.genre}</span>
            <div class="btn-row">

              <!-- Tombol tambah/hapus watchlist -->
              <!-- Class "added" ditambahkan jika film sudah di watchlist -->
              <button class="add-btn ${inList ? 'added' : ''}"
                      onclick="toggleWatch(${m.id})">
                <i class="ti ${inList ? 'ti-check' : 'ti-plus'}"></i>
              </button>

              <!-- Tombol tonton: membuka popup pilihan platform -->
              <button class="stream-btn"
                      onclick="showPlatformPopup(this, '${m.title.replace(/'/g,"\\'")}')">
                <i class="ti ti-player-play"></i> Tonton
              </button>

            </div>
          </div>
        </div>
      </div>`;
  }).join(''); /* .join('') menggabungkan semua string tanpa pemisah */
}


/* ============================================================
   8. FUNGSI: toggleWatch(id)
   Menambah atau menghapus film dari array watchlist.
   - Cari film di array movies berdasarkan id
   - Cek apakah sudah ada di watchlist (findIndex)
   - Jika belum ada (idx === -1) → push ke watchlist
   - Jika sudah ada → splice (hapus) dari watchlist
   Setelah itu render ulang grid dan watchlist agar UI
   langsung mencerminkan perubahan.
   ============================================================ */
function toggleWatch(id) {
  const movie = movies.find(m => m.id === id);
  const idx   = watchlist.findIndex(w => w.id === id);

  if (idx === -1) {
    watchlist.push(movie);    /* Belum ada → tambahkan */
  } else {
    watchlist.splice(idx, 1); /* Sudah ada → hapus */
  }

  filterMovies();    /* Render ulang grid (tombol berubah) */
  renderWatchlist(); /* Render ulang daftar watchlist */
}


/* ============================================================
   9. FUNGSI: renderWatchlist()
   Mengubah array watchlist menjadi daftar HTML dan
   menyuntikkannya ke #watchlistItems.
   Juga memperbarui angka di badge #watchCount.
   ============================================================ */
function renderWatchlist() {
  const el = document.getElementById('watchlistItems');

  /* Update badge angka jumlah film */
  document.getElementById('watchCount').textContent = watchlist.length;

  /* Jika watchlist kosong, tampilkan pesan */
  if (!watchlist.length) {
    el.innerHTML = `
      <div class="empty">
        <i class="ti ti-bookmark"></i>
        Belum ada film di watchlist
      </div>`;
    return;
  }

  /* Buat baris HTML untuk setiap film di watchlist */
  el.innerHTML = watchlist.map(m => `
    <div class="watch-item">
      <div class="watch-emoji">${m.emoji}</div>
      <div class="watch-info">
        <div class="watch-title">${m.title}</div>
        <div class="watch-meta">${m.year} · ${m.genre} · ★ ${m.rating}</div>
      </div>
      <div class="watch-actions">

        <!-- Tombol tonton dari watchlist -->
        <button class="watch-stream-btn"
                onclick="showPlatformPopup(this, '${m.title.replace(/'/g,"\\'")}')">
          <i class="ti ti-player-play"></i> Tonton
        </button>

        <!-- Tombol hapus dari watchlist -->
        <button class="remove-btn" onclick="toggleWatch(${m.id})">
          <i class="ti ti-trash"></i>
        </button>

      </div>
    </div>
  `).join('');
}


/* ============================================================
   10. FUNGSI: showPlatformPopup(btn, movieTitle)
   Menampilkan popup daftar platform streaming.
   - Jika sudah ada popup terbuka → tutup dulu (toggle)
   - Buat elemen popup baru dengan daftar link platform
   - encodeURIComponent() mencegah karakter spesial (spasi,
     tanda &, dll) merusak URL pencarian
   - Tempelkan popup ke elemen induk terdekat (.card-wrap
     atau .watch-item) agar posisi absolute berfungsi relatif
     terhadap elemen tersebut
   ============================================================ */
function showPlatformPopup(btn, movieTitle) {
  /* Toggle: klik tombol yang sama menutup popup */
  if (openPopup) {
    openPopup.remove();
    openPopup = null;
    return;
  }

  /* Buat elemen popup */
  const popup = document.createElement('div');
  popup.className = 'platform-popup';

  /* Isi popup dengan link ke setiap platform */
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

  /* Tempelkan ke induk terdekat yang punya position: relative */
  btn.closest('.card-wrap, .watch-item').appendChild(popup);
  openPopup = popup;
}


/* ============================================================
   11. INISIALISASI
   Jalankan kedua fungsi render saat halaman pertama dimuat
   agar konten langsung tampil tanpa perlu interaksi dulu.
   ============================================================ */
filterMovies();
renderWatchlist();