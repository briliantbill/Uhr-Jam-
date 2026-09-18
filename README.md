# Die Uhrzeit — Aplikasi Belajar Jam Bahasa Jerman (A1)

Aplikasi web untuk murid Indonesia yang belajar menyebut jam dalam Bahasa Jerman.
HTML/CSS/JavaScript murni — **tidak perlu install apa pun**, cukup buka `index.html`
lewat browser (Chrome, Edge, Safari, Firefox). Jalan juga di HP.

---

## Cara memakai

1. Buka `index.html` dengan dobel klik.
2. Ada tiga tab:
   - **Die Uhr** — jam analog interaktif, jarumnya bisa digeser.
   - **Üben** — empat mode latihan dengan empat tingkat kesulitan.
   - **Erklärung** — materi lengkap dalam Bahasa Indonesia.

Untuk kelas online, cukup *share screen* tab **Die Uhr** lalu minta murid
menyebutkan waktunya sambil Anda memutar jarum.

---

## Struktur file

```
deutsch-uhrzeit/
├── index.html          seluruh struktur halaman + materi penjelasan
├── css/
│   └── style.css       semua tampilan; warna utama ada di :root paling atas
├── js/
│   ├── timeToGerman.js konversi jam -> teks Jerman (fondasi semuanya)
│   ├── clock.js        jam analog SVG + logika geser jarum
│   ├── exercises.js    empat mode latihan
│   └── main.js         navigasi tab, jam utama, tabel referensi
└── README.md
```

---

## Yang bisa Anda ubah sendiri

| Ingin mengubah… | Buka file | Cari bagian |
|---|---|---|
| Warna kata kunci (nach/vor/halb/Viertel) | `css/style.css` | blok `:root` di baris paling atas |
| Warna jarum jam & menit | `css/style.css` | `--c-stunde`, `--c-minute` |
| Ukuran jam, panjang jarum | `js/clock.js` | konstanta `R_RAND`, `LEN_STUNDE`, `LEN_MINUTE` |
| Jumlah soal per sesi (default 10) | `js/exercises.js` | `SOAL_PER_SESI` |
| Menit yang muncul di tiap level | `js/timeToGerman.js` | `MINUTEN_LEVEL` |
| Daftar pertanyaan "Wann…?" | `js/exercises.js` | array `KONTEXTE` |
| Terjemahan Indonesia di tabel referensi | `js/main.js` | objek `INDONESISCH` |

Bagian-bagian ini sudah diberi komentar berbahasa Indonesia di dalam kodenya.

---

## Fitur

### Jam analog interaktif (SVG)
- Jarum **jam** (oranye, pendek) dan jarum **menit** (biru-tosca, panjang) berbeda
  warna dan diberi label `Stunde` / `Minute` supaya murid tidak tertukar.
- Bisa digeser dengan **mouse maupun sentuhan** (pointer events).
- Menit otomatis **snap ke kelipatan 5**, jadi tidak pernah muncul 7:13.
- Kalau jarum menit melewati angka 12, jamnya ikut maju/mundur seperti jam asli.
- Kalimat Jerman versi *inoffiziell* dan *offiziell* berubah **real-time**.
- Tombol **vormittags / nachmittags** untuk berpindah antara 02:45 dan 14:45.

### Empat mode latihan
| Mode | Nama | Yang dilatih |
|---|---|---|
| 1 | Wie spät ist es? | lihat jam → pilih kalimat (inoffiziell / offiziell / campur) |
| 2 | Stell die Uhr! | baca kalimat → geser jarum ke posisi yang benar |
| 3 | Umrechnen | ketik konversi `14:45` ↔ `Viertel vor drei` (dua arah) |
| 4 | Wann …? | membedakan jawaban **Um …** dan **Es ist …** |

Setiap jawaban salah langsung diberi penjelasan singkat dalam Bahasa Indonesia.

### Empat tingkat kesulitan
| Level | Menit yang muncul |
|---|---|
| 1 | `:00 :15 :30 :45` |
| 2 | ditambah `:05 :10 :20 :40 :50 :55` |
| 3 | ditambah `:25` dan `:35` (*fünf vor/nach halb* — bagian tersulit) |
| 4 | semua menit, sistem offiziell & inoffiziell dicampur |

### Halaman penjelasan (Bahasa Indonesia)
Berisi dua cara bertanya, dua sistem waktu, empat kata kunci, dua kotak "jebakan"
(`halb acht = 7:30` dan `fünf vor/nach halb`), beda *Es ist…* vs *Um…*, serta tabel
referensi satu jam penuh (7:00–7:55) yang **dibuat otomatis dari `timeToGerman.js`**
sehingga isinya tidak mungkin berbeda dengan logika aplikasi.

---

## Catatan teknis

- Tanpa framework, tanpa *build step*, tanpa koneksi internet.
- **Tidak memakai `localStorage`** — nilai latihan hilang saat halaman ditutup.
- `js/timeToGerman.js` juga bisa dipakai di Node.js (`module.exports`), berguna
  kalau suatu saat ingin menulis tes otomatis.
- Semua 288 kombinasi (24 jam × 12 menit) sudah diuji untuk kedua sistem,
  termasuk kasus khusus `12:30 → halb eins`, `1:00 → ein Uhr`,
  `0:00 → null Uhr` (offiziell) dan `20:05 → zwanzig Uhr fünf`.

---

## Aturan konversi yang dipakai

**Inoffiziell** (patokan berpindah ke jam berikutnya mulai menit 25):

| Menit | Pola | Contoh (jam 7) |
|---|---|---|
| :00 | `[jam] Uhr` | sieben Uhr |
| :05 | `fünf nach [jam]` | fünf nach sieben |
| :10 | `zehn nach [jam]` | zehn nach sieben |
| :15 | `Viertel nach [jam]` | Viertel nach sieben |
| :20 | `zwanzig nach [jam]` | zwanzig nach sieben |
| :25 | `fünf vor halb [jam+1]` | fünf vor halb acht |
| :30 | `halb [jam+1]` | halb acht |
| :35 | `fünf nach halb [jam+1]` | fünf nach halb acht |
| :40 | `zwanzig vor [jam+1]` | zwanzig vor acht |
| :45 | `Viertel vor [jam+1]` | Viertel vor acht |
| :50 | `zehn vor [jam+1]` | zehn vor acht |
| :55 | `fünf vor [jam+1]` | fünf vor acht |

**Offiziell** (24 jam, angka dibaca apa adanya):
`14:45 → vierzehn Uhr fünfundvierzig` · `14:00 → vierzehn Uhr` · `20:05 → zwanzig Uhr fünf`
