# tracker-assets
source : https://github.com/newlegendanaga123/networth-tracker
basicnya sama seperti Networth Tracker dari source di atas, namun ada beberapa improvement. terutama dari penyimpanan data di simpan pada spreadsheet menggunakan apps script. Berikut panduannya:

# Panduan Sinkronisasi ke Google Sheets
Fitur ini memungkinkan Anda menyimpan snapshot total kekayaan bersih (Net Worth) beserta rincian aset dari *Net Worth Tracker* langsung ke Google Spreadsheet Anda sendiri.
Ikuti langkah-langkah mudah di bawah ini untuk mengatur Google Apps Script.

## Langkah 1: Buat Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.google.com) dan buat dokumen baru (Blank spreadsheet).
2. Beri nama file sesuka Anda (misalnya: "Net Worth Tracker Sync").
3. Di baris pertama (Header), ketikkan kolom berikut dari kiri ke kanan:
   - Kolom A: `Timestamp`
   - Kolom B: `Total Net Worth`
   - Kolom C: `Raw JSON Data` (Ini untuk menyimpan detail aset agar bisa diolah lebih lanjut jika diperlukan).

## Langkah 2: Masukkan Kode Apps Script
1. Di menu atas Spreadsheet, klik **Extensions > Apps Script**.
2. Hapus semua kode yang ada di layar, lalu *copy-paste* kode di bawah ini:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    var timestamp = data.timestamp;
    var netWorth = data.netWorth;
    var rawJSON = JSON.stringify(data);
    
    sheet.appendRow([timestamp, netWorth, rawJSON]);
    
    return ContentService.createTextOutput(JSON.stringify({"status": "success"}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var lastRow = sheet.getLastRow();
    
    if (lastRow <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ "status": "empty" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Ambil data dari kolom C (indeks ke-3) pada baris terakhir
    var rawJSON = sheet.getRange(lastRow, 3).getValue();
    var data = JSON.parse(rawJSON);
    
    return ContentService.createTextOutput(JSON.stringify({
      "status": "success",
      "data": data
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({"status": "error", "message": error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

3. Klik ikon 💾 **Save** (atau tekan `Ctrl+S`). Beri nama proyek jika diminta (misal: "Tracker Sync API").

## Langkah 3: Deploy (Terapkan) Script
1. Di kanan atas, klik tombol **Deploy > New deployment**.
2. Klik ikon roda gigi ⚙️ di sebelah tulisan "Select type", centang **Web app**.
3. Isi deskripsi (bebas, misalnya "V1").
4. Di bagian **Execute as**, pilih `Me (<email Anda>)`.
5. Di bagian **Who has access**, pilih `Anyone` (Sangat penting! Jika tidak, aplikasi lokal tidak bisa mengirim data).
6. Klik **Deploy**.
7. *Google mungkin meminta Anda untuk memberikan izin otorisasi (Authorize access). Lanjutkan dan setujui peringatan "Unsafe" (ini aman karena Anda membuat script sendiri).*
8. Setelah selesai, Anda akan mendapatkan sebuah **Web app URL**. Klik **Copy**.

## Langkah 4: Masukkan URL ke Net Worth Tracker
1. Buka aplikasi *Net Worth Tracker* Anda.
2. Buka menu ⚙️ **Settings** (Pengaturan).
3. Cari kolom **Google Sheets Web App URL** dan *paste* URL yang baru saja Anda copy.
4. Selesai! Coba klik tombol **☁️ Sync** di bagian atas aplikasi.
5. Cek Google Spreadsheet Anda, data kekayaan bersih Anda akan otomatis masuk ke baris baru.

## Langkah 5: Jalankan aplikasi via Command Prompt
1. install nodejs jika belum punya (download di https://nodejs.org/)
2. Buka Command Prompt
3. install dependecies dengan mengetik `npm install`
4. ketik `node server.js` untuk menjalankan aplikasi
5. buka url http://localhost:3000 pada browser

## Future Goals
-
