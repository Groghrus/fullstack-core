# fullstack-core

Личный тренажёр и учебник по **backend**, **system design** и языкам программирования (**TypeScript / Go / Java**).

## Деплой: [fullstack-core.vercel.app](https://fullstack-core.vercel.app/)

## Структура

```
apps/
  web/        Next.js-приложение (тренажёр, учебник, quiz)
  mobile/     React Native (Expo) — запланировано
packages/
  content/    Материалы по темам (Markdown + mermaid + quiz)
  config/     Общие типы и конфигурация
doc/          Документация проекта
```

## Стек

- TypeScript
- Next.js (App Router)
- Content Layer / MDX для статического контента
- React Native (Expo) — позже
- Прогресс/закладки — localStorage (личное приложение, БД не нужна)

## Контент

Темы описаны в `packages/content/themes/` — каждый блок соответствует логической категории из `system design`. Содержимое — по сложному формату: определение, примеры на 3 языках, диаграммы, паттерны/антипаттерны, quiz и источники.

## Быстрый старт

```bash
npm install
npm run dev        # запуск веб-тренажёра
```
