<template>
  <aside class="sidebar-right">
    <h2>📋 Détails de l'ouvrage</h2>

    <!-- Conteneur des détails -->
    <div id="ouvrage-details-container">
      <div v-if="!ouvrage" class="no-selection">
        <div class="no-selection-icon">👆</div>
        <div class="no-selection-text">Aucun ouvrage sélectionné</div>
        <div class="no-selection-subtext">Cliquez sur un marqueur sur la carte pour voir ses détails</div>
      </div>

      <div v-else class="ouvrage-detail-card">
        <!-- En-tête avec icône et titre -->
        <div class="ouvrage-detail-header">
          <span class="ouvrage-detail-icon" :style="{ color: markerStyle.color }">{{ markerStyle.icon }}</span>
          <span class="ouvrage-detail-title">{{ ouvrage.site }}</span>
        </div>

        <!-- Section Informations générales -->
        <div class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Informations générales</div>
          
          <div class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Type</span>
            <span class="ouvrage-detail-value">{{ markerStyle.label }}</span>
          </div>
          
          <div class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Statut</span>
            <span class="ouvrage-detail-value">
              <span class="ouvrage-detail-badge" :class="getStatutClass(ouvrage.statut)">{{ ouvrage.statut }}</span>
            </span>
          </div>
          
          <div class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Priorité</span>
            <span class="ouvrage-detail-value">
              <span class="ouvrage-detail-badge" :class="getPrioriteClass(ouvrage.priorite)">{{ ouvrage.priorite }}</span>
            </span>
          </div>
          
          <div v-if="ouvrage.avancement !== undefined" class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Avancement</span>
            <span class="ouvrage-detail-value">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span>{{ ouvrage.avancement }}%</span>
                <div class="progress-bar" style="flex: 1;">
                  <div class="progress-fill" :style="{ width: ouvrage.avancement + '%' }"></div>
                </div>
              </div>
            </span>
          </div>
          
          <div class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Province</span>
            <span class="ouvrage-detail-value">{{ ouvrage.province }}</span>
          </div>
          
          <div class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Territoire</span>
            <span class="ouvrage-detail-value">{{ ouvrage.territoire || ouvrage.zone || 'Non spécifié' }}</span>
          </div>
        </div>

        <!-- Section Localisation -->
        <div class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Localisation</div>
          
          <div class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Latitude</span>
            <span class="ouvrage-detail-value coordinates">{{ formatCoord(ouvrage.latitude) }}</span>
          </div>
          
          <div class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Longitude</span>
            <span class="ouvrage-detail-value coordinates">{{ formatCoord(ouvrage.longitude) }}</span>
          </div>
        </div>

        <!-- Section Budget -->
        <div v-if="ouvrage.budget" class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Budget</div>
          
          <div class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Budget total</span>
            <span class="ouvrage-detail-value">{{ formatMoney(ouvrage.budget, ouvrage.devise) }}</span>
          </div>
          
          <div v-if="ouvrage.depenses" class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Dépenses</span>
            <span class="ouvrage-detail-value">{{ formatMoney(ouvrage.depenses, ouvrage.devise) }} ({{ Math.round(ouvrage.depenses / ouvrage.budget * 100) }}%)</span>
          </div>
          
          <div v-if="ouvrage.depenses" class="progress-bar">
            <div class="progress-fill" :style="{ width: (ouvrage.depenses / ouvrage.budget * 100) + '%' }"></div>
          </div>
        </div>

        <!-- Section Description -->
        <div class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Description</div>
          <div class="ouvrage-detail-description">
            {{ ouvrage.description }}
          </div>
        </div>

        <!-- Section Bénéficiaires -->
        <div v-if="ouvrage.beneficiaires" class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Bénéficiaires</div>
          
          <div class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Total</span>
            <span class="ouvrage-detail-value">{{ formatNumber(ouvrage.beneficiaires) }} personnes</span>
          </div>
          
          <div v-if="ouvrage.femmes" class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Femmes</span>
            <span class="ouvrage-detail-value">{{ formatNumber(ouvrage.femmes) }} ({{ Math.round(ouvrage.femmes / ouvrage.beneficiaires * 100) }}%)</span>
          </div>
          
          <div v-if="ouvrage.enfants" class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">Enfants</span>
            <span class="ouvrage-detail-value">{{ formatNumber(ouvrage.enfants) }} ({{ Math.round(ouvrage.enfants / ouvrage.beneficiaires * 100) }}%)</span>
          </div>
        </div>

        <!-- Section Matériel -->
        <div v-if="ouvrage.materiel && ouvrage.materiel.length" class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Matériel</div>
          
          <div v-for="(item, index) in ouvrage.materiel" :key="index" class="ouvrage-detail-row">
            <span class="ouvrage-detail-label">{{ item.item }}</span>
            <span class="ouvrage-detail-value">
              {{ item.quantite }} {{ item.unite || '' }}
              <span v-if="item.distribue">(distribué: {{ item.distribue }})</span>
              <span v-if="item.utilise">(utilisé: {{ item.utilise }})</span>
            </span>
          </div>
        </div>

        <!-- Section Phases -->
        <div v-if="ouvrage.phases && ouvrage.phases.length" class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Phases du projet</div>
          
          <div v-for="(phase, index) in ouvrage.phases" :key="index" style="margin-bottom: 15px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
              <span style="font-weight: 500;">{{ phase.nom }}</span>
              <span>{{ phase.avancement }}%</span>
            </div>
            
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: phase.avancement + '%' }"></div>
            </div>
            
            <div style="font-size: 11px; color: #718096; margin-top: 2px;">
              {{ formatDate(phase.debut) }} - {{ formatDate(phase.fin || phase.finPrevue) }}
            </div>
          </div>
        </div>

        <!-- Section Documents -->
        <div v-if="ouvrage.documents && ouvrage.documents.length" class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Documents</div>
          
          <ul class="documents-list">
            <li v-for="(doc, index) in ouvrage.documents" :key="index">
              <span>📄</span>
              <span>{{ doc.nom }} ({{ doc.taille }})</span>
            </li>
          </ul>
        </div>

        <!-- Section Interventions -->
        <div v-if="ouvrage.interventions && ouvrage.interventions.length" class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Interventions</div>
          
          <div v-for="(intervention, index) in ouvrage.interventions" :key="index" class="intervention-item">
            <div class="intervention-date">{{ formatDate(intervention.date) }} - {{ intervention.type }}</div>
            <div>{{ intervention.description }}</div>
          </div>
        </div>

        <!-- Section Équipe -->
        <div v-if="ouvrage.equipe && ouvrage.equipe.length" class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Équipe</div>
          
          <div v-for="(person, index) in ouvrage.equipe" :key="index" class="contact-item">
            <div class="contact-name">{{ person.nom }}</div>
            <div class="contact-role">{{ person.role }}</div>
          </div>
        </div>

        <!-- Section Personnel prévu -->
        <div v-if="ouvrage.personnelPrevu && ouvrage.personnelPrevu.length" class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Personnel prévu</div>
          
          <div v-for="(person, index) in ouvrage.personnelPrevu" :key="index" class="contact-item">
            <div class="contact-name">{{ person.poste }}</div>
            <div class="contact-role">{{ person.quantite }} personnes</div>
          </div>
        </div>

        <!-- Section Contact -->
        <div v-if="ouvrage.responsable" class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Contact</div>
          
          <div class="contact-item">
            <div class="contact-name">{{ ouvrage.responsable }}</div>
            <div class="contact-role">{{ ouvrage.partenaire || 'Responsable' }}</div>
            <div v-if="ouvrage.telephone">📞 {{ ouvrage.telephone }}</div>
            <div v-if="ouvrage.email">✉️ {{ ouvrage.email }}</div>
          </div>
        </div>

        <!-- Section Défis -->
        <div v-if="ouvrage.defis && ouvrage.defis.length" class="ouvrage-detail-section">
          <div class="ouvrage-detail-section-title">Défis</div>
          
          <ul style="list-style-type: disc; padding-left: 20px;">
            <li v-for="(defi, index) in ouvrage.defis" :key="index" style="margin-bottom: 5px;">
              {{ defi }}
            </li>
          </ul>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Ouvrage } from '@/types'

