const teams = [
  { name: 'Core Engineering', members: 12, role: 'Admin' },
  { name: 'Platform Ops', members: 8, role: 'Maintainer' },
  { name: 'Security Guild', members: 5, role: 'Viewer' },
];

export default function TeamsPage() {
  return (
    <section>
      <h2>Team Management</h2>
      <p>Invite members, assign roles, and manage access.</p>
      <div className="actions" style={{ margin: '16px 0' }}>
        <button className="button">Invite Member</button>
        <button className="button secondary">Configure SCIM</button>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Team</th>
            <th>Members</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {teams.map((team) => (
            <tr key={team.name}>
              <td>{team.name}</td>
              <td>{team.members}</td>
              <td>{team.role}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
