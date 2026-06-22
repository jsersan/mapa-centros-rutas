export interface Asignacion {
  codcicl: number
  nom: string
  nomEuskera?: string
  slugEuskera?: string
  abr: string
  familiaCodigo: string
  familia: string
  grado: 'Básico' | 'Medio' | 'Superior'
  modalidad: 'Presencial' | 'Dual' | 'Distancia'
  turno: 'Diurno' | 'Vespertino' | 'Nocturno' | 'Mixto'
  idiomas: ('ES' | 'EU' | 'EN')[]
  centros: number[]
  duracion?: number
}

export interface asignacionDetalle {
  grado: 'B' | 'M' | 'S'
  nombre: string
  codigoCentro: string
  nombreCentro: string
  modeloLing: string
}

const familiasProfesionalesMap: Record<string, string> = {
  '0': 'Seleccione Familia Profesional',
  '1': 'Actividades Físicas y Deportivas',
  '2': 'Administración y Gestión',
  '3': 'Agraria',
  '4': 'Artes Gráficas',
  '5': 'Comercio y Marketing',
  '6': 'Edificación y Obra Civil',
  '7': 'Electricidad y Electrónica',
  '8': 'Energía y Agua',
  '9': 'Fabricación Mecánica',
  '10': 'Hostelería y Turismo',
  '11': 'Imagen Personal',
  '12': 'Imagen y Sonido',
  '13': 'Industrias Alimentarias',
  '14': 'Informática y Comunicaciones',
  '15': 'Instalación y Mantenimiento',
  '16': 'Madera, Mueble y Corcho',
  '17': 'Marítimo Pesquera',
  '18': 'Química',
  '19': 'Sanidad',
  '20': 'Seguridad y Medio Ambiente',
  '21': 'Servicios Socioculturales y a la Comunidad',
  '22': 'Textil, Confección y Piel',
  '23': 'Transporte y Mantenimiento de Vehículos'
}

const mapaFamiliaNombreACodigo: Record<string, string> = {
  'Seleccione Familia Profesional': 'SEL',
  'Actividades Físicas y Deportivas': 'AFD',
  'Administración y Gestión': 'ADM',
  'Agraria': 'AGA',
  'Artes Gráficas': 'ARG',
  'Comercio y Marketing': 'COM',
  'Edificación y Obra Civil': 'EOC',
  'Electricidad y Electrónica': 'ELE',
  'Energía y Agua': 'ENA',
  'Fabricación Mecánica': 'FME',
  'Hostelería y Turismo': 'HOT',
  'Imagen Personal': 'IMP',
  'Imagen y Sonido': 'IMS',
  'Industrias Alimentarias': 'INA',
  'Informática y Comunicaciones': 'IFC',
  'Instalación y Mantenimiento': 'IMA',
  'Madera, Mueble y Corcho': 'MMC',
  'Marítimo Pesquera': 'MAP',
  'Química': 'QUI',
  'Sanidad': 'SAN',
  'Seguridad y Medio Ambiente': 'SEA',
  'Servicios Socioculturales y a la Comunidad': 'SSC',
  'Textil, Confección y Piel': 'TCP',
  'Transporte y Mantenimiento de Vehículos': 'TMV'
}

function determinarGrado(codcicl: number, nom: string): 'Básico' | 'Medio' | 'Superior' {
  const nombreLower = nom.toLowerCase()
  
  if (codcicl >= 1000000 || 
      nombreLower.includes('fpb') || 
      nombreLower.includes('básic') || 
      nombreLower.includes('basico') ||
      nombreLower.includes('acceso y conservación')) {
    return 'Básico'
  }
  
  const palabrasSuperior = [
    'administración y finanzas', 'asistente a la dirección', 'comercio internacional',
    'transporte y logistica', 'marketing y publicidad', 'proyectos de edificación',
    'proyectos de obra civil', 'organización y control', 'sistemas electrotécnicos',
    'sistemas de telecomunicaciones', 'automatización y robótica', 'electromedicina',
    'eficiencia energética', 'energías renovables', 'programación de la producción',
    'construcciones metálicas', 'diseño en fabricación', 'diseño y gestión',
    'diseño y edición', 'gestión de alojamientos', 'agencias de viajes',
    'guía, información', 'dirección de', 'estética integral', 'estilismo y dirección',
    'asesoría de imagen', 'caracterización y maquillaje', 'animaciones 3d',
    'producción de audiovisuales', 'realización de proyectos', 'sonido para audiovisuales',
    'iluminación, captación', 'procesos y calidad', 'administracion de sistemas',
    'desarrollo de aplicaciones', 'prevención de riesgos', 'desarrollo de proyectos',
    'mecatrónica', 'diseño y amueblamiento', 'transporte marítimo',
    'operaciones subacuáticas', 'organización y mantenimiento', 'acuicultura',
    'laboratorio de análisis', 'química industrial', 'fabricación de productos farmaceúticos',
    'anatomía patológica', 'documentación y administración', 'imagen para el diagnóstico',
    'laboratorio clínico', 'radioterapia', 'química y salud', 'integración social',
    'animación sociocultural', 'promoción de igualdad', 'formación para la movilidad',
    'ganadería', 'termalismo', 'audiología', 'prótesis dentales', 'coordinación de emergencias', 'mediación comunicativa', 'diseño técnico en textil', 'aeromecánico',
    'patronaje', 'vestuario a medida', 'automoción', 'paisajismo'
  ]
  
  for (const palabra of palabrasSuperior) {
    if (nombreLower.includes(palabra)) {
      return 'Superior'
    }
  }
  
  return 'Medio'
}

