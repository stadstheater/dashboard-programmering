import { UsersThree } from '@phosphor-icons/react'
import SegmentAnalyse from '../components/SegmentAnalyse'
import { Paginakop } from '../components/ui'
import { useStore } from '../store/useStore'

export default function Doelgroepen() {
  const seizoen = useStore((s) => s.seizoen)
  return (
    <div>
      <Paginakop titel="Culturele doelgroepen" icoon={UsersThree} kleur="#0f9f84" sub={<>Hoe bereiken we de negen segmenten van het Cultureel Doelgroepenmodel in seizoen {seizoen}? Klik op een segment om het in de spotlight te zetten.</>} />
      <SegmentAnalyse soort="doelgroep" />
    </div>
  )
}
