# Xato oldini olish va SLA

## Ichki izoh himoyasi
1. Public va internal uchun har bir murojaatda alohida qoralama saqlanadi. Rejim almashishi matnni ko‘chirmaydi.
2. Ichki rejim amber fon, qulf va “Faqat jamoa ko‘radi. Bu izoh mijozga yuborilmaydi.” banneriga ega.
3. Tugma “Ichki izohni saqlash”; public tugma “Javobni ko‘rib chiqish”.
4. Ommaviy yuborishda overlay qabul qiluvchi nomi va yakuniy matnni ko‘rsatadi. Yakuniy tugma “Mijozga yuborish”.
5. Mijoz portalidagi tarix internal xabarlarni chiqarib tashlaydi.
Bu UX xato xavfini kamaytiradi; mutlaq xavfsizlik kafolati emas. Haqiqiy backendda ruxsat tekshiruvi shart. Bu loyiha integratsiyasiz prototip.

## SLA
Shoshilinch 30 daqiqa; yuqori 1 soat; o‘rta 4 soat; past 8 soat. Buyurtmachi bilan tekshiriladigan namuna siyosat.
Mijoz xabari kutishni boshlaydi. Ommaviy agent javobi to‘xtatadi. Ichki izoh va metadata voqeasi to‘xtatmaydi.
Ustuvorlik almashishi joriy deadline’ni o‘zgartirmaydi; keyingi mijoz xabari yangi ustuvorlikka mos muddatni boshlaydi.
Kechikish: belgi + “Kechikkan · 1 s 15 daq” + rang. Rang yagona signal emas.
Yechim taklif qilish uchun oxirgi mijoz xabariga ommaviy javob talab qilinadi.
Qayta ochish sababini kamida 5 belgi bilan yozish kerak. Holat va sabab tarixga tushadi, yangi deadline boshlanadi.

