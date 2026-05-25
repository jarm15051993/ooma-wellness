'use client'

import { useState, useRef, useEffect } from 'react'

export const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.heic', '.heif']

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MIN_YEAR = 1940
const MAX_YEAR = new Date().getFullYear()

function daysInMonth(month: number, year: number) {
  if (!month || !year) return 31
  return new Date(year, month, 0).getDate()
}

export function BirthdayPicker({ value, onChange, inputClass }: { value: string; onChange: (v: string) => void; inputClass: string }) {
  const parts = value ? value.split('-') : ['', '', '']
  const [year, setYear]   = useState(parts[0] || '')
  const [month, setMonth] = useState(parts[1] ? String(parseInt(parts[1])) : '')
  const [day, setDay]     = useState(parts[2] ? String(parseInt(parts[2])) : '')

  const maxDay = daysInMonth(parseInt(month), parseInt(year))

  const update = (y: string, m: string, d: string) => {
    setYear(y); setMonth(m); setDay(d)
    if (y && m && d) onChange(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`)
  }

  const selectClass = `${inputClass} appearance-none`

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

export const COUNTRY_CODES = [
  { code: '+1',   label: '+1 (US/Canada)',    flag: '🇺🇸' },
  { code: '+52',  label: '+52 (Mexico)',       flag: '🇲🇽' },
  { code: '+54',  label: '+54 (Argentina)',    flag: '🇦🇷' },
  { code: '+55',  label: '+55 (Brazil)',       flag: '🇧🇷' },
  { code: '+56',  label: '+56 (Chile)',        flag: '🇨🇱' },
  { code: '+57',  label: '+57 (Colombia)',     flag: '🇨🇴' },
  { code: '+51',  label: '+51 (Peru)',         flag: '🇵🇪' },
  { code: '+58',  label: '+58 (Venezuela)',    flag: '🇻🇪' },
  { code: '+593', label: '+593 (Ecuador)',     flag: '🇪🇨' },
  { code: '+595', label: '+595 (Paraguay)',    flag: '🇵🇾' },
  { code: '+598', label: '+598 (Uruguay)',     flag: '🇺🇾' },
  { code: '+507', label: '+507 (Panama)',      flag: '🇵🇦' },
  { code: '+506', label: '+506 (Costa Rica)',  flag: '🇨🇷' },
  { code: '+503', label: '+503 (El Salvador)', flag: '🇸🇻' },
  { code: '+502', label: '+502 (Guatemala)',   flag: '🇬🇹' },
  { code: '+504', label: '+504 (Honduras)',    flag: '🇭🇳' },
  { code: '+505', label: '+505 (Nicaragua)',   flag: '🇳🇮' },
  { code: '+53',  label: '+53 (Cuba)',         flag: '🇨🇺' },
  { code: '+44',  label: '+44 (UK)',           flag: '🇬🇧' },
  { code: '+34',  label: '+34 (Spain)',        flag: '🇪🇸' },
  { code: '+33',  label: '+33 (France)',       flag: '🇫🇷' },
  { code: '+49',  label: '+49 (Germany)',      flag: '🇩🇪' },
  { code: '+39',  label: '+39 (Italy)',        flag: '🇮🇹' },
  { code: '+61',  label: '+61 (Australia)',    flag: '🇦🇺' },
  { code: '+91',  label: '+91 (India)',        flag: '🇮🇳' },
  { code: '+81',  label: '+81 (Japan)',        flag: '🇯🇵' },
  { code: '+82',  label: '+82 (South Korea)',  flag: '🇰🇷' },
  { code: '+86',  label: '+86 (China)',        flag: '🇨🇳' },
]

export function parsePhone(phone: string): { code: string; number: string } {
  if (!phone) return { code: '+1', number: '' }
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length)
  for (const { code } of sorted) {
    if (phone.startsWith(code)) return { code, number: phone.slice(code.length) }
  }
  return { code: '+1', number: phone.replace(/\D/g, '') }
}

export const fieldInputClass = 'bg-warm-white border border-rule text-ink rounded px-3 py-1.5 text-base focus:outline-none focus:border-burg'

export function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a4 4 0 01-2.828 1.172H7v-2a4 4 0 011.172-2.828z" />
    </svg>
  )
}

export interface FieldRowProps {
  field: string
  label: string
  display: React.ReactNode
  initialValue: string
  isEditing: boolean
  fieldError: string | null
  fieldSaving: boolean
  onStartEdit: (field: string) => void
  onSave: (field: string, value: string) => void
  onCancel: () => void
}

export function FieldRow({
  field, label, display, initialValue,
  isEditing, fieldError, fieldSaving,
  onStartEdit, onSave, onCancel,
}: FieldRowProps) {
  const initPhone = field === 'phone' ? parsePhone(initialValue) : { code: '+1', number: '' }
  const initValue = (() => {
    if (field === 'birthday' && initialValue) {
      try { return new Date(initialValue).toISOString().split('T')[0] } catch { return '' }
    }
    return field === 'phone' ? '' : initialValue
  })()

  const [localValue, setLocalValue]           = useState(initValue)
  const [localPhoneCode, setLocalPhoneCode]   = useState(initPhone.code)
  const [localPhoneNumber, setLocalPhoneNumber] = useState(initPhone.number)

  const origRef        = useRef({ value: initValue, phoneCode: initPhone.code, phoneNumber: initPhone.number })
  const primaryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing) {
      const id = requestAnimationFrame(() => primaryInputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
  }, [isEditing])

  const hasChanged = isEditing
    ? field === 'phone'
      ? localPhoneCode !== origRef.current.phoneCode || localPhoneNumber !== origRef.current.phoneNumber
      : localValue !== origRef.current.value
    : false

  const handleSave = () => {
    const value = field === 'phone' ? `${localPhoneCode}${localPhoneNumber}` : localValue
    onSave(field, value)
  }

  const renderInput = () => {
    if (field === 'phone') {
      return (
        <div className="flex gap-2">
          <select value={localPhoneCode} onChange={e => setLocalPhoneCode(e.target.value)} className={`${fieldInputClass} flex-shrink-0`}>
            {COUNTRY_CODES.map(({ code, flag, label: lbl }) => (
              <option key={code} value={code}>{flag} {lbl}</option>
            ))}
          </select>
          <input ref={primaryInputRef} type="text" inputMode="numeric" value={localPhoneNumber}
            onChange={e => setLocalPhoneNumber(e.target.value.replace(/\D/g, ''))}
            onKeyDown={e => e.stopPropagation()}
            placeholder="1234567890" className={`${fieldInputClass} flex-1 min-w-0`}
            autoComplete="new-password" />
        </div>
      )
    }
    if (field === 'birthday') {
      return <BirthdayPicker value={localValue} onChange={setLocalValue} inputClass={fieldInputClass} />
    }
    return (
      <input
        ref={primaryInputRef}
        type={field === 'email' ? 'email' : 'text'}
        value={localValue}
        onChange={e => setLocalValue(e.target.value)}
        onKeyDown={e => e.stopPropagation()}
        className={fieldInputClass}
        autoComplete="new-password"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    )
  }

  return (
    <div className="group">
      <div className="flex items-center gap-1.5 mb-1">
        <label className="text-xs font-medium text-mgray tracking-wider uppercase">{label}</label>
        {!isEditing && (
          <button type="button" onClick={() => onStartEdit(field)}
            className="opacity-0 group-hover:opacity-100 text-lgray hover:text-burg transition-opacity"
            title={`Edit ${label}`}>
            <PencilIcon />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-2">
          {renderInput()}
          {fieldError && <p className="text-burg text-xs">{fieldError}</p>}
          <div className="flex gap-2">
            {hasChanged && (
              <button type="button" onClick={handleSave} disabled={fieldSaving}
                className="px-3 py-1 bg-burg hover:bg-burg-mid disabled:opacity-50 text-warm-white text-sm font-medium rounded-sm transition tracking-wide">
                {fieldSaving ? 'Saving…' : 'Save'}
              </button>
            )}
            <button type="button"
              onClick={() => { (document.activeElement as HTMLElement)?.blur(); onCancel() }}
              disabled={fieldSaving}
              className="px-3 py-1 bg-bone hover:bg-bone-dk text-ink text-sm rounded-sm transition">
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="text-ink text-base">{display}</p>
      )}
    </div>
  )
}
