
<template>

<div class="sidebar">

<h3>Filtre Provinces</h3>

<select multiple v-model="selectedProvinces" style="width:100%">

<option v-for="p in provinces" :key="p">{{p}}</option>

</select>

<button @click="clearProvinces">Clear</button>

<hr>

<h3>Types d'ouvrages</h3>

<div
v-for="t in types"
:key="t"
class="legend-item"
:class="{active:activeTypes.includes(t)}"
@click="toggleType(t)"
>

{{t}}

</div>

</div>

</template>

<script setup>

const props=defineProps({
types:Array,
activeTypes:Array,
provinces:Array,
selectedProvinces:Array
})

const emit=defineEmits(["update:activeTypes","update:selectedProvinces"])

function toggleType(t){

let arr=[...props.activeTypes]

if(arr.includes(t)){
arr=arr.filter(x=>x!==t)
}else{
arr.push(t)
}

emit("update:activeTypes",arr)

}

function clearProvinces(){

emit("update:selectedProvinces",[])

}

</script>
