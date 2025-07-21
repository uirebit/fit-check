"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  ArrowLeft, Search, FilterIcon, Plus, Trash2, 
  CheckCircle2, AlertCircle, Loader2 
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  CompanyCloth, 
  AllClothingItem,
  getCompanyClothes, 
  getAllClothingItems, 
  addClothesToCompany, 
  removeClothFromCompany 
} from "@/app/actions/company-cloth"
import { Company, getAllCompanies } from "@/app/actions/company"
import { ExportMeasurementsButton } from "@/components/export-measurements-button"

export default function CompanyClothManagementPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { language } = useLanguage();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // State for managing data
  const [companyClothes, setCompanyClothes] = useState<CompanyCloth[]>([]);
  const [allClothes, setAllClothes] = useState<AllClothingItem[]>([]);
  const [filteredCompanyClothes, setFilteredCompanyClothes] = useState<CompanyCloth[]>([]);
  const [filteredAllClothes, setFilteredAllClothes] = useState<AllClothingItem[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  
  // State for search and filter
  const [searchAssigned, setSearchAssigned] = useState("");
  const [searchAvailable, setSearchAvailable] = useState("");
  const [categoryFilterAssigned, setCategoryFilterAssigned] = useState("all");
  const [categoryFilterAvailable, setCategoryFilterAvailable] = useState("all");
  
  // Selection state
  const [selectedAssigned, setSelectedAssigned] = useState<Set<string>>(new Set());
  const [selectedAvailable, setSelectedAvailable] = useState<Set<number>>(new Set());
  
  // UI state
  const [activeTab, setActiveTab] = useState("assigned");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [addingItems, setAddingItems] = useState(false);
  const [removingItems, setRemovingItems] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Get unique categories
  const assignedCategories = [...new Set(companyClothes.map(item => item.category))];
  const availableCategories = [...new Set(allClothes.map(item => item.category))];
  
  // Effect to load companies if user is superadmin
  useEffect(() => {
    async function loadCompanies() {
      if (!isAuthenticated || authLoading) return;
      
      // Only load companies if user is superadmin
      if (user?.isSuperadmin || user?.userType === 1) {
        setLoadingCompanies(true);
        try {
          const response = await getAllCompanies();
          if (response.success && response.companies) {
            setCompanies(response.companies);
            // If there are companies, select the first one by default
            if (response.companies.length > 0) {
              setSelectedCompanyId(response.companies[0].id);
            }
          } else if (response.error) {
            setError(response.error);
          }
        } catch (err) {
          setError("Failed to load companies");
          console.error(err);
        } finally {
          setLoadingCompanies(false);
        }
      } else {
        // For regular admins, use their own company
        if (user?.companyId) {
          setSelectedCompanyId(parseInt(user.companyId));
        }
      }
    }
    
    loadCompanies();
  }, [isAuthenticated, authLoading, user]);
  
  // Effect to load clothing data when selectedCompanyId changes
  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated || authLoading || selectedCompanyId === null) return;
      
      try {
        setIsLoading(true);
        setError(""); // Clear any previous errors
        
        // Load assigned clothes
        const companyResponse = await getCompanyClothes(selectedCompanyId);
        if (companyResponse.success && companyResponse.companyClothes) {
          setCompanyClothes(companyResponse.companyClothes);
          setFilteredCompanyClothes(companyResponse.companyClothes);
        } else if (companyResponse.error) {
          setError(companyResponse.error);
        }
        
        // Load available clothes
        const allResponse = await getAllClothingItems(selectedCompanyId);
        if (allResponse.success && allResponse.allClothes) {
          setAllClothes(allResponse.allClothes);
          setFilteredAllClothes(allResponse.allClothes.filter(item => !item.isAssigned));
        } else if (allResponse.error) {
          setError(allResponse.error);
        }
        
        // Clear selections when company changes
        setSelectedAssigned(new Set());
        setSelectedAvailable(new Set());
        
      } catch (err) {
        setError("Failed to load clothing items");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadData();
  }, [isAuthenticated, authLoading, selectedCompanyId]);
  
  // Effect to filter company clothes when search or filter changes
  useEffect(() => {
    if (companyClothes.length > 0) {
      let filtered = [...companyClothes];
      
      // Apply search
      if (searchAssigned) {
        const searchTerm = searchAssigned.toLowerCase();
        filtered = filtered.filter(item => {
          const translatedName = t(`fc_cloth.${item.description.toLowerCase().replace(/ /g, '_')}`) || item.description;
          return translatedName.toLowerCase().includes(searchTerm);
        });
      }
      
      // Apply category filter
      if (categoryFilterAssigned && categoryFilterAssigned !== "all") {
        filtered = filtered.filter(item => item.category === categoryFilterAssigned);
      }
      
      setFilteredCompanyClothes(filtered);
    }
  }, [searchAssigned, categoryFilterAssigned, companyClothes]);
  
  // Effect to filter available clothes when search or filter changes
  useEffect(() => {
    if (allClothes.length > 0) {
      let filtered = allClothes.filter(item => !item.isAssigned);
      
      // Apply search
      if (searchAvailable) {
        const searchTerm = searchAvailable.toLowerCase();
        filtered = filtered.filter(item => {
          const translatedName = t(`fc_cloth.${item.description.toLowerCase().replace(/ /g, '_')}`) || item.description;
          return translatedName.toLowerCase().includes(searchTerm);
        });
      }
      
      // Apply category filter
      if (categoryFilterAvailable && categoryFilterAvailable !== "all") {
        filtered = filtered.filter(item => item.category === categoryFilterAvailable);
      }
      
      setFilteredAllClothes(filtered);
    }
  }, [searchAvailable, categoryFilterAvailable, allClothes]);
  
  // Handle selection of assigned clothes
  const toggleSelectAssigned = (id: string) => {
    const newSelected = new Set(selectedAssigned);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAssigned(newSelected);
  };
  
  // Handle selection of available clothes
  const toggleSelectAvailable = (id: number) => {
    const newSelected = new Set(selectedAvailable);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAvailable(newSelected);
  };
  
  // Handle adding selected clothes to company
  const handleAddClothes = async () => {
    if (selectedAvailable.size === 0) {
      setError("Please select at least one clothing item to add");
      return;
    }
    
    if (selectedCompanyId === null) {
      setError("Please select a company first");
      return;
    }
    
    setAddingItems(true);
    setError("");
    
    try {
      const response = await addClothesToCompany(Array.from(selectedAvailable), selectedCompanyId);
      if (response.success) {
        setSuccessMessage(response.message || "Items added successfully");
        
        // Refresh data
        const companyResponse = await getCompanyClothes(selectedCompanyId);
        const allResponse = await getAllClothingItems(selectedCompanyId);
        
        if (companyResponse.success && companyResponse.companyClothes) {
          setCompanyClothes(companyResponse.companyClothes);
          setFilteredCompanyClothes(companyResponse.companyClothes);
        }
        
        if (allResponse.success && allResponse.allClothes) {
          setAllClothes(allResponse.allClothes);
          setFilteredAllClothes(allResponse.allClothes.filter(item => !item.isAssigned));
        }
        
        // Clear selection
        setSelectedAvailable(new Set());
      } else {
        setError(response.error || "Failed to add items");
      }
    } catch (err) {
      setError("An error occurred while adding items");
      console.error(err);
    } finally {
      setAddingItems(false);
      
      // Clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    }
  };
  
  // Handle removing selected clothes from company
  const handleRemoveClothes = async () => {
    if (selectedAssigned.size === 0) {
      setError("Please select at least one clothing item to remove");
      return;
    }
    
    if (selectedCompanyId === null) {
      setError("Please select a company first");
      return;
    }
    
    setRemovingItems(true);
    setError("");
    
    try {
      const response = await removeClothFromCompany(Array.from(selectedAssigned), selectedCompanyId);
      if (response.success) {
        setSuccessMessage(response.message || "Items removed successfully");
        
        // Refresh data
        const companyResponse = await getCompanyClothes(selectedCompanyId);
        const allResponse = await getAllClothingItems(selectedCompanyId);
        
        if (companyResponse.success && companyResponse.companyClothes) {
          setCompanyClothes(companyResponse.companyClothes);
          setFilteredCompanyClothes(companyResponse.companyClothes);
        }
        
        if (allResponse.success && allResponse.allClothes) {
          setAllClothes(allResponse.allClothes);
          setFilteredAllClothes(allResponse.allClothes.filter(item => !item.isAssigned));
        }
        
        // Clear selection
        setSelectedAssigned(new Set());
      } else {
        setError(response.error || "Failed to remove items");
      }
    } catch (err) {
      setError("An error occurred while removing items");
      console.error(err);
    } finally {
      setRemovingItems(false);
      
      // Clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => setSuccessMessage(""), 3000);
      }
    }
  };

  // Check if user is authorized (admin or superadmin)
  const isAuthorized = user?.isAdmin || user?.isSuperadmin || user?.userType === 1 || user?.userType === 2;
  
  // If not authenticated or loading auth status, show loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }
  
  // If not authenticated or not authorized, show error
  if (!isAuthenticated || !isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access this page. Please login with an admin account.
          </AlertDescription>
        </Alert>
        <Button 
          className="mt-4"
          onClick={() => router.push(`/${language}`)}
        >
          Return to Login
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center">
              {t("admin.companyClothingManagement")}
            </h1>
            <p className="text-gray-600 mb-4">{t("admin.clothingManagementDesc")}</p>
          </div>
          <Button variant="outline" onClick={() => router.push(`/${language}/dashboard`)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("admin.backToDashboard")}
          </Button>
        </div>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="mb-4 border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertDescription className="text-green-700">{successMessage}</AlertDescription>
          </Alert>
        )}
        
        {/* Company Selector for Superadmins */}
        {(user?.isSuperadmin || user?.userType === 1) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{t("admin.selectCompany")}</CardTitle>
              <CardDescription>{t("admin.selectCompanyDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingCompanies ? (
                <div className="flex items-center">
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  <span>{t("loading.companies")}</span>
                </div>
              ) : companies.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{t("admin.noCompaniesFound")}</AlertDescription>
                </Alert>
              ) : (
                <Select 
                  value={selectedCompanyId?.toString()} 
                  onValueChange={(value) => setSelectedCompanyId(parseInt(value))}
                >
                  <SelectTrigger className="w-full md:w-1/2">
                    <SelectValue placeholder={t("admin.selectCompanyPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 overflow-auto">
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>
        )}
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t("admin.companyClothingManagement")}</CardTitle>
            <CardDescription>{t("admin.clothingManagementDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="assigned">{t("admin.assignedClothing")}</TabsTrigger>
                <TabsTrigger value="available">{t("admin.availableClothing")}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="assigned" className="pt-4">
                <div className="mb-4 flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                  <div className="flex items-center md:w-2/3">
                    <Search className="h-4 w-4 mr-2 text-gray-400" />
                    <Input
                      placeholder={t("common.search")}
                      value={searchAssigned}
                      onChange={(e) => setSearchAssigned(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center md:w-1/3">
                    <FilterIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <Select
                      value={categoryFilterAssigned}
                      onValueChange={setCategoryFilterAssigned}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("admin.filterByCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {assignedCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {t(`category.${category.toLowerCase().replace(/ /g, '_')}`) || category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={selectedAssigned.size === 0 || removingItems}
                    onClick={handleRemoveClothes}
                  >
                    {removingItems ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {t("admin.removeSelected")} ({selectedAssigned.size})
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : filteredCompanyClothes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchAssigned || categoryFilterAssigned ? (
                      <p>{t("admin.noClothesMatchFilter")}</p>
                    ) : (
                      <p>{t("admin.noClothesAssigned")}</p>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <span className="sr-only">Select</span>
                          </TableHead>
                          <TableHead>{t("admin.clothingName")}</TableHead>
                          <TableHead>{t("admin.category")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCompanyClothes.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedAssigned.has(item.id)}
                                onCheckedChange={() => toggleSelectAssigned(item.id)}
                              />
                            </TableCell>
                            <TableCell>{t(`fc_cloth.${item.description.toLowerCase().replace(/ /g, '_')}`) || item.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{t(`category.${item.category.toLowerCase().replace(/ /g, '_')}`) || item.category}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="available" className="pt-4">
                <div className="mb-4 flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
                  <div className="flex items-center md:w-2/3">
                    <Search className="h-4 w-4 mr-2 text-gray-400" />
                    <Input
                      placeholder={t("common.search")}
                      value={searchAvailable}
                      onChange={(e) => setSearchAvailable(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center md:w-1/3">
                    <FilterIcon className="h-4 w-4 mr-2 text-gray-400" />
                    <Select
                      value={categoryFilterAvailable}
                      onValueChange={setCategoryFilterAvailable}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={t("admin.filterByCategory")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t("common.all")}</SelectItem>
                        {availableCategories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {t(`category.${category.toLowerCase().replace(/ /g, '_')}`) || category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={selectedAvailable.size === 0 || addingItems}
                    onClick={handleAddClothes}
                  >
                    {addingItems ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    {t("admin.addSelected")} ({selectedAvailable.size})
                  </Button>
                </div>
                
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                ) : filteredAllClothes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {searchAvailable || categoryFilterAvailable ? (
                      <p>{t("admin.noClothesMatchFilter")}</p>
                    ) : (
                      <p>{t("admin.noClothesAvailable")}</p>
                    )}
                  </div>
                ) : (
                  <div className="border rounded-md overflow-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <span className="sr-only">Select</span>
                          </TableHead>
                          <TableHead>{t("admin.clothingName")}</TableHead>
                          <TableHead>{t("admin.category")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAllClothes.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedAvailable.has(item.id)}
                                onCheckedChange={() => toggleSelectAvailable(item.id)}
                              />
                            </TableCell>
                            <TableCell>{t(`fc_cloth.${item.description.toLowerCase().replace(/ /g, '_')}`) || item.description}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{t(`category.${item.category.toLowerCase().replace(/ /g, '_')}`) || item.category}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
