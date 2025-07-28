# API Testing Challenges Guide

This guide demonstrates how to use the new `/api/testing` endpoints to simulate and practice the 5 most common API testing challenges in real-world applications.

## Overview

The testing endpoints are designed to help you understand and practice handling common API issues that developers and QA teams encounter daily. Each endpoint can be configured to simulate different failure scenarios and edge cases.

## Configuration

All testing endpoints can be configured using the configuration endpoint:

### Get Current Configuration

```http
GET /api/testing/config
```

### Update Configuration

```http
POST /api/testing/config
Content-Type: application/json

{
  "authFailureRate": 0.3,        // 30% of auth requests will fail
  "networkDelayMs": 2000,        // 2 second delay on all requests
  "networkFailureRate": 0.1,     // 10% of requests will randomly fail
  "rateLimitWindow": 60000,      // 1 minute rate limit window
  "rateLimitMax": 5,             // 5 requests per window
  "validationStrictness": "strict" // strict|normal|loose validation
}
```

---

## 1. Authentication & Authorization Issues

### Common Real-World Scenarios:

- Token expiration during long sessions
- Intermittent authentication failures
- Token refresh mechanisms
- Invalid or malformed tokens

### Testing Endpoints:

#### Flaky Authentication

```http
POST /api/testing/auth/flaky-login
Content-Type: application/json

{
  "username": "testuser",
  "password": "testpass"
}
```

- **Purpose**: Simulates unreliable authentication services
- **Behavior**: Randomly fails based on `authFailureRate` configuration
- **Use Cases**: Test retry logic, error handling, fallback mechanisms

#### Short-Lived Tokens

```http
POST /api/testing/auth/short-token
Content-Type: application/json

{
  "expiresInSeconds": 30
}
```

- **Purpose**: Creates tokens that expire quickly for testing refresh scenarios
- **Behavior**: Returns JWT tokens with very short expiration times (1-300 seconds)
- **Use Cases**: Test token refresh flows, session management

#### Protected Resource with Flaky Auth

```http
GET /api/testing/auth/protected-resource
Authorization: Bearer YOUR_JWT_TOKEN
```

- **Purpose**: Tests token validation with random rejections
- **Behavior**: May reject valid tokens based on configuration
- **Use Cases**: Test client resilience to temporary auth issues

### Interview Talking Points:

- "Authentication failures can happen due to network issues, service overload, or token validation problems"
- "I implemented retry logic with exponential backoff for failed auth requests"
- "Token expiration handling requires proactive refresh before expiry"

---

## 2. Data Validation & Error Handling

### Common Real-World Scenarios:

- Different validation rules across environments
- Inconsistent error messages
- Type coercion issues
- Required field validation changes

### Testing Endpoints:

#### User Profile Validation

```http
POST /api/testing/validation/user-profile
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "age": 25,
  "phone": "+1-555-123-4567",
  "bio": "Software developer"
}
```

- **Purpose**: Tests different validation strictness levels
- **Modes**:
  - `strict`: Extensive validation (email format, character restrictions, length limits)
  - `normal`: Standard validation (basic format checks)
  - `loose`: Minimal validation (only required fields)

#### Data Type Validation

```http
POST /api/testing/validation/data-types
Content-Type: application/json

{
  "stringField": "text",
  "numberField": 123,
  "booleanField": true,
  "dateField": "2025-07-03",
  "arrayField": [1, 2, 3],
  "objectField": {"key": "value"}
}
```

- **Purpose**: Tests type validation and coercion
- **Behavior**: Validates each field's data type and format
- **Use Cases**: Test client data serialization, type safety

### Interview Talking Points:

- "Validation rules often change between development and production environments"
- "I implemented comprehensive error handling that captures validation details for debugging"
- "Type validation prevents runtime errors and data corruption"

---

## 3. Rate Limiting & Throttling

### Common Real-World Scenarios:

- API rate limits exceeded during peak usage
- Different limits for different user tiers
- Burst traffic handling
- Rate limit headers interpretation

### Testing Endpoints:

#### Basic Rate Limiting

```http
GET /api/testing/rate-limit/basic
```

- **Purpose**: Tests standard rate limiting behavior
- **Headers**: Returns `X-RateLimit-*` headers for monitoring
- **Behavior**: Blocks requests after configured limit is reached

#### Burst Testing

```http
POST /api/testing/rate-limit/burst
Content-Type: application/json

{
  "requestCount": 15
}
```

- **Purpose**: Tests rapid successive requests
- **Behavior**: Makes multiple requests quickly and reports which ones succeed/fail
- **Use Cases**: Test burst handling, rate limit recovery

### Rate Limit Headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: When the rate limit resets (Unix timestamp)

### Interview Talking Points:

- "Rate limiting protects APIs from abuse and ensures fair usage"
- "I implemented exponential backoff when rate limits are hit"
- "Different endpoints may have different rate limits based on resource intensity"

---

## 4. Network & Connectivity Issues

### Common Real-World Scenarios:

- Intermittent network timeouts
- Slow response times
- Service unavailability
- Partial failures

### Testing Endpoints:

#### Slow Response Simulation

```http
GET /api/testing/network/slow-response?delay=5000
```

- **Purpose**: Simulates slow network conditions
- **Parameters**: `delay` - additional delay in milliseconds (0-30000)
- **Use Cases**: Test timeout handling, loading states, user experience

