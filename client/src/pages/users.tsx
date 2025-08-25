import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2 } from "lucide-react";
import { User } from "@shared/schema";

export default function Users() {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    // This would need to be implemented in the backend
    enabled: false, // Disable for now since we only have one user from auth
  });

  // For now, we'll show the current authenticated user
  const { data: currentUser } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  return (
    <div className="space-y-6" data-testid="users-content">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">User Management</h3>
          <p className="text-slate-600">Manage admin users and permissions</p>
        </div>
        <Button disabled data-testid="add-user-button">
          <Plus className="w-4 h-4 mr-2" />
          Add User
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center" data-testid="users-loading">
              <p className="text-slate-500">Loading users...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">User</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Email</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Role</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Domains Access</th>
                    <th className="text-right py-4 px-6 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentUser && (
                    <tr className="hover:bg-slate-50 transition-colors" data-testid="current-user-row">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={currentUser.profileImageUrl || ""} />
                            <AvatarFallback>
                              {currentUser.firstName?.[0]}{currentUser.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-slate-800">
                            {currentUser.firstName} {currentUser.lastName}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700">{currentUser.email}</td>
                      <td className="py-4 px-6">
                        <Badge variant="destructive">Super Admin</Badge>
                      </td>
                      <td className="py-4 px-6 text-slate-600">All Domains</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" disabled data-testid="edit-user-button">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" disabled data-testid="delete-user-button">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
          
          {!currentUser && !isLoading && (
            <div className="p-8 text-center" data-testid="no-users">
              <p className="text-slate-500">No users found.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-6">
          <h4 className="font-semibold text-blue-800 mb-2">User Management Features</h4>
          <p className="text-blue-700 text-sm">
            Full user management features including role-based access control, domain-specific permissions, 
            and team collaboration tools are available in the premium version of DomainHub.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
