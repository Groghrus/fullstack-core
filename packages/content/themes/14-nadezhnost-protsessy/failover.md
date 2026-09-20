---
id: failover
block: 14-nadezhnost-protsessy
tags: [failover, high-availability, ha, switching, reliability]
order: 3
related: [disaster-recovery, backups, multi-region-deployment]
difficulty: advanced
languages: [typescript, go, java]
status: done
---

# Failover (Переключение на резерв)

Failover — автоматический или ручной процесс переключения нагрузки на резервный узел или систему при отказе основного компонента.

## Зачем нужен Failover

Отказ оборудования или ПО не должен приводить к долгому простою.
- **High Availability (HA):** Обеспечение непрерывной работы сервиса (99.99%).
- **Автоматизация:** Быстрое реагирование без участия человека.

## Как работает Failover архитектура

```mermaid
flowchart TD
    A[Клиентские запросы] --> B[Load Balancer / DNS]
    B -->|Primary OK| C[Primary Node]
    B -->|Primary Failed| D[Secondary Node]
    A@{ shape: brace-r, label: "Failover" }
```

```mermaid
sequenceDiagram
    participant LB as Load Balancer / Health Check
    participant Primary as Primary Node
    participant Secondary as Secondary Node
    LB->>Primary: Health check request
    Note over Primary: Сбой узла (timeout / 500)
    Primary-->>LB: Нет ответа
    LB->>Secondary: Перенаправление всего трафика
    Secondary-->>LB: Обслуживание запросов
```

## Примеры кода

> Ключевые сценарии: логика проверки здоровья и переключения в коде прокси/клиента.

### Проверка здоровья и переключение (Go)

```go
package main

import "net/http"

func isNodeHealthy(url string) bool {
	resp, err := http.Get(url + "/health")
	if err != nil || resp.StatusCode != http.StatusOK {
		return false
	}
	return true
}
```

## Вопросы

### Q1
**Что такое Failover?**
- [ ] Создание бэкапа
- [x] Автоматическое или ручное переключение на резервный узел при сбое основного
- [ ] Удаление старых логов
- [ ] Балансировка нагрузки

Пояснение: Failover обеспечивает бесперебойность за счет переключения на живой резерв.

### Q2
**В чем разница между Failover и Failback?**
- [ ] Разницы нет
- [x] Failover — переход на резерв, Failback — возврат на основной узел после его починки
- [ ] Failback — это удаление данных
- [ ] Failover происходит только вручную

Пояснение: Обратный процесс возврата к исходной конфигурации называется Failback.

### Q3
**Что такое Split-Brain в контексте Failover?**
- [ ] Ошибка компиляции
- [x] Ситуация, когда два узла считают себя главными (Primary), что ведет к повреждению данных
- [ ] Разделение памяти
- [ ] Перегрев CPU

Пояснение: Опасное состояние распределенной системы, требующее механизмов Leader Election и Fencing.

### Q4
**Какой компонент обычно инициирует автоматический Failover?**
- [ ] Браузер пользователя
- [x] Health Checks и системы мониторинга/оркестрации
- [ ] CSS-стили
- [ ] Компилятор

Пояснение: Мониторинг обнаруживает отказ и запускает процедуру переключения.

### Q5
**Что такое Graceful Failover?**
- [ ] Мгновенное отключение питания
- [x] Плановое переключение без потери активных транзакций и с минимальным прерыванием
- [ ] Ошибка сети
- [ ] Отмена деплоя

Пояснение: Плавное переключение позволяет завершить текущие запросы перед уходом на резерв.

## Источники

- High Availability Architectures: https://martinfowler.com/
- Distributed Systems Engineering