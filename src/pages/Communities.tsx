import { useEffect, useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import L, { type LatLngTuple } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useSiteData, type Community } from '../context/SiteDataContext'
import { Facebook, Instagram, MapPin, Phone, Church } from 'lucide-react'

// Coordenadas aproximadas para as comunidades (baseadas nos endereços)
const communityCoordinates: Record<string, LatLngTuple> = {
  'Paróquia São João Bosco': [-19.0051327, -57.6676477],
  'Comunidade Nossa Senhora de Fátima': [-19.003, -57.63],
  'Comunidade Sagrado Coração de Jesus': [-19.01, -57.655],
  'Comunidade São Francisco de Assis': [-18.995, -57.68],
}

const createCustomIcon = () => {
  const iconMarkup = renderToStaticMarkup(
    <div style={{ 
      background: 'linear-gradient(135deg, #1f6feb, #66b2ff)',
      borderRadius: '50% 50% 50% 0',
      transform: 'rotate(-45deg)',
      width: '40px',
      height: '40px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      boxShadow: '0 4px 12px rgba(31, 111, 235, 0.4)',
      border: '3px solid white'
    }}>
      <Church 
        size={20} 
        color="white" 
        style={{ transform: 'rotate(45deg)' }}
      />
    </div>
  )

  return L.divIcon({
    html: iconMarkup,
    className: 'custom-marker-icon',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  })
}

