import { Lightbulb, UsersThree } from '@phosphor-icons/react'
import { useState } from 'react'
import SegmentAnalyse from '../components/SegmentAnalyse'
import { Paginakop, Tabs } from '../components/ui'
import { useStore } from '../store/useStore'

export default function Doelgroepen() {
  const seizoen = useStore((s) => s.seizoen)
  const eenvoudig = useStore((s) => s.modus) === 'eenvoudig'
  const [soort, setSoort] = useState<'doelgroep' | 'motivatie'>('doelgroep')
  return (
    <div>
      <Paginakop
        titel={eenvoudig ? 'Publiek' : 'Culturele doelgroepen'}
        icoon={UsersThree}
        kleur="#0f9f84"
        sub={
          eenvoudig
            ? <>Wie komt er naar ons theater in seizoen {seizoen}, en waarom? Groen is goed, rood betekent dat we die groep te weinig bereiken.</>
            : <>Hoe bereiken we de segmenten van het Cultureel Doelgroepenmodel in seizoen {seizoen}? Klik op een segment om het in de spotlight te zetten.</>
        }
      >
        {eenvoudig && (
          <Tabs
            uitleg="publiek-tabs"
            waarde={soort}
            onChange={setSoort}
            opties={[{ id: 'doelgroep', label: <><UsersThree size={16} /> Wie komt er?</> }, { id: 'motivatie', label: <><Lightbulb size={16} /> Waarom komen ze?</> }]}
          />
        )}
      </Paginakop>
      <SegmentAnalyse key={soort} soort={eenvoudig ? soort : 'doelgroep'} />
    </div>
  )
}
