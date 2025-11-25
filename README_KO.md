# Container System for Node.js/TypeScript

C++, Python, .NET, Go, Rust, 그리고 Node.js/TypeScript 간의 타입 안전한 데이터 직렬화 및 상호 운용성을 제공하는 크로스 언어 호환 컨테이너 시스템입니다.

> **언어:** [English](README.md) | **한국어**

## ⚠️ 주요 변경 사항 알림 (v1.0.1)

**타입 ID 매핑 수정**: 버전 1.0.1은 ValueType ID가 C++ 표준과 일치하지 않아 바이너리 호환성이 깨지는 중요한 버그를 수정했습니다. v1.0.0을 사용하셨다면 **반드시** 업데이트해야 합니다:

- **이전 (v1.0.0 - 잘못됨)**: Bool=0, Short=1, UShort=2, ..., Array=14
- **수정 (v1.0.1 - 정확함)**: Null=0, Bool=1, Short=2, UShort=3, ..., Container=14, Array=15

**필수 조치**:
1. v1.0.1로 즉시 업데이트
2. v1.0.0으로 생성된 모든 데이터를 다시 직렬화
3. v1.0.0으로 직렬화된 데이터는 v1.0.1 또는 다른 언어와 **호환되지 않음**

**이유**: 표준 C++ 구현(container_system/core/value_types.h)은 Null을 타입 0으로 정의하지만, v1.0.0에서는 이를 잘못 생략하여 모든 후속 타입 ID가 1씩 어긋났습니다.

## 주요 기능

- **16개 값 타입**: null, bool, short, ushort, int, uint, float, long(32비트), ulong(32비트), llong(64비트), ullong(64비트), double, string, bytes, container, array 지원
- **Null 값 지원**: 명시적 null 값(타입 0)으로 누락된 필드와 명시적으로 null인 필드 구분
- **플랫폼 독립성**: long/ulong 타입에 대해 4바이트 직렬화를 강제하여 모든 플랫폼에서 일관된 동작 보장
- **타입 안전성**: TypeScript의 타입 시스템과 런타임 검증을 결합하여 타입 오류 방지
- **제로 카피 역직렬화**: 최소한의 메모리 오버헤드로 효율적인 Buffer 기반 직렬화
- **중첩 구조**: 중첩된 컨테이너 및 배열 지원
- **크로스 언어**: C++, Python, .NET, Go, Rust 구현과 바이너리 호환

## 설치

```bash
npm install @kcenon/container-system
```

## 빠른 시작

```typescript
import { Container, IntValue, StringValue } from '@kcenon/container-system';

// 컨테이너 생성
const container = new Container('user');

// 범위 검사와 함께 값 추가
const ageResult = IntValue.create('age', 25);
if (ageResult.ok) {
  container.add(ageResult.value);
}

container.add(new StringValue('name', 'John Doe'));

const timestampResult = LongValue.create('timestamp', 1234567890);
if (timestampResult.ok) {
  container.add(timestampResult.value);
}

// Buffer로 직렬화
const buffer = container.serialize();

// Buffer에서 역직렬화
const result = Container.deserialize(buffer);
console.log(result.value.get('name').getValue()); // "John Doe"
```

## Long/ULong 타입 정책 (중요)

이 구현은 플랫폼 독립성과 크로스 언어 호환성을 보장하기 위해 `LongValue`(타입 6)와 `ULongValue`(타입 7)에 대해 **32비트 범위**를 강제합니다:

- **LongValue (타입 6)**: 부호 있는 32비트 정수 `[-2^31, 2^31-1]` → 4바이트 직렬화
- **ULongValue (타입 7)**: 부호 없는 32비트 정수 `[0, 2^32-1]` → 4바이트 직렬화
- **LLongValue (타입 8)**: 부호 있는 64비트 BigInt (전체 i64 범위) → 8바이트 직렬화
- **ULLongValue (타입 9)**: 부호 없는 64비트 BigInt (전체 u64 범위) → 8바이트 직렬화

### 왜 이런 정책인가?

플랫폼마다 `long` 크기가 다릅니다:
- Unix/Linux: 8바이트 (64비트)
- Windows: 4바이트 (32비트)

타입 6과 7에 대해 4바이트 직렬화를 강제함으로써, 플랫폼 간 데이터 역직렬화 시 오버플로우 오류를 방지합니다.

### 예제

