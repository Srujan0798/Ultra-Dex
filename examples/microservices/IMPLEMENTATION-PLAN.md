# Microservices Implementation Plan

## Phase 1: Project Setup & Infrastructure

### 1.1 Create Project Structure

```bash
mkdir -p examples/microservices
cd examples/microservices
mkdir -p services/{api-gateway,auth-service,users-service,orders-service,payments-service,notifications-service}
mkdir -p shared/{middleware,utils,models}
mkdir -p docker
```

### 1.2 Initialize Root Configuration

- Create root `package.json` with workspace configuration
- Set up `.gitignore` for Node.js and Docker
- Create `.env.example` with all environment variables
- Create `docker-compose.yml` with all infrastructure services

### 1.3 Docker Infrastructure

- PostgreSQL containers (5 instances - one per service)
- Redis container for caching
- RabbitMQ container with management plugin
- Consul container for service discovery
- Jaeger container for distributed tracing

## Phase 2: Shared Components

### 2.1 Shared Middleware

- Authentication middleware (JWT validation)
- Error handling middleware
- Request logging middleware
- Rate limiting middleware
- Health check middleware

### 2.2 Shared Utilities

- Database connection utilities
- Redis client utilities
- RabbitMQ connection utilities
- Service discovery client
- Tracing utilities (OpenTelemetry)
- Logger utility (structured logging)
- Response formatter
- Validation utilities

### 2.3 Shared Models

- Base model class
- Common interfaces/types

## Phase 3: API Gateway Implementation

### 3.1 Core Gateway Features

- Express server setup
- Request routing configuration
- JWT validation middleware
- Rate limiting (Redis-based)
- Circuit breaker implementation
- Service discovery integration

### 3.2 Routes Configuration

- Auth service routes: `/api/v1/auth/*`
- Users service routes: `/api/v1/users/*`
- Orders service routes: `/api/v1/orders/*`
- Payments service routes: `/api/v1/payments/*`
- Notifications service routes: `/api/v1/notifications/*`

### 3.3 Gateway Middleware

- CORS configuration
- Body parsing
- Request ID generation
- Response compression
- Timeout handling

## Phase 4: Auth Service Implementation

### 4.1 Database Schema

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for Redis fallback)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4.2 API Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Token refresh
- `GET /auth/validate` - Token validation (internal)
- `GET /auth/me` - Get current user
- `POST /auth/change-password` - Change password

### 4.3 Business Logic

- Password hashing with bcrypt
- JWT generation and validation
- Refresh token rotation
- Session management
- Rate limiting per IP/user

## Phase 5: Users Service Implementation

### 5.1 Database Schema

```sql
-- User profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address JSONB,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User settings table
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  theme VARCHAR(20) DEFAULT 'light',
  language VARCHAR(10) DEFAULT 'en',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5.2 API Endpoints

- `GET /users` - List users (admin)
- `GET /users/:id` - Get user by ID
- `POST /users` - Create user profile
- `PUT /users/:id` - Update user profile
- `DELETE /users/:id` - Delete user (soft delete)
- `GET /users/:id/settings` - Get user settings
- `PUT /users/:id/settings` - Update user settings

### 5.3 Integration

- Validate JWT tokens via Auth Service
- Cache user profiles in Redis
- Publish user events to message queue

## Phase 6: Orders Service Implementation

### 6.1 Database Schema

```sql
-- Orders table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order status history table
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2 API Endpoints

- `GET /orders` - List orders (with pagination)
- `GET /orders/:id` - Get order by ID
- `POST /orders` - Create new order
- `PUT /orders/:id` - Update order
- `PUT /orders/:id/status` - Update order status
- `DELETE /orders/:id` - Cancel order
- `GET /orders/:id/items` - Get order items
- `GET /users/:userId/orders` - Get user's orders

### 6.3 Event Publishing

- Publish `order.created` event
- Publish `order.updated` event
- Publish `order.cancelled` event
- Publish `order.status_changed` event

## Phase 7: Payments Service Implementation

### 7.1 Database Schema

