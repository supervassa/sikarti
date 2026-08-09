# Instruksi Pengembangan Aplikasi PKBM KARTINI

## 1. Gambaran Umum

Buat sebuah aplikasi web Progressive Web App (PWA) untuk **Pusat Kegiatan Belajar Masyarakat (PKBM) KARTINI**.

Aplikasi digunakan untuk mengelola kegiatan akademik, warga belajar (WB), pengajar, jadwal pelajaran, presensi, pendaftaran calon warga belajar, konten/berita PKBM, serta administrasi pengguna.

Aplikasi harus memiliki tampilan **responsive**, sehingga dapat digunakan dengan baik pada:

- Desktop
- Laptop
- Tablet
- Smartphone

Aplikasi harus dapat di-install sebagai **Progressive Web App (PWA)** pada perangkat yang mendukung.

---

# 2. Teknologi yang Digunakan

Gunakan teknologi berikut:

### Frontend

- React.js
- React Router
- JavaScript/TypeScript
- Responsive UI
- PWA
- Service Worker
- Web App Manifest

### Backend / Database

Gunakan:

- Firebase Authentication
- Cloud Firestore
- Firebase Storage
- Firebase Hosting jika diperlukan

### Authentication

Dukung dua metode autentikasi:

1. Google Sign-In
2. Email + Password

Semua jenis pengguna menggunakan **halaman login yang sama**.

Setelah login berhasil, sistem menentukan hak akses pengguna berdasarkan `role`.

---

# 3. Role Pengguna

Sistem memiliki empat jenis role utama:

```text
guest
wb
pengajar
admin
superadmin
```

Struktur akses:

```text
Guest
   │
   ├── Informasi PKBM
   ├── Berita/Kegiatan
   └── Pendaftaran Calon WB

WB
   │
   ├── Dashboard
   ├── Jadwal
   ├── Presensi
   ├── Kehadiran
   └── Profile

Pengajar
   │
   ├── Dashboard
   ├── Jadwal Mengajar
   ├── Profile
   ├── Mulai Kelas
   └── Generate QR Code Presensi

Admin
   │
   ├── Dashboard
   ├── Manajemen WB
   ├── Manajemen Pengajar
   ├── Manajemen Kehadiran
   ├── Manajemen Mata Pelajaran
   ├── Manajemen Jadwal
   ├── Manajemen Konten/Berita
   └── Manajemen Pendaftar

Superadmin
   │
   ├── Seluruh fitur Admin
   ├── Manajemen Admin
   └── Audit Log seluruh aktivitas Admin
```

---

# 4. Halaman Guest

Halaman guest dapat diakses tanpa login.

## 4.1 Beranda

Buat halaman landing page PKBM KARTINI yang menampilkan:

- Logo PKBM KARTINI
- Nama PKBM
- Deskripsi singkat
- Visi
- Misi
- Informasi program pendidikan
- Informasi kontak
- Alamat
- Informasi pendaftaran
- Tombol login
- Tombol pendaftaran calon WB

---

## 4.2 Profile PKBM

Tampilkan informasi:

- Sejarah PKBM
- Profil lembaga
- Visi
- Misi
- Program pendidikan
- Informasi pengajar
- Informasi fasilitas
- Kontak

Konten dapat dikelola melalui dashboard admin.

---

## 4.3 Berita dan Kegiatan

Guest dapat melihat konten yang telah dipublish.

Konten dapat berupa:

- Artikel
- Berita
- Dokumentasi kegiatan
- Gambar
- Dokumen
- Video YouTube

Admin dapat menentukan apakah konten:

```text
Draft
Published
Unpublished
```

Hanya konten dengan status:

```text
Published
```

yang ditampilkan kepada guest.

Untuk video YouTube, simpan URL atau YouTube Video ID dan tampilkan menggunakan embedded player.

---

# 5. Pendaftaran Calon Warga Belajar

Guest dapat melakukan pendaftaran calon WB.

Form pendaftaran minimal berisi:

- Nama lengkap
- NIK
- NISN jika tersedia
- Tempat lahir
- Tanggal lahir
- Jenis kelamin
- Alamat
- Nomor HP
- Email
- Nama orang tua/wali
- Nomor HP orang tua/wali
- Program pendidikan
- Tahun pendaftaran
- Dokumen pendukung
- Foto
- Informasi pembayaran pendaftaran

Status pendaftaran:

