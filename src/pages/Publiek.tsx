import { Lightbulb, UsersThree } from '@phosphor-icons/react'
import { useState } from 'react'
import SegmentAnalyse from '../components/SegmentAnalyse'
import { Paginakop, Tabs } from '../components/ui'
import { useStore } from '../store/useStore'

export default function Publiek() {
  const seizoen = useStore((s) => s.seizoen)
  const [soort, setSoort] = useState<'doelgroep' | 'motivatie'>('doelgroep')
  return (
    <div>
      <Paginakop
        titel="Publiek"
        icoon={UsersThree}
        kleur="#0f9f84"
        sub={<>Wie komt er in seizoen {seizoen}, en waarom? Groen zit op of boven het doel, rood bereiken we te weinig.</>}
      >
        <Tabs
          uitleg="publiek-tabs"
          waarde={soort}
          onChange={setSoort}
          opties={[{ id: 'doelgroep', label: <><UsersThree size={16} /> Wie komt er?</> }, { id: 'motivatie', label: <><Lightbulb size={16} /> Waarom komen ze?</> }]}
        />
      </Paginakop>
      <SegmentAnalyse key={soort} soort={soort} />
    </div>
  )
}
