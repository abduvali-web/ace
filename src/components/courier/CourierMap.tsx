'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet icon issue in Next.js
const icon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

interface CourierMapProps {
    destination: { lat: number; lng: number }
    currentLocation?: { lat: number; lng: number }
}

function MapUpdater({ center }: { center: [number, number] }) {
    const map = useMap()
    useEffect(() => {
        map.flyTo(center, 15)
    }, [center, map])
    return null
}

export default function CourierMap({ destination, currentLocation }: CourierMapProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    if (!isMounted) return <div className="h-full w-full bg-slate-100 animate-pulse rounded-lg" />

    const center: [number, number] = currentLocation
        ? [currentLocation.lat, currentLocation.lng]
        : [destination.lat, destination.lng]

    return (
        <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <Marker position={[destination.lat, destination.lng]} icon={icon}>
                <Popup>
                    Адрес доставки
                </Popup>
            </Marker>

            {currentLocation && (
                <Marker position={[currentLocation.lat, currentLocation.lng]} icon={icon}>
                    <Popup>
                        Ваше местоположение
                    </Popup>
                </Marker>
            )}

            <MapUpdater center={center} />
        </MapContainer>
    )
}