```text
PENDING
DIVERIFIKASI
DITERIMA
DITOLAK
```

Status pembayaran:

```text
BELUM_BAYAR
SUDAH_BAYAR
DIVERIFIKASI
```

Admin dapat melihat dan mengubah status pendaftaran.

Jika calon WB diterima, admin dapat membuat/mengaktifkan akun WB.

---

# 6. Authentication

Gunakan satu halaman login untuk seluruh pengguna.

Contoh route:

```text
/login
```

Metode login:

```text
Google Sign-In
Email + Password
```

Setelah login:

```text
Firebase Authentication
        ↓
Ambil UID
        ↓
Cari users/{uid}
        ↓
Baca role
        ↓
Redirect sesuai role
```

Contoh:

```text
role = wb
      → /wb/dashboard

role = pengajar
      → /pengajar/dashboard

role = admin
      → /admin/dashboard

role = superadmin
      → /superadmin/dashboard
```

Jika akun authenticated tetapi belum memiliki role yang valid, jangan berikan akses ke halaman internal.

---

# 7. Profil Pengguna

Buat collection:

```text
users
```

Contoh struktur:

```javascript
{
  uid: "config-auth-uid",
  email: "user@email.com",
  displayName: "Nama User",
  photoURL: "...",
  role: "wb",
  status: "active",

  lastLoginAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

Role:

```text
wb
pengajar
admin
superadmin
```

Status:

```text
active
inactive
```

---

# 8. Pencatatan Last Login

Setiap login berhasil, sistem harus memperbarui:

```text
users/{uid}.lastLoginAt
```

Gunakan Firebase server timestamp.

Admin dan Superadmin harus dapat melihat:

- Nama pengguna
- Role
- Status
- Last Login
- Email

Informasi last login minimal tersedia untuk:

- WB
- Pengajar
- Admin

Contoh tampilan:

| Nama | Role | Status | Last Login |
|---|---|---|---|
| Ahmad | WB | Aktif | 09 Agustus 2026 08:30 |
| Budi | Pengajar | Aktif | 09 Agustus 2026 07:45 |
| Admin 1 | Admin | Aktif | 08 Agustus 2026 20:10 |

Jika belum pernah login:

```text
Belum pernah login
```

---

# 9. Modul Warga Belajar (WB)

## 9.1 Dashboard WB

Tampilkan:

- Nama WB
- Foto
- Program pendidikan
- Jadwal hari ini
- Status kehadiran hari ini
- Ringkasan kehadiran
- Informasi/tagihan jika tersedia

---

## 9.2 Jadwal Pelajaran

WB dapat melihat jadwal pelajaran.

Informasi:

- Hari
- Tanggal
- Jam mulai
- Jam selesai
- Mata pelajaran
- Pengajar
- Ruangan
- Status kelas

Contoh:

```text
Senin
08:00 - 09:30
Matematika
Pengajar: Budi
Ruang: A1
```

---

# 10. Presensi WB

Presensi menggunakan QR Code yang dibuat oleh pengajar.

Alur:

```text
Pengajar
   ↓
Pilih jadwal
   ↓
Mulai kelas
   ↓
Generate token presensi
   ↓
Generate QR Code
   ↓
WB scan QR Code
   ↓
Validasi token
   ↓
Validasi jadwal
   ↓
Validasi user
   ↓
Simpan presensi
```

QR Code **tidak boleh berisi informasi sensitif**.

QR Code sebaiknya hanya berisi token/session identifier.

Contoh:

```text
attendanceSessionId
```

atau token acak yang memiliki masa berlaku.

---

# 11. Aturan Presensi

Ketika pengajar belum membuat session/QR Code:

```text
Kelas belum dimulai
```

WB belum dapat melakukan presensi.

Secara administratif, WB dianggap:

```text
Tidak Hadir
```

untuk sesi tersebut sampai terdapat presensi yang valid.

Namun status final harus dibedakan antara:

```text
BELUM_DIMULAI
TIDAK_HADIR
HADIR
TERLAMBAT
IZIN
SAKIT
```

Jangan langsung membuat data `TIDAK_HADIR` sebelum kelas memiliki session presensi.

Aturan bisnis:

```text
Jadwal dibuat
       ↓
Pengajar belum mulai kelas
       ↓
Status = BELUM_DIMULAI
       ↓
Pengajar generate QR
       ↓
Status = OPEN
       ↓
