<template>
  <div class="app-container">
    <header class="page-header">
      <div>
        <h1>Carte de la RDC</h1>
      </div>
      <div class="legend-pill">26 provinces</div>
    </header>

    <main class="layout">
      <!-- Bouton pour toggle la sidebar gauche -->
      <button 
        class="sidebar-toggle left-toggle" 
        :class="{ 'collapsed': !leftSidebarOpen }"
        @click="toggleLeftSidebar"
        :title="leftSidebarOpen ? 'Masquer le panneau' : 'Afficher le panneau'"
      >
        {{ leftSidebarOpen ? '◀' : '▶' }}
      </button>

      <!-- Sidebar Gauche avec transition -->
      <transition name="slide-left">
        <LeftSidebar
          v-if="leftSidebarOpen"
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
      </transition>

      <!-- Map Section -->
      <section class="map-wrapper" :class="{ 
        'left-collapsed': !leftSidebarOpen, 
        'right-collapsed': !rightSidebarOpen 
      }">
        <MapView
          :selected-ouvrage="selectedOuvrage"
          :show-provinces="showProvinces"
          :show-zones="showZones"
          :zones-loading="zonesLoading"
          @map-init="handleMapInit"
          @ouvrage-selected="handleOuvrageSelected"
          @province-selected="handleProvinceSelected"
        />
      </section>

      <!-- Bouton pour toggle la sidebar droite -->
      <button 
        class="sidebar-toggle right-toggle" 
        :class="{ 'collapsed': !rightSidebarOpen }"
        @click="toggleRightSidebar"
        :title="rightSidebarOpen ? 'Masquer le panneau' : 'Afficher le panneau'"
      >
        {{ rightSidebarOpen ? '▶' : '◀' }}
      </button>

      <!-- Sidebar Droite avec transition -->
      <transition name="slide-right">
        <RightSidebar
          v-if="rightSidebarOpen"
          :ouvrage="selectedOuvrage"
        />
      </transition>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

// État des sidebars
const leftSidebarOpen = ref(true)
const rightSidebarOpen = ref(true)

const provincesList = ref<string[]>([])
const stats = ref({ total: 0, affiches: 0, masques: 0, filtres: 0 })

const toggleLeftSidebar = () => {
  leftSidebarOpen.value = !leftSidebarOpen.value
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 300)
}

const toggleRightSidebar = () => {
  rightSidebarOpen.value = !rightSidebarOpen.value
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 300)
}

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

const handleOuvrageSelected = (ouvrage: Ouvrage) => {
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
  overflow: hidden; /* Empêche le scroll */
}

.layout {
  display: flex;
  flex: 1;
  overflow: hidden;
  position: relative;
  height: calc(100vh - 60px); /* Ajuste selon la hauteur de ton header */
}

/* Transitions pour les sidebars */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
  width: 280px;
}

.slide-left-enter-from,
.slide-left-leave-to {
  width: 0;
  opacity: 0;
  transform: translateX(-100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
  width: 320px;
}

.slide-right-enter-from,
.slide-right-leave-to {
  width: 0;
  opacity: 0;
  transform: translateX(100%);
}

/* Boutons de toggle */
.sidebar-toggle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 48px;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  cursor: pointer;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #2563eb;
  transition: all 0.2s;
}

.sidebar-toggle:hover {
  background: #f8fafc;
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
  width: 28px;
}

.sidebar-toggle.left-toggle {
  left: 280px;
}

.sidebar-toggle.left-toggle.collapsed {
  left: 0;
}

.sidebar-toggle.right-toggle {
  right: 510px; /* CORRIGÉ : 320px au lieu de 510px */
}

.sidebar-toggle.right-toggle.collapsed {
  right: 0;
}

/* Map wrapper avec ajustements */
.map-wrapper {
  flex: 1;
  transition: all 0.3s ease;
  height: 100%;
  min-height: 0; /* Important pour que l'enfant prenne toute la hauteur */
}

.map-wrapper.left-collapsed {
  margin-left: 0;
}

.map-wrapper.right-collapsed {
  margin-right: 0;
}

/* Ajustements responsifs */
@media (max-width: 768px) {
  .sidebar-toggle.left-toggle {
    left: 240px;
  }
  
  .sidebar-toggle.right-toggle {
    right: 280px;
  }
}
</style>