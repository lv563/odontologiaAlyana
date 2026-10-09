import type { SVGProps } from 'react'
import {
  IconBraces,
  IconClipboardCheck,
  IconImplant,
  IconSparkleTooth,
  IconStethoscope,
  IconSyringe,
  IconTooth,
} from './icons'

const ICON_BY_KEYWORD: [string, (props: SVGProps<SVGSVGElement>) => React.JSX.Element][] = [
  ['limpieza', IconClipboardCheck],
  ['orto', IconBraces],
  ['extrac', IconSyringe],
  ['resina', IconSparkleTooth],
  ['caries', IconSparkleTooth],
  ['consulta', IconStethoscope],
  ['valoraci', IconStethoscope],
  ['blanque', IconSparkleTooth],
  ['implant', IconImplant],
]

export function TreatmentIcon({ name, ...props }: { name: string } & SVGProps<SVGSVGElement>) {
  const lower = name.toLowerCase()
  const Icon = ICON_BY_KEYWORD.find(([keyword]) => lower.includes(keyword))?.[1] ?? IconTooth
  return <Icon {...props} />
}
