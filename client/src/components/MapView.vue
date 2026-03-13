<template>
  <section class="map-wrapper">
    <div id="map"></div>
    <!-- <div v-if="zonesLoading" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">Chargement des zones...</div>
    </div> -->
  </section>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
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

onMounted(() => {
  emit('mapInit', 'map')
})

// Surveiller les changements de selectedOuvrage pour éventuellement ouvrir la popup
watch(() => props.selectedOuvrage, (newOuvrage) => {
  if (newOuvrage) {
    console.log('Ouvrage sélectionné dans MapView:', newOuvrage.site)
  }
})
</script>

<style scoped>
.map-wrapper {
  flex: 1;
  position: relative;
}

#map {
  height: 100%;
  width: 100%;
}

.loading-overlay {
  position: absolute;
  top: 20px;
  right: 20px;
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