"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/contexts/language-context"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Loader2, ArrowLeft, Users, X, FilterX, Edit } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface UserData {
  id: number;
  name: string;
  email: string;
  companyId?: number | null;
  companyName?: string | null;
  userType: number;
  userTypeName: string | null;
  joinDate: string;
  gender: string;
  isSuperadmin: boolean;
  isAdmin: boolean;
}

interface CompanyData {
  id: number;
  description: string;
}

interface UserTypeData {
  id: number;
  description: string;
}

interface FiltersData {
  companyId: number | null;
  userType: number | null;
}

export default function UserManagementPage() {
  const { t, language } = useLanguage();
  const router = useRouter();

  const [users, setUsers] = useState<UserData[]>([]);
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [userTypes, setUserTypes] = useState<UserTypeData[]>([]);
  const [filters, setFilters] = useState<FiltersData>({
    companyId: null,
    userType: null
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUserType, setNewUserType] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load user data and check permissions
  // Track if this is the first render
  const isFirstRender = useRef(true);
  
  // Track if filters have been manually changed
  const [shouldFetchData, setShouldFetchData] = useState(true);
  
  // Get user auth state from NextAuth
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  
  useEffect(() => {
    async function fetchUsers() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if user is authenticated and has admin privileges
        if (!isAuthenticated || !user) {
          setError(t('admin.unauthorized'));
          setIsLoading(false);
          return;
        }
        
        if (!(user.isAdmin || user.isSuperadmin || user.userType === 1 || user.userType === 2)) {
          setError(t('admin.unauthorized'));
          setIsLoading(false);
          return;
        }
        
        // Build URL with filters
        let url = '/api/admin/users';
        const params = new URLSearchParams();
        
        // Ensure filters are properly added as parameters
        if (filters.companyId !== null && filters.companyId !== undefined) {
          params.append('companyId', filters.companyId.toString());
        }
        
        // Handle userType filter specifically
        if (filters.userType !== null && filters.userType !== undefined) {
          // Make sure we're sending a stringified number, not "null" or "undefined"
          params.append('userType', filters.userType.toString());
        }
        
        const urlWithParams = params.toString() ? `${url}?${params.toString()}` : url;
        
        const response = await fetch(urlWithParams, {
          credentials: 'include'
        });

        if (response.status === 403) {
          setError(t('admin.unauthorized'));
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users);
        setCompanies(data.companies);
        setUserTypes(data.userTypes);
        
        // Don't update filters from API response to avoid re-render loop
        // Only set the filters on first load
        if (isFirstRender.current) {
          isFirstRender.current = false;
        }
        
        // Reset the fetch flag
        setShouldFetchData(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError(t('admin.users.failedToLoadData'));
      } finally {
        setIsLoading(false);
      }
    }

    // Only fetch when should fetch is true (on first render or when filters change)
    if (shouldFetchData) {
      fetchUsers();
    }
  }, [t, language, filters, shouldFetchData]);

  const handleFilterChange = (type: 'company' | 'userType', value: string) => {
    if (type === 'company') {
      setFilters({
        ...filters,
        companyId: value === 'all' ? null : parseInt(value)
      });
    } else {
      // For userType, need to ensure it's properly passed as a number
      const parsedValue = value === 'all' ? null : parseInt(value);
      
      setFilters({
        ...filters,
        userType: parsedValue
      });
    }
    // Trigger data fetch when filters change
    setShouldFetchData(true);
  };

  const resetFilters = () => {
    // Reset both filters to null
    setFilters({
      companyId: null,
      userType: null
    });
    // Trigger data fetch when filters are reset
    setShouldFetchData(true);
  };

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user);
    setNewUserType(user.userType.toString());
    setIsEditDialogOpen(true);
    setSaveSuccess(false);
  };

  const handleSaveUserType = async () => {
    if (!selectedUser || !newUserType) return;
    
    try {
      setIsSaving(true);
      setSaveSuccess(false);
      
      const token = localStorage.getItem('auth_token') || '';
      const email = localStorage.getItem('user_data') ? 
        JSON.parse(localStorage.getItem('user_data') || '{}').email : null;
      
      let url = `/api/admin/users/${selectedUser.id}`;
      if (email) url += `?email=${encodeURIComponent(email)}`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          userType: parseInt(newUserType)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update user type');
      }

      const data = await response.json();
      
      // Update the user in the list
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === selectedUser.id ? {
            ...user,
            userType: data.user.userType,
            userTypeName: data.user.userTypeName,
            isSuperadmin: data.user.isSuperadmin,
            isAdmin: data.user.isAdmin
          } : user
        )
      );
      
      setSaveSuccess(true);
      
      // Close dialog after a short delay
      setTimeout(() => {
        setIsEditDialogOpen(false);
        // Refresh data after changing user type
        setShouldFetchData(true);
      }, 1500);
      
    } catch (err) {
      console.error('Error updating user type:', err);
      setError(t('admin.users.failedToUpdateUserType'));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertTitle className="font-semibold">Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push(`/${language}/dashboard`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('admin.backToDashboard')}
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <Users className="mr-2 h-6 w-6" />
            {t('admin.users.title')}
          </h1>
          <p className="text-gray-600 mb-4">{t('admin.users.description')}</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/${language}/dashboard`)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('admin.backToDashboard')}
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">{t('admin.users.filter')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-2 block">{t('admin.users.filterCompany')}</label>
              <Select 
                value={filters.companyId?.toString() || 'all'} 
                onValueChange={(value) => handleFilterChange('company', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t('admin.users.filterCompany')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.users.allCompanies')}</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id.toString()}>
                      {company.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3">
              <label className="text-sm font-medium mb-2 block">{t('admin.users.filterUserType')}</label>
              <Select 
                value={filters.userType?.toString() || 'all'} 
                onValueChange={(value) => handleFilterChange('userType', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={
                    filters.userType === 1 ? t('admin.users.superadmin') :
                    filters.userType === 2 ? t('admin.users.admin') :
                    filters.userType === 3 ? t('admin.users.employee') :
                    filters.userType ? userTypes.find(t => t.id === filters.userType)?.description || '' : 
                    t('admin.users.filterUserType')
                  } />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.users.allUserTypes')}</SelectItem>
                  {userTypes.map(type => (
                    <SelectItem key={type.id} value={type.id.toString()}>
                      {type.id === 1 ? t('admin.users.superadmin') :
                       type.id === 2 ? t('admin.users.admin') :
                       type.id === 3 ? t('admin.users.employee') : type.description}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-1/3 flex items-end">
              <Button variant="outline" onClick={resetFilters} className="w-full md:w-auto">
                <FilterX className="mr-2 h-4 w-4" />
                {t('admin.users.resetFilters')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.users.title')}</CardTitle>
          <CardDescription>{t('admin.users.tableCaption')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.users.name')}</TableHead>
                <TableHead>{t('admin.users.email')}</TableHead>
                <TableHead>{t('admin.users.company')}</TableHead>
                <TableHead>{t('admin.users.userType')}</TableHead>
                <TableHead className="text-right">{t('admin.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    {t('admin.users.noUsers')}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.companyName ? (
                        <span>{user.companyName}</span>
                      ) : (
                        <span className="text-gray-400 italic">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isSuperadmin ? (
                        <Badge className="bg-blue-500">{t('admin.users.superadmin')}</Badge>
                      ) : user.isAdmin ? (
                        <Badge variant="secondary">{t('admin.users.admin')}</Badge>
                      ) : (
                        <Badge variant="outline">{t('admin.users.employee')}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!user.isSuperadmin ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(user)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {t('admin.users.edit')}
                        </Button>
                      ) : (
                        <span className="text-gray-400 italic">
                          {t('admin.users.cannotEdit')}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Type Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.users.editUser')}</DialogTitle>
            <DialogDescription>{t('admin.users.editDescription')}</DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="py-4">
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">{t('admin.users.name')}</p>
                <p className="text-lg font-semibold">{selectedUser.name}</p>
              </div>
              
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-500">{t('admin.users.email')}</p>
                <p>{selectedUser.email}</p>
              </div>
              
              <div className="mb-6">
                <label className="text-sm font-medium mb-2 block">
                  {t('admin.users.userType')}
                </label>
                <Select 
                  value={newUserType || selectedUser.userType.toString()} 
                  onValueChange={setNewUserType}
                  disabled={isSaving}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={
                      selectedUser.userType === 1 ? t('admin.users.superadmin') :
                      selectedUser.userType === 2 ? t('admin.users.admin') :
                      selectedUser.userType === 3 ? t('admin.users.employee') :
                      selectedUser.userTypeName || ''
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {userTypes.map(type => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.id === 1 ? t('admin.users.superadmin') :
                         type.id === 2 ? t('admin.users.admin') :
                         type.id === 3 ? t('admin.users.employee') : type.description}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {saveSuccess && (
                <Alert className="mb-4 bg-green-50 border-green-200">
                  <AlertDescription className="text-green-600">
                    {t('admin.users.changesSaved')}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isSaving}>
              <X className="mr-2 h-4 w-4" />
              {t('admin.cancel')}
            </Button>
            <Button onClick={handleSaveUserType} disabled={isSaving || saveSuccess}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('settings.profile.saving')}
                </>
              ) : (
                t('admin.users.save')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
