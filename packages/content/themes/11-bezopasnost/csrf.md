---
id: csrf
title: CSRF
block: 11-bezopasnost
tags: [csrf, xsrf, security, cookies, web]
order: 11
related: [cors, security, web]
difficulty: medium
languages: [typescript, go, java]
status: done
---

# CSRF (Cross-Site Request Forgery)

## Определение

CSRF — уязвимость, при которой злоумышленник заставляет авторизованного пользователя выполнить нежелательные действия (перевод денег, смена пароля) без его ведома.

## Зачем нужна защита от CSRF

Браузеры автоматически прикрепляют сессионные куки к любому запросу на целевой домен.
- **SameSite Cookies:** Защита браузера (`SameSite=Lax/Strict`).
- **CSRF Tokens:** Случайный токен, привязанный к сессии.

## Как работает CSRF-атака

```mermaid
flowchart TD
    A[Злоумышленник: evil.com] -->|POST на bank.com| B[Банк: bank.com/transfer]
    B -->|Автоподстановка Cookie| C[Выполнение перевода]
    A@{ shape: brace-r, label: "CSRF Attack" }
```

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant Evil as Вредоносный сайт
    participant Bank as Банк + Cookie
    User->>Evil: Посещение сайта
    Evil->>Bank: Скрытая форма + Cookie
    Bank-->>Evil: 403 Forbidden (Нет CSRF Token)
```

## Примеры кода

> Ключевые сценарии: защита SameSite и CSRF токенами в TypeScript, Go и Java.

### TypeScript (SameSite Cookie)

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser());

app.post('/api/login', (req, res) => {
  res.cookie('session_id', 'token', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });
  res.json({ ok: true });
});
```

### Go (gorilla/csrf)

```go
package main

import (
	"net/http"
	"github.com/gorilla/csrf"
)

func main() {
	r := http.NewServeMux()
	CSRF := csrf.Protect([]byte("32-byte-long-auth-key-secret-abc"))
	http.ListenAndServe(":8080", CSRF(r))
}
```

### Java (Spring Security CSRF)

```java
package com.example.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.ignoringRequestMatchers("/api/public/**"));
        return http.build();
    }
}
```

## Пример использования: интеграция

Защита через same-site cookie + проверка CSRF-токена на все мутирующие запросы:

```ts
app.use(cookieParser())
app.use('/api', csrf({ cookie: { httpOnly: true, sameSite: 'strict' } }))

app.post('/api/transfer', csrfProtection, (req, res) => {
  // токен валиден — выполняем перевод
})
```

Cookie с `SameSite=Strict/Lax` блокирует отправку в кросс-сайтных запросах, а двойное подтверждение токеном закрывает сценарии, где cookie всё же приходит.

## Паттерны использования

- **`SameSite=Lax/Strict` на куках аутентификации** — первая и главная защита.
- **CSRF-токен на state-changing запросы** — POST/PUT/DELETE, не GET.
- **Вспомогательная защита** — проверка `Origin`/`Referer` заголовков.
- **Принудительный HTTPS + `Secure` cookie** — токен и кука не ходят в открытом виде.

## Антипаттерны и ловушки

- **Положиться только на токен без SameSite** — токен в URL/заголовке утекает в referer.
- **Защищать только POST** — другие изменяющие методы остаются открытыми.
- **Глобальный `Access-Control-Allow-Origin: *`** — превращает защиту CSRF в мишень.
- **Рассылка токена в localStorage** — XSS получит доступ к токену напрямую.

## Когда использовать / когда НЕ использовать

- **Использовать:** cookie-based аутентификация — всегда; любое публичное веб-приложение с изменяющими запросами.
- **НЕ использовать:** для API без cookie-аутентификации (токен в Authorization header) — где нет автоматической отправки, там нет и проблемы; для служебных внутренних сервисов с ограниченным доступом.

## Связанные темы

- **cors** — перекрёстные запросы усложняют политику доступа к API.

## Вопросы

### Q1
**В чем суть уязвимости CSRF?**
- [ ] Чтение пароля с экрана
- [x] Использование автоподстановки браузером кук при кросс-доменных запросах для выполнения действий от имени пользователя
- [ ] Ошибка TypeScript
- [ ] Перехват HTTP

Пояснение: CSRF заставляет браузер жертвы отправить запрос со своими куками.

### Q2
**Что делает `SameSite=Strict`?**
- [ ] Удаляет куку
- [x] Запрещает отправку куки при любых кросс-доменных запросах, обеспечивая защиту от CSRF
- [ ] Разрешает JS доступ
- [ ] Отключает шифрование

Пояснение: SameSite=Strict блокирует куку при переходах со сторонних сайтов.

### Q3
**Почему для Stateless API на JWT атака CSRF не актуальна?**
- [ ] JWT невозможно украсть
- [x] Браузеры не подставляют заголовки `Authorization` автоматически при запросах со сторонних сайтов
- [ ] JWT шифруется
- [ ] API без интернета

Пояснение: CSRF опирается на автоподстановку кук.

### Q4
**Что такое Synchronizer Token (CSRF Token)?**
- [ ] Пароль от БД
- [x] Случайный токен, требуемый в теле или заголовке каждого изменяющего запроса
- [ ] Токен Google
- [ ] Скрипт кэша

Пояснение: Злоумышленник на стороннем сайте не знает этот токен.

### Q5
**Какой HTTP-метод обычно используется для CSRF-атаки через форму?**
- [ ] GET
- [x] POST
- [ ] OPTIONS
- [ ] TRACE

Пояснение: HTML-формы нативно отправляют только GET и POST; POST — типовой вектор CSRF. PUT/DELETE требуют fetch/XHR, которые на чужом домене блокируются CORS-префлайтом.

## Источники

- OWASP CSRF: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- MDN - SameSite cookies: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#samesitesamesitevalue
