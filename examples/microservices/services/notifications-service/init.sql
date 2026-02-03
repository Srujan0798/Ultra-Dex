-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  sent_at TIMESTAMP,
  read_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
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
CREATE TABLE IF NOT EXISTS notification_preferences (
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Insert default templates
INSERT INTO notification_templates (name, type, subject, body, variables) VALUES
('welcome_email', 'email', 'Welcome to Our Platform!', 
 'Hi {{name}}, welcome to our platform! We are excited to have you on board.', 
 '["name"]'),
('order_confirmation', 'email', 'Order #{{orderId}} Confirmation', 
 'Thank you for your order! Your order #{{orderId}} for {{amount}} has been received.', 
 '["orderId", "amount"]'),
('payment_success', 'email', 'Payment Successful', 
 'Your payment of {{amount}} has been processed successfully.', 
 '["amount"]'),
('payment_failed', 'email', 'Payment Failed', 
 'We were unable to process your payment. Please try again.', 
 '[]')
ON CONFLICT (name) DO NOTHING;
