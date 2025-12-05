# Testing Strategy

CareSync relies on **Jest** and **Supertest** for automated testing.

## Test Suites

| File | Purpose |
|------|---------|
| `integration.test.js` | End-to-end API flow |
| `race-condition.test.js` | Simultaneous booking conflict |
| `timezone.test.js` | Time-zone edge cases |

Run all tests:

```bash
cd server
npm test
```

## Continuous Integration

A GitHub Actions workflow (to be added) will run tests on every pull request.