const ciclosJSONData = [
    {"codcicl": 10014,"nom": "Guía en el medio natural y de tiempo libre", nomEuskera: "Natura-inguruneko eta aisialdiko gidaritza","abr": "GTL","fam":"1","centros": [10138,12229,13015,13023,15307,10254,13656,15305]},
    {"codcicl": 10015,"nom": "Enseñanza y Animación Sociodeportiva", nomEuskera: "Gizarte- eta kirol-irakaskuntza eta -animazioa","abr": "EAS","fam":"1","centros": [10138,12053,12229,13023,14010,14069,14301,15307,10221,12345,12372,13656,14669]},
    {"codcicl": 10016,"nom": "Acondicionamiento Físico", nomEuskera: "Egokitzapen fisikoa","abr": "AFI","fam":"1","centros": [12053,12229,13015,13023,14010,10254,13656,14669,15305]},
    {"codcicl": 10017,"nom": "Acceso y conservación en instalaciones deportivas", nomEuskera: "Kirol-instalazioetarako sarbidea eta kontserbazioa","abr": "FPB","fam":"1","centros": [14899,15305]},
    {"codcicl": 10011,"nom": "Administración y Finanzas", nomEuskera: "Administrazioa eta finantzak","abr": "ADF","fam":"2","centros": [10137,10201,12053,12108,12132,12298,12982,13020,13022,13023,13432,13556,13613,14069,14088,14279,14950,15112,15630,15666,15763,10248,12462,12479,12490,12497,12581,12742,12746,14615,14635,14669,14696,14704,14718,14728,14747,14775,14779,14797,14810]},
    {"codcicl": 10012,"nom": "Asistente a la Dirección", nomEuskera: "Zuzendaritzari laguntza","abr": "AD","fam":"2","centros": [10137,10201,12982,13020,13432,14088,14279,14950,15112,15763,10248,12490,12742,14669,14728]},
    {"codcicl": 10013,"nom": "Gestión Admministrativa", nomEuskera: "Administrazio-kudeaketa","abr": "GA","fam":"2","centros": [10137,10201,10349,12053,12108,12982,13020,13022,13432,13556,14069,14088,14279,14950,15080,15108,15624,15630,15666,15763,10248,12497,12544,14615,14635,14696,14704,14728,14747,14779,14810]},
    {"codcicl": 10018,"nom": "Producción agroecológica", nomEuskera: "Nekazaritza-ekoizpen ekologikoa","abr": "PAG","fam":"3","centros": [10108,14949]},
    {"codcicl": 10019,"nom": "Producción agropecuaria", nomEuskera: "Nekazaritzako eta abeltzaintzako produkzioa","abr": "PAO","fam":"3","centros": [12040]},
    {"codcicl": 10020,"nom": "Jardinería y floristería", nomEuskera: "Lorezaintza eta loradenda","abr": "PAP","fam":"3","centros": [10108,12040,14949]},
    {"codcicl": 10021,"nom": "Aprovechamiento y Conservación del Medio Natural", nomEuskera: "Natura-ingurunea ustiatzea eta kontserbatzea","abr": "ACM","fam":"3","centros": [10745]},
    {"codcicl": 10022,"nom": "Gestión Forestal y del Medio Natural", nomEuskera: "Basoa eta natura-ingurunea kudeatzea","abr": "GFM","fam":"3","centros": [10745,12040,14949,14824]},
    {"codcicl": 10023,"nom": "Paisajismo y Medio Rural", nomEuskera: "Paisajismoa eta landa-ingurunea","abr": "PMR","fam":"3","centros": [10108,14949]},
    {"codcicl": 10024,"nom": "Preimpresión Digital", nomEuskera: "Aurreinprimaketa digitala","abr": "PID","fam":"4","centros": [14205,12498]},
    {"codcicl": 10025,"nom": "Impresión Gráfica", nomEuskera: "Inprimaketa grafikoa","abr": "IGR","fam":"4","centros": [10138,14205,12572]},
    {"codcicl": 10026,"nom": "Diseño y Edición de publicaciones impresas y multimedia", nomEuskera: "Argitalpen inprimatuen eta multimedien diseinua eta edizioa","abr": "DPI","fam":"4","centros": [10138,14205,12498,12572]},
    {"codcicl": 10027,"nom": "Diseño y Gestión de la Producción Gráfica", nomEuskera: "Produkzio grafikoaren diseinua eta kudeaketa","abr": "DPG","fam":"4","centros": [14205]},
    {"codcicl": 10028,"nom": "Diseño y Edición de publicaciones impresas y multimedia", nomEuskera: "Argitalpen inprimatuen eta multimedien diseinua eta edizioa","abr": "DPI","fam":"4","centros": [10138,14205,12498,12572]},
    {"codcicl": 10005,"nom": "Actividades Comerciales", nomEuskera: "Merkataritza-jarduerak","abr": "AC","fam":"5","centros": [10137,12053,12982,13023,15112,15628,15763,12544,14696,14747,15069]},
    {"codcicl": 10006,"nom": "Comercialización de Productos Alimentarios", nomEuskera: "Elikagaiak merkaturatzea","abr": "CPA","fam":"5","centros": [12229]},
    {"codcicl": 10007,"nom": "Comercio Internacional", nomEuskera: "Nazioarteko merkataritza","abr": "CI","fam":"5","centros": [10137,12053,12108,13613,14422,15112,12497,14620,14669]},
    {"codcicl": 10008,"nom": "Gestión de Ventas y Espacios Comerciales", nomEuskera: "Salmenten eta merkataritza-espazioen kudeaketa","abr": "GV","fam":"5","centros": [10137,12982,15763,14669,14747,14837]},
    {"codcicl": 10009,"nom": "Marketing y Publicidad", nomEuskera: "Marketina eta publizitatea","abr": "MP","fam":"5","centros": [10137,12982,13613,15763,10248,12462,12479,12490,12497,14669,14696,14779,14810,15305]},
    {"codcicl": 10010,"nom": "Transporte y Logistica", nomEuskera: "Garraioa eta logistika","abr": "TL","fam":"5","centros": [10137,12053,12108,15628,15666,14620,14718]},
    {"codcicl": 10029,"nom": "Obras de Interior, Decoración y Rehabilitación", nomEuskera: "Barnealdeko, dekorazioko eta birgaitze-obrak","abr": "ODR","fam":"6","centros": [10296,13532,14945]},
    {"codcicl": 10030,"nom": "Cosntrucción", nomEuskera: "Eraikuntza","abr": "CON","fam":"6","centros": [10296,13532,14945]},
    {"codcicl": 10031,"nom": "Proyectos de edificación", nomEuskera: "Eraikuntza-proiektuak","abr": "PRE","fam":"6","centros": [10296,12229,14069,14205,14945]},
    {"codcicl": 10032,"nom": "Proyectos de Obra Civil", nomEuskera: "Obra zibileko proiektuak","abr": "POC","fam":"6","centros": [10296,13532,14069,15112]},
    {"codcicl": 10033,"nom": "Organización y control de obras de construcción", nomEuskera: "Eraikuntza-obren antolaketa eta kontrola","abr": "OCO","fam":"6","centros": [10296,13532,14945]},
    {"codcicl": 10034,"nom": "Instalaciones eléctricas y automáticas", nomEuskera: "Instalazio elektriko eta automatikoak","abr": "IEA","fam":"7","centros": [10138,10201,12054,12229,13020,13021,13022,13023,13534,13613,14069,14088,14205,14422,15108,15112,15630,10248,12572,13380,14634,14664,14680,14723,14728,14775,14779,14824,14845]},
    {"codcicl": 10035,"nom": "Instalaciones de Telecomunicaciones", nomEuskera: "Telekomunikazio-instalazioak","abr": "IDT","fam":"7","centros": [10138,12468,13021,14205,14279,14301,14422,14779]},
    {"codcicl": 10036,"nom": "Sistemas Electrotécnicos y Automatizados", nomEuskera: "Sistema elektrotekniko eta automatizatuak","abr": "SEA","fam":"7","centros": [10201,12132,12229,13021,13534,14069,14205,14422,15108,15112,15630,10248,12572,14664,14728,14779,14824,14845]},
    {"codcicl": 10037,"nom": "Sistemas de Telecomunicaciones e Informáticos", nomEuskera: "Telekomunikazio- eta informatika-sistemak","abr": "STI","fam":"7","centros": [12054,13021,14069,14205,14279,14422,15630,10248,14718,14779]},
    {"codcicl": 10038,"nom": "Mantenimiento Electrónico", nomEuskera: "Mantentze-lan elektronikoak","abr": "MNE","fam":"7","centros": [12054,12468,13021,14205,15630,10248,12746,14634,14664,14779,14824]},
    {"codcicl": 10039,"nom": "Automatización y Robótica Industrial", nomEuskera: "Automatizazioa eta robotika industriala","abr": "ARI","fam":"7","centros": [10138,10201,12054,12229,13020,13022,13023,13613,14069,14088,14205,14301,15666,10248,12456,12572,12581,12593,12742,13380,14664,14723,14728,14775,14779,14837]},
    {"codcicl": 10040,"nom": "Electromedicina clínica", nomEuskera: "Elektromedikuntza klinikoa","abr": "ELM","fam":"7","centros": [15666]},
    {"codcicl": 10041,"nom": "Eficiencia energética y energía solar térmica", nomEuskera: "Energia-eraginkortasuna eta eguzki-energia termikoa","abr": "EEE","fam":"8","centros": [10296,13022,15666,15763,14775,14828]},
    {"codcicl": 10042,"nom": "Energías Renovables", nomEuskera: "Energia berriztagarriak","abr": "ENR","fam":"8","centros": [10296,13022,14422,15763,12456,14779]},
    {"codcicl": 10043,"nom": "Mecanizado", nomEuskera: "Mekanizazioa","abr": "MEC","fam":"9","centros": [10138,10201,10319,12054,12229,12763,13015,13020,13021,13022,13023,13255,13534,13556,14069,14088,14205,14301,14422,14950,15021,15108,15112,10248,12581,12593,12742,13380,14664,14723,14728,14779,14824,14837]},
    {"codcicl": 10044,"nom": "Soldadura y Calderería", nomEuskera: "Soldadura eta galdaragintza","abr": "SYC","fam":"9","centros": [10138,10201,12468,13023,13255,13432,14069,14945,15112,15628,10248,12581,12746,14680,14775,14779,14828,15069]},
    {"codcicl": 10045,"nom": "Programación de la producción en fabricación mecánica", nomEuskera: "Fabrikazio mekanikoko produkzioaren programazioa","abr": "PFM","fam":"9","centros": [10138,10201,12054,12229,12763,13020,13021,13022,13023,13556,14069,14088,14205,14301,14422,14950,15021,15108,15112,10248,12456,12581,12593,12742,12746,13380,14664,14723,14775,14779,14837]},
    {"codcicl": 10046,"nom": "Construcciones metálicas", nomEuskera: "Metalezko eraikuntzak","abr": "COM","fam":"9","centros": [10138,12468,13023,13255,13432,14069,15628,12581,14779,14828]},
    {"codcicl": 10047,"nom": "Diseño en Fabricación Mecánica", nomEuskera: "Fabrikazio mekanikoko diseinua","abr": "DFM","fam":"9","centros": [10138,12054,12229,12763,13020,13021,13023,13534,13613,14069,14205,15021,15112,10248,12456,12581,12746,13380,14664,14723,14728,14779,14837]},
    {"codcicl": 10048,"nom": "Cocina y Gatronomía", nomEuskera: "Sukaldaritza eta gastronomia","abr": "CYG","fam":"10","centros": [10256,13613,14340,15176,10248,12491,13070,15069,15325]},
    {"codcicl": 10049,"nom": "Servicios en Restauración", nomEuskera: "Jatetxe-arloko zerbitzuak","abr": "SER","fam":"10","centros": [10256,14340,15176,10248,12491,15069,15325]},
    {"codcicl": 10050,"nom": "Gestión de Alojamientos Turísticos", nomEuskera: "Ostatu turistikoen kudeaketa","abr": "GAT","fam":"10","centros": [12982,12491,15234]},
    {"codcicl": 10051,"nom": "Agencias de Viajes y Gestión de Eventos", nomEuskera: "Bidaia-agentziak eta ekitaldien kudeaketa","abr": "AVE","fam":"10","centros": [12982,15112,14631,14635]},
    {"codcicl": 10052,"nom": "Guía, Información y Asistencias Turísticas", nomEuskera: "Turismoko gidaritza, informazioa eta laguntza","abr": "IAT","fam":"10","centros": [10134,12982,15112,14631,14635]},
    {"codcicl": 10053,"nom": "Dirección de servicios en restauración", nomEuskera: "Jatetxe-arloko zerbitzuen zuzendaritza","abr": "DSR","fam":"10","centros": [10256,13022,14340,15325]},
    {"codcicl": 10054,"nom": "Dirección de cocina", nomEuskera: "Sukaldaritza-zuzendaritza","abr": "DDC","fam":"10","centros": [10256,14340,10248,12491,15325]},
    {"codcicl": 10055,"nom": "Estética y Belleza", nomEuskera: "Estetika eta edertasuna","abr": "EYB","fam":"11","centros": [10138,10351,12291,14069,12756,13500,14621,14648]},
    {"codcicl": 10056,"nom": "Peluquería y Cosmética Capilar", nomEuskera: "Ile-apainketa eta kosmetika kapilarra","abr": "PCP","fam":"11","centros": [12291,14069,14422,10248,12756,13500,14621,14635,14643,14648]},
    {"codcicl": 10057,"nom": "Estética Integral y Bienestar", nomEuskera: "Estetika integrala eta ongizatea","abr": "EIB","fam":"11","centros": [12291,14069,10248,14621]},
    {"codcicl": 10058,"nom": "Estilismo y Dirección de Peluquería", nomEuskera: "Ile-apainketako estilismoa eta zuzendaritza","abr": "EDP","fam":"11","centros": [10138,12291,14422]},
    {"codcicl": 10059,"nom": "Asesoría de Imagen Personal y Corporativa", nomEuskera: "Irudi pertsonal eta korporatiboaren aholkularitza","abr": "APC","fam":"11","centros": [10138,12291,14069,14622]},
    {"codcicl": 10060,"nom": "Caracterización y Maquillaje Profesional", nomEuskera: "Karakterizazioa eta makillaje profesionala","abr": "CMP","fam":"11","centros": [12291,14422]},
    {"codcicl": 10061,"nom": "Video, disc-jockey y sonido", nomEuskera: "Bideoa, disc-jockeya eta soinua","abr": "VDS","fam":"12","centros": [12394]},
    {"codcicl": 10062,"nom": "Animaciones 3D, Juegos y Entornos Interactivos", nomEuskera: "3D animazioak, jokoak eta ingurune interaktiboak","abr": "AJE","fam":"12","centros": [13613,15630,12394,12498,14747,15305]},
    {"codcicl": 10063,"nom": "Producción de Audiovisuales y Espectáculos", nomEuskera: "Ikus-entzunezkoen eta ikuskizunen produkzioa","abr": "PAE","fam":"12","centros": [15630,12394]},
    {"codcicl": 10064,"nom": "Realización de Proyectos de Audiovisuales y Espectáculos", nomEuskera: "Ikus-entzunezkoen eta ikuskizunen proiektuen errealizazioa","abr": "CMP","fam":"12","centros": [10138,15630,12394]},
    {"codcicl": 10065,"nom": "Sonido para Audiovisuales y Espectáculos", nomEuskera: "Ikus-entzunezkoetarako eta ikuskizunetarako soinua","abr": "SAE","fam":"12","centros": [15630,12394]},
    {"codcicl": 10066,"nom": "Iluminación, Captación y Tratamiento de Imagen", nomEuskera: "Irudiaren argiztapena, kaptazioa eta tratamendua","abr": "ICI","fam":"12","centros": [12394]},
    {"codcicl": 10067,"nom": "Panadería, repostería y confitería", nomEuskera: "Okintza, gozogintza eta konfiteria","abr": "PRC","fam":"13","centros": [10256,14340,15176,12491]},
    {"codcicl": 10068,"nom": "Elaboracion de productos alimenticios", nomEuskera: "Elikagaiak egitea","abr": "PRC","fam":"13","centros": [12040]},
    {"codcicl": 10069,"nom": "Procesos y Calidad en la Industria Alimentaria", nomEuskera: "Elikagaien industriako prozesuak eta kalitatea","abr": "PRC","fam":"13","centros": [12468,14775]},
    {"codcicl": 10001,"nom": "Sistemas MicroInformaticos y redes", nomEuskera: "Mikroinformatika-sistemak eta -sareak","abr": "SM","fam":"14","centros": [10137,10201,12053,12108,12132,12982,13020,13023,13534,13556,14422,14945,15112,15628,15763,10248,12345,12497,14615,14620,14669,14696,14747,14779,14837,15305]},
    {"codcicl": 10002,"nom": "Administracion de Sistemas Informáticos en Red", nomEuskera: "Sareko informatika-sistemen administrazioa","abr": "SI","fam":"14","centros": [10137,12053,12108,12468,12982,13023,13613,15112,15763,10248,12456,12479,12485,14615,14669,14696,14718,14728,14747,14779,14837]},
    {"codcicl": 10003,"nom": "Desarrollo de Aplicaciones Multiplataforma", nomEuskera: "Plataforma anitzeko aplikazioen garapena","abr": "DAM","fam":"14","centros": [10137,12053,12108,12982,13023,13556,13613,14422,15112,15628,15630,15763,10248,12485,12497,12581,14615,14620,14631,14669,14779,14786]},
    {"codcicl": 10004,"nom": "Desarrollo de Aplicaciones Web", nomEuskera: "Web aplikazioen garapena","abr": "DAW","fam":"14","centros": [10137,12053,12108,12982,13020,13022,13613,14422,14451,14945,15112,15628,15630,15763,10248,12479,12490,14620,14631,14696,14718,14747,14775,14779]},
    {"codcicl": 10070,"nom": "Instalaciones de producción de calor", nomEuskera: "Beroa ekoizteko instalazioak","abr": "IPC","fam":"15","centros": [10296,12468,15666,14680,14775]},
    {"codcicl": 10071,"nom": "Instalaciones frigoríficas y de climatización", nomEuskera: "Hozteko eta girotzeko instalazioak","abr": "IFC","fam":"15","centros": [10296,12468,13022,15666,14828,15069]},
    {"codcicl": 10072,"nom": "Mantenimiento Electromecánico", nomEuskera: "Mantentze-lan elektromekanikoak","abr": "MEL","fam":"15","centros": [10138,10201,10319,12054,12763,13015,13021,13022,13534,13556,14069,14205,14279,15628,10248,12529,12572,12581,12593,12742,12746,14664,14775,14779]},
    {"codcicl": 10073,"nom": "Prevención de Riesgos Laborales", nomEuskera: "Laneko arriskuen prebentzioa","abr": "PRL","fam":"15","centros": [10296,12229,14945,14779]},
    {"codcicl": 10074,"nom": "Desarrollo de proyectos de instalaciones térmicas y de fluidos", nomEuskera: "Instalazio termiko eta fluidodunen proiektuen garapena","abr": "DIT","fam":"15","centros": [15666]},
    {"codcicl": 10075,"nom": "Mantenimiento de instalaciones térmicas y de fluidos", nomEuskera: "Instalazio termiko eta fluidodunen mantentze-lanak","abr": "MIT","fam":"15","centros": [10296,12468,13022,13023,14441,15112,14680]},
    {"codcicl": 10076,"nom": "Mecatrónica Industrial", nomEuskera: "Mekatronika industriala","abr": "MEI","fam":"15","centros": [10138,10201,10319,12054,12468,12763,13020,13023,13556,14069,14279,15628,10248,12456,12581,12593,13380,14664,14775,14779]},
    {"codcicl": 10077,"nom": "Carpintería y mueble", nomEuskera: "Arotzeria eta altzarigintza","abr": "CYM","fam":"16","centros": [12229,14680,15069]},
    {"codcicl": 10078,"nom": "Instalación y Amueblamiento", nomEuskera: "Instalazioa eta altzariz hornitzea","abr": "IYA","fam":"16","centros": [10296,12229,13021,13556,14069,15021]},
    {"codcicl": 10079,"nom": "Diseño y Amueblamiento", nomEuskera: "Diseinua eta altzariz hornitzea","abr": "DYA","fam":"16","centros": [12229,13021,13556,15069]},
    {"codcicl": 10080,"nom": "Navegación y Pesca de Litoral", nomEuskera: "Nabigazioa eta itsasertzeko arrantza","abr": "NPL","fam":"17","centros": [12151,14601,14781]},
    {"codcicl": 10081,"nom": "Mantenimiento y Control de la Maquinaria de Buques y Embarcaciones", nomEuskera: "Ontzien eta itsasontzien makineriaren mantentze-lanak eta kontrola","abr": "MMB","fam":"17","centros": [12151,14601,14781]},
    {"codcicl": 10082,"nom": "Operaciones Subacuáticas e Hiperbáricas", nomEuskera: "Urpeko eta presio handiko eragiketak","abr": "OSH","fam":"17","centros": [12151]},
    {"codcicl": 10083,"nom": "Transporte Marítimo y Pesca de Altura", nomEuskera: "Itsas garraioa eta alturako arrantza","abr": "TMP","fam":"17","centros": [12151,14601,14781]},
    {"codcicl": 10084,"nom": "Acuicultura", nomEuskera: "Akuikultura","abr": "ACU","fam":"17","centros": [13533]},
    {"codcicl": 10085,"nom": "Organización y Mantenimiento de Maquinaria de Buques y Embarcaciones", nomEuskera: "Ontzien eta itsasontzien makineriaren antolaketa eta mantentze-lanak","abr": "OMB","fam":"17","centros": [12151,14601,14781]},
    {"codcicl": 10086,"nom": "Planta química", nomEuskera: "Planta kimikoa","abr": "PAQ","fam":"18","centros": [12468,13023]},
    {"codcicl": 10087,"nom": "Operaciones de Laboratorio", nomEuskera: "Laborategiko eragiketak","abr": "ODL","fam":"18","centros": [10133,15112]},
    {"codcicl": 10088,"nom": "Laboratorio de análisis y de control de calidad", nomEuskera: "Analisiko eta kalitate-kontroleko laborategia","abr": "LAC","fam":"18","centros": [12468,14422,15112,15763,10248,14634,14718]},
    {"codcicl": 10089,"nom": "Química industrial", nomEuskera: "Kimika industriala","abr": "QII","fam":"18","centros": [12468,13023,14634]},
    {"codcicl": 10090,"nom": "Fabricación de productos farmaceúticos, biotecnológicos y afines", nomEuskera: "Produktu farmazeutiko, bioteknologiko eta antzekoen fabrikazioa","abr": "FPF","fam":"18","centros": [12468,14422,14633]},
    {"codcicl": 10091,"nom": "Cuidados auxiliares de Enfermería", nomEuskera: "Erizaintzako zainketa osagarriak","abr": "CAE","fam":"19","centros": [10134,10349,12108,12229,12286,13255,13432,13556,14069,14088,14301,15623,15628,10248,12345,12432,12490,12544,12566,14615,14619,14620,14633,14665,14680,14786,14810,15326,15337,15385]},
    {"codcicl": 10092,"nom": "Emergencias Sanitarias", nomEuskera: "Osasun-larrialdiak","abr": "EMS","fam":"19","centros": [10134,12229,13613,14301,12345,14633,14810]},
    {"codcicl": 10093,"nom": "Farmacia y Parafarmacia", nomEuskera: "Farmazia eta parafarmazia","abr": "FPF","fam":"19","centros": [10134,12108,14339,14398,12566,14619,14620,14810]},
    {"codcicl": 10094,"nom": "Dietética", nomEuskera: "Dietetika","abr": "DIE","fam":"19","centros": [10134,12108,13432,14069,14339,12497,13656,14615,14633]},
    {"codcicl": 10095,"nom": "Ortoprótesis y Productos de Apoyo", nomEuskera: "Ortoprotesiak eta laguntza-produktuak","abr": "OPA","fam":"19","centros": [10248,12593]},
    {"codcicl": 10096,"nom": "Anatomía Patológica y Citodiagnóstico", nomEuskera: "Anatomia patologikoa eta zitodiagnostikoa","abr": "APC","fam":"19","centros": [12229,14620,14634]},
    {"codcicl": 10097,"nom": "Documentación y Administración Sanitarias", nomEuskera: "Osasun-dokumentazioa eta -administrazioa","abr": "DAS","fam":"19","centros": [14301,12490,12566,14619,14810]},
    {"codcicl": 10098,"nom": "Higiene Bucodental", nomEuskera: "Aho-hortzetako higienea","abr": "HIB","fam":"19","centros": [10134,12229,14069,14619]},
    {"codcicl": 10099,"nom": "Imagen para el Diagnóstico y Medicina Nuclear", nomEuskera: "Diagnostikorako irudia eta medikuntza nuklearra","abr": "IDM","fam":"19","centros": [15630,12566,14810]},
    {"codcicl": 10100,"nom": "Laboratorio Clínico y Biomédico", nomEuskera: "Laborategi kliniko eta biomedikoa","abr": "LCB","fam":"19","centros": [12108,12229,15630,10248,14633,14634,14718,14810]},
    {"codcicl": 10101,"nom": "Radioterapia y Dosimetría", nomEuskera: "Erradioterapia eta dosimetria","abr": "RDO","fam":"19","centros": [15630,12566,14810]},
    {"codcicl": 10102,"nom": "Educación y Control Ambiental", nomEuskera: "Ingurumen-hezkuntza eta -kontrola","abr": "ECA","fam":"20","centros": [12229,10248,14837]},
    {"codcicl": 10103,"nom": "Química y Salud Ambiental", nomEuskera: "Kimika eta ingurumen-osasuna","abr": "QSA","fam":"20","centros": [15630,14779]},
    {"codcicl": 10104,"nom": "Atención a Personas en Situación de Dependencia", nomEuskera: "Mendekotasun-egoeran dauden pertsonentzako arreta","abr": "APD","fam":"21","centros": [10134,10319,12108,12229,12740,13255,13432,13556,13613,14200,14320,14950,10248,12380,12497,12566,12581,13380,14633,14665,14723,14775,14779,14810,14824]},
    {"codcicl": 10105,"nom": "Educación infantil", nomEuskera: "Haur-hezkuntza","abr": "EDI","fam":"21","centros": [10134,12108,12229,12282,13432,14069,14200,14301,14320,15623,10228,10229,14620,14665,14810,14824,15220]},
    {"codcicl": 10106,"nom": "Integración social", nomEuskera: "Gizarteratzea","abr": "INS","fam":"21","centros": [10134,10319,12108,12229,12740,13432,13556,13613,15623,15630,15763,10229,10248,12380,12490,12497,12566,14633,14665,14696,14704,14723,14810,15220]},
    {"codcicl": 10107,"nom": "Animación Sociocultural y Turística", nomEuskera: "Animazio soziokulturala eta turistikoa","abr": "AST","fam":"21","centros": [13534,14441]},
    {"codcicl": 10108,"nom": "Promoción de Igualdad de Género", nomEuskera: "Genero-berdintasuna sustatzea","abr": "PIG","fam":"21","centros": [14069,10248]},
    {"codcicl": 10109,"nom": "Formación para la movilidad segura y sostenible", nomEuskera: "Mugikortasun seguru eta jasangarrirako prestakuntza","abr": "MSS","fam":"21","centros": [10137,12468,15112]},
    {"codcicl": 10110,"nom": "Confección y Moda", nomEuskera: "Jantzigintza eta moda","abr": "COM","fam":"22","centros": [13500]},
    {"codcicl": 10111,"nom": "Patronaje y moda", nomEuskera: "Patroigintza eta moda","abr": "PAM","fam":"22","centros": [14069,12479]},
    {"codcicl": 10112,"nom": "Vestuario a medida y de espectáculos", nomEuskera: "Neurriko eta ikuskizunetarako jantzigintza","abr": "VME","fam":"22","centros": [12479]},
    {"codcicl": 10113,"nom": "Carrocería", nomEuskera: "Karrozeria","abr": "CAR","fam":"23","centros": [10138,12468,13255,13432,14088,14301,14680,14824,15386]},
    {"codcicl": 10114,"nom": "Electromecánica de vehículos automóviles", nomEuskera: "Automobilen elektromekanika","abr": "EVA","fam":"23","centros": [10138,12468,13255,13432,14088,14200,14205,14301,14422,14950,10248,12529,14680,14779,14824]},
    {"codcicl": 10115,"nom": "Electromecánica de Maquinaria", nomEuskera: "Makineriaren elektromekanika","abr": "EMA","fam":"23","centros": [13432,14088]},
    {"codcicl": 10116,"nom": "Automoción", nomEuskera: "Automozioa","abr": "AUT","fam":"23","centros": [10138,12468,13255,13432,14088,14200,14422,14950,10248,14779,14824,15386]},
    {"codcicl": 10117,"nom": "Ganadería y Asistencia en Sanidad Animal", nomEuskera: "Abeltzaintza eta abere-osasuneko laguntza","abr": "GSA","fam":"3","centros": [12040]},
    {"codcicl": 10118,"nom": "Post Impresión y Acabados Gráficos", nomEuskera: "Postinprimaketa eta akabera grafikoak","abr": "PIA","fam":"4","centros": [14205]},
    {"codcicl": 10119,"nom": "Doble Grado en Instalaciones Eléctricas y Automáticas y de Telecomunicaciones", nomEuskera: "Gradu bikoitza: Instalazio elektriko eta automatikoak / Telekomunikazio-instalazioak","abr": "DET","fam":"7","centros": [14950]},
    {"codcicl": 10120,"nom": "Termalismo y Bienestar", nomEuskera: "Termalismoa eta ongizatea","abr": "TYB","fam":"11","centros": [12291]},
    {"codcicl": 10121,"nom": "Aceite de Oliva y Vinos", nomEuskera: "Oliba-olioa eta ardoak","abr": "AOV","fam":"13","centros": [10349]},
    {"codcicl": 10122,"nom": "Audiología Protésica", nomEuskera: "Protesi-audiologia","abr": "AUP","fam":"19","centros": [12566]},
    {"codcicl": 10123,"nom": "Prótesis Dentales", nomEuskera: "Hortz-protesiak","abr": "PRD","fam":"19","centros": [10134]},
    {"codcicl": 10124,"nom": "Emergencias y Protección Civil", nomEuskera: "Larrialdiak eta babes zibila","abr": "EPC","fam":"20","centros": [10745]},
    {"codcicl": 10125,"nom": "Sanidad Ambiental Aplicada", nomEuskera: "Ingurumen-osasun aplikatua","abr": "SAA","fam":"20","centros": [12468]},
    {"codcicl": 10126,"nom": "Coordinación de Emergencias y Protección Civil", nomEuskera: "Larrialdien eta babes zibilaren koordinazioa","abr": "CEP","fam":"20","centros": [10745]},
    {"codcicl": 10127,"nom": "Mediación Comunicativa", nomEuskera: "Komunikazio-bitartekaritza","abr": "MDC","fam":"21","centros": [10134,14069]},
    {"codcicl": 10128,"nom": "Diseño Técnico en Textil y Piel", nomEuskera: "Ehungintzako eta larrugintzako diseinu teknikoa","abr": "DTP","fam":"22","centros": [12479]},
    {"codcicl": 10129,"nom": "Conducción de Vehículos de Transporte por Carretera", nomEuskera: "Errepideko garraio-ibilgailuak gidatzea","abr": "CVT","fam":"23","centros": [12108]},
    {"codcicl": 10130,"nom": "Mantenimiento Aeromecánico de Aviones con Motor de Turbina", nomEuskera: "Turbina-motordun hegazkinen mantentze-lan aeromekanikoak","abr": "MAA","fam":"23","centros": [10248]},
    {"codcicl": 10131,"nom": "Doble Grado en Dirección de Cocina y en Dirección de Servicios de Restauración", nomEuskera: "Gradu bikoitza: Sukaldaritza-zuzendaritza / Jatetxe-arloko zerbitzuen zuzendaritza","abr": "DCR","fam":"10","centros": [15176]}
]

