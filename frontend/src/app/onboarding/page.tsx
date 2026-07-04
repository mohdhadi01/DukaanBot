import { Suspense } from 'react'
import OnboardingWizard from './OnboardingWizard'

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <OnboardingWizard />
    </Suspense>
  )
}
