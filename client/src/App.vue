
<template>

<div class="layout">

<LeftSidebar
  :types="types"
  v-model:activeTypes="activeTypes"
  :provinces="provinces"
  v-model:selectedProvinces="selectedProvinces"
/>

<MapView
  :activeTypes="activeTypes"
  :selectedProvinces="selectedProvinces"
  @selectProject="selectProject"
  @provincesLoaded="setProvinces"
/>

<RightSidebar :project="selectedProject"/>

</div>

</template>

<script setup>

import { ref } from 'vue'
import MapView from './components/MapView.vue'
import LeftSidebar from './components/LeftSidebar.vue'
import RightSidebar from './components/RightSidebar.vue'

const selectedProject = ref(null)
const provinces = ref([])
const selectedProvinces = ref([])

const types = [
"DISTRIBUTION",
"INCIDENT",
"CONSTRUCTION",
"ECOLE",
"CENTRE DE SANTE",
"BATIMENT ADMINISTRATIF"
]

const activeTypes = ref([...types])

function selectProject(p){
selectedProject.value = p
}

function setProvinces(list){
provinces.value = list
}

</script>
