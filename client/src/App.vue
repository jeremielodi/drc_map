<template>
  <div class="app-container">
    <header class="page-header">
      <div>
        <h1>Carte de la RDC</h1>
      </div>
      <div class="legend-pill">26 provinces</div>
    </header>

    <main class="layout">
      <LeftSidebar
        :selected-province="selectedProvince"
        :provinces="provincesList"
        :province-visual-filter="provinceVisualFilter"
        :active-types="activeTypes"
        :type-config="typeConfig"
        :stats="stats"
        :show-provinces="showProvinces"
        :show-zones="showZones"
        :zones-loading="zonesLoading"
        :all-ouvrages="allOuvrages"
        :get-zones-by-province="getZonesByProvince"
        @update:province-visual-filter="handleProvinceVisualFilter"
        @clear-province-visual-filter="handleClearProvinceVisualFilter"
        @toggle-type="handleToggleType"
        @select-all-types="handleSelectAllTypes"
        @clear-all-types="handleClearAllTypes"
        @update:show-provinces="handleShowProvinces"
        @update:show-zones="handleShowZones"
      />

      <MapView
        :selected-ouvrage="selectedOuvrage"
        :show-provinces="showProvinces"
        :show-zones="showZones"
        :zones-loading="zonesLoading"
        @map-init="handleMapInit"
        @ouvrage-selected="handleOuvrageSelected"
        @province-selected="handleProvinceSelected"
      />

      <RightSidebar :ouvrage="selectedOuvrage" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import LeftSidebar from './components/LeftSidebar.vue'
import MapView from './components/MapView.vue'
import RightSidebar from './components/RightSidebar.vue'
import { useMap } from './composables/useMap'
import type { Ouvrage } from './types'

const {
  selectedOuvrage,
  selectedProvince,
  provinceVisualFilter,
  activeTypes,
  showProvinces,
  showZones,
  zonesLoading,
  typeConfig,
  allOuvrages,
  getZonesByProvince,
  updateMarkersVisibility,
  toggleType,
  selectAllTypes,
  clearAllTypes,
  initMap,
  loadProvinces,
  loadZones,
  loadOuvrages,
  setProvinceVisualFilter,
  clearProvinceVisualFilter,
  setShowProvinces,
  setShowZones,
  loadZonesForProvince
} = useMap()

const provincesList = ref<string[]>([])
const stats = ref({ total: 0, affiches: 0, masques: 0, filtres: 0 })

// Debug: Surveiller les changements de selectedOuvrage
watch(selectedOuvrage, (newVal) => {
  console.log('selectedOuvrage a changé dans App.vue:', newVal)
})

const handleMapInit = async (mapId: string) => {
  initMap(mapId)
  await loadData()
}

const loadData = async () => {
  const provinces = await loadProvinces()
  provincesList.value = provinces
  
  await loadZones()
  
  const ouvrageStats = await loadOuvrages()
  stats.value = ouvrageStats
}

// Gestionnaire unique pour le filtre des provinces
const handleProvinceVisualFilter = (filters: string[]) => {
  const newStats = setProvinceVisualFilter(filters)
  stats.value = newStats
}

const handleClearProvinceVisualFilter = () => {
  const newStats = clearProvinceVisualFilter()
  stats.value = newStats
}

const handleToggleType = (type: string) => {
  const newStats = toggleType(type)
  stats.value = newStats
}

const handleSelectAllTypes = () => {
  const newStats = selectAllTypes()
  stats.value = newStats
}

const handleClearAllTypes = () => {
  const newStats = clearAllTypes()
  stats.value = newStats
}

const handleShowProvinces = (show: boolean) => {
  setShowProvinces(show)
}

const handleShowZones = async (show: boolean) => {
  await setShowZones(show)
}

// Gestionnaire pour la sélection d'ouvrage
const handleOuvrageSelected = (ouvrage: Ouvrage) => {
  console.log('Ouvrage sélectionné reçu dans App.vue:', ouvrage)
  selectedOuvrage.value = ouvrage
}

const handleProvinceSelected = async (province: string) => {
  selectedProvince.value = province
  if (showZones.value) {
    await loadZonesForProvince(province)
  }
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>