```typescript
import { LongValue, LLongValue, ULongValue, ULLongValue } from '@kcenon/container-system';

// ✅ 정확: 32비트 값은 LongValue에 적합
const result1 = LongValue.create('count', 2_000_000_000);
if (result1.ok) {
  console.log(result1.value.getValue()); // 2000000000
}

// ❌ 오류: 값이 32비트 범위를 초과
const result2 = LongValue.create('big', 5_000_000_000);
if (!result2.ok) {
  console.error(result2.error.message); // 오버플로우 오류
}

// ✅ 정확: 64비트 값에는 LLongValue 사용
const llongVal = new LLongValue('big', 5_000_000_000n);
console.log(llongVal.getValue()); // 5000000000n

// ✅ 정확: 32비트 부호 없는 정수에는 ULongValue
const ulongResult = ULongValue.create('counter', 3_000_000_000);
if (ulongResult.ok) {
  console.log(ulongResult.value.getValue()); // 3000000000
}

// ✅ 정확: 64비트 부호 없는 정수에는 ULLongValue
const ullongVal = new ULLongValue('huge', 10_000_000_000n);
console.log(ullongVal.getValue()); // 10000000000n
```

## 값 타입

### Null 값

```typescript
import { NullValue, Container } from '@kcenon/container-system';

// 명시적 null 값 - 누락과 null 구분
const nullVal = new NullValue('optional_field');
console.log(nullVal.getValue()); // null

// 사용 사례: 명시적으로 null인 필드가 있는 API 응답
const response = new Container('api_response');
response.add(new NullValue('middle_name')); // 명시적으로 null
// last_name은 추가하지 않음 (누락)

// 차이점 확인
console.log(response.has('middle_name')); // true (존재하지만 null)
console.log(response.has('last_name')); // false (누락)
```

### 기본 타입

```typescript
import {
  BoolValue,
  ShortValue,
  UShortValue,
  IntValue,
  UIntValue,
  FloatValue,
  DoubleValue,
} from '@kcenon/container-system';

const flag = new BoolValue('enabled', true);

const shortResult = ShortValue.create('year', 2025);
const intResult = IntValue.create('population', 1000000);
const uintResult = UIntValue.create('id', 4000000000);

const temp = new FloatValue('temperature', 36.5);
const pi = new DoubleValue('pi', 3.141592653589793);
```

### 문자열과 바이트

```typescript
import { StringValue, BytesValue } from '@kcenon/container-system';

const message = new StringValue('message', 'Hello, World! 안녕하세요!');
const data = new BytesValue('data', Buffer.from([0x01, 0x02, 0x03]));
```

### 중첩 컨테이너

```typescript
import { Container, StringValue, IntValue } from '@kcenon/container-system';

const user = new Container('user');
user.add(new StringValue('name', 'Alice'));

const ageResult = IntValue.create('age', 30);
if (ageResult.ok) {
  user.add(ageResult.value);
}

const root = new Container('root');
root.add(user);
```

### 배열

```typescript
import { ArrayValue, IntValue } from '@kcenon/container-system';

const int1 = IntValue.create('', 1);
const int2 = IntValue.create('', 2);
const int3 = IntValue.create('', 3);

if (int1.ok && int2.ok && int3.ok) {
  const numbers = new ArrayValue('numbers', [int1.value, int2.value, int3.value]);
  console.log(numbers.length()); // 3
  console.log((numbers.at(0) as IntValue).getValue()); // 1
}
```

## 오류 처리

제한된 범위를 가진 모든 숫자 타입은 안전한 값 생성을 위해 `Result<T, E>` 패턴을 사용합니다:

```typescript
import { LongValue } from '@kcenon/container-system';

const result = LongValue.create('value', 3_000_000_000);

if (result.ok) {
  // 성공 케이스
  const value = result.value;
  console.log(value.getValue());
} else {
  // 오류 케이스
  console.error(result.error.message);
}
```

전체 범위를 받아들이는 64비트 타입의 경우, 생성자가 유효하지 않은 입력에 대해 예외를 발생시킵니다:

```typescript
import { LLongValue, NumericRanges } from '@kcenon/container-system';

try {
  const value = new LLongValue('max', NumericRanges.LLONG_MAX);
  console.log(value.getValue());
} catch (error) {
  console.error(error.message);
}
```

## 직렬화

모든 값은 Buffer로의 직렬화를 지원합니다:

```typescript
const container = new Container('data');
// ... 값 추가 ...

const buffer = container.serialize();

// 파일로 저장
fs.writeFileSync('data.bin', buffer);

// 네트워크로 전송
socket.send(buffer);
```

## 역직렬화

```typescript
import { Container } from '@kcenon/container-system';

const buffer = fs.readFileSync('data.bin');
const result = Container.deserialize(buffer);

const container = result.value;
console.log(container.size()); // 값의 개수
console.log(container.keys()); // 값 이름의 배열
```

## 타입 안전 검색

```typescript
import { Container, StringValue } from '@kcenon/container-system';

const container = new Container('root');
container.add(new StringValue('name', 'test'));

// 타입 안전 검색
const name = container.getAs('name', StringValue);
console.log(name.getValue()); // "test"

// 타입이 일치하지 않으면 예외 발생
container.getAs('name', BoolValue); // 오류!
```