export default function Communities() {
  const { communities, isLoading } = useSiteData()
  const mapRef = useRef<HTMLDivElement | null>(null)
  const leafletMap = useRef<L.Map | null>(null)
  const [selectedCommunity, setSelectedCommunity] = useState<Community | null>(null)

  const handleSelectCommunity = (community: Community) => {
    setSelectedCommunity(community)
    
    // Zoom no mapa para a comunidade selecionada
    if (leafletMap.current) {
      const coords: LatLngTuple | undefined = 
        community.latitude && community.longitude 
          ? [community.latitude, community.longitude] 
          : communityCoordinates[community.name]
      
      if (coords) {
        leafletMap.current.setView(coords, 15, {
          animate: true,
          duration: 1,
        })
      }
    }
  }

  useEffect(() => {
    if (!mapRef.current || leafletMap.current || communities.length === 0) return

    const map = L.map(mapRef.current, {
      center: [-19.00706698361968, -57.651763387259805],
      zoom: 13,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a> contributors',
    }).addTo(map)

    leafletMap.current = map

    return () => {
      map.remove()
      leafletMap.current = null
    }
  }, [communities.length])

  useEffect(() => {
    if (!leafletMap.current || communities.length === 0) return

    const customIcon = createCustomIcon()

    const markers = communities.map((community) => {
        // Prefer explicit community coordinates saved in DB; fallback to computed key
        const coords: import('leaflet').LatLngTuple | undefined = community.latitude && community.longitude ? [community.latitude, community.longitude] : communityCoordinates[community.name]
        if (!coords) return null

      const marker = L.marker(coords, { icon: customIcon })
        .addTo(leafletMap.current!)
        .bindPopup(`<strong>${community.name}</strong><br>${community.address}`)
        .on('click', () => {
          handleSelectCommunity(community)
        })
      return marker
    }).filter(Boolean)

    return () => {
      markers.forEach((marker) => marker?.remove())
    }
  }, [communities])

  if (isLoading) {
    return <div className="page-stack">Carregando comunidades...</div>
  }

  return (
    <div className="page-stack">
      <section className="page-card reveal-on-scroll">
        <p className="eyebrow">Igrejas</p>
        <h1>Nossas Igrejas</h1>
        <p>
          Conheça os locais de fé que formam nossa paróquia. Clique nos marcadores no mapa para ver detalhes de cada igreja.
        </p>
      </section>

      <section className="communities-layout reveal-on-scroll">
        <div ref={mapRef} className="communities-map" aria-label="Mapa das comunidades de Corumbá" />
        <aside className="communities-sidebar">
          {selectedCommunity ? (
            <div>
              {selectedCommunity.imageUrl && (
                <img 
                  src={selectedCommunity.imageUrl} 
                  alt={selectedCommunity.name}
                  style={{ 
                    width: '100%', 
                    height: '180px', 
                    objectFit: 'cover', 
                    borderRadius: '12px', 
                    marginBottom: '1rem'
                  }} 
                />
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <Church size={20} color="#66b2ff" />
                <h3 style={{ margin: 0 }}>{selectedCommunity.name}</h3>
                <span style={{ 
                  padding: '0.25rem 0.75rem', 
                  borderRadius: '999px', 
                  background: 'rgba(102, 178, 255, 0.2)',
                  color: '#66b2ff',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: '1px solid rgba(102, 178, 255, 0.3)'
                }}>{selectedCommunity.category}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#fff' }}>
                    <MapPin size={16} color="#66b2ff" />
                    <strong>Endereço</strong>
                  </p>
                  <p>{selectedCommunity.address}</p>
                </div>
                <div>
                  <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem', color: '#fff' }}>
                    <Phone size={16} color="#66b2ff" />
                    <strong>Telefone</strong>
                  </p>
                  <p>{selectedCommunity.phone}</p>
                </div>
                <div>
                  <p style={{ marginBottom: '0.25rem', color: '#fff' }}><strong>Horários de Missa</strong></p>
                  <p>{selectedCommunity.massSchedule}</p>
                </div>
                {selectedCommunity.parentId && (() => {
                  const parentChurch = communities.find(c => c.id === selectedCommunity.parentId);
                  return parentChurch ? (
                    <div>
                      <p style={{ marginBottom: '0.25rem', color: '#fff' }}><strong>Pertence a:</strong></p>
                      <button
                        onClick={() => handleSelectCommunity(parentChurch)}
                        style={{ 
                          padding: '0.5rem 0.75rem', 
                          borderRadius: '8px', 
                          background: 'rgba(102, 178, 255, 0.1)',
                          border: '1px solid rgba(102, 178, 255, 0.2)',
                          color: '#66b2ff',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '1rem'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.background = 'rgba(102, 178, 255, 0.2)';
                          e.currentTarget.style.borderColor = 'rgba(102, 178, 255, 0.4)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.background = 'rgba(102, 178, 255, 0.1)';
                          e.currentTarget.style.borderColor = 'rgba(102, 178, 255, 0.2)';
                        }}
                      >
                        <Church size={16} />
                        {parentChurch.name}
                      </button>
                    </div>
                  ) : null;
                })()}
                <div>
                  <p style={{ marginBottom: '0.25rem', color: '#fff' }}><strong>Pároco</strong></p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {selectedCommunity.priestPhotoUrl && (
                      <img 
                        src={selectedCommunity.priestPhotoUrl} 
                        alt={selectedCommunity.priestName}
                        style={{ 
                          width: '60px', 
                          height: '60px', 
                          objectFit: 'cover', 
                          borderRadius: '50%',
                          border: '2px solid #66b2ff'
                        }} 
                      />
                    )}
                    <p style={{ margin: 0 }}>{selectedCommunity.priestName}</p>
                  </div>
                </div>
                {(() => {
                  const childChurches = communities.filter(c => c.parentId === selectedCommunity.id);
                  return childChurches.length > 0 ? (
                    <div>
                      <p style={{ marginBottom: '0.5rem', color: '#fff' }}><strong>Igrejas vinculadas:</strong></p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {childChurches.map(child => (
                          <button
                            key={child.id}
                            onClick={() => handleSelectCommunity(child)}
                            style={{ 
                              padding: '0.5rem 0.75rem', 
                              borderRadius: '8px', 
                              background: 'rgba(102, 178, 255, 0.05)',
                              border: '1px solid rgba(102, 178, 255, 0.2)',
                              color: '#66b2ff',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              fontSize: '0.95rem',
                              textAlign: 'left'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.background = 'rgba(102, 178, 255, 0.15)';
                              e.currentTarget.style.borderColor = 'rgba(102, 178, 255, 0.3)';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.background = 'rgba(102, 178, 255, 0.05)';
                              e.currentTarget.style.borderColor = 'rgba(102, 178, 255, 0.2)';
                            }}
                          >
                            <Church size={14} />
                            <div>
                              <div>{child.name}</div>
                              <div style={{ fontSize: '0.8rem', color: '#a2d5ff' }}>{child.category}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedCommunity.instagramUrl && (
                    <a href={selectedCommunity.instagramUrl} target="_blank" rel="noopener noreferrer" 
                       style={{ color: '#66b2ff', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                      <Instagram size={18} /> Instagram
                    </a>
                  )}
                  {selectedCommunity.facebookUrl && (
                    <a href={selectedCommunity.facebookUrl} target="_blank" rel="noopener noreferrer"
                       style={{ color: '#66b2ff', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none' }}>
                      <Facebook size={18} /> Facebook
                    </a>
                  )}
                  {selectedCommunity.dioceseUrl && (
                    <a href={selectedCommunity.dioceseUrl} target="_blank" rel="noopener noreferrer"
                       style={{ color: '#66b2ff', display: 'flex', alignItems: 'center', gap: '0.25rem', textDecoration: 'none', fontWeight: 600 }}>
                      <Church size={18} /> Saiba mais
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <p className="hint" style={{ marginBottom: '1rem' }}>Clique em uma igreja para ver os detalhes.</p>
              <h4 style={{ color: '#fff', marginBottom: '0.5rem' }}>Igrejas disponíveis:</h4>
              <ul style={{ paddingLeft: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem', listStyle: 'none' }}>
                {communities.map(community => (
                  <li key={community.id}>
                    <button
                      onClick={() => handleSelectCommunity(community)}
                      style={{
                        background: community.isMain ? 'rgba(102, 178, 255, 0.1)' : 'rgba(102, 178, 255, 0.05)',
                        border: community.isMain ? '1px solid rgba(102, 178, 255, 0.3)' : '1px solid rgba(102, 178, 255, 0.2)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        color: '#fff',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = community.isMain ? 'rgba(102, 178, 255, 0.2)' : 'rgba(102, 178, 255, 0.15)'}
                      onMouseOut={(e) => e.currentTarget.style.background = community.isMain ? 'rgba(102, 178, 255, 0.1)' : 'rgba(102, 178, 255, 0.05)'}
                    >
                      <Church size={16} color={community.isMain ? '#66b2ff' : '#a2d5ff'} />
                      {community.isMain && <strong>{community.name}</strong>}
                      {!community.isMain && community.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </section>
    </div>
  )
}