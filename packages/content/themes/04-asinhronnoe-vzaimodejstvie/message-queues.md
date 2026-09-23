---
id: message-queues
title: Очереди сообщений (Message Queues)
block: 04-asinhronnoe-vzaimodejstvie
tags: [message-queues, rabbitmq, kafka, broker, async, decoupling, backpressure, at-least-once]
order: 1
related:
  - pub-sub
  - event-driven-architecture
  - dead-letter-queues
  - backpressure
  - idempotency
  - saga-pattern
  - outbox-pattern
difficulty: medium
languages: [typescript, go, java]
status: done
---

# Очереди сообщений (Message Queues)

## Определение

**Message Queue (Очередь сообщений)** — промежуточное хранилище (буфер) сообщений между продюсером и консьюмером: продюсер **пишет сообщение**, очередь его хранит, консьюмер **читает**, когда готов. Это делает связь **асинхронной и развязанной**: отправитель не ждёт обработчика, обработчик читает в своём темпе. Классика: RabbitMQ, Amazon SQS, Kafka (как очередь/лог), Redis Streams.

## Зачем нужно

- **Развязка (decoupling)** — продюсер и консьюмер независимы: развертывание, версии, нагрузка.
- **Буферизация пиков** — очередь сглаживает всплески: консьюмеры не тонут (см. Backpressure).
- **Отложенная и пакетная обработка** — письма, эмейлы, генерация отчётов могут идти фоном.
- **At-least-once доставка** — сообщение не теряется при сбое (ретраи + идемпотентность).
- **Горизонтальное масштабирование воркеров** — N консьюмеров делят очередь.

## Как работает

Основные понятия:

- **Producer (продюсер)** — опубликовал сообщение в очередь (exclusive или по routing key).
- **Consumer (консьюмер)** — конкурентно читает сообщения, обрабатывает, **acknowledges** (подтверждает).
- **Broker (брокер)** — RabbitMQ/Kafka/SQS: хранит, маршрутизирует, ретраит, гарантирует порядок (в пределах очереди/партиции).
- **AT-least-once / AT-most-once** — гарантии доставки: при at-least-once сообщение может прийти повторно → нужна идемпотентность (см. Idempotency).
- **Dead letter queue** — очередь для «ядовитых» сообщений, которые не удалось обработать после N ретраев (см. Dead Letter Queues).
- **Ordering** — Kafka/Redis Streams дают порядок в пределах партиции; RabbitMQ в пределах очереди при одном консьюмере.
- **Compensation/Outbox** — асинхронная связь часто сочетается с outbox-паттерном для атомарности данных и события (см. Distributed Transactions).

```mermaid
sequenceDiagram
    participant P as Продюсер (order-svc)
    participant Q as Очередь (RabbitMQ/SQS)
    participant C1 as Consumer #1
    participant C2 as Consumer #2
    P->>Q: Publish: order.created (id 123)
    Q-->>C1: Consume msg 123
    C1-->>Q: ack (обработан)
    P->>Q: Publish: order.created (id 124)
    Q-->>C2: Consume msg 124
    Note over Q: at-least-once: если C1 упал без ack — сообщение вернётся
    C2-->>Q: ack
```

```mermaid
flowchart LR
    P1[Web-приложение] -->|publish| Q[(Queues)]
    P2[Cron-задачи] -->|publish| Q
    P3[Другой сервис] -->|publish| Q
    Q --> W1[Worker 1]
    Q --> W2[Worker 2]
    Q --> W3[Worker 3]
    Q --> DLQ[(Dead-letter)]
```

## Примеры кода

> Практика: **публикация сообщения**, **консьюмер с ack/retry**, **множественные консьюмеры очереди**.

### TypeScript (amqplib: publish + consume)

```typescript
import amqp from 'amqplib'

async function publishOrderCreated(orderId: string) {
  const conn = await amqp.connect('amqp://localhost')
  const ch = await conn.createChannel()
  await ch.assertQueue('orders', { durable: true })

  ch.sendToQueue('orders', Buffer.from(JSON.stringify({ type: 'order.created', orderId })),
    { persistent: true }) // durable: переживёт рестарт брокера
}

async function consumeOrders() {
  const conn = await amqp.connect('amqp://localhost')
  const ch = await conn.createChannel()
  await ch.assertQueue('orders', { durable: true })

  ch.consume('orders', async (msg) => {
    if (!msg) return
    try {
      const { orderId } = JSON.parse(msg.content.toString())
      await processOrder(orderId) // бизнес-обработка
      ch.ack(msg)                 // подтвердить; иначе повторная доставка
    } catch (err) {
      ch.nack(msg, false, true)   // в очередь (reject+requeue)
    }
  })
}
```

### Go (RabbitMQ amqp091: worker с ack)

