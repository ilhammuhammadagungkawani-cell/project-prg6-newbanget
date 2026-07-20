-- =======================================================
-- SCRIPT PEMBUATAN DATABASE DAN TABEL UNTUK SQL SERVER
-- =======================================================
-- Cara Penggunaan:
-- 1. Buka Microsoft SQL Server Management Studio (SSMS).
-- 2. Login menggunakan SQL Server Authentication dengan:
--    - Login: sa
--    - Password: polman
-- 3. Klik tombol "New Query" di pojok kiri atas.
-- 4. Copy (Salin) seluruh isi file ini dan Paste (Tempel) ke jendela Query SSMS.
-- 5. Blok baris 15 ("CREATE DATABASE find_mahasiswa_db;") lalu tekan F5 atau klik "Execute".
-- 6. Setelah sukses, blok baris sisanya dari baris 16 ke bawah, lalu tekan F5 atau klik "Execute".
-- =======================================================

-- 1. Membuat Database Baru
CREATE DATABASE find_mahasiswa_db;
GO

-- Menggunakan Database yang baru dibuat
USE find_mahasiswa_db;
GO

-- 2. Membuat Tabel Users (Menyimpan akun mahasiswa)
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- password disimpan berupa teks biasa atau hash
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 3. Membuat Tabel FinanceData (Menyimpan Saldo Awal & Saldo Saat Ini per Akun/Email)
CREATE TABLE FinanceData (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_email VARCHAR(100) UNIQUE NOT NULL,
    initial_balance DECIMAL(18, 2) NOT NULL,
    current_balance DECIMAL(18, 2) NOT NULL,
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_email) REFERENCES Users(email) ON DELETE CASCADE
);
GO

-- 4. Membuat Tabel Transactions (Menyimpan riwayat pengeluaran & pendapatan)
CREATE TABLE Transactions (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_email VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'expense' (pengeluaran) atau 'income' (pendapatan)
    amount DECIMAL(18, 2) NOT NULL,
    wallet VARCHAR(50) NOT NULL,
    date DATETIME NOT NULL,
    category VARCHAR(50) NOT NULL,
    notes VARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (user_email) REFERENCES Users(email) ON DELETE CASCADE
);
GO

-- =======================================================
-- Verifikasi Tabel (Bisa dijalankan nanti untuk mengecek data)
-- =======================================================
-- SELECT * FROM Users;
-- SELECT * FROM FinanceData;
