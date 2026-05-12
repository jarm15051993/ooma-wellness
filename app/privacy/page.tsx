import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidad — Ooma Wellness',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-cream px-6 py-16 font-sans">
      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <p className="text-xs tracking-[0.2em] uppercase text-mgray mb-3">Ooma Wellness</p>
        <h1 className="font-serif text-4xl text-ink mb-2">Política de Privacidad</h1>
        <p className="text-xs text-mgray mb-12">Última actualización: 11 de mayo de 2026</p>

        <div className="space-y-10 text-ink">

          <section>
            <h2 className="section-heading">1. Responsable del tratamiento</h2>
            <p className="body-text">
              Ooma Wellness ("<strong>nosotros</strong>") es el responsable del tratamiento de los datos personales recogidos
              a través de la aplicación móvil Ooma Wellness y del sitio web oomawellness.shop.
            </p>
            <p className="body-text mt-3">
              <strong>Contacto:</strong>{' '}
              <a href="mailto:admin@oomawellness.shop" className="text-burg underline">
                admin@oomawellness.shop
              </a>
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">2. Datos que recogemos</h2>
            <p className="body-text mb-4">Recogemos las siguientes categorías de datos personales:</p>

            <div className="space-y-4">
              <div>
                <p className="label-text">Datos de cuenta</p>
                <p className="body-text">Nombre, apellidos, dirección de correo electrónico, número de teléfono, fecha de nacimiento, foto de perfil y documento de identidad (DNI/NIE) cuando se facilita.</p>
              </div>
              <div>
                <p className="label-text">Información de salud y bienestar</p>
                <p className="body-text">Objetivos de actividad física y condiciones médicas o consideraciones físicas que decidas compartir durante el proceso de registro. Facilitar esta información es completamente voluntario.</p>
              </div>
              <div>
                <p className="label-text">Datos de reservas y asistencia</p>
                <p className="body-text">Registro de clases reservadas, canceladas y asistidas, incluyendo fecha, hora y tipo de clase.</p>
              </div>
              <div>
                <p className="label-text">Datos de pago</p>
                <p className="body-text">Importes y fechas de transacciones. Los datos de tarjeta de crédito son procesados directamente por Stripe y nunca se almacenan en nuestros servidores. Consulta la <a href="https://stripe.com/es/privacy" className="text-burg underline" target="_blank" rel="noopener noreferrer">Política de Privacidad de Stripe</a>.</p>
              </div>
              <div>
                <p className="label-text">Datos técnicos</p>
                <p className="body-text">Dirección IP, tipo de dispositivo, versión del sistema operativo y registros de acceso estándar generados automáticamente al utilizar la app o el sitio web.</p>
              </div>
            </div>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">3. Finalidades y base jurídica</h2>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-rule">
                  <th className="text-left py-2 pr-4 font-medium text-mgray text-xs tracking-widest uppercase">Finalidad</th>
                  <th className="text-left py-2 font-medium text-mgray text-xs tracking-widest uppercase">Base jurídica</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {[
                  ['Crear y gestionar tu cuenta', 'Ejecución de contrato'],
                  ['Gestionar reservas y suscripciones', 'Ejecución de contrato'],
                  ['Procesar pagos a través de Stripe', 'Ejecución de contrato'],
                  ['Enviar confirmaciones y recordatorios de clases', 'Ejecución de contrato'],
                  ['Verificar identidad en el acceso (código QR)', 'Ejecución de contrato'],
                  ['Personalizar tu experiencia (objetivos, tipo de clase)', 'Interés legítimo'],
                  ['Prevenir fraudes y garantizar la seguridad', 'Interés legítimo'],
                  ['Cumplir obligaciones legales y fiscales', 'Obligación legal'],
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
            <h2 className="section-heading">4. Destinatarios de los datos</h2>
            <p className="body-text mb-4">No vendemos tus datos personales. Solo los compartimos con los siguientes proveedores de servicios, únicamente para el funcionamiento del servicio:</p>
            <div className="space-y-3">
              {[
                ['Stripe', 'Procesamiento de pagos', 'stripe.com/es/privacy'],
                ['Supabase', 'Alojamiento de base de datos (región UE)', 'supabase.com/privacy'],
                ['Vercel', 'Alojamiento de la aplicación', 'vercel.com/legal/privacy-policy'],
                ['Expo / EAS', 'Distribución de la app móvil', 'expo.dev/privacy'],
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
              También podremos facilitar datos cuando lo exija la ley o para proteger los derechos y la seguridad de nuestros usuarios.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">5. Plazos de conservación</h2>
            <p className="body-text">
              Conservamos tus datos personales mientras tu cuenta esté activa. Cuando eliminas tu cuenta, tus datos de perfil
              se anonimizan de inmediato. Los registros financieros y de transacciones se conservan durante 7 años en cumplimiento
              de la Ley General Tributaria. El historial de reservas se conserva durante 3 años con fines operativos.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">6. Tus derechos (RGPD)</h2>
            <p className="body-text mb-4">
              Si te encuentras en el Espacio Económico Europeo, tienes los siguientes derechos sobre tus datos personales:
            </p>
            <div className="space-y-2">
              {[
                ['Acceso', 'Solicitar una copia de los datos que conservamos sobre ti.'],
                ['Rectificación', 'Corregir datos inexactos o incompletos directamente en la app o contactándonos.'],
                ['Supresión', 'Eliminar tu cuenta y anonimizar tus datos personales en cualquier momento desde la pantalla de Perfil de la app.'],
                ['Limitación', 'Solicitar que restrinjamos el tratamiento de tus datos en determinadas circunstancias.'],
                ['Portabilidad', 'Recibir tus datos en un formato estructurado y legible por máquina.'],
                ['Oposición', 'Oponerte al tratamiento basado en interés legítimo.'],
                ['Retirada del consentimiento', 'Cuando el tratamiento se base en el consentimiento, retirarlo en cualquier momento sin que ello afecte al tratamiento previo.'],
              ].map(([right, desc]) => (
                <div key={right} className="flex gap-3">
                  <span className="text-mgray mt-0.5 shrink-0">—</span>
                  <p className="body-text"><strong>{right}:</strong> {desc}</p>
                </div>
              ))}
            </div>
            <p className="body-text mt-4">
              Para ejercer cualquiera de estos derechos, contáctanos en{' '}
              <a href="mailto:admin@oomawellness.shop" className="text-burg underline">
                admin@oomawellness.shop
              </a>. Responderemos en un plazo de 30 días. También tienes derecho a presentar una reclamación ante la Agencia
              Española de Protección de Datos (
              <a href="https://www.aepd.es" className="text-burg underline" target="_blank" rel="noopener noreferrer">
                aepd.es
              </a>).
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">7. Seguridad</h2>
            <p className="body-text">
              Aplicamos medidas de seguridad estándar del sector para proteger tus datos, incluyendo conexiones cifradas (HTTPS/TLS),
              autenticación segura mediante tokens y controles de acceso que limitan quién puede consultar la información personal.
              Ningún sistema es completamente seguro; si crees que tu cuenta ha sido comprometida, contáctanos de inmediato.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">8. Menores de edad</h2>
            <p className="body-text">
              Nuestro servicio no está dirigido a menores de 16 años. No recogemos conscientemente datos personales de menores.
              Si crees que un menor nos ha facilitado datos personales, contáctanos para que podamos eliminarlos.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">9. Cambios en esta política</h2>
            <p className="body-text">
              Podemos actualizar esta política periódicamente. Cuando lo hagamos, actualizaremos la fecha que figura al comienzo
              de esta página. Para cambios significativos te notificaremos a través de la app o por correo electrónico.
            </p>
          </section>

          <div className="border-t border-rule" />

          <section>
            <h2 className="section-heading">10. Contacto</h2>
            <p className="body-text">
              Para cualquier consulta o solicitud relacionada con la privacidad, contáctanos en{' '}
              <a href="mailto:admin@oomawellness.shop" className="text-burg underline">
                admin@oomawellness.shop
              </a>.
            </p>
          </section>

        </div>

        <p className="text-xs text-mgray mt-16 pb-8">© {new Date().getFullYear()} Ooma Wellness. Todos los derechos reservados.</p>
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
