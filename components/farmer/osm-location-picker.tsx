"use client"

import { useEffect, useRef } from "react"
import L from "leaflet"

type OsmLocationPickerProps = {
  latitude: number | null
  longitude: number | null
  onPick: (latitude: number, longitude: number) => void
  className?: string
}

const DEFAULT_CENTER: [number, number] = [16.047079, 108.20623]
const DEFAULT_ZOOM = 6
const PICKED_ZOOM = 16

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

export function OsmLocationPicker({ latitude, longitude, onPick, className }: OsmLocationPickerProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const onPickRef = useRef(onPick)

  useEffect(() => {
    onPickRef.current = onPick
  }, [onPick])

  useEffect(() => {
    if (!mapElementRef.current || mapRef.current) {
      return
    }

    const initialCenter: [number, number] =
      latitude !== null && longitude !== null ? [latitude, longitude] : DEFAULT_CENTER

    const initialZoom = latitude !== null && longitude !== null ? PICKED_ZOOM : DEFAULT_ZOOM

    const map = L.map(mapElementRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      attributionControl: true,
    })

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    map.on("click", (event: L.LeafletMouseEvent) => {
      const pickedLatitude = Number(event.latlng.lat.toFixed(6))
      const pickedLongitude = Number(event.latlng.lng.toFixed(6))
      onPickRef.current(pickedLatitude, pickedLongitude)
    })

    mapRef.current = map

    return () => {
      map.off()
      map.remove()
      markerRef.current = null
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current

    if (!map || latitude === null || longitude === null) {
      return
    }

    const nextLatLng: L.LatLngExpression = [latitude, longitude]

    if (!markerRef.current) {
      markerRef.current = L.marker(nextLatLng, { icon: markerIcon }).addTo(map)
    } else {
      markerRef.current.setLatLng(nextLatLng)
    }

    map.setView(nextLatLng, PICKED_ZOOM)
  }, [latitude, longitude])

  return <div ref={mapElementRef} className={`w-full ${className ?? "h-64"}`} aria-label="Bản đồ chọn vị trí nông trại" />
}
