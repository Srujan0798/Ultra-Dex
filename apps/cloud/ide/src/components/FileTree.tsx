import { memo } from 'react';

const FILES = [
  {
    name: 'src',
    type: 'dir',
    children: [
      { name: 'components', type: 'dir' },
      { name: 'main.ts', type: 'file' },
      { name: 'App.tsx', type: 'file' },
    ],
  },
  { name: 'package.json', type: 'file' },
  { name: 'tsconfig.json', type: 'file' },
];

export const FileTree = memo(function FileTree() {
  return (
    <div className="panel" style={{ height: '100%', overflowY: 'auto' }}>
      <h3 style={{ borderBottom: '1px solid #334155', paddingBottom: '8px', fontSize: '14px' }}>
        Explorer
      </h3>
      <div style={{ marginTop: '12px' }}>
        {FILES.map((file, i) => (
          <div key={i} style={{ padding: '4px 0', fontSize: '14px', cursor: 'pointer' }}>
            {file.type === 'dir' ? '📁' : '📄'} {file.name}
            {file.children && (
              <div style={{ paddingLeft: '16px' }}>
                {file.children.map((child, j) => (
                  <div key={j} style={{ padding: '2px 0' }}>
                    {child.type === 'dir' ? '📁' : '📄'} {child.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
});
