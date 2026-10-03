# Ekranlar va wireframe
Asosiy o‘lchamlar: agent 1440 × 1000, mijoz 390 × 844. Uzun mazmun vertikal scroll qiladi.
9 desktop ekran/holat va 10 mobil ekran/holat. A-05, A-06, M-06, M-07 bir asosiy ekran ustidagi muhim rejim yoki overlay; mustaqil qabul qilish holatlari sifatida ko‘rsatiladi.

| ID | Ekran | Asosiy vazifa | Prototip hash |
|---|---|---|---|
| A-01 | Bosh sahifa | Ko‘rsatkichlar, navbat, muddat, yuklama | #dashboard |
| A-02 | Navbat | Qidirish, filtr, tartiblash | #queue |
| A-03 | Javobsiz navbat | Agent javobini kutayotganlar | #unanswered |
| A-04 | Tafsilot | Yozishmalar, ustuvorlik va mas’ul | #ticket/8492 |
| A-05 | Ichki izoh | Faqat jamoaga yozish | #ticket/8492/internal |
| A-06 | Ommaviy javob tasdig‘i | Matn va qabul qiluvchi | #ticket/8492/preview |
| A-07 | Jamoa | Agent yuklamalari | #team |
| A-08 | Hisobotlar | Namuna navbat statistikasi | #reports |
| A-09 | SLA qoidalari | Javob muddatlari | #sla |
| M-01 | Bosh sahifa | Yangi murojaat va faol so‘rovlar | #client/home |
| M-02 | Mening murojaatlarim | Faol/yopilgan ro‘yxat | #client/list |
| M-03 | Yangi murojaat | Maydonlar va fayl biriktirish | #client/create |
| M-04 | Qabul qilindi | Raqam, holat, kutilgan muddat | #client/created |
| M-05 | Tafsilot | Ommaviy xabarlar tarixi | #client/ticket/8492 |
| M-06 | Yechim tasdig‘i | Mijozning yakuniy qarori | #client/resolution/8482 |
| M-07 | Qayta ochish | Majburiy sabab | #client/reopen/8472 |
| M-08 | Yangiliklar | Javob va holat yangiliklari | #client/notifications |
| M-09 | Bilimlar bazasi | Qidirish va maqola ro‘yxati | #client/knowledge |
| M-10 | Maqola | Qadamlar va murojaatga o‘tish | #client/article/0 |

Wireframelar: figma_assets/wireframes/ ichida. Asosiy ekranlarning SVG eksportlari figma_assets/screens/ ichida. SVGlar rang, matn, kontur va elementlar joylashuvini beradi; Figma Auto Layout yoki native component variantlarini avtomatik yaratmaydi.

## Wireframe tamoyillari
Agent: chap navigatsiya 224 px → yuqori panel 76 px → sarlavha → KPI 4 ustun → navbat + yon ma’lumot.
Tafsilot: sarlavha → yozishmalar va composer / yon metadata va SLA.
Mijoz: yuqori brend → bitta ustundagi mazmun → 4 bandli pastki navigatsiya.
Bo‘sh navbat, qidiruv natijasi yo‘q, bo‘sh majburiy maydon, fayl xatosi va disabled tugma ham komponent holatlari sifatida mavjud.

