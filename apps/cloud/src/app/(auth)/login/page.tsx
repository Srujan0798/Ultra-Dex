'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/components/providers/AuthProvider';
import { Terminal, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card elevated className="p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 mb-4">
          <Terminal className="w-6 h-6 text-[var(--accent-primary)]" />
        </div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">Ultra-Dex</h1>
        <p className="text-sm text-[var(--text-muted)]">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-[2.3rem] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {error && <p className="text-sm text-[var(--error)]">{error}</p>}

        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="w-full">
          Sign In
        </Button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-[var(--text-muted)]">
          Don't have an account?{' '}
          <Link href="/signup" className="text-[var(--accent-primary)] hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </Card>
  );
}
