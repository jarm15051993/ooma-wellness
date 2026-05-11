import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Ooma Wellness',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream px-6 py-16 font-sans">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <p className="text-xs tracking-[0.2em] uppercase text-mgray mb-3">Ooma Wellness</p>
        <h1 className="font-serif text-4xl text-ink mb-2">Privacy Policy</h1>
        <p className="text-xs text-mgray mb-12">Last updated: May 11, 2026</p>

        <div className="space-y-10 text-ink">

          <section>
            <h2 className="section-heading">1. Who We Are</h2>
            <p className="body-text">
              Ooma Wellness ("<strong>we</strong>", "<strong>us</strong>", "<strong>our</strong>") operates the Ooma Wellness mobile
              application and the website at oomawellness.shop. We are the data controller responsible for your personal data.
            </p>
            <p className="body-text mt-3">
              <strong>Contact:</strong>{' '}
              <a href="mailto:admin@oomawellness.shop" className="text-burg underline">
                admin@oomawellness.shop
              </a>
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">2. What Data We Collect</h2>
            <p className="body-text mb-4">We collect the following categories of personal data:</p>

            <div className="space-y-4">
              <div>
                <p className="label-text">Account Information</p>
                <p className="body-text">First name, last name, email address, phone number, date of birth, profile photo, and national identity document (DNI/NIE) where provided.</p>
              </div>
              <div>
                <p className="label-text">Health &amp; Fitness Information</p>
                <p className="body-text">Fitness goals and any medical conditions or physical considerations you choose to share with us during onboarding. Providing this information is entirely voluntary.</p>
              </div>
              <div>
                <p className="label-text">Booking &amp; Attendance Data</p>
                <p className="body-text">Records of classes booked, cancelled, and attended, including timestamps and class type.</p>
              </div>
              <div>
                <p className="label-text">Payment Information</p>
                <p className="body-text">Transaction amounts and dates. Payment card details are processed directly by Stripe and are never stored on our servers. See <a href="https://stripe.com/privacy" className="text-burg underline" target="_blank" rel="noopener noreferrer">Stripe's Privacy Policy</a>.</p>
              </div>
              <div>
                <p className="label-text">Technical Data</p>
                <p className="body-text">IP address, device type, operating system version, and standard server access logs collected automatically when you use the app or website.</p>
              </div>
            </div>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">3. How We Use Your Data</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-rule">
                  <th className="text-left py-2 pr-4 font-medium text-mgray text-xs tracking-widest uppercase">Purpose</th>
                  <th className="text-left py-2 font-medium text-mgray text-xs tracking-widest uppercase">Legal Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {[
                  ['Creating and managing your account', 'Contract performance'],
                  ['Processing class bookings and subscriptions', 'Contract performance'],
                  ['Processing payments via Stripe', 'Contract performance'],
                  ['Sending booking confirmations and reminders', 'Contract performance'],
                  ['Verifying identity for check-in (QR code)', 'Contract performance'],
                  ['Personalising your experience (goals, class type)', 'Legitimate interest'],
                  ['Preventing fraud and ensuring platform security', 'Legitimate interest'],
                  ['Complying with legal and tax obligations', 'Legal obligation'],
                ].map(([purpose, basis]) => (
                  <tr key={purpose}>
                    <td className="py-3 pr-4 text-ink">{purpose}</td>
                    <td className="py-3 text-mgray">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">4. Who We Share Your Data With</h2>
            <p className="body-text mb-4">We do not sell your personal data. We share it only with the following service providers, solely to operate the service:</p>
            <div className="space-y-3">
              {[
                ['Stripe', 'Payment processing', 'stripe.com/privacy'],
                ['Supabase', 'Database hosting (EU region)', 'supabase.com/privacy'],
                ['Vercel', 'Application hosting', 'vercel.com/legal/privacy-policy'],
                ['Expo / EAS', 'Mobile app distribution', 'expo.dev/privacy'],
              ].map(([name, role, url]) => (
                <div key={name} className="flex items-start gap-3">
                  <span className="text-mgray mt-0.5">—</span>
                  <p className="body-text">
                    <strong>{name}</strong> ({role}):{' '}
                    <a href={`https://${url}`} className="text-burg underline" target="_blank" rel="noopener noreferrer">
                      {url}
                    </a>
                  </p>
                </div>
              ))}
            </div>
            <p className="body-text mt-4">
              We may also disclose data when required by law or to protect the rights and safety of our users.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">5. Data Retention</h2>
            <p className="body-text">
              We retain your personal data for as long as your account is active. When you delete your account, your profile is
              immediately anonymised. Financial and transaction records are retained for 7 years to comply with Spanish tax law
              (Ley General Tributaria). Booking history is retained for 3 years for operational purposes.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">6. Your Rights (GDPR)</h2>
            <p className="body-text mb-4">
              If you are located in the European Economic Area, you have the following rights regarding your personal data:
            </p>
            <div className="space-y-2">
              {[
                ['Access', 'Request a copy of the data we hold about you.'],
                ['Rectification', 'Correct inaccurate or incomplete data directly in the app or by contacting us.'],
                ['Erasure', 'Delete your account and anonymise your personal data at any time from the Profile screen in the app.'],
                ['Restriction', 'Ask us to restrict processing of your data in certain circumstances.'],
                ['Portability', 'Receive your data in a structured, machine-readable format.'],
                ['Objection', 'Object to processing based on legitimate interest.'],
                ['Withdrawal of consent', 'Where processing is based on consent, withdraw it at any time without affecting prior processing.'],
              ].map(([right, desc]) => (
                <div key={right} className="flex gap-3">
                  <span className="text-mgray mt-0.5 shrink-0">—</span>
                  <p className="body-text"><strong>{right}:</strong> {desc}</p>
                </div>
              ))}
            </div>
            <p className="body-text mt-4">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:admin@oomawellness.shop" className="text-burg underline">
                admin@oomawellness.shop
              </a>. We will respond within 30 days. You also have the right to lodge a complaint with the Spanish Data
              Protection Agency (
              <a href="https://www.aepd.es" className="text-burg underline" target="_blank" rel="noopener noreferrer">
                aepd.es
              </a>).
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">7. Security</h2>
            <p className="body-text">
              We use industry-standard measures to protect your data, including encrypted connections (HTTPS/TLS), secure token
              authentication, and access controls limiting who can view personal information. No system is completely secure;
              if you believe your account has been compromised, contact us immediately.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">8. Children</h2>
            <p className="body-text">
              Our service is not directed to children under 16. We do not knowingly collect personal data from children.
              If you believe a child has provided us with personal data, please contact us so we can delete it.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">9. Changes to This Policy</h2>
            <p className="body-text">
              We may update this policy from time to time. When we do, we will update the date at the top of this page.
              For significant changes we will notify you via the app or email.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">10. Contact</h2>
            <p className="body-text">
              For any privacy-related questions or requests, please contact us at{' '}
              <a href="mailto:admin@oomawellness.shop" className="text-burg underline">
                admin@oomawellness.shop
              </a>.
            </p>
          </section>

        </div>

        <p className="text-xs text-mgray mt-16 pb-8">© {new Date().getFullYear()} Ooma Wellness. All rights reserved.</p>
      </div>

      <style>{`
        .section-heading {
          font-family: var(--font-montserrat), sans-serif;
          font-size: 0.65rem;
          font-weight: 500;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: var(--color-mgray);
          margin-bottom: 0.75rem;
        }
        .body-text {
          font-family: var(--font-montserrat), sans-serif;
          font-size: 0.875rem;
          line-height: 1.75;
          color: var(--color-ink);
        }
        .label-text {
          font-family: var(--font-montserrat), sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--color-ink);
          margin-bottom: 0.25rem;
        }
      `}</style>
    </main>
  )
}
