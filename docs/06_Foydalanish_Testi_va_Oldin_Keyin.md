# Test jadvali va oldin-keyin
Sana: 3-oktabr 2026. Quyidagi texnik tekshiruvlar mahalliy brauzer prototipida bajarildi. Haqiqiy foydalanuvchi testi o‘tkazilmadi; SUS yoki 100% foydalanish muvaffaqiyati da’vo qilinmaydi.

## Qabul qilish ssenariylari
| Vazifa | Kutilgan natija | Texnik tekshiruv |
|---|---|---|
| Mijoz yangi murojaat + PNG | Qabul qilindi, fayl nomi tarixda | Brauzerda tekshirildi |
| Ichki matn → ommaviy rejim | Ommaviy qoralama bo‘sh | Brauzerda tekshirildi |
| Ichki izoh saqlash | Mijoz tarixida yo‘q, javobsiz qoladi | Brauzerda tekshirildi |
| Ommaviy javob | Qabul qiluvchi va matn tasdig‘i | Brauzerda tekshirildi |
| Agent yechim taklifi | Yechildi, mijoz tasdig‘i kutiladi | Brauzerda tekshirildi |
| Mijoz tasdig‘i | Yopilgan, tarixga voqea | Brauzerda tekshirildi |
| Qayta ochish + sabab | Qayta ochilgan, yangi muddat | Brauzerda tekshirildi |
| Javobsiz filtr | Ichki izoh javob hisoblanmaydi | Brauzer va avtomatik test |
| Matnli kechikish | “Kechikkan” va vaqt birga | Brauzerda tekshirildi |
| Mobil 390 px | Gorizontal sahifa scroll yo‘q | Brauzerda tekshirildi |

Qo‘shimcha natijalar qa-result.md faylida. Avtomatik testlar: npm test (19 ta). Gemini xulosa, javob taklifi va rasm preview qo‘shimcha brauzer sinovida tekshirildi.

## Foydalanuvchi sinovi blanki
Reja: 3 mijoz + 2 agent. Ishtirokchi roziligi olinadi. Moderator yechimni aytmaydi, faqat vazifani beradi.
| Ishtirokchi | Rol | Vazifa | Bajarildi | Vaqt | Xato | Ishonch 1–5 | Izoh |
|---|---|---|---|---|---|---|---|
| P1 | Mijoz | Fayl bilan murojaat | — | — | — | — | — |
| P2 | Mijoz | Yechimni tasdiqlash | — | — | — | — | — |
| P3 | Mijoz | Muammoni qayta ochish | — | — | — | — | — |
| P4 | Agent | Ichki izoh, so‘ng ommaviy javob | — | — | — | — | — |
| P5 | Agent | Javobsiz va kechikkanlarni topish | — | — | — | — | — |

## Oldin / keyin — haqiqiy mavjud versiya tahlili
| Oldingi versiya | Yangi versiya | Sabab |
|---|---|---|
| Zich uch ustunli ish maydoni | Bosh sahifa, navbat va tafsilot alohida | Axborot ierarxiyasi |
| Rejim almashganda bitta textarea matni qoladi | Ikki alohida qoralama | Maxfiy matn ko‘chishining oldini olish |
| Ommaviy xabar darhol yuboriladi | Matn va qabul qiluvchi tasdig‘i | Yuborish oldidan tekshirish |
| Qurilma kengligi rolni avtomatik almashtiradi | Agent/mijoz rejimi tanlanadi | Rol ustidan foydalanuvchi nazorati |
| Test buyruği faqat muvaffaqiyatni yozadi | Haqiqiy Node testlari | Tekshiriladigan dalil |

Rasmlar: design_before/desktop.png va figma_assets/desktop-after.png. Oldingi manbalar design_before/ papkasida saqlangan. Bu o‘zgarishlar foydalanuvchi intervyusi natijasi deb ko‘rsatilmaydi.

