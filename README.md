# Yordam — Helpdesk murojaatlar portali
Orzuqulov Davlatbek · Individual UI/UX loyiha · 3-oktabr 2026.

## Ochish
`npm start` → terminaldagi localhost havolasini oching. Band port bo‘lsa keyingisi tanlanadi.
Agent paneli: `/#dashboard`. Mijoz mobil portali: `/#client/home`. Materiallar: `/#materials`.
`npm test`: 28 ta haqiqiy avtomatik tekshiruv.

## Tayyor natijalar
- 9 agent va 10 mijoz ekran/holati. Kamida 12 talabidan yuqori; ayrimlari muhim overlay/composer holati.
- Professional yashil dizayn tizimi, responsive mijoz portali va agent desktop.
- Murojaat, fayl biriktirish, ommaviy tarix, agent navbati, ustuvorlik, mas’ul.
- Alohida public/internal qoralama, maxfiy banner, alohida saqlash amali, ommaviy javob tasdig‘i.
- Matnli kechikish, javob muddati, mijoz tasdig‘i va sabab bilan qayta ochish.
- Jonli himoyadagi “Javobsiz murojaatlar” filtri.
- 19 SVG ekran, 19 PNG reference, 19 wireframe SVG, UI kit, kontrast hisoblari.
- 10 loyiha hujjati: tadqiqot farazlari, IA, oqimlar, ekranlar, komponentlar, test, oldin-keyin va handoff.

## Fayllar
`figma_assets/screens/`: ekranlar va manifest.
`figma_assets/wireframes/`: past aniqlikdagi tuzilma.
`figma_assets/yordam-ui-kit.svg`: tahrirlanadigan dizayn tokenlari va variantlar reference.
`docs/`: topshirish hujjatlari. `docs/qa-result.md`: tekshirish natijalari.
`design_before/`: oldingi dizayn manbalari va ekran surati.
`Yordam-design-handoff.zip`: Figma importi va handoff uchun umumiy paket.

## Tugallanmagan tashqi natijalar
Figma sessiyasi ulanmagan: Figma ko‘rish havolasi va haqiqiy `.fig` nusxasi yaratilmagan.
SVGlarni import qilib, Auto Layout, component variants va prototype links ni Figma’da tuzing; ko‘rish havolasi va native nusxani o‘sha yerda eksport qiling. Yo‘riqnoma: `figma_assets/FIGMA_QOLLANMA.md`.
Haqiqiy foydalanuvchi testi o‘tkazilmagan. Tadqiqot farazlari va test blanki natija sifatida ko‘rsatilmaydi. Ball kafolatlanmaydi; topshiriqning maksimal bahosi 100.

Portal lokal ishlaydi. Murojaatlar brauzerda, biriktirilgan fayl baytlari IndexedDB’da saqlanadi; rasm preview va fayl download refreshdan keyin ham ishlaydi. Mijoz/agent xabarlari namuna oqimlari, haqiqiy tashqi xabar integratsiyasi yo‘q. Gemini xulosa va javob qoralamasi server orqali haqiqiy API’dan olinadi. Sinovni qayta boshlash: Loyiha → Namuna ma’lumotlarini tiklash.

## Gemini yordamchi
`.env` fayliga `GEMINI_API_KEY` qo‘yiladi; `.env.example` kalitsiz namuna. Kalit browserga va handoff ZIPga kiritilmaydi. Model: gemini-2.5-flash. Ichki izoh va fayl baytlari Gemini’ga yuborilmaydi; faqat ommaviy yozishmalar. Javob taklifi avtomatik yuborilmaydi.
Hozirgi ishchi server: http://localhost:3002. Server Windows fon jarayonida ishlaydi.

## Deploy
Frontend Vercel uchun `npm run build:frontend` → `dist`; buildda BACKEND_URL kerak. Backend Render/Koyeb uchun `npm run start:backend`, production’da 0.0.0.0 va hosting PORT’i ishlatiladi. CORS_ORIGINS aniq frontend domenlarini oladi. `/health`, `/ping`, `/api/health` monitor uchun tayyor.
Ildizda vercel.json, render.yaml, Dockerfile, .dockerignore va kalitsiz .env.example bor. Bosqichlar, muhit qiymatlari va UptimeRobot: [DEPLOY.md](DEPLOY.md).
