'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import { COUNTRY_CODES, PHONE_LENGTHS } from '@/lib/constants'
import { validateDNI } from '@/utils/validateDNI'

const toastStyle = (border: string) => ({
  background: '#F4F0E8',
  color: '#1C1A14',
  border: `1px solid ${border}`,
})

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MIN_YEAR = 1940
const MAX_YEAR = new Date().getFullYear()

function daysInMonth(month: number, year: number) {
  if (!month || !year) return 31
  return new Date(year, month, 0).getDate()
}

function BirthdayPicker({ value, onChange, className }: { value: string; onChange: (v: string) => void; className: string }) {
  const parts = value ? value.split('-') : ['', '', '']
  const [year, setYear] = useState(parts[0] || '')
  const [month, setMonth] = useState(parts[1] ? String(parseInt(parts[1])) : '')
  const [day, setDay] = useState(parts[2] ? String(parseInt(parts[2])) : '')

  const maxDay = daysInMonth(parseInt(month), parseInt(year))

  const update = (y: string, m: string, d: string) => {
    setYear(y); setMonth(m); setDay(d)
    if (y && m && d) {
      onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
    }
  }

  const selectClass = `${className} appearance-none`

  return (
    <div className="flex gap-2">
      <select value={month} onChange={e => update(year, e.target.value, day)} className={selectClass}>
        <option value="">Month</option>
        {MONTHS.map((m, i) => <option key={m} value={String(i + 1)}>{m}</option>)}
      </select>
      <select value={day} onChange={e => update(year, month, e.target.value)} className={selectClass}>
        <option value="">Day</option>
        {Array.from({ length: maxDay }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>{d}</option>)}
      </select>
      <select value={year} onChange={e => update(e.target.value, month, day)} className={selectClass}>
        <option value="">Year</option>
        {Array.from({ length: MAX_YEAR - MIN_YEAR + 1 }, (_, i) => MAX_YEAR - i).map(y => <option key={y} value={String(y)}>{y}</option>)}
      </select>
    </div>
  )
}

interface FormState {
  language: 'es' | 'en' | 'ca'
  password: string
  confirmPassword: string
  name: string
  lastName: string
  dni: string
  countryCode: string
  phone: string
  birthday: string
}

const CONDITIONS_EN = ['Pregnancy', 'Post-Surgery', 'Hernia', 'Chronic Condition'] as const