#### Random Failure Simulation

```http
GET /api/testing/network/random-failure
```

- **Purpose**: Randomly fails based on `networkFailureRate`
- **Behavior**: Returns 503 Service Unavailable with retry-after header
- **Use Cases**: Test error handling, retry mechanisms, circuit breakers

#### Timeout Testing

```http
GET /api/testing/network/timeout-test?behavior=slow
```

- **Behaviors**:
  - `normal`: Returns immediately
  - `slow`: 5-second delay
  - `timeout`: Returns 408 Request Timeout
  - `hang`: Never responds (causes client timeout)

### Interview Talking Points:

- "Network issues are common in distributed systems and require proper handling"
- "I implemented circuit breaker patterns to handle service failures gracefully"
- "Timeout configuration should balance user experience with system reliability"

---

## 5. Pagination & Large Dataset Handling

### Common Real-World Scenarios:

- Performance degradation with large offsets
- Inconsistent results during pagination
- Cursor vs offset pagination trade-offs
- Data changes during pagination

### Testing Endpoints:

#### Large Dataset Pagination

```http
GET /api/testing/pagination/large-dataset?page=1&limit=10&total_records=50000
```

- **Purpose**: Simulates pagination with large datasets
- **Behavior**: Introduces artificial delays for large offsets (realistic performance simulation)
- **Parameters**:
  - `page`: Page number (1-based)
  - `limit`: Records per page (1-100)
  - `total_records`: Total dataset size (0-100000)

#### Cursor-Based Pagination

```http
GET /api/testing/pagination/cursor-based?limit=10&direction=next
```

- **Purpose**: Demonstrates cursor-based pagination
- **Benefits**: Consistent performance regardless of dataset size
- **Parameters**:
  - `cursor`: Base64-encoded cursor for position
  - `limit`: Records per page
  - `direction`: `next` or `prev`

#### Inconsistent Pagination

```http
GET /api/testing/pagination/inconsistent?page=2&limit=5&issue_type=duplicates
```

- **Purpose**: Simulates common pagination problems
- **Issue Types**:
  - `duplicates`: Records appear on multiple pages
  - `missing_records`: Records are skipped between pages
  - `changing_order`: Sort order changes between requests
  - `none`: Normal behavior

### Interview Talking Points:

- "Offset-based pagination becomes slow with large datasets due to database performance"
- "Cursor-based pagination provides consistent performance but is more complex to implement"
- "Data consistency during pagination requires careful consideration of concurrent modifications"

---

## Testing Scenarios

### Scenario 1: Authentication Flow Testing

1. Configure 30% auth failure rate
2. Attempt login multiple times to see failures
3. Get short-lived token (30 seconds)
4. Use token immediately - should work
5. Wait 35 seconds and try again - should fail
6. Test protected resource with flaky auth enabled

### Scenario 2: Validation Testing

1. Set validation to "strict" mode
2. Try submitting invalid data (missing fields, wrong formats)
3. Switch to "loose" mode and retry same data
4. Test different data types with type validation endpoint

### Scenario 3: Rate Limiting Testing

1. Set rate limit to 5 requests per minute
2. Make rapid requests to rate limit endpoint
3. Observe when 429 errors start appearing
4. Check rate limit headers
5. Test burst endpoint with 10 requests

### Scenario 4: Network Issues Testing

1. Set 20% network failure rate and 2000ms delay
2. Make multiple requests to observe failures and delays
3. Test slow response endpoint with various delays
4. Try timeout test with different behaviors

### Scenario 5: Pagination Testing

1. Test large dataset with 50,000 records
2. Navigate to page 1000+ and observe performance
3. Try cursor-based pagination for comparison
4. Test inconsistent pagination with different issue types

---

## Best Practices for API Testing

1. **Always test edge cases**: Empty responses, large datasets, invalid inputs
2. **Test error conditions**: Network failures, timeouts, authentication issues
3. **Verify error handling**: Proper status codes, error messages, retry mechanisms
4. **Performance testing**: Response times under various conditions
5. **Consistency testing**: Pagination results, data ordering, state management

## Integration with Testing Tools

These endpoints can be integrated with:

- **Postman**: Create collections with different test scenarios
- **Jest/Mocha**: Automated test suites
- **Load testing tools**: Artillery, k6, JMeter
- **Monitoring tools**: Test synthetic transactions

---

## Configuration Examples

### Development Environment (Forgiving)

```json
{
  "authFailureRate": 0.05,
  "networkDelayMs": 100,
  "networkFailureRate": 0.02,
  "rateLimitWindow": 60000,
  "rateLimitMax": 100,
  "validationStrictness": "normal"
}
```

### Staging Environment (Realistic)

```json
{
  "authFailureRate": 0.15,
  "networkDelayMs": 500,
  "networkFailureRate": 0.05,
  "rateLimitWindow": 60000,
  "rateLimitMax": 50,
  "validationStrictness": "strict"
}
```

### Chaos Testing (Aggressive)

```json
{
  "authFailureRate": 0.3,
  "networkDelayMs": 2000,
  "networkFailureRate": 0.2,
  "rateLimitWindow": 30000,
  "rateLimitMax": 10,
  "validationStrictness": "strict"
}
```

This comprehensive testing suite will help you understand, practice, and demonstrate your knowledge of common API testing challenges in interviews and real-world scenarios.
