// Leaflet doesn't have proper TypeScript types for some extensions
import * as L from 'leaflet'

export interface Ouvrage {
  id: string | number
  site: string
  type: string
  statut: string
  priorite: string
  latitude: number
  longitude: number
  province: string
  territoire?: string
  zone?: string
  description: string
  avancement?: number
  budget?: number
  depenses?: number
  devise?: string
  beneficiaires?: number
  femmes?: number
  enfants?: number
  responsable?: string
  partenaire?: string
  telephone?: string
  email?: string
  materiel?: Materiel[]
  phases?: Phase[]
  interventions?: Intervention[]
  equipe?: Equipe[]
  personnelPrevu?: Personnel[]
  defis?: string[]
  documents?: Document[]
}

export interface Materiel {
  item: string
  quantite: number
  unite?: string
  distribue?: number
  utilise?: number
}

export interface Phase {
  nom: string
  avancement: number
  debut?: string
  fin?: string
  finPrevue?: string
}

export interface Intervention {
  date: string
  type: string
  description: string
}

export interface Equipe {
  nom: string
  role: string
}

export interface Personnel {
  poste: string
  quantite: number
}

export interface Document {
  nom: string
  taille: string
}

export interface TypeConfig {
  icon: string
  color: string
  label: string
}

export interface FeatureWithId extends L.GeoJSON {
  feature?: {
    properties?: {
      id?: string | number
    }
  }
}

export interface ZoneFeature extends GeoJSON.Feature {
  properties: {
    name?: string
    Nom?: string
    zone?: string
    ADM2_EN?: string
    province?: string
    Province?: string
    ADM1_EN?: string
    province_name?: string
  }
}

export interface ProvinceFeature extends GeoJSON.Feature {
  properties: {
    name?: string
    NAME_1?: string
    province?: string
    nom?: string
    ADM1_EN?: string
  }
}