---
id: canary-releases
block: 13-deploy-relizy
tags: [canary, release, rollout, monitoring, metrics]
order: 3
related: [blue-green-deployment, feature-flags, rolling-deployments]
difficulty: advanced
languages: [typescript, go, java]
status: done
---

# Canary Releases (Канареечные релизы)

Canary Release — стратегия постепенного выпуска новой версии на малую долю пользователей с последующим масштабированием при успешных метриках.

## Зачем нужны Canary Releases

Снижение риска выпуска путём тестирования на реальных пользователях.
- **Минимальный риск:** Новая версия тестируется на 1-5% трафика.
- **Метрики решают:** Масштабирование зависит от качества работы.

## Как работают Canary Releases архитектура

```mermaid
flowchart TD
    A[100% трафика] --> B[1% трафика]
    B -->|метрики ok| C[10% трафика]
    C -->|метрики ok| D[50% трафика]
    D -->|метрики ok| E[100% трафика]
    A@{ shape: brace-r, label: "Canary Rollout" }
```

```mermaid
sequenceDiagram
    participant Dev as Разработчик
    participant LB as Load Balancer
    participant Users as Пользователи
    participant Metrics as Мониторинг
    participant Alert as Алерт-система
    Dev->>LB: Деплой canary-версии
    LB->>Users: 1% трафика на canary
    Metrics->>Metrics: Сбор метрик
    Metrics->>Alert: Ошибки выше порога
    Alert-->>Dev: Уведомление
    Dev->>LB: Масштабировать canary до 10%
```

## Примеры кода

> Ключевые сценарии: разделение трафика на canary и production.

### Kubernetes Deployment (canary-версия)

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-canary
spec:
  replicas: 1
  selector:
    matchLabels:
      app: app
      release: canary
  template:
    spec:
      containers:
      - name: app
        image: myapp:v2-canary
```

## Вопросы

### Q1
**Что такое Canary Release?**
- [ ] Полное переключение на новую версию
- [x] Постепенный выпуск новой версии на малую долю пользователей
- [ ] Ручной деплой
- [ ] Шифрование данных

Пояснение: Новая версия тестируется на части трафика перед масштабированием.

### Q2
**Какой процент трафика обычно направляют на canary?**
- [ ] 100%
- [x] 1-5%
- [ ] 50%
- [ ] 90%

Пояснение: Небольшая доля пользователей позволяет безопасно протестировать новую версию.

### Q3
**Что происходит при успешных метриках canary?**
- [ ] Версия удаляется
- [x] Доля трафика gradually увеличивается
- [ ] Приложение перезапускается
- [ ] Отключается мониторинг

Пояснение: Хорошие метрики — основание для масштабирования релиза.

### Q4
**Что происходит при плохих метриках canary?**
- [ ] Трафик автоматически увеличивается
- [x] Релиз останавливается или откатывается
- [ ] Удаляется база данных
- [ ] Отключается SSL

Пояснение: Плохие метрики — сигнал остановить rollout.

### Q5
**Какие метрики важны для Canary?**
- [ ] Цвет сайта
- [x] Ошибки, latency, RPS, конверсия
- [ ] Количество строк кода
- [ ] Версия Node.js

Пояснение: Метрики качества работы приложения определяют успех релиза.

## Источники

- Kubernetes Rollouts: https://argoproj.github.io/
- Google SRE Book