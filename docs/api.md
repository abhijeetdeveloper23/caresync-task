# REST API Reference

This document describes all public endpoints exposed by the CareSync backend. All responses are JSON.

> Base URL: `http://localhost:3001/api`

## Providers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/providers` | Create a provider |
| `GET`  | `/providers` | List providers |
| `GET`  | `/providers/:id` | Get a single provider |

### Create Provider

```http
POST /providers
Content-Type: application/json

{
  "name": "Dr. Smith",
  "email": "smith@example.com",
  "specialty": "Cardiology",
  "time_zone": "America/New_York"
}
```

Response `201 Created`

```json
{
  "id": 1,
  "name": "Dr. Smith",
  "email": "smith@example.com",
  "specialty": "Cardiology",
  "time_zone": "America/New_York"
}
```

---

## Availability

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/availability` | Submit weekly availability |
| `GET`  | `/availability/provider/:provider_id` | Get provider availability |

---

## Appointments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET`  | `/appointments/available` | List free slots |
| `POST` | `/appointments` | Book a slot |
| `GET`  | `/appointments/provider/:provider_id` | Provider appointments |

Refer to request/response examples in the root `README.md`.

---
*Last updated: {{DATE}}*
