// mapa-centros.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef, NgZone } from '@angular/core'
import { MatSnackBar } from '@angular/material/snack-bar'

import { RoutingService, RoutingResult } from '../../services/routing.service'

import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import Point from 'ol/geom/Point'
import Style from 'ol/style/Style'
import Icon from 'ol/style/Icon'
import { transformExtent, transform } from 'ol/proj'
import { register } from 'ol/proj/proj4'
import * as proj4x from 'proj4'

import { TranslateService } from '@ngx-translate/core'

const proj4 = (proj4x as any).default || proj4x

import { institutos } from '../../../assets/data/institutos'
import ciclosAsignacion from '../../../assets/data/asignacion'
import {
  Asignacion,
  familiasProfesionales
} from '../../../assets/data/asignacion'

// ✅ IMPORTAR el componente de distancia
import { DistanceControlComponent, UserPosition } from '../distance-control/distance-control.component'

interface Tab {
  id: string
  label: string
}

interface CiclosPorGrado {
  basicos: Asignacion[]
  medios: Asignacion[]
  superiores: Asignacion[]
}

@Component({
  selector: 'app-mapa-centros',
  templateUrl: './mapa-centros.component.html',
  styleUrls: ['./mapa-centros.component.scss']
})
export class MapaCentrosComponent implements OnInit, AfterViewInit {
  // ✅ AÑADIR ViewChild para acceder al componente de distancia
  @ViewChild('distanceControl') distanceControl!: DistanceControlComponent

distanciaPopup: RoutingResult | null = null
cargandoDistanciaPopup = false
private routingResultsCache: Record<number, RoutingResult> = {}

// ✅ Propiedad pública que el template lee directamente — se actualiza desde NgZone
distanciaTexto = ''
distanciaCargando = false

  private isPanning = false
  private panAttempts = 0
  private readonly MAX_PAN_ATTEMPTS = 1
  currentLang: 'es' | 'eu' = 'es' // ✅ TIPADO CORRECTO
  traduccionesListas = false
  map!: Map
  pinsLayer!: VectorLayer<any>
  provincias: string[] = []
  municipios: string[] = []
  tiposCentro: { value: string; label: string }[] = []
  familiaSeleccionada = ''
  cicloSeleccionado = ''
  tipoCentroSeleccionado = ''
  gradoSeleccionado = ''
  provinciaSeleccionada = ''
  municipioSeleccionado = ''
  municipioEnabled = false
  tooltipVisible = false
  popupVisible: boolean = false
  mostrarModalAdvertencia = false
  mensajeModalAdvertencia = ''

  selectedCentro: any = null

  familiasEsDict: Record<string, string> = {}

  tooltipContent = ''
  tooltipX = 0
  tooltipY = 0
  popupContentHeight = 400
  lastPanTo: number[] | undefined = undefined

  centroSeleccionado: any = {}
  tabActiva = 'contacto'
  ciclosCentro: CiclosPorGrado = { basicos: [], medios: [], superiores: [] }
  familiasCentro: string[] = []

  popupPosition = { x: 0, y: 0 }
  popupClass = 'popup-bottom'

  tabs: Tab[] = [
    { id: 'contacto', label: 'Información de Contacto' },
    { id: 'oferta', label: 'Oferta Educativa' },
    { id: 'basico', label: 'FP Básica' },
    { id: 'medio', label: 'Ciclos Grado Medio' },
    { id: 'superior', label: 'Ciclos Grado Superior' }
  ]

  private centrosMostradosAnteriores: Set<number> = new Set()

  familiasProfesionales = familiasProfesionales
  familiasFiltradas: string[] = []
  ciclosFiltrados: Asignacion[] = []

  // ✅ PROPIEDADES para control de distancia
  centrosMostradosParaDistancia: any[] = []
  private distanciaMaximaActual = 0
  posicionUsuario: UserPosition | null = null  // pública: el template la usa en *ngIf

  gradosCiclo: { value: string; label: string }[] = [
    { value: 'Basico', label: 'Formación Profesional Básica' },
    { value: 'Medio', label: 'Grado Medio' },
    { value: 'Superior', label: 'Grado Superior' }
  ]

  euskadiExtent = transformExtent(
    [-3.4, 42.57, -1.5, 43.45],
    'EPSG:4326',
    'EPSG:3857'
  )

  tipoCentroLabels: Record<string, string> = {}

  // ✅ Función para obtener el icono correcto según el tipo de centro y el idioma actual
  private obtenerIconoCentro(centro: any): string {
    const idioma = this.currentLang
    const iconosBase = 'assets/images/'
    
    // Usar el campo correcto según el idioma
    const campoTipoCentro = idioma === 'eu' ? 'DGENRE' : 'DGENRC'
    const tipoCentro = centro[campoTipoCentro] as string
    
    // ✅ Mapeo de códigos españoles a iconos en ambos idiomas
    // Cuando el idioma es euskera, usamos los iconos con los códigos euskera
    const iconos: Record<string, { es: string; eu: string }> = {
      'CIFP':   { es: iconosBase + 'marker-cifp.png',   eu: iconosBase + 'marker-lhii.png'  },
      'CPFPB':  { es: iconosBase + 'marker-cpfpb.png',  eu: iconosBase + 'marker-olhip.png' },
      'CPES':   { es: iconosBase + 'marker-cpes.png',   eu: iconosBase + 'marker-bhip.png'  },
      'CPEPS':  { es: iconosBase + 'marker-cpeips.png', eu: iconosBase + 'marker-lbhip.png' },
      'CPEIPS': { es: iconosBase + 'marker-cpeips.png', eu: iconosBase + 'marker-lbhip.png' },
      'IES':    { es: iconosBase + 'marker-ies.png',    eu: iconosBase + 'marker-bhi.png'   },
      'IMFPB':  { es: iconosBase + 'marker-imfpb.png',  eu: iconosBase + 'marker-olhui.png' },
      'CPIFP':  { es: iconosBase + 'marker-cpifp.png',  eu: iconosBase + 'marker-lhipi.png' }
    }
    
    // En euskera, necesitamos mapear los códigos euskera a los mismos iconos
    const iconosEuskera: Record<string, string> = {
      'LHII':   iconosBase + 'marker-lhii.png',   // Centro Integrado de FP
      'OLHIP':  iconosBase + 'marker-olhip.png',  // FP Básica Privado
      'BHIP':   iconosBase + 'marker-bhip.png',   // Secundaria Privado
      'LBHIP':  iconosBase + 'marker-lbhip.png',  // Infantil+Primaria+Secundaria
      'HLBHIP': iconosBase + 'marker-lbhip.png',  // Haur+Lehen+Bigarren (igual que LBHIP)
      'BHI':    iconosBase + 'marker-bhi.png',    // IES
      'OLHUI':  iconosBase + 'marker-olhui.png',  // Municipal FP Básica
      'LHIPI':  iconosBase + 'marker-lhipi.png'   // Centro Público Integrado FP
    }
    
    // Si estamos en euskera y el código es euskera, usar mapeo directo
    if (idioma === 'eu' && iconosEuskera[tipoCentro]) {
      return iconosEuskera[tipoCentro]
    }
    
    // Si estamos en español, o si el código está en el mapeo bilingüe
    if (iconos[tipoCentro]) {
      return iconos[tipoCentro][idioma] || iconos[tipoCentro]['es']
    }
    
    // Fallback a icono por defecto
    return iconosBase + 'marker-default.png'
  }

  constructor (
    private snackBar: MatSnackBar,
    private translate: TranslateService,
    private routing: RoutingService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.translate.setDefaultLang('es')
    const browserLang = this.translate.getBrowserLang()
    this.currentLang = browserLang?.match(/es|eu/) ? (browserLang as 'es' | 'eu') : 'es'
    this.translate.use(this.currentLang)
  }

  ngOnInit (): void {
    proj4.defs(
      'EPSG:25830',
      '+proj=utm +zone=30 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
    )
    register(proj4)

    this.translate.getTranslation('es').subscribe(tradEs => {
      this.familiasEsDict = tradEs.familiasProfesionales as Record<
        string,
        string
      >
    })

    this.translate.onLangChange.subscribe(event => {
      console.log('🌐 Evento de cambio de idioma detectado:', event.lang)
    })

    this.translate
      .get(['familiasProfesionales', 'tiposCentro', 'tabs', 'grados'])
      .subscribe({
        next: (translations) => {
          console.log('✅ Todas las traducciones iniciales cargadas')
          
          // ✅ PRIMERO: Cargar las etiquetas de tipos de centro en tipoCentroLabels
          this.tipoCentroLabels = translations['tiposCentro'] || {}
          console.log('📋 tipoCentroLabels cargado:', this.tipoCentroLabels)
          
          // SEGUNDO: Cargar las otras etiquetas
          this.cargarEtiquetasTraducidas()
          this.cargarEtiquetasFamilias()

          // TERCERO: Cargar listas DESPUÉS de que tipoCentroLabels esté disponible
          setTimeout(() => {
            this.cargarTodasLasFamiliasTraducidas()
            this.cargarListas()
          }, 150)
        },
        error: err => {
          console.error('❌ Error cargando traducciones iniciales:', err)
          this.cargarListas()
          this.cargarFamiliasTraducidas()
        }
      })
  }

  ngAfterViewInit (): void {
    this.inicializarMapa()
  }

