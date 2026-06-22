// aplicar-nombres-euskera.mjs  (v3)
// ─────────────────────────────────────────────────────────────────────────────
// nomEuskera es OPCIONAL y está AUSENTE en las entradas → hay que INSERTARLO,
// no rellenar un hueco. Este script lo inserta justo detrás de `nom`,
// respetando comillas (' o ") e indentación, sin duplicar si ya existe.
//
//   node src/app/scripts/aplicar-nombres-euskera.mjs            ← DRY-RUN (+ preview)
//   node src/app/scripts/aplicar-nombres-euskera.mjs --commit   ← inserta + backup
// ─────────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ASIGNACION = join(__dirname, '..', '..', 'assets', 'data', 'asignacion.ts')

const NOM_EU = {
  10001: 'Mikroinformatika-sistemak eta -sareak',
  10002: 'Sareko informatika-sistemen administrazioa',
  10003: 'Plataforma anitzeko aplikazioen garapena',
  10004: 'Web aplikazioen garapena',
  10005: 'Merkataritza-jarduerak',
  10006: 'Elikagaiak merkaturatzea',
  10007: 'Nazioarteko merkataritza',
  10008: 'Salmenten eta merkataritza-espazioen kudeaketa',
  10009: 'Marketina eta publizitatea',
  10010: 'Garraioa eta logistika',
  10011: 'Administrazioa eta finantzak',
  10012: 'Zuzendaritzari laguntza',
  10013: 'Administrazio-kudeaketa',
  10014: 'Natura-inguruneko eta aisialdiko gidaritza',
  10015: 'Gizarte- eta kirol-irakaskuntza eta -animazioa',
  10016: 'Egokitzapen fisikoa',
  10017: 'Kirol-instalazioetarako sarbidea eta kontserbazioa',
  10018: 'Nekazaritza-ekoizpen ekologikoa',
  10019: 'Nekazaritzako eta abeltzaintzako produkzioa',
  10020: 'Lorezaintza eta loradenda',
  10021: 'Natura-ingurunea ustiatzea eta kontserbatzea',
  10022: 'Basoa eta natura-ingurunea kudeatzea',
  10023: 'Paisajismoa eta landa-ingurunea',
  10117: 'Abeltzaintza eta abere-osasuneko laguntza',          // ⚠
  10121: 'Oliba-olioa eta ardoak',                              // ⚠
  10024: 'Aurreinprimaketa digitala',
  10025: 'Inprimaketa grafikoa',
  10026: 'Argitalpen inprimatuen eta multimedien diseinua eta edizioa',
  10027: 'Produkzio grafikoaren diseinua eta kudeaketa',
  10028: 'Argitalpen inprimatuen eta multimedien diseinua eta edizioa',
  10118: 'Postinprimaketa eta akabera grafikoak',
  10029: 'Barnealdeko, dekorazioko eta birgaitze-obrak',
  10030: 'Eraikuntza',
  10031: 'Eraikuntza-proiektuak',
  10032: 'Obra zibileko proiektuak',
  10033: 'Eraikuntza-obren antolaketa eta kontrola',
  10034: 'Instalazio elektriko eta automatikoak',
  10035: 'Telekomunikazio-instalazioak',
  10036: 'Sistema elektrotekniko eta automatizatuak',
  10037: 'Telekomunikazio- eta informatika-sistemak',
  10038: 'Mantentze-lan elektronikoak',
  10039: 'Automatizazioa eta robotika industriala',
  10040: 'Elektromedikuntza klinikoa',
  10119: 'Gradu bikoitza: Instalazio elektriko eta automatikoak / Telekomunikazio-instalazioak', // ⚠
  10041: 'Energia-eraginkortasuna eta eguzki-energia termikoa',
  10042: 'Energia berriztagarriak',
  10043: 'Mekanizazioa',
  10044: 'Soldadura eta galdaragintza',
  10045: 'Fabrikazio mekanikoko produkzioaren programazioa',
  10046: 'Metalezko eraikuntzak',
  10047: 'Fabrikazio mekanikoko diseinua',
  10048: 'Sukaldaritza eta gastronomia',
  10049: 'Jatetxe-arloko zerbitzuak',
  10050: 'Ostatu turistikoen kudeaketa',
  10051: 'Bidaia-agentziak eta ekitaldien kudeaketa',
  10052: 'Turismoko gidaritza, informazioa eta laguntza',
  10053: 'Jatetxe-arloko zerbitzuen zuzendaritza',
  10054: 'Sukaldaritza-zuzendaritza',
  10131: 'Gradu bikoitza: Sukaldaritza-zuzendaritza / Jatetxe-arloko zerbitzuen zuzendaritza', // ⚠
  10055: 'Estetika eta edertasuna',
  10056: 'Ile-apainketa eta kosmetika kapilarra',
  10057: 'Estetika integrala eta ongizatea',
  10058: 'Ile-apainketako estilismoa eta zuzendaritza',
  10059: 'Irudi pertsonal eta korporatiboaren aholkularitza',
  10060: 'Karakterizazioa eta makillaje profesionala',
  10120: 'Termalismoa eta ongizatea',                           // ⚠
  10061: 'Bideoa, disc-jockeya eta soinua',                     // ⚠
  10062: '3D animazioak, jokoak eta ingurune interaktiboak',
  10063: 'Ikus-entzunezkoen eta ikuskizunen produkzioa',
  10064: 'Ikus-entzunezkoen eta ikuskizunen proiektuen errealizazioa',
  10065: 'Ikus-entzunezkoetarako eta ikuskizunetarako soinua',
  10066: 'Irudiaren argiztapena, kaptazioa eta tratamendua',
  10067: 'Okintza, gozogintza eta konfiteria',
  10068: 'Elikagaiak egitea',                                   // ⚠
  10069: 'Elikagaien industriako prozesuak eta kalitatea',
  10070: 'Beroa ekoizteko instalazioak',
  10071: 'Hozteko eta girotzeko instalazioak',
  10072: 'Mantentze-lan elektromekanikoak',
  10073: 'Laneko arriskuen prebentzioa',
  10074: 'Instalazio termiko eta fluidodunen proiektuen garapena',
  10075: 'Instalazio termiko eta fluidodunen mantentze-lanak',
  10076: 'Mekatronika industriala',
  10077: 'Arotzeria eta altzarigintza',
  10078: 'Instalazioa eta altzariz hornitzea',
  10079: 'Diseinua eta altzariz hornitzea',
  10080: 'Nabigazioa eta itsasertzeko arrantza',
  10081: 'Ontzien eta itsasontzien makineriaren mantentze-lanak eta kontrola',
  10082: 'Urpeko eta presio handiko eragiketak',               // ⚠
  10083: 'Itsas garraioa eta alturako arrantza',
  10084: 'Akuikultura',
  10085: 'Ontzien eta itsasontzien makineriaren antolaketa eta mantentze-lanak', // ⚠
  10086: 'Planta kimikoa',
  10087: 'Laborategiko eragiketak',
  10088: 'Analisiko eta kalitate-kontroleko laborategia',
  10089: 'Kimika industriala',
  10090: 'Produktu farmazeutiko, bioteknologiko eta antzekoen fabrikazioa',
  10091: 'Erizaintzako zainketa osagarriak',
  10092: 'Osasun-larrialdiak',
  10093: 'Farmazia eta parafarmazia',
  10094: 'Dietetika',
  10095: 'Ortoprotesiak eta laguntza-produktuak',
  10096: 'Anatomia patologikoa eta zitodiagnostikoa',
  10097: 'Osasun-dokumentazioa eta -administrazioa',
  10098: 'Aho-hortzetako higienea',
  10099: 'Diagnostikorako irudia eta medikuntza nuklearra',
  10100: 'Laborategi kliniko eta biomedikoa',
  10101: 'Erradioterapia eta dosimetria',
  10122: 'Protesi-audiologia',
  10123: 'Hortz-protesiak',
  10124: 'Larrialdiak eta babes zibila',                        // ⚠
  10125: 'Ingurumen-osasun aplikatua',                          // ⚠
  10126: 'Larrialdien eta babes zibilaren koordinazioa',
  10102: 'Ingurumen-hezkuntza eta -kontrola',
  10103: 'Kimika eta ingurumen-osasuna',
  10104: 'Mendekotasun-egoeran dauden pertsonentzako arreta',
  10105: 'Haur-hezkuntza',
  10106: 'Gizarteratzea',
  10107: 'Animazio soziokulturala eta turistikoa',
  10108: 'Genero-berdintasuna sustatzea',
  10109: 'Mugikortasun seguru eta jasangarrirako prestakuntza', // ⚠
  10127: 'Komunikazio-bitartekaritza',
  10110: 'Jantzigintza eta moda',
  10111: 'Patroigintza eta moda',
  10112: 'Neurriko eta ikuskizunetarako jantzigintza',
  10128: 'Ehungintzako eta larrugintzako diseinu teknikoa',     // ⚠
  10113: 'Karrozeria',
  10114: 'Automobilen elektromekanika',
  10115: 'Makineriaren elektromekanika',
  10116: 'Automozioa',
  10129: 'Errepideko garraio-ibilgailuak gidatzea',             // ⚠
  10130: 'Turbina-motordun hegazkinen mantentze-lan aeromekanikoak'
}

