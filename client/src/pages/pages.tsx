import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { JsonEditor } from "@/components/ui/json-editor";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPageSchema, Page, Domain } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Copy, Trash2, FileText } from "lucide-react";
import { z } from "zod";

const pageFormSchema = insertPageSchema.extend({
  sectionsJson: z.string().optional(),
});

type PageFormData = z.infer<typeof pageFormSchema>;

interface PagesProps {
  selectedDomainId: number | null;
}

export default function Pages({ selectedDomainId }: PagesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/domains", selectedDomainId, "pages"],
    enabled: !!selectedDomainId,
  });

  const createPageMutation = useMutation({
    mutationFn: async (data: PageFormData) => {
      const payload = {
        ...data,
        sectionsJson: data.sectionsJson ? JSON.parse(data.sectionsJson) : {},
      };
      return apiRequest("POST", `/api/domains/${selectedDomainId}/pages`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", selectedDomainId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Page created successfully!" });
      setIsEditorOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to create page. Please try again.",
        variant: "destructive"
      });
    },
  });

  const updatePageMutation = useMutation({
    mutationFn: async (data: PageFormData) => {
      const payload = {
        ...data,
        sectionsJson: data.sectionsJson ? JSON.parse(data.sectionsJson) : {},
      };
      return apiRequest("PUT", `/api/pages/${editingPage?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", selectedDomainId, "pages"] });
      toast({ title: "Success", description: "Page updated successfully!" });
      setIsEditorOpen(false);
      setEditingPage(null);
      form.reset();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update page. Please try again.",
        variant: "destructive"
      });
    },
  });

  const deletePageMutation = useMutation({
    mutationFn: async (pageId: number) => {
      return apiRequest("DELETE", `/api/pages/${pageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", selectedDomainId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Page deleted successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete page. Please try again.",
        variant: "destructive"
      });
    },
  });

  const form = useForm<PageFormData>({
    resolver: zodResolver(pageFormSchema),
    defaultValues: {
      name: "",
      title: "",
      subtitle: "",
      sectionsJson: "{}",
      metaTitle: "",
      metaDescription: "",
      status: "draft",
    },
  });

  const selectedDomain = domains.find(d => d.id === selectedDomainId);

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (page.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    form.reset({
      name: page.name,
      title: page.title || "",
      subtitle: page.subtitle || "",
      sectionsJson: JSON.stringify(page.sectionsJson || {}, null, 2),
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      status: page.status,
    });
    setIsEditorOpen(true);
  };

  const handleDuplicate = (page: Page) => {
    form.reset({
      name: `${page.name}-copy`,
      title: page.title || "",
      subtitle: page.subtitle || "",
      sectionsJson: JSON.stringify(page.sectionsJson || {}, null, 2),
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      status: "draft",
    });
    setEditingPage(null);
    setIsEditorOpen(true);
  };

  const onSubmit = (data: PageFormData) => {
    if (editingPage) {
      updatePageMutation.mutate(data);
    } else {
      createPageMutation.mutate(data);
    }
  };

  if (!selectedDomainId) {
    return (
      <div className="text-center py-12" data-testid="no-domain-selected">
        <p className="text-slate-500">Please select a domain to manage pages.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="pages-content">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">Pages Management</h3>
          <p className="text-slate-600">
            Manage content pages for <span className="font-medium">{selectedDomain?.name}</span>
          </p>
        </div>
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={() => {
                setEditingPage(null);
                form.reset();
              }}
              data-testid="add-page-button"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Page
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPage ? "Edit Page" : "Create New Page"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., homepage" 
                            {...field} 
                            data-testid="page-name-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Page Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter page title" 
                            {...field}
                            value={field.value || ""}
                            data-testid="page-title-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="subtitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Page Subtitle</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter page subtitle" 
                          {...field} 
                          data-testid="page-subtitle-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sectionsJson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sections JSON</FormLabel>
                      <FormControl>
                        <JsonEditor
                          value={field.value || "{}"}
                          onChange={field.onChange}
                          placeholder='{"sections": []}'
                          rows={10}
                          data-testid="sections-json-editor"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="metaTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Title</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="SEO meta title" 
                            {...field} 
                            data-testid="meta-title-input"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="page-status-select">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="SEO meta description" 
                          rows={3} 
                          {...field} 
                          data-testid="meta-description-textarea"
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
                    onClick={() => setIsEditorOpen(false)}
                    data-testid="cancel-page-button"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createPageMutation.isPending || updatePageMutation.isPending}
                    data-testid="save-page-button"
                  >
                    {editingPage ? "Update Page" : "Create Page"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search pages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="page-search-input"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48" data-testid="page-filter-select">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Pages</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pages Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center" data-testid="pages-loading">
              <p className="text-slate-500">Loading pages...</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="p-8 text-center" data-testid="no-pages-found">
              <p className="text-slate-500">
                {searchTerm || statusFilter !== "all" 
                  ? "No pages match your search criteria." 
                  : "No pages found. Create your first page to get started."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Page Name</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Title</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Last Modified</th>
                    <th className="text-right py-4 px-6 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {filteredPages.map((page) => (
                    <tr key={page.id} className="hover:bg-slate-50 transition-colors" data-testid={`page-row-${page.id}`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="text-primary text-sm" />
                          </div>
                          <span className="font-medium text-slate-800">{page.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700">{page.title || "-"}</td>
                      <td className="py-4 px-6">
                        <span 
                          className={`px-2 py-1 rounded-full text-sm font-medium ${
                            page.status === "published" 
                              ? "bg-green-100 text-green-700"
                              : page.status === "draft"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {page.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {new Date(page.updatedAt!).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(page)}
                            data-testid={`edit-page-${page.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicate(page)}
                            data-testid={`duplicate-page-${page.id}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deletePageMutation.mutate(page.id)}
                            disabled={deletePageMutation.isPending}
                            data-testid={`delete-page-${page.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