WB melakukan scan
       ↓
Status = HADIR / TERLAMBAT
       ↓
QR/session ditutup
       ↓
WB yang tidak memiliki presensi
       ↓
Status = TIDAK_HADIR
```

---

# 12. Pengajar

## 12.1 Dashboard Pengajar

Tampilkan:

- Nama pengajar
- Foto
- Jadwal mengajar hari ini
- Kelas yang sedang berlangsung
- Riwayat presensi
- Status akun

---

# 13. Jadwal Pengajar

Pengajar dapat melihat:

- Jadwal mengajar
- Mata pelajaran
- Kelas/program
- Jam mengajar
- Ruangan
- Daftar WB

Pengajar tidak diperbolehkan mengubah jadwal jika tidak memiliki hak akses admin.

---

# 14. Generate QR Code Kelas

Pengajar harus melakukan:

```text
Pilih jadwal
      ↓
Klik "Mulai Kelas"
      ↓
Sistem membuat attendance session
      ↓
Sistem membuat token
      ↓
QR Code ditampilkan
```

Contoh data:

```javascript
{
  sessionId: "...",
  scheduleId: "...",
  teacherId: "...",
  date: "...",
  startTime: "...",
  expiresAt: "...",
  status: "OPEN"
}
```

QR Code harus memiliki masa berlaku.

Contoh:

```text
OPEN
   ↓
Aktif selama kelas berlangsung
   ↓
