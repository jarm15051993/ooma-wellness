import Image from 'next/image'
import Link from 'next/link'

export default function EmailUpdatedPage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <Image
          src="/logo.png"
          alt="Ooma Wellness"
          width={120}
          height={48}
          style={{ objectFit: 'contain', marginBottom: 32 }}
        />

        <div style={styles.iconCircle}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#FAF7F2" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={styles.title}>Email Updated Successfully</h1>
        <p style={styles.body}>
          Your email address has been updated. You can now close this page and go back to the Ooma App.
        </p>

        <a href="ooma://email-updated" style={styles.button}>
          Back to Ooma
        </a>
      </div>
    </main>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#FAF7F2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    fontFamily: 'system-ui, sans-serif',
  },
  card: {
    backgroundColor: '#F4F0E8',
    border: '1px solid #DAD3C8',
    borderRadius: '4px',
    padding: '48px 40px',
    maxWidth: '420px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: '#9C7A52',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1C1A14',
    margin: '0 0 12px',
    lineHeight: '1.3',
  },
  body: {
    fontSize: '15px',
    color: '#8A8070',
    lineHeight: '1.6',
    margin: '0 0 32px',
  },
  button: {
    display: 'inline-block',
    backgroundColor: '#9C7A52',
    color: '#FAF7F2',
    textDecoration: 'none',
    padding: '14px 32px',
    borderRadius: '2px',
    fontSize: '12px',
    fontWeight: '500',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
}
