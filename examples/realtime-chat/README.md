# Real-Time Chat Example

WebSocket-based chat application with presence, typing indicators, and file sharing using Ultra-Dex methodology.

## Overview

**Product:** Modern team chat like Slack but simpler - focused on developer teams.

**Tech Stack:**

- Frontend: Next.js 15 + Tailwind
- Backend: Node.js + Socket.io
- Database: PostgreSQL + Redis
- Auth: Clerk
- File Storage: S3-compatible
- Real-time: WebSocket + Redis Pub/Sub
- Deployment: Render

## Core Features

### MVP (Must Have)

- Real-time messaging with Socket.io
- Channel-based conversations
- Presence indicators (online/away/offline)
- Typing indicators
- File attachments (images, docs)
- Emoji reactions
- Message search

### Phase 2 (Nice to Have)

- Threaded replies
- Voice messages
- Screen sharing
- Webhooks / integrations
- Mobile app (React Native)

## Architecture

```
┌─────────────────────────────────────────┐
│           Client (Next.js)              │
│    React + Socket.io Client             │
└──────────────┬──────────────────────────┘
               │ WebSocket
┌──────────────▼──────────────────────────┐
│         Load Balancer                   │
│      (Sticky sessions for WS)           │
└───────┬──────────┬──────────────────────┘
        │          │
┌───────▼──┐ ┌────▼────┐
│  Server  │ │  Server │
│  Node 1  │ │ Node 2  │
└──────┬───┘ └────┬────┘
       │          │
       └────┬─────┘
            │ Redis Pub/Sub
┌───────────▼──────────────┐
│    PostgreSQL + Redis    │
│    (Messages + Cache)    │
└──────────────────────────┘
```

## Data Model

### Users

```sql
- id: UUID (Clerk)
- email: String
- name: String
- avatar: String
- status: ENUM (online, away, offline)
- last_seen: Timestamp
```

### Workspaces

```sql
- id: UUID
- name: String
- slug: String (unique)
- owner_id: UUID
- settings: JSON
```

### Channels

```sql
- id: UUID
- workspace_id: UUID
- name: String
- type: ENUM (public, private, dm)
- created_by: UUID
```

### Messages

```sql
- id: UUID
- channel_id: UUID
- user_id: UUID
- content: Text
- type: ENUM (text, file, system)
- file_url: String (nullable)
- parent_id: UUID (for threads, nullable)
- created_at: Timestamp
- edited_at: Timestamp (nullable)
```

### Reactions

```sql
- id: UUID
- message_id: UUID
- user_id: UUID
- emoji: String
```

## WebSocket Events

### Client → Server

```javascript
// Join channel
socket.emit('join_channel', { channelId: '...' });

// Send message
socket.emit('send_message', {
  channelId: '...',
  content: 'Hello world!',
  type: 'text',
});

// Typing indicator
socket.emit('typing', { channelId: '...' });

// Update presence
socket.emit('presence', { status: 'online' });
```

### Server → Client

```javascript
// New message
socket.on('new_message', (message) => {
  // Add to UI
});

// User typing
socket.on('user_typing', ({ userId, channelId }) => {
  // Show typing indicator
});

// Presence update
socket.on('presence_update', ({ userId, status }) => {
  // Update user status
});

// User joined
socket.on('user_joined', ({ userId, channelId }) => {
  // Show notification
});
```

## Implementation Phases

### Week 1: Foundation

**Day 1-2: Setup**

- [ ] Next.js project with TypeScript
- [ ] Clerk authentication setup
- [ ] Socket.io server setup
- [ ] PostgreSQL + Prisma schema
- [ ] Redis connection

**Day 3-4: Basic Chat**

- [ ] Channel list UI
- [ ] Message list component
- [ ] Send message form
- [ ] WebSocket connection
- [ ] Basic message events

**Day 5: Polish**

