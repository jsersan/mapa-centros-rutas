// geoip.service.ts
// Localiza la ciudad/coordenadas aproximadas a partir de la IP del navegador.
//
// Usa servicios públicos gratuitos por HTTPS y SIN clave (con límites de uso):
//   1) https://ipapi.co/json/   (principal)
//   2) https://ipwho.is/        (respaldo)
//
// NOTA: la geolocalización por IP es aproximada (nivel ciudad/proveedor) y puede
// fallar tras un VPN/proxy. Si necesitas más precisión o más volumen de peticiones,
// sustituye estos endpoints por un proveedor con clave (p. ej. ipinfo.io, ipgeolocation.io).
import { Injectable } from '@angular/core'

export interface OrigenIp {
  lat: number
  lng: number
  ciudad: string
  region?: string
  pais?: string
  ip?: string
  proveedor: string
}

@Injectable({ providedIn: 'root' })
export class GeoIpService {
  private readonly TIMEOUT_MS = 6000
  private cache: OrigenIp | null = null

  private async fetchJson(url: string): Promise<any | null> {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), this.TIMEOUT_MS)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) return null
      return await res.json()
    } catch {
      return null
    } finally {
      clearTimeout(id)
    }
  }

  // Devuelve la ubicación aproximada de la IP, o null si ningún servicio responde.
  async localizar(): Promise<OrigenIp | null> {
    if (this.cache) return this.cache

    // Proveedor 1: ipapi.co
    const d1 = await this.fetchJson('https://ipapi.co/json/')
    if (
      d1 &&
      typeof d1.latitude === 'number' &&
      typeof d1.longitude === 'number'
    ) {
      this.cache = {
        lat: d1.latitude,
        lng: d1.longitude,
        ciudad: d1.city || '',
        region: d1.region,
        pais: d1.country_name,
        ip: d1.ip,
        proveedor: 'ipapi.co'
      }
      console.log('🌐 Geo-IP (ipapi.co):', this.cache)
      return this.cache
    }

    // Proveedor 2 (respaldo): ipwho.is
    const d2 = await this.fetchJson('https://ipwho.is/')
    if (
      d2 &&
      d2.success !== false &&
      typeof d2.latitude === 'number' &&
      typeof d2.longitude === 'number'
    ) {
      this.cache = {
        lat: d2.latitude,
        lng: d2.longitude,
        ciudad: d2.city || '',
        region: d2.region,
        pais: d2.country,
        ip: d2.ip,
        proveedor: 'ipwho.is'
      }
      console.log('🌐 Geo-IP (ipwho.is):', this.cache)
      return this.cache
    }

    console.warn('⚠️ Geo-IP: ningún proveedor devolvió coordenadas')
    return null
  }

  limpiar(): void {
    this.cache = null
  }
}