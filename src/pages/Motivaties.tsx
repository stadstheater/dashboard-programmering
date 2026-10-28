import SegmentAnalyse from '../components/SegmentAnalyse'
import { Paginakop } from '../components/ui'
import { useStore } from '../store/useStore'

export default function Motivaties() {
  const seizoen = useStore((s) => s.seizoen)
  return (
    <div>
      <Paginakop titel="Bezoekersmotivaties" emoji="💡" sub={<>Waarom komt ons publiek? De drijfveren achter elk bezoek in seizoen {seizoen}, hun balans ten opzichte van het doel en wat er werkt.</>} />
      <SegmentAnalyse soort="motivatie" />
    </div>
  )
}
