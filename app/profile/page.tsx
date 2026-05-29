'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast, { Toaster } from 'react-hot-toast'
import QRCode from 'react-qr-code'
import { FieldRow, PencilIcon, ALLOWED_EXTENSIONS } from '@/app/components/ProfileFields'
import BottomNav from '@/app/components/BottomNav'
import { APP_TR, getLang, LOCALE } from '@/lib/app-translations'

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [totalCredits, setTotalCredits] = useState(0)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [pictureVersion, setPictureVersion] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading'>('idle')
  const [isDragging, setIsDragging] = useState(false)

  const [editingField, setEditingField] = useState<string | null>(null)
  const [fieldSaving, setFieldSaving] = useState(false)
  const [fieldError, setFieldError] = useState<string | null>(null)

  const [userGoalIds, setUserGoalIds] = useState<string[]>([])
  const [availableGoals, setAvailableGoals] = useState<{ id: string; label: string }[]>([])
  const [editingGoals, setEditingGoals] = useState(false)
  const [editGoalIds, setEditGoalIds] = useState<string[]>([])
  const [goalsSaving, setGoalsSaving] = useState(false)
  const [goalError, setGoalError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const lang = getLang(user)
  const tr = APP_TR[lang]
  const locale = LOCALE[lang]

  const handleFileUpload = useCallback(async (file: File) => {
    const pageTr = APP_TR[getLang(user)]
    const fileName = file.name.toLowerCase()
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))
    if (!hasValidExtension) {
      toast.error(pageTr.invalidFileType, { style: { background: '#F4F0E8', color: '#1C1A14', border: '1px solid #ef4444' } })
      return
    }
    setUploadStatus('uploading')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('userId', user.id)
    try {
      const response = await fetch('/api/user/profile-picture', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || pageTr.uploadFailed)
      setProfilePicture(data.profilePicture)
      setPictureVersion(v => v + 1)
      setUploadStatus('idle')
      const stored = localStorage.getItem('user')
      if (stored) {
        const updated = { ...JSON.parse(stored), profilePicture: data.profilePicture }
        localStorage.setItem('user', JSON.stringify(updated))
        setUser(updated)
      }
      toast.success(pageTr.profilePicUpdated, { style: { background: '#F4F0E8', color: '#1C1A14', border: '1px solid #22c55e' } })
    } catch (error: any) {
      setUploadStatus('idle')
      toast.error(error.message || pageTr.uploadFailed, { style: { background: '#F4F0E8', color: '#1C1A14', border: '1px solid #ef4444' } })
    }
  }, [user])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }, [handleFileUpload])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true) }
  const handleDragLeave = () => setIsDragging(false)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFileUpload(file)
  }

  useEffect(() => {
    const fetchUserData = async () => {
      const userData = localStorage.getItem('user')
      if (!userData) { router.push('/login'); return }
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      setProfilePicture(parsedUser.profilePicture || null)
      try {
        const creditsRes = await fetch(`/api/user/credits?userId=${parsedUser.id}`)
        const creditsData = await creditsRes.json()
        if (creditsRes.ok) setTotalCredits(creditsData.totalCredits || 0)
        await Promise.all([
          fetch(`/api/user/goals?userId=${parsedUser.id}`)
            .then(r => r.json())
            .then(d => { if (d.userGoalIds) setUserGoalIds(d.userGoalIds) }),
          fetch('/api/mobile/goals')
            .then(r => r.json())
            .then(d => { if (Array.isArray(d)) setAvailableGoals(d) }),
          fetch(`/api/user/qr?userId=${parsedUser.id}`)
            .then(r => r.json())
            .then(d => {
              if (d.qrCode && !parsedUser.qrCode) {
                const updated = { ...parsedUser, qrCode: d.qrCode }
                localStorage.setItem('user', JSON.stringify(updated))
                setUser(updated)
              }
            }),
        ])
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }
    fetchUserData()
    const handlePageShow = (e: PageTransitionEvent) => { if (e.persisted) fetchUserData() }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [router])

  const startEditField = (field: string) => { setEditingField(field); setFieldError(null) }
  const cancelEditField = () => { setEditingField(null); setFieldError(null) }

  const saveField = async (field: string, value: string) => {
    setFieldSaving(true)
    setFieldError(null)
    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, [field]: value }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || tr.updateFailed)
      const updated = { ...user, ...data.user }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setEditingField(null)
    } catch (error: any) {
      setFieldError(error.message || tr.updateFailed)
    } finally {
      setFieldSaving(false)
    }
  }

  const saveGoals = async () => {
    if (editGoalIds.length === 0) { setGoalError(tr.pleaseSelectGoal); return }
    setGoalsSaving(true)
    setGoalError(null)
    try {
      const response = await fetch('/api/user/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, goalIds: editGoalIds }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || tr.updateFailed)
      const goalsDisplay = availableGoals.filter(g => editGoalIds.includes(g.id)).map(g => g.label).join(', ')
      const updated = { ...user, goals: goalsDisplay }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
      setUserGoalIds(editGoalIds)
      setEditingGoals(false)
    } catch (error: any) {
      setGoalError(error.message || tr.updateFailed)
    } finally {
      setGoalsSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-burg border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return null

  const fieldRowShared = {
    fieldError, fieldSaving,
    onStartEdit: startEditField,
    onSave: saveField,
    onCancel: cancelEditField,
  }

  return (
    <div className="min-h-screen bg-cream px-8 pt-0 pb-20">
      <Toaster position="top-center" />
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="OOMA Wellness"
            className="h-[280px] w-auto -mt-[100px] -mb-[110px] -ml-[22px] sm:h-[560px] sm:-mt-[200px] sm:-mb-[220px] sm:-ml-[45px]"
            style={{ mixBlendMode: 'multiply', filter: 'brightness(0)' }}
          />
          <button onClick={handleLogout}
            className="px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm border border-rule text-mgray hover:border-burg hover:text-burg transition tracking-wide">
            {tr.logout}
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-warm-white p-6 border border-rule mb-6" style={{ borderTop: '2px solid #9C7A52' }}>
          <h2 className="text-4xl font-serif font-normal text-ink mb-6 tracking-wide">
            {tr.myProfileH2.pre}<em className="text-burg">{tr.myProfileH2.em}</em>
          </h2>

          <div className="flex flex-col sm:flex-row items-start gap-8 mb-6">
            <div className="flex-shrink-0">
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-48 h-48 rounded-full overflow-hidden cursor-pointer group border-2 transition-colors ${
                  isDragging ? 'border-burg' : 'border-rule hover:border-burg'
                }`}
              >
                <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.heic,.heif" className="hidden" onChange={handleFileChange} />
                {profilePicture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`/api/user/profile-picture?userId=${user?.id}&v=${pictureVersion}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-bone flex items-center justify-center">
                    <svg className="w-10 h-10 text-lgray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                )}
                <div className={`absolute inset-0 bg-ink/40 flex items-center justify-center transition-opacity ${uploadStatus === 'uploading' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                  {uploadStatus === 'uploading' ? (
                    <div className="w-5 h-5 border-2 border-warm-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg className="w-6 h-6 text-warm-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6 min-w-0 w-full">
              <FieldRow key={editingField === 'name' ? 'name-e' : 'name'} {...fieldRowShared} field="name" label={tr.firstName} display={<span className="break-words">{user.name}</span>} initialValue={user.name || ''} isEditing={editingField === 'name'} />
              <FieldRow key={editingField === 'lastName' ? 'lastName-e' : 'lastName'} {...fieldRowShared} field="lastName" label={tr.lastName} display={<span className="break-words">{user.lastName}</span>} initialValue={user.lastName || ''} isEditing={editingField === 'lastName'} />
              <FieldRow key={editingField === 'email' ? 'email-e' : 'email'} {...fieldRowShared} field="email" label={tr.email} display={<span className="break-all">{user.email}</span>} initialValue={user.email || ''} isEditing={editingField === 'email'} />
              <FieldRow key={editingField === 'phone' ? 'phone-e' : 'phone'} {...fieldRowShared} field="phone" label={tr.phone} display={<span className="break-words">{user.phone}</span>} initialValue={user.phone || ''} isEditing={editingField === 'phone'} />
              <FieldRow key={editingField === 'birthday' ? 'birthday-e' : 'birthday'} {...fieldRowShared} field="birthday" label={tr.birthday} display={user.birthday ? new Date(user.birthday).toLocaleDateString(locale, { timeZone: 'UTC' }) : '—'} initialValue={user.birthday || ''} isEditing={editingField === 'birthday'} />
              <div>
                <p className="text-xs font-medium text-mgray tracking-wider uppercase mb-1">{tr.classCredits}</p>
                <div className="flex items-center gap-2">
                  <span className="text-burg font-serif font-normal text-5xl">{totalCredits}</span>
                  <span className="text-mgray text-base">{tr.classRemaining(totalCredits)}</span>
                </div>
                {totalCredits === 0 && (
                  <p className="text-mgray text-sm mt-1">{tr.purchasePackage}</p>
                )}
                <button onClick={() => router.push('/packages')}
                  className="mt-3 px-6 py-2 bg-ink hover:bg-burg text-warm-white font-light transition tracking-wider text-sm uppercase">
                  {tr.buyMoreClasses}
                </button>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="border-t border-rule pt-6">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-xs font-medium text-mgray tracking-wider uppercase">{tr.goals}</p>
              {!editingGoals && (
                <button type="button" onClick={() => { setEditGoalIds(userGoalIds); setEditingGoals(true); setGoalError(null) }}
                  className="opacity-60 hover:opacity-100 text-mgray hover:text-burg transition-opacity" title="Edit goals">
                  <PencilIcon />
                </button>
              )}
            </div>
            {editingGoals ? (
              <div>
                {availableGoals.length === 0 ? (
                  <p className="text-mgray text-sm">{tr.loadingGoals}</p>
                ) : (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {availableGoals.map(goal => {
                      const selected = editGoalIds.includes(goal.id)
                      const disabled = !selected && editGoalIds.length >= 3
                      return (
                        <button key={goal.id} type="button"
                          onClick={() => {
                            if (selected) setEditGoalIds(ids => ids.filter(id => id !== goal.id))
                            else if (!disabled) setEditGoalIds(ids => [...ids, goal.id])
                            setGoalError(null)
                          }}
                          className={`px-3 py-1.5 border text-sm font-light tracking-wide transition ${
                            selected ? 'bg-burg border-burg text-warm-white'
                            : disabled ? 'border-rule text-lgray cursor-not-allowed opacity-50'
                            : 'border-rule text-ink hover:border-burg hover:text-burg'
                          }`}>
                          {tr.goalLabels[goal.label] ?? goal.label}
                        </button>
                      )
                    })}
                  </div>
                )}
                <p className="text-xs text-mgray mb-3">{tr.goalsHint(editGoalIds.length)}</p>
                {goalError && <p className="text-burg text-xs mb-2">{goalError}</p>}
                <div className="flex gap-2">
                  <button type="button" onClick={saveGoals} disabled={goalsSaving}
                    className="px-3 py-1 bg-burg hover:bg-burg-mid disabled:opacity-50 text-warm-white text-sm font-light transition tracking-wide">
                    {goalsSaving ? tr.saving : tr.save}
                  </button>
                  <button type="button" onClick={() => { setEditingGoals(false); setGoalError(null) }} disabled={goalsSaving}
                    className="px-3 py-1 bg-bone hover:bg-bone-dk text-ink text-sm transition">
                    {tr.cancel}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {userGoalIds.length > 0
                  ? availableGoals.filter(g => userGoalIds.includes(g.id)).map(g => (
                      <span key={g.id} className="px-3 py-1 bg-burg text-warm-white text-sm font-light tracking-wide">{tr.goalLabels[g.label] ?? g.label}</span>
                    ))
                  : <p className="text-ink text-base">{user.goals ?? '—'}</p>
                }
              </div>
            )}
          </div>
        </div>

        {/* QR Code */}
        {user.qrCode && (
          <div className="bg-warm-white p-6 border border-rule mb-6 flex flex-col items-center" style={{ borderTop: '2px solid #9C7A52' }}>
            <h2 className="text-2xl font-serif font-normal text-ink mb-2 tracking-wide self-start">
              {tr.myQrH2.pre}<em className="text-burg">{tr.myQrH2.em}</em>
            </h2>
            <p className="text-mgray text-sm mb-6 self-start">{tr.showAtStudio}</p>
            <div className="p-4 bg-white border border-rule">
              <QRCode value={user.qrCode} size={180} />
            </div>
          </div>
        )}

      </div>
      <BottomNav />
    </div>
  )
}
