---
id: build-caching
block: 12-devops-infrastruktura
tags: [caching, docker, ci-cd, build, optimization]
order: 7
related: [docker, ci-cd, kubernetes]
difficulty: intermediate
languages: [typescript, go, java]
status: done
---

# Кэширование сборок и артефактов (Build Caching)

Оптимизация CI/CD и Docker-сборок, при которой неизмененные зависимости не компилируются заново.

## Зачем нужно кэширование сборок

Экономия времени и ресурсов раннеров.
- **Ускорение CI/CD:** Сокращение времени сборки.
- **Docker Layer Caching:** Переиспользование слоев с зависимостями.

## Как работает кэширование

```mermaid
flowchart TD
    A[Изменение кода] --> B@{ shape: diam, label: "Хэш lock-файла совпал?" }
    B -->|yes| C[Восстановление node_modules из кэша]
    B -->|no| D[Загрузка из сети]
    A@{ shape: brace-r, label: "Caching" }
```

```mermaid
sequenceDiagram
    participant CI as CI Runner
    participant Cache as Cache Storage
    CI->>Cache: Проверка кэша по lock-файлу
    alt Cache Hit
        Cache-->>CI: Восстановление зависимостей
    else Cache Miss
        CI->>CI: Загрузка из интернета
    end
```

## Примеры кода

> Ключевые сценарии: кэширование в GitHub Actions.

### GitHub Actions (Node.js npm Cache)

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'npm'
- run: npm ci
```

## Вопросы

### Q1
**Главный критерий для обновления кэша в CI/CD?**
- [ ] Температура CPU
- [x] Хэш lock-файла (`package-lock.json`, `go.sum`)
- [ ] Случайное число
- [ ] Время суток

Пояснение: Изменение хэша lock-файла инвалидирует кэш.

### Q2
**Правильный порядок в Dockerfile для кэша?**
- [ ] Сначала код, потом зависимости
- [x] Сначала копировать зависимости и ставить их, потом копировать остальной код
- [ ] Порядок не важен
- [ ] Удалять кэш

Пояснение: Установка зависимостей реже меняется, чем код, и кэшируется первой.

### Q3
**Что происходит при Cache Miss?**
- [ ] Ошибка 500
- [x] Загрузка зависимостей из сети и сохранение в новый кэш
- [ ] Удаление репозитория
- [ ] Сброс пароля

Пояснение: При промахе кэш обновляется.

### Q4
**Какую проблему решает Build Caching?**
- [ ] Перегрев видеокарт
- [x] Долгое время сборки в CI/CD и расход трафика
- [ ] Ошибки TypeScript
- [ ] Версии Java

Пояснение: Ускоряет feedback loop разработчиков.

### Q5
**Что такое Docker Layer Caching?**
- [ ] Хранение паролей
- [x] Сохранение результатов выполнения инструкций Dockerfile для пропуска шагов
- [ ] Очистка диска
- [ ] Сжатие tar

Пояснение: Docker кэширует слои образов для мгновенной пересборки.

## Источники

- GitHub Actions Caching: https://docs.github.com/
- Docker Build Cache: https://docs.docker.com/