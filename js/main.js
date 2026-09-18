/* ============================================================
   main.js
   Navigasi tab, jam utama, dan penyambung ke modul latihan.
   ============================================================ */

(function () {
  'use strict';

  var T = window.TimeDE;
  var $ = function (id) { return document.getElementById(id); };

  /* ============================================================
     NAVIGASI TAB
     ============================================================ */
  var tabs = document.querySelectorAll('.tab');
  var panels = document.querySelectorAll('.panel');

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabs.forEach(function (b) { b.classList.remove('is-aktiv'); });
      panels.forEach(function (p) { p.classList.remove('is-aktiv'); });
      btn.classList.add('is-aktiv');
      $('tab-' + btn.dataset.tab).classList.add('is-aktiv');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  /* ============================================================
     TAB 1 — JAM UTAMA
     ============================================================ */
  var hauptUhr = window.Uhr.createClock($('uhr-haupt'), {
    h: 14, m: 45, interactive: true, labels: true,
    onChange: anzeigeAktualisieren
  });

  function anzeigeAktualisieren(h, m) {
    $('digital').textContent = T.digital(h, m);
    $('satz-inoffiziell').innerHTML = T.markiere(T.esIst(h, m, 'inoffiziell'));
    $('satz-offiziell').innerHTML = T.markiere(T.esIst(h, m, 'offiziell'));

    // Tombol pagi/sore ikut menyesuaikan kalau jam melewati tengah hari.
    var pm = h >= 12;
    document.querySelectorAll('.tz-btn').forEach(function (b) {
      b.classList.toggle('is-aktiv', (b.dataset.periode === 'pm') === pm);
    });
  }

  // Tombol vormittags / nachmittags: menggeser 12 jam tanpa mengubah tampilan jarum.
  document.querySelectorAll('.tz-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = hauptUhr.getTime();
      var jam12 = t.h % 12;
      hauptUhr.setTime(b.dataset.periode === 'pm' ? jam12 + 12 : jam12, t.m);
    });
  });

  // Tombol cepat: geser waktu dalam satuan menit.
  document.querySelectorAll('.schnellwahl [data-schritt]').forEach(function (b) {
    b.addEventListener('click', function () {
      var t = hauptUhr.getTime();
      var total = (t.h * 60 + t.m + parseInt(b.dataset.schritt, 10) + 1440) % 1440;
      hauptUhr.setTime(Math.floor(total / 60), total % 60);
    });
  });

  // "Jetzt" = waktu sekarang, dibulatkan ke kelipatan 5 menit.
  $('btn-jetzt').addEventListener('click', function () {
    var n = new Date();
    var total = (n.getHours() * 60 + Math.round(n.getMinutes() / 5) * 5) % 1440;
    hauptUhr.setTime(Math.floor(total / 60), total % 60);
  });

  anzeigeAktualisieren(14, 45);

  /* ============================================================
     TAB 2 — LATIHAN
     ============================================================ */
  var dom = {
    frageNr: $('frage-nr'),
    frageText: $('frage-text'),
    frageHilfe: $('frage-hilfe'),
    frageBuehne: $('frage-buehne'),
    antwortBuehne: $('antwort-buehne'),
    feedback: $('feedback'),
    btnPruefen: $('btn-pruefen'),
    btnWeiter: $('btn-weiter'),
    punkteText: $('punkte-text'),
    punkteFuell: $('punkte-fuell')
  };

  var uebung = new window.Uebungen.Uebung(dom);
  var wahl = { modus: 1, level: 1, system: 'inoffiziell' };

  // Pemilih mode / level / sistem
  function gruppe(containerId, kunci, umwandeln) {
    $(containerId).addEventListener('click', function (e) {
      var b = e.target.closest('button');
      if (!b) return;
      Array.prototype.forEach.call(this.children, function (c) {
        c.classList.remove('is-gewaehlt');
      });
      b.classList.add('is-gewaehlt');
      wahl[kunci] = umwandeln(b.dataset[kunci]);
      if (kunci === 'modus') systemWahlZeigen();
    });
  }

  gruppe('modus-liste', 'modus', Number);
  gruppe('level-liste', 'level', Number);
  gruppe('system-liste', 'system', String);

  // Pilihan sistem hanya relevan untuk Modus 1.
  // Modus 2 selalu inoffiziell, Modus 3 sudah konversi dua arah,
  // Modus 4 memakai inoffiziell.
  function systemWahlZeigen() {
    $('system-wahl-wrap').hidden = wahl.modus !== 1;
  }
  systemWahlZeigen();

  $('btn-start').addEventListener('click', function () {
    $('uebung-setup').hidden = true;
    $('uebung-lauf').hidden = false;
    uebung.start({ modus: wahl.modus, level: wahl.level, system: wahl.system });
  });

  $('btn-zurueck').addEventListener('click', function () {
    $('uebung-lauf').hidden = true;
    $('uebung-setup').hidden = false;
  });

  $('btn-pruefen').addEventListener('click', function () {
    if (uebung.pruefen) uebung.pruefen();
  });

  $('btn-weiter').addEventListener('click', function () {
    uebung.naechsteAufgabe();
  });

  /* ============================================================
     TAB 3 — TABEL REFERENSI (dibuat dari timeToGerman.js
     supaya isinya tidak pernah beda dengan logika aplikasi)
     ============================================================ */
  var INDONESISCH = {
    0:  'jam tujuh',
    5:  'tujuh lewat lima',
    10: 'tujuh lewat sepuluh',
    15: 'tujuh lewat seperempat',
    20: 'tujuh lewat dua puluh',
    25: 'setengah delapan kurang lima',
    30: 'setengah delapan',
    35: 'setengah delapan lewat lima',
    40: 'delapan kurang dua puluh',
    45: 'delapan kurang seperempat',
    50: 'delapan kurang sepuluh',
    55: 'delapan kurang lima'
  };

  var tbody = document.querySelector('#referenz-tabelle tbody');
  for (var m = 0; m < 60; m += 5) {
    var tr = document.createElement('tr');
    // Baris 25/30/35 disorot karena inilah bagian tersulit.
    if (m === 25 || m === 30 || m === 35) tr.className = 'zeile--knifflig';
    tr.innerHTML =
      '<td class="zelle-zeit">' + T.digital(7, m) + '</td>' +
      '<td class="zelle-de">' + T.markiere(T.inoffiziellPhrase(7, m)) + '</td>' +
      '<td class="zelle-off">' + T.offiziellPhrase(19, m) + '</td>' +
      '<td class="zelle-id">' + INDONESISCH[m] + '</td>';
    tbody.appendChild(tr);
  }
})();