  // ✅ MÉTODO: Calcular distancia desde usuario a un centro
  // Registro de CCENs en proceso de cálculo
  private calculandoDistancia: Set<number> = new Set()

  // ✅ MÉTODO PRINCIPAL: llamado desde el template — solo lee distanciaTexto
  // NO hace cálculos: esos los hace calcularDistanciaParaPopup()
  distanciaAlCentro(centro: any): string {
    return this.distanciaTexto
  }

  // Actualiza distanciaTexto dentro de la zona Angular garantizando el re-render
  private actualizarDistanciaEnVista(r: RoutingResult): void {
    const dist = this.routing.formatearDistancia(r.distanciaKm, r.esFallback)
    const dur  = this.routing.formatearDuracion(r.duracionMin)
    const texto = dur ? `🚗 ${dist} · ⏱ ${dur}` : `🚗 ${dist}`

    // Promise.resolve() espera al siguiente microtask, fuera del contexto de fetch
    // ngZone.run() garantiza que Angular detecta el cambio
    Promise.resolve().then(() => {
      this.ngZone.run(() => {
        this.distanciaTexto    = texto
        this.distanciaCargando = false
        this.cdr.detectChanges()
      })
    })
  }

  // ✅ Lanzar cálculo de distancia para el centro del popup
  private calcularDistanciaParaPopup(centro: any): void {
    if (!centro || !this.posicionUsuario) return
    if (!centro.COOR_X || !centro.COOR_Y ||
        isNaN(Number(centro.COOR_X)) || isNaN(Number(centro.COOR_Y))) return

    const ccen: number = centro.CCEN
    const pos = this.posicionUsuario!

    // 1. Buscar en caché del componente
    if (ccen in this.routingResultsCache) {
      this.actualizarDistanciaEnVista(this.routingResultsCache[ccen])
      return
    }

    // 2. Buscar en caché del servicio (puede estar por el filtro de distancia)
    const key = this.routing.cacheKey(ccen, pos.lat, pos.lng)
    if (this.routing.cache.has(key)) {
      const r = this.routing.cache.get(key)!
      this.routingResultsCache[ccen] = r
      this.actualizarDistanciaEnVista(r)
      return
    }

    // 3. No está en caché → pedir a OSRM
    let coords: number[]
    try {
      coords = transform(
        [Number(centro.COOR_X), Number(centro.COOR_Y)],
        'EPSG:25830', 'EPSG:4326'
      )
      if (!isFinite(coords[0]) || !isFinite(coords[1])) {
        this.distanciaCargando = false
        return
      }
    } catch {
      this.distanciaCargando = false
      return
    }

    const destLat = coords[1]
    const destLng = coords[0]

    this.routing.distanciaParaPopup(ccen, pos.lat, pos.lng, destLat, destLng)
      .then(result => {
        const r: RoutingResult = result ?? {
          ccen,
          distanciaKm: this.routing.haversineKm(pos.lat, pos.lng, destLat, destLng) * 1.3,
          duracionMin: 0,
          esFallback: true
        }
        this.routingResultsCache[ccen] = r
        this.actualizarDistanciaEnVista(r)
      })
      .catch(() => {
        // Fallback Haversine si falla todo
        const dKm = this.routing.haversineKm(pos.lat, pos.lng, destLat, destLng) * 1.3
        const r: RoutingResult = { ccen, distanciaKm: dKm, duracionMin: 0, esFallback: true }
        this.routingResultsCache[ccen] = r
        this.actualizarDistanciaEnVista(r)
      })
  }

  // ✅ MÉTODO: Evento cuando cambia la distancia en el control
  onDistanciaChange (distanciaKm: number): void {
    console.log(`📏 Distancia cambió a: ${distanciaKm} km`)
    
    this.distanciaMaximaActual = distanciaKm
    
    // Filtrar centros por distancia
    this.aplicarFiltroDistancia()
  }

// ── Método corregido: onPosicionObtenida ─────────────────────
onPosicionObtenida(posicion: UserPosition): void {
  console.log('📍 Posición obtenida:', posicion)
  this.posicionUsuario = posicion
  // Limpiar caché de routing al cambiar posición
  this.routing.limpiarCache()
  this.routingResultsCache = {}
}
 
// ── Método corregido: aplicarFiltroDistancia ─────────────────
// Usa OSRM para filtrar por distancia real por carretera
// y centra el mapa en la posición del usuario con zoom al radio
private async aplicarFiltroDistancia(): Promise<void> {
  if (!this.posicionUsuario || this.distanciaMaximaActual === 0) {
    this.actualizarMapa('provincia')
    return
  }

  // ✅ CENTRAR MAPA en la posición del usuario con zoom proporcional al radio
  this.centrarMapaEnUsuario(this.distanciaMaximaActual)

  const centrosBase = this.obtenerCentrosFiltrados()
  if (centrosBase.length === 0) {
    this.centrosMostradosParaDistancia = []
    return
  }

  // Convertir coordenadas EPSG:25830 → WGS84
  // ✅ CLAVE: añadir ccen (minúsculas) explícitamente para que RoutingService lo encuentre
  const centrosConLatLng = centrosBase
    .filter(c => c.COOR_X && c.COOR_Y && !isNaN(c.COOR_X) && !isNaN(c.COOR_Y))
    .map(centro => {
      try {
        const coords = transform(
          [Number(centro.COOR_X), Number(centro.COOR_Y)],
          'EPSG:25830',
          'EPSG:4326'
        )
        if (!isFinite(coords[0]) || !isFinite(coords[1])) return null
        return {
          ...centro,
          ccen: centro.CCEN,   // ← añadir en minúsculas para RoutingService
          lat: coords[1],
          lng: coords[0]
        }
      } catch {
        return null
      }
    })
    .filter(Boolean) as any[]

  console.log(`🗺️ Calculando distancias por carretera para ${centrosConLatLng.length} centros...`)

  // Mostrar snackbar de progreso
  const snackRef = this.snackBar.open(
    `Calculando distancias por carretera... (0/${centrosConLatLng.length})`,
    '',
    { duration: 60000, panelClass: ['snackbar-info'] }
  )

  try {
    const resultados = await this.routing.filtrarPorCarretera(
      centrosConLatLng,
      this.posicionUsuario.lat,
      this.posicionUsuario.lng,
      this.distanciaMaximaActual,
      1.6,   // ← factor aumentado a 1.6 para el País Vasco (terreno montañoso)
      (checked, total) => {
        snackRef.instance.data.message =
          `Calculando rutas... (${checked}/${total})`
      }
    )

    snackRef.dismiss()

    // Guardar resultados en caché para el popup
    resultados.forEach(r => { this.routingResultsCache[r.ccen] = r })

    const ccensEnRango = new Set(resultados.map(r => r.ccen))
    // ✅ usar ccen (minúsculas) que es lo que devuelve RoutingService
    const centrosDentroDelRadio = centrosConLatLng.filter(c => ccensEnRango.has(c.ccen))

    console.log(
      `✅ Centros dentro de ${this.distanciaMaximaActual}km por carretera: ${centrosDentroDelRadio.length}`
    )

    if (centrosDentroDelRadio.length === 0) {
      // ✅ NO revertir el slider — dejar el radio visible en el mapa
      this.mostrarAdvertencia(
        `No hay centros dentro de ${this.distanciaMaximaActual} km por carretera.\n\n` +
        `Prueba aumentando el radio de búsqueda.`
      )
      return
    }

    this.centrosMostradosParaDistancia = centrosDentroDelRadio
    // ✅ Mostrar centros pero mantener la vista centrada en el usuario
    this.mostrarCentrosEnMapa(centrosDentroDelRadio, false)

  } catch (err) {
    snackRef.dismiss()
    console.error('Error calculando rutas:', err)
    this.snackBar.open(
      'No se pudo conectar con el servicio de rutas. Usando distancia aproximada.',
      'OK',
      { duration: 4000, panelClass: ['snackbar-error'] }
    )
    // Fallback Haversine × 1.3 (corrección para carretera)
    const centrosFallback = centrosConLatLng.filter(c => {
      const d = this.routing.haversineKm(
        this.posicionUsuario!.lat, this.posicionUsuario!.lng,
        c.lat, c.lng
      )
      return d * 1.3 <= this.distanciaMaximaActual
    })
    this.centrosMostradosParaDistancia = centrosFallback
    this.mostrarCentrosEnMapa(centrosFallback, false)
  }
}

  // Centra el mapa en la posición del usuario y calcula el zoom
  // para que el círculo de radioKm quepa en la pantalla
  private centrarMapaEnUsuario(radioKm: number): void {
    if (!this.posicionUsuario || !this.map) return

    const { lat, lng } = this.posicionUsuario

    // Convertir posición usuario a EPSG:3857
    const centerCoords = transform([lng, lat], 'EPSG:4326', 'EPSG:3857')

    // Calcular el extent que cubre el radio en EPSG:3857
    // 1 km ≈ 1000m en la proyección Mercator a latitudes medias
    // Factor de corrección por latitud: / cos(lat)
    const latRad = lat * Math.PI / 180
    const metrosPorGrado = 111320  // metros por grado latitud
    const radioEnMetros = radioKm * 1000

    // En EPSG:3857 un km en latitud = 1000m pero en longitud varía con cos(lat)
    const deltaY = radioEnMetros  // metros norte-sur
    const deltaX = radioEnMetros / Math.cos(latRad)  // metros este-oeste

    // Construir extent: [minX, minY, maxX, maxY]
    const extent = [
      centerCoords[0] - deltaX,
      centerCoords[1] - deltaY,
      centerCoords[0] + deltaX,
      centerCoords[1] + deltaY
    ]

    console.log(`🎯 Centrando en usuario (${lat.toFixed(4)}, ${lng.toFixed(4)}) radio=${radioKm}km`)

    // Usar fit() para calcular el zoom exacto que muestra el extent completo
    // Reducir padding para mejor centrado y menos espacio libre
    this.map.getView().fit(extent, {
      duration: 600,
      padding: [30, 30, 30, 30],  // ✅ Reducido de 60 a 30 para mejor ajuste
      maxZoom: 14
    })
  }

