---
id: disaster-recovery
block: 14-nadezhnost-protsessy
tags: [disaster-recovery, dr, backup, rpo, rto, reliability]
order: 1
related: [backups, failover, multi-region-deployment]
difficulty: advanced
languages: [typescript, go, java]
status: done
---

# Аварийное восстановление (Disaster Recovery)

Disaster Recovery (DR) — комплекс стратегий, процедур и инструментов для восстановления IT-инфраструктуры и данных после катастрофических сбоев.

## Зачем нужен Disaster Recovery

Сбои оборудования, дата-центров или кибератаки могут полностью остановить бизнес.
- **RPO (Recovery Point Objective):** Допустимый объем потери данных по времени.
- **RTO (Recovery Time Objective):** Допустимое время простоя до восстановления сервиса.

## Как работает Disaster Recovery архитектура

```mermaid
flowchart TD
    A[Основной ЦОД: Primary] -->|Репликация данных| B[Резервный ЦОД: DR Site]
    A --> C{Сбой основного ЦОД?}
    C -->|да| D[Переключение DNS / Traffic Manager]
    D --> B
    A@{ shape: brace-r, label: "Disaster Recovery" }
```

```mermaid
sequenceDiagram
    participant App as Приложение
    participant Primary as Основная БД
    participant DR as Резервная БД (DR)
    participant DNS as DNS / Global LB
    Primary->>DR: Асинхронная/синхронная репликация
    Note over Primary: Авария в дата-центре!
    DNS->>DR: Переключение трафика на DR Site
    DR-->>App: Обслуживание клиентов
```

## Примеры кода

> Ключевые сценарии: конфигурация репликации и проверки состояния для DR.

### Проверка здоровья и статуса репликации (Go)

```go
package main

import "fmt"

func checkDRStatus(lagSeconds int) bool {
	maxAllowedLag := 30
	if lagSeconds > maxAllowedLag {
		fmt.Println("Warning: DR replication lag is too high!")
		return false
	}
	return true
}
```

## Вопросы

### Q1
**Что такое RPO (Recovery Point Objective)?**
- [x] Максимально допустимый объем потерянных данных по времени с момента последней аварии
- [ ] Время восстановления сервиса
- [ ] Скорость интернета
- [ ] Количество серверов

Пояснение: RPO определяет, сколько данных потерять критично для бизнеса (например, не более 1 часа).

### Q2
**Что такое RTO (Recovery Time Objective)?**
- [ ] Объем потерянных данных
- [x] Максимально допустимое время простоя системы до полного восстановления
- [ ] Время компиляции кода
- [ ] Задержка сети

Пояснение: RTO задает рамки времени, за которые система должна подняться после сбоя.

### Q3
**В чем разница между Backup и Disaster Recovery?**
- [ ] Разницы нет
- [x] Backup — это создание копий данных, а DR — полноценный план восстановления всей инфраструктуры
- [ ] Backup только для облака
- [ ] DR не требует бэкапов

Пояснение: Бэкап — часть стратегии DR, но DR включает переключение трафика, сетей и инфраструктуры.

### Q4
**Какая репликация обеспечивает меньший RPO?**
- [ ] Асинхронная с отставанием в сутки
- [x] Синхронная репликация в реальном времени
- [ ] Ручной экспорт раз в неделю
- [ ] Отсутствие репликации

Пояснение: Синхронная репликация гарантирует нулевую потерю данных при сбое первичного узла (RPO = 0).

### Q5
**Почему важно регулярно тестировать план DR?**
- [ ] Чтобы потратить бюджет
- [x] Чтобы убедиться, что процедуры восстановления работают и укладываются в RTO/RPO
- [ ] Это требование компилятора
- [ ] Для ускорения тестов

Пояснение: Непроверенный план DR часто не работает в реальной аварийной ситуации.

## Источники

- AWS Disaster Recovery Guide: https://aws.amazon.com/
- Google SRE Book