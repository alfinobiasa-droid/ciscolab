<<<<<<< HEAD
# NetLab - Interactive Cisco Networking Lab

Web app belajar Cisco IOS untuk siswa SMK/TKJ. Tanpa backend, data progres disimpan di localStorage.
=======
# NETLAB - Interactive Networking & Linux Learning Lab

Aplikasi belajar jaringan dan Linux berbasis web (Vite + JavaScript biasa, tanpa framework). Semua progres disimpan di localStorage dan aplikasi bisa dipakai offline (PWA).

## Isi (jumlah aktual)
- 11 modul, 57 materi (22 materi berformat detail: modul 1, 2, 3), 209 soal, 15 quest, 5 Incident Lab, 7 badge
- Sandbox: Router Simulator, Switch Simulator, Linux Filesystem Simulator (bukan Debian penuh)
- Linux Installation Lab (simulasi instalasi Debian, hasilnya dipakai Linux Filesystem Simulator)
- Troubleshooting (10 kasus) dan Incident Lab (5 lab interaktif) dengan hint bertingkat
- Mode ujian, review jawaban, riwayat kuis, kalkulator subnet, cheat sheet, kamus, pencarian global
- Ekspor/impor progres, tema gelap/terang, PWA
>>>>>>> 640f27d (Audit and feature improvements)

## Menjalankan
```
npm install
<<<<<<< HEAD
npm run dev      # buka alamat yang tampil di terminal
npm run build    # hasil di folder dist/
```

## Struktur
- index.html: kerangka halaman (header, area konten, bottom nav)
- src/main.js: titik masuk, router (render, go, navigasi bawah), dan event global
- src/core.js: state bersama, localStorage (store), XP/level, helper DOM (\$, esc, hl, toast)
- src/pages/dashboard.js: halaman Home (level, XP, lanjutkan belajar, statistik, quest harian, rekomendasi)
- src/pages/netview.js: topologi live dari state simulator (status node, tooltip, klik node membuka Sandbox)
- src/pages/lab.js: lab troubleshooting interaktif (topologi berstatus, terminal, 5 skenario Easy/Medium/Hard)
- src/pages/badges.js: badge dan notifikasi unlock
- src/pages/home.js: daftar modul, pencarian dan filter kategori
- src/pages/lesson.js: halaman detail modul, materi, dan mini quiz
- src/pages/quiz.js: kuis acak, mode latihan dan mode ujian (timer, pembahasan), XP, streak, hasil
- src/pages/sandbox.js: tampilan terminal Sandbox (input, chip command, simpan state)
- src/sim/engine.js: mesin simulator Router dan Switch (parser command, show, config; termasuk DHCP, NAT/PAT, ACL standar dan extended, RIP/OSPF/EIGRP, perintah simulate untuk menguji ACL, dan shell Linux simulasi dengan filesystem virtual)
- src/sim/net.js: helper IP (validasi, mask, network address)
- src/pages/quest.js: quest; aturan pemeriksa (RULES) membaca kondisi simulator
- src/pages/trouble.js: kasus troubleshooting
- src/pages/subnet.js: kalkulator subnet
- src/pages/reference.js: cheat sheet dan kamus
- src/pages/search.js: pencarian global
- src/pwa.js: mendaftarkan service worker (hanya pada build produksi)
- public/sw.js, public/manifest.webmanifest, public/icons: berkas PWA agar aplikasi bisa dipasang dan berjalan offline
- src/pages/settings.js: menu (progres, penguasaan per kategori, riwayat kuis, ekspor/impor/reset)
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

## Mode offline (PWA)
Setelah situs dibuka sekali lewat internet, berkas disimpan oleh service worker sehingga aplikasi tetap bisa dibuka tanpa sinyal dan bisa dipasang ke layar utama HP. Perubahan baru muncul pada kunjungan berikutnya. Naikkan nilai CACHE di public/sw.js bila ingin memaksa cache lama dibuang.

## Aksesibilitas
Setiap halaman punya satu judul h1, ada tautan "Lewati ke konten", pesan status dan umpan balik jawaban diumumkan lewat live region, dan semua tombol serta kolom input punya nama yang terbaca pembaca layar.

