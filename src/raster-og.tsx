import { createRoot } from 'react-dom/client'
import './index.css'
import { Backdrop } from './components/Backdrop'
import { SealedEnvelope } from './components/art/Maroon'
import { WaxSeal } from './components/art/Metal'
import { FlowerPhoto } from './components/art/Flowers'

/**
 * The social preview: the envelope from the landing page, posy and seal, over
 * the same photograph, and no words at all.
 *
 * No words because one image serves every address, and the addresses name the
 * couple in different orders; the link's title carries the names instead. The
 * seal is left blank for the same reason, since its initials follow the order.
 */
function SocialPreview() {
  return (
    <>
      <Backdrop />
      <main className="og-scene">
        <span className="envelope-scene__paper og-scene__paper">
          <SealedEnvelope className="envelope-scene__envelope" />
          <WaxSeal monogram="" className="envelope-scene__seal" />
          <FlowerPhoto photo="standing-posy" eager className="envelope-scene__floral" />
        </span>
      </main>
    </>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')
createRoot(rootElement).render(<SocialPreview />)