const TR = {
  en: {
    steps: ['Your language', 'Create your password', 'Yourself', 'How can we reach you?', 'What do you want to accomplish?', 'Health & Liability Disclaimer', 'Tell us about yourself'],
    password: 'Password', passwordHint: '8+ characters, one capital, one special character',
    confirmPassword: 'Confirm Password',
    firstName: 'First Name', lastName: 'Last Name', dni: 'DNI / NIE',
    phone: 'Phone Number',
    birthday: 'Birthday',
    conditions: 'Do you have any injuries or special conditions?',
    conditionsSelect: 'Select all that apply',
    conditionsList: ['Pregnancy', 'Post-Surgery', 'Hernia', 'Chronic Condition'],
    conditionOther: 'Other (specify)', conditionOtherPlaceholder: 'Please describe your condition…',
    goalsHint: (n: number) => `Select at least 1 and up to 3 goals (${n} selected)`,
    disclaimerScroll: '↓ Scroll to the bottom to continue',
    disclaimerAccept: 'I have read and accept the OOMA Wellness Club Health & Liability Disclaimer',
    back: 'Back', continue: 'Continue', letsGo: "Let's go!", saving: 'Saving…',
    welcome: 'Welcome to OOMA Wellness!',
    pwMin: 'Password must be at least 8 characters',
    pwCap: 'Password must contain at least one capital letter',
    pwSpec: 'Password must contain at least one special character',
    pwMatch: 'Passwords do not match',
    pwNoMatch: 'Passwords do not match',
    nameReq: 'First name is required', lastNameReq: 'Last name is required',
    dniReq: 'DNI/NIE is required', dniInvalid: 'Invalid DNI/NIE format (e.g. 12345678Z or X1234567L)',
    dniInvalidFmt: 'Invalid format — DNI: 8 digits + letter (e.g. 12345678Z) · NIE: X/Y/Z + 7 digits + letter',
    phoneReq: 'Phone number is required', phoneDigits: 'Only digits are allowed — no spaces, dashes, or symbols',
    phoneMustBe: (n: number) => `Phone must be exactly ${n} digits for`,
    phoneAtLeast: (n: number) => `Phone must be at least ${n} digits for`,
    goalReq: 'Please select at least one goal',
    birthdayReq: 'Birthday is required', conditionsReq: 'Please answer the health conditions question',
    conditionsSelectReq: 'Please select at least one condition', conditionOtherReq: 'Please describe your other condition',
    digitsOnly: 'Digits only, no spaces or dashes',
  },
  es: {
    steps: ['Tu idioma', 'Crea tu contraseña', 'Sobre ti', '¿Cómo contactarte?', '¿Qué quieres lograr?', 'Aviso de Salud y Responsabilidad', 'Cuéntanos más'],
    password: 'Contraseña', passwordHint: '8+ caracteres, una mayúscula, un carácter especial',
    confirmPassword: 'Confirmar contraseña',
    firstName: 'Nombre', lastName: 'Apellido', dni: 'DNI / NIE',
    phone: 'Número de teléfono',
    birthday: 'Fecha de nacimiento',
    conditions: '¿Tienes alguna lesión o condición especial?',
    conditionsSelect: 'Selecciona todas las que apliquen',
    conditionsList: ['Embarazo', 'Post-operatorio', 'Hernia', 'Condición crónica'],
    conditionOther: 'Otro (especificar)', conditionOtherPlaceholder: 'Describe tu condición…',
    goalsHint: (n: number) => `Selecciona entre 1 y 3 objetivos (${n} seleccionados)`,
    disclaimerScroll: '↓ Desplázate hasta el final para continuar',
    disclaimerAccept: 'He leído y acepto el Aviso de Salud y Responsabilidad de OOMA Wellness Club',
    back: 'Atrás', continue: 'Continuar', letsGo: '¡Vamos!', saving: 'Guardando…',
    welcome: '¡Bienvenido/a a OOMA Wellness!',
    pwMin: 'La contraseña debe tener al menos 8 caracteres',
    pwCap: 'La contraseña debe tener al menos una mayúscula',
    pwSpec: 'La contraseña debe tener al menos un carácter especial',
    pwMatch: 'Las contraseñas no coinciden',
    pwNoMatch: 'Las contraseñas no coinciden',
    nameReq: 'El nombre es obligatorio', lastNameReq: 'El apellido es obligatorio',
    dniReq: 'El DNI/NIE es obligatorio', dniInvalid: 'Formato de DNI/NIE inválido (ej. 12345678Z o X1234567L)',
    dniInvalidFmt: 'Formato inválido — DNI: 8 dígitos + letra (ej. 12345678Z) · NIE: X/Y/Z + 7 dígitos + letra',
    phoneReq: 'El teléfono es obligatorio', phoneDigits: 'Solo dígitos — sin espacios, guiones o símbolos',
    phoneMustBe: (n: number) => `El teléfono debe tener exactamente ${n} dígitos para`,
    phoneAtLeast: (n: number) => `El teléfono debe tener al menos ${n} dígitos para`,
    goalReq: 'Selecciona al menos un objetivo',
    birthdayReq: 'La fecha de nacimiento es obligatoria', conditionsReq: 'Por favor responde la pregunta de salud',
    conditionsSelectReq: 'Selecciona al menos una condición', conditionOtherReq: 'Describe tu otra condición',
    digitsOnly: 'Solo dígitos, sin espacios ni guiones',
  },
  ca: {
    steps: ['El teu idioma', 'Crea la teva contrasenya', 'Sobre tu', 'Com contactar-te?', 'Què vols aconseguir?', 'Avís de Salut i Responsabilitat', "Explica'ns més"],
    password: 'Contrasenya', passwordHint: '8+ caràcters, una majúscula, un caràcter especial',
    confirmPassword: 'Confirmar contrasenya',
    firstName: 'Nom', lastName: 'Cognom', dni: 'DNI / NIE',
    phone: 'Número de telèfon',
    birthday: 'Data de naixement',
    conditions: 'Tens alguna lesió o condició especial?',
    conditionsSelect: 'Selecciona totes les que apliquen',
    conditionsList: ['Embaràs', 'Post-operatori', 'Hèrnia', 'Condició crònica'],
    conditionOther: "Altra (especificar)", conditionOtherPlaceholder: 'Descriu la teva condició…',
    goalsHint: (n: number) => `Selecciona entre 1 i 3 objectius (${n} seleccionats)`,
    disclaimerScroll: "↓ Desplaça't fins al final per continuar",
    disclaimerAccept: "He llegit i accepto l'Avís de Salut i Responsabilitat d'OOMA Wellness Club",
    back: 'Enrere', continue: 'Continua', letsGo: 'Endavant!', saving: 'Guardant…',
    welcome: 'Benvingut/da a OOMA Wellness!',
    pwMin: 'La contrasenya ha de tenir almenys 8 caràcters',
    pwCap: 'La contrasenya ha de tenir almenys una majúscula',
    pwSpec: 'La contrasenya ha de tenir almenys un caràcter especial',
    pwMatch: 'Les contrasenyes no coincideixen',
    pwNoMatch: 'Les contrasenyes no coincideixen',
    nameReq: 'El nom és obligatori', lastNameReq: 'El cognom és obligatori',
    dniReq: 'El DNI/NIE és obligatori', dniInvalid: 'Format de DNI/NIE invàlid (p. ex. 12345678Z o X1234567L)',
    dniInvalidFmt: 'Format invàlid — DNI: 8 dígits + lletra (p. ex. 12345678Z) · NIE: X/Y/Z + 7 dígits + lletra',
    phoneReq: 'El telèfon és obligatori', phoneDigits: 'Només dígits — sense espais, guions o símbols',
    phoneMustBe: (n: number) => `El telèfon ha de tenir exactament ${n} dígits per a`,
    phoneAtLeast: (n: number) => `El telèfon ha de tenir almenys ${n} dígits per a`,
    goalReq: 'Selecciona almenys un objectiu',
    birthdayReq: 'La data de naixement és obligatòria', conditionsReq: 'Si us plau respon la pregunta de salut',
    conditionsSelectReq: 'Selecciona almenys una condició', conditionOtherReq: 'Descriu la teva altra condició',
    digitsOnly: 'Només dígits, sense espais ni guions',
  },
} as const

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams.get('userId')

  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [form, setForm] = useState<FormState>({
    language: 'es',
    password: '',
    confirmPassword: '',
    name: '',
    lastName: '',
    dni: '',
    countryCode: '+52',
    phone: '',
    birthday: '',
  })
  const [hasConditions, setHasConditions] = useState<boolean | null>(null)
  const [conditions, setConditions] = useState<string[]>([])
  const [conditionOther, setConditionOther] = useState('')

  // Goals state (step 3)
  const [selectedGoalIds, setSelectedGoalIds] = useState<string[]>([])
  const [availableGoals, setAvailableGoals] = useState<{ id: string; label: string }[]>([])

  // Disclaimer state (step 4)
  const [disclaimerScrolled, setDisclaimerScrolled] = useState(false)
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)

  const toggleCondition = (c: string) =>
    setConditions(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  useEffect(() => {
    if (!userId) {
      router.replace('/signup')
    }
  }, [userId, router])

  useEffect(() => {
    fetch('/api/mobile/goals')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setAvailableGoals(d) })
      .catch(() => {})
  }, [])

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const tr = TR[form.language]

  const handlePhoneInput = (value: string) => {
    if (!/^\d*$/.test(value)) {
      setPhoneError(tr.phoneDigits)
      return
    }
    setPhoneError('')
    const maxLen = PHONE_LENGTHS[form.countryCode]?.max ?? 15
    if (value.length > maxLen) return
    set('phone', value)
  }

  const handlePhoneBlur = () => {
    if (!form.phone.trim()) {
      setPhoneError(tr.phoneReq)
    } else {
      setPhoneError('')
    }
  }

  const validateStep = (): string | null => {
    // step 0: language — always valid
    if (step === 1) {
      if (form.password.length < 8) return tr.pwMin
      if (!/[A-Z]/.test(form.password)) return tr.pwCap
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) return tr.pwSpec
      if (form.password !== form.confirmPassword) return tr.pwMatch
    }
    if (step === 2) {
      if (!form.name.trim()) return tr.nameReq
      if (!form.lastName.trim()) return tr.lastNameReq
      if (!form.dni.trim()) return tr.dniReq
      if (!validateDNI(form.dni.trim())) return tr.dniInvalid
    }
    if (step === 3) {
      if (!form.phone.trim()) {
        setPhoneError(tr.phoneReq)
        return tr.phoneReq
      }
      if (!/^\d+$/.test(form.phone)) {
        setPhoneError(tr.phoneDigits)
        return tr.phoneDigits
      }
      const lengths = PHONE_LENGTHS[form.countryCode]
      if (lengths) {
        if (form.phone.length < lengths.min) {
          const msg = lengths.min === lengths.max
            ? `${tr.phoneMustBe(lengths.min)} ${form.countryCode}`
            : `${tr.phoneAtLeast(lengths.min)} ${form.countryCode}`
          setPhoneError(msg)
          return msg
        }
      }
    }
    if (step === 4) {
      if (selectedGoalIds.length === 0) return tr.goalReq
    }
    // step 5 (disclaimer) is handled separately in handleNext
    if (step === 6) {
      if (!form.birthday) return tr.birthdayReq
      if (hasConditions === null) return tr.conditionsReq
      if (hasConditions && conditions.length === 0) return tr.conditionsSelectReq
      if (hasConditions && conditions.includes('Other') && !conditionOther.trim()) return tr.conditionOtherReq
    }
    return null
  }

  const handleNext = async () => {
    const error = validateStep()
    if (error) {
      toast.error(error, { duration: 3000, style: toastStyle('#ef4444') })
      return
    }

    if (step === 2) {
      setLoading(true)
      try {
        const res = await fetch(`/api/user/check-dni?dni=${encodeURIComponent(form.dni.trim())}&excludeUserId=${userId}`)
        const data = await res.json()
        if (!data.available) {
          toast.error(data.message || 'Invalid DNI/NIE', { duration: 3000, style: toastStyle('#ef4444') })
          setLoading(false)
          return
        }
      } catch {
        // network error — let it pass; API will catch it at submit
      }
      setLoading(false)
    }

    if (step === 3) {
      const fullPhone = form.countryCode + form.phone
      try {
        const res = await fetch(`/api/user/check-phone?phone=${encodeURIComponent(fullPhone)}&excludeUserId=${userId}`)
        const data = await res.json()
        if (!data.available) {
          const msg = 'That phone number is already registered.'
          setPhoneError(msg)
          toast.error(msg, { duration: 3000, style: toastStyle('#ef4444') })
          return
        }
      } catch {
        // network error — let it pass; API will catch it at submit
      }
    }

    // Steps 0–4: just advance
    if (step < 5) {
      setStep(s => s + 1)
      return
    }

    // Step 5: disclaimer — call API then advance
    if (step === 5) {
      setLoading(true)
      try {
        await fetch('/api/user/accept-disclaimer', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, disclaimerVersion: 'v1' }),
        })
        setStep(6)
      } catch {
        toast.error('Network error. Please try again.', { duration: 4000, style: toastStyle('#ef4444') })
      } finally {
        setLoading(false)
      }
      return
    }

    // Step 6: final submit
    setLoading(true)
    try {
      const fullPhone = form.countryCode + form.phone
      const response = await fetch('/api/user/complete-onboarding', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          password: form.password,
          name: form.name.trim(),
          lastName: form.lastName.trim(),
          dni: form.dni.trim().toUpperCase(),
          phone: fullPhone,
          goalIds: selectedGoalIds,
          birthday: form.birthday,
          language: form.language,
          additionalInfo: (() => {
            if (!hasConditions) return null
            const parts = conditions.filter(c => c !== 'Other')
            if (conditions.includes('Other') && conditionOther.trim()) parts.push(`Other: ${conditionOther.trim()}`)
            return parts.join(', ') || null
          })(),
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        toast.error(data.message || 'Something went wrong', { duration: 4000, style: toastStyle('#ef4444') })
        setLoading(false)
        return
      }
      localStorage.setItem('user', JSON.stringify(data.user))
      toast.success(tr.welcome, { duration: 2000, style: toastStyle('#22c55e') })
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch {
      toast.error('Network error. Please try again.', { duration: 4000, style: toastStyle('#ef4444') })
      setLoading(false)
    }
  }

  const inputClass = (hasError = false) =>
    `w-full px-4 py-2 bg-warm-white border ${hasError ? 'border-burg' : 'border-rule'} rounded focus:ring-2 focus:ring-burg focus:border-transparent text-ink placeholder-lgray`

  const STEPS = tr.steps

  if (!userId) return null

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <Toaster position="top-center" />

      <div className="bg-warm-white rounded shadow-sm p-6 w-full max-w-md border border-rule">
        <h1 className="text-2xl font-serif font-light text-center text-burg mb-1 tracking-wide">OOMA Wellness Club</h1>

        {/* Progress dots */}
        <div className="flex justify-center gap-2 mt-4 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === step ? 'w-6 bg-burg' : i < step ? 'w-2 bg-burg/40' : 'w-2 bg-rule'
              }`}
            />
          ))}
        </div>

        <h2 className="text-lg font-serif font-light text-ink mb-6 text-center tracking-wide">{STEPS[step]}</h2>

        <div className="space-y-4">

          {step === 0 && (
            <div className="grid grid-cols-1 gap-3">
              {([
                { value: 'es', label: 'Español', flag: '🇪🇸' },
                { value: 'en', label: 'English',  flag: '🇬🇧' },
                { value: 'ca', label: 'Català',   flag: null },
              ] as const).map(lang => (
                <button
                  key={lang.value}
                  type="button"
                  onClick={() => set('language', lang.value)}
                  className={`flex items-center gap-4 px-5 py-4 rounded border text-left transition ${
                    form.language === lang.value
                      ? 'bg-burg border-burg text-warm-white'
                      : 'border-rule text-ink hover:border-burg hover:text-burg bg-warm-white'
                  }`}
                >
                  {lang.flag ? (
                    <span className="text-2xl">{lang.flag}</span>
                  ) : (
                    <svg width="28" height="20" viewBox="0 0 9 6" className="rounded-sm flex-shrink-0">
                      <rect width="9" height="6" fill="#FCDD09"/>
                      <rect y="0.667" width="9" height="0.889" fill="#DA121A"/>
                      <rect y="2.222" width="9" height="0.889" fill="#DA121A"/>
                      <rect y="3.778" width="9" height="0.889" fill="#DA121A"/>
                      <rect y="5.333" width="9" height="0.667" fill="#DA121A"/>
                    </svg>
                  )}
                  <span className="font-medium tracking-wide">{lang.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-ink mb-1 tracking-wide">{tr.password} *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass()} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lgray hover:text-burg transition"
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
                <p className="text-xs text-mgray mt-1">{tr.passwordHint}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1 tracking-wide">{tr.confirmPassword} *</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={e => set('confirmPassword', e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass(form.confirmPassword.length > 0 && form.password !== form.confirmPassword)} pr-10`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lgray hover:text-burg transition"
                  >
                    <EyeIcon open={showConfirmPassword} />
                  </button>
                </div>
                {form.confirmPassword.length > 0 && form.password !== form.confirmPassword && (
                  <p className="text-xs text-burg mt-1">{tr.pwNoMatch}</p>
                )}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-ink mb-1 tracking-wide">{tr.firstName} *</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Maria" className={inputClass()} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1 tracking-wide">{tr.lastName} *</label>
                <input type="text" value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="García" className={inputClass()} />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1 tracking-wide">{tr.dni} *</label>
                <input
                  type="text"
                  value={form.dni}
                  onChange={e => set('dni', e.target.value.toUpperCase())}
                  placeholder="12345678Z"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  className={inputClass(!!form.dni && !validateDNI(form.dni.trim()))}
                />
                {form.dni && !validateDNI(form.dni.trim()) && (
                  <p className="text-xs text-burg mt-1">{tr.dniInvalidFmt}</p>
                )}
              </div>
            </>
          )}

          {step === 3 && (
            <div>
              <label className="block text-sm font-medium text-ink mb-1 tracking-wide">{tr.phone} *</label>
              <div className="flex gap-2">
                <select
                  value={form.countryCode}
                  onChange={e => set('countryCode', e.target.value)}
                  className="px-3 py-2 bg-warm-white border border-rule rounded focus:ring-2 focus:ring-burg focus:border-transparent text-ink text-sm"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.label}</option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => handlePhoneInput(e.target.value)}
                  onBlur={handlePhoneBlur}
                  placeholder="1234567890"
                  className={`flex-1 ${inputClass(!!phoneError)}`}
                />
              </div>
              {phoneError ? (
                <p className="text-xs text-burg mt-1">{phoneError}</p>
              ) : (
                <p className="text-xs text-mgray mt-1">
                  {(() => {
                    const l = PHONE_LENGTHS[form.countryCode]
                    if (!l) return tr.digitsOnly
                    return l.min === l.max
                      ? `${l.min} digits required`
                      : `${l.min}–${l.max} digits required`
                  })()}
                </p>
              )}
            </div>
          )}

          {step === 4 && (
            <div>
              {availableGoals.length === 0 ? (
                <p className="text-mgray text-sm">Loading goals…</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {availableGoals.map(goal => {
                    const selected = selectedGoalIds.includes(goal.id)
                    const disabled = !selected && selectedGoalIds.length >= 3
                    return (
                      <button key={goal.id} type="button"
                        onClick={() => {
                          if (selected) setSelectedGoalIds(ids => ids.filter(id => id !== goal.id))
                          else if (!disabled) setSelectedGoalIds(ids => [...ids, goal.id])
                        }}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                          selected ? 'bg-burg border-burg text-warm-white'
                          : disabled ? 'border-rule text-lgray cursor-not-allowed opacity-50'
                          : 'border-rule text-ink hover:border-burg hover:text-burg'
                        }`}>
                        {goal.label}
                      </button>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-mgray mt-3">{tr.goalsHint(selectedGoalIds.length)}</p>
            </div>
          )}

          {step === 5 && (
            <div>
              <div
                className="h-64 overflow-y-auto border border-rule rounded p-4 bg-warm-white text-sm text-ink space-y-4 mb-4"
                onScroll={e => {
                  if (disclaimerScrolled) return
                  const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
                  if (scrollHeight - scrollTop - clientHeight <= 30) setDisclaimerScrolled(true)
                }}
              >
                <p className="font-semibold text-xs tracking-widest uppercase text-mgray">AVISO DE SALUD Y RESPONSABILIDAD — OOMA WELLNESS CLUB</p>
                <p className="text-xs text-mgray">Versión 1.0 · 2026 · Barcelona, Catalunya, España</p>
                <p className="text-xs text-mgray">Marco legal: RDL 1/2007 · Decret legislatiu 1/2000 · Última actualización: Marzo 2026</p>
                <p className="text-xs text-burg font-medium">Aviso importante: La aceptación de este documento es condición necesaria para participar en cualquier actividad de OOMA Wellness Club. Si tienes dudas sobre tu estado de salud, te recomendamos consultar con un profesional médico antes de comenzar.</p>
                {[
                  { n: '01', t: 'OBJETO Y ÁMBITO DE APLICACIÓN', body: 'El presente Aviso de Salud y Responsabilidad es emitido por OOMA Wellness Club, con domicilio en Barcelona, Catalunya, y es de aplicación obligatoria a todas las personas que accedan, participen o hagan uso de cualquiera de sus servicios, instalaciones, clases o actividades, ya sea de forma presencial o a través de su plataforma digital. Las actividades incluyen: Pilates Reformer (método STOTT), Yoga (Vinyasa, Yin y Restaurativo) y Power Flow (combinación de HIIT y Reformer). Este Aviso se rige por el Real Decreto Legislativo 1/2007, el Decret legislatiu 1/2000 de la Llei de l\'Esport de Catalunya, y el Codi Civil de Catalunya.' },
                  { n: '02', t: 'APTITUD FÍSICA Y ESTADO DE SALUD', body: 'Al participar en OOMA, el usuario declara que se encuentra en buen estado de salud general, que no ha sido aconsejado por un médico para abstenerse de realizar ejercicio físico, que comunicará al instructor cualquier condición médica conocida, que tiene 18 años cumplidos o cuenta con autorización de su tutor legal, y que practica las actividades de forma voluntaria con plena conciencia del esfuerzo físico que implican. OOMA recomienda una revisión médica previa especialmente si no se realiza ejercicio de forma regular, si se han superado los 40 años, o si existen antecedentes cardiovasculares o lesiones previas.' },
                  { n: '03', t: 'RIESGOS INHERENTES A LA ACTIVIDAD', body: 'La práctica de actividad física organizada conlleva riesgos inherentes: músculo-esqueléticos (contracturas, esguinces, desgarros), cardiovasculares (elevación de frecuencia cardíaca y presión arterial), fatiga y mareo, riesgos derivados del uso del Reformer y del equipamiento de Pilates, sobrecarga articular en posturas avanzadas de yoga y power flow, y agravamiento de condiciones preexistentes no comunicadas.' },
                  { n: '04', t: 'OBLIGACIONES DE OOMA', body: 'OOMA asume: supervisión por instructores certificados conforme a la Llei 3/2008, mantenimiento periódico del equipamiento, seguro de responsabilidad civil conforme al artículo 62.3 del Decret legislatiu 1/2000, ratio instructor-alumno adecuado, información de seguridad al inicio de cada sesión, actuación diligente ante incidencias, y sesión introductoria para nuevos miembros sobre el uso correcto del equipamiento.' },
                  { n: '05', t: 'ALCANCE Y LIMITACIÓN DE RESPONSABILIDAD', body: 'Conforme al artículo 86 del RDL 1/2007, la exoneración total de responsabilidad de OOMA no es jurídicamente posible. OOMA responde de lesiones causadas por mal estado del equipamiento, instrucciones negligentes del instructor, o ausencia de medidas de seguridad. OOMA no responde de lesiones derivadas del riesgo inherente a la actividad, del incumplimiento de indicaciones del instructor, de condiciones médicas ocultadas, del uso inadecuado fuera del horario de supervisión, ni de la pérdida de objetos personales no custodiados.' },
                  { n: '06', t: 'OBLIGACIONES DEL USUARIO', body: 'El usuario se compromete a comunicar cualquier lesión o condición médica al instructor, seguir las indicaciones técnicas y de seguridad, cesar en la actividad ante dolor agudo, mareo o dificultad respiratoria, usar correctamente el equipamiento según las instrucciones recibidas, acudir a las sesiones en condiciones físicas adecuadas, y mantener el orden, higiene y respeto hacia los demás practicantes e instructores.' },
                  { n: '07', t: 'MENORES DE EDAD Y COLECTIVOS CON NECESIDADES ESPECIALES', body: 'Las actividades de OOMA están dirigidas a personas mayores de 18 años. En caso excepcional de admisión de menores, será requisito la firma del tutor legal. Para colectivos con condiciones especiales (rehabilitación, embarazo, mayores de 65 años) se aplicará un protocolo de adaptación específico y se requerirá informe médico que autorice la práctica.' },
                  { n: '08', t: 'DATOS DE SALUD Y PROTECCIÓN DE DATOS', body: 'Los datos de salud comunicados a OOMA son datos especialmente protegidos conforme al RGPD (UE) 2016/679 y la LO 3/2018. Serán tratados exclusivamente para garantizar la seguridad del usuario durante la práctica, no serán cedidos a terceros sin consentimiento expreso y se conservarán únicamente durante la vigencia de la relación contractual. Para ejercer derechos de acceso, rectificación, supresión y portabilidad: privacidad@ooma.club' },
                  { n: '09', t: 'RESOLUCIÓN DE CONTROVERSIAS Y LEY APLICABLE', body: 'Cualquier controversia se someterá a la Junta Arbitral de Consum de Catalunya y a la OMIC del Ayuntamiento de Barcelona. Este Aviso se rige por el derecho español y catalán, con sumisión a los Juzgados y Tribunales de Barcelona. En caso de contradicción con las condiciones generales de contratación, prevalecerá la interpretación más favorable al usuario conforme al artículo 80 del RDL 1/2007. Consultas: legal@ooma.club' },
                ].map(s => (
                  <div key={s.n}>
                    <p className="font-semibold text-xs tracking-wider uppercase mb-1">{s.n} — {s.t}</p>
                    <p className="text-mgray text-xs leading-relaxed">{s.body}</p>
                  </div>
                ))}
                <p className="text-xs text-mgray pt-2 border-t border-rule">OOMA Wellness Club · Barcelona, Catalunya · Aviso de Salud y Responsabilidad · v1.0 · 2026</p>
              </div>
              {!disclaimerScrolled && (
                <p className="text-xs text-mgray mb-3 text-center">{tr.disclaimerScroll}</p>
              )}
              <label className={`flex items-start gap-3 cursor-pointer ${!disclaimerScrolled ? 'opacity-40 pointer-events-none' : ''}`}>
                <div
                  onClick={() => disclaimerScrolled && setDisclaimerChecked(v => !v)}
                  className={`mt-0.5 w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition ${
                    disclaimerChecked ? 'bg-burg border-burg' : 'border-rule hover:border-burg'
                  }`}
                >
                  {disclaimerChecked && (
                    <svg className="w-2.5 h-2.5 text-warm-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm text-mgray leading-snug" onClick={() => disclaimerScrolled && setDisclaimerChecked(v => !v)}>
                  {tr.disclaimerAccept}
                </span>
              </label>
            </div>
          )}

          {step === 6 && (
            <>
              <div>
                <label className="block text-sm font-medium text-ink mb-1 tracking-wide">{tr.birthday} *</label>
                <BirthdayPicker value={form.birthday} onChange={v => set('birthday', v)} className={inputClass()} />
              </div>

              <div>
                <p className="block text-sm font-medium text-ink mb-3 tracking-wide">{tr.conditions} *</p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setHasConditions(false)}
                    className={`flex-1 py-2.5 rounded-sm border font-medium text-sm tracking-wider uppercase transition ${
                      hasConditions === false
                        ? 'bg-ink text-warm-white border-ink'
                        : 'border-rule text-mgray hover:border-burg hover:text-burg'
                    }`}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => setHasConditions(true)}
                    className={`flex-1 py-2.5 rounded-sm border font-medium text-sm tracking-wider uppercase transition ${
                      hasConditions === true
                        ? 'bg-ink text-warm-white border-ink'
                        : 'border-rule text-mgray hover:border-burg hover:text-burg'
                    }`}
                  >
                    Yes
                  </button>
                </div>
              </div>

              {hasConditions === true && (
                <div>
                  <p className="text-xs font-medium text-mgray tracking-wider uppercase mb-3">{tr.conditionsSelect}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CONDITIONS_EN.map((c, idx) => {
                      const label = tr.conditionsList[idx]
                      const selected = conditions.includes(c)
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleCondition(c)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded border text-sm text-left transition ${
                            selected ? 'bg-burg border-burg text-warm-white' : 'border-rule text-ink hover:border-burg'
                          }`}
                        >
                          <span className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition ${
                            selected ? 'border-warm-white' : 'border-rule'
                          }`}>
                            {selected && (
                              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </span>
                          {label}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => toggleCondition('Other')}
                      className={`col-span-2 flex items-center gap-2.5 px-3 py-2.5 rounded border text-sm text-left transition ${
                        conditions.includes('Other') ? 'bg-burg border-burg text-warm-white' : 'border-rule text-ink hover:border-burg'
                      }`}
                    >
                      <span className={`w-4 h-4 flex-shrink-0 rounded border flex items-center justify-center transition ${
                        conditions.includes('Other') ? 'border-warm-white' : 'border-rule'
                      }`}>
                        {conditions.includes('Other') && (
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>
                      {tr.conditionOther}
                    </button>
                  </div>
                  {conditions.includes('Other') && (
                    <textarea
                      value={conditionOther}
                      onChange={e => setConditionOther(e.target.value)}
                      rows={2}
                      placeholder={tr.conditionOtherPlaceholder}
                      className="w-full mt-2 px-4 py-2 bg-warm-white border border-rule rounded focus:ring-2 focus:ring-burg focus:border-transparent text-ink placeholder-lgray resize-none text-sm"
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-3 border border-rule text-mgray font-medium rounded-sm hover:border-burg hover:text-burg transition tracking-wider text-sm uppercase"
            >
              {tr.back}
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            disabled={
              loading ||
              (step === 5 && (!disclaimerScrolled || !disclaimerChecked)) ||
              (step === 6 && (hasConditions === null || (hasConditions === true && conditions.length === 0)))
            }
            className="flex-1 bg-ink hover:bg-burg text-warm-white font-medium py-3 rounded-sm transition disabled:opacity-50 disabled:cursor-not-allowed tracking-wider text-sm uppercase"
          >
            {loading ? tr.saving : step === 6 ? tr.letsGo : tr.continue}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  )
}