EXPIRED
```

Pengajar dapat:

```text
Mulai Kelas
Tutup Presensi
Generate QR
Regenerate QR
```

Token QR harus sulit ditebak dan tidak menggunakan ID sederhana seperti:

```text
12345
```

Gunakan token acak yang aman.

---

# 15. Profile Pengajar

Pengajar dapat melihat:

- Nama
- Foto
- Email
- Nomor HP
- Mata pelajaran
- Status aktif
- Jadwal mengajar
- Last login

Pengajar dapat mengubah data profil yang diperbolehkan.

Data administratif tertentu hanya dapat diubah Admin.

---

# 16. Manajemen WB

Admin dapat melakukan CRUD:

```text
Create
Read
Update
Delete
```

Data WB minimal:

```text
Nama
NIK
NISN
Tempat lahir
Tanggal lahir
Jenis kelamin
Alamat
Nomor HP
Email
Orang tua/wali
Program pendidikan
Status
Tanggal masuk
Foto
Dokumen
```

Status WB:

```text
ACTIVE
INACTIVE
LULUS
KELUAR
```

Admin dapat melihat:

- Profil WB
- Riwayat studi
- Jadwal
- Kehadiran
- Informasi tagihan
- Status pembayaran
- Last login

---

# 17. Informasi Studi WB

Buat modul informasi studi.

Contoh:

```text
Program Pendidikan
Tahun Masuk
Kelas
Tingkat
Status
Mata Pelajaran
Riwayat Nilai
```

Struktur dapat dikembangkan sesuai kebutuhan PKBM.

---

# 18. Informasi Tagihan WB

Admin dapat melihat informasi tagihan.

Contoh:

```text
Jenis Tagihan
Periode
Nominal
Tanggal Jatuh Tempo
Status
Tanggal Pembayaran
Catatan
```

Status:

```text
BELUM_BAYAR
SUDAH_BAYAR
TERLAMBAT
DIBEBASKAN
```

Jika belum terdapat payment gateway, sistem cukup berfungsi sebagai pencatatan administrasi pembayaran.

---

# 19. Manajemen Pengajar

Admin dapat:

- Menambah pengajar
- Melihat pengajar
- Mengedit pengajar
- Menonaktifkan pengajar
- Mengaktifkan pengajar
- Melihat jadwal pengajar
- Melihat mata pelajaran
- Melihat last login

Status:

```text
ACTIVE
INACTIVE
```

Pengajar dengan status:

```text
INACTIVE
```

tidak dapat melakukan login atau mengakses fitur pengajar.

---

# 20. Manajemen Mata Pelajaran

Admin dapat melakukan CRUD mata pelajaran.

Data:

```text
Nama Mata Pelajaran
Kode
Deskripsi
Program
Status
```

Contoh:

```text
Matematika
Bahasa Indonesia
Bahasa Inggris
IPA
IPS
PKn
```

---

# 21. Manajemen Jadwal

Admin dapat melakukan CRUD jadwal.

Data:

```text
Hari
Tanggal jika diperlukan
Jam Mulai
Jam Selesai
Mata Pelajaran
Pengajar
Program
Kelas
Ruangan
Status
```

Sistem harus melakukan validasi agar tidak terjadi konflik:

```text
Pengajar A
08:00 - 10:00
```

tidak boleh memiliki dua kelas pada waktu yang sama.

---

# 22. Manajemen Kehadiran

Admin dapat melihat seluruh kehadiran:

```text
WB
Pengajar
```

Filter:

```text
Tanggal
Bulan
Tahun
WB
Pengajar
Mata Pelajaran
Kelas
Status
```

Status kehadiran:

```text
HADIR
TERLAMBAT
TIDAK_HADIR
IZIN
SAKIT
```

Admin dapat melakukan koreksi kehadiran dengan alasan yang wajib dicatat.

Contoh:

```javascript
{
  modifiedBy: "uid-admin",
  modifiedAt: Timestamp,
  reason: "Koreksi berdasarkan surat izin"
}
```

---

# 23. Kehadiran Pengajar

Sistem juga harus mencatat kehadiran pengajar.

Ketika pengajar memulai kelas:

```text
Mulai Kelas
```

sistem dapat mencatat:

```text
teacherId
scheduleId
date
startAt
```

Jika diperlukan, status kehadiran pengajar:

```text
HADIR
TERLAMBAT
TIDAK_HADIR
IZIN
SAKIT
```

---

# 24. Manajemen Konten / Berita

Admin dapat membuat konten.

Jenis:

```text
BERITA
ARTIKEL
KEGIATAN
PENGUMUMAN
```

Media:

```text
Gambar
Dokumen
Video YouTube
```

Data:

```text
Judul
Slug
Deskripsi
Isi
Thumbnail
Media
YouTube URL
Author
Status
PublishedAt
CreatedAt
UpdatedAt
```

Status:

```text
DRAFT
PUBLISHED
UNPUBLISHED
```

Guest hanya dapat melihat:

```text
PUBLISHED
```

---

# 25. Firebase Storage

Gunakan Firebase Storage untuk menyimpan:

- Foto WB
- Foto pengajar
- Foto profil
- Thumbnail berita
- Gambar kegiatan
- Dokumen
- File pendukung

Jangan menyimpan file binary secara langsung di Firestore.

Firestore hanya menyimpan:

```text
storagePath
downloadURL
fileName
fileType
size
```

---

# 26. Manajemen Admin

Fitur ini **hanya dapat diakses oleh Superadmin**.

Superadmin dapat:

```text
Create Admin
Read Admin
Update Admin
Delete/Deactivate Admin
```

Data:

```text
Nama
Email
Foto
Status
Role
Last Login
CreatedAt
UpdatedAt
```

Admin biasa tidak boleh:

- Menambah admin
- Menghapus admin
- Mengubah role admin
- Mengakses audit log penuh
- Mengubah data superadmin

---

# 27. Superadmin

Sistem harus memiliki satu akun Superadmin utama yang dikonfigurasi secara aman melalui Firebase Authentication.

Jangan hardcode password Superadmin di source code, repository, Firestore, atau frontend.

Role Superadmin:

```text
superadmin
```

Superadmin memiliki seluruh hak Admin ditambah:

```text
Manajemen Admin
Audit Log
```

---

# 28. Audit Log

Hanya Superadmin yang dapat melihat audit log.

Setiap perubahan data penting harus dicatat.

Minimal aktivitas:

```text
CREATE
UPDATE
DELETE
ACTIVATE
DEACTIVATE
LOGIN
LOGOUT
```

Contoh:

```javascript
{
  action: "UPDATE",
  module: "WB",
  targetId: "...",
  targetType: "wb",

  performedBy: "...",
  performedByName: "...",
  performedByEmail: "...",

  timestamp: Timestamp,

  before: {...},
  after: {...},

  metadata: {
    ip: "...",
    userAgent: "..."
  }
}
```

Jika penyimpanan IP tidak diperlukan, jangan menyimpan IP.

Audit log harus bersifat append-only dari sisi aplikasi.

Admin tidak boleh menghapus audit log.

---

# 29. Struktur Firestore

Gunakan struktur collection yang terorganisasi.

Contoh:

```text
users
├── {uid}

students
├── {studentId}

teachers
├── {teacherId}

