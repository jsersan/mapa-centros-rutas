// audit-euskera.ts
import ciclos from '../../assets/data/asignacion'

const faltan = ciclos.filter(c => !c.nomEuskera || !c.nomEuskera.trim())
console.log(`Ciclos sin nomEuskera: ${faltan.length}`)
faltan.forEach(c => console.log(`  codcicl=${c.codcicl}  ${c.nom}`))