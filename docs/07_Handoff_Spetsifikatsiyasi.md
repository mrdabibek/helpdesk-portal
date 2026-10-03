# Handoff spetsifikatsiyasi
Asosiy manbalar: app/style.css, app/app.js va SVG eksportlar. Prototip namuna ma’lumotlar bilan ishlaydi; Gemini uchun server API integratsiyasi bor; mijoz xabarlarining tashqi integratsiyasi yo‘q.

## O‘lcham va breakpoint
| Kenglik | Tuzilma |
|---|---|
| ≥1600 | Keng agent mazmuni, yon panel 300 px |
| 1251–1599 | Sidebar 224 px, content padding 34 px, yon panel 266 px |
| 1051–1250 | Sidebar 198 px, content padding 24 px |
| 761–1050 | Sidebar 185 px, KPI 2 ustun, yon ma’lumot pastga |
| ≤760 | Sidebar yashiriladi; mijoz bitta ustun, pastki navigatsiya sticky |
Mobil reference: 390 × 844. Minimum tekshiruv: 320 px. Desktop reference: 1440 × 1000.
Topbar desktop 76 px, mobile 64 px. Card radius 14 px; dialog 18 px. Grid gap 17–22 px.
Mobil mazmun padding 21 px, input min-height 48 px; desktop input 42 px, asosiy tugma 42 px, ikonka 40 px, navigatsiya 44 px. Mobil pastki navigatsiya 48 px.
Navbat jadvali mobilda o‘z konteynerida gorizontal scroll qiladi; butun sahifa kengaymaydi.

## Holatlar va xatti-harakat
Button disabled holatida opacity .45 va native disabled. Hover asosan rang orqali, transform yo‘q.
Focus-visible: 3 px #17634D halqa, offset 3 px. Barcha amallar klaviatura orqali ishlaydi. Composer tablari Left/Right/Home/End bilan almashadi.
Dialog native showModal: fokus ichida, Escape bilan bekor qilish, avvalgi fokus saqlanadi. Toast role=status; fayl xatosi role=alert.
Murojaat yaratilishi: mavzu 5–120 belgi, tavsif 10–5000, bo‘sh whitespace qabul qilinmaydi.
Fayl: PNG/JPG/PDF; ≤10 MB; ≤3 fayl; dublikat ism+hajm qo‘shilmaydi. Faylning nom/hajmi murojaatda, baytlari brauzer IndexedDB’da saqlanadi. Rasm preview va download mavjud; fayl baytlari tashqi server yoki Gemini’ga yuborilmaydi. Fayl saqlanmasa yuborish to‘xtaydi va xato matni ko‘rsatiladi.
Izoh/javob: ≤5000 belgi. Rejim qoralamalari alohida, seansda saqlanadi; refreshdan keyin qoralama tiklanmaydi.
Murojaat ma’lumotlari localStorage’da. Saqlash ishlamasa xabar chiqadi va joriy seans davom etadi.
Qayta ochish: majburiy sabab 5–1000 belgi, yangi deadline, mijoz xabari va tarix voqeasi.
Reduce motion sozlamasida transition o‘chadi. Boshlang‘ich rol faqat ilk ochishda ekran kengligidan olinadi; resize tanlangan rolni o‘zgartirmaydi.

## Kontrast
Asosiy oq/yashil, matn/oq, muted/oq, amber/yumshoq sariq, kechikish/qizg‘ish juftlari uchun hisoblangan nisbatlar contrast.json da.
Rangdan tashqari matn va ikonka ishlatiladi. Native input chegaralari yumshoq; fokus halqasi kuchli. Yakuniy Figma’da eksport shriftlari, matn o‘ralishi va kontrast qayta ko‘riladi. Bu to‘liq accessibility auditi deb ko‘rsatilmaydi.

## Figma handoff
SVG import editable vektor qatlamlar beradi. Auto Layout, component variants, interactive links va Dev Mode izohlari Figma’da qayta tuziladi. Layer/frame nomlari 09-hujjatdagi IDlarga mos.


## Gemini holatlari
Gemini xulosasi va Javob taklif qilish: idle / loading / success / error. Internal rejimda javob taklifi disabled. Mavjud qoralama bo‘lsa, almashtirish uchun dialog ochiladi. Natija qoralamaga qo‘yiladi; yuborish alohida tasdiqlanadi. API timeout 30 s; matn faqat plain text va escaped HTML sifatida ko‘rsatiladi.
