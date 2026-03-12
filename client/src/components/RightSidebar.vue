
<template>

<div class="sidebar-right">

<h2>Détails</h2>

<div v-if="project">

<h3>{{project.site}}</h3>

<p><b>Type:</b> {{project.type}}</p>
<p><b>Province:</b> {{project.province}}</p>
<p><b>Statut:</b> {{project.statut}}</p>

<p><b>Latitude:</b> {{project.latitude}}</p>
<p><b>Longitude:</b> {{project.longitude}}</p>

<p>{{project.description}}</p>

</div>

<div v-else>

Aucun ouvrage sélectionné

</div>

</div>

</template>

<script setup>
defineProps({project:Object})
</script>
