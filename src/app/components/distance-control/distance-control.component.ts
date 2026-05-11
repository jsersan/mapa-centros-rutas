// distance-control.component.ts
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges
} from '@angular/core'
import { TranslateService } from '@ngx-translate/core'
import { Subscription } from 'rxjs'
import { RoutingService } from '../../services/routing.service'

export interface UserPosition {
  lat: number
  lng: number
}

@Component({
  selector: 'app-distance-control',
  templateUrl: './distance-control.component.html',
  styleUrls: ['./distance-control.component.scss']
})
export class DistanceControlComponent implements OnInit, OnDestroy, OnChanges {
  // ── Inputs ────────────────────────────────────────────────────────
  @Input() centrosMostrados: any[] = []
  @Input() currentLang: 'es' | 'eu' = 'es'

  // ── Outputs ───────────────────────────────────────────────────────
  @Output() distanciaChange = new EventEmitter<number>()
  @Output() posicionObtened = new EventEmitter<UserPosition>()

  // ── Estado público ─────────────────────────────────────────────────
  geoReady    = false
  geoLoading  = true
  geoError    = false
  geoStatusText = ''
  distanciaMaxima = 0

  municipiosEnRango:  string[] = []
  municipiosNuevos:   Set<string> = new Set()

  // ── Estado privado ─────────────────────────────────────────────────
  private userPosition: UserPosition | null = null
  private distanciaAnterior = 0
  private municipiosAnteriores: Set<string> = new Set()
  private langSub!: Subscription

  constructor(
    private translate: TranslateService,
    private routing: RoutingService
  ) {}

  ngOnInit(): void {
    this.actualizarTextoGeo()
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.actualizarTextoGeo()
      this.recalcularMunicipios()
    })
    this.iniciarGeolocalizacion()
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe()
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['centrosMostrados']) {
      this.recalcularMunicipios()
    }
  }

  // ── Geolocalización ────────────────────────────────────────────────
  private iniciarGeolocalizacion(): void {
    if (!navigator.geolocation) {
      this.geoLoading = false
      this.geoError   = true
      this.geoStatusText = this.t('distance.geoNoDisponible')
      this.geoReady = true
      return
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        this.userPosition = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        this.geoLoading   = false
        this.geoError     = false
        this.geoStatusText = this.textoUbicacionObtenida()
        this.geoReady     = true
        // Limpiar caché al obtener nueva posición
        this.routing.limpiarCache()
        this.posicionObtened.emit(this.userPosition)
      },
      _err => {
        this.geoLoading   = false
        this.geoError     = true
        this.geoStatusText = this.t('distance.geoError')
        this.geoReady     = true
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  private textoUbicacionObtenida(): string {
    const pos = this.userPosition
    if (!pos) return ''
    const coords = `(${pos.lat.toFixed(4)}, ${pos.lng.toFixed(4)})`
    return this.currentLang === 'eu'
      ? `Kokapena lortuta ✓ ${coords}`
      : `Ubicación obtenida ✓ ${coords}`
  }

  private actualizarTextoGeo(): void {
    if (this.userPosition) {
      this.geoStatusText = this.textoUbicacionObtenida()
    } else if (this.geoError) {
      this.geoStatusText = this.t('distance.geoError')
    } else {
      this.geoStatusText = this.t('distance.geoObteniendo')
    }
  }

  // ── Slider ─────────────────────────────────────────────────────────
  onSliderInput(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10)
    this.distanciaMaxima = val
  }

  onSliderChange(event: Event): void {
    const val = parseInt((event.target as HTMLInputElement).value, 10)
    this.distanciaAnterior = this.distanciaMaxima
    this.distanciaMaxima   = val

    if (val === 0) {
      this.municipiosAnteriores = new Set()
      this.municipiosEnRango    = []
      this.municipiosNuevos     = new Set()
    }

    this.distanciaChange.emit(val)
  }

  revertirSlider(): void {
    this.distanciaMaxima = this.distanciaAnterior
    if (this.distanciaMaxima === 0) {
      this.municipiosAnteriores = new Set()
      this.municipiosEnRango    = []
      this.municipiosNuevos     = new Set()
    }
  }

  // ── Cálculo de distancia ────────────────────────────────────────────

  /**
   * Comprueba si un centro está dentro del radio actual usando Haversine.
   * NOTA: esto es solo para uso interno rápido; el filtrado real usa OSRM
   * a través de RoutingService en el componente padre.
   */
  centroEnRango(centroLat: number, centroLng: number): boolean {
    if (this.distanciaMaxima === 0 || !this.userPosition) return true
    // Pre-filtro con Haversine × 1.5 (el filtrado preciso lo hace el padre con OSRM)
    const dist = this.routing.haversineKm(
      this.userPosition.lat, this.userPosition.lng,
      centroLat, centroLng
    )
    return dist <= this.distanciaMaxima * 1.5
  }

  /**
   * Distancia Haversine formateada (para compatibilidad).
   * El popup usa RoutingService directamente para obtener la distancia real.
   */
  distanciaFormateada(centroLat: number, centroLng: number): string {
    if (!this.userPosition) return ''
    const dist = this.routing.haversineKm(
      this.userPosition.lat, this.userPosition.lng,
      centroLat, centroLng
    )
    return dist.toFixed(1) + ' km'
  }

  get tieneGeo(): boolean {
    return !!this.userPosition
  }

  get posicion(): UserPosition | null {
    return this.userPosition
  }

  // ── Municipios ─────────────────────────────────────────────────────
  private recalcularMunicipios(): void {
    if (this.distanciaMaxima === 0 || this.centrosMostrados.length === 0) {
      this.municipiosEnRango = []
      this.municipiosNuevos  = new Set()
      return
    }

    const campo = this.currentLang === 'eu' ? 'DMUNIE' : 'DMUNIC'
    const nuevaLista = Array.from(
      new Set(
        this.centrosMostrados
          .map(c => this.capitalizarTexto((c[campo] || c['DMUNIC'] || '') as string))
          .filter(Boolean)
      )
    ).sort()

    this.municipiosNuevos = new Set(
      nuevaLista.filter(m => !this.municipiosAnteriores.has(m))
    )

    this.municipiosEnRango    = nuevaLista
    this.municipiosAnteriores = new Set(nuevaLista)
  }

  // ── Utilidades ──────────────────────────────────────────────────────
  private capitalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .split(' ')
      .map(p => {
        if (p.includes('/')) {
          return p.split('/').map(s => s.trim().charAt(0).toUpperCase() + s.trim().slice(1)).join('/')
        }
        return p.charAt(0).toUpperCase() + p.slice(1)
      })
      .join(' ')
  }

  private t(key: string): string {
    return this.translate.instant(key) || key
  }
}