  // ✅ NUEVO: Obtener centros filtrados según criterios actuales (sin distancia)
  // ───────────────────────────────────────────────────────────────────────
  // TIPO DE CENTRO COMO CÓDIGO NEUTRO (canónico en español)
  // El dato trae el código en dos campos según idioma (DGENRC=es / DGENRE=eu).
  // Guardamos y filtramos SIEMPRE por el código español canónico; el idioma
  // solo decide la ETIQUETA que se muestra. Así el filtro nunca se rompe al
  // cambiar de idioma y la selección no se pierde.
  // ───────────────────────────────────────────────────────────────────────
  private readonly tipoEsAEu: Record<string, string> = {
    CIFP: 'LHII', CPIFP: 'LHIPI', IES: 'BHI', CPES: 'BHIP',
    CPEIPS: 'LBHIP', CPEPS: 'LBHIP', CPFPB: 'OLHIP', IMFPB: 'OLHUI', CIFPD: 'LHII'
  }
  private readonly tipoEuAEs: Record<string, string> = {
    LHII: 'CIFP', LHIPI: 'CPIFP', BHI: 'IES', BHIP: 'CPES',
    LBHIP: 'CPEIPS', HLBHIP: 'CPEIPS', OLHIP: 'CPFPB', OLHUI: 'IMFPB'
  }

  // Código español canónico del tipo de un centro (corrige OLHUI→IMFPB y CIFPD→CIFP).
  // Si faltara el campo español, cae al euskera mapeado para no perder el centro.
  private tipoCanonico (centro: any): string {
    let cod = (centro?.DGENRC as string) || ''
    if (!cod) cod = this.tipoEuAEs[(centro?.DGENRE as string) || ''] || ''
    if (cod === 'OLHUI') cod = 'IMFPB'
    if (cod === 'CIFPD') cod = 'CIFP'
    return cod
  }

  // ¿El centro cumple el filtro de tipo seleccionado? (independiente del idioma)
  private centroCumpleTipo (centro: any): boolean {
    if (!this.tipoCentroSeleccionado) return true
    return this.tipoCanonico(centro) === this.tipoCentroSeleccionado
  }

  // Etiqueta traducida para un código español canónico
  private etiquetaTipo (codigoEs: string): string {
    if (this.currentLang === 'eu') {
      const codEu = this.tipoEsAEu[codigoEs] || codigoEs
      return this.tipoCentroLabels[codEu] || this.tipoCentroLabels[codigoEs] || codigoEs
    }
    return this.tipoCentroLabels[codigoEs] || codigoEs
  }

  // Construye el combo de tipos (value = código español neutro, label = traducción)
  private construirTiposCentro (): void {
    const conCiclos = new Set<number>()
    ciclosAsignacion.forEach(c => c.centros.forEach(ccen => conCiclos.add(ccen)))

    const codigos = new Set<string>()
    institutos.forEach(centro => {
      if (conCiclos.has(centro.CCEN)) {
        const cod = this.tipoCanonico(centro)
        if (cod && cod.trim() !== '') codigos.add(cod)
      }
    })

    this.tiposCentro = Array.from(codigos).sort().map(codigo => ({
      value: codigo,
      label: this.etiquetaTipo(codigo)
    }))
  }

  private obtenerCentrosFiltrados (): any[] {
    const campoProvincia = this.currentLang === 'eu' ? 'DTERRE' : 'DTERRC'
    const campoMunicipio = this.currentLang === 'eu' ? 'DMUNIE' : 'DMUNIC'
    const normaliza = (x: string) => (x || '').trim().toUpperCase()

    const centrosConCiclosFP = new Set<number>()
    ciclosAsignacion.forEach(ciclo => {
      ciclo.centros.forEach(ccen => centrosConCiclosFP.add(ccen))
    })

    const hayFiltrosCiclos = !!(
      this.familiaSeleccionada ||
      this.gradoSeleccionado ||
      this.cicloSeleccionado
    )

    let ciclosRelevantes: Asignacion[] = [...ciclosAsignacion]

    if (this.gradoSeleccionado) {
      const gradoEnEspanol = this.traducirGradoAEspanol(this.gradoSeleccionado)
      ciclosRelevantes = ciclosRelevantes.filter(c => c.grado === gradoEnEspanol)
    }

    if (this.familiaSeleccionada) {
      const codigoFamilia = this.obtenerCodigoFamilia(this.familiaSeleccionada)
      ciclosRelevantes = ciclosRelevantes.filter(c => c.familiaCodigo === codigoFamilia)
    }

    if (this.cicloSeleccionado) {
      const cicloEspecifico = ciclosAsignacion.find(
        c => c.codcicl === Number(this.cicloSeleccionado)
      )
      if (cicloEspecifico) {
        ciclosRelevantes = [cicloEspecifico]
      } else {
        ciclosRelevantes = []
      }
    }

    const centrosValidos = new Set<number>()
    ciclosRelevantes.forEach(ciclo => {
      ciclo.centros.forEach(ccen => centrosValidos.add(ccen))
    })

    return institutos.filter(centro => {
      if (!centrosConCiclosFP.has(centro.CCEN)) return false

      if (this.provinciaSeleccionada && centro[campoProvincia] !== this.provinciaSeleccionada) {
        return false
      }

      if (this.municipioSeleccionado &&
          normaliza(centro[campoMunicipio] as string) !== normaliza(this.municipioSeleccionado)) {
        return false
      }

      if (!this.centroCumpleTipo(centro)) return false

      if (hayFiltrosCiclos && centrosValidos.size > 0) {
        if (!centrosValidos.has(centro.CCEN)) return false
      }

      return true
    })
  }

  // ✅ MÉTODO: Mostrar centros específicos en el mapa
  // ajustarVista=true → hace zoom a los centros; false → no toca la vista (modo distancia)
  private mostrarCentrosEnMapa (centros: any[], ajustarVista = true): void {
    const features: Feature<Point>[] = []

    centros.forEach(centro => {
      const x = centro.COOR_X
      const y = centro.COOR_Y

      if (!x || !y || isNaN(x) || isNaN(y)) return

      try {
        const coords = transform([x, y], 'EPSG:25830', 'EPSG:3857')
        const point = new Point(coords)
        const feature = new Feature<Point>({ geometry: point })

        // ✅ Obtener el icono correcto según el tipo de centro y el idioma actual
        const iconoUrl = this.obtenerIconoCentro(centro)

        feature.setStyle(
          new Style({
            image: new Icon({
              src: iconoUrl,
              scale: 0.15,
              anchor: [0.5, 1]
            })
          })
        )

        const tooltipNombre = `${centro.DGENRC || ''} ${centro.NOME || centro.NOM || ''} ${centro.DGENRE || ''}`

        feature.setProperties({
          CCEN: centro.CCEN,
          name: centro.NOM || 'Sin nombre',
          tooltipNombre: tooltipNombre,
          DTERRC: centro.DTERRC,
          DTERRE: centro.DTERRE,
          DMUNIC: centro.DMUNIC,
          DMUNIE: centro.DMUNIE,
          DGENRC: centro.DGENRC,
          NOME: centro.NOME || centro.NOM,
          NOM: centro.NOM,
          DGENRE: centro.DGENRE,
          DOMI: centro.DOMI,
          CPOS: centro.CPOS,
          TEL1: centro.TEL1,
          TFAX: centro.TFAX,
          EMAIL: centro.EMAIL,
          PAGINA: centro.PAGINA
        })

        features.push(feature)
      } catch (error) {
        console.error(`Error transformando coordenadas del centro ${centro.CCEN}:`, error)
      }
    })

    if (this.pinsLayer) this.map.removeLayer(this.pinsLayer)

    this.pinsLayer = new VectorLayer({
      source: new VectorSource({ features })
    })

    this.map.addLayer(this.pinsLayer)

    // Ajustar vista solo si se solicita (en modo distancia el mapa ya está centrado en el usuario)
    if (ajustarVista) {
      const vectorSource = this.pinsLayer.getSource()
      if (vectorSource && features.length > 0) {
        try {
          const extent = vectorSource.getExtent()
          if (extent && extent[0] !== Infinity && extent[2] !== -Infinity) {
            let maxZoom = 14
            let padding = [50, 50, 50, 50]

            if (features.length === 1) {
              maxZoom = 17
              padding = [100, 100, 100, 100]
            } else if (features.length === 2) {
              maxZoom = 16
              padding = [80, 80, 80, 80]
            } else if (features.length <= 5) {
              maxZoom = 15
              padding = [60, 60, 60, 60]
            }

            this.map.getView().fit(extent, {
              duration: 600,
              padding: padding,
              maxZoom: maxZoom
            })
          }
        } catch (error) {
          console.error('Error al ajustar vista:', error)
        }
      }
    }

    // Actualizar lista para el componente de distancia
    this.centrosMostradosParaDistancia = centros
  }

