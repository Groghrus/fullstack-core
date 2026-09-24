# fullstack-core

Личный тренажёр и учебник по **backend**, **system design** и языкам программирования (**TypeScript / Go / Java**).

## Деплой: [fullstack-core.vercel.app](https://fullstack-core.vercel.app/)

## Структура

```
apps/
  web/        Next.js-приложение (тренажёр, учебник, quiz)
  mobile/     React Native (Expo) — офлайн-читалка контента
packages/
  content/    Материалы по темам (Markdown + mermaid + quiz)
  config/     Общие типы и конфигурация
doc/          Документация проекта
```

## Стек

- TypeScript
- Next.js (App Router)
- Content Layer / MDX для статического контента
- React Native (Expo) — офлайн-читалка той же библиотеки контента
- Прогресс/закладки — сохраняются в localStorage 

## Контент

Темы описаны в `packages/content/themes/` — каждый блок соответствует логической категории из `system design`. Содержимое — по сложному формату: определение, примеры на 3 языках, диаграммы, паттерны/антипаттерны, quiz и источники.

## Быстрый старт

```bash
npm install
npm run dev        # запуск веб-тренажёра
```

## Мобильное приложение (Expo)

Офлайн-читалка: контент и mermaid-диаграммы конвертируются в TS-бандл, поэтому на устройство не нужен интернет и сервер.

```bash
# 1. Перегенерировать контент (md + registry + titles + mermaid→SVG)
npm run bundle:content -w mobile

# 2. Запуск
cd apps/mobile
npx expo start                  # dev-сервер + QR для Expo Go
npx expo start --web            # то же, но открыть можно в браузере (localhost:8081)
```

- **Real-устройство**: установить **Expo Go**, телефон и ПК в одной сети → отсканировать QR из терминала `expo start`. Если не видит сеть, поднять туннель по USB: `adb reverse tcp:8081 tcp:8081`, затем в Expo Go → *Enter URL manually* → `exp://localhost:8081`.
- **Браузер**: `npx expo start --web` → открой `http://localhost:8081`. Диаграммы рендерятся через `dangerouslySetInnerHTML` (native — через `react-native-webview`).
- **Сборка APK**(нужен Android SDK + JDK):
```bash
cd X:\XXX\fullstack-core\apps\mobile
npx expo prebuild --clean --platform android
cd android
$env:ANDROID_HOME = "X:\Users\XXX\AppData\Local\Android\Sdk"
./gradlew assembleRelease
```
