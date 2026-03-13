import { ref, onMounted, onUnmounted } from 'vue'
import * as L from 'leaflet'
import type { Ouvrage, TypeConfig, ZoneFeature, ProvinceFeature } from '@/types'

// Extend Leaflet types
declare module 'leaflet' {
  interface Layer {
    feature?: any
    bindPopup?(content: string): any
    openPopup?(): any
    setStyle?(style: any): any
    bringToFront?(): any
  }
}

export function useMap() {
  const map = ref<L.Map | null>(null)
  const provinceLayer = ref<L.LayerGroup>(L.layerGroup())
  const zoneLayer = ref<L.LayerGroup>(L.layerGroup())
  const zoneLabelLayer = ref<L.LayerGroup>(L.layerGroup())
  const projectLayer = ref<L.LayerGroup>(L.layerGroup())
  const provinceLabelLayer = ref<L.LayerGroup>(L.layerGroup())
  const filteredOuvrages = ref<Ouvrage[]>([]) // Ouvrages filtrés

  // Dans useMap.ts, modifier les états
  const provinceVisualFilter = ref<string[]>([]) // Pour filtrer l'affichage des provinces sur la carte
  const provinceOuvrageFilter = ref<string[]>([]) // Pour filtrer les ouvrages

  // Nouveaux états pour le chargement dynamique des zones
  const zonesLoading = ref(false)
  const zonesError = ref<string | null>(null)
  const currentProvinceZones = ref<string | null>(null)

  const zonesData = ref<any>(null)
  const provincesGeoJSON = ref<L.GeoJSON | null>(null)
  const allOuvrages = ref<Ouvrage[]>([])
  const markersMap = ref<Map<string | number, L.Marker>>(new Map())

  const typeConfig: Record<string, TypeConfig> = {
    "DISTRIBUTION": { icon: "🚚", color: "#2563eb", label: "Distribution" },
    "INCIDENT": { icon: "🚨", color: "#dc2626", label: "Incident" },
    "CONSTRUCTION": { icon: "🚧", color: "#16a34a", label: "Construction" },
    "ECOLE": { icon: "🎓", color: "#9333ea", label: "École" },
    "CENTRE DE SANTE": { icon: "🏥", color: "#f59e0b", label: "Centre de Santé" },
    "BATIMENT ADMINISTRATIF": { icon: "⚖️", color: "#0891b2", label: "Bâtiment Administratif" }
  }

  const activeTypes = ref<Set<string>>(new Set(Object.keys(typeConfig)))
  const showProvinces = ref(true)
  const showZones = ref(true)
  const selectedProvince = ref<string | null>(null)
  const selectedOuvrage = ref<Ouvrage | null>(null)
  const provinceFilter = ref<string[]>([])

  const baseMaps = {
    "Carto Light": L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; Carto'
    }),
    "OpenStreetMap": L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }),
    "Satellite (Esri)": L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri'
    }),
    "Topographic": L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: 'Map data: &copy; OpenTopoMap'
    }),
  
    "Carto Dark": L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; Carto'
    })
  }

  const getProvinceName = (feature: any): string => {
    return feature.properties?.name ||
      feature.properties?.NAME_1 ||
      feature.properties?.province ||
      feature.properties?.nom ||
      feature.properties?.ADM1_EN ||
      'Province inconnue'
  }

  const getZoneName = (feature: any): string => {
    return feature.properties?.name ||
      feature.properties?.Nom ||
      feature.properties?.zone ||
      feature.properties?.ADM2_EN ||
      "Zone de santé"
  }

  const colorFromName = (name: string): string => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const hue = Math.abs(hash) % 360
    return `hsl(${hue},70%,55%)`
  }

  const getMarkerStyle = (type?: string): TypeConfig => {
    const typeUpper = type?.toUpperCase() || ""
    return typeConfig[typeUpper] || { color: "#333", icon: "📌", label: "Autre" }
  }

  const getZonesByProvince = (province: string): string[] => {
    if (!zonesData.value) return []

    return zonesData.value.features
      .filter((f: ZoneFeature) => {
        const p = f.properties?.province ||
          f.properties?.Province ||
          f.properties?.ADM1_EN ||
          f.properties?.province_name
        return p === province
      })
      .map((f: ZoneFeature) => getZoneName(f))
  }

  const provinceStyle = (feature: any) => ({
    color: "#1e293b",
    weight: 3,
    fillColor: colorFromName(getProvinceName(feature)),
    fillOpacity: 0.25
  })

  const zoneStyle = () => ({
    color: "#065f46",
    weight: 1.2,
    fill: false,
    fillOpacity: 0
  })

  const initMap = (elementId: string) => {
    map.value = L.map(elementId).setView([-4, 22], 5)

    // Add default base layer
    baseMaps["Carto Light"].addTo(map.value)

    // Add layer control
    L.control.layers(baseMaps).addTo(map.value)

    // Add layers to map
    provinceLayer.value.addTo(map.value)
    projectLayer.value.addTo(map.value)
    provinceLabelLayer.value.addTo(map.value)

    // Setup event handlers
    setupMapEventHandlers()
  }

  const highlightFeature = (e: L.LeafletEvent) => {
    const layer = e.target as L.Layer & { feature?: any; setStyle?: any; bringToFront?: any }
    const name = getProvinceName(layer.feature)

    layer.setStyle?.({
      weight: 4,
      color: '#0f172a',
      fillOpacity: 0.6
    })

    layer.bringToFront?.()
    selectedProvince.value = name
  }

  const resetHighlight = (e: L.LeafletEvent) => {
    const layer = e.target as L.Layer & { feature?: any }
    if (provincesGeoJSON.value) {
      provincesGeoJSON.value.resetStyle(layer)
    }
    selectedProvince.value = null
  }

  const zoomToFeature = async (e: L.LeafletEvent) => {
    const layer = e.target as L.Layer & { feature?: any; getBounds?: any }
    if (!map.value || !layer.getBounds) return

    const provinceName = getProvinceName(layer.feature)
    map.value.fitBounds(layer.getBounds(), { padding: [20, 20] })

    selectedProvince.value = provinceName

    // Charger les zones pour cette province si elles doivent être affichées
    if (showZones.value) {
      await loadZonesForProvince(provinceName)
    }
  }

  const onEachProvince = (feature: any, layer: L.Layer) => {
    const name = getProvinceName(feature)

    layer.bindPopup(`<strong>${name}</strong>`)

    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    })

    const center = (layer as L.GeoJSON).getBounds().getCenter()
    const label = L.marker(center, {
      icon: L.divIcon({
        className: "province-label",
        html: name,
        iconSize: [100, 20]
      }),
      interactive: false
    })

    provinceLabelLayer.value.addLayer(label)
  }

  // Nouvelle fonction pour charger les zones d'une province spécifique
  const loadZonesForProvince = async (provinceName: string) => {
    if (!provinceName || !map.value) return

    // Éviter de recharger si c'est la même province
    if (currentProvinceZones.value === provinceName && zonesData.value) {
      displayZonesForCurrentProvince()
      return
    }

    zonesLoading.value = true
    zonesError.value = null

    try {
      // Encoder le nom de la province pour l'URL
      const encodedProvince = encodeURIComponent(provinceName)
      const response = await fetch(`./api/health_zones?province=${encodedProvince}`)

      if (!response.ok) throw new Error("Erreur chargement zones")

      const data = await response.json()
      zonesData.value = data
      currentProvinceZones.value = provinceName

      // Afficher les zones sur la carte
      displayZonesForCurrentProvince()

    } catch (err) {
      console.error(err)
      zonesError.value = "Impossible de charger les zones"
    } finally {
      zonesLoading.value = false
    }
  }

  // Afficher les zones actuellement chargées
  const displayZonesForCurrentProvince = () => {
    if (!zonesData.value || !map.value) return

    // Nettoyer les couches existantes
    zoneLayer.value.clearLayers()
    zoneLabelLayer.value.clearLayers()

    // Créer les nouvelles couches
    const zones = L.geoJSON(zonesData.value, {
      style: zoneStyle,
      onEachFeature: (feature: ZoneFeature, layer: L.Layer) => {
        const name = getZoneName(feature)
        layer.bindPopup(`<strong>${name}</strong>`)

        // Ajouter l'étiquette
        const center = (layer as L.GeoJSON).getBounds().getCenter()
        const label = L.marker(center, {
          icon: L.divIcon({
            className: "zone-label",
            html: name,
            iconSize: [120, 20]
          }),
          interactive: false
        })

        zoneLabelLayer.value.addLayer(label)
      }
    })

    zoneLayer.value.addLayer(zones)

    // Ajouter les couches à la carte si elles doivent être visibles
    if (showZones.value) {
      map.value?.addLayer(zoneLayer.value)
      map.value?.addLayer(zoneLabelLayer.value)
    }
  }
  const filterProvinces = () => {
    // 1. Filtrer l'affichage des provinces sur la carte
    provinceLayer.value.clearLayers()

    if (!provincesGeoJSON.value) return

    provincesGeoJSON.value.eachLayer((layer: any) => {
      const name = getProvinceName(layer.feature)
      if (provinceVisualFilter.value.length === 0 || provinceVisualFilter.value.includes(name)) {
        provinceLayer.value.addLayer(layer)
      }
    })

    // 2. IMPORTANT: Mettre à jour l'affichage des ouvrages en fonction du filtre
    updateMarkersVisibility()
  }

  // Nouvelle fonction pour le filtre visuel des provinces
  const setProvinceVisualFilter = (provinces: string[]) => {
    provinceVisualFilter.value = provinces
    filterProvinces() // Cette fonction appelle maintenant updateMarkersVisibility()
    // Retourner les stats mises à jour
    return {
      total: allOuvrages.value.length,
      affiches: getCurrentAffiches(),
      masques: allOuvrages.value.length - getCurrentAffiches(),
      filtres: getCurrentFilteredCount()
    }
  }

  const getCurrentFilteredCount = (): number => {
    if (provinceVisualFilter.value.length === 0) return allOuvrages.value.length

    return allOuvrages.value.filter(ouvrage =>
      provinceVisualFilter.value.includes(ouvrage.province)
    ).length
  }

  const getCurrentAffiches = (): number => {
    let count = 0
    let ouvragesToShow = allOuvrages.value

    if (provinceVisualFilter.value.length > 0) {
      ouvragesToShow = ouvragesToShow.filter(ouvrage =>
        provinceVisualFilter.value.includes(ouvrage.province)
      )
    }

    ouvragesToShow.forEach(ouvrage => {
      const typeUpper = ouvrage.type?.toUpperCase() || ""
      if (activeTypes.value.has(typeUpper)) {
        count++
      }
    })

    return count
  }


  // Nouvelle fonction pour effacer le filtre visuel
