"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type Language = "en" | "es" | "pt"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const translations = {
  en: {
    // Header
    "header.title": "WorkWear Sizes",
    "header.savedSizes": "Saved Sizes",
    "header.addSizes": "Add Sizes",
    "header.settings": "Settings",
    "header.signOut": "Sign Out",

    // Main page
    "main.title": "Manage Your Work Clothing Sizes",
    "main.subtitle": "Select a clothing type and follow the measurement instructions to get your perfect fit.",
    "main.selectClothing": "Select Clothing Type",
    "main.selectClothingDesc": "Choose the type of work clothing you want to measure",
    "main.selectPlaceholder": "Select a clothing type...",

    // Clothing types
    "clothing.workHat": "Work Hat",
    "clothing.safetyHelmet": "Safety Helmet",
    "clothing.workShirt": "Work Shirt",
    "clothing.poloShirt": "Polo Shirt",
    "clothing.workJacket": "Work Jacket",
    "clothing.safetyVest": "Safety Vest",
    "clothing.workPants": "Work Pants",
    "clothing.workShorts": "Work Shorts",
    "clothing.coveralls": "Coveralls",
    "clothing.workBoots": "Work Boots",
    "clothing.safetyShoes": "Safety Shoes",
    "clothing.workGloves": "Work Gloves",
    "clothing.workSocks": "Work Socks",
    "clothing.belt": "Work Belt",
    "clothing.rainCoat": "Rain Coat",

    // Categories
    "category.headwear": "headwear",
    "category.tops": "tops",
    "category.outerwear": "outerwear",
    "category.bottoms": "bottoms",
    "category.fullBody": "full-body",
    "category.footwear": "footwear",
    "category.accessories": "accessories",

    // Measurement form
    "measurement.howToMeasure": "How to Measure",
    "measurement.followInstructions": "Follow these instructions for accurate measurements",
    "measurement.maleGuide": "Male Guide",
    "measurement.femaleGuide": "Female Guide",
    "measurement.instructions": "Measurement Instructions:",
    "measurement.tips": "💡 Measurement Tips:",
    "measurement.tip1": "• Use a flexible measuring tape",
    "measurement.tip2": "• Measure over appropriate undergarments",
    "measurement.tip3": "• Keep the tape snug but not tight",
    "measurement.tip4": "• Ask someone to help for better accuracy",

    // Input form
    "input.enterMeasurements": "Enter Your Measurements",
    "input.enterInCm": "Input your measurements in centimeters (cm)",
    "input.calculatedSize": "📏 Calculated EU Size:",
    "input.basedOnMeasurements": "Based on your measurements",
    "input.saving": "Saving...",
    "input.save": "Save Size Information",

    // Measurements
    "measure.headCircumference": "Head Circumference",
    "measure.headCircumferenceDesc": "Measure around the widest part of your head",
    "measure.headCircumferencePlaceholder": "Enter head circumference",
    "measure.chestCircumference": "Chest Circumference",
    "measure.chestCircumferenceDesc": "Measure around the fullest part of your chest",
    "measure.chestCircumferencePlaceholder": "Enter chest measurement",
    "measure.neckCircumference": "Neck Circumference",
    "measure.neckCircumferenceDesc": "Measure around the base of your neck",
    "measure.neckCircumferencePlaceholder": "Enter neck measurement",
    "measure.sleeveLength": "Sleeve Length",
    "measure.sleeveLengthDesc": "From shoulder point to wrist",
    "measure.sleeveLengthPlaceholder": "Enter sleeve length",
    "measure.waistCircumference": "Waist Circumference",
    "measure.waistCircumferenceDesc": "Measure around your natural waistline",
    "measure.waistCircumferencePlaceholder": "Enter waist measurement",
    "measure.hipCircumference": "Hip Circumference",
    "measure.hipCircumferenceDesc": "Measure around the fullest part of your hips",
    "measure.hipCircumferencePlaceholder": "Enter hip measurement",
    "measure.inseamLength": "Inseam Length",
    "measure.inseamLengthDesc": "From crotch to ankle bone",
    "measure.inseamLengthPlaceholder": "Enter inseam length",
    "measure.footLength": "Foot Length",
    "measure.footLengthDesc": "From heel to longest toe",
    "measure.footLengthPlaceholder": "Enter foot length",
    "measure.footWidth": "Foot Width",
    "measure.footWidthDesc": "At the widest part of your foot",
    "measure.footWidthPlaceholder": "Enter foot width",

    // Saved sizes
    "saved.title": "Your Saved Sizes",
    "saved.subtitle": "Manage your work clothing size information. You have {count} saved size{plural}.",
    "saved.noSizes":
      "You haven't saved any clothing sizes yet. Start by selecting a clothing type and entering your measurements.",
    "saved.measurements": "Measurements:",
    "saved.saved": "Saved",
    "saved.edit": "Edit",
    "saved.loading": "Loading your saved sizes...",

    // Language selector
    "language.select": "Language",
    "language.english": "English",
    "language.spanish": "Español",
    "language.portuguese": "Português",
  },
  es: {
    // Header
    "header.title": "Tallas de Ropa de Trabajo",
    "header.savedSizes": "Tallas Guardadas",
    "header.addSizes": "Agregar Tallas",
    "header.settings": "Configuración",
    "header.signOut": "Cerrar Sesión",

    // Main page
    "main.title": "Gestiona las Tallas de tu Ropa de Trabajo",
    "main.subtitle":
      "Selecciona un tipo de ropa y sigue las instrucciones de medición para obtener el ajuste perfecto.",
    "main.selectClothing": "Seleccionar Tipo de Ropa",
    "main.selectClothingDesc": "Elige el tipo de ropa de trabajo que quieres medir",
    "main.selectPlaceholder": "Selecciona un tipo de ropa...",

    // Clothing types
    "clothing.workHat": "Gorro de Trabajo",
    "clothing.safetyHelmet": "Casco de Seguridad",
    "clothing.workShirt": "Camisa de Trabajo",
    "clothing.poloShirt": "Polo",
    "clothing.workJacket": "Chaqueta de Trabajo",
    "clothing.safetyVest": "Chaleco de Seguridad",
    "clothing.workPants": "Pantalones de Trabajo",
    "clothing.workShorts": "Shorts de Trabajo",
    "clothing.coveralls": "Monos de Trabajo",
    "clothing.workBoots": "Botas de Trabajo",
    "clothing.safetyShoes": "Zapatos de Seguridad",
    "clothing.workGloves": "Guantes de Trabajo",
    "clothing.workSocks": "Calcetines de Trabajo",
    "clothing.belt": "Cinturón de Trabajo",
    "clothing.rainCoat": "Impermeable",

    // Categories
    "category.headwear": "sombreros",
    "category.tops": "camisetas",
    "category.outerwear": "abrigos",
    "category.bottoms": "pantalones",
    "category.fullBody": "cuerpo completo",
    "category.footwear": "calzado",
    "category.accessories": "accesorios",

    // Measurement form
    "measurement.howToMeasure": "Cómo Medir",
    "measurement.followInstructions": "Sigue estas instrucciones para mediciones precisas",
    "measurement.maleGuide": "Guía Masculina",
    "measurement.femaleGuide": "Guía Femenina",
    "measurement.instructions": "Instrucciones de Medición:",
    "measurement.tips": "💡 Consejos de Medición:",
    "measurement.tip1": "• Usa una cinta métrica flexible",
    "measurement.tip2": "• Mide sobre la ropa interior apropiada",
    "measurement.tip3": "• Mantén la cinta ajustada pero no apretada",
    "measurement.tip4": "• Pide ayuda a alguien para mayor precisión",

    // Input form
    "input.enterMeasurements": "Introduce tus Medidas",
    "input.enterInCm": "Introduce tus medidas en centímetros (cm)",
    "input.calculatedSize": "📏 Talla EU Calculada:",
    "input.basedOnMeasurements": "Basado en tus medidas",
    "input.saving": "Guardando...",
    "input.save": "Guardar Información de Talla",

    // Measurements
    "measure.headCircumference": "Circunferencia de la Cabeza",
    "measure.headCircumferenceDesc": "Mide alrededor de la parte más ancha de tu cabeza",
    "measure.headCircumferencePlaceholder": "Introduce circunferencia de la cabeza",
    "measure.chestCircumference": "Circunferencia del Pecho",
    "measure.chestCircumferenceDesc": "Mide alrededor de la parte más amplia de tu pecho",
    "measure.chestCircumferencePlaceholder": "Introduce medida del pecho",
    "measure.neckCircumference": "Circunferencia del Cuello",
    "measure.neckCircumferenceDesc": "Mide alrededor de la base de tu cuello",
    "measure.neckCircumferencePlaceholder": "Introduce medida del cuello",
    "measure.sleeveLength": "Longitud de Manga",
    "measure.sleeveLengthDesc": "Desde el punto del hombro hasta la muñeca",
    "measure.sleeveLengthPlaceholder": "Introduce longitud de manga",
    "measure.waistCircumference": "Circunferencia de la Cintura",
    "measure.waistCircumferenceDesc": "Mide alrededor de tu cintura natural",
    "measure.waistCircumferencePlaceholder": "Introduce medida de cintura",
    "measure.hipCircumference": "Circunferencia de Cadera",
    "measure.hipCircumferenceDesc": "Mide alrededor de la parte más amplia de tus caderas",
    "measure.hipCircumferencePlaceholder": "Introduce medida de cadera",
    "measure.inseamLength": "Longitud de Entrepierna",
    "measure.inseamLengthDesc": "Desde la entrepierna hasta el hueso del tobillo",
    "measure.inseamLengthPlaceholder": "Introduce longitud de entrepierna",
    "measure.footLength": "Longitud del Pie",
    "measure.footLengthDesc": "Desde el talón hasta el dedo más largo",
    "measure.footLengthPlaceholder": "Introduce longitud del pie",
    "measure.footWidth": "Ancho del Pie",
    "measure.footWidthDesc": "En la parte más ancha de tu pie",
    "measure.footWidthPlaceholder": "Introduce ancho del pie",

    // Saved sizes
    "saved.title": "Tus Tallas Guardadas",
    "saved.subtitle":
      "Gestiona la información de tallas de tu ropa de trabajo. Tienes {count} talla{plural} guardada{plural}.",
    "saved.noSizes":
      "Aún no has guardado ninguna talla de ropa. Comienza seleccionando un tipo de ropa e introduciendo tus medidas.",
    "saved.measurements": "Medidas:",
    "saved.saved": "Guardado",
    "saved.edit": "Editar",
    "saved.loading": "Cargando tus tallas guardadas...",

    // Language selector
    "language.select": "Idioma",
    "language.english": "English",
    "language.spanish": "Español",
    "language.portuguese": "Portugués",
  },
  pt: {
    // Header
    "header.title": "Tamanhos de Roupa de Trabalho",
    "header.savedSizes": "Tamanhos Salvos",
    "header.addSizes": "Adicionar Tamanhos",
    "header.settings": "Configurações",
    "header.signOut": "Sair",

    // Main page
    "main.title": "Gerencie os Tamanhos da sua Roupa de Trabalho",
    "main.subtitle": "Selecione um tipo de roupa e siga as instruções de medição para obter o ajuste perfeito.",
    "main.selectClothing": "Selecionar Tipo de Roupa",
    "main.selectClothingDesc": "Escolha o tipo de roupa de trabalho que você quer medir",
    "main.selectPlaceholder": "Selecione um tipo de roupa...",

    // Clothing types
    "clothing.workHat": "Chapéu de Trabalho",
    "clothing.safetyHelmet": "Capacete de Segurança",
    "clothing.workShirt": "Camisa de Trabalho",
    "clothing.poloShirt": "Polo",
    "clothing.workJacket": "Jaqueta de Trabalho",
    "clothing.safetyVest": "Colete de Segurança",
    "clothing.workPants": "Calças de Trabalho",
    "clothing.workShorts": "Shorts de Trabalho",
    "clothing.coveralls": "Macacão",
    "clothing.workBoots": "Botas de Trabalho",
    "clothing.safetyShoes": "Sapatos de Segurança",
    "clothing.workGloves": "Luvas de Trabalho",
    "clothing.workSocks": "Meias de Trabalho",
    "clothing.belt": "Cinto de Trabalho",
    "clothing.rainCoat": "Capa de Chuva",

    // Categories
    "category.headwear": "chapéus",
    "category.tops": "camisetas",
    "category.outerwear": "casacos",
    "category.bottoms": "calças",
    "category.fullBody": "corpo inteiro",
    "category.footwear": "calçados",
    "category.accessories": "acessórios",

    // Measurement form
    "measurement.howToMeasure": "Como Medir",
    "measurement.followInstructions": "Siga estas instruções para medições precisas",
    "measurement.maleGuide": "Guia Masculino",
    "measurement.femaleGuide": "Guia Femenina",
    "measurement.instructions": "Instruções de Medição:",
    "measurement.tips": "💡 Dicas de Medição:",
    "measurement.tip1": "• Use uma fita métrica flexível",
    "measurement.tip2": "• Meça sobre roupas íntimas apropriadas",
    "measurement.tip3": "• Mantenha a fita justa mas não apertada",
    "measurement.tip4": "• Peça ajuda a alguém para maior precisão",

    // Input form
    "input.enterMeasurements": "Digite suas Medidas",
    "input.enterInCm": "Digite suas medidas em centímetros (cm)",
    "input.calculatedSize": "📏 Tamanho EU Calculado:",
    "input.basedOnMeasurements": "Baseado nas suas medidas",
    "input.saving": "Salvando...",
    "input.save": "Salvar Informações do Tamanho",

    // Measurements
    "measure.headCircumference": "Circunferência da Cabeça",
    "measure.headCircumferenceDesc": "Meça ao redor da parte mais larga da sua cabeça",
    "measure.headCircumferencePlaceholder": "Digite circunferência da cabeça",
    "measure.chestCircumference": "Circunferência do Peito",
    "measure.chestCircumferenceDesc": "Meça ao redor da parte mais ampla do seu peito",
    "measure.chestCircumferencePlaceholder": "Digite medida do peito",
    "measure.neckCircumference": "Circunferência do Pescoço",
    "measure.neckCircumferenceDesc": "Meça ao redor da base do seu pescoço",
    "measure.neckCircumferencePlaceholder": "Digite medida do pescoço",
    "measure.sleeveLength": "Comprimento da Manga",
    "measure.sleeveLengthDesc": "Do ponto do ombro até o pulso",
    "measure.sleeveLengthPlaceholder": "Digite comprimento da manga",
    "measure.waistCircumference": "Circunferência da Cintura",
    "measure.waistCircumferenceDesc": "Meça ao redor da sua cintura natural",
    "measure.waistCircumferencePlaceholder": "Digite medida da cintura",
    "measure.hipCircumference": "Circunferência do Quadril",
    "measure.hipCircumferenceDesc": "Meça ao redor da parte mais ampla dos seus quadris",
    "measure.hipCircumferencePlaceholder": "Digite medida do quadril",
    "measure.inseamLength": "Comprimento da Entrepierna",
    "measure.inseamLengthDesc": "Da entrepierna até o osso do tornozelo",
    "measure.inseamLengthPlaceholder": "Digite comprimento da entrepierna",
    "measure.footLength": "Comprimento do Pé",
    "measure.footLengthDesc": "Do calcanhar até o dedo mais longo",
    "measure.footLengthPlaceholder": "Digite comprimento do pé",
    "measure.footWidth": "Largura do Pé",
    "measure.footWidthDesc": "Na parte mais larga do seu pé",
    "measure.footWidthPlaceholder": "Digite largura do pé",

    // Saved sizes
    "saved.title": "Seus Tamanhos Salvos",
    "saved.subtitle":
      "Gerencie as informações de tamanho da sua roupa de trabalho. Você tem {count} tamanho{plural} salvo{plural}.",
    "saved.noSizes":
      "Você ainda não salvou nenhum tamanho de roupa. Comece selecionando um tipo de roupa e digitando suas medidas.",
    "saved.measurements": "Medidas:",
    "saved.saved": "Salvo",
    "saved.edit": "Editar",
    "saved.loading": "Carregando seus tamanhos salvos...",

    // Language selector
    "language.select": "Idioma",
    "language.english": "English",
    "language.spanish": "Español",
    "language.portuguese": "Português",
  },
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  useEffect(() => {
    const savedLanguage = localStorage.getItem("language") as Language
    if (savedLanguage && ["en", "es", "pt"].includes(savedLanguage)) {
      setLanguage(savedLanguage)
    }
  }, [])

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: string): string => {
    const keys = key.split(".")
    let value: any = translations[language]

    for (const k of keys) {
      value = value?.[k]
    }

    return value || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

export type { Language }
