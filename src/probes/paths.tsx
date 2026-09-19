import { createRoot } from 'react-dom/client'
import '../index.css'
import {
  DashedRule,
  WASHING_LINE_VIEWBOX,
  WashingLine,
  WindingPath,
  washingLinePegs,
  windingPathNodes,
  windingPathViewBox,
} from '../components/art/Paths'

const HAIR = 'rgb(185,185,185)'
const LABEL = 'rgb(70,70,70)'

function HangingRow({ count, width }: { count: number; width: number }) {
  const pegs = washingLinePegs(count)
  const lineHeight = (width * WASHING_LINE_VIEWBOX.height) / WASHING_LINE_VIEWBOX.width
  const photo = (width / count) * 0.86
  return (
    <div style={{ position: 'relative', width, height: lineHeight + photo * 1.05 }}>
      <WashingLine count={count} className="probe-svg" />
      {pegs.map((peg) => (
        <div
          key={peg.x}
          style={{
            position: 'absolute',
            left: peg.x * width - photo / 2,
            top: peg.y * lineHeight,
            width: photo,
            height: photo * 1.12,
            border: `1px solid ${HAIR}`,
          }}
        />
      ))}
    </div>
  )
}

function Winding({ stops, width }: { stops: number; width: number }) {
  const box = windingPathViewBox(stops)
  const height = (width * box.height) / box.width
  const nodes = windingPathNodes(stops)
  return (
    <div style={{ position: 'relative', width, height }}>
      <WindingPath stops={stops} className="probe-svg" />
      {nodes.map((node, i) => (
        <div
          key={node.y}
          style={{
            position: 'absolute',
            left: node.x * width + (node.x < 0.5 ? -80 : 14),
            top: node.y * height - 7,
            width: 66,
            fontSize: 10,
            letterSpacing: '0.08em',
            textAlign: node.x < 0.5 ? 'right' : 'left',
            color: LABEL,
          }}
        >
          STOP {i + 1}
        </div>
      ))}
    </div>
  )
}

/** The run-out and its doodle, magnified: the detail that is easiest to get wrong. */
function TailDetail({
  stops,
  zoom,
  width,
  from,
  box: boxHeight,
  below,
}: {
  stops: number
  zoom: number
  width: number
  from: number
  box: number
  below: number
}) {
  const view = windingPathViewBox(stops)
  const big = width * zoom
  const height = (big * view.height) / view.width
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: boxHeight,
        overflow: 'hidden',
        outline: `1px solid ${HAIR}`,
      }}
    >
      <div style={{ position: 'absolute', width: big, left: -big * from, top: -(height - below) }}>
        <WindingPath stops={stops} className="probe-svg" />
      </div>
    </div>
  )
}

/** The washing line magnified, to read the heart silhouette and the dash rhythm. */
function LineDetail({ width, zoom, from }: { width: number; zoom: number; from: number }) {
  const big = width * zoom
  const lineHeight = (big * WASHING_LINE_VIEWBOX.height) / WASHING_LINE_VIEWBOX.width
  return (
    <div
      style={{
        position: 'relative',
        width,
        height: 120,
        overflow: 'hidden',
        outline: `1px solid ${HAIR}`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: big,
          left: -big * from,
          top: 60 - lineHeight * 0.45,
        }}
      >
        <WashingLine count={4} className="probe-svg" />
      </div>
    </div>
  )
}

function Probe() {
  return (
    <div style={{ background: 'white', padding: 22, fontFamily: 'system-ui, sans-serif' }}>
      <style>{`.probe-svg { display: block; width: 100%; }`}</style>
      <HangingRow count={4} width={1040} />
      <div style={{ display: 'flex', gap: 40, marginTop: 18, alignItems: 'flex-start' }}>
        <Winding stops={6} width={290} />
        <Winding stops={9} width={290} />
        <div style={{ width: 380 }}>
          <DashedRule className="probe-svg" />
          <div style={{ height: 22 }} />
          <div style={{ width: 200 }}>
            <DashedRule className="probe-svg" />
          </div>
          <div style={{ height: 22 }} />
          <LineDetail width={380} zoom={5} from={0.0} />
          <div style={{ height: 22 }} />
          <TailDetail stops={3} zoom={3} width={380} from={0.52} box={150} below={125} />
          <div style={{ height: 22 }} />
          <TailDetail stops={3} zoom={8} width={380} from={0.662} box={330} below={305} />
          <div style={{ height: 22 }} />
          <HangingRow count={3} width={380} />
        </div>
      </div>
    </div>
  )
}

const host = document.getElementById('probe')
if (host) createRoot(host).render(<Probe />)
