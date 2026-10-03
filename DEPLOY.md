# Vercel + Render / Koyeb deploy

Bir repo, ikki deploy. Frontend — HTML/CSS/JS; backend — Node 24 Gemini proxy.
Murojaatlar localStorage, fayllar IndexedDB’da. Hozir database, login, JWT yoki qurilmalararo sinxronlash yo‘q; DATABASE_URL/JWT_SECRET kerak emas.

## 1. Repository

Papka hozir Git repository emas. GitHub’ga ushbu loyihani joylang; `.env`, `dist/`, loglar va `.vercel/` commit qilinmaydi. `.env.example` kalitsiz.
Backend va frontend uchun bir xil repository va Root Directory `.` ishlatiladi.

| Platforma | Build | Start / output |
|---|---|---|
| Vercel | `npm run build:frontend` | `dist` |
| Render | `npm ci --omit=dev` | `npm run start:backend` |
| Koyeb | ildizdagi `Dockerfile` | image CMD; port `8000` |

`npm ci` package-lock.json bilan ishlaydi. Qo‘shimcha runtime dependency yo‘q.

## 2. Backend — Render

1. Render → New → Blueprint → repository → `render.yaml`.
2. `yordam-api` uchun Free plan. NODE_ENV=production, HOST=0.0.0.0, Node 24 konfiguratsiyada bor.
3. GEMINI_API_KEY’ni Render secret environment variable sifatida kiriting.
4. CORS_ORIGINS’ga kutilayotgan frontend originini yozing, masalan `https://yordam.vercel.app`. Keyin haqiqiy Vercel domeniga yangilang.
5. PORT’ni Render beradi; hardcode yoki port izlash production’da ishlatilmaydi.
6. Deploy tugaganda `https://SIZNING-BACKEND.onrender.com/health` 200 va `ready:true` qaytarsin.

