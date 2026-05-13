export default function HomePage() {
  return (
    <main style={{ padding: '4rem 2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>FORGE</h1>
      <p style={{ color: '#6b6b8a', fontSize: '1.1rem' }}>
        Backend API is running. Connect the frontend to get started.
      </p>
      <p style={{ color: '#6b6b8a', marginTop: '0.5rem', fontSize: '0.9rem' }}>
        API routes available at <code>/api/*</code>
      </p>
    </main>
  );
}
