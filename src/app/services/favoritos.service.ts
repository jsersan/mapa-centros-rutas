// favoritos.service.ts
// Guarda los códigos (CCEN) de los centros marcados como favoritos en
// localStorage, para que persistan entre sesiones en el mismo navegador.
import { Injectable } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class FavoritosService {
  private readonly KEY = 'fp-favoritos'
  private ids = new Set<string>()

  constructor() {
    this.cargar()
  }

  private cargar(): void {
    try {
      const raw = localStorage.getItem(this.KEY)
      if (raw) {
        const arr = JSON.parse(raw)
        if (Array.isArray(arr)) this.ids = new Set(arr.map(String))
      }
    } catch {
      /* localStorage no disponible o JSON inválido: se ignora */
    }
  }

  private guardar(): void {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(Array.from(this.ids)))
    } catch {
      /* p. ej. modo privado sin cuota: se ignora */
    }
  }

  es(ccen: any): boolean {
    return this.ids.has(String(ccen))
  }

  // Alterna el favorito y devuelve el nuevo estado (true = es favorito)
  alternar(ccen: any): boolean {
    const k = String(ccen)
    if (this.ids.has(k)) this.ids.delete(k)
    else this.ids.add(k)
    this.guardar()
    return this.ids.has(k)
  }

  quitar(ccen: any): void {
    this.ids.delete(String(ccen))
    this.guardar()
  }

  listaIds(): string[] {
    return Array.from(this.ids)
  }
}