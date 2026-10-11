# Генераторы серверных артефактов из OpenAPI для чистого PHP 8.3

Тикет: #13 (wayfinder:research, часть карты #12).
Дата проверки: 11.10.2026. Все факты — по первичным источникам (сайты проектов, GitHub API, Packagist, npm registry), сверено в день публикации.

## Вердикт

**Чистый PHP достаточен.** Типы и валидация закрываются живыми, активно релизимыми инструментами без фреймворка (`jane-php/open-api-3` либо OpenAPI Generator, и `league/openapi-psr7-validator`). Единственная дыра — маршруты: готового «plain PHP»-таргета нет ни у одной из 171 цели OpenAPI Generator, но для учебного проекта роутинг покрывается composer-пакетом роутера (`league/route` или FastRoute) и либо ручной таблицей маршрутов, либо её генерацией через кастомный шаблон (`templateDir`) того же OpenAPI Generator. Переход на Slim 4 нужен только если захотим получить готовый STABLE-таргет `php-slim4` «без единой строчки рукописного роутинга» — как основание для смены стека это слабо.

## 1. PHP-типы (DTO/классы моделей из схем OpenAPI)

### Вариант A — `jane-php/open-api-3` (рекомендуется для типов)

- **Пакеты**: `jane-php/open-api-3` (OpenAPI 3.0.x), `jane-php/open-api-3-1` (3.1.x), рантайм `jane-php/open-api-runtime`, CLI-бинарь `bin/jane-openapi` приходит с `jane-php/open-api-common`. Запуск: `vendor/bin/jane-openapi generate` (опция `-c`, конфиг по умолчанию `.jane-openapi`).
- **Что генерирует**: `Model/` (классы моделей), `Normalizer/` (сериализация array↔object), `Endpoint/` + `Client/` (HTTP-клиент). Цитата из docs: «generate, in PHP, an http client and its associated models and serializers from an OpenAPI specification: version 2.0, 3.0.x or 3.1.x».
- **Активность**: релиз **v8.0.1 — 06.10.2026**, v8.0.0 — 01.10.2026, v7.14.4 — 25.09.2026. Репозиторий `janephp/janephp` не архивирован, пуш 09.10.2026, 14 открытых issues, 692 звезды. Активная ветка `next`.
- **Фреймворк не нужен**: пакет v8 требует `php ^8.3` и компоненты Symfony (`serializer`, `yaml`), т.е. библиотеки, а не фреймворк. В v7 (`^8.1`) линии совместимости ещё шире.
- **Ограничение**: Jane — про клиент и модели. Серверных маршрутов и обработчиков он не генерирует; в фикстурах есть `Validator/*Constraint.php` (валидаторные констрейнты под Symfony Validator), но это привязка к компоненту `symfony/validator`, не к фреймворку.

### Вариант B — OpenAPI Generator, клиентские PHP-таргеты

- **`-g php`** — `CLIENT`, статус **STABLE** (генерирует модели в `lib/Model` + PSR-7/PSR-18 клиент). Последний профильный фикс генератора — 23.04.2025 (`[PHP] - Add FormDataProcessor ...`), массовые обновления шаблонов — 26.04.2026.
- **`-g php-nextgen`** — `CLIENT`, статус BETA, но **самый живой из PHP-генераторов**: коммиты 12.06.2026, 23.07.2026, 30.07.2026 (`[php-nextgen] oneof polymorphism`, `Add anyof Support`, `Fix Nested oneOf/anyOf Behavior`).
- **`-g php-dt`** — `CLIENT`, BETA: клиент на `Articus/DataTransfer`, PSR-7/11/17/18. Нишевый, брать только осознанно.
- **Активность самого генератора**: `OpenAPITools/openapi-generator` не архивирован, релиз **v7.26.0 — 06.10.2026** (каждые ~1–2 месяца), пуш 09.10.2026; общий бэклог issues — 5749 (проект большой, PHP-часть — не самая приоритетная).

### Вариант C — `wol-soft/php-json-schema-model-generator`

- Иммутабельные PHP-модели + правила валидации **из JSON Schema** (компоненты OpenAPI — это и есть JSON Schema). Релиз **0.26.2 — 06.10.2025**, 83 звезды, MIT, пуш 10.10.2026, 15 issues. Без фреймворка.
- Минус: нужен промежуточный шаг «вытащить `components.schemas` из OpenAPI», т.е. лишнее звено в цепочке.

### Мелочь (упомянуть, но не опираться)

- `michaelalexeevweb/openapi-php-dto-generator` 2.15.71 — 10.10.2026, MIT: «Generate PHP DTOs from OpenAPI and validate incoming HTTP requests against OpenAPI schema». Идеально попадает в тикет, но это микро-проект (5 звёзд, 0 issues), релизы каждый день — похоже на личную/автоматизированную разработку. Как опора для стека — рано.

