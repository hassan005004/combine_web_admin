import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertDomainSchema, Domain } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Trash2, Globe, Activity, Calendar } from "lucide-react";
import { z } from "zod";

const domainFormSchema = insertDomainSchema;
type DomainFormData = z.infer<typeof domainFormSchema>;

export default function DomainsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: domains = [], isLoading } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const createDomainMutation = useMutation({
    mutationFn: async (data: DomainFormData) => {
      return apiRequest("POST", "/api/domains", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Domain created successfully!" });
      setIsCreateOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create domain. Please try again.",
        variant: "destructive"
      });
    },
  });

  const updateDomainMutation = useMutation({
    mutationFn: async (data: DomainFormData) => {
      return apiRequest("PUT", `/api/domains/${editingDomain?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      toast({ title: "Success", description: "Domain updated successfully!" });
      setIsEditOpen(false);
      setEditingDomain(null);
      editForm.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update domain. Please try again.",
        variant: "destructive"
      });
    },
  });

  const deleteDomainMutation = useMutation({
    mutationFn: async (domainId: number) => {
      return apiRequest("DELETE", `/api/domains/${domainId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Domain deleted successfully!" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete domain. Please try again.",
        variant: "destructive"
      });
    },
  });

  const createForm = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      name: "",
      title: "",
      description: "",
      isActive: true,
    },
  });

  const editForm = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      name: "",
      title: "",
      description: "",
      isActive: true,
    },
  });

  const onCreateSubmit = (data: DomainFormData) => {
    createDomainMutation.mutate(data);
  };

  const onEditSubmit = (data: DomainFormData) => {
    updateDomainMutation.mutate(data);
  };

  const handleEdit = (domain: Domain) => {
    setEditingDomain(domain);
    editForm.reset({
      name: domain.name,
      title: domain.title || "",
      description: domain.description || "",
      isActive: domain.isActive,
    });
    setIsEditOpen(true);
  };

  const handleDelete = (domainId: number) => {
    deleteDomainMutation.mutate(domainId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="domains-loading">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-primary border-r-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500">Loading domains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="domains-content">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">Domain Management</h3>
          <p className="text-slate-600">Add, edit, and manage your domains</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button data-testid="add-domain-button">
              <Plus className="w-4 h-4 mr-2" />
              Add New Domain
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Domain</DialogTitle>
            </DialogHeader>
            <Form {...createForm}>
              <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
                <FormField
                  control={createForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., example.com"
                          {...field}
                          value={field.value || ""}
                          data-testid="domain-name-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={createForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Domain Title</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Website title"
                          {...field}
                          value={field.value || ""}
                          data-testid="domain-title-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the website"
                          {...field}
                          value={field.value || ""}
                          rows={3}
                          data-testid="domain-description-textarea"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                    data-testid="cancel-domain-button"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createDomainMutation.isPending}
                    data-testid="save-domain-button"
                  >
                    Create Domain
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Domain Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {domains.map((domain) => (
          <Card key={domain.id} className="hover:shadow-md transition-shadow" data-testid={`domain-card-${domain.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{domain.name}</CardTitle>
                    <p className="text-sm text-slate-500">{domain.title}</p>
                  </div>
                </div>
                <Badge variant={domain.isActive ? "default" : "secondary"}>
                  <Activity className="w-3 h-3 mr-1" />
                  {domain.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 text-sm mb-4 line-clamp-2">
                {domain.description || "No description provided"}
              </p>
              
              <div className="flex items-center justify-between text-xs text-slate-500 mb-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Created {new Date(domain.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(domain)}
                  data-testid={`edit-domain-${domain.id}`}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      data-testid={`delete-domain-${domain.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the domain
                        "{domain.name}" and all associated data including pages and settings.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(domain.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Domain
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {domains.length === 0 && (
        <div className="text-center py-12" data-testid="no-domains">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-medium text-slate-800 mb-2">No domains yet</h4>
          <p className="text-slate-500 mb-4">Get started by creating your first domain</p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Domain
          </Button>
        </div>
      )}

      {/* Edit Domain Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Domain</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., example.com"
                        {...field}
                        value={field.value || ""}
                        data-testid="edit-domain-name-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Domain Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Website title"
                        {...field}
                        value={field.value || ""}
                        data-testid="edit-domain-title-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of the website"
                        {...field}
                        value={field.value || ""}
                        rows={3}
                        data-testid="edit-domain-description-textarea"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                  data-testid="cancel-edit-domain-button"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateDomainMutation.isPending}
                  data-testid="save-edit-domain-button"
                >
                  Update Domain
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}