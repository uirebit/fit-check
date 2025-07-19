"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react" // Add this import
import { Zap, ArrowLeft, Plus, Pencil, Trash2, AlertCircle } from "lucide-react"

interface Company {
  id: number;
  description: string;
  userCount?: number;
}

export default function CompanyManagementPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const { data: session, status } = useSession(); // Add this line
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // For add/edit dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [dialogError, setDialogError] = useState("");
  
  // For delete confirmation
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Fetch companies and check admin permissions
  useEffect(() => {
    async function fetchCompanies() {
      try {
        setLoading(true);
        setError(null);
        
        // Check if session is still loading
        if (status === "loading") {
          return;
        }
        
        // Check if user is authenticated
        if (status === "unauthenticated" || !session?.user) {
          setError("Authentication required");
          setTimeout(() => {
            router.push(`/${language}`);
          }, 2000);
          return;
        }
        
        const user = session.user as any;
        
        // Check if user is superadmin (user_type = 1 is superadmin)
        const isSuperadmin = user.isSuperadmin === true || user.userType === 1;
        
        if (!isSuperadmin) {
          setIsAdmin(false);
          setError(t("admin.unauthorizedSuperadmin") || "Only superadmins can access this page");
          setTimeout(() => {
            router.push(`/${language}/dashboard`);
          }, 2000);
          return;
        }
        
        setIsAdmin(true);
        
         // Fetch companies from API
        const response = await fetch(`/api/admin/companies?email=${encodeURIComponent(user.email)}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch companies: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCompanies(data);
      } catch (err) {
        console.error("Error loading companies:", err);
        setError(err instanceof Error ? err.message : "Failed to load companies");
      } finally {
        setLoading(false);
      }
    }
    
    fetchCompanies();
  }, [router, language]);
  
  const handleAddCompany = async () => {
    if (!companyName.trim()) {
      setDialogError(t("admin.companies.nameRequired"));
      return;
    }
    
    try {
       const user = session?.user as any;
      
      const response = await fetch(`/api/admin/companies?email=${encodeURIComponent(user.email)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: companyName })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add company");
      }
      
      const newCompany = await response.json();
      
      // Add new company to state
      setCompanies([...companies, newCompany]);
      
      // Close dialog and reset state
      setCompanyName("");
      setDialogError("");
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error adding company:", err);
      setDialogError(err instanceof Error ? err.message : "Failed to add company");
    }
  };
  
  const handleEditCompany = async () => {
    if (!companyName.trim() || !currentCompany) {
      setDialogError(t("admin.companies.nameRequired"));
      return;
    }
    
    try {
      const user = session?.user as any;
      
      const response = await fetch(`/api/admin/companies/${currentCompany.id}?email=${encodeURIComponent(user.email)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ description: companyName })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update company");
      }
      
      const updatedCompany = await response.json();
      
      // Update company in state
      setCompanies(companies.map(company => 
        company.id === updatedCompany.id ? updatedCompany : company
      ));
      
      // Close dialog and reset state
      setCompanyName("");
      setCurrentCompany(null);
      setDialogError("");
      setIsDialogOpen(false);
    } catch (err) {
      console.error("Error updating company:", err);
      setDialogError(err instanceof Error ? err.message : "Failed to update company");
    }
  };
  
  const handleDeleteCompany = async () => {
    if (!deleteCompanyId) return;
    
    try {
      const user = session?.user as any;
      
      const response = await fetch(`/api/admin/companies/${deleteCompanyId}?email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete company");
      }
      
      // Remove company from state
      setCompanies(companies.filter(company => company.id !== deleteCompanyId));
      
      // Close dialog and reset state
      setDeleteCompanyId(null);
      setIsDeleteDialogOpen(false);
    } catch (err) {
      console.error("Error deleting company:", err);
      setError(err instanceof Error ? err.message : "Failed to delete company");
    }
  };
  
  const openAddDialog = () => {
    setDialogMode('add');
    setCompanyName("");
    setCurrentCompany(null);
    setDialogError("");
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (company: Company) => {
    setDialogMode('edit');
    setCompanyName(company.description);
    setCurrentCompany(company);
    setDialogError("");
    setIsDialogOpen(true);
  };
  
  const openDeleteDialog = (companyId: number) => {
    setDeleteCompanyId(companyId);
    setIsDeleteDialogOpen(true);
  };
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t("admin.unauthorized")}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-gray-900">{t("header.title")}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => router.push(`/${language}/dashboard`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("admin.backToDashboard")}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t("admin.companies.title")}</CardTitle>
                <CardDescription>{t("admin.companies.description")}</CardDescription>
              </div>
              <Button onClick={openAddDialog}>
                <Plus className="h-4 w-4 mr-2" />
                {t("admin.companies.add")}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-3">
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
              </div>
            ) : (
              <Table>
                <TableCaption>{t("admin.companies.tableCaption")}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">ID</TableHead>
                    <TableHead>{t("admin.companies.name")}</TableHead>
                    <TableHead className="w-[150px]">{t("admin.companies.userCount")}</TableHead>
                    <TableHead className="w-[150px] text-right">{t("admin.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                        {t("admin.companies.noCompanies")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    companies.map((company) => (
                      <TableRow key={company.id}>
                        <TableCell>{company.id}</TableCell>
                        <TableCell className="font-medium">{company.description}</TableCell>
                        <TableCell>{company.userCount || 0}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="outline" size="sm" onClick={() => openEditDialog(company)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => openDeleteDialog(company.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Add/Edit Company Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === 'add' ? t("admin.companies.addCompany") : t("admin.companies.editCompany")}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === 'add' ? t("admin.companies.addDescription") : t("admin.companies.editDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {dialogError && (
              <Alert variant="destructive">
                <AlertDescription>{dialogError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="company-name">{t("admin.companies.name")}</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t("admin.companies.namePlaceholder")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              {t("admin.cancel")}
            </Button>
            <Button onClick={dialogMode === 'add' ? handleAddCompany : handleEditCompany}>
              {dialogMode === 'add' ? t("admin.companies.add") : t("admin.companies.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.companies.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.companies.deleteWarning")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany}>
              {t("admin.companies.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
