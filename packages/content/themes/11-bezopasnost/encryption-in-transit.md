---
id: encryption-in-transit
title: Шифрование данных при передаче
block: 11-bezopasnost
tags: [encryption, in-transit, tls, http2, security]
order: 7
related: [encryption-at-rest, tls, security]
difficulty: beginner
languages: [typescript, go, java]
status: done
---

# Шифрование при передаче (Encryption in Transit)

## Определение

Шифрование при передаче защищает данные во время их перемещения по сетям (между клиентом и сервером, между микросервисами).

## Зачем нужно Encryption in Transit

Сетевые узлы могут перехватывать незашифрованные пакеты (Sniffing).
- **mTLS:** Двухсторонняя аутентификация для Zero Trust архитектуры микросервисов.

## Как работает mTLS

```mermaid
flowchart TD
    A[Клиент с сертификатом] -->|mTLS Handshake| B[Сервер]
    B -->|Проверка CA| C[Двусторонняя аутентификация]
    A@{ shape: brace-r, label: "mTLS" }
```

```mermaid
sequenceDiagram
    participant Client as Клиент
    participant Server as Сервер
    Client->>Server: ClientHello + Cert Request
    Server->>Client: ServerHello + Cert
    Client->>Server: Client Certificate
    Note over Client,Server: Шифрованный gRPC / HTTP
```

## Примеры кода

> Ключевые сценарии: mTLS и редирект в TypeScript, Go и Java.

### TypeScript (Express HTTPS Redirect)

```typescript
import { Request, Response, NextFunction } from 'express';

function requireHttps(req: Request, res: Response, next: NextFunction) {
  if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
}
```

### Go (mTLS Server)

```go
package main

import (
	"crypto/tls"
	"crypto/x509"
	"net/http"
	"os"
)

func main() {
	caCert, _ := os.ReadFile("ca.pem")
	pool := x509.NewCertPool()
	pool.AppendCertsFromPEM(caCert)

	server := &http.Server{
		Addr: ":443",
		TLSConfig: &tls.Config{
			ClientCAs:  pool,
			ClientAuth: tls.RequireAndVerifyClientCert,
		},
	}
	server.ListenAndServeTLS("cert.pem", "key.pem")
}
```

### Java (Spring Boot RestTemplate с mTLS)

```java
package com.example.demo;

import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import java.io.FileInputStream;
import java.io.InputStream;
import java.security.KeyStore;

@Configuration
public class MtlsConfig {

    @Bean
    public RestTemplate restTemplate() throws Exception {
        // клиентский сертификат (p12) — как раз то, что сервер проверяет в mTLS
        char[] password = "changeit".toCharArray();
        KeyStore ks = KeyStore.getInstance("PKCS12");
        try (InputStream in = new FileInputStream("client.p12")) {
            ks.load(in, password);
        }
        KeyManagerFactory kmf =
            KeyManagerFactory.getInstance(KeyManagerFactory.getDefaultAlgorithm());
        kmf.init(ks, password);

        SSLContext sslContext = SSLContext.getInstance("TLS");
        // trust managers (null) — системные CA: сервер тоже проверяется по сертификату
        sslContext.init(kmf.getKeyManagers(), null, null);

        CloseableHttpClient httpClient =
            HttpClients.custom().setSSLContext(sslContext).build();
        HttpComponentsClientHttpRequestFactory factory =
            new HttpComponentsClientHttpRequestFactory(httpClient);
        return new RestTemplate(factory);
    }
}
```

## Пример использования: интеграция

Обязательный HTTPS и переадресация HTTP → HTTPS на входе приложения:

```ts
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect(`https://${req.hostname}${req.originalUrl}`)
  }
  next()
})
```

За балансировщиком TLS терминируется на edge, внутрь сервисы дополнительно закрываются mTLS — трафик в сети не защищён «по умолчанию» ни в одном сегменте.

## Паттерны использования

- **TLS везде, включая внутренние сервисы** — внутренняя сеть не гарантирует безопасность.
- **mTLS для zero trust** — mutual TLS с истоками из сертификатов: и клиент, и сервер проверяются.
- **HSTS** — браузеру запрещается HTTP после первого HTTPS-ответа.
- **Валидация сертификатов везде** — включая внешние зависимости и SDK клиенты.

## Антипаттерны и ловушки

- **TLS только на edge** — внутри сети данные идут открытым текстом, компрометация одного узла снимает ВСЁ.
- **Верификация отключена в тестах** — проскакивает в прод как `rejectUnauthorized: false`.
- **Забыть про HSTS** — первый HTTP-запрос остаётся перехватываемым.
- **Сертификаты с истекшими сроками** — паника в проде; mTLS self-signed без контроля CA — мимышка.

## Когда использовать / когда НЕ использовать

- **Использовать:** всегда для сетевых взаимодействий; mTLS — для чувствительных внутренних сервисов.
- **НЕ использовать:** для данных, чувствительность которых нулевая — тем не менее HTTPS для публичного web обязателен вне зависимости.

## Связанные темы

- **encryption-at-rest** — защита данных на диске.
- **tls** — механизм шифрования при передаче и управление сертификатами.

## Вопросы

### Q1
**Что такое mTLS?**
- [ ] Быстрый TLS
- [x] Двусторонняя аутентификация, где клиент и сервер проверяют сертификаты друг друга
- [ ] TLS без сертификатов
- [ ] Отключение шифрования

Пояснение: mTLS обеспечивает взаимную проверку на транспортном уровне.

### Q2
**Какой протокол является стандартом защиты трафика в интернете?**
- [ ] HTTP/1.0
- [x] TLS 1.3
- [ ] Telnet
- [ ] FTP

Пояснение: TLS 1.3 обеспечивает максимальную скорость и криптостойкость.

### Q3
**Что делает Service Mesh (Istio) в отношении Encryption in Transit?**
- [ ] Удаляет БД
- [x] Автоматически настраивает mTLS между подами без изменения кода
- [ ] Ускоряет Docker
- [ ] Блокирует интернет

Пояснение: Service Mesh шифрует межсервисный трафик прозрачно.

### Q4
**Почему отключение проверки SSL-сертификатов опасно?**
- [ ] Замедляет сеть
- [x] Делает приложение уязвимым к MitM-атакам
- [ ] Код не компилируется
- [ ] БД удалит данные

Пояснение: Игнорирование проверки уничтожает гарантию подлинности.

### Q5
**Нужно ли шифровать трафик внутри VPC между своими микросервисами?**
- [ ] Нет
- [x] Да, согласно концепции Zero Trust, периметр сети может быть скомпрометирован
- [ ] Только по выходным
- [ ] Запрещено AWS

Пояснение: Zero Trust требует шифрования даже внутри закрытого контура.

## Источники

- NIST SP 800-52
- Istio Security: https://istio.io/
