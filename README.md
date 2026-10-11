# Календарь звонков


[![hexlet-check](https://github.com/SergeyBesck/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/SergeyBesck/ai-for-developers-project-386/actions)

Разработайте совместно с ИИ сервис для бронирования календаря

Учебный проект Хекслета: https://ru.hexlet.io/programs/ai-for-developers
Как это должно работать: https://files.hexlet.app/a/2ipc5m

## Стек

- js, html, php, css

## Установка

```bash
git clone https://github.com/SergeyBesck/ai-for-developers-project-386.git
cd ai-for-developers-project-386
composer install
npm ci
```

## Использование

php -S localhost:8000 -t public public/router.php
composer test
composer lint
npm run lint

## Генерация кода из контракта

Источник истины API — TypeSpec-контракт в `tsp/`. Вся генерация запускается одной командой:

```bash
npm run generate
```

Шаги цепочки (по отдельности — `gen:openapi`, `gen:php`, `gen:routes`, `gen:sdk`):

1. `npm run gen:openapi` — `tsp compile tsp`: TypeSpec → `openapi.json`;
2. `npm run gen:php` — jane: PHP-типы и нормализаторы → `generated/Model`, `generated/Normalizer`;
3. `npm run gen:routes` — `scripts/generate-routes.mjs`: таблица маршрутов из `openapi.json` → `generated/routes.php`;
4. `npm run gen:sdk` — `@hey-api/openapi-ts` и esbuild: клиентский SDK → `generated/sdk/` и `public/assets/sdk.gen.js`.

Всё в `generated/` и `public/assets/sdk.gen.js` — сгенерированный код, руками не править. Изменения вносятся в `tsp/main.tsp` (или в скрипты цепочки), затем прогоняется `npm run generate`. CI проверяет, что после генерации `git diff` пуст.

---

<details>
<summary>Автоматические тесты Хекслета</summary>

Тесты запускаются на каждый коммит. За запуск отвечает файл `.github/workflows/hexlet-check.yml` — не удаляйте и не переименовывайте ни его, ни репозиторий.

</details>

## О Хекслете

[Хекслет](https://ru.hexlet.io/) — школа программирования: авторские программы обучения с практикой, поддержкой наставников и реальными проектами, которые остаются в резюме. Этот репозиторий — один из таких проектов.
