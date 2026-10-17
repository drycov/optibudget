# OptiBudget

PWA для инженерной оценки оптического бюджета PON-линий, каскадных топологий и **реальных трасс на карте**.

Версия **0.2**: карта (Leaflet/OSM) + измерение длины волокна + **Supabase** для облачных проектов.

## Возможности

- Профили GPON, EPON, 10G-EPON, XG-PON, XGS-PON и XPON с редактируемыми оптическими параметрами.
- Линейный калькулятор потерь волокна, PLC/FBT-сплиттеров, сварок и соединителей.
- **Каскадная топология**: OLT → магистральное волокно → PLC/FBT → абонентские ветки → несколько ONT/ONU.
- **Карта трасс** (OpenStreetMap + Leaflet): рисование полилиний, haversine-длина, slack-фактор, **автопривязка нескольких сегментов** к каскаду, экспорт GeoJSON.
- **Каталог** с происхождением данных (Corning datasheet + шаблоны).
- **Supabase**: регистрация/вход, сохранение и загрузка проектов (линейный расчёт + топология + map routes), RLS.
- Журнал, CSV/JSON/печать, PWA + Service Worker.

## Запуск

Требуется Node.js 22+.

```bash
npm install
cp .env.example .env.local   # опционально, для Supabase
npm run dev
```

## Supabase

1. Создайте проект на [supabase.com](https://supabase.com).
2. SQL Editor → выполните файл `supabase/schema.sql`.
3. Authentication → Email provider (включить).
4. Settings → API → `Project URL` и `anon public` key → в `.env.local`:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

5. Перезапустите `npm run dev`. Без env приложение работает полностью локально.

## Карта → каскад

1. Вкладка **Каскад** — узлы волокна (или пустая схема с OLT).
2. Вкладка **Карта** — несколько трасс (магистраль + ветки).
3. **Автопривязка всех** — свободные fiber по глубине дерева; недостающие создаются под OLT; несколько трасс на один узел **суммируют** длину.
4. Каскад пересчитывает RX/бюджет.

Центр карты по умолчанию: Усть-Каменогорск (49.948, 82.628).

## Vercel (optibudget-gray.vercel.app)

См. `docs-vercel-env.md` и `vercel.json`.

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

После задания env — Redeploy без кэша. Supabase Auth Site URL: `https://optibudget-gray.vercel.app`.

## Проверка

```bash
npm test
npm run build
```

## Инженерные ограничения

Стартовые профили и шаблоны каталога **не являются паспортными данными**. Сверяйте TX/RX/IL с datasheet. Длина по карте — геодезическая; добавляйте slack 3–10% на петли и обходы.
