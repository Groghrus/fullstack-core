---
id: multi-region-deployment
block: 14-nadezhnost-protsessy
tags: [multi-region, global, latency, high-availability, deployment]
order: 4
related: [disaster-recovery, failover, backups]
difficulty: advanced
languages: [typescript, go, java]
status: done
---

# Развёртывание в нескольких регионах (Multi-Region Deployment)

Multi-Region Deployment — архитектурный подход, при котором приложение разворачивается в нескольких географически распределенных облачных регионах.

## Зачем нужен Multi-Region

Локальные сбои дата-центров или провайдеров не должны останавливать глобальный бизнес.
- **Низкая задержка (Latency):** Пользователи обслуживаются ближайшим регионом.
- **Географическая отказоустойчивость:** Падение целого региона AWS не приводит к падению сервиса.

## Как работает Multi-Region архитектура

```mermaid
flowchart TD
    A[Global Anycast DNS] -->|Америка| B[US Region]
    A -->|Европа| C[EU Region]
    A -->|Азия| D[Asia Region]
    B & C & D --> E[(Multi-Region DB Replication)]
    A@{ shape: brace-r, label: "Multi-Region" }
```

```mermaid
sequenceDiagram
    participant User as Пользователь (EU)
    participant DNS as Route53 (Geo DNS)
    participant EU as EU Region App
    participant US as US Region DB
    User->>DNS: Запрос к сервису
    DNS->>EU: Маршрутизация в ближайший регион
    EU->>US: Репликация данных (Eventual Consistency)
    EU-->>User: Быстрый ответ
```

## Примеры кода

> Ключевые сценарии: гео-маршрутизация и подключение к ближайшей базе данных.

### Конфигурация клиента БД с выбором региона (TypeScript)

```typescript
const region = process.env.AWS_REGION || 'us-east-1'
const dbConfig = {
  host: `db.${region}.internal.net`,
  port: 5432,
}
```

## Вопросы

### Q1
**Главное преимущество Multi-Region Deployment?**
- [ ] Дешевая инфраструктура
- [x] Высокая доступность при падении целого облачного региона и низкая задержка для пользователей
- [ ] Простой код
- [ ] Отсутствие баз данных

Пояснение: Защищает от масштабных аварий провайдера и ускоряет ответ для удаленных пользователей.

### Q2
**Какая главная сложность в Multi-Region системах?**
- [ ] Написание HTML
- [x] Синхронизация и консистентность данных между регионами с учетом сетевой задержки
- [ ] Покупка доменов
- [ ] Настройка CSS

Пояснение: CAP-теорема и скорость света накладывают ограничения на репликацию данных.

### Q3
**Что такое Geo-DNS?**
- [ ] Карта мира
- [x] Маршрутизация пользователей на сервер в зависимости от их географического положения
- [ ] Определение IP
- [ ] Защита от DDoS

Пояснение: Направляет клиента в ближайший дата-центр.

### Q4
**Что происходит при падении одного из регионов в Multi-Region?**
- [ ] Падает вся система
- [x] Global DNS перенаправляет трафик на оставшиеся живые регионы
- [ ] Удаляются бэкапы
- [ ] Перезагружаются ПК пользователей

Пояснение: Автоматический failover на уровне глобальной маршрутизации.

### Q5
**Какая модель консистентности чаще всего используется между регионами?**
- [ ] Строгая (Linearizable) без задержек
- [x] Итоговая (Eventual Consistency) из-за физических ограничений скорости передачи данных
- [ ] Отсутствие согласованности
- [ ] Только локальная

Пояснение: Синхронизировать все регионы мгновенно физически невозможно из-за пингов.

## Источники

- AWS Multi-Region Architecture: https://aws.amazon.com/
- Designing Data-Intensive Applications by Martin Kleppmann