**Вывод по типам**: берём `jane-php/open-api-3` (точно под PHP 8.3, релизы каждый месяц) или `-g php-nextgen`, если хочется одного инструмента на клиент и типы.

## 2. Валидация запросов по контракту

### Вариант A — `league/openapi-psr7-validator` (рекомендуется)

- **Пакет**: `league/openapi-psr7-validator`, репозиторий `thephpleague/openapi-psr7-validator`.
- **Что делает**: «Validate PSR-7 messages against OpenAPI (3.0.2) specifications expressed in YAML or JSON» — параметры, тело, security, ответы. Позиционируется как PSR-15 middleware, то есть **без фреймворка**.
- **Активность**: релиз **0.24 — 08.05.2026**, 0.23 — 07.03.2026 (до этого был перерыв с 01.2024). Репозиторий не архивирован, пуш 29.05.2026, 562 звезды, **77 открытых issues** — поддержка есть, но бэклаг заметный.
- **Зависимости**: `league/uri`, `respect/validation`, `psr/*`, `riverline/multipart-parser`, парсер спеки `devizzent/cebe-php-openapi` (форк `cebe/php-openapi`; оригинал `cebe/php-openapi` 1.8.0 от 13.05.2025, 50 issues — жив, но спокойный).
- **Оговорки**: только OpenAPI **3.0.x** (для TypeSpec это `openapi-versions: ["3.0.0"]`, см. §4); в чистом PHP понадобится PSR-7-мост (`nyholm/psr7`) поверх суперглобалей `public/api.php`.

### Вариант B — `studio-design/gesso` (новичок, но живой)

- «OpenAPI 3.0/3.1/3.2 contract testing for PHP. Framework-independent core with Laravel, Symfony, Pest, PSR-7 adapters», v2.6.0 — 12.08.2026, пуш 09.10.2026, MIT, 10 звёзд, 39 issues. Покрывает 3.1/3.2 (в отличие от league), но проект молодой и почти неизвестный.

### Вариант C — схемная валидация своими руками

- `justinrainbow/json-schema` — не архивирован, пуш 01.10.2026, 3626 звёзд: валидация JSON по JSON Schema. Годится как «нижний слой», но надо самому собирать запрос из OpenAPI-схемы (кэш, ссылки, required, content-negotiation) — league это уже делает.

**Вывод по валидации**: `league/openapi-psr7-validator` — де-факто стандарт экосистемы League, активный в 2026; `gesso` — запасной вариант под OpenAPI 3.1.

## 3. Маршруты (роутинг)

### Главный факт: готового таргета «plain PHP server» нет