const clearProvinceVisualFilter = () => {
  provinceVisualFilter.value = []
  filterProvinces() // Réinitialise l'affichage des provinces et met à jour les ouvrages
  return {
    total: allOuvrages.value.length,
    affiches: getCurrentAffiches(),
    masques: allOuvrages.value.length - getCurrentAffiches(),
    filtres: allOuvrages.value.length
  }
}
  
  const updateMarkersVisibility = () => {
  projectLayer.value.clearLayers()
  
  let compteurAffiches = 0
  
  // Filtrer par province SI des provinces sont sélectionnées
  let ouvragesToShow = allOuvrages.value
  
  if (provinceVisualFilter.value.length > 0) {
    ouvragesToShow = ouvragesToShow.filter(ouvrage => 
      provinceVisualFilter.value.includes(ouvrage.province)
    )
  }
  
  // Ensuite filtrer par type
  ouvragesToShow.forEach(ouvrage => {
    const typeUpper = ouvrage.type?.toUpperCase() || ""
    if (activeTypes.value.has(typeUpper)) {
      const marker = markersMap.value.get(ouvrage.id)
      if (marker) {
        projectLayer.value.addLayer(marker)
        compteurAffiches++
      }
    }
  })
  
  filteredOuvrages.value = ouvragesToShow
  
  console.log('Filtre provinces:', provinceVisualFilter.value)
  console.log('Ouvrages après filtre provinces:', ouvragesToShow.length)
  console.log('Ouvrages après filtre types:', compteurAffiches)
  
  return {
    total: allOuvrages.value.length,
    affiches: compteurAffiches,
    masques: allOuvrages.value.length - compteurAffiches,
    filtres: ouvragesToShow.length
  }
}

  const setProvinceOuvrageFilter = (provinces: string[]) => {
    provinceOuvrageFilter.value = provinces
    return updateMarkersVisibility()
  }

  // Fonction pour réinitialiser le filtre des ouvrages
  const clearProvinceOuvrageFilter = () => {
    provinceOuvrageFilter.value = []
    return updateMarkersVisibility()
  }

  // Fonction pour obtenir les statistiques par province
  const getProvinceStats = () => {
    const stats: Record<string, { total: number, actifs: number }> = {}

    allOuvrages.value.forEach(ouvrage => {
      const province = ouvrage.province
      if (!stats[province]) {
        stats[province] = { total: 0, actifs: 0 }
      }
      stats[province].total++

      // Vérifier si l'ouvrage est actuellement affiché
      const typeUpper = ouvrage.type?.toUpperCase() || ""
      if (activeTypes.value.has(typeUpper)) {
        stats[province].actifs++
      }
    })

    return stats
  }


  const toggleType = (type: string) => {
  if (activeTypes.value.has(type)) {
    activeTypes.value.delete(type)
  } else {
    activeTypes.value.add(type)
  }
  return updateMarkersVisibility()
}

  const selectAllTypes = () => {
    activeTypes.value = new Set(Object.keys(typeConfig))
    return updateMarkersVisibility()
  }

  const clearAllTypes = () => {
    activeTypes.value.clear()
    return updateMarkersVisibility()
  }

  const loadProvinces = async () => {
    try {
      const response = await fetch('./api/provinces')
      if (!response.ok) throw new Error("Erreur chargement provinces")
      const data = await response.json()

      provincesGeoJSON.value = L.geoJSON(data, {
        style: provinceStyle,
        onEachFeature: onEachProvince
      })

      provinceLayer.value.addLayer(provincesGeoJSON.value)

      if (map.value && provincesGeoJSON.value) {
        map.value.fitBounds(provincesGeoJSON.value.getBounds(), { padding: [10, 10] })
      }

      return data.features.map((f: ProvinceFeature) => getProvinceName(f))
    } catch (err) {
      console.error(err)
      return []
    }
  }

  // Modification de loadZones pour ne plus charger toutes les zones
  const loadZones = async () => {
    // Cette fonction est maintenant vide car on charge les zones à la demande
    // On la garde pour la compatibilité mais on ne charge rien
    console.log("Les zones sont chargées à la demande par province")
    return
  }

  const setupMapEventHandlers = () => {
    if (!map.value) return
    // Pas besoin de handlers pour les zones maintenant
  }

  const loadOuvrages = async () => {
  try {
    const response = await fetch('./api/ouvrages')
    if (!response.ok) throw new Error("Erreur chargement ouvrages")
    const data = await response.json()
    
    allOuvrages.value = data
    
    allOuvrages.value.forEach(p => {
      const style = getMarkerStyle(p.type)
      
      const marker = L.marker([p.latitude, p.longitude], {
        icon: L.divIcon({
          className: "project-marker",
          html: `<span style="color:${style.color};font-size:18px">${style.icon}</span>`
        })
      })
      
      marker.bindPopup(`
        <strong>${p.site}</strong><br>
        Type: ${style.label}<br>
        Statut: ${p.statut}<br>
        Cliquez pour plus de détails
      `)
      
      // IMPORTANT: S'assurer que l'événement click est bien émis
      marker.on('click', () => {
        console.log('Marqueur cliqué:', p.site) // Pour déboguer
        selectedOuvrage.value = p
        marker.openPopup()
      })
      
      markersMap.value.set(p.id, marker)
    })
    
    return updateMarkersVisibility()
  } catch (err) {
    console.error(err)
    return { total: 0, affiches: 0, masques: 0, filtres: 0 }
  }
}
  const setProvinceFilter = (filters: string[]) => {
    provinceFilter.value = filters
    filterProvinces()
  }

  const clearProvinceFilter = () => {
    provinceFilter.value = []
    filterProvinces()
  }

  const setShowProvinces = (show: boolean) => {
    showProvinces.value = show
    if (show) {
      map.value?.addLayer(provinceLayer.value)
      map.value?.addLayer(provinceLabelLayer.value)
    } else {
      map.value?.removeLayer(provinceLayer.value)
      map.value?.removeLayer(provinceLabelLayer.value)
    }
  }

  const setShowZones = async (show: boolean) => {
    showZones.value = show

    if (!map.value) return

    if (show) {
      // Si on active l'affichage des zones et qu'une province est sélectionnée
      if (selectedProvince.value) {
        await loadZonesForProvince(selectedProvince.value)
      } else {
        // Sinon, ajouter juste les couches vides
        map.value.addLayer(zoneLayer.value)
        map.value.addLayer(zoneLabelLayer.value)
      }
    } else {
      // Désactiver l'affichage des zones
      map.value.removeLayer(zoneLayer.value)
      map.value.removeLayer(zoneLabelLayer.value)
      zoneLayer.value.clearLayers()
      zoneLabelLayer.value.clearLayers()
      zonesData.value = null
      currentProvinceZones.value = null
    }
  }

  return {
    map,
    provinceLayer,
    zoneLayer,
    zoneLabelLayer,
    projectLayer,
    provinceLabelLayer,
    allOuvrages,
    selectedOuvrage,
    selectedProvince,
    provinceFilter,
    activeTypes,
    showProvinces,
    showZones,
    zonesLoading,
    zonesError,
    typeConfig,
    baseMaps,
    getMarkerStyle,
    getZonesByProvince,
    updateMarkersVisibility,
    toggleType,
    selectAllTypes,
    clearAllTypes,
    initMap,
    loadProvinces,
    loadZones,
    loadOuvrages,
    setProvinceFilter,
    clearProvinceFilter,
    setShowProvinces,
    setShowZones,
    loadZonesForProvince,
    provinceOuvrageFilter,
    filteredOuvrages,
    setProvinceOuvrageFilter,
    clearProvinceOuvrageFilter,
    getProvinceStats,
    provinceVisualFilter,
    setProvinceVisualFilter,
    clearProvinceVisualFilter,
  }
}