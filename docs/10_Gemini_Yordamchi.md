# Gemini yordamchi — yakuniy integratsiya

Agent murojaat tafsilotida ikki amal mavjud:
- **Gemini xulosasi:** ommaviy yozishmalarni qisqa xulosaga aylantiradi.
- **Javob taklif qilish:** mijozga yuborish uchun qoralama tayyorlaydi.

Taklif mijozga avtomatik ketmaydi. “Qoralamaga qo‘yish” → tekshirish → “Javobni ko‘rib chiqish” → “Mijozga yuborish” oqimi saqlangan. Mavjud qoralama almashtirilsa alohida tasdiq chiqadi.
Ichki izoh rejimida qoralama yaratish o‘chirilgan. Ichki izohlar, fayl baytlari, mijoz ismi va API kaliti model kontekstiga kiritilmaydi.

Server `.env` dagi kalitni HTTP header orqali ishlatadi. Browserda kalit yo‘q; ZIPda `.env` yo‘q. API body va origin tekshiriladi, parallel so‘rovlar va so‘rov tezligi cheklangan.
Model: gemini-2.5-flash; shu kalit bilan models va generateContent so‘rovlari 200 qaytardi.
Loading, error va qayta urinish holatlari bor. Tarmoq xatosi mavjud qoralamani o‘chirmaydi.

Manba: [Google Gemini API hujjati](https://ai.google.dev/api).

## Lokal fayllar
Tanlangan rasm/PDF IndexedDB’da saqlanadi. Murojaatdagi fayl IDsi bilan refreshdan keyin ochiladi. Rasm preview tekshirildi. Yuklab olish uchun native `download` havolasi bor; Codex ichki brauzeri Blob download hodisasini test vositasiga qaytarmadi, shuning uchun avtomatlashtirilgan yuklab olish tasdig‘i olinmadi.

## Topshirishning tashqi qismi
Figma `files` sahifasi brauzerda tekshirildi va login sahifasiga yo‘naltirdi. Akkaunt sessiyasi yo‘q: native `.fig` va ko‘rish havolasi shu sababli hali olinmagan. Import uchun barcha SVG/PNG ekranlar, wireframe va UI kit paketda.
