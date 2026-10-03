# Texnik QA natijalari
Sana: 3-oktabr 2026. Mahalliy interaktiv prototip.

| Tekshiruv | Natija |
|---|---|
| JavaScript syntax: app/app.js, server.js | O‘tdi |
| npm test | 28/28 o‘tdi |
| Javobsiz filtr | 5 javobsiz namunani ajratdi |
| Ichki/ommaviy qoralama almashish | Ommaviy maydon bo‘sh, ichki matn saqlandi |
| Ichki izoh | Mijoz portalida ko‘rinmadi; javobsiz count o‘zgarmadi |
| Ommaviy javob preview | Mijoz nomi va yakuniy matn ko‘rindi |
| Yechim taklif qilish | Yechildi → mijoz tasdig‘i kutilmoqda |
| Mijoz tasdig‘i | Yopilgan, tarix voqeasi |
| Qayta ochish | Sabab, Qayta ochilgan, yangi 1 soatlik muddat |
| PNG biriktirish va yuborish | Qabul qilindi; nomi va hajmi tarixda |
| Mobil 390 × 844 | Gorizontal sahifa overflow yo‘q |
| Mobil 320 × 740 | Gorizontal sahifa overflow yo‘q |
| Agent 1440 × 1000 | Jadval, status, muddat, mas’ul ko‘rinadi |
| SVG eksport | 19 ekran + 19 wireframe + 4 board/kit; 42 XML fayli to‘g‘ri |
| Composer klaviaturasi | ArrowLeft ichki rejimdan ommaviy rejimga o‘tdi |
| Server chegarasi | Asosiy fayllar 200; .env va server.js uchun 403 |

Bu natijalar texnik tekshiruv. Haqiqiy foydalanuvchi testi, to‘liq accessibility auditi yoki SUS bahosi emas.
Kontrast: asosiy tugma 7.17:1; matn 12.90:1; yordamchi matn 4.96:1; ichki izoh 5.70:1; kechikish 5.14:1. Hisoblash skripti scripts/build_design_assets.py.

Sinov murojaatlari namuna ma’lumotlariga qaytarildi. Fayl baytlari lokal IndexedDB’da saqlanadi. Xabarlar haqiqiy kishilarga yuborilmaydi. Gemini ommaviy kontekst bilan haqiqiy server so‘rovi orqali ishlaydi.

## Yakuniy tekshiruv
- Qo‘shimcha agent tomonidan refresh, dialog race, sort va fokus regressiyalari tuzatildi.
- Gemini models va generateContent endpointlari haqiqiy so‘rovda 200 qaytardi.
- Browserda Gemini xulosasi va javob taklifi yaratildi; taklif qoralamaga qo‘yildi, mijozga yuborilmadi.
- Rasm IndexedDB’da saqlandi, refreshdan keyin preview ochildi; download havolasi mavjud.
- API internal xabarni va begona originni rad etish testlari o‘tdi.
- Deploy: 9 yangi test — GET/HEAD health, production CORS, preflight, frontend public build va URL validatsiyasi o‘tdi.
- Frontend va backend build buyruqlari o‘tdi. Docker CLI mavjud; Docker daemon ishlamagani sabab container build hali tekshirilmagan.

- Alohida frontend localhost:3003 dan backend localhost:3002 ga haqiqiy Gemini xulosa so‘rovi browserda o‘tdi; CORS xatosi yo‘q.
