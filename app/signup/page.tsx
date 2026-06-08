'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import type { Lang } from '@/lib/app-translations'

const SIGNUP_TR: Record<Lang, {
  subtitle: string
  emailLabel: string
  continue: string
  sending: string
  alreadyMember: string
  logIn: string
  errorAlreadyRegistered: string
  errorNetwork: string
  errorGeneric: string
}> = {
  es: {
    subtitle: 'Crea tu cuenta',
    emailLabel: 'Correo electrónico',
    continue: 'Continuar',
    sending: 'Enviando enlace…',
    alreadyMember: '¿Ya eres miembro?',
    logIn: 'Iniciar sesión',
    errorAlreadyRegistered: 'Este correo ya está registrado',
    errorNetwork: 'Error de red. Inténtalo de nuevo.',
    errorGeneric: 'Algo ha salido mal. Inténtalo de nuevo.',
  },
  ca: {
    subtitle: 'Crea el teu compte',
    emailLabel: 'Correu electrònic',
    continue: 'Continua',
    sending: "Enviant l'enllaç…",
    alreadyMember: 'Ja ets membre?',
    logIn: 'Inicia sessió',
    errorAlreadyRegistered: 'Aquest correu ja està registrat',
    errorNetwork: 'Error de xarxa. Torna-ho a intentar.',
    errorGeneric: 'Alguna cosa ha anat malament. Torna-ho a intentar.',
  },
  en: {
    subtitle: 'Create your account',
    emailLabel: 'Email',
    continue: 'Continue',
    sending: 'Sending link…',
    alreadyMember: 'Already a member?',
    logIn: 'Log in',
    errorAlreadyRegistered: 'This email is already registered',
    errorNetwork: 'Network error. Please try again.',
    errorGeneric: 'Something went wrong. Please try again.',
  },
}

const LANGS: { code: Lang; label: string }[] = [
  { code: 'es', label: 'ES' },
  { code: 'ca', label: 'CAT' },
  { code: 'en', label: 'EN' },
]

function FlagIcon({ code }: { code: Lang }) {
  if (code === 'ca') {
    return (
      <svg viewBox="0 0 5 9" xmlns="http://www.w3.org/2000/svg" className="w-5 h-3.5 rounded-sm inline-block flex-shrink-0">
        <rect width="5" height="9" fill="#FCDD09" />
        <rect y="1" width="5" height="1" fill="#DA121A" />
        <rect y="3" width="5" height="1" fill="#DA121A" />
        <rect y="5" width="5" height="1" fill="#DA121A" />
        <rect y="7" width="5" height="1" fill="#DA121A" />
      </svg>
    )
  }
  return <span>{code === 'es' ? '🇪🇸' : '🇬🇧'}</span>
}

const toastStyle = (border: string) => ({
  background: '#F4F0E8',
  color: '#1C1A14',
  border: `1px solid ${border}`,
})

export default function SignupPage() {
  const router = useRouter()
  const [lang, setLang] = useState<Lang>('es')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const tr = SIGNUP_TR[lang]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await response.json()
      if (!response.ok) {
        const msg = (data.message ?? '').toLowerCase()
        const errText = msg.includes('already') || msg.includes('registrado') || msg.includes('registrat')
          ? tr.errorAlreadyRegistered
          : tr.errorGeneric
        toast.error(errText, { duration: 5000, style: toastStyle('#ef4444') })
        setLoading(false)
        return
      }
      router.push('/signup/success')
    } catch {
      toast.error(tr.errorNetwork, { duration: 4000, style: toastStyle('#ef4444') })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <Toaster position="top-center" />

      <div className="bg-warm-white rounded shadow-sm p-6 w-full max-w-md border border-rule">

        {/* Language switcher */}
        <div className="flex justify-center gap-2 mb-6">
          {LANGS.map(({ code, label }) => (
            <button
              key={code}
              type="button"
              onClick={() => setLang(code)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                lang === code
                  ? 'border-burg text-burg bg-burg/5'
                  : 'border-rule text-mgray hover:border-burg/50 hover:text-ink'
              }`}
            >
              <FlagIcon code={code} />
              <span className="tracking-wide uppercase">{label}</span>
            </button>
          ))}
        </div>

        <h1 className="text-3xl font-serif font-light text-center mb-2 text-burg tracking-wide">OOMA Wellness Club</h1>
        <p className="text-center text-mgray mb-8 text-sm tracking-wider uppercase">{tr.subtitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1 tracking-wide">{tr.emailLabel} *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 bg-warm-white border border-rule rounded focus:ring-2 focus:ring-burg focus:border-transparent text-ink placeholder-lgray"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink hover:bg-burg text-warm-white font-medium py-3 rounded-sm transition disabled:opacity-50 disabled:cursor-not-allowed tracking-wider text-sm uppercase"
          >
            {loading ? tr.sending : tr.continue}
          </button>
        </form>

        {/* Already a member — prominent section */}
        <div className="mt-5 pt-5 border-t border-rule">
          <p className="text-center text-mgray text-sm mb-3">{tr.alreadyMember}</p>
          <a
            href="/login"
            className="block w-full py-3 border border-ink hover:border-burg hover:text-burg text-ink text-center font-medium rounded-sm transition tracking-wider text-sm uppercase"
          >
            {tr.logIn}
          </a>
        </div>

      </div>
    </div>
  )
}
