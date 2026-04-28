# Product Requirements Document (PRD)

## Proyek
**Sistem Monitoring Lokasi WBP (Silo WBP)**  
Platform: Website (Responsive)  
Versi: 1.0  

---

## 1. Pendahuluan

### 1.1 Latar Belakang
Pengawasan terhadap pergerakan Warga Binaan Pemasyarakatan (WBP) di dalam Lapas merupakan aspek krusial dalam menjaga keamanan dan ketertiban. Proses monitoring yang tidak real-time berpotensi menimbulkan risiko kehilangan jejak pergerakan WBP.

Sistem ini dikembangkan untuk memungkinkan pelacakan posisi WBP secara real-time saat berada di luar kamar hunian menuju unit layanan seperti Klinik, Registrasi, dan Kunjungan.

### 1.2 Tujuan
- Meningkatkan keamanan operasional Lapas
- Meningkatkan akuntabilitas petugas
- Menyediakan data pergerakan WBP yang akurat dan real-time
- Mengurangi kesalahan pencatatan manual

---

## 2. User Roles & Permissions

| Role | Deskripsi | Hak Akses |
|------|----------|----------|
| Superadmin | Pimpinan / Ka. KPLP | Full access, audit log, force reset |
| Admin | Staf Administrasi | CRUD data WBP, laporan |
| Petugas Pintu 3 | Checkpoint utama | Input keberangkatan & kepulangan |
| Petugas Ruangan | Klinik / Registrasi / Kunjungan | Konfirmasi kedatangan & selesai |

---

## 3. Spesifikasi Data WBP

Atribut minimal:
- Nomor Registrasi (Primary Key)
- Nama Lengkap
- Asal Kamar (Blok & Nomor)
- Foto WBP (Opsional)

---

## 4. Business Logic

### 4.1 Input Master
- Admin menginput data WBP

### 4.2 Keberangkatan
- WBP keluar melalui Pintu 3
- Petugas:
  - Cari WBP
  - Klik "Kirim ke [Tujuan]"
- Status: `Transit`

### 4.3 Kedatangan
- Petugas ruangan:
  - Melihat daftar transit
  - Klik "Konfirmasi Sampai"
- Sistem mencatat:
  - Jam masuk
  - Petugas penerima

### 4.4 Kepulangan
- Petugas ruangan klik:
  - "Selesai & Kembalikan"
- Petugas Pintu 3:
  - Konfirmasi WBP kembali

---

## 5. Fitur Utama

### 5.1 Dashboard Monitoring (Real-Time)

Terdiri dari 3 kolom:

#### Klinik
- Nama WBP
- Jam masuk
- Durasi
- Petugas

#### Registrasi
- Nama WBP
- Jam masuk
- Durasi
- Petugas

#### Kunjungan
- Nama WBP
- Jam masuk
- Durasi
- Petugas

**Alert System:**
- Durasi > 60 menit → warna merah
- (Opsional) notifikasi visual/audio

---

### 5.2 Modul Admin
- Tambah/Edit/Hapus WBP
- Upload foto
- Manajemen akun (Superadmin)

---

### 5.3 Modul Log & Laporan

Mencatat:
- WBP
- Lokasi asal & tujuan
- Waktu
- Petugas

Output:
- Laporan harian
- Laporan bulanan
- Export PDF / Excel

---

## 6. UI/UX Concept

### Dashboard Admin
- Tabel data WBP
- Search cepat
- Tombol aksi (Edit/Delete)

### Interface Pintu 3
- Search bar cepat
- Tombol besar:
  - KE KLINIK
  - KE REGISTRASI
  - KE KUNJUNGAN

### Dashboard Monitoring
- 3 kolom besar
- Durasi real-time
- Indikator warna:
  - Hijau: Normal
  - Kuning: Warning
  - Merah: Overlimit

---

## 7. Non-Functional Requirements

### 7.1 Keamanan
- Single session login
- Enkripsi password (bcrypt/argon2)
- Audit trail (Superadmin)

### 7.2 Performa
- Pencarian < 2 detik
- Real-time update (WebSocket / polling)

### 7.3 Responsiveness
- Optimal di tablet & desktop

---

## 8. Rekomendasi Teknis

### Arsitektur
- Frontend: React / Vue
- Backend: Node.js / Laravel
- Database: PostgreSQL / MySQL
- Real-time: WebSocket (Socket.IO / Pusher)

---

## 9. Future Development

- QR Code / RFID tracking
- Face recognition
- Notifikasi WhatsApp / Telegram
- Integrasi CCTV

---

## 10. Risiko & Mitigasi

| Risiko | Mitigasi |
|--------|---------|
| Petugas lupa input | Reminder / alert |
| Data tidak real-time | Gunakan WebSocket |
| Human error | Validasi + foto |
| Data besar | Indexing + pagination |

---
