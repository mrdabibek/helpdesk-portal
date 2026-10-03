# Axborot tuzilmasi va oqimlar

## Tuzilma
Agent: Bosh sahifa → Murojaatlar → Tafsilot → Javob / Ichki izoh / Ustuvorlik / Mas’ul / Yechim.
Agent yordamchi bo‘limlari: Javobsiz murojaatlar, Hisobotlar, Jamoa, Bilimlar bazasi, SLA qoidalari.
Mijoz: Bosh sahifa → Murojaatlarim / Yangi murojaat / Yordam / Yangiliklar.
Loyiha: ekranlar xaritasi, hujjatlar, UI kit, oldin-keyin.

## Mijoz yangi murojaati
```mermaid
flowchart LR
 A[Bosh sahifa] --> B[Yangi murojaat]
 B --> C[Toifa, mavzu, tavsif]
 C --> D[Ixtiyoriy fayl]
 D --> E{Maydonlar to‘g‘rimi?}
 E -- Yo‘q --> C
 E -- Ha --> F[Qabul qilindi]
 F --> G[Tafsilot va javob muddati]
```

## Agent javobi
```mermaid
flowchart LR
 A[Navbat] --> B[Javobsiz filtr]
 B --> C[Murojaat tafsiloti]
 C --> D{Xabar turi}
 D -- Ichki --> E[Alohida maxfiy qoralama]
 E --> F[Ichki izohni saqlash]
 F --> B
 D -- Ommaviy --> G[Alohida mijoz qoralamasi]
 G --> H[Qabul qiluvchi va matnni tekshirish]
 H --> I[Mijozga yuborish]
 I --> J[Mijoz javobini kutish]
```

## Yechim va qayta ochish
```mermaid
flowchart LR
 A[Agent ommaviy yechim yozadi] --> B[Yechim taklif qilish]
 B --> C[Yechildi, mijoz tasdig‘i kutilmoqda]
 C --> D{Muammo hal bo‘ldimi?}
 D -- Ha --> E[Tasdiqlash oynasi]
 E --> F[Yopilgan]
 D -- Yo‘q --> G[Sabab yozish]
 F --> G
 G --> H[Qayta ochilgan]
 H --> I[Yangi javob muddati va javobsiz navbat]
```

Holatlar: Yangi → Jarayonda → Yechildi → Yopilgan. Yechildi yoki Yopilgan → Qayta ochilgan → Jarayonda.
Mijoz oxirgi ommaviy xabarni yuborganda javobsiz hisoblanadi. Ichki izoh va holat voqealari bu hisobni o‘zgartirmaydi. Yechildi va Yopilgan aktiv navbatdagi javobsiz filtrga kirmaydi.

