'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { FolderKanban, Plus, Clock, FileCode } from 'lucide-react';

const MOCK_PROJECTS = [
  {
    id: '1',
    name: 'Ultra-Dex Core',
    description: 'Main orchestration platform',
    lastModified: '2026-04-13T10:30:00Z',
    files: 156,
  },
  {
    id: '2',
    name: 'API Gateway',
    description: 'REST API and WebSocket gateway',
    lastModified: '2026-04-12T15:20:00Z',
    files: 42,
  },
  {
    id: '3',
    name: 'Dashboard UI',
    description: 'Frontend dashboard application',
    lastModified: '2026-04-11T09:15:00Z',
    files: 89,
  },
];

export default function ProjectsPage() {
  const [projects] = useState(MOCK_PROJECTS);

  return (
    <div className="space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Projects</h1>
          <p className="text-[var(--text-muted)]">Manage your Ultra-Dex projects</p>
        </div>
        <Button icon={<Plus className="w-4 h-4" />}>New Project</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <Card key={project.id} elevated interactive className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--accent-primary)]/10 flex items-center justify-center">
                <FolderKanban className="w-5 h-5 text-[var(--accent-primary)]" />
              </div>
              <span className="text-xs text-[var(--text-muted)]">
                {new Date(project.lastModified).toLocaleDateString()}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
              {project.name}
            </h3>
            <p className="text-sm text-[var(--text-muted)] mb-4">{project.description}</p>
            <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <FileCode className="w-3 h-3" />
                {project.files} files
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Modified recently
              </span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
