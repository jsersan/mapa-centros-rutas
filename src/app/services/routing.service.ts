// routing.service.ts
import { Injectable } from '@angular/core'

export interface RoutingResult {
  ccen: number
  distanciaKm: number
  duracionMin: number
  esFallback?: boolean
}

// Ruta con geometría para dibujar sobre el mapa.
// coordinates: array de puntos [lng, lat] en EPSG:4326 (orden GeoJSON).
export interface RutaCarretera {
  distanciaKm: number
  duracionMin: number
  coordinates: [number, number][]
  tramos?: TramoRuta[]         // desglose por vía (nombre + km)
  instrucciones?: PasoRuta[]   // indicaciones paso a paso (maniobras)
  esFallback?: boolean
}

// Un paso de navegación (maniobra) devuelto por OSRM.
// tipo/modificador/salida son datos REALES de OSRM; la redacción del texto
// se hace en el componente (OSRM no da la frase en español/euskera).
export interface PasoRuta {
  tipo: string                 // maneuver.type (turn, depart, arrive, roundabout…)
  modificador: string          // maneuver.modifier (left, right, straight…)
  salida?: number              // maneuver.exit (nº de salida en rotondas)
  via: string                  // nombre de la vía de este paso
  distanciaM: number           // longitud de este paso (m)
  distHastaManiobraM: number   // distancia recorrida hasta llegar a esta maniobra (m)
}

// Un tramo de la ruta agrupado por vía.
// via = '' cuando OSM no da nombre a la vía.
// kmInicio = distancia acumulada de la RUTA (no PK oficial) al entrar en la vía.
// coordenadas = geometría del tramo [lng,lat] (EPSG:4326) para dibujarlo/hover.
export interface TramoRuta {
  via: string
  km: number
  kmInicio: number
  coordenadas?: [number, number][]
}

@Injectable({ providedIn: 'root' })
export class RoutingService {

  private readonly OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving'
  private readonly TIMEOUT_MS = 6000

  private osrmDisponible: boolean | null = null
  private testEnCurso = false

  // ✅ Caché PÚBLICA para que el componente pueda leer resultados del filtro
  readonly cache = new Map<string, RoutingResult>()

  // ✅ Método público para generar la clave de caché (consistente en todo el app)
  cacheKey(ccen: number, origenLat: number, origenLng: number): string {
    return `${ccen}_${origenLat.toFixed(4)}_${origenLng.toFixed(4)}`
  }

