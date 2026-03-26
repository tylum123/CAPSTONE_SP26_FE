"use client"

import { useEffect } from "react"
import type { LatLngExpression, LeafletMouseEvent } from "leaflet"
import { CircleMarker, MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet"

type FarmLocationPickerMapProps = {
  latitude: number | null
  longitude: number | null
  onSelectLocation: (latitude: number, longitude: number) => void
}

const DEFAULT_CENTER: LatLngExpression = [16.047079, 108.20623]
const DEFAULT_ZOOM = 6
const FOCUSED_ZOOM = 15

function MapViewport({ center, zoom }: { center: LatLngExpression; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView(center, zoom, { animate: true })
  }, [center, zoom, map])

  return null
}

function MapClickHandler({ onSelectLocation }: { onSelectLocation: (latitude: number, longitude: number) => void }) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onSelectLocation(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

export default function FarmLocationPickerMap({ latitude, longitude, onSelectLocation }: FarmLocationPickerMapProps) {
  const hasCoordinates = latitude !== null && longitude !== null
  const center: LatLngExpression = hasCoordinates ? [latitude, longitude] : DEFAULT_CENTER
  const zoom = hasCoordinates ? FOCUSED_ZOOM : DEFAULT_ZOOM

  return (
    <div className="overflow-hidden rounded-lg border">
      <MapContainer center={center} zoom={zoom} scrollWheelZoom className="h-[400px] w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport center={center} zoom={zoom} />
        <MapClickHandler onSelectLocation={onSelectLocation} />
        {hasCoordinates ? (
          <>
            <CircleMarker
              center={center}
              radius={10}
              pathOptions={{
                color: "#ffffff",
                weight: 3,
                fillColor: "#ef4444",
                fillOpacity: 1,
              }}
            />
            <CircleMarker
              center={center}
              radius={3}
              pathOptions={{
                color: "#ffffff",
                weight: 0,
                fillColor: "#ffffff",
                fillOpacity: 1,
              }}
            />
          </>
        ) : null}
      </MapContainer>
    </div>
  )
}