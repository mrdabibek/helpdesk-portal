# Yordam — Figma import va topshirish

Hozirgi paket Figma native fayli emas. Figma ko‘rish havolasi va `.fig` nusxasi hali yaratilmagan.

1. Figma’da “Yordam — Helpdesk / Orzuqulov Davlatbek” dizayn faylini yarating.
2. 09_Figma_Fayl_Strukturasi.md dagi 8 sahifani yarating.
3. `yordam-ui-kit.svg` ni Design System sahifasiga import qiling.
4. `screens/A-01.svg` … `A-09.svg` ni Agent Desktop sahifasiga, `M-01.svg` … `M-10.svg` ni Client Mobile sahifasiga import qiling. SVGlar statik, tahrirlanadigan vektor va matn qatlamlaridan iborat.
5. Manrope shriftini ishlating. Font almashtirilsa matn qatorlari va element chegaralarini PNG referencelarga solishtiring. Eksport native Auto Layout, constraints yoki component instances yaratmaydi.
6. `wireframes/` SVGlarini Flows & Wireframes sahifasiga import qiling. Oqimlar `docs/02_Axborot_Tuzilmasi_va_Oqimlar.md` da.
7. Tugma, input, status, SLA, filter, composer va dialoglardan native komponentlar yarating. Default/hover/focus/disabled; public/internal; active/inactive variantlarini ulang.
8. Frame o‘lchamlari: agent reference 1440 × 1000, mijoz 390 × 844. Uzun mazmunni mos scrolling frame ichiga joylang. Manifestda to‘liq mazmun o‘lchami ko‘rsatilgan.
9. `docs/09_Figma_Fayl_Strukturasi.md` dagi bog‘lanishlarni Prototype rejimida ulang. Muhim oynalar Open overlay; rejim almashishi Change to. Reduced motion uchun qisqa yoki Instant o‘tish.
10. Present rejimida ichki izohning ommaviy qoralamaga o‘tmasligini, javobsiz filtr va mijoz qayta ochish oqimini tekshiring.
11. Figma’dan ko‘rish havolasini oling va native local copy eksport qiling. `.fig` nusxasini qayta ochib tekshiring. SVGni `.fig` deb nomlamang.
12. Haqiqiy foydalanuvchi testidan keyin 06-hujjat blankini to‘ldiring. Namuna raqamlarini tadqiqot natijasi deb topshirmang.

Eksport qatlamlari real HTML/CSS interfeysidan olingan. Ayrim CSS bezaklari, blur, soyalar va murakkab burchak radiuslari SVGda yaqinlashtirilgan. PNGlar vizual reference sifatida berilgan.