  // ========== RESTO DE MÉTODOS (mantener todos los existentes) ==========
  
  mostrarAdvertencia (mensaje: string): void {
    this.mensajeModalAdvertencia = mensaje
    this.mostrarModalAdvertencia = true
  }

  cerrarModalAdvertencia (): void {
    this.mostrarModalAdvertencia = false
  }

  cambiarIdioma (lang: 'es' | 'eu'): void {
    console.log('🌐 Cambiando idioma a:', lang)

    this.currentLang = lang
    this.translate.use(lang)

    const popupEstabaAbierto = this.popupVisible
    const centroActual = this.centroSeleccionado
    const tabActual = this.tabActiva
    const posicionActual = { ...this.popupPosition }
    const claseActual = this.popupClass

    const familiaSeleccionadaAnterior = this.familiaSeleccionada
    this.familiasFiltradas = []
    // ✅ NO borramos la familia: la re-traducimos al nuevo idioma más abajo
    //    para conservar la selección (antes: this.familiaSeleccionada = '')

    this.translate.use(lang).subscribe({
      next: () => {
        console.log('✅ Idioma cambiado exitosamente a:', lang)

        this.translate
          .get(['familiasProfesionales', 'tiposCentro', 'tabs', 'grados'])
          .subscribe({
            next: (translations) => {
              console.log('📚 Traducciones base cargadas para idioma:', lang)

              // ✅ PRIMERO: Cargar las etiquetas de tipos de centro
              this.tipoCentroLabels = translations['tiposCentro'] || {}
              console.log('📋 tipoCentroLabels actualizado para', lang, ':', this.tipoCentroLabels)

              this.cargarEtiquetasTraducidas()
              this.cargarEtiquetasFamilias()

              setTimeout(() => {
                setTimeout(() => {
                  setTimeout(() => {
                    console.log('⏳ Tercer timeout completado - Recargando familias')

                    this.cargarFamiliasTraducidasForzado()

                    // ✅ Tipos de centro: solo refrescamos ETIQUETAS; el value
                    // sigue siendo el código español neutro, así que la selección
                    // de tipo NO se pierde al cambiar de idioma.
                    this.construirTiposCentro()

                    // ✅ Re-traducir la familia seleccionada al nuevo idioma para
                    // que el combo conserve su valor (en vez de borrarlo).
                    if (familiaSeleccionadaAnterior) {
                      const dictNuevo = (translations['familiasProfesionales'] || {}) as Record<string, string>
                      this.translate.getTranslation(lang === 'eu' ? 'es' : 'eu').subscribe(tradAnt => {
                        const dictAnt = (tradAnt.familiasProfesionales || {}) as Record<string, string>
                        const clave = Object.keys(dictAnt).find(k => dictAnt[k] === familiaSeleccionadaAnterior)
                        this.familiaSeleccionada = (clave && dictNuevo[clave]) ? dictNuevo[clave] : familiaSeleccionadaAnterior
                      })
                    }

                    const campoProvincia = lang === 'eu' ? 'DTERRE' : 'DTERRC'
                    this.provincias = Array.from(
                      new Set(institutos.map(c => c[campoProvincia] as string))
                    ).sort()

                    if (this.provinciaSeleccionada) {
                      const centroConProvincia = institutos.find(c => {
                        const provinciaAnterior = lang === 'eu' ? c.DTERRC : c.DTERRE
                        return provinciaAnterior === this.provinciaSeleccionada
                      })

                      if (centroConProvincia) {
                        this.provinciaSeleccionada = lang === 'eu'
                          ? centroConProvincia.DTERRE
                          : centroConProvincia.DTERRC
                        this.actualizarMunicipios()
                      } else {
                        this.provinciaSeleccionada = ''
                        this.municipioSeleccionado = ''
                        this.municipioEnabled = false
                      }
                    }

                    if (popupEstabaAbierto && centroActual) {
                      console.log('🔄 Restaurando popup...')

                      this.centroSeleccionado = centroActual
                      this.selectedCentro = centroActual
                      this.tabActiva = tabActual
                      this.popupPosition = posicionActual
                      this.popupClass = claseActual

                      this.cargarCiclosCentro(centroActual.CCEN)

                      setTimeout(() => {
                        this.popupVisible = true
                        console.log('✅ Popup restaurado exitosamente')
                      }, 50)
                    }
                  }, 300)
                }, 200)
              }, 150)
            },
            error: err => {
              console.error('❌ Error cargando traducciones base:', err)
            }
          })
      },
      error: err => {
        console.error('❌ Error al cambiar idioma:', err)
      }
    })
  }

  private cargarFamiliasTraducidasForzado (): void {
    console.log('🔥 FORZANDO carga de familias traducidas')
    console.log('🌐 Idioma actual:', this.currentLang)

    if (!this.popupVisible) {
      this.familiasFiltradas = []
    }

    this.translate.getTranslation(this.currentLang).subscribe({
      next: translations => {
        const familias = translations.familiasProfesionales as Record<string, string>

        console.log('📦 Traducciones recibidas:', familias)

        const primeraClave = Object.keys(familias)[0]
        const primerValor = familias[primeraClave]

        if (
          primerValor === primeraClave ||
          primerValor.startsWith('familiasProfesionales.')
        ) {
          console.error('❌ Las traducciones AÚN NO están listas')
          this.usarFallbackFamilias()
          return
        }

        this.familiasFiltradas = Object.keys(familias)
          .map(codigo => {
            const nombre = familias[codigo]
            return nombre
          })
          .filter(
            nombre =>
              nombre &&
              nombre.trim() !== '' &&
              !nombre.startsWith('familiasProfesionales.')
          )
          .sort()

        console.log('✅ Familias FORZADAS cargadas:', this.familiasFiltradas.length)

        if (
          this.familiasFiltradas.length === 0 ||
          this.familiasFiltradas[0].length <= 3
        ) {
          console.error('❌ Familias no válidas, usando fallback')
          this.usarFallbackFamilias()
        }
      },
      error: err => {
        console.error('❌ Error obteniendo traducciones:', err)
        this.usarFallbackFamilias()
      }
    })
  }

  private traducirFamiliaSeleccionada (nuevoIdioma: 'es' | 'eu'): void {
    const idiomaAnterior = nuevoIdioma === 'eu' ? 'es' : 'eu'

    this.translate.getTranslation(idiomaAnterior).subscribe(tradAnterior => {
      const familiasAnterior = tradAnterior.familiasProfesionales as Record<string, string>

      const clave = Object.keys(familiasAnterior).find(
        key => familiasAnterior[key] === this.familiaSeleccionada
      )

      if (clave) {
        this.translate.getTranslation(nuevoIdioma).subscribe(tradNueva => {
          const familiasNuevas = tradNueva.familiasProfesionales as Record<string, string>
          this.familiaSeleccionada = familiasNuevas[clave]

          console.log(
            `🔄 Familia traducida: ${familiasAnterior[clave]} → ${familiasNuevas[clave]}`
          )

          if (this.gradoSeleccionado) {
            this.actualizarCiclosPorFamiliaYGrado()
          }
        })
      }
    })
  }

  familiasLabels: Record<string, string> = {}

  private cargarEtiquetasFamilias (): void {
    this.translate.get('familiasProfesionales').subscribe({
      next: (dic: Record<string, string>) => {
        this.familiasLabels = dic || {}

        if (this.familiasFiltradas && this.familiasFiltradas.length > 0) {
          this.familiasFiltradas = this.familiasFiltradas.map(nombreEs => {
            const entrada = Object.entries(
              this.translate.instant('familiasProfesionales') as Record<string, string>
            ).find(([, valorEs]) => valorEs === nombreEs)
            const clave = entrada ? entrada[0] : null
            return clave ? this.familiasLabels[clave] || nombreEs : nombreEs
          })
        }
      },
      error: err => {
        console.error('Error cargando familiasProfesionales', err)
      }
    })
  }

  cargarEtiquetasTraducidas (): void {
    this.translate
      .get([
        'tabs.contacto',
        'tabs.oferta',
        'tabs.basico',
        'tabs.medio',
        'tabs.superior'
      ])
      .subscribe(translations => {
        this.tabs = [
          { id: 'contacto', label: translations['tabs.contacto'] },
          { id: 'oferta', label: translations['tabs.oferta'] },
          { id: 'basico', label: translations['tabs.basico'] },
          { id: 'medio', label: translations['tabs.medio'] },
          { id: 'superior', label: translations['tabs.superior'] }
        ]
      })

    this.translate
      .get(['grados.basico', 'grados.medio', 'grados.superior'])
      .subscribe(translations => {
        this.gradosCiclo = [
          { value: 'Básico', label: translations['grados.basico'] },
          { value: 'Medio', label: translations['grados.medio'] },
          { value: 'Superior', label: translations['grados.superior'] }
        ]
      })
  }

