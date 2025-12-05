# CareSync - Healthcare Appointment Booking Platform MVP

CareSync is a robust appointment booking system that allows healthcare providers to set their availability and patients to book 15-minute appointment slots. The platform prioritizes data integrity to prevent double-booking, which is critical in healthcare settings.

## Features

- **Provider Management**: Create and manage healthcare providers
- **Availability Management**: Providers can set their working hours by day of week
- **Slot Calculation**: Automatic generation of 15-minute appointment slots from availability blocks
- **Appointment Booking**: Patients can view available slots and book appointments
- **Race Condition Prevention**: Database-level locking and unique constraints prevent double-booking
- **RESTful API**: Clean, well-structured API endpoints
- **React Frontend**: Functional UI for both providers and patients
- **Timezone Awareness**: Provider-specific time zones with automatic conversion of booking times

## Tech Stack

- **Backend**: Node.js with Express
- **Database**: PostgreSQL
- **Frontend**: React
- **Testing**: Jest with Supertest
- **Containerization**: Docker & Docker Compose

## Project Structure

```
CareSync/
├── server/                 # Backend API
│   ├── routes/            # API route handlers
│   ├── migrations/        # Database migrations
│   ├── tests/             # Integration and race condition tests
│   ├── scripts/           # Utility scripts (migrations)
│   ├── db.js              # Database connection
│   └── index.js           # Express server
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── api.js         # API client
│   │   └── App.js         # Main app component
│   └── public/
├── docker-compose.yml     # Docker Compose configuration
├── Dockerfile             # Docker build configuration
└── README.md
```

## Database Schema

### Providers
- `id` (Primary Key)
- `name`
- `email` (Unique)
- `specialty`
- `time_zone` (IANA identifier, e.g., `America/New_York`)
- `created_at`, `updated_at`

### Availability
- `id` (Primary Key)
- `provider_id` (Foreign Key)
- `day_of_week` (0-6, where 0=Sunday)
- `start_time`, `end_time`
- Unique constraint on (provider_id, day_of_week, start_time, end_time)

### Appointments
- `id` (Primary Key)
- `provider_id` (Foreign Key)
- `patient_name`, `patient_email`
- `appointment_date`, `appointment_time`
- `duration_minutes` (default: 15)
- **Unique constraint on (provider_id, appointment_date, appointment_time)** - Prevents double-booking

## API Endpoints

### Providers
- `POST /api/providers` - Create a new provider
- `GET /api/providers` - Get all providers
- `GET /api/providers/:id` - Get a specific provider

### Availability
- `POST /api/availability` - Submit working hours for a provider
  ```json
  {
    "provider_id": 1,
    "availability": [
      {
        "day_of_week": 1,
        "start_time": "09:00:00",
        "end_time": "17:00:00"
      }
    ]
  }
  ```
- `GET /api/availability/provider/:provider_id` - Get availability for a provider

### Appointments
- `GET /api/appointments/available?provider_id=1&date=2024-01-15` - Get available slots
- `POST /api/appointments` - Book an appointment
  ```json
  {
    "provider_id": 1,
    "patient_name": "John Doe",
    "patient_email": "john@example.com",
    "appointment_date": "2024-01-15",
    "appointment_time": "10:00:00"
  }
  ```
- `GET /api/appointments/provider/:provider_id` - Get appointments for a provider

## Race Condition Prevention

The booking endpoint uses multiple layers of protection against double-booking:

1. **Database Transaction**: All booking operations are wrapped in a transaction
2. **Row-Level Locking**: `SELECT FOR UPDATE` locks the row during the booking check
3. **Unique Constraint**: Database-level unique constraint on (provider_id, appointment_date, appointment_time)
4. **Error Handling**: Returns 409 Conflict if a booking attempt fails

This ensures that even if two requests arrive simultaneously for the same slot, only one will succeed.

## Demo

[▶️ Watch the CareSync demo](https://drive.google.com/file/d/1hQ4UFlXZJcMBlZDWMRox9WccROrw-p7x/view?usp=sharing)

## Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Docker and Docker Compose (optional, for containerized setup)

### Local Development Setup

**Manual Setup:**

1. **Install dependencies:**
   ```bash
   cd CareSync
   npm install
   cd server && npm install
   cd ../client && npm install
   ```

2. **Set up PostgreSQL database:**
   ```bash
   createdb caresync
   # Or using psql:
   # psql -U postgres
   # CREATE DATABASE caresync;
   ```

3. **Configure environment variables:**
   ```bash
   cd server
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run database migrations:**
   ```bash
   cd server
   npm run migrate
   ```

5. **Start the development servers:**
   ```bash
   # From root directory
   npm run dev
   ```
   This starts both the backend (port 3001) and frontend (port 3000).

### Docker Setup

1. **Build and start containers:**
   ```bash
   docker compose up --build
   ```

   This will:
   - Start PostgreSQL container
   - Build and start the backend server
   - Run database migrations automatically
   - Serve the React app from the backend

2. **Access the application:**
   - Frontend: http://localhost:3001
   - API: http://localhost:3001/api

3. **Stop containers:**
   ```bash
   docker compose down
   ```

## Testing

### Run Integration Tests
```bash
cd server
npm test
```

### Run Race Condition Test
The race condition test (`race-condition.test.js`) specifically tests that double-booking is prevented when two requests arrive simultaneously.

```bash
cd server
npm test -- race-condition.test.js
```

## Usage

### Provider Workflow

1. Navigate to "Provider Portal"
2. Create a new provider (name, email, specialty)
3. Select the provider and add availability blocks:
   - Choose day of week (Sunday=0, Monday=1, etc.)
   - Set start and end times
   - Add multiple blocks for different days
4. Submit availability

### Patient Workflow

1. Navigate to "Patient Booking"
2. Select a provider from the dropdown
3. Choose a date (must be in the future)
4. View available 15-minute slots
5. Select a time slot
6. Enter patient name and email
7. Book the appointment

## Algorithm: Slot Calculation

The system calculates available slots by:

1. Finding all availability blocks for the provider on the requested day
2. Generating 15-minute slots within each availability block
3. Querying existing appointments for that date
4. Filtering out booked slots
5. Returning the remaining available slots

Time complexity: O(n + m) where n = number of availability blocks, m = number of appointments

## Timezone Handling

CareSync is fully timezone-aware:

1. **Provider Time Zone**: Each provider record stores an `time_zone` field using an IANA identifier (e.g., `Europe/London`).
2. **Automatic Inference**: If a provider is created without a time zone, the backend infers it from the first appointment request and persists it.
3. **Slot Calculation**: Available slots are generated and compared in the provider’s local time, guaranteeing that bookings align with their working hours.
4. **Cross-Zone Booking**: Patients can book from any timezone; the client passes an ISO-8601 date-time (`start`). The backend converts this to the provider’s local date & time for validation and storage.
5. **Consistent Storage**: Dates and times are stored separately (`appointment_date`, `appointment_time`) to keep queries fast and simple while respecting local semantics.

All validations—past date checks, 15-minute boundary enforcement, availability matching, and the double-booking guard—operate in the provider’s timezone, ensuring accuracy regardless of where the request originates.

## Data Integrity Guarantees

1. **No Double-Booking**: Enforced at database level with unique constraints and row-level locking
2. **Valid Time Slots**: Only slots within provider availability can be booked
3. **15-Minute Boundaries**: Time validation ensures slots are on 15-minute intervals
4. **No Past Bookings**: Date validation prevents booking appointments in the past
5. **Referential Integrity**: Foreign key constraints ensure data consistency

