/* ============================================================
   exercises.js
   Empat mode latihan:
     1. Wie spät ist es?  (lihat jam -> pilih kalimat)
     2. Stell die Uhr!    (baca kalimat -> geser jarum)
     3. Umrechnen         (konversi offiziell <-> inoffiziell, diketik)
     4. Wann ...?         (latihan "Um ..." vs "Es ist ...")
   ============================================================ */

(function (global) {
  'use strict';

  var T = global.TimeDE;

  // Jumlah soal per sesi. Ubah angka ini kalau mau sesi lebih pendek/panjang.
  var SOAL_PER_SESI = 10;

  /* ------------------------------------------------------------
     Bantuan umum
     ------------------------------------------------------------ */
  function acak(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function kocok(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, kelas, html) {
    var e = document.createElement(tag);
    if (kelas) e.className = kelas;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  // Menyamakan ejaan sebelum dicocokkan:
  // huruf kecil, umlaut/ae/oe/ue/ss disamakan, "Es ist"/"Um" dan titik dibuang.
  function normalisasi(s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[.!?]/g, ' ')
      .replace(/^\s*(es ist|um)\s+/, '')
      .replace(/ä|ae/g, 'a')
      .replace(/ö|oe/g, 'o')
      .replace(/ü|ue/g, 'u')
      .replace(/ß|ss/g, 's')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Penjelasan singkat (Bahasa Indonesia) tentang aturan menit tertentu.
  function regelHinweis(m) {
    if (m === 0)  return 'Jam bulat: cukup sebut jamnya + <em>Uhr</em>.';
    if (m === 15) return '<span class="kw-viertel">Viertel</span> = seperempat (15 menit), <span class="kw-nach">nach</span> = lewat.';
    if (m === 30) return 'Ingat: <span class="kw-halb">halb</span> menunjuk ke jam BERIKUTNYA — sama seperti "setengah delapan".';
    if (m === 45) return '<span class="kw-viertel">Viertel</span> <span class="kw-vor">vor</span> = seperempat menuju jam berikutnya.';
    if (m === 25) return 'Jebakan: 5 menit SEBELUM <span class="kw-halb">halb</span> — "setengah … kurang lima".';
    if (m === 35) return 'Jebakan: 5 menit SETELAH <span class="kw-halb">halb</span> — "setengah … lewat lima".';
    if (m < 30)   return '<span class="kw-nach">nach</span> = lewat, patokannya jam yang sekarang.';
    return '<span class="kw-vor">vor</span> = kurang, patokannya jam BERIKUTNYA.';
  }

  /* ------------------------------------------------------------
     Membuat pilihan jawaban salah yang "masuk akal".
     Sengaja memakai kesalahan yang sering terjadi:
       - selisih 1 jam (salah patokan halb/vor)
       - selisih 5 dan 15 menit
       - tertukar nach <-> vor
     ------------------------------------------------------------ */
  function ablenkerZeiten(h, m, level, jumlah) {
    var menitLevel = T.MINUTEN_LEVEL[level] || T.MINUTEN_LEVEL[3];
    var kandidat = [];

    function tambah(dh, dm) {
      var total = ((h * 60 + m) + dh * 60 + dm + 1440 * 3) % 1440;
      var nh = Math.floor(total / 60), nm = total % 60;
      if (nm % 5 !== 0) return;
      if (menitLevel.indexOf(nm) === -1) return;   // tetap di dalam level
      if (nh === h && nm === m) return;
      kandidat.push({ h: nh, m: nm });
    }

    // Urutan ini menentukan prioritas pengecoh
    tambah(1, 0); tambah(-1, 0);
    tambah(0, 5); tambah(0, -5);
    tambah(0, 15); tambah(0, -15);
    tambah(0, 30); tambah(0, 10); tambah(0, -10);
    tambah(1, 30); tambah(-1, -30);

    var hasil = [], pakai = {};
    kocok(kandidat).forEach(function (z) {
      var kunci = z.h + ':' + z.m;
      if (!pakai[kunci] && hasil.length < jumlah) { pakai[kunci] = 1; hasil.push(z); }
    });

    // Jaring pengaman kalau level 1 kandidatnya sedikit
    while (hasil.length < jumlah) {
      var z2 = T.zufallsZeit(level);
      if (!(z2.h === h && z2.m === m) && !pakai[z2.h + ':' + z2.m]) {
        pakai[z2.h + ':' + z2.m] = 1;
        hasil.push(z2);
      }
    }
    return hasil;
  }

  /* ============================================================
     CONTROLLER LATIHAN
     ============================================================ */
  function Uebung(dom) {
    this.dom = dom;
    this.cfg = { modus: 1, level: 1, system: 'inoffiziell' };
    this.reset();
  }

  Uebung.prototype.reset = function () {
    this.nr = 0;
    this.benar = 0;
    this.selesai = false;
    this.aufgabe = null;
    this.uhr = null;
  };

  Uebung.prototype.start = function (cfg) {
    this.cfg = cfg;
    this.reset();
    this.naechsteAufgabe();
  };

  Uebung.prototype.punkteZeigen = function () {
    var d = this.dom;
    d.punkteText.textContent = this.benar + ' / ' + this.nr;
    var persen = this.nr ? Math.round(this.benar / this.nr * 100) : 0;
    d.punkteFuell.style.width = persen + '%';
  };

  // Sistem yang dipakai untuk satu soal (menangani pilihan "campur")
  Uebung.prototype.systemFuerAufgabe = function () {
    if (this.cfg.system === 'gemischt' || this.cfg.level === 4) {
      return Math.random() < 0.5 ? 'inoffiziell' : 'offiziell';
    }
    return this.cfg.system;
  };

  Uebung.prototype.naechsteAufgabe = function () {
    var d = this.dom;

    if (this.nr >= SOAL_PER_SESI) return this.ergebnisZeigen();

    this.nr++;
    d.frageNr.textContent = 'Aufgabe ' + this.nr + ' / ' + SOAL_PER_SESI;
    d.feedback.hidden = true;
    d.feedback.className = 'feedback';
    d.frageBuehne.innerHTML = '';
    d.antwortBuehne.innerHTML = '';
    d.frageHilfe.innerHTML = '';
    d.btnWeiter.hidden = true;
    d.btnPruefen.hidden = true;
    this.punkteZeigen();

    var modus = this.cfg.modus;
    if (modus === 1) this.modus1();
    else if (modus === 2) this.modus2();
    else if (modus === 3) this.modus3();
    else this.modus4();
  };

  /* ------------------------------------------------------------
     MODE 1 — Wie spät ist es?  (lihat jam -> pilih jawaban)
     ------------------------------------------------------------ */
  Uebung.prototype.modus1 = function () {
    var self = this, d = this.dom;
    var sistem = this.systemFuerAufgabe();
    var z = T.zufallsZeit(this.cfg.level, sistem === 'offiziell' ? 0 : 1,
                                           sistem === 'offiziell' ? 23 : 12);

    d.frageText.textContent = 'Wie spät ist es?';
    d.frageHilfe.innerHTML = 'Jam berapa sekarang? Pilih jawaban dalam bentuk <strong>' +
                             sistem + '</strong>.';

    var mount = el('div', 'uhr-mount uhr-mount--klein');
    d.frageBuehne.appendChild(mount);
    var uhr = global.Uhr.createClock(mount, {
      h: z.h, m: z.m, interactive: false, labels: true
    });
    this.uhr = uhr;

    if (sistem === 'offiziell') {
      var tag = el('p', 'tageszeit-hinweis',
        z.h < 12 ? '🌅 vormittags (pagi)' : '🌆 nachmittags/abends (siang–malam)');
      d.frageBuehne.appendChild(tag);
    }

    var benar = T.esIst(z.h, z.m, sistem);
    var unik = [benar];
    ablenkerZeiten(z.h, z.m, this.cfg.level, 6).forEach(function (w) {
      var s = T.esIst(w.h, w.m, sistem);
      if (unik.indexOf(s) === -1 && unik.length < 4) unik.push(s);
    });

    this.optionenZeigen(kocok(unik), benar, function (gewaehlt) {
      self.bewerten(gewaehlt === benar, benar,
        'Jawaban benar: <strong>' + T.markiere(benar) + '</strong><br>' +
        '<span class="hinweis-regel">' + regelHinweis(z.m) + '</span>');
    });
  };

  /* ------------------------------------------------------------
     MODE 2 — Stell die Uhr!  (baca kalimat -> geser jarum)
     ------------------------------------------------------------ */
  Uebung.prototype.modus2 = function () {
    var self = this, d = this.dom;
    // Selalu inoffiziell: murid berlatih membaca kalimat sehari-hari.
    var z = T.zufallsZeit(this.cfg.level, 1, 12);
    var satz = T.esIst(z.h, z.m, 'inoffiziell');

    d.frageText.innerHTML = T.markiere(satz);
    d.frageHilfe.innerHTML = 'Geser jarum jam sampai menunjukkan waktu di atas, lalu tekan <strong>Prüfen</strong>.';

    var mount = el('div', 'uhr-mount');
    d.frageBuehne.appendChild(mount);

    // Posisi awal sengaja diacak dan dijauhkan dari jawaban.
    var awal = T.zufallsZeit(1, 1, 12);
    if (awal.h % 12 === z.h % 12 && awal.m === z.m) awal.h = (awal.h + 5) % 12 + 1;

    var uhr = global.Uhr.createClock(mount, {
      h: awal.h, m: awal.m, interactive: true, labels: true
    });
    this.uhr = uhr;

    var anzeige = el('p', 'stell-anzeige');
    d.antwortBuehne.appendChild(anzeige);
    function aktualisieren(h, m) {
      anzeige.innerHTML = 'Posisi sekarang: <strong>' + T.digital(h % 12 === 0 ? 12 : h % 12, m) +
        '</strong> &middot; ' + T.markiere(T.inoffiziellPhrase(h, m) || '…');
    }
    uhr.setOnChange(aktualisieren);
    aktualisieren(awal.h, awal.m);

    d.btnPruefen.hidden = false;
    this.pruefen = function () {
      var jetzt = uhr.getTime();
      // Dicocokkan modulo 12: kalimat inoffiziell tidak membedakan pagi/sore.
      var cocok = (jetzt.h % 12 === z.h % 12) && (jetzt.m === z.m);
      uhr.setStatus(cocok ? 'ok' : 'falsch');
      uhr.setInteractive(false);
      if (!cocok) uhr.setTimeStill(z.h, z.m);
      self.bewerten(cocok, satz,
        (cocok ? 'Posisi jarum sudah tepat.' :
                 'Posisi yang benar sudah ditampilkan: <strong>' +
                 T.digital(z.h, z.m) + '</strong>') +
        '<br><span class="hinweis-regel">' + regelHinweis(z.m) + '</span>');
    };
  };

  /* ------------------------------------------------------------
     MODE 3 — Umrechnen (diketik)
       Arah A: "14:45"  -> tulis versi inoffiziell
       Arah B: kalimat inoffiziell -> tulis jam digital (14:45)
     ------------------------------------------------------------ */
  Uebung.prototype.modus3 = function () {
    var self = this, d = this.dom;
    var z = T.zufallsZeit(this.cfg.level, 0, 23);
    var arahA = Math.random() < 0.5;

    var jawabanBenar, tampilanBenar;

    if (arahA) {
      d.frageText.innerHTML = '<span class="gross-digital">' + T.digital(z.h, z.m) + '</span>';
      d.frageHilfe.innerHTML = 'Tulis versi <strong>inoffiziell</strong>-nya ' +
        '(boleh tanpa "Es ist", umlaut boleh ditulis ae/oe/ue/ss).';
      jawabanBenar = T.inoffiziellPhrase(z.h, z.m);
      tampilanBenar = T.esIst(z.h, z.m, 'inoffiziell');
    } else {
      var satz = T.esIst(z.h, z.m, 'inoffiziell');
      d.frageText.innerHTML = T.markiere(satz);
      // Kalimat inoffiziell tidak membedakan pagi/sore, jadi petunjuknya
      // harus jelas — kalau tidak, 05:20 dan 17:20 sama-sama masuk akal.
      d.frageHilfe.innerHTML = 'Tulis jamnya dalam angka 24 jam, contoh <strong>14:45</strong>. ' +
        (z.h < 12
          ? '<span class="tag-tageszeit tag-tageszeit--am">🌅 vormittags — pagi (00–11)</span>'
          : '<span class="tag-tageszeit tag-tageszeit--pm">🌆 nachmittags — siang/malam (12–23)</span>');
      jawabanBenar = T.digital(z.h, z.m);
      tampilanBenar = T.digital(z.h, z.m) + ' (' + T.offiziellPhrase(z.h, z.m) + ')';
    }

    var form = el('div', 'tipp-feld');
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'tipp-input';
    input.autocomplete = 'off';
    input.autocapitalize = 'off';
    input.spellcheck = false;
    input.placeholder = arahA ? 'z. B. Viertel vor acht' : 'z. B. 14:45';
    if (!arahA) input.inputMode = 'numeric';
    form.appendChild(input);
    d.antwortBuehne.appendChild(form);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !d.btnPruefen.hidden) d.btnPruefen.click();
    });
    setTimeout(function () { input.focus(); }, 50);

    d.btnPruefen.hidden = false;
    this.pruefen = function () {
      var isi = input.value;
      var cocok, nyaris = false;
      if (arahA) {
        // Untuk jam bulat, "sieben" maupun "sieben Uhr" sama-sama diterima.
        var alt = T.inoffiziellPhrase(z.h, z.m, { kurz: true });
        cocok = normalisasi(isi) === normalisasi(jawabanBenar) ||
                normalisasi(isi) === normalisasi(alt);
      } else {
        var rapi = isi.replace(/[.\s]/g, ':').replace(/:+/g, ':').replace(/^0?(\d)/, '$1');
        var bagian = rapi.split(':');
        var jamIsi = parseInt(bagian[0], 10), menitIsi = parseInt(bagian[1], 10);
        cocok = bagian.length === 2 && jamIsi === z.h && menitIsi === z.m;
        // "Nyaris": angkanya benar, hanya pagi/sore yang tertukar (05:20 vs 17:20).
        nyaris = !cocok && bagian.length === 2 && menitIsi === z.m &&
                 !isNaN(jamIsi) && jamIsi % 12 === z.h % 12;
      }
      input.disabled = true;
      input.classList.add(cocok ? 'ist-ok' : 'ist-falsch');
      self.bewerten(cocok, tampilanBenar,
        (nyaris ? '<strong>Hampir benar!</strong> Angka menitnya sudah tepat, ' +
                  'hanya pagi/sore yang tertukar — perhatikan petunjuk ' +
                  (z.h < 12 ? '<em>vormittags</em>' : '<em>nachmittags</em>') + ' di atas soal.<br>' : '') +
        'Jawaban benar: <strong>' + T.markiere(tampilanBenar) + '</strong><br>' +
        '<span class="hinweis-regel">' + regelHinweis(z.m) + '</span>');
    };
  };

  /* ------------------------------------------------------------
     MODE 4 — Wann ...?  (melatih "Um ..." vs "Es ist ...")
     Daftar pertanyaan bisa Anda tambah sendiri di bawah ini.
     jamMin/jamMax menjaga supaya waktunya masuk akal.
     ------------------------------------------------------------ */
  var KONTEXTE = [
    { de: 'Wann beginnt der Kurs?',        id: 'Kapan kursusnya mulai?',        jamMin: 7,  jamMax: 11 },
    { de: 'Wann stehst du auf?',           id: 'Jam berapa kamu bangun?',       jamMin: 4,  jamMax: 8  },
    { de: 'Wann fährt der Zug ab?',        id: 'Kapan keretanya berangkat?',    jamMin: 6,  jamMax: 21 },
    { de: 'Wann isst du zu Mittag?',       id: 'Kapan kamu makan siang?',       jamMin: 11, jamMax: 14 },
    { de: 'Wann beginnt der Film?',        id: 'Kapan filmnya mulai?',          jamMin: 17, jamMax: 21 },
    { de: 'Wann kommt der Bus?',           id: 'Kapan busnya datang?',          jamMin: 5,  jamMax: 20 },
    { de: 'Wann hast du Deutschunterricht?', id: 'Kapan kamu ada les Jerman?',  jamMin: 8,  jamMax: 18 },
    { de: 'Wann gehst du ins Bett?',       id: 'Jam berapa kamu tidur?',        jamMin: 20, jamMax: 23 },
    { de: 'Wann öffnet die Bäckerei?',     id: 'Kapan toko rotinya buka?',      jamMin: 5,  jamMax: 8  },
    { de: 'Wann endet die Arbeit?',        id: 'Kapan pekerjaan selesai?',      jamMin: 15, jamMax: 18 },
    { de: 'Wann treffen wir uns?',         id: 'Kapan kita bertemu?',           jamMin: 9,  jamMax: 19 },
    { de: 'Wann beginnt das Spiel?',       id: 'Kapan pertandingannya mulai?',  jamMin: 15, jamMax: 20 }
  ];

  Uebung.prototype.modus4 = function () {
    var self = this, d = this.dom;
    var k = acak(KONTEXTE);
    var menit = T.MINUTEN_LEVEL[this.cfg.level] || T.MINUTEN_LEVEL[3];
    var z = {
      h: k.jamMin + Math.floor(Math.random() * (k.jamMax - k.jamMin + 1)),
      m: acak(menit)
    };

    d.frageText.textContent = k.de;
    d.frageHilfe.innerHTML = '<em>' + k.id + '</em> — perhatikan jamnya, lalu pilih jawaban yang benar.';

    var mount = el('div', 'uhr-mount uhr-mount--klein');
    d.frageBuehne.appendChild(mount);
    this.uhr = global.Uhr.createClock(mount, { h: z.h, m: z.m, interactive: false, labels: true });

    var benar = T.um(z.h, z.m, 'inoffiziell');
    var opsi = [benar];

    // Pengecoh terpenting: kalimat benar tapi memakai "Es ist ..."
    opsi.push(T.esIst(z.h, z.m, 'inoffiziell'));

    // Dua pengecoh lain: "Um ..." dengan waktu yang salah
    ablenkerZeiten(z.h, z.m, this.cfg.level, 2).forEach(function (w) {
      opsi.push(T.um(w.h, w.m, 'inoffiziell'));
    });

    // Buang kembaran, pastikan tepat 4 pilihan dan jawaban benar selalu ikut.
    var unik = [];
    opsi.forEach(function (o) { if (unik.indexOf(o) === -1) unik.push(o); });
    while (unik.length < 4) {
      var w = T.zufallsZeit(this.cfg.level, k.jamMin, k.jamMax);
      var kand = T.um(w.h, w.m, 'inoffiziell');
      if (unik.indexOf(kand) === -1) unik.push(kand);
    }

    this.optionenZeigen(kocok(unik.slice(0, 4)), benar, function (gewaehlt) {
      var pakaiEsIst = gewaehlt.indexOf('Es ist') === 0;
      self.bewerten(gewaehlt === benar, benar,
        'Jawaban benar: <strong>' + T.markiere(benar) + '</strong><br>' +
        '<span class="hinweis-regel">' +
        (pakaiEsIst
          ? 'Pertanyaan <em>Wann…?</em> dijawab dengan <strong>Um…</strong>, bukan <em>Es ist…</em>. ' +
            '<em>Es ist…</em> hanya untuk menjawab <em>Wie spät ist es?</em>'
          : 'Pertanyaan <em>Wann…?</em> selalu dijawab dengan <strong>Um…</strong> + waktu.') +
        '</span>');
    });
  };

  /* ------------------------------------------------------------
     Menampilkan 4 pilihan jawaban
     ------------------------------------------------------------ */
  Uebung.prototype.optionenZeigen = function (opsi, benar, onPilih) {
    var d = this.dom;
    var box = el('div', 'optionen');
    opsi.forEach(function (teks) {
      var b = el('button', 'option-btn', T.markiere(teks));
      b.addEventListener('click', function () {
        if (box.classList.contains('ist-gesperrt')) return;
        box.classList.add('ist-gesperrt');
        Array.prototype.forEach.call(box.children, function (c) {
          if (c.dataset.teks === benar) c.classList.add('ist-richtig');
        });
        if (teks !== benar) b.classList.add('ist-falsch');
        onPilih(teks);
      });
      b.dataset.teks = teks;
      box.appendChild(b);
    });
    d.antwortBuehne.appendChild(box);
  };

  /* ------------------------------------------------------------
     Menilai jawaban + menampilkan umpan balik
     ------------------------------------------------------------ */
  Uebung.prototype.bewerten = function (cocok, jawaban, penjelasanHtml) {
    var d = this.dom;
    if (cocok) this.benar++;
    this.punkteZeigen();

    d.feedback.hidden = false;
    d.feedback.className = 'feedback ' + (cocok ? 'feedback--ok' : 'feedback--falsch');
    d.feedback.innerHTML =
      '<div class="feedback-kopf">' + (cocok ? '✓ Richtig!' : '✗ Leider falsch') + '</div>' +
      '<div class="feedback-body">' + penjelasanHtml + '</div>';

    d.btnPruefen.hidden = true;
    d.btnWeiter.hidden = false;
    d.btnWeiter.textContent = this.nr >= SOAL_PER_SESI ? 'Ergebnis ansehen →' : 'Weiter →';
    d.btnWeiter.focus();
  };

  /* ------------------------------------------------------------
     Layar hasil akhir
     ------------------------------------------------------------ */
  Uebung.prototype.ergebnisZeigen = function () {
    var d = this.dom, self = this;
    var persen = Math.round(this.benar / SOAL_PER_SESI * 100);
    var pesan = persen === 100 ? 'Perfekt! Sempurna 🎉'
              : persen >= 80 ? 'Sehr gut! Tinggal sedikit lagi.'
              : persen >= 60 ? 'Gut! Ulangi sekali lagi supaya makin lancar.'
              : 'Noch üben! Baca lagi tab <strong>Erklärung</strong>, lalu coba lagi.';

    d.frageNr.textContent = 'Ergebnis';
    d.frageText.textContent = 'Fertig!';
    d.frageHilfe.innerHTML = '';
    d.frageBuehne.innerHTML = '';
    d.feedback.hidden = true;
    d.btnPruefen.hidden = true;
    d.btnWeiter.hidden = true;

    var box = el('div', 'ergebnis');
    box.innerHTML =
      '<div class="ergebnis-zahl">' + this.benar + ' / ' + SOAL_PER_SESI + '</div>' +
      '<div class="ergebnis-prozent">' + persen + '%</div>' +
      '<p class="ergebnis-text">' + pesan + '</p>';
    var again = el('button', 'start-btn', 'Nochmal üben ↻');
    again.addEventListener('click', function () { self.start(self.cfg); });
    box.appendChild(again);
    d.antwortBuehne.innerHTML = '';
    d.antwortBuehne.appendChild(box);
  };

  global.Uebungen = { Uebung: Uebung, SOAL_PER_SESI: SOAL_PER_SESI };
})(window);