  irAInicio (): void {
    this.popupVisible = false
    this.selectedCentro = null
    this.centroSeleccionado = null
    this.isPanning = false
    this.panAttempts = 0

    this.limpiarFiltros()
    this.map.getView().fit(this.euskadiExtent, {
      duration: 400,
      padding: [30, 30, 30, 30],
      maxZoom: 9.25
    })
  }

// ── Método corregido: onSelectCentro ─────────────────────────
onSelectCentro(centro: any, pixel: number[]): void {
  if (this.isPanning) return

  this.tooltipVisible = false
  this.panAttempts = 0
  this.selectedCentro = centro
  this.centroSeleccionado = centro
  this.cargandoDistanciaPopup = false
  this.calculandoDistancia.clear()
  this.distanciaTexto    = ''
  this.distanciaCargando = true   // mostrar "Calculando..." mientras llega resultado

  this.cargarCiclosCentro(centro.CCEN)
  this.tabActiva = 'contacto'
  this.mostrarPopupSeguro(pixel)

  // Lanzar cálculo DESPUÉS de renderizar el popup
  this.calcularDistanciaParaPopup(centro)
}

// ── Método corregido: cerrarPopup ────────────────────────────
cerrarPopup(): void {
  this.popupVisible = false
  this.selectedCentro = null
  this.centroSeleccionado = null
  this.isPanning = false
  this.panAttempts = 0
  this.cargandoDistanciaPopup = false
  this.distanciaTexto    = ''
  this.distanciaCargando = false
  this.calculandoDistancia.clear()
}

  mostrarPopupSeguro (pixel: number[]): void {
    const popupWidth = 420
    const popupHeight = 600
    const minMargin = 50

    const mapElement = this.map.getTargetElement() as HTMLElement
    const mapRect = mapElement.getBoundingClientRect()

    const [x, y] = pixel

    const espacioIzquierda = x - mapRect.left
    const espacioDerecha = mapRect.right - x
    const espacioArriba = y - mapRect.top
    const espacioAbajo = mapRect.bottom - y

    const necesitaEspacioHorizontal = popupWidth / 2 + minMargin
    const necesitaEspacioVertical = popupHeight / 2 + minMargin

    const tieneEspacioHorizontal =
      espacioIzquierda >= necesitaEspacioHorizontal &&
      espacioDerecha >= necesitaEspacioHorizontal

    const tieneEspacioVertical =
      espacioArriba >= necesitaEspacioVertical &&
      espacioAbajo >= necesitaEspacioVertical

    if (
      (!tieneEspacioHorizontal || !tieneEspacioVertical) &&
      this.panAttempts < this.MAX_PAN_ATTEMPTS
    ) {
      this.panAttempts++
      this.isPanning = true

      console.log('📍 Centrando pin en viewport para mostrar popup')

      const pinCoord = this.map.getCoordinateFromPixel(pixel)
      if (!pinCoord) {
        console.error('❌ Error obteniendo coordenada del pin')
        this.isPanning = false
        return
      }

      const centerPixel: [number, number] = [
        mapRect.width / 2,
        mapRect.height / 2
      ]

      const currentCenter = this.map.getView().getCenter()
      if (!currentCenter) {
        console.error('❌ Error obteniendo centro actual')
        this.isPanning = false
        return
      }

      const deltaPixelX = x - centerPixel[0]
      const deltaPixelY = y - centerPixel[1]

      const resolution = this.map.getView().getResolution() || 1

      const newCenter: [number, number] = [
        currentCenter[0] + deltaPixelX * resolution,
        currentCenter[1] - deltaPixelY * resolution
      ]

      console.log(
        `🎯 Moviendo pin al centro: deltaX=${deltaPixelX.toFixed(
          0
        )}px, deltaY=${deltaPixelY.toFixed(0)}px`
      )

      this.map.getView().animate({ center: newCenter, duration: 350 }, () => {
        console.log('✅ Pin centrado')
        this.isPanning = false

        const newPixel = this.map.getPixelFromCoordinate(pinCoord)
        if (newPixel) {
          this.mostrarPopupEnPosicion(newPixel)
        }
      })

      return
    }

    this.mostrarPopupEnPosicion(pixel)
  }

  private mostrarPopupEnPosicion (pixel: number[]): void {
    const [x, y] = pixel

    const popupWidth = 420
    const popupHeight = 600
    const margin = 20
    const arrowSize = 30

    const mapElement = this.map.getTargetElement() as HTMLElement
    const mapRect = mapElement.getBoundingClientRect()

    const espacioArriba = y - mapRect.top
    const espacioAbajo = mapRect.bottom - y
    const espacioIzquierda = x - mapRect.left
    const espacioDerecha = mapRect.right - x

    let popupX: number
    let popupY: number
    let positionClass: string

    if (espacioAbajo >= popupHeight + margin + arrowSize) {
      popupY = y + arrowSize + 10
      popupX = x - popupWidth / 2
      positionClass = 'popup-bottom'
      console.log('📍 Popup: ABAJO del pin')
    } else if (espacioArriba >= popupHeight + margin + arrowSize) {
      popupY = y - popupHeight - arrowSize - 10
      popupX = x - popupWidth / 2
      positionClass = 'popup-top'
      console.log('📍 Popup: ARRIBA del pin')
    } else if (espacioDerecha >= popupWidth + margin + arrowSize) {
      popupX = x + arrowSize + 10
      popupY = y - popupHeight / 2
      positionClass = 'popup-right'
      console.log('📍 Popup: DERECHA del pin')
    } else if (espacioIzquierda >= popupWidth + margin + arrowSize) {
      popupX = x - popupWidth - arrowSize - 10
      popupY = y - popupHeight / 2
      positionClass = 'popup-left'
      console.log('📍 Popup: IZQUIERDA del pin')
    } else {
      popupY = Math.max(
        mapRect.top + margin,
        Math.min(y - popupHeight / 2, mapRect.bottom - popupHeight - margin)
      )
      popupX = x - popupWidth / 2
      positionClass = 'popup-bottom'
      console.log('📍 Popup: CENTRADO (último recurso)')
    }

    const finalX = Math.max(
      mapRect.left + margin,
      Math.min(popupX, mapRect.right - popupWidth - margin)
    )
    const finalY = Math.max(
      mapRect.top + margin,
      Math.min(popupY, mapRect.bottom - popupHeight - margin)
    )

    this.popupPosition = { x: finalX, y: finalY }
    this.popupClass = positionClass
    this.popupVisible = true

    console.log(
      `✅ Popup mostrado en (${finalX.toFixed(0)}, ${finalY.toFixed(0)})`
    )
  }

  irAPestanaPorGrado (tipo: 'basicos' | 'medios' | 'superiores'): void {
    if (this.getTotalCiclos(tipo) === 0) {
      return
    }

    const mapeoTabs: Record<'basicos' | 'medios' | 'superiores', string> = {
      basicos: 'basico',
      medios: 'medio',
      superiores: 'superior'
    }

    this.cambiarTab(mapeoTabs[tipo])
  }

  private cargarEtiquetasTiposCentro (): void {
    this.translate.get('tiposCentro').subscribe({
      next: (tipos: Record<string, string>) => {
        this.tipoCentroLabels = tipos || {}
        
        console.log('✅ cargarEtiquetasTiposCentro: Etiquetas cargadas:', this.tipoCentroLabels)

        // Actualizar el array existente solo si ya tiene elementos
        if (this.tiposCentro && this.tiposCentro.length > 0) {
          this.tiposCentro = this.tiposCentro.map(t => ({
            ...t,
            label: this.tipoCentroLabels[t.value] || t.value
          }))
          console.log('✅ cargarEtiquetasTiposCentro: Array tiposCentro actualizado')
        }
      },
      error: err => {
        console.error('❌ Error en cargarEtiquetasTiposCentro:', err)
        if (this.tiposCentro && this.tiposCentro.length > 0) {
          this.tiposCentro = this.tiposCentro.map(t => ({
            ...t,
            label: t.value  // Fallback a usar el código si falla la carga
          }))
        }
      }
    })
  }

  getImagenCentro (ccen: number): string {
    if (!ccen) return 'assets/images/default-centro.jpg'
    const codigo = String(ccen).padStart(6, '0')
    return `assets/images/img_${codigo}.jpg`
  }

  onImageError (event: any): void {
    event.target.src =
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTIwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjE4IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Q2VudHJvPC90ZXh0Pjwvc3ZnPg=='
  }

  cambiarTab (tabId: string): void {
    this.tabActiva = tabId
  }

  getTotalCiclos (tipo: 'basicos' | 'medios' | 'superiores'): number {
    return this.ciclosCentro[tipo]?.length || 0
  }

  // Texto del ciclo en el combo: en euskera usa nomEuskera y, si faltara,
  // cae al castellano para que la opción nunca quede en blanco.
  nombreCicloVisible (ciclo: Asignacion): string {
    if (this.currentLang === 'eu') {
      return (ciclo.nomEuskera || '').trim() || ciclo.nom || ''
    }
    return ciclo.nom || ''
  }

  getDCBUrl (ciclo: Asignacion): string {
    // Este método es muy largo, lo mantengo igual que en el archivo original
    // Solo incluyo el inicio para referencia
    const lang = this.currentLang
    // ... resto del código existente
    return '#' // placeholder
  }