- [ ] Message styling (bubbles)
- [ ] Auto-scroll to bottom
- [ ] Timestamp formatting
- [ ] Error handling

### Week 2: Real-time Features

**Day 1-2: Presence**

- [ ] Online status tracking
- [ ] Presence indicator component
- [ ] "User is typing" indicator
- [ ] Last seen timestamp

**Day 3-4: Files**

- [ ] File upload component
- [ ] S3 integration (presigned URLs)
- [ ] Image previews
- [ ] File download

**Day 5: Reactions**

- [ ] Emoji picker
- [ ] Add/remove reactions
- [ ] Reaction count display

### Week 3: Scale & Search

**Day 1-2: Performance**

- [ ] Message pagination (infinite scroll)
- [ ] Virtual scrolling for large channels
- [ ] Connection resilience (reconnect)
- [ ] Message caching

**Day 3-4: Search**

- [ ] Search UI
- [ ] Full-text search (PostgreSQL)
- [ ] Filter by user/channel/date
- [ ] Jump to message

**Day 5: Admin**

- [ ] Workspace settings
- [ ] Channel management
- [ ] Member invites
- [ ] Permissions

### Week 4: Launch

- [ ] Responsive mobile design
- [ ] Notifications (browser + email)
- [ ] SEO for public channels
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation
- [ ] Deploy to Render

## Getting Started

```bash
# Clone
git clone https://github.com/Srujan0798/ultra-dex-examples.git
cd ultra-dex-examples/realtime-chat

# Install
npm install

# Environment
cp .env.example .env.local
# Add your Clerk, PostgreSQL, Redis, S3 keys

# Database
npx prisma migrate dev
npx prisma db seed

# Run
npm run dev
# Open http://localhost:3000
```

## Key Components

### ChatMessage

```typescript
interface ChatMessageProps {
  id: string;
  content: string;
  user: User;
  timestamp: Date;
  reactions: Reaction[];
  isMine: boolean;
  fileUrl?: string;
}
```

### useSocket Hook

```typescript
function useSocket() {
  const [connected, setConnected] = useState(false);
  const socket = useRef<Socket>();

  useEffect(() => {
    socket.current = io(process.env.NEXT_PUBLIC_SOCKET_URL);

    socket.current.on('connect', () => setConnected(true));
    socket.current.on('disconnect', () => setConnected(false));

    return () => {
      socket.current?.disconnect();
    };
  }, []);

  return { socket: socket.current, connected };
}
```

### TypingIndicator

```typescript
function TypingIndicator({ channelId }: { channelId: string }) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const { socket } = useSocket();

  useEffect(() => {
    socket?.on('user_typing', ({ userId, channelId: cid }) => {
      if (cid === channelId) {
        setTypingUsers(prev => [...prev, userId]);
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== userId));
        }, 3000);
      }
    });
  }, [socket, channelId]);

  if (typingUsers.length === 0) return null;

  return (
    <div className="text-sm text-gray-500 italic">
      {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
    </div>
  );
}
```

## Ultra-Dex Integration

```bash
# Generate implementation plan
npx ultra-dex init
npx ultra-dex generate "Real-time chat app for developers"

# Use LITE template for quick start
npx ultra-dex init --template lite

# Run agents
npx ultra-dex run backend "Setup Socket.io with Redis adapter"
npx ultra-dex run frontend "Build chat UI with Tailwind"
npx ultra-dex run database "Design PostgreSQL schema"

# Check alignment
npx ultra-dex align

# Deploy
npx ultra-dex deploy
```

## Scaling Considerations

**Horizontal Scaling:**

- Use Redis Pub/Sub for cross-server messaging
- Sticky sessions for WebSocket connections
- Separate API and WebSocket servers

**Database:**

- Partition messages by channel_id
- Archive old messages (S3)
- Read replicas for search

**Caching:**

- Redis for online status
- CDN for file assets
- Client-side caching for messages

## License

MIT