// ── helpers ──────────────────────────────────────────────────────────────────
const key = name => `["']?${name}["']?`                  // clave con/sin comillas
const escFor = (s, q) => s.replace(/\\/g, '\\\\').replace(new RegExp(q, 'g'), '\\' + q)

const COMMIT = process.argv.includes('--commit')

if (!existsSync(ASIGNACION)) {
  console.error(`❌ No encuentro:\n   ${ASIGNACION}`); process.exit(1)
}

let text = readFileSync(ASIGNACION, 'utf8')

const insertados = []
const yaTenian = []
const noEncontrados = []
const sinNom = []
let previewMostrada = false

for (const [codStr, nomEu] of Object.entries(NOM_EU)) {
  const cod = Number(codStr)

  // inicio del OBJETO de datos: codcicl + número (no engancha la interfaz)
  const m = new RegExp(`${key('codcicl')}\\s*:\\s*${cod}\\b`).exec(text)
  if (!m) { noEncontrados.push(cod); continue }

  const start = m.index
  const after = text.slice(start + m[0].length)
  const rel = after.search(new RegExp(`${key('codcicl')}\\s*:\\s*\\d`))
  const end = rel === -1 ? text.length : start + m[0].length + rel
  const block = text.slice(start, end)

  // si ya tiene nomEuskera (cualquier valor) → no tocar
  if (new RegExp(`${key('nomEuskera')}\\s*:`).test(block)) { yaTenian.push(cod); continue }

  // localizar el campo nom: captura opcional de salto+indentación previa,
  // la asignación de nom completa y la comilla usada.
  const nomRe = new RegExp(
    `(\\n([ \\t]*))?(${key('nom')}\\s*:\\s*(["'])(?:\\\\.|(?!\\4).)*\\4)`
  )
  const nm = nomRe.exec(block)
  if (!nm) { sinNom.push(cod); continue }

  const indent = nm[2]            // indentación de la línea de nom (si multilínea)
  const nomAssign = nm[3]
  const q = nm[4]
  const valor = `${q}${escFor(nomEu, q)}${q}`

  // multilínea → nueva línea con misma indentación; una sola línea → inline
  const insercion = indent != null
    ? `${nm[1]}${nomAssign},\n${indent}nomEuskera: ${valor}`
    : `${nm[0]}, nomEuskera: ${valor}`

  const nuevoBlock = block.replace(nm[0], insercion)
  text = text.slice(0, start) + nuevoBlock + text.slice(end)
  insertados.push(cod)

  if (!previewMostrada) {
    previewMostrada = true
    const ni = nuevoBlock.search(new RegExp(key('nom') + '\\s*:'))
    console.log('🔍 Vista previa (primer ciclo insertado):')
    console.log('   …' + nuevoBlock.slice(ni, ni + 160).replace(/\n/g, '\n   ') + '…\n')
  }
}

console.log('─'.repeat(60))
console.log(COMMIT ? '✏️  MODO COMMIT' : '👀 DRY-RUN (no escribe)')
console.log('─'.repeat(60))
console.log(`✅ A insertar:        ${insertados.length}`)
console.log(`↪️  Ya tenían campo:  ${yaTenian.length}`)
if (sinNom.length)        console.log(`⚠️  Sin campo nom:     ${sinNom.join(', ')}`)
if (noEncontrados.length) console.log(`❓ codcicl no hallado: ${noEncontrados.join(', ')}`)

if (COMMIT && insertados.length > 0) {
  copyFileSync(ASIGNACION, ASIGNACION + '.bak')
  writeFileSync(ASIGNACION, text, 'utf8')
  console.log(`\n💾 Backup:  ${ASIGNACION}.bak`)
  console.log(`💾 Insertados ${insertados.length} nomEuskera. Revisa con  git diff  y  ng serve.`)
} else if (COMMIT) {
  console.log('\n(No se escribió nada: 0 inserciones.)')
} else {
  console.log('\nSi la vista previa cuadra, repite con  --commit')
}