admins
├── {adminId}

subjects
├── {subjectId}

schedules
├── {scheduleId}

attendanceSessions
├── {sessionId}

attendances
├── {attendanceId}

studentStudies
├── {studyId}

studentBills
├── {billId}

registrations
├── {registrationId}

contents
├── {contentId}

auditLogs
├── {logId}
```

---

# 30. Relasi Data

Gunakan ID/reference antar collection.

Contoh schedule:

```javascript
{
  subjectId: "...",
  teacherId: "...",
  programId: "...",
  classId: "...",
  startTime: "...",
  endTime: "..."
}
```

Attendance:

```javascript
{
  sessionId: "...",
  scheduleId: "...",
  studentId: "...",
  date: "...",
  status: "HADIR",
  scannedAt: Timestamp
}
```

---

# 31. Keamanan Firestore

Jangan mengandalkan pembatasan akses hanya dari React.

Implementasikan Firebase Security Rules berdasarkan:

```text
request.auth.uid
```

dan role pengguna.

Contoh prinsip:

```text
Guest
→ hanya membaca data public

WB
→ hanya membaca data miliknya

Pengajar
→ hanya mengakses jadwal dan kelas yang menjadi tanggung jawabnya

Admin
→ dapat mengelola data operasional

Superadmin
→ seluruh akses
```

WB tidak boleh membaca data WB lain.

Pengajar tidak boleh membaca seluruh database secara bebas.

Admin tidak boleh mengakses fungsi Superadmin.

---

# 32. PWA

Aplikasi harus dapat berjalan sebagai PWA.

Implementasikan:

```text
manifest.json
service worker
icons
offline fallback
installable application
```

Manifest minimal:

```text
name: PKBM KARTINI
short_name: KARTINI
display: standalone
start_url: /
theme_color
background_color
icons
```

Pastikan aplikasi dapat di-install pada browser yang mendukung PWA.

---

# 33. Responsiveness

Gunakan pendekatan responsive-first.

Target:

```text
Mobile
Tablet
Desktop
```

Mobile harus menjadi prioritas karena WB kemungkinan besar melakukan scan QR menggunakan smartphone.

Navigasi:

### Mobile

Gunakan:

```text
Bottom Navigation
Drawer
Mobile Menu
```

### Desktop

Gunakan:

```text
Sidebar
Topbar
Content Area
```

---

# 34. Struktur Halaman

Gunakan struktur routing seperti:

```text
/
├── /
├── /profile-pkbm
├── /berita
├── /berita/:slug
├── /pendaftaran
├── /login
│
├── /wb
│   ├── /dashboard
│   ├── /jadwal
│   ├── /presensi
│   ├── /kehadiran
│   └── /profile
│
├── /pengajar
│   ├── /dashboard
│   ├── /jadwal
│   ├── /kelas
│   ├── /presensi
│   └── /profile
│
├── /admin
│   ├── /dashboard
│   ├── /wb
│   ├── /pengajar
│   ├── /kehadiran
│   ├── /mata-pelajaran
│   ├── /jadwal
│   ├── /konten
│   └── /pendaftar
│
└── /superadmin
    ├── /admin
    └── /audit-log
```

---

# 35. Dashboard Admin

Dashboard harus memberikan ringkasan informasi.

Contoh:

```text
Total WB
Total Pengajar
Total Admin
WB Aktif
Pengajar Aktif
Pendaftar Baru
Tagihan Belum Lunas
Kehadiran Hari Ini
```

Tambahkan grafik jika diperlukan:

```text
Grafik kehadiran
Grafik pendaftar
Grafik WB aktif
```

---

# 36. Dashboard Superadmin

Dashboard Superadmin mencakup dashboard Admin ditambah:

```text
Total Admin
Aktivitas Admin Terbaru
Login Terakhir Admin
Audit Log Terbaru
```

Contoh:

```text
Admin A
UPDATE WB
10:32 WIB

Admin B
CREATE JADWAL
10:20 WIB

Admin C
UPDATE PENGAJAR
09:55 WIB
```

---

# 37. UX Presensi QR Code

Pada halaman WB:

```text
[ Scan QR Presensi ]
```

Setelah scan:

```text
Validating...
```

Jika valid:

```text
Presensi Berhasil

Mata Pelajaran:
Matematika

Pengajar:
Budi

Waktu:
08:03

