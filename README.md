<div align="center">

# KuroNeko WhatsApp Bot

![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Baileys](https://img.shields.io/badge/Baileys-7.0.0--rc14-blue?style=for-the-badge)
![Sylvatica API](https://img.shields.io/badge/API-Sylvatica-orange?style=for-the-badge)

Bot WhatsApp modular, kaya fitur, dan canggih yang dibangun menggunakan **JavaScript (ES Modules)**, library **Baileys**, serta terintegrasi penuh dengan **[sylvatica.my.id](https://sylvatica.my.id)**.

</div>

---

## 📖 Daftar Isi

- [Tentang KuroNeko](#-tentang-kuroneko)
- [Fitur Utama](#-fitur-utama)
- [Struktur Project](#-struktur-project)
- [Instalasi & Konfigurasi](#-instalasi--konfigurasi)
- [Menjalankan Bot](#-menjalankan-bot)
- [Sistem Database & Fitur Khusus](#-sistem-database--fitur-khusus)
- [Daftar Kategori Plugin & Command](#-daftar-kategori-plugin--command)
- [API Credit & Disclaimer](#-api-credit--disclaimer)

---

## About KuroNeko

**KuroNeko** adalah bot WhatsApp otomatis yang dirancang dengan arsitektur plugin dinamis (auto-load & watch plugins). Bot ini mendukung autentikasi menggunakan **QR Code** maupun **Pairing Code**, serta menyediakan fleksibilitas penyimpanan data menggunakan database **Local JSON** atau **MongoDB**. Sebagian besar fitur AI, downloader, search, dan media processing ditenagai oleh **Sylvatica API**.

---

## Main Fitur

- **Dual Autentikasi:** Mendukung login via **QR Code** atau **Pairing Code** (kode 8 digit via nomor WhatsApp).
- **Auto-Load & Watch Plugins:** Menambahkan atau memodifikasi file plugin di dalam folder `plugins/` dimuat secara otomatis tanpa perlu me-restart bot secara manual.
- **Dual Database Mode:** Bisa menggunakan **Local JSON** (`./database/`) yang ringan atau **MongoDB** (`mongoose`) untuk skalabilitas tinggi.
- **Sistem Limit & Premium:** Manajemen limit per penggunaan command, sistem top-up/beli limit, klaim harian/mingguan, serta status pengguna premium.
- **Perlindungan & Manajemen Grup:** Anti-link, Anti-link channel, Anti-tag status WhatsApp, Anti-toxic, Anti-NSFW, Anti-delete message, Auto-admin, Auto-back, Welcome & Left messages, serta penjadwalan buka/tutup grup otomatis.
- **Game Interaktif & Ekonomi:** Berbagai mini-game seru (Family100, Cak Lontong, Tebak Gambar, Asah Otak, Slot, dll) serta sistem perbankan virtual (bank, loan, deposit, bisnis).

---

## Struktur Project

```text
├── index.js              # Entry point utama & event handlers Baileys
├── settings.js           # Konfigurasi global (owner, API key, database, pesan)
├── package.json          # Dependensi project & konfigurasi ESM
├── README.md             # Dokumentasi project
├── database/             # Penyimpanan data lokal (chats.json, groups.json, users.json)
├── session/              # Sesi autentikasi Baileys (kredensial login WhatsApp)
├── src/                  # Core utilities & helper libraries
│   ├── database.js       # Handler database Mongoose & Local JSON
│   ├── function.js       # Helper fungsi tambahan untuk socket
│   ├── limit.js          # Sistem manajemen limit & premium user
│   ├── logger.js         # Logging pesan masuk/keluar
│   ├── serialize.js      # Serialisasi objek pesan WhatsApp
│   └── uploader.js       # Upload media ke external host
├── system/               # Sistem inti & event handler
│   ├── anti.js           # Anti-call, anti-delete, message update handlers
│   ├── auto.js           # Penjadwalan grup & auto functions
│   ├── cli.js            # Command Line Interface interaktif
│   ├── handler.js        # Router pesan & eksekusi command utama
│   ├── loadPlugins.js    # Sistem dynamic loader & watcher plugin
│   ├── participants.js   # Event handler group participants (welcome/left)
│   └── store.js          # Message store caching
└── plugins/              # Kumpulan modul plugin command
    ├── ai/               # AI & Chatbot integrations
    ├── anime/            # Anime & manga info (Kusonime, Otakudesu, MangaDex)
    ├── berita/           # Berita terkini (CNBC, CNN, Detik, Liputan6)
    ├── download/         # Downloader media (TikTok, IG, YT, Spotify, FB, Pinterest)
    ├── economy/          # Sistem ekonomi virtual & bisnis
    ├── events/           # Eval & shell execution
    ├── game/             # Mini-game interaktif
    ├── group/            # Manajemen & proteksi grup WhatsApp
    ├── info/             # Informasi bot, profil, menu, registrasi
    ├── maker/            # Image/video manipulation & maker
    ├── nsfw/             # Konten khusus / NSFW (Nekopoi, dll)
    ├── owner/            # Kontrol eksklusif owner bot
    ├── random/           # Media acak (loli, yuri, dll)
    ├── search/           # Alat pencarian (Google, Spotify, Pinterest, Resep, dll)
    ├── shop/             # Toko/pembelian limit
    ├── stalk/            # Stalking sosial media & GitHub
    ├── sticker/          # Pembuat stiker (Brat, AI Sticker, QC, Emojimix, dll)
    └── tools/            # Utilities (HD, Remove Vocal, Tourl, ToImg, dll)
```

---

## Instalasi & Konfigurasi

### 1. Prasyarat
- [Node.js](v18.x atau lebih baru disarankan)
- [MongoDB](Opsional, jika ingin menggunakan mode database MongoDB)
- Akun WhatsApp (untuk bot)

### 2. Clone & Install Dependensi
```bash
git clone https://github.com/DanzzAraAra/kuroneko-bot-wa
cd kuroneko-bot-wa

npm install
```

### 3. Konfigurasi `settings.js`
Sesuaikan konfigurasi pada file `settings.js` di root folder:
```javascript
const settings = {
    botName: 'KuroNeko',
    ownerName: 'Dandy',
    ownerNumber: ['628xxx@s.whatsapp.net'], // Ganti dengan nomor owner Anda
    prefix: ['!', '.', '#'],
    mode: 'public', // 'public' atau 'self'
    
    // API KuroNeko (Dapatkan di https://sylvatica.my.id)
    api: 'https://sylvatica.my.id',
    key: "YOUR_API_KEY", 
    
    database: {
        mode: "local", // "local" (JSON) atau "mongodb"
        local: {
            path: "./database",
            autosave: true,
            pretty: true
        },
        mongodb: {
            uri: "" // Isi URI MongoDB jika mode "mongodb"
        }
    }
};

export default settings;
```

---

## Run Bot

### Menjalankan Langsung dengan Node.js
```bash
npm start
```
Atau:
```bash
node index.js
```

### Menjalankan dengan PM2 (Production / Background)
Jika Anda menggunakan server VPS, disarankan menggunakan `pm2` agar bot tetap berjalan di background:
```bash
# Install PM2 secara global (jika belum ada)
npm install -g pm2

# Jalankan bot dengan PM2
pm2 start index.js --name "KuroNeko"

# Mengatur agar bot berjalan otomatis saat server reboot
pm2 startup
pm2 save

# Memantau log bot
pm2 logs KuroNeko
```

Saat pertama kali dijalankan, pilih metode login di terminal:
1. **QR Code** (Scan QR dengan WhatsApp di HP)
2. **Pairing Code** (Masukkan nomor WhatsApp Anda, lalu masukkan kode 8 digit yang muncul di WhatsApp).

---

## Sistem Database & Fitur Khusus

1. **Database Mode (`local` / `mongodb`):**
   - **Local:** Menyimpan data pengguna, grup, dan chat ke file JSON di folder `database/`.
   - **MongoDB:** Menggunakan Mongoose untuk menyimpan data secara cloud/skalabel.
2. **Sistem Registrasi (`.register` / `.unreg`):**
   - Pengguna dapat mendaftarkan diri dengan format `.register nama.umur` untuk mengakses fitur tertentu.
3. **Sistem Limit & Premium:**
   - Setiap command memiliki biaya limit (`limit: n`). Pengguna biasa memiliki kuota limit, sedangkan user premium dan owner dibebaskan dari pemotongan limit.
   - Perintah `.daily`, `.weekly`, `.claim`, dan `.buy` tersedia untuk menambah limit atau saldo uang.
4. **Proteksi & Fitur Grup:**
   - Dilengkapi proteksi aktif seperti `antilink`, `antilinkch`, `antitagsw`, `antitoxic`, `antinsfw`, `antidelete`, serta sistem warning (`.warn` & `.cekwarn`) dan penjadwalan buka/tutup grup otomatis (`.schedule`).

---

## Daftar Kategori Plugin & Command

Berikut adalah ringkasan kategori command yang tersedia berdasarkan folder di dalam `plugins/`:

| Kategori | Deskripsi Singkat | Contoh Command |
| :--- | :--- | :--- |
| **AI** (`ai/`) | Kecerdasan buatan & asisten chat pintar | `.ai`, `.chatgpt`, `.flux`, `.perplexity`, `.aiart` |
| **Anime** (`anime/`) | Pencarian info anime, manga, dan genre | `.kusonime_search`, `.mangadex_latest`, `.otakudesu_search` |
| **Berita** (`berita/`) | Informasi berita terkini dari media nasional | `.detik`, `.cnnindo`, `.cnbcindo`, `.liputan6` |
| **Download** (`download/`) | Mengunduh media dari berbagai platform | `.tiktok`, `.instagram`, `.ytmp3`, `.ytmp4`, `.spotifydl`, `.fbdl` |
| **Economy** (`economy/`) | Sistem keuangan virtual, bank, dan bisnis | `.business`, `.bank`, `.transfer` |
| **Game** (`game/`) | Permainan seru interaktif berhadiah | `.caklontong`, `.family100`, `.asahotak`, `.tebakgambar`, `.slot` |
| **Group** (`group/`) | Pengaturan, moderasi, dan proteksi grup | `.antilink`, `.antidelete`, `.hidetag`, `.kick`, `.add`, `.promote`, `.schedule` |
| **Info** (`info/`) | Informasi bot, menu, registrasi, & profil | `.menu`, `.ping`, `.profile`, `.register`, `.daily`, `.topmoney` |
| **Maker** (`maker/`) | Manipulasi gambar & pembuat efek | `.removebg`, `.blurface`, `.tonude` |
| **NSFW** (`nsfw/`) | Konten khusus / dewasa (jika diizinkan) | `.nekopoi_search`, `.hentaivid` |
| **Owner** (`owner/`) | Kontrol administratif khusus pemilik bot | `.ban`, `.premium`, `.addlimit`, `.backup`, `.setpp`, `.mode` |
| **Random** (`random/`) | Konten media acak | `.loli`, `.yuri`, `.ba` |
| **Search** (`search/`) | Alat pencarian informasi & web | `.yts`, `.pinterest`, `.spotify`, `.cuaca`, `.github`, `.resep` |
| **Sticker** (`sticker/`) | Pembuat stiker WhatsApp | `.sticker`, `.brat`, `.emojimix`, `.qc`, `.smeme`, `.aisticker` |
| **Tools** (`tools/`) | Perkakas & utilitas praktis | `.hd`, `.tourl`, `.toimg`, `.tovideo`, `.removevocal`, `.get` |

---

## API Credit

Semua fitur utama pada bot ini didukung penuh oleh:
- **Provider:** [Sylvatica API](https://sylvatica.my.id)

---

## ⚠️ Disclaimer

Gunakan secara bijak dan patuhi Syarat & Ketentuan Layanan (Terms of Service) WhatsApp. Pengembang tidak bertanggung jawab atas penyalahgunaan bot ini.

---
<div align="center">
  <b>&copy; 2026 KuroNeko &bull; Built with ❤️ by DanzzAraAra</b>
</div>
