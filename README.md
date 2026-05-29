# ✨ Lumio — Premium Productivity Suite

> Notion + Apple uslubidagi mukammal produktivlik dasturi. Talabalar va o'zini rivojlantirishga jiddiy munosabatda bo'lganlar uchun.

[![Demo](https://img.shields.io/badge/Demo-Live-success?style=for-the-badge)](https://xarpbek.github.io/meniki)
[![Version](https://img.shields.io/badge/Version-1.1-blue?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)]()

---

## 🌟 Nimaga Lumio?

Lumio **vazifalar, odatlar, fokus, maqsadlar, qaydlar, sport, ovqatlanish, meditatsiya** va **15+ mini ilovalar**ni bitta minimalistik dasturda birlashtirgan. Apple va Notion dizayn tilida — toza, hech qanday ortiqcha narsa yo'q.

🔗 **Live demo:** [xarpbek.github.io/meniki](https://xarpbek.github.io/meniki)

---

## 🎯 Asosiy Imkoniyatlar

### 🏠 Dashboard
- Kunlik produktivlik ball (0-100)
- Streak tracker
- Bugungi vazifalar va odatlar
- Productivity Pet 🐱 (8 darajali evolyutsiya)
- Daily Quests — har kuni 3 ta missiya
- Mini taqvim, fokus va suv widgetlari
- Vaqtga qarab o'zgaruvchi gradient fon

### ✅ Vazifalar
- 🗂 Kanban + List ko'rinish
- 🎯 Ustuvorlik darajasi
- 📅 Muddat va kategoriyalar
- 🎤 Ovoz orqali qo'shish (Web Speech API)
- 🤖 Smart filter va sort

### ⚡ Odatlar
- Daily / Weekly / Monthly
- 📊 Yillik heatmap (GitHub uslubida)
- 🔥 Streak system
- 😊 Kayfiyat tracker
- ⭐ Qiyinlik darajasi
- 🎨 Rang va emoji belgilar
- 12 ta tayyor shablon

### 🎯 Fokus rejim
- 🎬 Sinematik fullscreen
- ⏱ Pomodoro (15/25/50 daq)
- 🌧 6 ambient ovoz: yomg'ir, o'rmon, okean, kafe, oq shovqin
- 🎨 Dinamik fon
- 🎵 Web Audio API (no external files)

### 🎯 Maqsadlar
- Qisqa va uzoq muddatli
- Bosqichlar (milestones)
- Progress tracking
- 6 ta SMART goal shabloni

### 📝 Qaydlar
- Markdown qo'llab-quvvatlash
- 🏷 Teglar
- 🔍 Qidiruv

### 📚 O'qish
- Fanlar boshqaruvi
- Imtihonlar countdown
- 🎴 Flashcards (3D flip animation)

### 📅 Yangi sahifalar
- 📅 To'liq oylik taqvim
- 💪 Sport tracker (sets/reps)
- 🍽 Ovqatlanish (kaloriya, makro)
- 🧘 Meditatsiya (4-7-8, Box, Deep)
- 📚 Kitoblar
- ✨ AI Insights (rule-based smart tips)
- 📊 Advanced Analytics (Chart.js)

### 🛠 Mini Ilovalar
| Ilova | Tasvif |
|-------|--------|
| 🧮 Kalkulyator | Asosiy + ilmiy |
| ⏱ Sekundomer | Lap support |
| ⏲ Taymer | Hisob orqaga |
| 🎵 Oq shovqin | 6 turdagi |
| 🔄 Konverter | Birliklar |
| 💰 Xarajat | Pul boshqaruvi |
| 😴 Uyqu | Kuzatuv |
| 📔 Kundalik | Kunlik fikr |
| 📱 QR Generator | API orqali |
| 🔐 Parol generator | Custom rules |
| ⚖ BMI | Kalkulyator |
| 💵 Tip | Bo'lib hisoblash |
| 🌍 World Clock | 6 shahar |
| 🎨 Color Picker | HEX/RGB/HSL |
| ✍ Markdown | Live preview |

### 🎮 Gamification
- ⚡ XP system
- 📈 Daraja (1-50+)
- 🏆 16 ta Achievement
- 🐱 Pet evolution (Egg → Dragon)
- 🎯 Daily Quests
- 🎉 Confetti celebrations

### 🎨 Dizayn
- ☀️ Light / 🌙 Dark mode
- 6 ta accent rang: Klassik, Okean, O'rmon, Quyosh, Siyohrang, Atirgul
- Glassmorphism
- Apple/Notion uslubi
- Smooth animations

### ⌨️ Keyboard Shortcuts
- `⌘K` — Command palette
- `N` — Yangi vazifa/odat
- `F` — Fokus rejim
- `T` — Mavzu
- `V` — Ovoz orqali kiritish
- `?` — Yordam tour
- `Esc` — Yopish

### 📲 Tech Stack
- ✅ **Vanilla JS** (no framework)
- ✅ **PWA** (Service Worker, offline-first)
- ✅ **localStorage** persistence
- ✅ **Auto backup** (har hafta)
- ✅ **JSON export/import**
- ✅ **Chart.js** for analytics
- ✅ **Web Speech API** for voice
- ✅ **Web Audio API** for sounds
- ✅ **3 til**: O'zbek / English / Русский

---

## 🚀 Boshlash

### Online ishlatish
[xarpbek.github.io/meniki](https://xarpbek.github.io/meniki) ga boring va **"Add to Home Screen"** bilan haqiqiy ilovadek o'rnating.

### Lokal ishga tushirish
```bash
git clone https://github.com/xarpbek/meniki.git
cd meniki
# Static site - browser orqali oching:
python3 -m http.server 8000
# Yoki:
npx serve .
```

Keyin [http://localhost:8000](http://localhost:8000) ni oching.

---

## 📁 Loyiha tuzilishi

```
meniki/
├── index.html      # Asosiy markup (1000+ qator)
├── style.css       # Premium dizayn (2000+ qator)
├── app.js          # Barcha logika (3500+ qator)
├── confetti.js     # Confetti + sound effects
├── sw.js           # Service worker (PWA)
├── manifest.json   # PWA manifest
└── README.md       # Bu fayl
```

---

## 💾 Ma'lumotlar

Barcha ma'lumotlar **localStorage**'da xavfsiz saqlanadi. Brauzer tarixini tozalamasangiz hech narsa yo'qolmaydi.

**Backup:** Sozlamalar → Ma'lumotlar → Eksport (JSON)

**Auto Backup:** Har hafta avtomatik (Sozlamalar'da yoqilsa)

---

## 🎓 Foydalanuvchi qo'llanmasi

Birinchi marta ochganda **4 qadamli onboarding** ko'rsatiladi. Tugagandan keyin **interaktiv tour** (yordam tugmasi orqali har doim qaytadan ochishingiz mumkin).

Aksariyat ko'p bosiladigan tugmalarda **tooltip**lar bor (hover qilib ko'ring).

---

## 🛡 Maxfiylik

Lumio:
- ❌ Hech qanday tracker yo'q
- ❌ Hech qanday analytics yuborilmaydi
- ❌ Hech qanday tashqi server'ga ulanmaydi
- ✅ 100% client-side
- ✅ Barcha ma'lumotlar sizning qurilmangizda

---

## 🤝 Hissa qo'shish

Pull request'lar mamnuniyat bilan qabul qilinadi! Katta o'zgarishlar uchun avval issue oching.

---

## 📝 Litsenziya

MIT License — istalgan loyihada erkin foydalaning.

---

## ❤️ Tashakkurlar

Lumio quyidagi loyihalardan ilhomlandi:
- **Notion** — minimalistik dizayn
- **Apple** — animation va spacing
- **TickTick** — task management
- **Todoist** — productivity philosophy
- **GitHub** — heatmap idea

---

<div align="center">

**Made with ❤️ in Uzbekistan**

[Live Demo](https://xarpbek.github.io/meniki) · [Issues](https://github.com/xarpbek/meniki/issues) · [Discussions](https://github.com/xarpbek/meniki/discussions)

</div>
