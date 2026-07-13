export type Language = "en" | "es" | "fr" | "de" | "pt" | "hi";

export interface TranslationSchema {
  home: string;
  removeBg: string;
  addText: string;
  convert: string;
  resize: string;
  compress: string;
  allTools: string;
  privacyBadge: string;
  dropzoneTitle: string;
  dropzoneDesc: string;
  dropzoneSelect: string;
  resetBtn: string;
  downloadBtn: string;
  settingsTitle: string;
  previewTitle: string;
  heroTitle: string;
  heroSub: string;
  whyTitle: string;
  why1Title: string;
  why1Desc: string;
  why2Title: string;
  why2Desc: string;
  why3Title: string;
  why3Desc: string;
  cardRemoveBgTitle: string;
  cardRemoveBgDesc: string;
  cardAddTextTitle: string;
  cardAddTextDesc: string;
  cardConvertTitle: string;
  cardConvertDesc: string;
  cardResizeTitle: string;
  cardResizeDesc: string;
  cardCompressTitle: string;
  cardCompressDesc: string;
  compressSettings: string;
  outputFormat: string;
  compressQuality: string;
  original: string;
  compressed: string;
  savingsRatio: string;
  saved: string;
  noSavings: string;
  downloadCompressed: string;
  uploadAnother: string;
  losslessPngNotice: string;
  formatSettings: string;
  targetFormat: string;
  convertDownload: string;
  removeBgBtn: string;
  processing: string;
  loadingModel: string;
  firstRunNotice: string;
  downloadBgRemoved: string;
  resizeSettings: string;
  aspectRatio: string;
  custom: string;
  width: string;
  height: string;
  lockAspect: string;
  cropBtn: string;
  addTextBtn: string;
  fontFamily: string;
  fontSize: string;
  textColor: string;
  doubleClickEdit: string;
  exportDownload: string;
  footerNotice: string;
  
  // Compress Info Section
  compressInfoTitle: string;
  compressInfoSub: string;
  compressInfo1Title: string;
  compressInfo1Desc: string;
  compressInfo2Title: string;
  compressInfo2Desc: string;
  compressInfo3Title: string;
  compressInfo3Desc: string;
  compressInfo4Title: string;
  compressInfo4Desc: string;

  // Convert Info Section
  convertInfoTitle: string;
  convertInfoSub: string;
  convertInfo1Title: string;
  convertInfo1Desc: string;
  convertInfo2Title: string;
  convertInfo2Desc: string;
  convertInfo3Title: string;
  convertInfo3Desc: string;
  convertInfo4Title: string;
  convertInfo4Desc: string;
}