## 테스트

```bash
# 모든 테스트 실행
npm test

# 커버리지와 함께 실행
npm run test:coverage

# 감시 모드
npm run test:watch
```

## 빌드

```bash
# TypeScript를 JavaScript로 빌드
npm run build

# 개발용 감시 모드
npm run build:watch
```

## 문서

전체 문서는 [docs/](docs/) 디렉토리를 참조하세요:

- **[문서 인덱스](docs/README.md)** - 전체 문서 개요
- **[기능 문서](docs/FEATURES.md)** - 상세한 기능 설명
- **[API 참조](docs/API_REFERENCE.md)** - 전체 API 문서
- **[아키텍처](docs/ARCHITECTURE.md)** - 시스템 설계 및 구조
- **[프로젝트 구조](docs/PROJECT_STRUCTURE.md)** - 파일 구성
- **[변경 사항](docs/CHANGELOG.md)** - 버전 이력
- **[FAQ](docs/guides/FAQ.md)** - 자주 묻는 질문
- **[문제 해결](docs/guides/TROUBLESHOOTING.md)** - 일반적인 문제와 해결책
- **[테스트 전략](docs/contributing/TESTING.md)** - 테스트 가이드
- **[성능 벤치마크](docs/performance/BENCHMARKS.md)** - 성능 지표

## API 문서

### Container 클래스

- `add(value: Value)`: 컨테이너에 값 추가
- `get(name: string)`: 이름으로 값 가져오기 (없으면 예외 발생)
- `tryGet(name: string)`: 이름으로 값 가져오기 (없으면 undefined 반환)
- `getAs<T>(name: string, type: Constructor<T>)`: 타입 검사와 함께 타입이 지정된 값 가져오기
- `has(name: string)`: 값 존재 여부 확인
- `remove(name: string)`: 값 제거
- `clear()`: 모든 값 제거
- `size()`: 값의 개수 가져오기
- `keys()`: 모든 값 이름 가져오기
- `serialize()`: Buffer로 직렬화
- `clone()`: 깊은 복사 생성

### Value 인터페이스

모든 값 타입은 다음을 구현합니다:

- `getName()`: 이름/키 가져오기
- `getType()`: ValueType 열거형 값 가져오기
- `getValue()`: 기본 값 가져오기
- `serialize()`: Buffer로 직렬화
- `clone()`: 깊은 복사 생성

## 크로스 언어 호환성

이 구현은 다음과 바이너리 호환됩니다:

- C++ container_system
- Python container_system
- .NET container_system
- Go container_system
- Rust container_system

모든 시스템은 동일한 와이어 포맷을 사용합니다:
```
[타입: 1바이트][이름_길이: 4바이트 LE][이름: UTF-8][값_크기: 4바이트 LE][값: 바이트]
```

### 크로스 언어 통합 테스트

프로젝트에는 다음을 확인하는 포괄적인 크로스 언어 호환성 테스트(`tests/cross_language.test.ts`)가 포함되어 있습니다:

1. **타입 ID 매핑**: 모든 타입 ID가 C++ 표준과 일치 (container_system/core/value_types.h)
2. **와이어 포맷 준수**: 직렬화 형식이 사양을 정확히 따름
3. **32비트 Long/ULong 정책**: LongValue(타입 6)와 ULongValue(타입 7)가 정확히 4바이트로 직렬화
4. **라운드트립 직렬화**: 데이터를 손실 없이 직렬화 및 역직렬화
5. **바이너리 호환성**: 생성된 테스트 데이터 파일을 다른 언어 구현에서 읽을 수 있음

크로스 언어 검증을 위한 테스트 데이터 파일을 생성하려면:

```bash
npx ts-node tests/generate_test_data.ts
```

이는 C++, Python, .NET, Go, Rust 구현과의 호환성을 확인하는 데 사용할 수 있는 `tests/test_data/`에 바이너리 테스트 파일을 생성합니다.

## 라이선스

BSD-3-Clause

## 기여

기여를 환영합니다! 다음을 확인해 주세요:

1. 모든 테스트 통과: `npm test`
2. 코드 포맷팅: `npm run format`
3. 린트 오류 없음: `npm run lint`
4. 80% 이상의 코드 커버리지 유지
5. TypeScript 모범 사례 준수

## 작성자

kcenon <kcenon@naver.com>

## 관련 프로젝트

이는 container_systems 제품군의 일부입니다:
- **C++ 구현**: [container_system](https://github.com/kcenon/container_system)
- **Python 구현**: (준비 중)
- **.NET 구현**: (준비 중)
- **Go 구현**: (준비 중)
- **Rust 구현**: (준비 중)