function transformarCiclo(cicloJSON: any): Asignacion {
  const familiaCodNum = cicloJSON.fam ? cicloJSON.fam.toString() : '14'
  const familiaNombre = familiasProfesionalesMap[familiaCodNum] || 'Informática y Comunicaciones'
  const familiaCodigo = mapaFamiliaNombreACodigo[familiaNombre] || 'IFC'
  const grado = determinarGrado(cicloJSON.codcicl, cicloJSON.nom)
  
  return {
    codcicl: cicloJSON.codcicl,
    nom: cicloJSON.nom,
    nomEuskera: cicloJSON.nomEuskera,     // ← FALTABA: por esto el combo iba vacío en EU
    slugEuskera: cicloJSON.slugEuskera,   // ← para que getDCBUrl en EU use el slug correcto
    abr: cicloJSON.abr || '',
    familiaCodigo: familiaCodigo,
    familia: familiaNombre,
    grado: grado,
    modalidad: 'Presencial',
    turno: 'Diurno',
    idiomas: ['ES', 'EU'],
    centros: cicloJSON.centros || [],
    duracion: 2000
  }
}

export const ciclos: Asignacion[] = ciclosJSONData.map(transformarCiclo)

export const filtrarCiclos = {
  porGrado: (grado: 'Básico' | 'Medio' | 'Superior') => ciclos.filter(ciclo => ciclo.grado === grado),
  porFamilia: (familia: string) => ciclos.filter(ciclo => ciclo.familia === familia),
  porFamiliaCodigo: (codigo: string) => ciclos.filter(ciclo => ciclo.familiaCodigo === codigo),
  porModalidad: (modalidad: 'Presencial' | 'Dual' | 'Distancia') => ciclos.filter(ciclo => ciclo.modalidad === modalidad),
  porTurno: (turno: 'Diurno' | 'Vespertino' | 'Nocturno' | 'Mixto') => ciclos.filter(ciclo => ciclo.turno === turno),
  porIdioma: (idioma: 'ES' | 'EU' | 'EN') => ciclos.filter(ciclo => ciclo.idiomas.includes(idioma)),
  porCentro: (codigoCentro: number) => ciclos.filter(ciclo => ciclo.centros.includes(codigoCentro)),
  disponiblesEnIngles: () => ciclos.filter(ciclo => ciclo.idiomas.includes('EN')),
  modalidadDual: () => ciclos.filter(ciclo => ciclo.modalidad === 'Dual'),
  aDistancia: () => ciclos.filter(ciclo => ciclo.modalidad === 'Distancia'),
  buscarPorTexto: (texto: string) => ciclos.filter(ciclo =>
    ciclo.nom.toLowerCase().includes(texto.toLowerCase()) ||
    (ciclo.nomEuskera && ciclo.nomEuskera.toLowerCase().includes(texto.toLowerCase())) ||
    ciclo.abr.toLowerCase().includes(texto.toLowerCase())
  )
}

export const familiasProfesionales = [...new Set(ciclos.map(c => c.familiaCodigo))].sort()

export const estadisticas = {
  totalCiclos: ciclos.length,
  porGrado: {
    basico: ciclos.filter(c => c.grado === 'Básico').length,
    medio: ciclos.filter(c => c.grado === 'Medio').length,
    superior: ciclos.filter(c => c.grado === 'Superior').length
  },
  porModalidad: {
    presencial: ciclos.filter(c => c.modalidad === 'Presencial').length,
    dual: ciclos.filter(c => c.modalidad === 'Dual').length,
    distancia: ciclos.filter(c => c.modalidad === 'Distancia').length
  },
  totalFamilias: familiasProfesionales.length,
  ciclosEnIngles: ciclos.filter(c => c.idiomas.includes('EN')).length
}

export default ciclos