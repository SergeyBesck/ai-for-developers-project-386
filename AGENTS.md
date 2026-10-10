# AGENTS.md

PHP 8.3 без фреймворка + HTML/CSS/JS без сборки.

## Структура
- public/ — веб-корень (index.html, api.php, assets/)
- src/ — классы бэкенда, namespace App
- tests/ — PHPUnit

## Команды
- Запуск: `php -S localhost:8000 -t public`
- Тесты: `composer test`
- Линт: `composer lint && npm run lint`
 
  

## Правила
- Перед завершением задачи прогнать тесты и линтеры.
- SQL только через PDO prepared statements.
- В JS пользовательский текст выводить через textContent, не innerHTML.
- Не править вручную CHANGELOG.md и .release-please-manifest.json.
- ОС разработки: Windows/PowerShell, команды без `&&` и `mkdir -p`

## Коммиты
Conventional Commits: `type(scope): описание`.
Типы: feat, fix, docs, refactor, test, chore, ci. Breaking change: `!` после типа
или `BREAKING CHANGE:` в теле. Релизы строит release-please по этим коммитам.