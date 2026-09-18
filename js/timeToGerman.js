/* ============================================================
   timeToGerman.js
   Konversi jam + menit  ->  teks Bahasa Jerman
   Fondasi seluruh aplikasi. Semua modul lain memanggil file ini.
   ============================================================ */

(function (global) {
  'use strict';

  /* ------------------------------------------------------------
     ANGKA JERMAN 0 - 59
     Dipakai untuk sistem offiziell (mis. "fünfundvierzig").
     Silakan diubah kalau Anda mau ejaan alternatif (mis. "dreissig").
     ------------------------------------------------------------ */
  var ZAHLWOERTER = [
    'null',              // 0
    'eins',              // 1
    'zwei',              // 2
    'drei',              // 3
    'vier',              // 4
    'fünf',              // 5
    'sechs',             // 6
    'sieben',            // 7
    'acht',              // 8
    'neun',              // 9
    'zehn',              // 10
    'elf',               // 11
    'zwölf',             // 12
    'dreizehn',          // 13
    'vierzehn',          // 14
    'fünfzehn',          // 15
    'sechzehn',          // 16  (perhatikan: BUKAN "sechszehn")
    'siebzehn',          // 17  (perhatikan: BUKAN "siebenzehn")
    'achtzehn',          // 18
    'neunzehn',          // 19
    'zwanzig',           // 20
    'einundzwanzig',     // 21  (pakai "ein", bukan "eins")
    'zweiundzwanzig',    // 22
    'dreiundzwanzig',    // 23
    'vierundzwanzig',    // 24
    'fünfundzwanzig',    // 25
    'sechsundzwanzig',   // 26
    'siebenundzwanzig',  // 27  (di sini pakai "sieben" penuh)
    'achtundzwanzig',    // 28
    'neunundzwanzig',    // 29
    'dreißig',           // 30
    'einunddreißig',     // 31
    'zweiunddreißig',    // 32
    'dreiunddreißig',    // 33
    'vierunddreißig',    // 34
    'fünfunddreißig',    // 35
    'sechsunddreißig',   // 36
    'siebenunddreißig',  // 37
    'achtunddreißig',    // 38
    'neununddreißig',    // 39
    'vierzig',           // 40
    'einundvierzig',     // 41
    'zweiundvierzig',    // 42
    'dreiundvierzig',    // 43
    'vierundvierzig',    // 44
    'fünfundvierzig',    // 45
    'sechsundvierzig',   // 46
    'siebenundvierzig',  // 47
    'achtundvierzig',    // 48
    'neunundvierzig',    // 49
    'fünfzig',           // 50
    'einundfünfzig',     // 51
    'zweiundfünfzig',    // 52
    'dreiundfünfzig',    // 53
    'vierundfünfzig',    // 54
    'fünfundfünfzig',    // 55
    'sechsundfünfzig',   // 56
    'siebenundfünfzig',  // 57
    'achtundfünfzig',    // 58
    'neunundfünfzig'     // 59
  ];

  /* ------------------------------------------------------------
     Bantuan angka jam
     ------------------------------------------------------------ */

  // 0 -> 12, 13 -> 1, 24 -> 12 ... (jam dalam sistem 12)
  function zu12(h) {
    var x = ((h % 12) + 12) % 12;
    return x === 0 ? 12 : x;
  }

  // Jam berikutnya dalam sistem 12. Inilah yang membuat
  // 12:30 -> "halb eins" (bukan "halb dreizehn").
  function naechste12(h) {
    return zu12(h + 1);
  }

  // Nama jam untuk sistem inoffiziell: 1 -> "eins", 7 -> "sieben"
  // Catatan: "halb eins", "Viertel vor eins" memang pakai "eins".
  function stundenWort(h12) {
    return ZAHLWOERTER[h12];
  }

  /* ------------------------------------------------------------
     SISTEM INOFFIZIELL (sehari-hari, 12 jam)
     Mengembalikan FRASA saja, tanpa "Es ist" dan tanpa titik.
     Contoh: inoffiziellPhrase(7, 45)  ->  "Viertel vor acht"
     ------------------------------------------------------------ */
  function inoffiziellPhrase(h, m, opsi) {
    opsi = opsi || {};
    var jetzt = zu12(h);        // jam sekarang
    var naechst = naechste12(h); // jam berikutnya (patokan setelah menit 30)

    switch (m) {
      case 0:
        // 1:00 -> "ein Uhr" (BUKAN "eins Uhr").
        // opsi.kurz === true  -> hanya "sieben" / "eins" tanpa "Uhr"
        if (opsi.kurz) return stundenWort(jetzt);
        return (jetzt === 1 ? 'ein' : stundenWort(jetzt)) + ' Uhr';

      case 5:  return 'fünf nach ' + stundenWort(jetzt);
      case 10: return 'zehn nach ' + stundenWort(jetzt);
      case 15: return 'Viertel nach ' + stundenWort(jetzt);
      case 20: return 'zwanzig nach ' + stundenWort(jetzt);

      // Mulai di sini patokan berpindah ke JAM BERIKUTNYA
      case 25: return 'fünf vor halb ' + stundenWort(naechst);
      case 30: return 'halb ' + stundenWort(naechst);
      case 35: return 'fünf nach halb ' + stundenWort(naechst);
      case 40: return 'zwanzig vor ' + stundenWort(naechst);
      case 45: return 'Viertel vor ' + stundenWort(naechst);
      case 50: return 'zehn vor ' + stundenWort(naechst);
      case 55: return 'fünf vor ' + stundenWort(naechst);

      default:
        // Menit di luar kelipatan 5 tidak lazim diucapkan secara inoffiziell.
        // Aplikasi selalu snap ke kelipatan 5, jadi ini hanya jaring pengaman.
        return null;
    }
  }

  /* ------------------------------------------------------------
     SISTEM OFFIZIELL (resmi, 24 jam)
     Baca angka apa adanya: 14:45 -> "vierzehn Uhr fünfundvierzig"
     ------------------------------------------------------------ */
  function offiziellPhrase(h, m) {
    var h24 = ((h % 24) + 24) % 24;
    // Jam 1 tetap "ein Uhr", bukan "eins Uhr".
    var stunde = (h24 === 1 ? 'ein' : ZAHLWOERTER[h24]) + ' Uhr';
    if (m === 0) return stunde;              // 14:00 -> "vierzehn Uhr"
    return stunde + ' ' + ZAHLWOERTER[m];    // 20:05 -> "zwanzig Uhr fünf"
  }

  /* ------------------------------------------------------------
     Format digital "14:45"
     ------------------------------------------------------------ */
  function digital(h, m) {
    var h24 = ((h % 24) + 24) % 24;
    return (h24 < 10 ? '0' : '') + h24 + ':' + (m < 10 ? '0' : '') + m;
  }

  /* ------------------------------------------------------------
     Kalimat lengkap
       esIst(...)  -> jawaban untuk "Wie spät ist es?"
       um(...)     -> jawaban untuk "Wann...?"
     sistem: 'inoffiziell' | 'offiziell'
     ------------------------------------------------------------ */
  function phrase(h, m, sistem, opsi) {
    return sistem === 'offiziell'
      ? offiziellPhrase(h, m)
      : inoffiziellPhrase(h, m, opsi);
  }

  function esIst(h, m, sistem, opsi) {
    return 'Es ist ' + phrase(h, m, sistem, opsi) + '.';
  }

  function um(h, m, sistem, opsi) {
    return 'Um ' + phrase(h, m, sistem, opsi) + '.';
  }

  /* ------------------------------------------------------------
     Pewarnaan kata kunci untuk tampilan HTML.
     nach = biru, vor = merah, halb = hijau, Viertel = ungu.
     Ubah nama kelas CSS di sini kalau Anda mau warna lain.
     ------------------------------------------------------------ */
  function markiere(teks) {
    if (!teks) return '';
    return teks
      .replace(/\bViertel\b/g, '<span class="kw-viertel">Viertel</span>')
      .replace(/\bhalb\b/g, '<span class="kw-halb">halb</span>')
      .replace(/\bnach\b/g, '<span class="kw-nach">nach</span>')
      .replace(/\bvor\b/g, '<span class="kw-vor">vor</span>');
  }

  /* ------------------------------------------------------------
     Daftar menit per tingkat kesulitan.
     Level 1 : jam bulat, :15, :30, :45
     Level 2 : + :05, :10, :20, :40, :50, :55
     Level 3 : + :25 dan :35  (paling sulit)
     Level 4 : sama seperti level 3, tapi sistem dicampur
     ------------------------------------------------------------ */
  var MINUTEN_LEVEL = {
    1: [0, 15, 30, 45],
    2: [0, 5, 10, 15, 20, 30, 40, 45, 50, 55],
    3: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55],
    4: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55]
  };

  // Waktu acak sesuai level. jamMin/jamMax memakai sistem 24 jam.
  function zufallsZeit(level, jamMin, jamMax) {
    var menit = MINUTEN_LEVEL[level] || MINUTEN_LEVEL[3];
    var lo = (typeof jamMin === 'number') ? jamMin : 0;
    var hi = (typeof jamMax === 'number') ? jamMax : 23;
    return {
      h: lo + Math.floor(Math.random() * (hi - lo + 1)),
      m: menit[Math.floor(Math.random() * menit.length)]
    };
  }

  /* ------------------------------------------------------------
     Ekspor: jalan di browser (window.TimeDE) maupun di Node (tes).
     ------------------------------------------------------------ */
  var API = {
    ZAHLWOERTER: ZAHLWOERTER,
    MINUTEN_LEVEL: MINUTEN_LEVEL,
    zu12: zu12,
    naechste12: naechste12,
    inoffiziellPhrase: inoffiziellPhrase,
    offiziellPhrase: offiziellPhrase,
    digital: digital,
    phrase: phrase,
    esIst: esIst,
    um: um,
    markiere: markiere,
    zufallsZeit: zufallsZeit
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  global.TimeDE = API;
})(typeof window !== 'undefined' ? window : globalThis);
