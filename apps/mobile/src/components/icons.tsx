import Svg, { Circle, Path, Rect } from 'react-native-svg'

interface IconProps {
  color: string
  size?: number
}

function base(size: number) {
  return { width: size, height: size, viewBox: '0 0 24 24' }
}

export function SearchIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={11} r={8} />
      <Path d="m21 21-4.3-4.3" />
    </Svg>
  )
}

export function BookmarkIcon({
  color,
  size = 16,
  filled,
}: IconProps & { filled?: boolean }) {
  return (
    <Svg
      {...base(size)}
      fill={filled ? 'currentColor' : 'none'}
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <Path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </Svg>
  )
}

export function CheckIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 6 9 17l-5-5" />
    </Svg>
  )
}

export function XIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 6 6 18" />
      <Path d="m6 6 12 12" />
    </Svg>
  )
}

export function ArrowLeftIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m12 19-7-7 7-7" />
      <Path d="M19 12H5" />
    </Svg>
  )
}

export function ArrowRightIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 12h14" />
      <Path d="m12 5 7 7-7 7" />
    </Svg>
  )
}

export function CircleIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
    </Svg>
  )
}

export function DownloadIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <Path d="m7 10 5 5 5-5" />
      <Path d="M12 15V3" />
    </Svg>
  )
}

export function GithubIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <Path d="M9 18c-4.51 2-5-2-7-2" />
    </Svg>
  )
}

export function MenuIcon({ color, size = 22 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 6h16" />
      <Path d="M4 12h16" />
      <Path d="M4 18h16" />
    </Svg>
  )
}

export function SunIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={4} />
      <Path d="M12 2v2" /><Path d="M12 20v2" /><Path d="m4.93 4.93 1.41 1.41" /><Path d="m17.66 17.66 1.41 1.41" /><Path d="M2 12h2" /><Path d="M20 12h2" /><Path d="m6.34 17.66-1.41 1.41" /><Path d="m19.07 4.93-1.41 1.41" />
    </Svg>
  )
}

export function MoonIcon({ color, size = 18 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Svg>
  )
}

export function BookOpenIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg {...base(size)} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 7v14" />
      <Path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </Svg>
  )
}

export function ChevronRightIcon({ color, size = 16 }: IconProps) {
  return (
    <Svg {...base(size)} fill="currentColor">
      <Path
        fillRule="evenodd"
        d="M7.21 14.77a.75.75 0 0 1 .02-1.06L11.168 10 7.23 6.29a.75.75 0 1 1 1.04-1.08l4.5 4.25a.75.75 0 0 1 0 1.08l-4.5 4.25a.75.75 0 0 1-1.06-.02Z"
        clipRule="evenodd"
      />
    </Svg>
  )
}

export function StarIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg {...base(size)} fill="currentColor" viewBox="0 0 24 24">
      <Path d="M11.48 3.5a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </Svg>
  )
}

export function RectIcon({ color, size = 14 }: IconProps) {
  return (
    <Svg {...base(size)} fill="currentColor">
      <Rect width={6} height={6} x={9} y={9} rx={1} />
    </Svg>
  )
}