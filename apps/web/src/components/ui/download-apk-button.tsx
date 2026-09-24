'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export const RELEASES_URL = 'https://github.com/Groghrus/fullstack-core/releases'

interface DownloadApkButtonProps {
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
  children?: React.ReactNode
}

export function DownloadApkButton({
  variant = 'default',
  size = 'default',
  className,
  children = 'Скачать APK',
}: DownloadApkButtonProps) {
  return (
    <Button asChild variant={variant} size={size} className={className}>
      <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
        <Download className="size-4 shrink-0" />
        <span>{children}</span>
      </a>
    </Button>
  )
}
