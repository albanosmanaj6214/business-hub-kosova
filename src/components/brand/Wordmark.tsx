import Link from 'next/link'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const wordmark = cva(
  'inline-flex items-center font-serif font-semibold leading-none tracking-[-0.02em] select-none',
  {
    variants: {
      variant: {
        primary: 'text-[#1B4F72]',
        inverse: 'text-white',
        mono: 'text-current',
      },
      size: {
        sm: 'text-[16px] gap-[6px]',
        md: 'text-[22px] gap-[8px]',
        lg: 'text-[32px] gap-[10px]',
        xl: 'text-[44px] gap-[12px]',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

const rule = cva('shrink-0 self-stretch', {
  variants: {
    variant: {
      primary: 'bg-[#1B4F72]',
      inverse: 'bg-white',
      mono: 'bg-current',
    },
    size: {
      sm: 'w-[2px]',
      md: 'w-[3px]',
      lg: 'w-[3px]',
      xl: 'w-[4px]',
    },
  },
  defaultVariants: { variant: 'primary', size: 'md' },
})

type WordmarkProps = VariantProps<typeof wordmark> & {
  asLink?: boolean
  className?: string
}

export function Wordmark({ variant, size, asLink, className }: WordmarkProps) {
  const content = (
    <span className={cn(wordmark({ variant, size }), className)}>
      <span aria-hidden className={rule({ variant, size })} />
      <span>Kosova Business Hub</span>
    </span>
  )

  if (asLink) {
    return (
      <Link href="/" aria-label="Kosova Business Hub — kreu" className="inline-flex">
        {content}
      </Link>
    )
  }
  return content
}

export default Wordmark