```sql
-- Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255),
  gateway_response JSONB,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  last_four VARCHAR(4),
  expiry_month INTEGER,
  expiry_year INTEGER,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refunds table
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 7.2 API Endpoints

- `GET /payments` - List payments
- `GET /payments/:id` - Get payment by ID
- `POST /payments` - Process payment
- `POST /payments/:id/refund` - Process refund
- `GET /payments/methods` - List payment methods
- `POST /payments/methods` - Add payment method
- `DELETE /payments/methods/:id` - Remove payment method
- `GET /orders/:orderId/payments` - Get order payments

### 7.3 Event Consumption & Publishing

- Consume `order.created` events
- Publish `payment.processed` events
- Publish `payment.failed` events
- Publish `refund.processed` events

### 7.4 Mock Payment Gateway

- Simulate payment processing
- Support multiple payment methods
- Simulate failures and retries

## Phase 8: Notifications Service Implementation

### 8.1 Database Schema

```sql
-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL, -- email, sms, push
  channel VARCHAR(50) NOT NULL, -- order, payment, system
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification templates table
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  body TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification preferences table
CREATE TABLE notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  sms_enabled BOOLEAN DEFAULT false,
  push_enabled BOOLEAN DEFAULT true,
  order_updates BOOLEAN DEFAULT true,
  payment_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 8.2 API Endpoints

- `GET /notifications` - List notifications
- `GET /notifications/:id` - Get notification by ID
- `POST /notifications` - Create notification (admin)
- `PUT /notifications/:id/read` - Mark as read
- `DELETE /notifications/:id` - Delete notification
- `GET /notifications/preferences` - Get preferences
- `PUT /notifications/preferences` - Update preferences
- `GET /notifications/unread-count` - Get unread count

### 8.3 Event Consumption

- Consume `order.created` events → Send order confirmation
- Consume `order.status_changed` events → Send status updates
- Consume `payment.processed` events → Send payment confirmation
- Consume `payment.failed` events → Send payment failure notice
- Consume `user.registered` events → Send welcome email

### 8.4 Notification Channels

- Email (mock SMTP)
- SMS (mock provider)
- Push notifications (mock FCM/APNS)

## Phase 9: Service Discovery & Communication

### 9.1 Consul Setup

- Service registration on startup
- Health check endpoints
- Service deregistration on shutdown
- Service lookup utilities

### 9.2 Inter-Service Communication

- HTTP client with retry logic
- Circuit breaker pattern
- Service discovery integration
- Load balancing (round-robin)

### 9.3 Message Queue Integration

- RabbitMQ connection management
- Queue declaration and binding
- Publisher implementation
- Consumer implementation with acknowledgment
- Dead letter queue for failed messages

## Phase 10: Distributed Tracing

### 10.1 OpenTelemetry Setup

- Tracer configuration
- Automatic instrumentation
- Custom span creation
- Trace context propagation

### 10.2 Tracing Integration

- HTTP request tracing
- Database query tracing
- Message queue tracing
- Service-to-service call tracing

## Phase 11: Testing Strategy

### 11.1 Unit Tests

- Service layer tests
- Controller tests
- Utility function tests

### 11.2 Integration Tests

- API endpoint tests
- Database integration tests
- Message queue tests
- Service communication tests

### 11.3 E2E Tests

- Full workflow tests
- Docker Compose test environment

## Phase 12: Documentation

### 12.1 API Documentation

- OpenAPI/Swagger specification
- Endpoint documentation
- Authentication documentation

### 12.2 Deployment Documentation

- Docker setup guide
- Environment configuration
- Scaling guidelines

### 12.3 Development Documentation

- Local development setup
- Debugging guide
- Testing guide

## Implementation Order

1. **Week 1**: Project setup, infrastructure, shared components
2. **Week 2**: API Gateway, Auth Service, Users Service
3. **Week 3**: Orders Service, Payments Service, message queue
4. **Week 4**: Notifications Service, service discovery, tracing
5. **Week 5**: Testing, documentation, optimization
6. **Week 6**: CI/CD, monitoring, final polish

## Success Criteria

- All services start and communicate correctly
- Docker Compose setup works with single command
- API Gateway routes requests properly
- Authentication works across all services
- Message queue processes events reliably
- Distributed tracing captures request flows
- Health checks monitor service status
- Documentation is complete and accurate
- Tests pass with >80% coverage
