---
id: tls
block: 11-bezopasnost
tags: [tls, ssl, encryption, https, certificates]
order: 5
related: [encryption-at-rest, encryption-in-transit, security]
difficulty: beginner
languages: [typescript, go, java]
status: done
---

# TLS/SSL и шифрование в транспорте

TLS (Transport Layer Security) — это криптографический протокол, обеспечивающий безопасную конфиденциальную и целостную передачу данных по сети.

## Зачем нужен TLS

Без TLS весь трафик передается в открытом виде, допуская атаки Man-in-the-Middle (MitM).
- **Конфиденциальность:** Симметричное шифрование защищает данные.
- **Аутентификация:** Цифровые сертификаты доказывают подлинность сервера.

## Как работает TLS Handshake

```mermaid
flowchart TD
    A[ClientHello] --> B[ServerHello + Certificate]
    B --> C[Key Exchange]
    C --> D[Защищенный сеанс]
    A@{ shape: brace-r, label: "TLS Handshake" }
```

```mermaid
sequenceDiagram
    participant Client as Клиент
    participant Server as Сервер
    Client->>Server: ClientHello
    Server->>Client: ServerHello + Certificate
    Client->>Server: Key Exchange
    Server-->>Client: Finished
    Note over Client,Server: HTTPS / AES
```

## Примеры кода

> Ключевые сценарии: создание HTTPS сервера в TypeScript, Go и Java.

### TypeScript (HTTPS Server)

```typescript
import https from 'https';
import fs from 'fs';
import express from 'express';

const app = express();
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
};
https.createServer(options, app).listen(443);
```

### Go (TLS Server)

```go
package main

import "net/http"

func main() {
	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("TLS OK"))
	})
	http.ListenAndServeTLS(":443", "cert.pem", "key.pem", nil)
}
```

### Java (Spring Boot application.yml)

```yaml
server:
  port: 443
  ssl:
    enabled: true
    key-store: classpath:keystore.p12
    key-store-password: secret
```

## Вопросы

### Q1
**Какую главную задачу решает сертификат X.509 в TLS?**
- [ ] Ускоряет картинки
- [x] Подтверждает подлинность сервера, удостоверяя принадлежность ключа домену
- [ ] Сжимает ответы
- [ ] Заменяет пароли

Пояснение: Сертификат связывает публичный ключ с доменным именем через CA.

### Q2
**Что такое атака Man-in-the-Middle (MitM)?**
- [ ] DDoS
- [x] Перехват трафика между клиентом и сервером; TLS защищает от нее шифрованием
- [ ] Удаление БД
- [ ] Подбор паролей

Пояснение: TLS делает перехват невозможным без валидного сертификата.

### Q3
**Почему симметричное шифрование используется после Handshake?**
- [ ] Симметричное слабее
- [x] Асимметричная криптография медленная, она используется только для Handshake, а сами данные шифруются быстрым AES
- [ ] Работает без сети
- [ ] Требование HTML5

Пояснение: Гибридный подход объединяет безопасность асимметрии и скорость симметрии.

### Q4
**Что делает механизм SNI?**
- [ ] Шифрует пароли
- [x] Передает домен в начале Handshake для выбора правильного SSL-сертификата при хостинге сайтов
- [ ] Сжимает пакеты
- [ ] Тайм-ауты

Пояснение: SNI решает хостинг множества HTTPS-сайтов на одном IP.

### Q5
**Что означает ошибка «ERR_CERT_DATE_INVALID»?**
- [ ] Нет интернета
- [x] Срок действия SSL-сертификата истек или неверное время на клиенте
- [ ] Сайт заблокирован
- [ ] Неверный пароль БД

Пояснение: Сертификаты имеют ограниченный срок действия.

## Источники

- RFC 8446 (TLS 1.3): https://datatracker.ietf.org/doc/html/rfc8446
- MDN Web Docs - TLS: https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security
