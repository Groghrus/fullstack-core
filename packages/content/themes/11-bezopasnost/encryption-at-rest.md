---
id: encryption-at-rest
title: Шифрование данных на диске
block: 11-bezopasnost
tags: [encryption, security, at-rest, database, kms]
order: 6
related: [encryption-in-transit, tls, secret-management]
difficulty: medium
languages: [typescript, go, java]
status: done
---

# Шифрование в покое (Encryption at Rest)

## Определение

Шифрование в покое защищает данные (файлы, БД, бэкапы), когда они физически записаны на носители (SSD, HDD, S3).

## Зачем нужно Encryption at Rest

В случае физической кражи диска злоумышленник получит лишь зашифрованные байты.
- **Envelope Encryption:** Ключ данных (DEK) шифруется мастер-ключом (KEK) в KMS.

## Как работает Envelope Encryption

```mermaid
flowchart TD
    A[Мастер-ключ KEK] -->|Шифрует| B[Ключ данных DEK]
    B -->|Шифрует данные| C[База данных на диске]
    A@{ shape: brace-r, label: "Envelope Encryption" }
```

```mermaid
sequenceDiagram
    participant App as Приложение
    participant KMS as KMS
    participant Disk as Диск / БД
    App->>Disk: Чтение зашифрованных данных
    App->>KMS: Decrypt(Encrypted_DEK)
    KMS-->>App: Расшифрованный DEK
    Note over App: Расшифровка данных
```

## Примеры кода

> Ключевые сценарии: шифрование AES в TypeScript, Go и Java.

### TypeScript (AES-256-GCM)

```typescript
import crypto from 'crypto';
const key = crypto.randomBytes(32);

function encrypt(text: string) {
  const iv = crypto.randomBytes(12); // 96 бит — стандарт для GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  return { iv: iv.toString('hex'), enc, tag: cipher.getAuthTag().toString('hex') };
}
```

### Go (AES-GCM)

```go
package main

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
)

func Encrypt(plain, key []byte) ([]byte, error) {
	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	// nonce должен быть случайным и уникальным для каждого шифрования
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return nil, err
	}
	// возвращаем nonce + ciphertext (nonce нужен для расшифровки)
	return gcm.Seal(nonce, nonce, plain, nil), nil
}
```

### Java (AES/GCM)

```java
package com.example.demo;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;

public class Encryption {
    public static byte[] encrypt(byte[] data, SecretKey key) throws Exception {
        Cipher c = Cipher.getInstance("AES/GCM/NoPadding");
        c.init(Cipher.ENCRYPT_MODE, key);
        return c.doFinal(data);
    }
}
```

## Пример использования: интеграция

Поле-«железный» конфиденциальный атрибут шифруется приложением до записи (AEAD на ключе из KMS):

```ts
import { subtle } from 'node:crypto'

async function encryptField(plain: string, key: CryptoKey): Promise<string> {
  const nonce = crypto.getRandomValues(new Uint8Array(12))
  const ct = await subtle.encrypt(
    { name: 'AES-GCM', iv: nonce },
    key,
    Buffer.from(plain),
  )
  return Buffer.concat([nonce, Buffer.from(ct)]).toString('base64')
}
```

DEK берётся из KMS по запросу и живёт в памяти процесса; сами диски и бэкапы дополнительно шифруются на уровне хранилища.

## Паттерны использования

- **Envelope encryption** — данные на DEK, DEK на KEK в KMS; ключи отдельно от данных.
- **Шифровать чувствительные поля приложением** — то, что хранилище шифрует «для галочки», утекает с ошибкой приложения.
- **Ротация DEK без перешифровки всего** — меняется только обёртка, данные не трогаются.
- **Шифрование бэкапов** — носители и снэпшоты тоже «at rest».

## Антипаттерны и ловушки

- **Ключ в конфиге/коде рядом с данными** — шифрование превращается в декорацию.
- **Шифрование по-умолчанию на уровне диска только** — утечка через SQL-дамп не остановлена.
- **Хранить нешифрованные превью/логи** — данные «at rest» снова утекают через соседний файл.
- **Забыть про ротацию KEK** — компрометация одного ключа подставляет всё.

## Когда использовать / когда НЕ использовать

- **Использовать:** PCI/PHI/PII, бэкапы, снапшоты; любой чувствительный атрибут в БД.
- **НЕ использовать:** для публичных/нечувствительных данных — шифрование стоит ресурсов и усложняет полнотекстовый поиск; ключевой момент — защищать действительно ценные поля.

## Связанные темы

- **encryption-in-transit** — защита данных в сети дополняет защиту на диске.
- **tls** — передача и канал, и хранилище требуют разных механизмов.
- **secret-management** — управление ключами/секретами, от которых зависит вся схема.

## Вопросы

### Q1
**Что такое Encryption at Rest по сравнению с In-Transit?**
- [ ] At-Rest для сети
- [x] At-Rest защищает данные на носителях (дисках), а In-Transit — при передаче по сети
- [ ] At-Rest быстрее
- [ ] In-Transit для файлов

Пояснение: Различие в состоянии данных (хранятся или передаются).

### Q2
**Что такое конвертное шифрование (Envelope Encryption)?**
- [ ] Отправка ключей в конверте
- [x] Иерархия ключей, где KEK шифрует DEK, а DEK шифрует данные
- [ ] Сжатие файлов
- [ ] Шифрование заголовков

Пояснение: Снижает нагрузку на KMS при шифровании больших объемов данных.

### Q3
**Какой алгоритм симметричного шифрования является стандартом для At-Rest?**
- [ ] MD5
- [x] AES-256
- [ ] ROT13
- [ ] Base64

Пояснение: AES-256 надежный стандарт защиты конфиденциальных данных.

### Q4
**Зачем нужен случайный вектор инициализации (IV / Nonce) в AES-GCM?**
- [ ] Уменьшить файл
- [x] Чтобы одинаковый текст давал разный шифротекст при повторении
- [ ] Авторизация OAuth
- [ ] Ускорение CPU

Пояснение: Повторное использование IV с тем же ключом компрометирует шифрование.

### Q5
**Требуется ли шифрование бэкапов баз данных?**
- [ ] Нет
- [x] Да, бэкапы содержат те же чувствительные данные и часто хранятся в менее защищенных хранилищах
- [ ] Только если база > 1ТБ
- [ ] Автоматически без ключей

Пояснение: Бэкапы — частая точка утечки, требующая шифрования.

## Источники

- NIST SP 800-111: https://csrc.nist.gov/
- AWS KMS Concepts: https://docs.aws.amazon.com/kms/
