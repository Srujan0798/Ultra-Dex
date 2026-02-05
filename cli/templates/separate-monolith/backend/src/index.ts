import express from 'express';
import { router as authRoutes } from './routes/auth.routes';
import { router as userRoutes } from './routes/users.routes';

const app = express();
app.use(express.json());
app.use('/auth', authRoutes);
app.use('/users', userRoutes);

app.listen(3001, () => {
  console.log('API running on http://localhost:3001');
});
