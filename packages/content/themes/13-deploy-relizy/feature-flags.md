---
id: feature-flags
block: 13-deploy-relizy
tags: [feature-flags, flags, rollout, release, experimentation]
order: 1
related: [canary-releases, blue-green-deployment, rollbacks]
difficulty: beginner
languages: [typescript, go, java]
status: done
---

# Feature Flags (Флаги функций)

Feature Flags — это механизм управления доступностью функций приложения без необходимости пересобирать и деплоить новый релиз.

## Зачем нужны Feature Flags

Выпуск новой функции в продакшн — это риск.
- **Быстрый откат:** Если функция сломалась, её можно отключить одной настройкой без нового деплоя.
- **A/B-тестирование:** Новая функциональность доступна только части пользователей.

## Как работают Feature Flags архитектура

```mermaid
flowchart TD
    A[Код приложения] --> B[Feature Flag Store]
    B --> C{Функция включена?}
    C -->|да| D[Новая логика]
    C -->|нет| E[Старая логика]
    A@{ shape: brace-r, label: "Feature Flag Flow" }
```

```mermaid
sequenceDiagram
    participant App as Приложение
    participant Store as Flag Store
    participant Admin as Администратор
    Admin->>Store: Включить flag=NEW_UI
    App->>Store: Проверить flag
    Store-->>App: enabled=true
    App->>App: Показать новый интерфейс
```

## Примеры кода

> Ключевые сценарии: настройка Feature Flag в коде приложения.

### TypeScript Feature Flag (условный рендеринг)

```typescript
const isNewCheckoutEnabled = getFeatureFlag('new_checkout')

if (isNewCheckoutEnabled) {
  return <NewCheckout />
}
return <LegacyCheckout />
```

## Вопросы

### Q1
**Что такое Feature Flag?**
- [ ] Шифрование данных
- [x] Переключатель, управляющий доступностью функции без нового деплоя
- [ ] База данных
- [ ] Система мониторинга

Пояснение: Flag позволяет включать или отключать функции в runtime.

### Q2
**Главное преимущество Feature Flags?**
- [ ] Ускорение компиляции
- [x] Возможность быстро отключить проблемную функцию без релиза
- [ ] Уменьшение размера приложения
- [ ] Шифрование трафика

Пояснение: Отключение flag не требует пересборки и повторного деплоя.

### Q3
**Что такое A/B-тестирование с Feature Flags?**
- [ ] Сравнение двух версий API
- [x] Демонстрация функции разным группам пользователей для измерения метрик
- [ ] Тестирование на двух браузерах
- [ ] Сравнение серверов

Пояснение: Разные пользователи видят разные версии функциональности.

### Q4
**Что происходит при включении Feature Flag?**
- [ ] Приложение перезагружается
- [x] Новая логика начинает применяться у пользователей
- [ ] Удаляются старые данные
- [ ] Отключается база данных

Пояснение: Flag переключает поведение приложения на runtime-уровне.

### Q5
**Какая опасность у Feature Flags?**
- [ ] Увеличение скорости работы
- [x] Накопление неиспользуемых флагов и усложнение кода
- [ ] Отключение интернета
- [ ] Уменьшение безопасности

Пояснение: Старые флаги нужно удалять после завершения их использования.

## Источники

- Feature Flags Docs: https://docs.launchdarkly.com/
- Google SRE Book