'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useAuth } from '@/components/providers/AuthProvider';
import { User, Key, Bell, Shield } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'providers' | 'notifications'>('profile');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'providers', label: 'Providers', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ] as const;

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Settings</h1>
        <p className="text-[var(--text-muted)]">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="lg:w-64 space-y-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[var(--radius-md)] text-left transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--primary-700)]/30'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card elevated>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Profile Settings
                </h3>
                <div className="space-y-4">
                  <Input label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
                  <Input
                    label="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'providers' && (
            <Card elevated>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">AI Providers</h3>
                <div className="space-y-4">
                  {['Claude', 'OpenAI', 'Gemini', 'NVIDIA'].map((provider) => (
                    <div
                      key={provider}
                      className="flex items-center justify-between p-4 bg-[var(--primary-700)]/30 rounded-[var(--radius-sm)]"
                    >
                      <div>
                        <h4 className="font-medium text-[var(--text-primary)]">{provider}</h4>
                        <p className="text-xs text-[var(--text-muted)]">API key configured</p>
                      </div>
                      <Button variant="secondary" size="sm">
                        Configure
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card elevated>
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Notification Preferences
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Email notifications', desc: 'Receive updates via email' },
                    { label: 'Run completions', desc: 'Get notified when runs complete' },
                    { label: 'Error alerts', desc: 'Alert on failed executions' },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-[var(--text-primary)]">{item.label}</h4>
                        <p className="text-xs text-[var(--text-muted)]">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 accent-[var(--accent-primary)]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