```go
package main

import (
	"log"
	"time"

	amqp "github.com/rabbitmq/amqp091-go"
)

func main() {
	conn, err := amqp.Dial("amqp://guest:guest@localhost:5672/")
	if err != nil {
		log.Fatal(err)
	}
	defer conn.Close()

	ch, err := conn.Channel()
	if err != nil {
		log.Fatal(err)
	}
	defer ch.Close()

	q, _ := ch.QueueDeclare("orders", true, false, false, false, nil)

	msgs, err := ch.Consume(q.Name, "", false, false, false, false, nil)
	if err != nil {
		log.Fatal(err)
	}

	for msg := range msgs {
		if err := handle(msg.Body); err != nil {
			_ = msg.Nack(false, true) // requeue
			continue
		}
		_ = msg.Ack(false) // подтверждение обработки
	}
}

func handle(body []byte) error {
	time.Sleep(50 * time.Millisecond) // имитация работы
	return nil
}
```

### Java (Spring AMQP consumer with retry)

```java
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
public class OrderListener {

    @RabbitListener(queues = "orders")
    public void onOrder(OrderEvent order) {
        try {
            processOrder(order.getOrderId());
        } catch (TransientException e) {
            // бросаем исключение → Spring AMQP автоматически ретраит и
            // отправляет в DLQ после maxAttempts
            throw e;
        }
    }
}
```

## Пример использования: интеграция

> Оркестрация: **outbox + очередь для события**, **идемпотентный консьюмер**, **консьюмеры с разным темпом (подписка на обработку)**.

### TypeScript (консьюмер с идемпотентностью)

```typescript
const processed = new Set<string>() // реально: ключ в БД/Redis

async function consume() {
  const conn = await amqp.connect('amqp://localhost')
  const ch = await conn.createChannel()
  await ch.assertQueue('orders', { durable: true })

  ch.consume('orders', async (msg) => {
    if (!msg) return
    const event = JSON.parse(msg.content.toString())
    const dedupKey = `order:${event.orderId}`

    if (processed.has(dedupKey)) {           // дубликат из-за at-least-once
      return ch.ack(msg)
    }

    await applyOrder(event)                  // бизнес-операция
    await markProcessed(dedupKey)            // фиксируем факт ДО ack
    ch.ack(msg)
  })
}
```

### Go (outbox + очередь для надёжной публикации)

```go
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"

	amqp "github.com/rabbitmq/amqp091-go"
)

// В одной транзакции пишем факт заказа и событие в outbox;
// outbox-relay публикует событие в очередь без потери.
func createOrderAndPublish(ctx context.Context, db *sql.DB, broker *amqp.Connection,
	order Order) error {
	tx, err := db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	if _, err := tx.ExecContext(ctx,
		`INSERT INTO orders (id, total) VALUES ($1, $2)`, order.ID, order.Total); err != nil {
		return err
	}
	payload, _ := json.Marshal(map[string]string{"type": "order.created", "id": order.ID})
	if _, err := tx.ExecContext(ctx,
		`INSERT INTO outbox (aggregate, payload) VALUES ($1, $2)`, order.ID, payload); err != nil {
		return err
	}
	if err := tx.Commit(); err != nil {
		return err
	}

	ch, err := broker.Channel()
	if err != nil {
		return err
	}
	defer ch.Close()

	q, _ := ch.QueueDeclare("outbox", true, false, false, false, nil)
	return ch.PublishWithContext(ctx, "", q.Name, false, false,
		amqp.Publishing{Body: payload, DeliveryMode: amqp.Persistent})
}

// повторная отправка из outbox для надёжности (retry-сценарий)
func relayOutbox(ctx context.Context, db *sql.DB, broker *amqp.Connection) {
	rows, _ := db.QueryContext(ctx,
		`SELECT payload FROM outbox WHERE published_at IS NULL LIMIT 100`)
	ch, _ := broker.Channel()
	defer ch.Close()
	for rows.Next() {
		var payload []byte
		_ = rows.Scan(&payload)
		q, _ := ch.QueueDeclare("outbox", true, false, false, false, nil)
		_ = ch.PublishWithContext(ctx, "", q.Name, false, false,
			amqp.Publishing{Body: payload, DeliveryMode: amqp.Persistent})
		_ = db.QueryRowContext(ctx,
			`UPDATE outbox SET published_at = now() WHERE payload = $1`, payload)
	}
}

type Order struct {
	ID    string
	Total int
}
```

### Java (Spring Boot: очередь + консьюмеры пула воркеров)

```yaml
spring:
  rabbitmq:
    listener:
      simple:
        concurrency: 3        # N консьюмеров одной очереди (распараллеливание)
        max-concurrency: 10
        prefetch: 20          # сообщений за один раз на консьюмера
```

