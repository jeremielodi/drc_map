<template>
  <section class="map-wrapper" ref="mapWrapper">
    <div id="map"></div>
    
    <!-- Bouton plein écran -->
    <button class="fullscreen-btn" @click="toggleFullscreen" :title="isFullscreen ? 'Quitter le plein écran' : 'Plein écran'">
      <span v-if="!isFullscreen">⛶</span>
      <span v-else>✕</span>
    </button>
    
    <div v-if="zonesLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">Chargement des zones...</div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Ouvrage } from '@/types'

const props = defineProps<{
  selectedOuvrage: Ouvrage | null
  showProvinces: boolean
  showZones: boolean
  zonesLoading: boolean
}>()

const emit = defineEmits<{
  (e: 'mapInit', mapId: string): void
  (e: 'ouvrageSelected', ouvrage: Ouvrage): void
  (e: 'provinceSelected', province: string): void
}>()

const mapWrapper = ref<HTMLElement | null>(null)
const isFullscreen = ref(false)

onMounted(() => {
  emit('mapInit', 'map')
  
  // Écouter les changements de plein écran
  document.addEventListener('fullscreenchange', handleFullscreenChange)
  document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.addEventListener('mozfullscreenchange', handleFullscreenChange)
  document.addEventListener('MSFullscreenChange', handleFullscreenChange)
})

onUnmounted(() => {
  // Nettoyer les écouteurs
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
  document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
  document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
})

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const toggleFullscreen = () => {
  if (!mapWrapper.value) return
  
  if (!document.fullscreenElement) {
    // Passer en plein écran
    if (mapWrapper.value.requestFullscreen) {
      mapWrapper.value.requestFullscreen()
    } else if ((mapWrapper.value as any).webkitRequestFullscreen) {
      (mapWrapper.value as any).webkitRequestFullscreen()
    } else if ((mapWrapper.value as any).mozRequestFullScreen) {
      (mapWrapper.value as any).mozRequestFullScreen()
    } else if ((mapWrapper.value as any).msRequestFullscreen) {
      (mapWrapper.value as any).msRequestFullscreen()
    }
  } else {
    // Quitter le plein écran
    if (document.exitFullscreen) {
      document.exitFullscreen()
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen()
    } else if ((document as any).mozCancelFullScreen) {
      (document as any).mozCancelFullScreen()
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen()
    }
  }
}
</script>

<style scoped>
.map-wrapper {
  flex: 1;
  position: relative;
}

.map-wrapper:fullscreen {
  padding: 0;
  background: #000;
}

.map-wrapper:fullscreen #map {
  height: 100vh;
  width: 100vw;
}

#map {
  height: 100%;
  width: 100%;
}

.fullscreen-btn {
  position: absolute;
  top: 80px;
  right: 20px;
  z-index: 1000;
  width: 40px;
  height: 40px;
  border-radius: 4px;
  background: white;
  border: 2px solid rgba(0,0,0,0.2);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  transition: all 0.2s ease;
}

.fullscreen-btn:hover {
  background: #f4f4f4;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.2);
}

.loading-overlay {
  position: absolute;
  top: 20px;
  right: 70px;
  background: white;
  padding: 12px 20px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1000;
  border-left: 4px solid #2563eb;
}

.loading-spinner {
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #2563eb;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: #1e293b;
  font-weight: 500;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>