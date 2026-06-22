// Forces the verify-email route to be dynamic so `useSearchParams()` in the
// client page doesn't bail static prerendering.
export const dynamic = 'force-dynamic'

export default function VerifyEmailLayout({ children }: { children: React.ReactNode }) {
  return children
}