Каталог генераторов (https://openapi-generator.tech/docs/generators/) на 11.10.2026 содержит **171 цель**, из них **9 PHP-целей**:

| Таргет | Тип | Стабильность | Требует |
|---|---|---|---|
| `php` | CLIENT | STABLE | — (PSR-7/18) |
| `php-dt` | CLIENT | BETA | `Articus/DataTransfer` |
| `php-nextgen` | CLIENT | BETA | — |
| `php-slim4` | SERVER | **STABLE** | **Slim 4** |
| `php-symfony` | SERVER | STABLE | Symfony |
| `php-laravel` | SERVER | STABLE | Laravel |
| `php-lumen` | SERVER | STABLE | Lumen |
| `php-mezzio-ph` | SERVER | STABLE | Mezzio + PathHandler |
| `php-flight` | SERVER | EXPERIMENTAL | Flight |

**Все шесть серверных таргетов привязаны к фреймворку** — «генератор маршрутов для чистого PHP» из коробки у OpenAPI Generator отсутствует.

Активность `php-slim4`: таргет STABLE, но профильных изменений почти нет — 26.04.2026 (массовые javadoc по всем генераторам), 03.03.2025 (стиль XML), 07.07.2024 (javadoc). Т.е. он поддерживается как «стабильный и не требующий внимания», а не развивается.

### Что делать в чистом PHP

1. **Роутер-пакет** (это не фреймворк, а библиотека):
   - `league/route` **7.0.0 — 14.07.2026**, 671 звезда, ветка `7.x`, 5 открытых issues — активен, PSR-15/PSR-7, работает без фреймворка.
   - `nikic/fast-route` — 5269 звёзд, де-факто стандарт (используется внутри Slim, Mezzio и др.). Релизы: 1.3.0 (13.02.2018), 2.0.0-beta1 (04.03.2024); последние коммиты — 18.06.2025 (PHP 8.4 в CI, фиксы). Не архивирован, но «полуактивен»: стабильный релив 8-летней давности, живая мастер-ветка.
   - `mezzio/mezzio-router` 4.3.x — пуш 08.10.2026, активен, но тянет экосистему Mezzio.
2. **Генерация таблицы маршрутов** из OpenAPI одним из двух способов:
   - кастомный шаблон OpenAPI Generator: в конфиг генерации задаётся `templateDir: my_templates` (документация customization: «To support the above scenario with custom templates, ensure that you're pointing to your custom template directory») — свой `api.mustache` печатает `routes.php` для выбранного роутера;
   - либо руками: у учебного проекта единственный вход `public/api.php` и десяток маршрутов, генератор здесь экономит мало.
3. **Если нужен именно готовый серверный стаб** — тогда `php-slim4` (STABLE) и, соответственно, фреймворк Slim 4 (релиз **4.15.3 — 01.09.2026**, 1597 dependents, активно).

### Обратное направление: `zircote/swagger-php`

PHP-атрибуты/аннотации → OpenAPI-спека («Generate interactive OpenAPI documentation for your RESTful API using PHP attributes»). Релиз **6.12.0 — 06.10.2026**, 5307 звёзд, 12 issues, PHP ≥8.2, OpenAPI 3.0/3.1/3.2. Это **не** генератор серверных артефактов, а генератор спецификации — в цепочке «TypeSpec → OpenAPI» ему места нет (он был бы альтернативным источником истины, противоречащим TypeSpec).

## 4. Цепочка TypeSpec → OpenAPI → артефакты, одна команда

### TypeSpec → OpenAPI: официально и свежо

- Официальный эмиттер **`@typespec/openapi3`**: версия **1.17.0 — 08.10.2026** (compiler и `@typespec/http` — те же 1.17.0, единый релизный трейн, dev-сборки 1.18.0 идут).
- Запуск: `tsp compile . --emit=@typespec/openapi3` либо через `tspconfig.yaml`:
  ```yaml
  emit:
    - "@typespec/openapi3"
  options:
    "@typespec/openapi3":
      openapi-versions: ["3.0.0"]   # по умолчанию ["3.0.0"]
  ```
- Опция `openapi-versions`: `"3.0.0" | "3.1.0" | "3.2.0"`, default `["3.0.0"]` — важно для `league/openapi-psr7-validator` (он понимает только 3.0.x).
- Прямых TypeSpec-эмиттеров «в PHP-сервер» **нет**: официальная линейка даёт OpenAPI 3.x и JSON Schema (`@typespec/json-schema`). В GitHub по запросу `typespec php emitter` — ровно один репозиторий `picopicos/typespec-emitter-php` (1 звезда, последний пуш 21.07.2025), т.е. эксперимент. Серверные эмиттеры в сообществе есть, но для других стеков (`bison-digital/typespec-hono`, ASP.NET и др.) — это подтверждает, что связка должна быть «TypeSpec → OpenAPI → сторонний генератор».

### OpenAPI → PHP: вызов одной командой

- npm-обёртка **`@openapitools/openapi-generator-cli`**: версия **2.41.0 — 24.08.2026** (2.40.1 — 24.07.2026, 2.40.0 — 20.07.2026). Требует **Java 11+** (JVM) — единственный системный минус цепочки; есть Docker-образ `openapitools/openapi-generator-cli` и pip-обёртка `openapi-generator-cli==7.26.0`.
- Версия генератора пинится: `openapi-generator-cli version-manager set 7.26.0` (файл `openapitools.json` коммитится в репозиторий).
- `package.json` в проекте уже есть (сейчас `lint` на eslint) — цепочка кладётся в `scripts`:
  ```json
  "scripts": {
    "gen:openapi": "tsp compile api --emit @typespec/openapi3",
    "gen:client": "openapi-generator-cli generate -i build/openapi.yaml -g php -o src/Generated/Client --additional-properties packageName=AppGeneratedClient",
    "gen:types": "vendor/bin/jane-openapi generate",
    "generate": "npm run gen:openapi && npm run gen:client"
  },
  "devDependencies": {
    "@typespec/compiler": "^1.17.0",
    "@typespec/openapi3": "^1.17.0",
    "@typespec/http": "^1.17.0",
    "@openapitools/openapi-generator-cli": "^2.41.0"
  }
  ```
  Одна команда: `npm run generate`. В npm-скриптах `&&` работает и на Windows (npm исполняет их через cmd), на всякий случай есть вариант `run-s` из `npm-run-all`. Если маршруты тоже печатаем генератором — добавляется ещё один `generate` с `-c config/openapi-routes.yaml` (в конфиге `templateDir` + `files:`).

## Сводная таблица

| Артефакт | Инструмент | Статус (11.10.2026) | Без фреймворка |
|---|---|---|---|
| PHP-типы | `jane-php/open-api-3` v8.0.1 (06.10.2026) | активный, ежемесячные релизы | да (компоненты Symfony) |
| PHP-типы (альт.) | OpenAPI Generator `-g php-nextgen` (BETA) / `-g php` (STABLE) | генератор v7.26.0 (06.10.2026), nextgen правят в 07.2026 | да |
| Валидация | `league/openapi-psr7-validator` 0.24 (08.05.2026) | активный, 77 issues | да (PSR-7/PSR-15) |
| Валидация (альт.) | `studio-design/gesso` v2.6.0 (12.08.2026) | молодой, живой, 3.0/3.1/3.2 | да |
| Маршруты | готового генератора для plain PHP **нет**; `league/route` 7.0.0 (14.07.2026) / FastRoute (коммиты 06.2025) + свой шаблон `templateDir` | роутеры активны/полуактивны | да, но генерация — своим шаблоном или вручную |
| Маршруты (если фреймворк) | OpenAPI Generator `-g php-slim4` (STABLE) + Slim 4.15.3 (01.09.2026) | стабильно, без активного развития таргета | нет — нужен Slim 4 |
| Источник истины | TypeSpec `@typespec/openapi3` 1.17.0 (08.10.2026) | официальный, свежий | да |
| Вызов цепочки | `@openapitools/openapi-generator-cli` 2.41.0 (24.08.2026) | активный; нужна Java 11+ | да |

## Риски

1. **Java в цепочке** — единственный нет-PHP/TSP компонент. Если Java недоступна, замена: Docker-образ `openapitools/openapi-generator-cli`.
2. **`league/openapi-psr7-validator` понимает только OpenAPI 3.0.x** — зафиксировать в `tspconfig.yaml` `openapi-versions: ["3.0.0"]`, иначе 3.1-спека не валидируется (для 3.1 есть `gesso`).
3. **Маршруты — рукоприкладство**: ни один инструмент не печатает таблицу маршрутов для plain PHP «из коробки»; закрывается одним mustache-шаблоном или 10 строками кода.
4. **Бэклоги**: у OpenAPI Generator 5749 issues, у league-валидатора 77 — инструменты живые, но «внимания к мелочам» ждать не стоит.
5. **FastRoute** — стабильный релив 2018 года; если нужен «релизный» роутер, предпочтительнее `league/route` 7.0.0.

## Источники

- Тикет: https://github.com/SergeyBesck/ai-for-developers-project-386/issues/13
- OpenAPI Generator: https://openapi-generator.tech/docs/generators/ · https://github.com/OpenAPITools/openapi-generator/releases (v7.26.0, 06.10.2026) · https://openapi-generator.tech/docs/customization/ · https://raw.githubusercontent.com/OpenAPITools/openapi-generator/master/docs/generators/{php,php-dt,php-nextgen,php-slim4,php-symfony,php-laravel,php-lumen,php-mezzio-ph,php-flight}.md · коммиты `PhpClientCodegen/PhpSlim4ServerCodegen/PhpNextgenClientCodegen/PhpSymfonyServerCodegen` через GitHub API
- npm: https://registry.npmjs.org/@openapitools/openapi-generator-cli · https://registry.npmjs.org/@typespec%2Fopenapi3
- Jane: https://packagist.org/packages/jane-php/open-api-3 · https://packagist.org/packages/jane-php/open-api-common · https://github.com/janephp/janephp/releases (v8.0.1) · https://raw.githubusercontent.com/janephp/janephp/next/docs/openapi/getting_started.md · https://raw.githubusercontent.com/janephp/janephp/next/src/Component/OpenApiCommon/Console/Command/GenerateCommand.php · https://jane.jolicode.com/
- Валидация: https://packagist.org/packages/league/openapi-psr7-validator · https://github.com/thephpleague/openapi-psr7-validator/releases (0.24) · https://packagist.org/search.json?q=openapi+psr7+validator · https://github.com/studio-design/gesso/releases · https://github.com/cebe/php-openapi/releases · https://github.com/justinrainbow/json-schema
- Роутинг: https://github.com/thephpleague/route/releases (7.0.0) · https://github.com/nikic/FastRoute (releases + commits) · https://github.com/mezzio/mezzio-router · https://packagist.org/packages/slim/slim · https://github.com/slimphp/Slim/releases (4.15.3)
- swagger-php: https://github.com/zircote/swagger-php/releases (6.12.0) · https://raw.githubusercontent.com/zircote/swagger-php/master/README.md
- TypeSpec: https://typespec.io/docs/emitters/openapi3/reference/emitter/ (команда `tsp compile`, опция `openapi-versions`) · https://typespec.io/docs/emitters/openapi3/openapi/ · https://github.com/search?q=typespec+php+emitter · https://github.com/picopicos/typespec-emitter-php
- Прочие кандидаты: https://packagist.org/packages/wol-soft/php-json-schema-model-generator · https://github.com/wol-soft/php-json-schema-model-generator · https://github.com/michaelalexeevweb/openapi-php-dto-generator · https://github.com/search?q=openapi+generator+php
