// =======================================================
// KONFIGURASI API BACKEND UNTUK FRONTEND (REACT NATIVE)
// =======================================================
// Sesuaikan API_URL di bawah ini tergantung pada perangkat pengujian Anda:
//
// 1. Android Emulator:
//    Gunakan 'http://10.0.2.2:3000' (IP khusus dari emulator ke host PC)
//
// 2. iOS Simulator:
//    Gunakan 'http://localhost:3000' atau 'http://127.0.0.1:3000'
//
// 3. HP Fisik (Expo Go) / Perangkat Lain di Jaringan yang Sama:
//    Gunakan IP lokal PC Anda (contoh: 'http://192.168.1.35:3000').
//    Cara cari IP lokal PC (Windows):
//    - Buka Command Prompt (cmd)
//    - Ketik: ipconfig
//    - Cari "IPv4 Address" di bawah jaringan aktif Anda (misalnya Wi-Fi).
// =======================================================

export const API_URL = 'http://10.1.13.68:3000'; // Backend on laptop IP port 3000 (sesuai .env)
export const GATEWAY_URL = 'http://10.1.13.68:4000'; // Payment gateway service

