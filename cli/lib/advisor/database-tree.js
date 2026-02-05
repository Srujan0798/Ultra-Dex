export const DATABASE_OPTIONS = [
  {
    useCase: 'ecommerce',
    recommendation: 'PostgreSQL',
    hosting: 'Neon',
    note: 'Transactional + relational data'
  },
  {
    useCase: 'cms',
    recommendation: 'MongoDB',
    hosting: 'Atlas',
    note: 'Flexible schema'
  },
  {
    useCase: 'saas',
    recommendation: 'PostgreSQL',
    hosting: 'Supabase',
    note: 'SaaS defaults with auth'
  },
  {
    useCase: 'analytics',
    recommendation: 'PostgreSQL + TimescaleDB',
    hosting: 'Railway',
    note: 'Time-series + SQL'
  }
];

export function recommendDatabase(useCase) {
  const normalized = useCase.toLowerCase();
  return DATABASE_OPTIONS.find((entry) => entry.useCase === normalized) || DATABASE_OPTIONS[0];
}
