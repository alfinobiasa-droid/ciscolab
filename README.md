# NetLab - Interactive Cisco Networking Lab

Web app belajar Cisco IOS untuk siswa SMK/TKJ. Tanpa backend, data progres disimpan di localStorage.

## Menjalankan
```
npm install
npm run dev      # buka alamat yang tampil di terminal
npm run build    # hasil di folder dist/
```

## Struktur
- index.html: kerangka halaman (header, area konten, bottom nav)
- src/main.js: titik masuk, router (render, go, navigasi bawah), dan event global
- src/core.js: state bersama, localStorage (store), XP/level, helper DOM (\$, esc, hl, toast)
- src/pages/home.js: daftar modul, pencarian dan filter kategori
- src/pages/lesson.js: halaman detail modul, materi, dan mini quiz
- src/pages/quiz.js: kuis acak, mode latihan dan mode ujian (timer, pembahasan), XP, streak, hasil
- src/pages/sandbox.js: tampilan terminal Sandbox (input, chip command, simpan state)
- src/sim/engine.js: mesin simulator Router dan Switch (parser command, show, config; termasuk DHCP, NAT/PAT, ACL standar dan extended, serta perintah simulate untuk menguji ACL)
- src/sim/net.js: helper IP (validasi, mask, network address)
- src/pages/quest.js: quest; aturan pemeriksa (RULES) membaca kondisi simulator
- src/pages/trouble.js: kasus troubleshooting
- src/pages/subnet.js: kalkulator subnet
- src/pages/reference.js: cheat sheet dan kamus
- src/pages/search.js: pencarian global
- src/pages/settings.js: menu progres (ekspor, impor, reset)
- src/style.css: seluruh gaya (mobile-first)
- src/data/modules.json: 6 modul
- src/data/lessons.json: 18 materi. Format tiap materi: [judul, penjelasan, contoh, tips, pertanyaan, pilihan, indeks jawaban]
- src/data/questions.json: bank soal (id, category, difficulty, question, code, options, answer, explanation, xp)
- src/data/commands.json: cheat sheet. Format: [kategori, command, keterangan]
- src/data/quests.json: daftar quest dan target berbasis rule
- src/data/glossary.json: kamus. Format: [istilah, definisi, contoh, command terkait]

## Catatan
- Quest didefinisikan di src/data/quests.json. Tiap target punya rule, misalnya {"test":"vlan_exists","dev":"switch","id":10}. Jenis rule ada di RULES pada src/pages/quest.js.
- Untuk menambah soal, tambahkan objek baru di questions.json (id harus unik).

## Deploy otomatis ke GitHub Pages
File .github/workflows/deploy.yml membangun dan memasang situs setiap push ke branch main. Aktifkan sekali di repo: Settings > Pages > Source: GitHub Actions.

## Materi dari arsip jobsheet
Modul 8 (Keamanan Jaringan) dan Modul 9 (Linux Debian dan Layanan Server) disusun dari jobsheet kelas XI TKJ, ditambah materi VLAN antar lantai, praktik 3 router, OSPF, EIGRP, dan RIP pada modul 2, 3, dan 4.
