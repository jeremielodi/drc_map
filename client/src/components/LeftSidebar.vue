<template>
  <aside class="sidebar">
    <h2>Province</h2>

    <!-- FILTRE UNIQUE : Contrôle à la fois l'affichage des provinces ET le filtrage des ouvrages -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-top: 16px;">
      <h3 style="margin:0">Filtre Provinces</h3>
      <button class="small-btn" @click="clearProvinceFilter">Clear</button>
    </div>
  
    <!-- Barre de recherche -->
    <div class="search-container">
      <input 
        type="text" 
        v-model="searchQuery" 
        placeholder="Rechercher une province..." 
        class="search-input"
        @input="filterProvincesList"
      />
      <span v-if="searchQuery" class="clear-search" @click="clearSearch">✕</span>
    </div>

    <!-- Compteur de résultats -->
    <div class="search-results-count" v-if="searchQuery">
      {{ filteredProvinces.length }} province(s) trouvée(s)
    </div>

    <select 
      id="province-filter" 
      multiple 
      size="10" 
      class="province-filter-select"
      v-model="selectedProvinces"
      @change="updateProvinceFilter"
    >
      <option v-for="province in filteredProvinces" :key="province" :value="province">
        {{ province }}
        <span v-if="provinceStats[province]" class="province-count">
          ({{ provinceStats[province].actifs }}/{{ provinceStats[province].total }})
        </span>
      </option>
      <option v-if="filteredProvinces.length === 0" disabled class="no-results">
        Aucune province trouvée
      </option>
    </select>

    <div class="filter-actions">
      <button class="small-btn" @click="selectAllProvinces">Toutes</button>
      <button class="small-btn" @click="clearProvinceFilter">Aucune</button>
      <span class="filter-summary" v-if="selectedProvinces.length > 0">
        {{ selectedProvinces.length }} province(s) sélectionnée(s)
      </span>
    </div>

    <hr />

    <h3>Layers</h3>
    <label>
      <input 
        type="checkbox" 
        id="toggle-provinces" 
        :checked="showProvinces"
        @change="$emit('update:show-provinces', ($event.target as HTMLInputElement).checked)"
      >
      Afficher Provinces
    </label>
    <br>
    <label>
      <input 
        type="checkbox" 
        id="toggle-zones" 
        :checked="showZones"
        @change="handleZoneToggle"
        :disabled="zonesLoading"
      >
      Afficher Zones de santé
      <span v-if="zonesLoading" class="loading-spinner-small">⏳</span>
    </label>

    <br /><br />

    <h3>Filtre par type d'ouvrage</h3>

    <!-- Légende filtrable -->
    <div class="legend-header">
      <span>Légende</span>
      <div class="legend-actions">
        <button id="select-all-types" class="legend-btn" @click="$emit('select-all-types')">Tous</button>
        <button id="clear-all-types" class="legend-btn" @click="$emit('clear-all-types')">Aucun</button>
      </div>
    </div>

    <ul class="legend" id="type-legend">
      <li 
        v-for="(config, type) in typeConfig" 
        :key="type"
        class="legend-item"
        :class="{ active: activeTypes.has(type), disabled: !activeTypes.has(type) }"
        :data-type="type"
        @click="$emit('toggle-type', type)"
      >
        <span class="legend-icon" :style="{ color: config.color }">{{ config.icon }}</span>
        <span class="legend-label">{{ config.label }}</span>
        <span class="legend-count">{{ getTypeCount(type) }}</span>
      </li>
    </ul>

    <!-- Stats rapides -->
    <div id="quick-stats" class="quick-stats">
      <div class="stat-row">
        <span class="stat-label">Total ouvrages:</span>
        <span class="stat-value" id="total-ouvrages">{{ stats.total }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Affichés:</span>
        <span class="stat-value" id="affiches-ouvrages">{{ stats.affiches }}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Masqués:</span>
        <span class="stat-value" id="masques-ouvrages">{{ stats.masques }}</span>
      </div>
      <div v-if="selectedProvinces.length > 0" class="stat-row highlight">
        <span class="stat-label">Filtrés par province:</span>
        <span class="stat-value">{{ stats.filtres || 0 }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { TypeConfig, Ouvrage } from '@/types'

const props = defineProps<{
  selectedProvince: string | null
  provinces: string[]
  provinceVisualFilter: string[]
  activeTypes: Set<string>
  typeConfig: Record<string, TypeConfig>
  stats: { total: number; affiches: number; masques: number; filtres?: number }
  showProvinces: boolean
  showZones: boolean
  zonesLoading: boolean
  allOuvrages: Ouvrage[]
  getZonesByProvince: (province: string) => string[]
}>()

const emit = defineEmits<{
  (e: 'update:province-visual-filter', filters: string[]): void
  (e: 'clear-province-visual-filter'): void
  (e: 'toggle-type', type: string): void
  (e: 'select-all-types'): void
  (e: 'clear-all-types'): void
  (e: 'update:show-provinces', show: boolean): void
  (e: 'update:show-zones', show: boolean): void
}>()

// État local pour le filtre unique
const selectedProvinces = ref<string[]>(props.provinceVisualFilter)
const searchQuery = ref('')
const filteredProvincesList = ref<string[]>([])

// Computed properties
const sortedProvinces = computed(() => {
  return [...props.provinces].sort((a, b) => a.localeCompare(b))
})

// Provinces filtrées par la recherche
const filteredProvinces = computed(() => {
  if (!searchQuery.value) return sortedProvinces.value
  
  const query = searchQuery.value.toLowerCase()
  return sortedProvinces.value.filter(province => 
    province.toLowerCase().includes(query)
  )
})

const displayedZones = computed(() => {
  if (!props.selectedProvince) return []
  const zones = props.getZonesByProvince(props.selectedProvince)
  return zones.slice(0, 10)
})

const selectedProvinceDisplay = computed(() => {
  if (!props.selectedProvince) return 'Sélection'
  return props.selectedProvince
})

// Statistiques par province
const provinceStats = computed(() => {
  const stats: Record<string, { total: number; actifs: number }> = {}
  
  props.allOuvrages.forEach(ouvrage => {
    const province = ouvrage.province
    if (!stats[province]) {
      stats[province] = { total: 0, actifs: 0 }
    }
    stats[province].total++
    
    const typeUpper = ouvrage.type?.toUpperCase() || ""
    if (props.activeTypes.has(typeUpper)) {
      stats[province].actifs++
    }
  })
  
  return stats
})

// Type counts
const typeCounts = computed(() => {
  const counts: Record<string, number> = {}
  
  Object.keys(props.typeConfig).forEach(type => {
    counts[type] = 0
  })
  
  props.allOuvrages.forEach(ouvrage => {
    const type = ouvrage.type?.toUpperCase() || 'AUTRE'
    if (counts[type] !== undefined) {
      counts[type]++
    } else {
      counts['AUTRE'] = (counts['AUTRE'] || 0) + 1
    }
  })
  
  return counts
})

const getTypeCount = (type: string): number => {
  return typeCounts.value[type] || 0
}

// Gestionnaire unique pour le filtre
const updateProvinceFilter = () => {
  emit('update:province-visual-filter', selectedProvinces.value)
}

const selectAllProvinces = () => {
  selectedProvinces.value = [...props.provinces]
  updateProvinceFilter()
}

const clearProvinceFilter = () => {
  selectedProvinces.value = []
  emit('clear-province-visual-filter')
}

// Fonctions de recherche
const filterProvincesList = () => {
  // Le computed filteredProvinces s'occupe du filtrage
}

const clearSearch = () => {
  searchQuery.value = ''
}

const handleZoneToggle = async (event: Event) => {
  const show = (event.target as HTMLInputElement).checked
  emit('update:show-zones', show)
}

// Watcher
watch(() => props.provinceVisualFilter, (newFilter) => {
  selectedProvinces.value = newFilter
})
</script>

<style scoped>
.province-filter-select {
  width: 100%;
  margin-top: 6px;
  margin-bottom: 8px;
  min-height: 200px;
}

.province-filter-select option {
  padding: 8px 10px;
  border-bottom: 1px solid #f1f5f9;
}

.province-filter-select option:checked {
  background-color: #2563eb;
  color: white;
}

.province-count {
  font-size: 0.85em;
  opacity: 0.9;
  margin-left: 6px;
}

.filter-description {
  font-size: 12px;
  color: #475569;
  margin: 6px 0;
  line-height: 1.4;
  background-color: #f8fafc;
  padding: 6px 8px;
  border-radius: 4px;
  border-left: 3px solid #2563eb;
}

.filter-description strong {
  color: #2563eb;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  margin-bottom: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.small-btn {
  padding: 5px 10px;
  font-size: 12px;
  background-color: #f1f5f9;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  cursor: pointer;
}

.small-btn:hover {
  background-color: #e2e8f0;
}

.filter-summary {
  font-size: 12px;
  color: #2563eb;
  background-color: #dbeafe;
  padding: 3px 8px;
  border-radius: 16px;
  margin-left: auto;
  font-weight: 500;
}

.stat-row.highlight {
  background-color: #dbeafe;
  padding: 6px 10px;
  border-radius: 6px;
  margin-top: 6px;
  font-weight: 500;
}

.loading-spinner-small {
  display: inline-block;
  animation: spin 1s linear infinite;
  margin-left: 5px;
}

/* Styles pour la recherche */
.search-container {
  position: relative;
  margin: 10px 0;
}

.search-input {
  width: 100%;
  padding: 8px 30px 8px 10px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 13px;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #94a3b8;
  font-size: 14px;
  padding: 0 4px;
}

.clear-search:hover {
  color: #475569;
}

.search-results-count {
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
  text-align: right;
}

.no-results {
  color: #94a3b8;
  font-style: italic;
  text-align: center;
  padding: 10px;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>