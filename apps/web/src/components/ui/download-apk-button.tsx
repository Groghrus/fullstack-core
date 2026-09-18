'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <Button
      asChild
      variant={variant}
      size={size}
      className={className}
    >
      <a
        href="#download-apk"
        onClick={(e) => {
          e.preventDefault()
          alert(
            'Сборка APK мобильного приложения находится в разработке. Скоро будет доступна для скачивания!',
          )
        }}
      >
        <Download className="size-4 shrink-0" />
        <span>{children}</span>
      </a>
    </Button>
  )
}
