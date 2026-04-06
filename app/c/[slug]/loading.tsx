export default function CreatorLoading() {
  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="skeleton" style={{ height: 260, borderRadius: 12 }} />
          <div className="skeleton" style={{ height: 80, borderRadius: 12 }} />
        </div>
        <div className="skeleton" style={{ height: 440, borderRadius: 12 }} />
      </div>
    </div>
  );
}