Manual Web Service tanlansa shu build/start buyruqlari, Node 24, Free plan va Health Check Path `/health` qo‘yiladi. [Render Blueprint hujjati](https://render.com/docs/blueprint-spec).

## 3. Backend — Koyeb alternativasi

1. Web Service → GitHub repository → Dockerfile builder → Dockerfile path `Dockerfile`, build context `.`.
2. Free instance mavjudligini accountda tekshiring. Exposed HTTP port `8000`, route `/`, PORT=8000.
3. NODE_ENV=production, HOST=0.0.0.0, GEMINI_MODEL=gemini-2.5-flash; GEMINI_API_KEY secret, CORS_ORIGINS haqiqiy Vercel origin.
4. HTTP health check `/health`; deploydan keyin public URL `/health` ni tekshiring.

Image faqat backend fayllarini oladi; `.env` build contextdan chiqarilgan, non-root `node` foydalanuvchisi ishlaydi. [Koyeb deploy](https://www.koyeb.com/docs/build-and-deploy), [port sozlash](https://www.koyeb.com/docs/build-and-deploy/exposing-your-service).

## 4. Frontend — Vercel

1. Add New Project → shu repository. Framework Preset `Other`, Root Directory `.`. `vercel.json` build va outputni belgilaydi.
2. Environment Variables: BACKEND_URL=`https://SIZNING-BACKEND.onrender.com` yoki Koyeb public origin. Production va Preview uchun kiriting. Oxiriga `/api` qo‘shmang.
3. Deploy. BACKEND_URLsiz Vercel build aniq xato bilan to‘xtaydi. GEMINI_API_KEY’ni Vercel frontendga kiritmang.
4. Hosil bo‘lgan Vercel originni backend CORS_ORIGINS’ga yozing va backendni redeploy qiling.
5. Preview domenlari kerak bo‘lsa har bir aniq originni vergul bilan qo‘shing. `*` va barcha `*.vercel.app` domenlari ochilmaydi.

Build `dist/app/config.js` ichiga faqat ommaviy API originini yozadi. Barcha hash ekranlar `/#dashboard`, `/#client/home` orqali ishlaydi; SPA catch-all rewrite kerak emas. `.env` va server kodi frontend outputda yo‘q. [Vercel konfiguratsiyasi](https://vercel.com/docs/project-configuration/vercel-json).

## 5. Environment variables

| Nom | Qayerda | Vazifasi |
|---|---|---|
| GEMINI_API_KEY | faqat backend secret | Gemini autentifikatsiyasi |
| GEMINI_MODEL | backend | default gemini-2.5-flash |
| NODE_ENV | backend | production: public bind, aniq PORT, port fallback yo‘q |
| HOST | backend | production 0.0.0.0; lokal 127.0.0.1 |
| PORT | backend | Render beradi; Koyeb 8000; lokal 3002 |
| CORS_ORIGINS | backend | ruxsatli frontend originlari, vergul bilan |
| BACKEND_URL | Vercel build | public backend HTTPS origin |

`.env.example` — to‘liq namuna. Docker portidagi o‘zgarish exposed port bilan mos bo‘lsin. Kalitlarni GitHub, browser yoki ZIPga yozmang.

## 6. UptimeRobot va bepul tarif

UptimeRobot → Add New Monitor → HTTP(s) → URL `https://SIZNING-BACKEND/health` → interval 5 daqiqa → expected status 200. Monitor aynan backendni tekshirsin. Frontend yoki `/robots.txt` ni tekshirish backendni uyg‘otmasligi mumkin. Endpoint tashqi Gemini so‘rovi yubormaydi va API kvotasini ishlatmaydi. [UptimeRobot qo‘llanmasi](https://help.uptimerobot.com/en/articles/11358364-how-to-create-your-first-monitor-on-uptimerobot-quick-setup-guide).

Render Free 15 daqiqa kiruvchi trafik bo‘lmasa uxlaydi; workspacega oyiga 750 bepul instance-soat beriladi. Koyeb Free bir soat trafiksiz qolsa zero holatiga tushadi. Muntazam monitor HTTP so‘rovlari trafik beradi, lekin bepul tariflarda 24/7 ishlash kafolati yo‘q; kvota, restart va platforma cheklovlari saqlanadi. [Render Free](https://render.com/docs/free), [Koyeb Free](https://www.koyeb.com/docs/reference/instances).

## 7. Deploydan keyin tekshirish

- Backend `/health`, `/ping`, `/api/health`: GET/HEAD 200, Cache-Control no-store.
- Vercel agent paneli → murojaat → Gemini xulosasi va javob taklifi. Browser Network’da OPTIONS 204 va POST 200.
- Ichki izoh → Gemini javob taklifi o‘chirilgan; ichki matn request body’da yo‘q.
- Mijoz → murojaat/fayl yaratish → refresh → tarix va rasm preview.
- Noma’lum Origin API’da 403; `.env` backendda403, Vercelda404.

Lokal: `npm test` va `npm run build:backend`. Alohida frontendni sinash uchun backendda CORS_ORIGINS=`http://localhost:3003` qo‘yib `npm start` bilan ishga tushiring. Boshqa PowerShell’da `$env:BACKEND_URL='http://localhost:3002'` → `npm run build:frontend` → `npm run preview:frontend`. Frontend `http://localhost:3003` da ochiladi. Production uchun HTTPS backend URL ishlating. Build `.env`ni o‘qimaydi; o‘zgaruvchini jarayonga yoki hosting paneliga bering.

Tekshirildi: 28/28 avtomatik test, frontend va backend build. Docker daemon lokal ishlamayapti; image build/runtime va haqiqiy hosting deploy hali tekshirilmagan. Hosting account/GitHub repository bilan deploy bu tayyorlash bosqichidan keyin bajariladi.

CORS brauzer origin nazorati; login/autentifikatsiya o‘rnini bosmaydi. Gemini endpointida global 20/minut va 2 parallel so‘rov limiti bor. Ushbu deploy individual demo uchun; umumiy production helpdesk uchun serverdagi ticket bazasi va foydalanuvchi autentifikatsiyasi alohida ish.
