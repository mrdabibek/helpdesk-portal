# Figma fayl strukturasi va topshirish holati

## Paket holati
Tayyor: mahalliy bosiladigan prototip, 19 ekran/holat SVGlari, wireframe SVGlari, UI kit, hujjatlar, texnik test, oldin-keyin rasmlar.
Hali tayyor emas: Figma ko‘rish havolasi, native .fig fayl, native component variants va Figma prototip bog‘lanishlari. Ular Figma sessiyasida yaratiladi. SVG faylni .fig deb qayta nomlash mumkin emas.
Haqiqiy foydalanuvchi testi ham hali o‘tkazilmagan.

## Tavsiya etilgan sahifalar
01 Cover & Brief
02 Research & IA
03 Flows & Wireframes
04 Design System
05 Client Mobile
06 Agent Desktop
07 Prototype & Test
08 Handoff & Iterations

## Import
figma_assets/screens/ SVGlarini mos Client/Agent sahifaga import qiling.
figma_assets/wireframes/ past aniqlikdagi sxemalar.
figma_assets/yordam-ui-kit.svg dizayn tizimi.
A-01…A-09 desktop, M-01…M-10 mobile/overlay.
SVG eksport DOMdan olingan statik qatlamlar; Auto Layout va komponentlarni qo‘lda tuzing. Rasmlar va SVGlar native .fig o‘rnini bosmaydi.

## Prototip bog‘lanishlari
A-01 Navbatga o‘tish → A-02.
A-02 Javobsiz → A-03; ticket → A-04.
A-04 Ichki izoh → A-05; Mijozga javob → A-04 public; ko‘rib chiqish → A-06 overlay.
A-06 Bekor → oldingi composer; yuborish → ommaviy xabar va count kamayishi.
M-01 Yangi murojaat → M-03 → M-04 → M-05.
M-05 Yechildi holati → M-06 overlay → Yopilgan variant.
M-05 Muammo qolgan → M-07 overlay → Qayta ochilgan variant.
M-01 Yangiliklar → M-08. Yordam → M-09 → M-10.

## Topshirishdan oldin
Figma ichidagi barcha oqimlarni Present rejimida tekshiring.
Share orqali ko‘rish huquqini belgilang va havolani READMEga kiriting.
Figma faylining native nusxasini eksport qiling, .fig faylni alohida tekshiring.
Hisobotdagi “rejalashtirilgan” test kataklarini faqat haqiqiy sinovdan keyin to‘ldiring.