export const translations: Record<Language, TranslationSchema> = {
  en: {
    home: "Home",
    removeBg: "Remove BG",
    addText: "Add Text",
    convert: "Convert",
    resize: "Resize & Crop",
    compress: "Compress",
    allTools: "All Tools",
    privacyBadge: "Local privacy guaranteed",
    dropzoneTitle: "Drag & drop your image here",
    dropzoneDesc: "Supports PNG, JPEG, and WEBP up to 15MB",
    dropzoneSelect: "Select Image File",
    resetBtn: "Reset Image",
    downloadBtn: "Download File",
    settingsTitle: "Settings",
    previewTitle: "Image Preview",
    heroTitle: "Image editing, simplified.",
    heroSub: "Free, browser-native tools to remove backgrounds, write text overlays, crop, resize, and convert images. No signups, no file uploads, 100% private.",
    whyTitle: "Why run image tools locally?",
    why1Title: "🔒 Zero Uploads, Total Privacy",
    why1Desc: "Every time you upload a photo to standard online editors, your private images are sent to third-party cloud servers. MediaDit runs completely inside your browser memory. Your images never leave your computer.",
    why2Title: "⚡ Tiny, High-Speed AI Models",
    why2Desc: "Our background remover operates entirely on your device using a compressed, highly optimized 50MB neural network. Once cached on first run, it erases backgrounds instantly—even when you are completely offline.",
    why3Title: "✨ No Signups, No Paywalls",
    why3Desc: "We believe simple tasks shouldn't require creating accounts, giving away your email, or subscribing to paywalls. There are no limits, no watermarks, and no signups required. Ever.",
    cardRemoveBgTitle: "Remove Background",
    cardRemoveBgDesc: "Remove image backgrounds instantly in your browser using local AI. No server uploads, 100% private.",
    cardAddTextTitle: "Add Text to Image",
    cardAddTextDesc: "Place, style, and drag custom text overlays onto your images. Edit font sizes, families, and colors.",
    cardConvertTitle: "Convert Format",
    cardConvertDesc: "Convert image files between PNG, JPEG, WEBP, and BMP instantly. Control output quality and scale.",
    cardResizeTitle: "Resize & Crop",
    cardResizeDesc: "Crop to exact aspect ratios and resize dimensions without losing image clarity. Powered by Canvas.",
    cardCompressTitle: "Compress Image",
    cardCompressDesc: "Reduce image file sizes instantly without losing visible quality. 100% free, private, and offline.",
    compressSettings: "Compression Settings",
    outputFormat: "Output Format",
    compressQuality: "Compression Quality",
    original: "Original",
    compressed: "Compressed",
    savingsRatio: "File Savings Ratio",
    saved: "Saved",
    noSavings: "No Savings",
    downloadCompressed: "Download Compressed Image",
    uploadAnother: "Upload Another Image",
    losslessPngNotice: "PNG is a lossless format and does not compress with quality sliders. Convert to WEBP or JPEG to reduce file size.",
    formatSettings: "Format Settings",
    targetFormat: "Target Format",
    convertDownload: "Convert & Download",
    removeBgBtn: "Remove Background",
    processing: "Processing...",
    loadingModel: "Downloading AI Model (~50MB) to your browser...",
    firstRunNotice: "This happens only on the first run. Subsequent background removals will load instantly.",
    downloadBgRemoved: "Download Image",
    resizeSettings: "Resize & Crop Settings",
    aspectRatio: "AspectRatio",
    custom: "Custom",
    width: "Width (px)",
    height: "Height (px)",
    lockAspect: "Lock Aspect Ratio",
    cropBtn: "Crop & Download Image",
    addTextBtn: "Add Draggable Text",
    fontFamily: "Font Family",
    fontSize: "Font Size",
    textColor: "Text Color",
    doubleClickEdit: "Double-click text to edit inline",
    exportDownload: "Export & Download Image",
    footerNotice: "All operations run locally inside your browser memory. Your images never leave your device.",
    
    // Compress Info Section
    compressInfoTitle: "How does browser-native image compression work?",
    compressInfoSub: "Unlike conventional size reducers that send your photos to external cloud systems, MediaDit processes files directly inside your browser memory.",
    compressInfo1Title: "🔒 100% Client-Side Privacy",
    compressInfo1Desc: "When you drag and drop a file, it is loaded into a local HTML5 canvas. The quality adjustment slider scales the canvas rendering matrix locally, exporting the result to a compressed Blob on your device. Your files never leave your computer.",
    compressInfo2Title: "⚡ WebP & JPEG Format Optimization",
    compressInfo2Desc: "WebP and JPEG are lossy formats, meaning they achieve high compression ratios by discarding visual noise that the human eye cannot detect. Dragging the quality slider to 70%–80% can shrink file sizes by up to 80% with zero visible loss in image sharpness.",
    compressInfo3Title: "💡 Lossless PNG Notice",
    compressInfo3Desc: "PNG files use lossless compression, which preserves pixel definitions perfectly but results in larger files. Standard quality sliders cannot compress PNGs. If you upload a PNG, convert it to WebP or JPEG inside the format panel to drastically reduce its size.",
    compressInfo4Title: "🚀 Faster Page Speeds",
    compressInfo4Desc: "Large photos bloat page load times and trigger mobile bandwidth lag. Compressing images under 500 KB before putting them on websites or emails improves your site's SEO scores, reduces user bounce rates, and lowers loading times.",

    // Convert Info Section
    convertInfoTitle: "How does browser-native image conversion work?",
    convertInfoSub: "MediaDit converts image formats entirely client-side, giving you high-speed exports with absolute privacy.",
    convertInfo1Title: "🔒 Secure & Serverless",
    convertInfo1Desc: "When you convert images from PNG to WebP or JPEG to PNG, your photos are processed inside browser memory. Because we don't upload files to remote servers, your private documents never leave your computer.",
    convertInfo2Title: "🌈 Format Comparison (WebP, PNG, JPEG)",
    convertInfo2Desc: "Choose the target format that fits your needs. Use PNG for lossless transparent graphics, JPEG for standard photo sharing with custom compression sliders, and WebP for highly compressed web assets.",
    convertInfo3Title: "🎨 Lossless Transparency Layers",
    convertInfo3Desc: "When converting images that have transparent backgrounds (like graphics or background-removed photos) into target formats, make sure to use PNG or WebP to preserve the transparent layers. Converting transparent images to JPEG will fill the transparency with a solid white background.",
    convertInfo4Title: "⚡ High-Speed Canvas Exports",
    convertInfo4Desc: "Our conversion process uses native HTML5 canvas rasterization. By drawing pixels and converting the canvas context directly inside your GPU, we can instantly export images in under a second."
  },
  es: {
    home: "Inicio",
    removeBg: "Quitar Fondo",
    addText: "Añadir Texto",
    convert: "Convertir",
    resize: "Redimensionar",
    compress: "Comprimir",
    allTools: "Herramientas",
    privacyBadge: "Privacidad local garantizada",
    dropzoneTitle: "Arrastra y suelta tu imagen aquí",
    dropzoneDesc: "Soporta PNG, JPEG y WEBP hasta 15MB",
    dropzoneSelect: "Seleccionar Imagen",
    resetBtn: "Reiniciar imagen",
    downloadBtn: "Descargar archivo",
    settingsTitle: "Ajustes",
    previewTitle: "Vista previa",
    heroTitle: "Edición de imágenes, simplificada.",
    heroSub: "Herramientas gratuitas en el navegador para eliminar fondos con IA, añadir texto, recortar, redimensionar y convertir imágenes. Sin registros, sin descargas al servidor, 100% privado.",
    whyTitle: "¿Por qué usar herramientas locales?",
    why1Title: "🔒 Sin cargas, privacidad absoluta",
    why1Desc: "Cada vez que subes fotos a editores web estándar, tus imágenes privadas se envían a servidores de terceros. MediaDit funciona en tu memoria. Tus imágenes no salen de tu ordenador.",
    why2Title: "⚡ Modelos de IA rápidos y pequeños",
    why2Desc: "Nuestra herramienta para quitar fondos corre en tu dispositivo usando una red neuronal de solo 50MB. Tras la primera carga, quita fondos al instante, incluso sin internet.",
    why3Title: "✨ Sin registros ni pagos",
    why3Desc: "Creemos que las tareas sencillas no deberían pedirte crear cuentas, dejar tu correo o suscribirte. No hay límites, marcas de agua ni registros. Nunca.",
    cardRemoveBgTitle: "Quitar Fondo",
    cardRemoveBgDesc: "Elimina fondos de imágenes al instante en tu navegador con IA local. Sin subir archivos, 100% privado.",
    cardAddTextTitle: "Añadir Texto a Imagen",
    cardAddTextDesc: "Coloca, estiliza y arrastra texto sobre tus imágenes. Edita tamaños de fuente, familias y colores.",
    cardConvertTitle: "Convertir Formato",
    cardConvertDesc: "Convierte imágenes entre PNG, JPEG, WEBP y BMP al instante. Controla la calidad de salida y escala.",
    cardResizeTitle: "Redimensionar y Recortar",
    cardResizeDesc: "Recorta a proporciones exactas y redimensiona resoluciones sin perder nitidez. Impulsado por Canvas.",
    cardCompressTitle: "Comprimir Imagen",
    cardCompressDesc: "Reduce el peso de imágenes al instante sin perder calidad. 100% gratuito, privado y offline.",
    compressSettings: "Ajustes de compresión",
    outputFormat: "Formato de salida",
    compressQuality: "Calidad de compresión",
    original: "Original",
    compressed: "Comprimido",
    savingsRatio: "Ratio de ahorro",
    saved: "Ahorrado",
    noSavings: "Sin ahorro",
    downloadCompressed: "Descargar imagen comprimida",
    uploadAnother: "Cargar otra imagen",
    losslessPngNotice: "PNG es un formato sin pérdidas y no se comprime con el deslizador de calidad. Convierte a WEBP o JPEG para reducir peso.",
    formatSettings: "Ajustes de formato",
    targetFormat: "Formato objetivo",
    convertDownload: "Convertir y Descargar",
    removeBgBtn: "Quitar Fondo",
    processing: "Procesando...",
    loadingModel: "Descargando modelo de IA (~50MB) a tu navegador...",
    firstRunNotice: "Esto solo ocurre la primera vez. Las siguientes ejecuciones serán instantáneas.",
    downloadBgRemoved: "Descargar Imagen",
    resizeSettings: "Ajustes de redimensión",
    aspectRatio: "Aspecto",
    custom: "Personalizado",
    width: "Ancho (px)",
    height: "Alto (px)",
    lockAspect: "Bloquear proporción",
    cropBtn: "Recortar y Descargar Imagen",
    addTextBtn: "Añadir texto arrastrable",
    fontFamily: "Familia de fuente",
    fontSize: "Tamaño de fuente",
    textColor: "Color de texto",
    doubleClickEdit: "Doble clic en el texto para editarlo",
    exportDownload: "Exportar y Descargar Imagen",
    footerNotice: "Todas las operaciones corren localmente en la memoria de tu navegador. Tus imágenes nunca salen de tu dispositivo.",
    
    // Compress Info Section
    compressInfoTitle: "¿Cómo funciona la compresión de imágenes local?",
    compressInfoSub: "A diferencia de los reductores de tamaño convencionales que envían tus fotos a servidores externos, MediaDit procesa los archivos directamente en tu navegador.",
    compressInfo1Title: "🔒 Privacidad 100% en el cliente",
    compressInfo1Desc: "Al arrastrar una imagen, se carga en un lienzo HTML5 local. El deslizador de calidad ajusta la escala del lienzo localmente, exportando el resultado comprimido. Tus archivos nunca salen de tu ordenador.",
    compressInfo2Title: "⚡ Optimización WebP y JPEG",
    compressInfo2Desc: "WebP y JPEG son formatos con pérdida, lo que significa que logran altas tasas de compresión descartando ruido visual imperceptible. Ajustar la calidad al 70%–80% reduce el tamaño hasta un 80% sin pérdida visible.",
    compressInfo3Title: "💡 Nota sobre PNG sin pérdida",
    compressInfo3Desc: "Los archivos PNG usan compresión sin pérdidas, lo que mantiene la calidad perfecta pero genera archivos más pesados. Si cargas un PNG, conviértelo a WebP o JPEG para reducir drásticamente el peso.",
    compressInfo4Title: "🚀 Velocidad de carga web",
    compressInfo4Desc: "Las fotos pesadas ralentizan las páginas web. Comprimir imágenes por debajo de 500 KB antes de publicarlas mejora el SEO, reduce el rebote de usuarios y optimiza los tiempos de carga.",

    // Convert Info Section
    convertInfoTitle: "¿Cómo funciona la conversión local?",
    convertInfoSub: "MediaDit convierte formatos de imagen directamente en tu navegador, ofreciendo descargas veloces y privacidad absoluta.",
    convertInfo1Title: "🔒 Seguro y sin servidores",
    convertInfo1Desc: "Al convertir imágenes de PNG a WebP o JPEG a PNG, tus fotos se procesan en la memoria local. Al no subir archivos a la nube, tus documentos privados están siempre a salvo.",
    convertInfo2Title: "🌈 Comparativa de formatos",
    convertInfo2Desc: "Elige el formato adecuado: PNG para gráficos transparentes sin pérdida, JPEG para fotos estándar con compresión y WebP para imágenes web ultraligeras.",
    convertInfo3Title: "🎨 Transparencia sin pérdida",
    convertInfo3Desc: "Al convertir imágenes con fondos transparentes, usa PNG o WebP. Si las conviertes a JPEG, la transparencia se rellenará automáticamente con un fondo blanco.",
    convertInfo4Title: "⚡ Exportación ultrarrápida",
    convertInfo4Desc: "Nuestro conversor usa la aceleración gráfica nativa del navegador. Al procesar los píxeles directamente en tu tarjeta gráfica, exportamos tus archivos en menos de un segundo."
  },
  fr: {
    home: "Accueil",
    removeBg: "Supprimer Fond",
    addText: "Ajouter Texte",
    convert: "Convertir",
    resize: "Redimensionner",
    compress: "Compresser",
    allTools: "Tous les outils",
    privacyBadge: "Confidentialité locale garantie",
    dropzoneTitle: "Glissez-déposez votre image ici",
    dropzoneDesc: "Prend en charge PNG, JPEG et WEBP jusqu'à 15 Mo",
    dropzoneSelect: "Sélectionner une Image",
    resetBtn: "Réinitialiser",
    downloadBtn: "Télécharger",
    settingsTitle: "Réglages",
    previewTitle: "Aperçu de l'image",
    heroTitle: "Édition d'images, simplifiée.",
    heroSub: "Outils gratuits dans le navigateur pour supprimer les arrière-plans par IA, ajouter du texte, recadrer, redimensionner et convertir des images. Sans inscription, sans téléchargement sur serveur, 100% privé.",
    whyTitle: "Pourquoi exécuter ces outils localement?",
    why1Title: "🔒 Zéro téléchargement, vie privée totale",
    why1Desc: "Chaque fois que vous importez une photo sur des éditeurs en ligne, vos données vont sur des serveurs tiers. MediaDit s'exécute dans votre navigateur. Vos fichiers ne quittent jamais votre machine.",
    why2Title: "⚡ Modèles d'IA légers et rapides",
    why2Desc: "Notre outil de détourage s'exécute sur votre appareil avec un réseau compressé de 50 Mo. Une fois mis en cache, il fonctionne instantanément et hors ligne.",
    why3Title: "✨ Sans inscription ni paywall",
    why3Desc: "Les tâches simples ne devraient pas nécessiter de compte, d'e-mail ou d'abonnement. Il n'y a aucune limite, aucun filigrane et aucune inscription requise. Jamais.",
    cardRemoveBgTitle: "Supprimer l'arrière-plan",
    cardRemoveBgDesc: "Détourez les images instantanément dans votre navigateur avec l'IA locale. Sans envoi de fichiers, 100% privé.",
    cardAddTextTitle: "Ajouter du texte",
    cardAddTextDesc: "Placez, personnalisez et déplacez du texte sur vos images. Modifiez la taille, la police et la couleur.",
    cardConvertTitle: "Convertir le format",
    cardConvertDesc: "Convertissez des images en PNG, JPEG, WEBP et BMP instantanément. Ajustez la qualité et l'échelle hors ligne.",
    cardResizeTitle: "Redimensionner & Recadrer",
    cardResizeDesc: "Recadrez à des ratios précis et redimensionnez les résolutions sans perte de netteté. Propulsé par Canvas.",
    cardCompressTitle: "Compresser l'image",
    cardCompressDesc: "Réduisez le poids de vos images instantanément sans perte visuelle. 100% gratuit, privé et hors ligne.",
    compressSettings: "Réglages de compression",
    outputFormat: "Format de sortie",
    compressQuality: "Qualité de compression",
    original: "Original",
    compressed: "Compressé",
    savingsRatio: "Taux de réduction",
    saved: "Économisé",
    noSavings: "Aucune réduction",
    downloadCompressed: "Télécharger l'image compressée",
    uploadAnother: "Importer une autre image",
    losslessPngNotice: "Le PNG est un format sans perte qui ne se compresse pas avec le curseur de qualité. Convertissez en WEBP ou JPEG pour réduire le poids.",
    formatSettings: "Réglages de format",
    targetFormat: "Format cible",
    convertDownload: "Convertir & Télécharger",
    removeBgBtn: "Supprimer l'arrière-plan",
    processing: "Traitement...",
    loadingModel: "Téléchargement du modèle IA (~50 Mo) dans le navigateur...",
    firstRunNotice: "Cela ne se produit qu'au premier lancement. Les détourages suivants seront instantanés.",
    downloadBgRemoved: "Télécharger l'image",
    resizeSettings: "Réglages de dimension",
    aspectRatio: "Ratio d'aspect",
    custom: "Personnalisé",
    width: "Largeur (px)",
    height: "Hauteur (px)",
    lockAspect: "Verrouiller le ratio",
    cropBtn: "Recadrer & Télécharger l'image",
    addTextBtn: "Ajouter du texte mobile",
    fontFamily: "Police de caractères",
    fontSize: "Taille du texte",
    textColor: "Couleur du texte",
    doubleClickEdit: "Double-cliquez sur le texte pour le modifier",
    exportDownload: "Exporter & Télécharger l'image",
    footerNotice: "Toutes les opérations s'exécutent localement dans votre navigateur. Vos images ne quittent jamais votre appareil.",
    
    // Compress Info Section
    compressInfoTitle: "Comment fonctionne la compression d'images locale ?",
    compressInfoSub: "Contrairement aux réducteurs de taille classiques qui envoient vos photos sur des serveurs distants, MediaDit traite les fichiers directement dans votre navigateur.",
    compressInfo1Title: "🔒 Confidentialité 100% client",
    compressInfo1Desc: "Lorsque vous glissez-déposez un fichier, il est chargé dans un canevas HTML5 local. Le curseur ajuste l'échelle de rendu localement et exporte le résultat compressé. Vos fichiers ne quittent jamais votre machine.",
    compressInfo2Title: "⚡ Optimisation WebP & JPEG",
    compressInfo2Desc: "Le WebP et le JPEG sont des formats avec perte, ce qui signifie qu'ils réduisent le poids en supprimant des détails invisibles à l'œil nu. Ajuster la qualité à 70%–80% réduit la taille jusqu'à 80% sans perte de netteté.",
    compressInfo3Title: "💡 Note sur le PNG sans perte",
    compressInfo3Desc: "Les fichiers PNG utilisent une compression sans perte, préservant chaque pixel mais augmentant le poids. Si vous importez un PNG, convertissez-le en WebP ou JPEG pour réduire drastiquement son poids.",
    compressInfo4Title: "🚀 Pages Web plus rapides",
    compressInfo4Desc: "Les images lourdes ralentissent le chargement des pages. Compresser vos images sous la barre des 500 Ko avant de les publier améliore votre SEO et réduit le taux de rebond.",

    // Convert Info Section
    convertInfoTitle: "Comment fonctionne la conversion d'images locale ?",
    convertInfoSub: "MediaDit convertit vos formats d'images directement dans le navigateur, assurant rapidité et confidentialité.",
    convertInfo1Title: "🔒 Sécurisé et sans serveur",
    convertInfo1Desc: "Lors de la conversion de PNG en WebP ou de JPEG en PNG, les calculs se font dans votre mémoire locale. Vos photos privées ne quittent jamais votre ordinateur.",
    convertInfo2Title: "🌈 Comparatif des formats",
    convertInfo2Desc: "Choisissez le format adapté : PNG pour les graphismes avec transparence, JPEG pour les photos avec curseur de compression, et WebP pour des fichiers web ultra-légers.",
    convertInfo3Title: "🎨 Gestion de la transparence",
    convertInfo3Desc: "Pour conserver la transparence d'un arrière-plan détouré, choisissez PNG ou WebP. Convertir ces images en JPEG remplacera le fond transparent par une couleur blanche unie.",
    convertInfo4Title: "⚡ Rendu Canvas ultra-rapide",
    convertInfo4Desc: "Notre processus s'appuie sur la rastérisation matérielle du navigateur. En convertissant les pixels directement via votre processeur graphique, l'exportation prend moins d'une seconde."
  },
  de: {
    home: "Startseite",
    removeBg: "Hintergrund entfernen",
    addText: "Text hinzufügen",
    convert: "Konvertieren",
    resize: "Größe ändern",
    compress: "Komprimieren",
    allTools: "Alle Werkzeuge",
    privacyBadge: "Lokale Privatsphäre garantiert",
    dropzoneTitle: "Zieh dein Bild hierher oder klicke",
    dropzoneDesc: "Unterstützt PNG, JPEG und WEBP bis zu 15MB",
    dropzoneSelect: "Bilddatei auswählen",
    resetBtn: "Zurücksetzen",
    downloadBtn: "Herunterladen",
    settingsTitle: "Einstellungen",
    previewTitle: "Bildvorschau",
    heroTitle: "Bildbearbeitung, vereinfacht.",
    heroSub: "Kostenlose Browser-Tools zum Entfernen von Hintergründen mit KI, Hinzufügen von Text, Zuschneiden, Größenänderung und Konvertieren von Bildern. Keine Anmeldung, keine Server-Uploads, 100% privat.",
    whyTitle: "Warum Bildbearbeitung lokal ausführen?",
    why1Title: "🔒 Keine Uploads, absolute Privatsphäre",
    why1Desc: "Beim Hochladen auf Standard-Editoren werden Ihre privaten Bilder an Server Dritter gesendet. MediaDit läuft komplett in Ihrem Browserspeicher. Ihre Bilder verlassen nie Ihren Computer.",
    why2Title: "⚡ Winzige, superschnelle KI-Modelle",
    why2Desc: "Unser Hintergrundentferner läuft lokal mit einem optimierten 50MB neuronalen Netz. Nach dem ersten Start funktioniert das Freistellen in Millisekunden und komplett offline.",
    why3Title: "✨ Keine Anmeldungen, keine Paywalls",
    why3Desc: "Wir glauben, einfache Aufgaben sollten keine Registrierung, E-Mail-Adresse oder Abos verlangen. Es gibt keine Limits, keine Wasserzeichen und keine Anmeldungen. Niemals.",
    cardRemoveBgTitle: "Hintergrund entfernen",
    cardRemoveBgDesc: "Entferne Hintergründe sofort im Browser mit lokaler KI. Keine Server-Uploads, 100% privat.",
    cardAddTextTitle: "Text zu Bild hinzufügen",
    cardAddTextDesc: "Platziere und verschiebe benutzerdefinierten Text auf deinen Bildern. Bearbeite Schriftgrößen, Schriftarten und Farben.",
    cardConvertTitle: "Format konvertieren",
    cardConvertDesc: "Konvertiere Bilder sofort in PNG, JPEG, WEBP und BMP. Steuere die Ausgabequalität und skalierte Maße.",
    cardResizeTitle: "Größe ändern & Zuschneiden",
    cardResizeDesc: "Schneide auf exakte Seitenverhältnisse zu und ändere Auflösungen ohne Schärfeverlust. Unterstützt durch Canvas.",
    cardCompressTitle: "Bild komprimieren",
    cardCompressDesc: "Reduziere die Dateigröße von Bildern sofort ohne Qualitätsverlust. 100% kostenlos, privat und offline.",
    compressSettings: "Komprimierungseinstellungen",
    outputFormat: "Ausgabeformat",
    compressQuality: "Komprimierungsqualität",
    original: "Original",
    compressed: "Komprimiert",
    savingsRatio: "Einsparungsrate",
    saved: "Eingespart",
    noSavings: "Keine Einsparung",
    downloadCompressed: "Komprimiertes Bild herunterladen",
    uploadAnother: "Anderes Bild hochladen",
    losslessPngNotice: "PNG ist ein verlustfreies Format und lässt sich nicht über den Qualitätsregler komprimieren. Konvertiere in WEBP oder JPEG für kleinere Dateigrößen.",
    formatSettings: "Formateinstellungen",
    targetFormat: "Zielformat",
    convertDownload: "Konvertieren & Herunterladen",
    removeBgBtn: "Hintergrund entfernen",
    processing: "Wird bearbeitet...",
    loadingModel: "KI-Modell (~50MB) wird in den Browser geladen...",
    firstRunNotice: "Dies geschieht nur beim ersten Mal. Zukünftige Hintergrundentfernungen laden sofort.",
    downloadBgRemoved: "Bild herunterladen",
    resizeSettings: "Größenänderung & Zuschneiden",
    aspectRatio: "Seitenverhältnis",
    custom: "Benutzerdefiniert",
    width: "Breite (px)",
    height: "Höhe (px)",
    lockAspect: "Seitenverhältnis sperren",
    cropBtn: "Bild zuschneiden & herunterladen",
    addTextBtn: "Verschiebbaren Text hinzufügen",
    fontFamily: "Schriftart",
    fontSize: "Schriftgröße",
    textColor: "Textfarbe",
    doubleClickEdit: "Doppelklick zum Bearbeiten des Textes",
    exportDownload: "Exportieren & Herunterladen",
    footerNotice: "Alle Vorgänge werden lokal im Speicher deines Browsers ausgeführt. Deine Bilder verlassen dein Gerät nie.",
    
    // Compress Info Section
    compressInfoTitle: "Wie funktioniert die lokale Bildkomprimierung?",
    compressInfoSub: "Im Gegensatz zu herkömmlichen Tools, die Ihre Fotos auf Server hochladen, verarbeitet MediaDit Ihre Dateien direkt im Speicher Ihres Browsers.",
    compressInfo1Title: "🔒 100% lokale Privatsphäre",
    compressInfo1Desc: "Ihr Bild wird in ein lokales HTML5-Canvas geladen. Der Qualitätsregler skaliert das Bild lokal und speichert es als komprimiertes Blob. Ihre Bilder verlassen nie Ihren Rechner.",
    compressInfo2Title: "⚡ WebP- & JPEG-Optimierung",
    compressInfo2Desc: "WebP und JPEG sind verlustbehaftete Formate, die hohe Kompressionsraten erzielen, indem sie für das menschliche Auge unsichtbare Details verwerfen. 70%–80% Qualität spart bis zu 80% Speicherplatz.",
    compressInfo3Title: "💡 Verlustfreies PNG beachten",
    compressInfo3Desc: "PNG-Dateien nutzen eine verlustfreie Komprimierung. Sie behalten die perfekte Qualität, sind aber schwerer. Konvertieren Sie PNGs in WebP oder JPEG, um die Dateigröße stark zu reduzieren.",
    compressInfo4Title: "🚀 Schnellere Ladezeiten",
    compressInfo4Desc: "Große Bilder verlangsamen Webseiten. Komprimieren Sie Bilder unter 500 KB vor dem Hochladen, um die SEO-Bewertung Ihrer Seite zu verbessern und Absprungraten zu minimieren.",

    // Convert Info Section
    convertInfoTitle: "Wie funktioniert die lokale Bildkonvertierung?",
    convertInfoSub: "MediaDit konvertiert Bildformate komplett im Browser. Das sorgt für maximale Geschwindigkeit bei voller Privatsphäre.",
    convertInfo1Title: "🔒 Sicher & serverlos",
    convertInfo1Desc: "Bei der Konvertierung von PNG zu WebP oder JPEG zu PNG werden die Dateien in Ihrem Browser verarbeitet. Da keine Server beteiligt sind, bleiben Ihre Daten absolut sicher.",
    convertInfo2Title: "🌈 Formatvergleich",
    convertInfo2Desc: "Wählen Sie das passende Format: PNG für verlustfreie Grafiken mit Transparenz, JPEG für Fotos mit Qualitätsregler und WebP für optimierte Web-Bilder.",
    convertInfo3Title: "🎨 Transparente Ebenen erhalten",
    convertInfo3Desc: "Nutzen Sie PNG oder WebP, um transparente Hintergründe zu erhalten. Wenn Sie ein transparentes Bild in JPEG konvertieren, wird der Hintergrund weiß gefüllt.",
    convertInfo4Title: "⚡ High-Speed-Export",
    convertInfo4Desc: "Unsere Konvertierung nutzt die native Canvas-Beschleunigung Ihres Grafikprozessors. Die Verarbeitung erfolgt direkt auf der GPU in weniger als einer Sekunde."
  },
  pt: {
    home: "Início",
    removeBg: "Remover Fundo",
    addText: "Adicionar Texto",
    convert: "Converter",
    resize: "Redimensionar",
    compress: "Comprimir",
    allTools: "Ferramentas",
    privacyBadge: "Privacidade local garantida",
    dropzoneTitle: "Arraste e solte sua imagem aqui",
    dropzoneDesc: "Suporta PNG, JPEG e WEBP até 15MB",
    dropzoneSelect: "Selecionar Imagem",
    resetBtn: "Reiniciar imagem",
    downloadBtn: "Descarregar arquivo",
    settingsTitle: "Configurações",
    previewTitle: "Pré-visualização",
    heroTitle: "Edição de imagens, simplificada.",
    heroSub: "Ferramentas gratuitas no navegador para remover fundos com IA, adicionar texto, cortar, redimensionar e converter imagens. Sem registo, sem uploads para o servidor, 100% privado.",
    whyTitle: "Por que usar ferramentas locais de imagem?",
    why1Title: "🔒 Sem Uploads, Privacidade Total",
    why1Desc: "Toda vez que você envia fotos a editores web comuns, suas imagens são enviadas a servidores de terceiros. O MediaDit roda localmente na memória. Seus arquivos nunca saem de seu computador.",
    why2Title: "⚡ Modelos de IA rápidos e compactos",
    why2Desc: "Nosso removedor de fundo funciona no seu dispositivo usando uma rede neural de 50MB. Após o primeiro acesso, o recorte é instantâneo e offline.",
    why3Title: "✨ Sem Registros, Sem Limites",
    why3Desc: "Acreditamos que tarefas básicas não exigem a criação de contas, fornecimento de e-mail ou planos de assinatura. Sem limites, sem marcas de água e sem login. Nunca.",
    cardRemoveBgTitle: "Remover Fundo",
    cardRemoveBgDesc: "Remova o fundo de imagens instantaneamente no navegador com IA local. Sem uploads, 100% privado.",
    cardAddTextTitle: "Adicionar Texto a Imagem",
    cardAddTextDesc: "Coloque, estilize e arraste caixas de texto sobre as suas imagens. Altere tamanhos, fontes e cores.",
    cardConvertTitle: "Converter Formato",
    cardConvertDesc: "Converta imagens entre PNG, JPEG, WEBP e BMP instantaneamente. Controle a qualidade do arquivo final.",
    cardResizeTitle: "Redimensionar e Cortar",
    cardResizeDesc: "Corte em proporções exatas e redimensione dimensões sem perder definição. Impulsionado por Canvas.",
    cardCompressTitle: "Comprimir Imagem",
    cardCompressDesc: "Reduza o peso de arquivos de imagem rapidamente sem perda de qualidade visual. 100% livre e offline.",
    compressSettings: "Configurações de compressão",
    outputFormat: "Formato de saída",
    compressQuality: "Qualidade de compressão",
    original: "Original",
    compressed: "Comprimido",
    savingsRatio: "Taxa de economia",
    saved: "Poupado",
    noSavings: "Sem economia",
    downloadCompressed: "Descarregar imagem comprimida",
    uploadAnother: "Carregar outra imagem",
    losslessPngNotice: "PNG é um formato sem perdas e não comprime com o controle de qualidade. Converta para WEBP ou JPEG para reduzir o peso.",
    formatSettings: "Configurações de formato",
    targetFormat: "Formato de destino",
    convertDownload: "Converter e Descarregar",
    removeBgBtn: "Remover Fundo",
    processing: "Processando...",
    loadingModel: "Descarregando modelo de IA (~50MB) no seu navegador...",
    firstRunNotice: "Isso só ocorre na primeira vez. Os próximos recortes de fundo serão executados de imediato.",
    downloadBgRemoved: "Descarregar Imagem",
    resizeSettings: "Ajustes de redimensionamento",
    aspectRatio: "Proporção",
    custom: "Personalizado",
    width: "Largura (px)",
    height: "Altura (px)",
    lockAspect: "Bloquear proporção",
    cropBtn: "Cortar e Descarregar Imagem",
    addTextBtn: "Adicionar texto móvel",
    fontFamily: "Família de fontes",
    fontSize: "Tamanho da letra",
    textColor: "Cor do texto",
    doubleClickEdit: "Duplo clique no texto para editar",
    exportDownload: "Exportar e Descarregar Imagem",
    footerNotice: "Todas as operações rodam localmente na memória do seu navegador. Suas imagens nunca saem do seu dispositivo.",
    
    // Compress Info Section
    compressInfoTitle: "Como funciona a compressão de imagem local?",
    compressInfoSub: "Ao contrário dos redutores de tamanho comuns que enviam suas fotos para servidores externos, o MediaDit processa seus arquivos no próprio navegador.",
    compressInfo1Title: "🔒 Privacidade 100% no Cliente",
    compressInfo1Desc: "Sua imagem é carregada em um canvas HTML5 local. O controle de qualidade ajusta as dimensões dos pixels diretamente na GPU, gerando um arquivo comprimido que nunca sai de sua máquina.",
    compressInfo2Title: "⚡ Otimização WebP e JPEG",
    compressInfo2Desc: "WebP e JPEG são formatos com perda, o que significa que reduzem o tamanho descartando ruídos visuais imperceptíveis. Definir a qualidade entre 70%–80% reduz o peso em até 80%.",
    compressInfo3Title: "💡 Nota sobre PNG sem perda",
    compressInfo3Desc: "Arquivos PNG usam compressão sem perdas, garantindo qualidade máxima mas gerando arquivos pesados. Se carregar um PNG, converta-o para WebP ou JPEG para reduzir o peso.",
    compressInfo4Title: "🚀 Sites mais velozes",
    compressInfo4Desc: "Fotos pesadas prejudicam a velocidade dos sites. Comprimir imagens abaixo de 500 KB antes de publicá-las melhora o SEO, diminui a rejeição e otimiza o carregamento.",

    // Convert Info Section
    convertInfoTitle: "Como funciona a conversão de imagem local?",
    convertInfoSub: "O MediaDit converte os formatos de suas imagens na memória local, garantindo alta velocidade e privacidade total.",
    convertInfo1Title: "🔒 Seguro e sem servidores",
    convertInfo1Desc: "Ao converter PNG para WebP ou JPEG para PNG, o processo roda no seu navegador. Suas fotos privadas nunca são enviadas para a nuvem.",
    convertInfo2Title: "🌈 Comparação de formatos",
    convertInfo2Desc: "Escolha o formato ideal: PNG para transparências sem perdas, JPEG para fotos comuns com controle de qualidade e WebP para imagens otimizadas para web.",
    convertInfo3Title: "🎨 Camadas de transparência",
    convertInfo3Desc: "Para manter fundos transparentes de recortes, escolha PNG ou WebP. Converter estas imagens para JPEG substituirá a transparência por um fundo branco sólido.",
    convertInfo4Title: "⚡ Exportação acelerada",
    convertInfo4Desc: "Nosso conversor usa a renderização do elemento canvas nativo. Ao mapear pixels na placa gráfica do seu dispositivo, a exportação ocorre em menos de um segundo."
  },
  hi: {
    home: "होम",
    removeBg: "बैकग्राउंड हटाएं",
    addText: "टेक्स्ट जोड़ें",
    convert: "फॉर्मेट बदलें",
    resize: "रीसाइज़ करें",
    compress: "कंप्रेस करें",
    allTools: "सारे टूल्स",
    privacyBadge: "स्थानीय गोपनीयता की गारंटी",
    dropzoneTitle: "अपनी इमेज यहाँ खींचकर लाएँ या क्लिक करें",
    dropzoneDesc: "PNG, JPEG और WEBP फाइलों को 15MB तक सपोर्ट करता है",
    dropzoneSelect: "इमेज फ़ाइल चुनें",
    resetBtn: "इमेज रीसेट करें",
    downloadBtn: "फाइल डाउनलोड करें",
    settingsTitle: "सेटिंग्स",
    previewTitle: "इमेज प्रिव्यू",
    heroTitle: "इमेज एडिटिंग, आसान और सरल।",
    heroSub: "ब्राउज़र में सीधे AI से बैकग्राउंड हटाने, टेक्स्ट जोड़ने, क्रॉप, रीसाइज़ और इमेज फॉर्मेट बदलने के लिए मुफ़्त टूल्स। बिना साइनअप, बिना सर्वर अपलोड, 100% प्राइवेट।",
    whyTitle: "इमेज एडिटिंग ब्राउज़र में लोकली क्यों करें?",
    why1Title: "🔒 कोई अपलोड नहीं, पूर्ण गोपनीयता",
    why1Desc: "जब आप किसी साधारण ऑनलाइन टूल पर फोटो अपलोड करते हैं, तो आपकी इमेज उनके सर्वर पर जाती है। MediaDit पूरी तरह से आपके ब्राउज़र मेमोरी में काम करता है। आपकी फाइलें आपके कंप्यूटर से बाहर नहीं जातीं।",
    why2Title: "⚡ छोटे और सुपरफास्ट AI मॉडल",
    why2Desc: "हमारा बैकग्राउंड रिमूवर केवल 50MB के कंप्रेस्ड न्यूरल नेटवर्क से आपके डिवाइस पर चलता है। पहली बार लोड होने के बाद, यह बिना इंटरनेट भी तुरंत काम करता है।",
    why3Title: "✨ कोई साइनअप नहीं, कोई फीस नहीं",
    why3Desc: "हमारा मानना है कि छोटे कामों के लिए अकाउंट बनाने, ईमेल देने या पैसे देने की जरूरत नहीं होनी चाहिए। कोई लिमिट नहीं, कोई वॉटरमार्क नहीं और कोई साइनअप नहीं। कभी नहीं।",
    cardRemoveBgTitle: "बैकग्राउंड हटाएं",
    cardRemoveBgDesc: "लोकल AI की मदद से अपने ब्राउज़र में तुरंत इमेज बैकग्राउंड हटाएं। बिना किसी सर्वर अपलोड के, 100% सुरक्षित।",
    cardAddTextTitle: "इमेज पर टेक्स्ट जोड़ें",
    cardAddTextDesc: "अपनी इमेज पर मनचाहे टेक्स्ट जोड़ें, सजाएं और ड्रैग करें। फॉन्ट का साइज, फैमिली और कलर बदलें।",
    cardConvertTitle: "फॉर्मेट बदलें",
    cardConvertDesc: "PNG, JPEG, WEBP और BMP फाइलों को तुरंत एक-दूसरे में बदलें। क्वालिटी और साइज को कंट्रोल करें।",
    cardResizeTitle: "रीसाइज़ और क्रॉप",
    cardResizeDesc: "इमेज की क्लैरिटी खोए बिना सटीक आस्पेक्ट रेश्यो में क्रॉप करें और रीसाइज़ करें। कैनवास द्वारा संचालित।",
    cardCompressTitle: "इमेज कंप्रेस करें",
    cardCompressDesc: "इमेज की क्वालिटी खोए बिना उसका फाइल साइज तुरंत कम करें। 100% मुफ़्त, सुरक्षित और ऑफलाइन।",
    compressSettings: "कंप्रेशन सेटिंग्स",
    outputFormat: "आउटपुट फॉर्मेट",
    compressQuality: "कंप्रेशन क्वालिटी",
    original: "ओरिजिनल",
    compressed: "कंप्रेस्ड",
    savingsRatio: "कुल बचत रेशियो",
    saved: "बचाया गया",
    noSavings: "कोई बचत नहीं",
    downloadCompressed: "कंप्रेस्ड इमेज डाउनलोड करें",
    uploadAnother: "दूसरी इमेज अपलोड करें",
    losslessPngNotice: "PNG एक लॉसलेस फॉर्मेट है और यह क्वालिटी स्लाइडर से छोटा नहीं होता। साइज कम करने के लिए WEBP या JPEG में बदलें।",
    formatSettings: "फॉर्मेट सेटिंग्स",
    targetFormat: "टारगेट फॉर्मेट",
    convertDownload: "कन्वर्ट और डाउनलोड करें",
    removeBgBtn: "बैकग्राउंड हटाएं",
    processing: "प्रोसेस हो रहा है...",
    loadingModel: "AI मॉडल (~50MB) आपके ब्राउज़र में डाउनलोड हो रहा है...",
    firstRunNotice: "यह केवल पहली बार होता है। अगली बार से बैकग्राउंड तुरंत हट जाएगा।",
    downloadBgRemoved: "इमेज डाउनलोड करें",
    resizeSettings: "रीसाइज़ और क्रॉप सेटिंग्स",
    aspectRatio: "आस्पेक्ट रेश्यो",
    custom: "कस्टम",
    width: "चौड़ाई (px)",
    height: "ऊंचाई (px)",
    lockAspect: "आस्पेक्ट लॉक करें",
    cropBtn: "क्रॉप और डाउनलोड करें",
    addTextBtn: "ड्रैगेबल टेक्स्ट जोड़ें",
    fontFamily: "फॉन्ट फैमिली",
    fontSize: "फॉन्ट साइज",
    textColor: "टेक्स्ट का रंग",
    doubleClickEdit: "एडिट करने के लिए टेक्स्ट पर डबल-क्लिक करें",
    exportDownload: "एक्सपोर्ट और डाउनलोड करें",
    footerNotice: "सभी ऑपरेशन आपके ब्राउज़र मेमोरी में लोकली चलते हैं। आपकी फाइलें कभी भी आपके डिवाइस से बाहर नहीं जातीं।",
    
    // Compress Info Section
    compressInfoTitle: "ब्राउज़र में इमेज कंप्रेशन कैसे काम करता है?",
    compressInfoSub: "साधारण ऑनलाइन कंप्रेशर्स के विपरीत जो आपकी तस्वीरों को सर्वर पर भेजते हैं, MediaDit आपकी फाइलों को सीधे ब्राउज़र मेमोरी में प्रोसेस करता है।",
    compressInfo1Title: "🔒 100% सुरक्षित और लोकल",
    compressInfo1Desc: "जब आप फाइल अपलोड करते हैं, तो यह सीधे HTML5 कैनवास में लोड होती है। क्वालिटी स्लाइडर कैनवास के पिक्सल को लोकल स्तर पर स्केल करता है, जिससे इमेज आपके कंप्यूटर से बाहर नहीं जाती।",
    compressInfo2Title: "⚡ WebP और JPEG फॉर्मेट का फायदा",
    compressInfo2Desc: "WebP और JPEG लॉसयुक्त फॉर्मेट हैं, जो मानवीय आंखों के लिए अदृश्य पिक्सल को हटाकर साइज छोटा करते हैं। क्वालिटी को 70%–80% पर रखने से साइज 80% तक कम हो जाता है।",
    compressInfo3Title: "💡 PNG फाइल के लिए सलाह",
    compressInfo3Desc: "PNG एक लॉसलेस फॉर्मेट है जो हर पिक्सेल को सुरक्षित रखता है, इसलिए इसका साइज बड़ा होता है। साइज कम करने के लिए इमेज को फॉर्मेट पैनल में जाकर WebP या JPEG में बदलें।",
    compressInfo4Title: "🚀 वेबसाइट की स्पीड बढ़ाएं",
    compressInfo4Desc: "भारी तस्वीरें वेबसाइट के लोडिंग टाइम को बढ़ा देती हैं। अपनी वेबसाइट या ईमेल में लगाने से पहले तस्वीरों को 500 KB से कम कंप्रेस करने से SEO रैंकिंग और स्पीड दोनों बेहतर होती हैं।",

    // Convert Info Section
    convertInfoTitle: "ब्राउज़र में इमेज कन्वर्शन कैसे काम करता है?",
    convertInfoSub: "MediaDit इमेज फॉर्मेट्स को पूरी तरह से आपके ब्राउज़र में बदलता है, जिससे आपको पूर्ण गोपनीयता और सुपरफास्ट स्पीड मिलती है।",
    convertInfo1Title: "🔒 100% सुरक्षित और सर्वरलेस",
    convertInfo1Desc: "जब आप PNG को WebP में या JPEG को PNG में बदलते हैं, तो तस्वीरें लोकल ब्राउज़र में प्रोसेस होती हैं। हम आपके फाइलों को किसी भी बाहरी सर्वर पर अपलोड नहीं करते।",
    convertInfo2Title: "🌈 फॉर्मेट की तुलना (WebP, PNG, JPEG)",
    convertInfo2Desc: "अपनी जरूरत के हिसाब से सही फॉर्मेट चुनें: पारदर्शी बैकग्राउंड के लिए PNG, शेयर करने के लिए JPEG और वेबसाइट के लिए हल्की WebP इमेज।",
    convertInfo3Title: "🎨 पारदर्शी बैकग्राउंड को सुरक्षित रखें",
    convertInfo3Desc: "यदि आपकी तस्वीर का बैकग्राउंड हटा हुआ है, तो उसे PNG या WebP फॉर्मेट में ही बदलें। JPEG में बदलने पर पारदर्शी हिस्सा अपने आप सफेद रंग से भर जाएगा।",
    convertInfo4Title: "⚡ सुपरफास्ट कैनवास एक्सपोर्ट",
    convertInfo4Desc: "हमारा टूल HTML5 कैनवास की मदद से इमेज रेंडर करता है। ब्राउज़र आपके कंप्यूटर के GPU (ग्राफिक्स कार्ड) का इस्तेमाल करके इमेज को एक सेकंड से भी कम समय में बदल देता है।"
  }
};
