
<template>
<div id="map"></div>
</template>

<script setup>

import { onMounted, watch } from 'vue'
import L from 'leaflet'

const props = defineProps({
activeTypes:Array,
selectedProvinces:Array
})

const emit = defineEmits(["selectProject","provincesLoaded"])

let map
let provinceLayer = L.layerGroup()
let zoneLayer = L.layerGroup()
let projectLayer = L.layerGroup()

let provincesData=null
let zonesData=null
let projects=[]

function getProvinceName(f){
return f.properties?.name ||
f.properties?.NAME_1 ||
f.properties?.ADM1_EN ||
"Province"
}

function getZoneName(f){
return f.properties?.name ||
f.properties?.ADM2_EN ||
"Zone"
}

function getMarkerStyle(type){

const styles={
DISTRIBUTION:{icon:"🚚",color:"#2563eb"},
INCIDENT:{icon:"🚨",color:"#dc2626"},
CONSTRUCTION:{icon:"🚧",color:"#16a34a"},
ECOLE:{icon:"🎓",color:"#9333ea"},
"CENTRE DE SANTE":{icon:"🏥",color:"#f59e0b"},
"BATIMENT ADMINISTRATIF":{icon:"🏢",color:"#0891b2"}
}

return styles[type]||{icon:"📍",color:"#333"}

}

function refreshProjects(){

projectLayer.clearLayers()

projects.forEach(p=>{

if(props.activeTypes.length && !props.activeTypes.includes(p.type)) return
if(props.selectedProvinces.length && !props.selectedProvinces.includes(p.province)) return

const style=getMarkerStyle(p.type)

const marker=L.marker([p.latitude,p.longitude],{
icon:L.divIcon({
className:"project-marker",
html:`<span style="font-size:18px;color:${style.color}">${style.icon}</span>`
})
})

marker.on("click",()=>emit("selectProject",p))

projectLayer.addLayer(marker)

})

}

watch(()=>props.activeTypes,refreshProjects)
watch(()=>props.selectedProvinces,refreshProjects)

onMounted(async()=>{

map=L.map("map").setView([-4,22],5)

L.tileLayer(
"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
{attribution:"© OpenStreetMap"}
).addTo(map)

provinceLayer.addTo(map)
zoneLayer.addTo(map)
projectLayer.addTo(map)

// provinces
const p=await fetch("/api/provinces")
if(p.ok){

provincesData=await p.json()

const list=[]

L.geoJSON(provincesData,{
style:{color:"#1e293b",weight:2,fillOpacity:0.2},
onEachFeature:(f,l)=>{
const name=getProvinceName(f)
list.push(name)
l.bindPopup(name)
}
}).addTo(provinceLayer)

emit("provincesLoaded",list)

}

// zones
const z=await fetch("/api/health_zones")
if(z.ok){

zonesData=await z.json()

L.geoJSON(zonesData,{
style:{color:"#065f46",weight:1,fill:false},
onEachFeature:(f,l)=>{
l.bindPopup(getZoneName(f))
}
}).addTo(zoneLayer)

}

// projects
const o=await fetch("/api/ouvrages")
if(o.ok){
projects=await o.json()
refreshProjects()
}

})

</script>
