import { useEffect } from 'react'

const ADS_CLIENT = 'ca-pub-9402558370681469'
const ADS_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS_CLIENT}`

export function AdUnit({ className = '' }) {
  useEffect(() => {
    let script = document.querySelector(`script[src="${ADS_SCRIPT_SRC}"]`)
    if (!script) {
      script = document.createElement('script')
      script.async = true
      script.src = ADS_SCRIPT_SRC
      script.crossOrigin = 'anonymous'
      document.body.appendChild(script)
    }

    try {
      ;(window.adsbygoogle = window.adsbygoogle || []).push({})
    } catch {
      /* ignore */
    }
  }, [])

  return (
    <div className={`ads-container ${className}`.trim()}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADS_CLIENT}
        data-ad-slot="2021250604"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}