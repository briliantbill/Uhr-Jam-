/* ============================================================
   clock.js
   Jam analog SVG + logika jarum yang bisa digeser (mouse & sentuhan).
   Dipakai ulang di halaman "Die Uhr" dan di mode latihan.
   ============================================================ */

(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------
     UKURAN JAM (silakan diubah kalau mau proporsi lain)
     Semua dalam satuan viewBox 440 x 440, jadi tetap responsif.
     ------------------------------------------------------------ */
  var CX = 220, CY = 220;   // titik pusat
  var R_RAND = 170;         // radius lingkaran jam
  var R_ZAHL = 132;         // radius angka 1-12
  var R_MIN_LABEL = 202;    // radius angka menit (05, 10, ...) di luar
  var LEN_STUNDE = 92;      // panjang jarum jam (pendek)
  var LEN_MINUTE = 145;     // panjang jarum menit (panjang)

  function svgEl(tag, attrs) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  // Titik pada sudut tertentu. Sudut 0 = jam 12, searah jarum jam.
  function titik(sudutDeg, radius) {
    var r = (sudutDeg - 90) * Math.PI / 180;
    return { x: CX + radius * Math.cos(r), y: CY + radius * Math.sin(r) };
  }

  // Jarak dari sebuah titik ke ruas garis pusat->ujung jarum.
  // Dipakai untuk menebak jarum mana yang sedang disentuh murid.
  function jarakKeJarum(px, py, sudutDeg, panjang) {
    var u = titik(sudutDeg, panjang);
    var vx = u.x - CX, vy = u.y - CY;
    var wx = px - CX, wy = py - CY;
    var t = (wx * vx + wy * vy) / (vx * vx + vy * vy);
    t = Math.max(0, Math.min(1, t));
    var dx = wx - t * vx, dy = wy - t * vy;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function normalisasiSudut(a) {
    return ((a % 360) + 360) % 360;
  }

  /* ============================================================
     createClock(mount, opsi)
       mount    : elemen HTML tempat jam dipasang
       opsi.h   : jam awal 0-23
       opsi.m   : menit awal
       opsi.interactive : true = jarum bisa digeser
       opsi.onChange    : dipanggil setiap waktu berubah -> fn(h, m)
       opsi.labels      : tampilkan label "Stunde"/"Minute" di jarum
     ============================================================ */
  function createClock(mount, opsi) {
    opsi = opsi || {};

    var cfg = {
      interactive: opsi.interactive !== false,
      labels: opsi.labels !== false,
      onChange: opsi.onChange || function () {}
    };

    var state = {
      h: typeof opsi.h === 'number' ? opsi.h : 7,
      m: typeof opsi.m === 'number' ? opsi.m : 30
    };

    var svg = svgEl('svg', {
      viewBox: '0 0 440 440',
      class: 'uhr-svg' + (cfg.interactive ? ' uhr-svg--aktiv' : ''),
      xmlns: NS
    });

    /* ---------- Muka jam ---------- */
    svg.appendChild(svgEl('circle', {
      cx: CX, cy: CY, r: R_RAND + 14, class: 'uhr-aussen'
    }));
    var ring = svgEl('circle', { cx: CX, cy: CY, r: R_RAND, class: 'uhr-flaeche' });
    svg.appendChild(ring);

    // Garis menit (60 buah); yang kelipatan 5 dibuat lebih tebal.
    for (var i = 0; i < 60; i++) {
      var besar = i % 5 === 0;
      var a = i * 6;
      var p1 = titik(a, R_RAND - (besar ? 18 : 9));
      var p2 = titik(a, R_RAND - 2);
      svg.appendChild(svgEl('line', {
        x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y,
        class: besar ? 'uhr-strich uhr-strich--gross' : 'uhr-strich'
      }));
    }

    // Penanda khusus di 12, 3, 6, 9 supaya murid cepat orientasi.
    [0, 3, 6, 9].forEach(function (jam) {
      var p = titik(jam * 30, R_ZAHL);
      svg.appendChild(svgEl('circle', {
        cx: p.x, cy: p.y, r: 27, class: 'uhr-viertelmarke'
      }));
    });

    // Angka 1-12
    for (var j = 1; j <= 12; j++) {
      var pz = titik(j * 30, R_ZAHL);
      var t = svgEl('text', {
        x: pz.x, y: pz.y,
        class: 'uhr-zahl' + (j % 3 === 0 ? ' uhr-zahl--haupt' : ''),
        'text-anchor': 'middle', 'dominant-baseline': 'central'
      });
      t.textContent = j;
      svg.appendChild(t);
    }

    // Angka menit di luar (00, 05, 10 ...) — bantuan membaca jarum panjang.
    for (var k = 0; k < 60; k += 5) {
      var pm = titik(k * 6, R_MIN_LABEL);
      var tm = svgEl('text', {
        x: pm.x, y: pm.y, class: 'uhr-minutenzahl',
        'text-anchor': 'middle', 'dominant-baseline': 'central'
      });
      tm.textContent = k < 10 ? '0' + k : String(k);
      svg.appendChild(tm);
    }

    /* ---------- Jarum ---------- */
    // Jarum jam (pendek, warna oranye) — kelas .jarum-stunde ada di style.css
    var gStunde = svgEl('g', { class: 'jarum jarum-stunde' });
    var lStunde = svgEl('line', {
      x1: CX, y1: CY, x2: CX, y2: CY - LEN_STUNDE, class: 'jarum-linie'
    });
    var hitStunde = svgEl('line', {
      x1: CX, y1: CY, x2: CX, y2: CY - LEN_STUNDE, class: 'jarum-hit'
    });
    gStunde.appendChild(lStunde);
    gStunde.appendChild(hitStunde);

    // Jarum menit (panjang, warna biru)
    var gMinute = svgEl('g', { class: 'jarum jarum-minute' });
    var lMinute = svgEl('line', {
      x1: CX, y1: CY, x2: CX, y2: CY - LEN_MINUTE, class: 'jarum-linie'
    });
    var hitMinute = svgEl('line', {
      x1: CX, y1: CY, x2: CX, y2: CY - LEN_MINUTE, class: 'jarum-hit'
    });
    gMinute.appendChild(lMinute);
    gMinute.appendChild(hitMinute);

    svg.appendChild(gStunde);
    svg.appendChild(gMinute);

    // Label kecil yang menempel di jarum supaya tidak tertukar.
    var labelStunde, labelMinute;
    if (cfg.labels) {
      labelStunde = buatLabel('Stunde', 'label-stunde');
      labelMinute = buatLabel('Minute', 'label-minute');
      svg.appendChild(labelStunde.g);
      svg.appendChild(labelMinute.g);
    }

    function buatLabel(teks, kelas) {
      var g = svgEl('g', { class: 'jarum-label ' + kelas });
      var rect = svgEl('rect', {
        x: -32, y: -13, width: 64, height: 26, rx: 13, class: 'jarum-label-bg'
      });
      var txt = svgEl('text', {
        x: 0, y: 1, 'text-anchor': 'middle', 'dominant-baseline': 'central',
        class: 'jarum-label-text'
      });
      txt.textContent = teks;
      g.appendChild(rect);
      g.appendChild(txt);
      return { g: g };
    }

    // Titik pusat
    svg.appendChild(svgEl('circle', { cx: CX, cy: CY, r: 12, class: 'uhr-mitte' }));
    svg.appendChild(svgEl('circle', { cx: CX, cy: CY, r: 5, class: 'uhr-mitte-innen' }));

    mount.appendChild(svg);

    /* ---------- Menggambar ulang posisi jarum ---------- */
    function render() {
      var sudutM = state.m * 6;
      // Jarum jam ikut bergerak sedikit mengikuti menit (seperti jam asli).
      var sudutS = (state.h % 12) * 30 + state.m * 0.5;

      gMinute.setAttribute('transform', 'rotate(' + sudutM + ' ' + CX + ' ' + CY + ')');
      gStunde.setAttribute('transform', 'rotate(' + sudutS + ' ' + CX + ' ' + CY + ')');

      if (cfg.labels) {
        var ps = titik(sudutS, LEN_STUNDE * 0.62);
        var pm2 = titik(sudutM, LEN_MINUTE * 0.84);
        labelStunde.g.setAttribute('transform', 'translate(' + ps.x + ' ' + ps.y + ')');
        labelMinute.g.setAttribute('transform', 'translate(' + pm2.x + ' ' + pm2.y + ')');
      }
    }

    function setTime(h, m, diam) {
      state.h = ((h % 24) + 24) % 24;
      state.m = ((m % 60) + 60) % 60;
      render();
      if (!diam) cfg.onChange(state.h, state.m);
    }

    /* ---------- Interaksi geser (mouse + sentuhan) ---------- */
    var seret = null;          // 'stunde' | 'minute' | null
    var sudutMenitTerakhir = null;

    function koordinatSvg(ev) {
      var r = svg.getBoundingClientRect();
      // viewBox 440 dipetakan ke ukuran nyata di layar
      var skala = 440 / r.width;
      return {
        x: (ev.clientX - r.left) * skala,
        y: (ev.clientY - r.top) * (440 / r.height)
      };
    }

    function mulaiSeret(ev) {
      if (!cfg.interactive) return;
      var p = koordinatSvg(ev);
      var sudutS = (state.h % 12) * 30 + state.m * 0.5;
      var sudutM = state.m * 6;

      var dS = jarakKeJarum(p.x, p.y, sudutS, LEN_STUNDE);
      var dM = jarakKeJarum(p.x, p.y, sudutM, LEN_MINUTE);

      // Klik jauh di luar kedua jarum: pilih jarum menit bila dekat pinggir.
      var jarakPusat = Math.hypot(p.x - CX, p.y - CY);
      if (jarakPusat > R_RAND + 20) return;

      seret = dS <= dM ? 'stunde' : 'minute';
      sudutMenitTerakhir = null;
      svg.classList.add('is-dragging');
      (seret === 'stunde' ? gStunde : gMinute).classList.add('is-active');
      if (svg.setPointerCapture && ev.pointerId !== undefined) {
        try { svg.setPointerCapture(ev.pointerId); } catch (e) {}
      }
      geser(ev);
      ev.preventDefault();
    }

    function geser(ev) {
      if (!seret) return;
      var p = koordinatSvg(ev);

      // Dekat titik pusat sudutnya melompat-lompat; abaikan saja supaya
      // jarum tidak berputar liar kalau jari murid lewat tengah jam.
      if (Math.hypot(p.x - CX, p.y - CY) < 34) { ev.preventDefault(); return; }

      var sudut = normalisasiSudut(Math.atan2(p.x - CX, CY - p.y) * 180 / Math.PI);

      if (seret === 'minute') {
        // SNAP ke kelipatan 5 menit supaya tidak muncul waktu aneh (7:13).
        var menit = (Math.round(sudut / 30) * 5) % 60;

        // Kalau jarum menit melewati angka 12, jamnya ikut maju/mundur.
        if (sudutMenitTerakhir !== null) {
          var delta = sudut - sudutMenitTerakhir;
          if (delta > 180) state.h = (state.h + 23) % 24;       // mundur lewat 12
          else if (delta < -180) state.h = (state.h + 1) % 24;  // maju lewat 12
        }
        sudutMenitTerakhir = sudut;
        setTime(state.h, menit);
      } else {
        // Jarum jam: kurangi dulu geseran akibat menit, lalu bulatkan ke jam terdekat.
        var sudutMurni = normalisasiSudut(sudut - state.m * 0.5);
        var jam12 = Math.round(sudutMurni / 30) % 12;
        var pm = state.h >= 12;                 // pertahankan pagi/sore
        var h24 = (jam12 % 12) + (pm ? 12 : 0);
        setTime(h24, state.m);
      }
      ev.preventDefault();
    }

    function selesaiSeret() {
      if (!seret) return;
      gStunde.classList.remove('is-active');
      gMinute.classList.remove('is-active');
      svg.classList.remove('is-dragging');
      seret = null;
      sudutMenitTerakhir = null;
    }

    if (cfg.interactive) {
      // Pointer events menangani mouse, sentuhan, dan pen sekaligus.
      svg.addEventListener('pointerdown', mulaiSeret);
      svg.addEventListener('pointermove', geser);
      svg.addEventListener('pointerup', selesaiSeret);
      svg.addEventListener('pointercancel', selesaiSeret);
      svg.addEventListener('pointerleave', selesaiSeret);
    }

    render();

    /* ---------- API yang dipakai modul lain ---------- */
    return {
      svg: svg,
      setTime: setTime,
      // setTimeStill = ubah waktu tanpa memicu onChange (untuk memasang soal)
      setTimeStill: function (h, m) { setTime(h, m, true); },
      getTime: function () { return { h: state.h, m: state.m }; },
      setInteractive: function (aktif) {
        cfg.interactive = !!aktif;
        svg.classList.toggle('uhr-svg--aktiv', !!aktif);
        if (aktif) {
          svg.addEventListener('pointerdown', mulaiSeret);
          svg.addEventListener('pointermove', geser);
          svg.addEventListener('pointerup', selesaiSeret);
          svg.addEventListener('pointercancel', selesaiSeret);
          svg.addEventListener('pointerleave', selesaiSeret);
        }
      },
      // Warnai pinggiran jam: 'ok' hijau, 'falsch' merah, null netral
      setStatus: function (s) {
        ring.classList.remove('ist-ok', 'ist-falsch');
        if (s === 'ok') ring.classList.add('ist-ok');
        if (s === 'falsch') ring.classList.add('ist-falsch');
      },
      setOnChange: function (fn) { cfg.onChange = fn || function () {}; }
    };
  }

  global.Uhr = { createClock: createClock };
})(window);