## Desain
Tema gelap navy sebagai default (token warna di :root pada src/style.css), tema terang lewat tombol bulan. Font: Inter dan JetBrains Mono dari Google Fonts, dengan fallback system sans dan monospace saat offline.

## Progres modul
Progres dihitung dari langkah yang benar-benar selesai (mini quiz benar). Kartu modul menampilkan Mulai Modul, Lanjutkan Modul, atau Modul Selesai (hijau) sesuai persentase. Dashboard memprioritaskan modul yang sedang dikerjakan (1-99%), lalu modul pertama yang belum dimulai, dan menampilkan layar "Semua Modul Selesai" bila semua 100%. Data progres lama dimigrasikan otomatis (kunci lessonsV).

## Format materi
Setiap langkah materi adalah array: [judul, ringkasan, command, tips, pertanyaan, pilihan, indeks jawaban, x]. Elemen x (opsional) berisi what, why, ex, res, err, practice, qwhy, cmds, dan table. Bila x ada, halaman menampilkan Apa itu?, Kenapa digunakan?, Contoh situasi, Command, Hasil yang diharapkan, Kesalahan umum, Tips, dan Praktik di Sandbox. Saat ini modul 1, 2, dan 3 memakai format ini; modul lain memakai tampilan ringkas dan bisa dilengkapi bertahap di src/data/lessons.json.
=======
npm run dev
npm run build
```

## Struktur
- index.html, src/main.js (router dan event global), src/core.js (state, storage, XP, streak harian)
- src/pages/*: dashboard, home (daftar modul), lesson, quiz, sandbox, install, quest, trouble, lab, subnet, reference (cheat dan kamus), search, settings, netview (topologi live), badges
- src/sim/engine.js (mesin simulator), src/sim/net.js (helper IP)
- src/data/*.json: modul, materi, soal, command, kamus, quest
- public/: manifest, service worker (cache netlab-v3), ikon

## Simulator (apa yang nyata dan apa yang disederhanakan)
Router, Switch, dan Linux memiliki state sendiri-sendiri. Command benar-benar mengubah state itu, dan perintah show membaca state aktual. Topologi di Dashboard dan Sandbox membaca state tersebut.
- simulate SRC DST PROTO PORT menghasilkan PACKET TRACE: interface sumber, ACL masuk, routing lookup, ACL keluar, NAT, forwarding, lalu RESULT ALLOWED atau DENIED beserta alasannya.
- NAT: tabel translasi terisi dari hasil simulate. DHCP: simulate dhcp CLIENT menjalankan DISCOVER, OFFER, REQUEST, ACK dan mengisi show ip dhcp binding.
- RIP, OSPF, dan EIGRP hanya menyimpan konfigurasi dan menampilkannya di show ip protocols. Neighbor dan route dinamis belum disimulasikan.
- Ini bukan emulator jaringan penuh. Perangkat tujuan dianggap ada bila jaringannya terhubung atau punya route.

## Linux Installation Lab
Wizard: Boot, Language, Keyboard, Network (DHCP atau static dengan validasi), Hostname, User, Partition, Bootloader, Review, lalu Install, Reboot, Login. Hanya Debian yang tersedia. Hasil instalasi (hostname, user, IP) dipakai whoami, hostname, pwd, ls, dan ip addr. Reset Installation hanya menghapus state lab dan identitas Linux hasil instalasi, bukan progres lain. XP instalasi (+100) hanya diberikan sekali.

## Streak harian
Streak dihitung dari hari aktif (tanggal lokal), bukan jumlah soal. Streak jawaban benar dalam kuis diberi label Correct streak.

## Format materi
Setiap langkah materi: [judul, ringkasan, command, tips, pertanyaan, pilihan, indeks jawaban, x]. Elemen x (opsional) berisi what, why, ex, res, err, practice, qwhy, cmds, table. Bila ada, halaman menampilkan Apa itu, Kenapa digunakan, Contoh situasi, Command, Hasil, Kesalahan umum, Tips, dan Praktik di Sandbox.

## Progres modul
Progres dihitung dari langkah yang benar-benar selesai. Data lama dimigrasikan otomatis (kunci lessonsV).

## Deploy
.github/workflows/deploy.yml membangun dan memasang situs ke GitHub Pages setiap push ke main (Settings > Pages > Source: GitHub Actions).
>>>>>>> 640f27d (Audit and feature improvements)