Status:
HADIR
```

Jika token expired:

```text
QR Code sudah tidak berlaku.
```

Jika bukan kelas WB tersebut:

```text
Anda tidak terdaftar pada kelas ini.
```

Jika sudah presensi:

```text
Anda sudah melakukan presensi.
```

---

# 38. Validasi Presensi

Sistem harus melakukan validasi:

1. User sudah login.
2. User memiliki role WB.
3. Token valid.
4. Token belum expired.
5. Session masih OPEN.
6. Jadwal sesuai.
7. WB terdaftar pada kelas/program tersebut.
8. WB belum melakukan presensi.
9. Waktu scan masih berada pada rentang yang diperbolehkan.

Jangan mempercayai data dari client.

Validasi penting harus dilakukan melalui server-side mechanism yang aman, misalnya Cloud Functions/Cloud Run jika diperlukan.

---

# 39. State Management

Gunakan state management yang sederhana dan sesuai kebutuhan.

Minimal harus tersedia:

```text
Authentication State
User State
Role State
Loading State
Error State
```

Buat AuthProvider/Context untuk memonitor:

```text
onAuthStateChanged
```

---

# 40. Error Handling

Semua proses harus memiliki handling error.

Contoh:

```text
Loading
Empty State
Error State
Success State
```

Jangan menampilkan error Firebase mentah kepada user.

Contoh jangan:

```text
FirebaseError: PERMISSION_DENIED...
```

Gunakan:

```text
Anda tidak memiliki izin untuk melakukan tindakan ini.
```

---

# 41. Loading dan Empty State

Setiap tabel/list harus memiliki:

### Loading

```text
Memuat data...
```

### Empty

```text
Belum ada data.
```

### Error

```text
Data gagal dimuat.
Silakan coba lagi.
```

---

# 42. Prinsip UI

Gunakan desain yang:

- Bersih
- Modern
- Profesional
- Mudah digunakan
- Tidak terlalu banyak warna
- Konsisten
- Mobile friendly

Gunakan komponen reusable:

```text
Button
Input
Select
Modal
Dialog
Table
Card
Badge
Dropdown
Toast
Pagination
Search
Filter
DatePicker
```

---

# 43. Struktur Project

Gunakan struktur modular.

Contoh:

```text
src/
├── assets/
├── components/
├── layouts/
├── pages/
│   ├── guest/
│   ├── wb/
│   ├── pengajar/
│   ├── admin/
│   └── superadmin/
│
├── features/
│   ├── auth/
│   ├── students/
│   ├── teachers/
│   ├── schedules/
│   ├── subjects/
│   ├── attendance/
│   ├── registrations/
│   ├── contents/
│   ├── billing/
│   └── audit/
│
├── services/
│   ├── firebase/
│   ├── auth/
│   ├── firestore/
│   └── storage/
│
├── hooks/
├── contexts/
├── routes/
├── utils/
├── constants/
└── App.jsx
```

---

# 44. Prinsip Pengembangan

Gunakan prinsip:

```text
Reusable Components
Separation of Concerns
Role-Based Access Control
Secure Firestore Rules
Responsive Design
Mobile First
PWA
Clean Code
```

Hindari:

```text
Hardcoded data
Hardcoded password
Hardcoded role di frontend
Duplikasi component
Firebase credential di repository
Validasi keamanan hanya di frontend
```

---

# 45. Environment Configuration

Gunakan environment variable untuk konfigurasi Firebase.

Contoh:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Jangan memasukkan secret credential ke Git repository.

---

# 46. Prioritas Implementasi

Implementasi dilakukan secara bertahap.

## Tahap 1 — Foundation

Buat:

- React project
- Routing
- Firebase configuration
- Authentication
- Google Sign-In
- Email/Password
- User profile
- Role-based routing
- PWA

---

## Tahap 2 — Guest

Implementasikan:

- Landing page
- Profile PKBM
- Berita
- Detail berita
- Pendaftaran calon WB

---

## Tahap 3 — WB

Implementasikan:

- Dashboard
- Profile
- Jadwal
- Scan QR
- Presensi
- Riwayat kehadiran
- Informasi studi
- Tagihan

---

## Tahap 4 — Pengajar

Implementasikan:

- Dashboard
- Profile
- Jadwal
- Mulai kelas
- Generate QR
- Session presensi
- Penutupan kelas
- Riwayat kelas

---

## Tahap 5 — Admin

Implementasikan:

- Dashboard
- CRUD WB
- CRUD Pengajar
- CRUD Mata Pelajaran
- CRUD Jadwal
- Manajemen Kehadiran
- Manajemen Konten
- Manajemen Pendaftar
- Informasi tagihan

---

## Tahap 6 — Superadmin

Implementasikan:

- Manajemen Admin
- Audit Log
- Monitoring aktivitas admin
- Monitoring last login
- Kontrol role dan status admin

---

# 47. Acceptance Criteria

Aplikasi dianggap selesai apabila:

### Authentication

- [ ] Google Sign-In berjalan.
- [ ] Email/password berjalan.
- [ ] Semua role menggunakan halaman login yang sama.
- [ ] Redirect berdasarkan role berjalan.
- [ ] Last login tercatat.

### Guest

- [ ] Profile PKBM tersedia.
- [ ] Berita dapat ditampilkan.
- [ ] Video YouTube dapat ditampilkan.
- [ ] Dokumen/gambar dapat ditampilkan.
- [ ] Form pendaftaran tersedia.

### WB

- [ ] WB dapat melihat dashboard.
- [ ] WB dapat melihat jadwal.
- [ ] WB dapat melakukan scan QR.
- [ ] Sistem memvalidasi token.
- [ ] Sistem mencegah presensi ganda.
- [ ] Riwayat kehadiran tersedia.

### Pengajar

- [ ] Pengajar dapat melihat jadwal.
- [ ] Pengajar dapat memulai kelas.
- [ ] Pengajar dapat generate QR.
- [ ] Token memiliki expiration.
- [ ] Pengajar dapat menutup session.

### Admin

- [ ] CRUD WB berjalan.
- [ ] CRUD Pengajar berjalan.
- [ ] CRUD Mata Pelajaran berjalan.
- [ ] CRUD Jadwal berjalan.
- [ ] Manajemen kehadiran berjalan.
- [ ] Manajemen konten berjalan.
- [ ] Manajemen pendaftar berjalan.
- [ ] Informasi tagihan tersedia.
- [ ] Last login dapat dilihat.

### Superadmin

- [ ] CRUD Admin tersedia.
- [ ] Superadmin dapat melihat audit log.
- [ ] Aktivitas admin tercatat.
- [ ] Waktu perubahan tercatat.
- [ ] Data sebelum/sesudah perubahan dapat dilacak.
- [ ] Admin tidak dapat mengakses fitur Superadmin.

### PWA

- [ ] Aplikasi dapat di-install.
- [ ] Manifest tersedia.
- [ ] Service Worker berjalan.
- [ ] Responsive di mobile.
- [ ] Responsive di desktop.

---

# 48. Prinsip Keamanan Utama

Prioritaskan keamanan pada:

```text
Firebase Authentication
Firestore Security Rules
Role-Based Access Control
Secure QR Token
Token Expiration
Audit Logging
Input Validation
File Upload Validation
No Hardcoded Password
No Sensitive Data in QR
```

Khusus untuk QR presensi, jangan menggunakan QR statis. Setiap kelas harus memiliki **attendance session dan token yang berbeda**.

---

# 49. Hasil Akhir yang Diharapkan

Hasil akhir adalah aplikasi:

**PKBM KARTINI**

dengan arsitektur:

```text
                    PKBM KARTINI
                         │
             ┌───────────┴───────────┐
             │                       │
           Guest                  Login
             │                       │
       ┌─────┴─────┐          ┌─────┴─────┐
       │           │          │           │
   Informasi   Pendaftaran    WB       Pengajar
   Berita                      │           │
                               │           │
                          Jadwal       Jadwal
                          Presensi     Generate QR
                          Kehadiran    Kelas
                               │           │
                               └─────┬─────┘
                                     │
                               Firebase
                                     │
                  ┌──────────────────┼──────────────────┐
                  │                  │                  │
              Firestore           Storage        Authentication
                  │
        ┌─────────┴─────────┐
        │                   │
      Admin             Superadmin
        │                   │
   Manajemen          Manajemen Admin
   WB                  Audit Log
   Pengajar            Monitoring
   Jadwal              Aktivitas
   Mapel
   Kehadiran
   Konten
   Pendaftar
   Tagihan
```

Bangun aplikasi secara modular dan pastikan setiap fitur dapat dikembangkan tanpa harus mengubah keseluruhan arsitektur aplikasi.