  // ── Haversine ──────────────────────────────────────────────────────
  haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLng = (lng2 - lng1) * Math.PI / 180
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  }

  // ── Fetch con timeout ──────────────────────────────────────────────
  private async fetchConTimeout(url: string): Promise<Response> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), this.TIMEOUT_MS)
    try {
      return await fetch(url, { signal: controller.signal })
    } finally {
      clearTimeout(id)
    }
  }

  // ── Test OSRM (una sola vez) ───────────────────────────────────────
  private async comprobarOSRM(): Promise<boolean> {
    if (this.osrmDisponible !== null) return this.osrmDisponible
    if (this.testEnCurso) {
      await new Promise(res => setTimeout(res, 1000))
      return this.osrmDisponible ?? false
    }

    this.testEnCurso = true
    const url = `${this.OSRM_BASE}/-2.4888,43.0638;-2.4232,43.1259?overview=false`
    try {
      const res = await this.fetchConTimeout(url)
      if (res.ok) {
        const data = await res.json()
        if (data.code === 'Ok' && data.routes?.length) {
          const km = (data.routes[0].distance / 1000).toFixed(1)
          console.log(`✅ OSRM disponible: Arrasate→Bergara = ${km}km`)
          this.osrmDisponible = true
          this.testEnCurso = false
          return true
        }
      }
    } catch (e: any) {
      console.warn('OSRM no disponible:', e?.message || e)
    }

    console.warn('⚠️ OSRM no disponible — usando Haversine×1.3')
    this.osrmDisponible = false
    this.testEnCurso = false
    return false
  }

  // ── Distancia por carretera ────────────────────────────────────────
  async distanciaCarreteraKm(
    origenLat: number, origenLng: number,
    destinoLat: number, destinoLng: number
  ): Promise<{ distanciaKm: number; duracionMin: number } | null> {
    const disponible = await this.comprobarOSRM()
    if (!disponible) return null

    const url = `${this.OSRM_BASE}/${origenLng},${origenLat};${destinoLng},${destinoLat}?overview=false`
    try {
      const res = await this.fetchConTimeout(url)
      if (!res.ok) return null
      const data = await res.json()
      if (data.code !== 'Ok' || !data.routes?.length) return null
      return {
        distanciaKm: data.routes[0].distance / 1000,
        duracionMin: data.routes[0].duration / 60
      }
    } catch {
      return null
    }
  }

  // ── Filtrar centros por distancia por carretera ────────────────────
  async filtrarPorCarretera(
    centros: Array<{ ccen: number; lat: number; lng: number; [key: string]: any }>,
    origenLat: number,
    origenLng: number,
    maxKm: number,
    haversineFactor = 1.6,
    onProgress?: (checked: number, total: number) => void
  ): Promise<RoutingResult[]> {

    const candidatos = centros.filter(c => {
      const d = this.haversineKm(origenLat, origenLng, c.lat, c.lng)
      const pasa = d <= maxKm * haversineFactor
      console.log(
        `Pre-filtro ${c.ccen}: ${d.toFixed(1)}km haversine, ` +
        `límite=${(maxKm * haversineFactor).toFixed(1)}km → ${pasa ? '✓' : '✗'}`
      )
      return pasa
    })

    console.log(`OSRM: ${candidatos.length} candidatos (de ${centros.length} total)`)

    const resultados: RoutingResult[] = []
    let checked = 0
    const BATCH = 4

    for (let i = 0; i < candidatos.length; i += BATCH) {
      const lote = candidatos.slice(i, i + BATCH)

      await Promise.all(lote.map(async centro => {
        const key = this.cacheKey(centro.ccen, origenLat, origenLng)
        let resultado: RoutingResult

        if (this.cache.has(key)) {
          resultado = this.cache.get(key)!
          console.log(`Caché ${centro.ccen}: ${resultado.distanciaKm.toFixed(1)}km`)
        } else {
          const routing = await this.distanciaCarreteraKm(
            origenLat, origenLng, centro.lat, centro.lng
          )

          if (routing === null) {
            const dHav = this.haversineKm(origenLat, origenLng, centro.lat, centro.lng)
            resultado = {
              ccen: centro.ccen,
              distanciaKm: dHav * 1.3,
              duracionMin: 0,
              esFallback: true
            }
            console.warn(`Fallback ${centro.ccen}: ~${resultado.distanciaKm.toFixed(1)}km`)
          } else {
            resultado = {
              ccen: centro.ccen,
              distanciaKm: routing.distanciaKm,
              duracionMin: routing.duracionMin
            }
            console.log(`OSRM ${centro.ccen}: ${resultado.distanciaKm.toFixed(1)}km, ${resultado.duracionMin.toFixed(0)}min`)
          }

          this.cache.set(key, resultado)
        }

        if (resultado.distanciaKm <= maxKm) {
          resultados.push(resultado)
        }

        checked++
        onProgress?.(checked, candidatos.length)
      }))
    }

    console.log(`✅ ${resultados.length} centros dentro de ${maxKm}km`)
    return resultados
  }

  // ── Distancia para el popup ────────────────────────────────────────
  async distanciaParaPopup(
    ccen: number,
    origenLat: number, origenLng: number,
    destinoLat: number, destinoLng: number
  ): Promise<RoutingResult | null> {
    const key = this.cacheKey(ccen, origenLat, origenLng)

    if (this.cache.has(key)) {
      const cached = this.cache.get(key)!
      console.log(`Popup caché ${ccen}: ${cached.distanciaKm.toFixed(1)}km`)
      return cached
    }

    const routing = await this.distanciaCarreteraKm(
      origenLat, origenLng, destinoLat, destinoLng
    )

    let resultado: RoutingResult
    if (!routing) {
      const dHav = this.haversineKm(origenLat, origenLng, destinoLat, destinoLng)
      resultado = { ccen, distanciaKm: dHav * 1.3, duracionMin: 0, esFallback: true }
      console.log(`Popup fallback ${ccen}: ~${resultado.distanciaKm.toFixed(1)}km`)
    } else {
      resultado = { ccen, distanciaKm: routing.distanciaKm, duracionMin: routing.duracionMin }
      console.log(`Popup OSRM ${ccen}: ${resultado.distanciaKm.toFixed(1)}km, ${resultado.duracionMin.toFixed(0)}min`)
    }

    this.cache.set(key, resultado)
    return resultado
  }

  // ── Ruta por carretera CON geometría (para dibujarla en el mapa) ───
  // Pide a OSRM la línea completa (overview=full, geometries=geojson).
  // Si OSRM no responde, devuelve una línea recta origen→destino con
  // distancia Haversine×1.3 marcada como esFallback.
  async rutaConGeometria(
    origenLat: number, origenLng: number,
    destinoLat: number, destinoLng: number
  ): Promise<RutaCarretera> {
    const disponible = await this.comprobarOSRM()

    if (disponible) {
      const url =
        `${this.OSRM_BASE}/${origenLng},${origenLat};${destinoLng},${destinoLat}` +
        `?overview=full&geometries=geojson&steps=true`
      try {
        const res = await this.fetchConTimeout(url)
        if (res.ok) {
          const data = await res.json()
          if (data.code === 'Ok' && data.routes?.length) {
            const r = data.routes[0]
            const coords = r.geometry?.coordinates as [number, number][] | undefined
            if (coords && coords.length) {
              return {
                distanciaKm: r.distance / 1000,
                duracionMin: r.duration / 60,
                coordinates: coords,
                tramos: this.extraerTramos(r),
                instrucciones: this.extraerInstrucciones(r)
              }
            }
          }
        }
      } catch (e: any) {
        console.warn('Ruta OSRM falló, usando línea recta:', e?.message || e)
      }
    }

    // Fallback: línea recta origen → destino
    const dHav = this.haversineKm(origenLat, origenLng, destinoLat, destinoLng)
    return {
      distanciaKm: dHav * 1.3,
      duracionMin: 0,
      coordinates: [[origenLng, origenLat], [destinoLng, destinoLat]],
      esFallback: true
    }
  }

  // Extrae los pasos de navegación (maniobras) con su distancia.
  // distHastaManiobraM = distancia del paso ANTERIOR (lo que recorres hasta la maniobra).
  private extraerInstrucciones(route: any): PasoRuta[] {
    const todos: any[] = []
    for (const leg of (route?.legs || [])) {
      for (const step of (leg?.steps || [])) todos.push(step)
    }
    const pasos: PasoRuta[] = []
    for (let i = 0; i < todos.length; i++) {
      const s = todos[i]
      const m = s?.maneuver || {}
      pasos.push({
        tipo: m.type || '',
        modificador: m.modifier || '',
        salida: typeof m.exit === 'number' ? m.exit : undefined,
        via: (s?.name || '').trim(),
        distanciaM: s?.distance || 0,
        distHastaManiobraM: i > 0 ? (todos[i - 1].distance || 0) : 0
      })
    }
    return pasos
  }

  // Agrupa los pasos (steps) de OSRM por nombre de vía, sumando su distancia.
  // Combina pasos consecutivos que van por la misma vía en un solo tramo.
  private extraerTramos(route: any): TramoRuta[] {
    const tramos: TramoRuta[] = []
    const legs = route?.legs || []
    let acumulado = 0                               // km acumulados de la ruta
    for (const leg of legs) {
      for (const step of (leg?.steps || [])) {
        const km = (step?.distance || 0) / 1000
        if (km <= 0) continue                       // ignora el paso final de llegada
        const via = this.nombreVia(step)
        const geom = (step?.geometry?.coordinates || []) as [number, number][]
        const ultimo = tramos[tramos.length - 1]
        if (ultimo && ultimo.via === via) {
          ultimo.km += km                           // mismo nombre → acumula
          if (geom.length) {
            ultimo.coordenadas = (ultimo.coordenadas || []).concat(geom)
          }
        } else {
          tramos.push({ via, km, kmInicio: acumulado, coordenadas: geom.slice() })
        }
        acumulado += km
      }
    }
    return tramos
  }

  // Nombre legible de la vía de un paso: usa el nombre y/o la referencia (A-1, N-240…).
  // Devuelve '' si OSM no da ninguno.
  private nombreVia(step: any): string {
    const name = (step?.name || '').trim()
    const ref = (step?.ref || '').trim()
    if (name && ref) return `${name} (${ref})`
    if (ref) return ref
    if (name) return name
    return ''
  }

  // ── Formato ────────────────────────────────────────────────────────
  formatearDistancia(km: number, esFallback = false): string {
    const base = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`
    return esFallback ? `~${base}` : base
  }

  formatearDuracion(min: number): string {
    if (!min || min === 0) return ''
    if (min < 60) return `${Math.round(min)} min`
    const h = Math.floor(min / 60)
    const m = Math.round(min % 60)
    return m > 0 ? `${h}h ${m}min` : `${h}h`
  }

  limpiarCache(): void {
    this.cache.clear()
    this.osrmDisponible = null
  }
}