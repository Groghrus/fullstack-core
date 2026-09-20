---
id: sql-injection
block: 11-bezopasnost
tags: [sql-injection, sqli, security, database, owasp]
order: 12
related: [security, xss, waf]
difficulty: beginner
languages: [typescript, go, java]
status: done
---

# SQL-инъекции (SQL Injection)

SQL-инъекция (SQLi) — это уязвимость внедрения кода, при которой злоумышленник передает вредоносные SQL-фрагменты через входные параметры.

## Зачем нужна защита от SQLi

SQLi входит в топ критических уязвимостей (OWASP Top 10).
- **Утечка и модификация данных:** Выгрузка всей базы или удаление таблиц (`DROP TABLE`).

## Как работает SQL-инъекция

```mermaid
flowchart TD
    A[Злоумышленник: ' OR 1=1 --] --> B@{ shape: diam, label: "Конкатенация SQL" }
    B -->|Выполнение| C[SELECT * FROM users WHERE 1=1]
    C --> D[Взлом: Возврат всех записей]
    A@{ shape: brace-r, label: "SQLi Attack" }
```

```mermaid
sequenceDiagram
    participant Attacker as Злоумышленник
    participant App as Уязвимое Приложение
    participant DB as БД
    Attacker->>App: POST /login (username: admin' --)
    App->>DB: SELECT * FROM users WHERE user = 'admin' --'
    DB-->>App: Данные администратора
    App-->>Attacker: Успешный вход
```

## Примеры кода

> Ключевые сценарии: параметризованные запросы в TypeScript, Go и Java.

### TypeScript (pg parameterized query)

```typescript
import { Pool } from 'pg';
const pool = new Pool();

async function safeSearch(username: string) {
  const query = 'SELECT * FROM users WHERE username = $1';
  return pool.query(query, [username]);
}
```

### Go (database/sql parameterized)

```go
package main

import "database/sql"

func GetUser(db *sql.DB, username string) *sql.Row {
	return db.QueryRow("SELECT id FROM users WHERE username = $1", username)
}
```

### Java (Spring Data JPA)

```java
package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByUsername(String username);
}
```

## Вопросы

### Q1
**Какой самый надежный способ предотвратить SQL-инъекции?**
- [ ] Использование RegExp для фильтрации кавычек
- [x] Использование параметризованных запросов (Prepared Statements), отделяющих структуру запроса от данных
- [ ] Переход на NoSQL
- [ ] Запрет метода POST

Пояснение: Параметризованные запросы гарантируют, что ввод не станет частью кода.

### Q2
**В чем главная опасность конкатенации строк в SQL?**
- [ ] Медленные запросы
- [x] Пользовательский ввод может изменить логику SQL-запроса, внедрив вредоносные операторы
- [ ] Больше памяти
- [ ] Режим чтения БД

Пояснение: Конкатенация смешивает код и данные в единую строку.

### Q3
**Что делает оператор комментария (`--`) при SQLi?**
- [ ] Ускоряет запрос
- [x] Заставляет БД игнорировать всю оставшуюся часть оригинального SQL-запроса
- [ ] Шифрует ответ
- [ ] Удаляет кэш

Пояснение: Комментарий отсекает хвост запроса (например, проверку пароля).

### Q4
**Защищают ли современные ORM от SQLi?**
- [ ] Нет
- [x] Да, при использовании стандартных методов, но уязвимость может появиться при конкатенации в сырых запросах
- [ ] Только в Java
- [ ] Только для записи

Пояснение: ORM по умолчанию используют параметризацию, но сырые запросы требуют аккуратности.

### Q5
**Что такое UNION-based SQLi?**
- [ ] Объединение таблиц в бэкапе
- [x] Оператор, позволяющий присоединить результаты своего вредоносного SELECT к результатам приложения
- [ ] Перезагрузка сервера
- [ ] Сжатие БД

Пояснение: Используется для выгрузки данных через видимый ответ приложения.

## Источники

- OWASP SQL Injection: https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
- PortSwigger SQLi: https://portswigger.net/web-security/sql-injection