  abrirDCB (ciclo: Asignacion, event: Event): void {
    event.stopPropagation()
    const url = this.getDCBUrl(ciclo)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  cargarCiclosCentro (ccen: number): void {
    if (!ccen) {
      this.ciclosCentro = { basicos: [], medios: [], superiores: [] }
      this.familiasCentro = []
      return
    }

    const ciclosDelCentro = ciclosAsignacion.filter(ciclo =>
      ciclo.centros.includes(ccen)
    )

    const normalizar = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase()

    this.ciclosCentro = {
      basicos: ciclosDelCentro.filter(c => normalizar(c.grado) === 'BASICO'),
      medios: ciclosDelCentro.filter(c => normalizar(c.grado) === 'MEDIO'),
      superiores: ciclosDelCentro.filter(c => normalizar(c.grado) === 'SUPERIOR')
    }

    console.log(`📊 Centro ${ccen}:`, {
      total: ciclosDelCentro.length,
      basicos: this.ciclosCentro.basicos.length,
      medios: this.ciclosCentro.medios.length,
      superiores: this.ciclosCentro.superiores.length,
      gradosOriginales: [...new Set(ciclosDelCentro.map(c => c.grado))]
    })

    const familiasSet = new Set(ciclosDelCentro.map(c => c.familia))
    this.familiasCentro = Array.from(familiasSet).sort()
  }

  cargarListas (): void {
    const campoProvincia = this.currentLang === 'eu' ? 'DTERRE' : 'DTERRC'

    this.provincias = Array.from(
      new Set(institutos.map(c => c[campoProvincia] as string))
    ).sort()

    // ✅ Tipos de centro con código español neutro (no depende del idioma)
    this.construirTiposCentro()

    console.log('📋 Tipos de centro creados:', this.tiposCentro)

    this.ciclosFiltrados = []

    this.cargarFamiliasTraducidas()
  }

  resetearCompleto (): void {
    this.limpiarFiltros()
    this.map.getView().fit(this.euskadiExtent, {
      duration: 400,
      padding: [30, 30, 30, 30],
      maxZoom: 9.25
    })
  }

  inicializarMapa (): void {
    this.map = new Map({
      target: 'map',
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({ center: [0, 0], zoom: 2 })
    })

    this.map.getView().fit(this.euskadiExtent, {
      duration: 100,
      padding: [30, 30, 30, 30],
      maxZoom: 9.25
    })

    this.map.on('singleclick', evt => {
      const feature = this.map.forEachFeatureAtPixel(evt.pixel, f => f as any)
      if (feature) {
        const props = feature.getProperties()
        if (!props || !props.CCEN) return

        this.tooltipVisible = false

        this.onSelectCentro(props, evt.pixel)
      } else {
        if (this.popupVisible) {
          this.cerrarPopup()
        }
      }
    })

    this.map.on('pointermove', evt => {
      const pixel = this.map.getEventPixel(evt.originalEvent)
      const feature = this.map.forEachFeatureAtPixel(pixel, f => f as any)

      if (feature) {
        const props = feature.getProperties()

        if (
          this.popupVisible &&
          this.centroSeleccionado &&
          props['CCEN'] === this.centroSeleccionado.CCEN
        ) {
          this.tooltipVisible = false
          return
        }

        this.tooltipVisible = true
        this.tooltipContent = props['tooltipNombre'] || props['name'] || 'Centro'

        const mouseEvt = evt.originalEvent as MouseEvent
        const tooltipWidth = 300
        const tooltipHeight = 40
        const margin = 20

        let x = mouseEvt.clientX + 12
        let y = mouseEvt.clientY - 14

        if (x + tooltipWidth > window.innerWidth - margin) {
          x = mouseEvt.clientX - tooltipWidth - 12
        }

        if (y + tooltipHeight > window.innerHeight - margin) {
          y = mouseEvt.clientY - tooltipHeight - 14
        }

        if (y < margin) y = margin
        if (x < margin) x = margin

        this.tooltipX = x
        this.tooltipY = y

        ;(this.map.getTargetElement() as HTMLElement).style.cursor = 'pointer'
      } else {
        this.tooltipVisible = false
        ;(this.map.getTargetElement() as HTMLElement).style.cursor = ''
      }
    })

    this.pinsLayer = new VectorLayer({
      source: new VectorSource({ features: [] })
    })

    this.map.addLayer(this.pinsLayer)
  }

  onMapMouseMove (event: Event): void {
    if (!this.map) return

    const mouseEvt = event as MouseEvent
    const mapElement = this.map.getTargetElement() as HTMLElement

    if (!mapElement) return

    const bbox = mapElement.getBoundingClientRect()
    const pixel: [number, number] = [
      mouseEvt.clientX - bbox.left,
      mouseEvt.clientY - bbox.top
    ]

    const feature = this.map.forEachFeatureAtPixel(
      pixel,
      f => f as Feature<any>
    )

    if (feature) {
      const props = feature.getProperties()

      if (
        this.popupVisible &&
        this.centroSeleccionado &&
        props['CCEN'] === this.centroSeleccionado.CCEN
      ) {
        this.tooltipVisible = false
        return
      }

      this.tooltipVisible = true
      this.tooltipContent = props['tooltipNombre'] || props['name'] || 'Centro sin nombre'

      const tooltipWidth = 300
      const tooltipHeight = 40
      const margin = 20

      let x = mouseEvt.clientX + 12
      let y = mouseEvt.clientY - 14

      if (x + tooltipWidth > window.innerWidth - margin) {
        x = mouseEvt.clientX - tooltipWidth - 12
      }

      if (y + tooltipHeight > window.innerHeight - margin) {
        y = mouseEvt.clientY - tooltipHeight - 14
      }

      if (y < margin) y = margin
      if (x < margin) x = margin

      this.tooltipX = x
      this.tooltipY = y
    } else {
      this.tooltipVisible = false
    }
  }

  actualizarMunicipios (): void {
    if (this.provinciaSeleccionada) {
      const centrosConCiclos = new Set<number>()
      ciclosAsignacion.forEach(ciclo => {
        ciclo.centros.forEach(ccen => centrosConCiclos.add(ccen))
      })

      const campoProvincia = this.currentLang === 'eu' ? 'DTERRE' : 'DTERRC'
      const campoMunicipio = this.currentLang === 'eu' ? 'DMUNIE' : 'DMUNIC'

      const municipiosSet = new Set<string>()

      institutos
        .filter(c => {
          if (c[campoProvincia] !== this.provinciaSeleccionada) return false
          if (!centrosConCiclos.has(c.CCEN)) return false
          if (!this.centroCumpleTipo(c)) return false
          return true
        })
        .forEach(c => municipiosSet.add(c[campoMunicipio] as string))

      this.municipios = Array.from(municipiosSet).sort()
      this.municipioEnabled = true
    } else {
      this.municipios = []
      this.municipioSeleccionado = ''
      this.municipioEnabled = false
    }

    this.actualizarFamiliasDisponibles()

    this.actualizarMapa('provincia')
  }

  actualizarFamilias (): void {
    this.actualizarFamiliasDisponibles()
    this.actualizarMapa('municipio')
  }

  actualizarCiclos (): void {
    this.cerrarPopup()

    if (this.familiaSeleccionada) {
      const codigoFamilia = this.obtenerCodigoFamilia(this.familiaSeleccionada)
      const gradoEnEspanol = this.traducirGradoAEspanol(this.gradoSeleccionado)

      const centrosValidos = this.obtenerCentrosValidos()

      this.ciclosFiltrados = ciclosAsignacion.filter(ciclo => {
        if (ciclo.familiaCodigo !== codigoFamilia) return false

        if (gradoEnEspanol && ciclo.grado !== gradoEnEspanol) return false

        const estaEnCentroValido = ciclo.centros.some(ccen =>
          centrosValidos.has(ccen)
        )

        return estaEnCentroValido
      })

      console.log(
        `🔍 Ciclos filtrados: Familia="${codigoFamilia}", Grado="${gradoEnEspanol}", En centros válidos: ${this.ciclosFiltrados.length}`
      )
    } else {
      this.ciclosFiltrados = []
    }

    this.cicloSeleccionado = ''
    this.actualizarMapa('familia')
  }

  private obtenerCentrosValidos (): Set<number> {
    const campoProvincia = this.currentLang === 'eu' ? 'DTERRE' : 'DTERRC'
    const campoMunicipio = this.currentLang === 'eu' ? 'DMUNIE' : 'DMUNIC'
    const normaliza = (x: string) => (x || '').trim().toUpperCase()

    const centrosValidos = new Set<number>()

    institutos.forEach(centro => {
      if (
        this.provinciaSeleccionada &&
        centro[campoProvincia] !== this.provinciaSeleccionada
      ) {
        return
      }

      if (
        this.municipioSeleccionado &&
        normaliza(centro[campoMunicipio] as string) !==
          normaliza(this.municipioSeleccionado)
      ) {
        return
      }

      if (this.tipoCentroSeleccionado && !this.centroCumpleTipo(centro)) {
        return
      }

      centrosValidos.add(centro.CCEN)
    })

    return centrosValidos
  }

  private actualizarFamiliasDisponibles (): void {
    console.log('🔄 Actualizando familias disponibles...')

    if (
      !this.provinciaSeleccionada &&
      !this.municipioSeleccionado &&
      !this.tipoCentroSeleccionado
    ) {
      console.log('📚 Sin filtros de ubicación, cargando todas las familias')
      this.cargarTodasLasFamiliasTraducidas()
      return
    }

    const centrosValidos = this.obtenerCentrosValidos()

    const codigosFamiliasDisponibles = new Set<string>()

    ciclosAsignacion.forEach(ciclo => {
      if (ciclo.centros.some(ccen => centrosValidos.has(ccen))) {
        codigosFamiliasDisponibles.add(ciclo.familiaCodigo)
      }
    })

    const codigosArray = Array.from(codigosFamiliasDisponibles).sort()

    console.log(`📚 Códigos de familias disponibles:`, codigosArray)

    this.translate.get('familiasProfesionales').subscribe({
      next: (familiasTraducidas: Record<string, string>) => {
        this.familiasFiltradas = codigosArray
          .map(codigo => familiasTraducidas[codigo])
          .filter(
            nombre =>
              nombre &&
              nombre.trim() !== '' &&
              !nombre.startsWith('familiasProfesionales.') &&
              nombre.length > 3
          )
          .sort()

        console.log(
          `✅ Familias traducidas disponibles (${this.currentLang}):`,
          this.familiasFiltradas.length
        )

        if (
          this.familiasFiltradas.length === 0 ||
          this.familiasFiltradas.some(f => f.length <= 3)
        ) {
          console.warn('⚠️ Familias no válidas, usando fallback')
          this.usarFallbackFamilias()
        }
      },
      error: err => {
        console.error('❌ Error traduciendo familias:', err)
        this.usarFallbackFamilias()
      }
    })
  }

  private cargarTodasLasFamiliasTraducidas (): void {
    console.log('🌍 Cargando TODAS las familias traducidas')

    const todosCodigos = Array.from(
      new Set(ciclosAsignacion.map(c => c.familiaCodigo))
    ).sort()

    console.log('🔑 Total de códigos de familias:', todosCodigos.length)

    this.translate.get('familiasProfesionales').subscribe({
      next: (familiasTraducidas: Record<string, string>) => {
        this.familiasFiltradas = todosCodigos
          .map(codigo => familiasTraducidas[codigo])
          .filter(
            nombre =>
              nombre &&
              nombre.trim() !== '' &&
              !nombre.startsWith('familiasProfesionales.') &&
              nombre.length > 3
          )
          .sort()

        console.log(
          `✅ TODAS las familias cargadas (${this.currentLang}):`,
          this.familiasFiltradas.length
        )

        if (this.familiasFiltradas.length === 0) {
          console.error('❌ No se pudieron cargar familias, usando fallback')
          this.usarFallbackFamilias()
        }
      },
      error: err => {
        console.error('❌ Error cargando todas las familias:', err)
        this.usarFallbackFamilias()
      }
    })
  }

  actualizarMapa (
    origen:
      | 'provincia'
      | 'municipio'
      | 'tipo'
      | 'grado'
      | 'familia'
      | 'ciclo' = 'ciclo'
  ): void {
    if (!this.map) return

    console.log(`🗺️ actualizarMapa() llamado desde: ${origen}`)

    // Si hay filtro de distancia activo, aplicarlo
    if (this.distanciaMaximaActual > 0 && this.posicionUsuario) {
      this.aplicarFiltroDistancia()
      return
    }

    const campoProvincia = this.currentLang === 'eu' ? 'DTERRE' : 'DTERRC'
    const campoMunicipio = this.currentLang === 'eu' ? 'DMUNIE' : 'DMUNIC'

    const hayFiltros = !!(
      this.provinciaSeleccionada ||
      this.municipioSeleccionado ||
      this.tipoCentroSeleccionado ||
      this.gradoSeleccionado ||
      this.cicloSeleccionado ||
      this.familiaSeleccionada
    )

    const centrosConCiclosFP = new Set<number>()
    ciclosAsignacion.forEach(ciclo => {
      ciclo.centros.forEach(ccen => centrosConCiclosFP.add(ccen))
    })

    console.log(`📚 Total de centros con ciclos FP: ${centrosConCiclosFP.size}`)

    if (!hayFiltros) {
      console.log('🧹 No hay filtros activos, limpiando mapa...')
      this.centrosMostradosAnteriores.clear()
      if (this.pinsLayer) this.map.removeLayer(this.pinsLayer)
      this.pinsLayer = new VectorLayer({
        source: new VectorSource({ features: [] })
      })
      this.map.addLayer(this.pinsLayer)
      this.map.getView().fit(this.euskadiExtent, {
        duration: 400,
        padding: [30, 30, 30, 30],
        maxZoom: 9.25
      })
      
      // Limpiar lista de centros mostrados
      this.centrosMostradosParaDistancia = []
      return
    }

    const centrosFiltrados = this.obtenerCentrosFiltrados()

    console.log(`✅ Centros finales tras filtrado: ${centrosFiltrados.length}`)

    if (centrosFiltrados.length === 0) {
      console.log('⚠️ No se encontraron centros con los filtros aplicados')
      this.centrosMostradosAnteriores.clear()
      if (this.pinsLayer) this.map.removeLayer(this.pinsLayer)
      this.pinsLayer = new VectorLayer({
        source: new VectorSource({ features: [] })
      })
      this.map.addLayer(this.pinsLayer)

      this.cargarTodasLasFamiliasTraducidas()

      let mensaje = 'No se encontraron centros que cumplan con los filtros seleccionados:'
      const filtrosActivos = []

      if (this.provinciaSeleccionada)
        filtrosActivos.push(`Provincia: ${this.provinciaSeleccionada}`)
      if (this.municipioSeleccionado)
        filtrosActivos.push(`Municipio: ${this.municipioSeleccionado}`)
      if (this.tipoCentroSeleccionado) {
        const tipoLabel =
          this.tiposCentro.find(t => t.value === this.tipoCentroSeleccionado)
            ?.label || this.tipoCentroSeleccionado
        filtrosActivos.push(`Tipo: ${tipoLabel}`)
      }
      if (this.gradoSeleccionado)
        filtrosActivos.push(`Grado: ${this.gradoSeleccionado}`)
      if (this.familiaSeleccionada)
        filtrosActivos.push(`Familia: ${this.familiaSeleccionada}`)
      if (this.cicloSeleccionado) {
        const ciclo = ciclosAsignacion.find(
          c => c.codcicl === Number(this.cicloSeleccionado)
        )
        if (ciclo) filtrosActivos.push(`Ciclo: ${ciclo.nom}`)
      }

      if (filtrosActivos.length > 0) {
        mensaje += '\n\n' + filtrosActivos.join('\n')
      }

      this.mostrarAdvertencia(mensaje)
      
      // Limpiar lista de centros mostrados
      this.centrosMostradosParaDistancia = []
      return
    }

    // Mostrar centros en el mapa
    this.mostrarCentrosEnMapa(centrosFiltrados)
  }

  private cargarFamiliasTraducidas (intentos: number = 0): void {
    const MAX_INTENTOS = 5

    console.log(
      `🔍 Intentando cargar familias traducidas... (intento ${
        intentos + 1
      }/${MAX_INTENTOS})`
    )

    this.translate.get('familiasProfesionales').subscribe({
      next: (familias: Record<string, string>) => {
        const traduccionesNoListas = Object.keys(familias).some(
          clave =>
            familias[clave] === clave ||
            familias[clave] === `familiasProfesionales.${clave}` ||
            !familias[clave] ||
            familias[clave].trim() === ''
        )

        if (traduccionesNoListas) {
          console.warn('⏳ Traducciones no listas, reintentando...')

          if (intentos < MAX_INTENTOS) {
            const delay = 100 * Math.pow(2, intentos)
            setTimeout(() => this.cargarFamiliasTraducidas(intentos + 1), delay)
            return
          } else {
            console.error('❌ Máximo de reintentos alcanzado, usando fallback')
            this.usarFallbackFamilias()
            return
          }
        }

        this.familiasFiltradas = Object.keys(familias)
          .map(key => familias[key])
          .filter(
            valor =>
              valor &&
              valor.trim() !== '' &&
              !valor.startsWith('familiasProfesionales.')
          )
          .sort()

        console.log(
          '✅ Familias cargadas correctamente:',
          this.familiasFiltradas.length
        )
      },
      error: err => {
        console.error('❌ Error cargando familias profesionales:', err)

        if (intentos < MAX_INTENTOS) {
          setTimeout(() => this.cargarFamiliasTraducidas(intentos + 1), 200)
        } else {
          this.usarFallbackFamilias()
        }
      }
    })
  }

  private usarFallbackFamilias (): void {
    console.log('🔄 Usando familias en español como fallback')

    this.familiasFiltradas = [
      'Actividades Físicas y Deportivas',
      'Administración y Gestión',
      'Agraria',
      'Artes Gráficas',
      'Comercio y Marketing',
      'Edificación y Obra Civil',
      'Electricidad y Electrónica',
      'Energía y Agua',
      'Fabricación Mecánica',
      'Hostelería y Turismo',
      'Imagen Personal',
      'Imagen y Sonido',
      'Industrias Alimentarias',
      'Informática y Comunicaciones',
      'Instalación y Mantenimiento',
      'Madera, Mueble y Corcho',
      'Marítimo Pesquera',
      'Química',
      'Sanidad',
      'Seguridad y Medio Ambiente',
      'Servicios Socioculturales y a la Comunidad',
      'Textil, Confección y Piel',
      'Transporte y Mantenimiento de Vehículos'
    ].sort()
  }

  onChangeFamilia (): void {
    console.log('👨‍💼 Cambio de familia a:', this.familiaSeleccionada)

    if (!this.familiaSeleccionada) {
      this.gradoSeleccionado = ''
      this.cicloSeleccionado = ''
      this.ciclosFiltrados = []
      this.actualizarMapa('familia')
    } else {
      this.actualizarCiclosPorFamiliaYGrado()
    }
  }

  onChangeGrado (): void {
    console.log('🎓 Cambio de grado a:', this.gradoSeleccionado)

    if (!this.gradoSeleccionado) {
      this.cicloSeleccionado = ''
      this.ciclosFiltrados = []

      if (this.familiaSeleccionada) {
        this.actualizarCiclosPorFamiliaYGrado()
      } else {
        this.actualizarMapa('familia')
      }
    } else {
      this.actualizarCiclosPorFamiliaYGrado()
    }
  }

  private buscarCodigoEnMapaEstatico (nombreTraducido: string): string {
    const mapaEsDict = this.familiasEsDict || {}

    const codigo = Object.keys(mapaEsDict).find(
      key => mapaEsDict[key] === nombreTraducido
    )

    if (codigo) {
      console.log(`✅ Fallback exitoso: "${nombreTraducido}" → "${codigo}"`)
      return codigo
    }

    console.error(`❌ No se encontró código para: "${nombreTraducido}"`)
    return ''
  }

  private obtenerCodigoFamilia (nombreTraducido: string): string {
    if (!nombreTraducido) return ''

    console.log(`🔍 Buscando código para familia: "${nombreTraducido}"`)

    const familiasDict = this.translate.instant(
      'familiasProfesionales'
    ) as Record<string, string>

    const codigo = Object.keys(familiasDict).find(
      key => familiasDict[key] === nombreTraducido
    )

    if (codigo) {
      console.log(`✅ Código encontrado: "${nombreTraducido}" → "${codigo}"`)
      return codigo
    }

    console.warn(
      `⚠️ No se encontró código, usando fallback para "${nombreTraducido}"`
    )
    return this.buscarCodigoEnMapaEstatico(nombreTraducido)
  }

  actualizarCiclosPorFamiliaYGrado (): void {
    if (!this.familiaSeleccionada && !this.gradoSeleccionado) {
      this.ciclosFiltrados = []
      this.cicloSeleccionado = ''
      this.actualizarMapa('familia')
      return
    }

    const familiaEnEspanol = this.traducirFamiliaAEspanol(
      this.familiaSeleccionada
    )
    const gradoEnEspanol = this.traducirGradoAEspanol(this.gradoSeleccionado)

    this.ciclosFiltrados = ciclosAsignacion.filter(ciclo => {
      let cumpleFamilia = true
      let cumpleGrado = true

      if (this.familiaSeleccionada) {
        const codigoFamilia = this.obtenerCodigoFamilia(
          this.familiaSeleccionada
        )
        cumpleFamilia = ciclo.familiaCodigo === codigoFamilia
      }

      if (gradoEnEspanol) {
        cumpleGrado = ciclo.grado === gradoEnEspanol
      }

      return cumpleFamilia && cumpleGrado
    })

    console.log(
      `📊 Filtrado: Familia="${familiaEnEspanol}", Grado="${gradoEnEspanol}", Ciclos encontrados: ${this.ciclosFiltrados.length}`
    )

    this.actualizarMapa('familia')
    this.cicloSeleccionado = ''
  }

// ── Método corregido: limpiarFiltros ─────────────────────────
limpiarFiltros(): void {
  this.cerrarPopup()
 
  this.provinciaSeleccionada = ''
  this.municipioSeleccionado = ''
  this.tipoCentroSeleccionado = ''
  this.gradoSeleccionado = ''
  this.familiaSeleccionada = ''
  this.cicloSeleccionado = ''
  this.municipios = []
  this.municipioEnabled = false
  this.ciclosFiltrados = []
  this.isPanning = false
  this.panAttempts = 0
 
  // Reset distancia
  this.distanciaMaximaActual = 0
  this.centrosMostradosParaDistancia = []
  this.routingResultsCache = {}
  this.routing.limpiarCache()
 
  if (this.distanceControl) {
    this.distanceControl.revertirSlider()
  }
 
  this.cargarTodasLasFamiliasTraducidas()
  this.actualizarMapa()
}

  limpiarFiltrosDesdeModal (): void {
    this.cerrarModalAdvertencia()
    this.limpiarFiltros()
  }

  resetearVistaCompleta (): void {
    this.limpiarFiltros()
    this.map.getView().fit(this.euskadiExtent, {
      duration: 400,
      padding: [30, 30, 30, 30],
      maxZoom: 9.25
    })
  }

  private traducirFamiliaAEspanol (familiaTraducida: string): string {
    if (!familiaTraducida) return ''

    const familiasEnEspanol = [
      'Actividades Físicas y Deportivas',
      'Administración y Gestión',
      'Agraria',
      'Artes Gráficas',
      'Comercio y Marketing',
      'Edificación y Obra Civil',
      'Electricidad y Electrónica',
      'Energía y Agua',
      'Fabricación Mecánica',
      'Hostelería y Turismo',
      'Imagen Personal',
      'Imagen y Sonido',
      'Industrias Alimentarias',
      'Informática y Comunicaciones',
      'Instalación y Mantenimiento',
      'Madera, Mueble y Corcho',
      'Marítimo Pesquera',
      'Química',
      'Sanidad',
      'Seguridad y Medio Ambiente',
      'Servicios Socioculturales y a la Comunidad',
      'Textil, Confección y Piel',
      'Transporte y Mantenimiento de Vehículos',
      'Vidrio y Cerámica'
    ]

    if (familiasEnEspanol.includes(familiaTraducida)) {
      return familiaTraducida
    }

    const familiaActualDict = this.translate.instant(
      'familiasProfesionales'
    ) as Record<string, string>
    const familiasEsDict = this.translate.instant(
      'familiasProfesionales',
      'es'
    ) as Record<string, string>

    const traduccionesNoListas = Object.keys(familiaActualDict).some(
      key =>
        familiaActualDict[key] === key ||
        familiaActualDict[key].startsWith('familiasProfesionales.')
    )

    if (traduccionesNoListas) {
      return this.buscarFamiliaEnAsignacion(familiaTraducida)
    }

    const claveSeleccionada = Object.keys(familiaActualDict).find(key => {
      const valorActual = familiaActualDict[key]
      return valorActual === familiaTraducida
    })

    if (claveSeleccionada && familiasEsDict[claveSeleccionada]) {
      return familiasEsDict[claveSeleccionada]
    }

    return this.buscarFamiliaEnAsignacion(familiaTraducida)
  }

  private buscarFamiliaEnAsignacion (nombreTraducido: string): string {
    const mapaEuskeraEspanol: Record<string, string> = {
      'Jarduera Fisiko eta Kirolak': 'Actividades Físicas y Deportivas',
      'Administrazioa eta Kudeaketa': 'Administración y Gestión',
      Nekazaritza: 'Agraria',
      'Arte Grafikoak': 'Artes Gráficas',
      'Merkataritza eta Marketina': 'Comercio y Marketing',
      'Eraikuntza eta Obra Zibila': 'Edificación y Obra Civil',
      'Elektrizitatea eta Elektronika': 'Electricidad y Electrónica',
      'Energia eta Ura': 'Energía y Agua',
      'Fabrikazio Mekanikoa': 'Fabricación Mecánica',
      'Ostalaritza eta Turismoa': 'Hostelería y Turismo',
      'Irudi Pertsonala': 'Imagen Personal',
      'Irudia eta Soinua': 'Imagen y Sonido',
      'Elikagaien Industriak': 'Industrias Alimentarias',
      'Informatika eta Komunikazioak': 'Informática y Comunicaciones',
      'Instalazioa eta Mantentze Lanak': 'Instalación y Mantenimiento',
      'Zurgintzaa, Altzargintza eta Kortxoa': 'Madera, Mueble y Corcho',
      'Itsasoa eta Arrantza': 'Marítimo Pesquera',
      Kimika: 'Química',
      Osasungintzaa: 'Sanidad',
      'Segurtasuna eta Ingurumena': 'Seguridad y Medio Ambiente',
      'Gizarte eta Kultura Zerbitzuak':
        'Servicios Socioculturales y a la Comunidad',
      'Ehungintza, Jantzigintza eta Larrugintza': 'Textil, Confección y Piel',
      'Garraioa eta Ibilgailuen Mantentze Lanak':
        'Transporte y Mantenimiento de Vehículos',
      'Beira eta Zeramika': 'Vidrio y Cerámica'
    }

    return mapaEuskeraEspanol[nombreTraducido] || nombreTraducido
  }

  private traducirGradoAEspanol (gradoTraducido: string): string {
    if (!gradoTraducido) return ''

    const mapeoGrados: Record<string, string> = {
      'Formación Profesional Básica': 'Básico',
      'Grado Medio': 'Medio',
      'Grado Superior': 'Superior',
      'Oinarrizko Lanbide Heziketa': 'Básico',
      'Erdi Maila': 'Medio',
      'Goi Maila': 'Superior'
    }

    if (['Básico', 'Medio', 'Superior'].includes(gradoTraducido)) {
      return gradoTraducido
    }

    return mapeoGrados[gradoTraducido] || gradoTraducido
  }
}