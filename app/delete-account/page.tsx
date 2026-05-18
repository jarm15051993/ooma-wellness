import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Eliminar cuenta — Ooma Wellness',
}

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-cream px-6 py-16 font-sans">
      <div className="mx-auto max-w-2xl">

        <p className="text-xs tracking-[0.2em] uppercase text-mgray mb-3">Ooma Wellness</p>
        <h1 className="font-serif text-4xl text-ink mb-2">Eliminar cuenta</h1>
        <p className="text-xs text-mgray mb-12">Account deletion / Eliminación de cuenta</p>

        <div className="space-y-10 text-ink">

          <section>
            <h2 className="text-xs tracking-[0.15em] uppercase text-mgray mb-4">Desde la aplicación</h2>
            <p className="text-sm leading-relaxed mb-4">
              Puedes eliminar tu cuenta directamente desde la app de OOMA Wellness:
            </p>
            <ol className="text-sm leading-relaxed space-y-2 list-decimal list-inside text-mgray">
              <li>Abre la app e inicia sesión</li>
              <li>Ve a <strong className="text-ink">Perfil</strong></li>
              <li>Desplázate hasta la sección <strong className="text-ink">Danger Zone</strong></li>
              <li>Pulsa <strong className="text-ink">Delete Account</strong> y confirma escribiendo DELETE</li>
            </ol>
            <p className="text-sm leading-relaxed mt-4 text-mgray">
              Al eliminar tu cuenta se cancelarán todas tus suscripciones activas, se cancelarán tus próximas reservas y se eliminarán todos tus datos personales de forma permanente.
            </p>
          </section>

          <div className="h-px bg-rule" />

          <section>
            <h2 className="text-xs tracking-[0.15em] uppercase text-mgray mb-4">Por correo electrónico</h2>
            <p className="text-sm leading-relaxed mb-4">
              Si no puedes acceder a la app, puedes solicitar la eliminación de tu cuenta enviando un correo a:
            </p>
            <a
              href="mailto:admin@oomawellness.shop?subject=Solicitud%20de%20eliminaci%C3%B3n%20de%20cuenta"
              className="text-sm font-medium text-ink underline underline-offset-4"
            >
              admin@oomawellness.shop
            </a>
            <p className="text-sm leading-relaxed mt-4 text-mgray">
              Indica el correo electrónico asociado a tu cuenta. Procesaremos tu solicitud en un plazo máximo de 30 días.
            </p>
          </section>

          <div className="h-px bg-rule" />

          <section>
            <h2 className="text-xs tracking-[0.15em] uppercase text-mgray mb-4">In English</h2>
            <p className="text-sm leading-relaxed mb-4">
              You can delete your account directly from the OOMA Wellness app under <strong>Profile → Danger Zone → Delete Account</strong>, or by emailing{' '}
              <a
                href="mailto:admin@oomawellness.shop?subject=Account%20deletion%20request"
                className="underline underline-offset-4"
              >
                admin@oomawellness.shop
              </a>.
            </p>
            <p className="text-sm leading-relaxed text-mgray">
              Deleting your account will permanently cancel all active subscriptions, cancel upcoming bookings, and remove all your personal data. Requests are processed within 30 days.
            </p>
          </section>

        </div>

        <p className="text-xs text-mgray mt-16">
          © 2026 OOMA Wellness Club · Tortosa
        </p>

      </div>
    </main>
  )
}