const props = defineProps<{
  ouvrage: Ouvrage | null
}>()

// Style du marqueur basé sur le type
const markerStyle = computed(() => {
  const typeUpper = props.ouvrage?.type?.toUpperCase() || ''
  const styles: Record<string, { icon: string; color: string; label: string }> = {
    "DISTRIBUTION": { icon: "🚚", color: "#2563eb", label: "Distribution" },
    "INCIDENT": { icon: "🚨", color: "#dc2626", label: "Incident" },
    "CONSTRUCTION": { icon: "🚧", color: "#16a34a", label: "Construction" },
    "ECOLE": { icon: "🎓", color: "#9333ea", label: "École" },
    "CENTRE DE SANTE": { icon: "🏥", color: "#f59e0b", label: "Centre de Santé" },
    "BATIMENT ADMINISTRATIF": { icon: "⚖️", color: "#0891b2", label: "Bâtiment Administratif" }
  }
  return styles[typeUpper] || { icon: "📌", color: "#333", label: "Autre" }
})

// Classes CSS pour le statut
const getStatutClass = (statut?: string): string => {
  const statutLower = (statut || '').toLowerCase()
  if (statutLower.includes('en cours')) return 'badge-en-cours'
  if (statutLower.includes('terminé') || statutLower.includes('résolu')) return 'badge-termine'
  if (statutLower.includes('planifié')) return 'badge-planifie'
  if (statutLower.includes('critique')) return 'badge-danger'
  if (statutLower.includes('urgent')) return 'badge-warning'
  return 'badge-info'
}

// Classe CSS pour la priorité
const getPrioriteClass = (priorite?: string): string => {
  const prioriteUpper = (priorite || '').toUpperCase()
  if (prioriteUpper === 'HAUTE' || prioriteUpper === 'URGENTE') return 'badge-danger'
  if (prioriteUpper === 'MOYENNE') return 'badge-warning'
  return 'badge-info'
}

// Formatage des coordonnées
const formatCoord = (coord: number): string => {
  return coord.toFixed(4)
}

// Formatage des montants
const formatMoney = (montant?: number, devise: string = 'USD'): string => {
  if (!montant && montant !== 0) return 'Non spécifié'
  return new Intl.NumberFormat('fr-FR').format(montant) + ' ' + devise
}

// Formatage des dates
const formatDate = (date?: string): string => {
  if (!date) return 'Non spécifiée'
  return new Date(date).toLocaleDateString('fr-FR')
}

// Formatage des nombres
const formatNumber = (num?: number): string => {
  if (!num && num !== 0) return '0'
  return new Intl.NumberFormat('fr-FR').format(num)
}
</script>

<style scoped>
/* Les styles sont déjà dans style.css */
</style>