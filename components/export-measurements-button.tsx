"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2 } from "lucide-react"
import { exportEmployeeMeasurements } from "@/app/actions/export"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"

export function ExportMeasurementsButton({ className }: { className?: string }) {
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  // Handle export button click
  const handleExport = async () => {
    setIsExporting(true)
    
    try {
      const result = await exportEmployeeMeasurements()
      
      if (result.success && result.fileContent && result.fileName) {
        // Create blob from base64 data
        const binaryString = atob(result.fileContent)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }
        const blob = new Blob([bytes.buffer], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        })
        
        // Create download link and trigger download
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.fileName
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast({
          title: t("admin.exportSuccess"),
          description: t("admin.exportSuccessDesc"),
          variant: "default"
        })
      } else {
        throw new Error(result.error || "Export failed")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: t("admin.exportFailed"),
        description: error instanceof Error ? error.message : "Failed to export employee measurements",
        variant: "destructive"
      })
    } finally {
      setIsExporting(false)
    }
  }
  
  return (
    <Button 
      variant="outline" 
      size="default"
      className={`${className} flex items-center justify-center whitespace-nowrap`}
      onClick={handleExport}
      disabled={isExporting}
    >
      {isExporting ? (
        <>
          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
          {t("admin.exportingMeasurements")}
        </>
      ) : (
        <>
          <Download className="h-5 w-5 mr-2" />
          {t("admin.exportMeasurements")}
        </>
      )}
    </Button>
  )
}
