'use client'

// Logo di Caliumi Racing in alto a sinistra nello Studio
export function LogoStudio() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/caliumi-racing-logo.png" alt="Caliumi Racing" style={{ height: 28, width: 'auto', display: 'block' }} />
  )
}

export function IconaStudio() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/icon-192.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 4 }} />
  )
}