## Паттерны использования

- **Durable-очередь + persistent-сообщения** — переживают рестарт брокера.
- **Ack после успешной обработки** — иначе сообщение повторно придёт к воркеру.
- **Prefetch / QoS** — ограничение «в полёте» сообщений на консьюмера (управление темпом).
- **Идемпотентная обработка** — at-least-once → дубликаты возможны, обрабатывать безопасно.
- **DLQ для ядовитых сообщений** — отдельная очередь, мониторинг «застрявших».
- **Backpressure консьюмерам** — очередь сама сглаживает пики; prefetch ограничивает число сообщений на консьюмера.
- **Порядок важен → одна очередь/партиция** — в ограниченных контекстах.

## Антипаттерны и ловушки

- **Ack до обработки** — воркер упал → сообщение потеряно (или откат не двигается).
- **Бесконечный requeue без лимита** — ядовитое сообщение вечно кружит в очереди, блокируя порядок.
- **Каждый воркер с prefetch=всем** — все сообщения «в полёте» у одного консьюмера, остальные простаивают.
- **Eхать через очередь для синхронных ответов** — упёрли latency (губьё очереди, не для request/response).
- **Продуценты без подтверждения/Batch** — потеря сообщений при сбое сети.
- **Игнорировать мониторинг очереди** — растущий размер = задержка, а они не видели.

## Когда использовать / когда НЕ использовать

**Использовать:**
- Асинхронные процессы: email, отчёты, индексация, нотификации, фоновые задачи.
- Сглаживание пиков и развязка продюсер/консьюмер.
- В составе саги/событийный, где нужен надёжный транспорт сообщений.

**НЕ использовать (или с осторожностью):**
- Простые синхронные запросы (очередь + request/response = сложность и latency).
- Когда порядок строго глобальный (очередь не гарантирует глобальную упорядоченность).
- Когда все сообщения маленькие и моментов мало — overhead брокера больше пользы.

## Связанные темы

- **Pub/Sub** — более общий варимент: брокер маршрутизирует по подпискам, не только FIFO.
- **Event-Driven Architecture** — основная архитектура, где применяются очереди/топы.
- **Dead Letter Queues** — обработка неисправимых сообщений.
- **Backpressure** — управление темпом консьюмеров (prefetch, лимиты).
- **Idempotency** — надёжность обработки при at-least-once.
- **Saga Pattern / Outbox** — асинхронная координация и целостность БД↔событие.

## Вопросы

### Q1
**Зачем нужна очередь сообщений (в общем)?**
- [ ] Для немедленной синхронной отправки
- [x] Развязка продюсера и консьюмера, буферизация пиков, асинхронная обработка
- [ ] Ускорение SELECT-запросов
- [ ] Только для логирования

Пояснение: очередь хранит сообщения между продюсером и консьюмером, сглаживает нагрузку и развязывает их.

### Q2
**Что даёт «ack» консьюмера?**
- [ ] Шифрует сообщение
- [x] Подтверждает успешную обработку; без ack сообщение вернётся другому воркеру
- [ ] Ускоряет очередь
- [ ] Никак не связан с метриками

Пояснение: ack — сигнал «обработано»; при сбое без ack брокер переотдаёт сообщение (at-least-once).

### Q3
**Почему при at-least-once нужна идемпотентность?**
- [ ] Для скорости
- [x] Сообщение может прийти повторно → обработка должна не дублировать эффект
- [ ] DLQ не нужен
- [ ] Только для Kafka

Пояснение: at-least-once допускает дубликаты доставки; консьюмер обязан быть идемпотентным.

### Q4
**Что такое redelivery в контексте очередей?**
- [ ] Копирование сообщения брокером
- [x] Повторная доставка того же сообщения после nack/timeout — поэтому потребитель должен быть идемпотентным
- [ ] Новое сообщение от брокера
- [ ] Удаление сообщения из очереди

Пояснение: redelivery даёт at-least-once семантику; обработать повторно пришедшее сообщение без дублей — задача идемпотентности.

### Q5
**На что влияет prefetch (QoS) консьюмера?**
- [ ] На количество брокеров
- [x] На число сообщений «в полёте» на одного консьюмера (управление нагрузкой)
- [ ] На шифрование
- [ ] Ни на что

Пояснение: prefetch ограничивает unacked-сообщения воркера — равномерное распределение работы и контроль темпа.

## Источники

- RabbitMQ — документация (очереди, ack, prefetch): https://www.rabbitmq.com/docs
- AWS SQS — документация: https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-message-queue.html
- Kafka — ключевые концепции: https://kafka.apache.org/documentation/
- Redis Streams: https://redis.io/docs/data-types/streams/
- Martin Fowler — Queues via pattern: https://martinfowler.com/articles/patterns-of-distributed-systems/