import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPageSchema, Page, Domain, Faq, insertFaqSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Copy, Trash2, FileText, HelpCircle } from "lucide-react";
import { z } from "zod";

const pageFormSchema = insertPageSchema;
const faqFormSchema = insertFaqSchema.omit({ pageId: true });

interface SectionData {
  key: string;
  value: string;
}

interface FaqData {
  id?: number;
  question: string;
  answer: string;
  sortOrder: number;
  isActive: boolean;
}

type PageFormData = z.infer<typeof pageFormSchema>;
type FaqFormData = z.infer<typeof faqFormSchema>;

interface PagesProps {
  selectedDomainId: number | null;
}

export default function Pages({ selectedDomainId }: PagesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<SectionData[]>([]);
  const [isFaqDialogOpen, setIsFaqDialogOpen] = useState(false);
  const [managingFaqsForPage, setManagingFaqsForPage] = useState<Page | null>(null);
  const [faqs, setFaqs] = useState<FaqData[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/domains", selectedDomainId, "pages"],
    enabled: !!selectedDomainId,
  });

  const { data: pageFaqs = [] } = useQuery<Faq[]>({
    queryKey: ["/api/pages", managingFaqsForPage?.id, "faqs"],
    enabled: !!managingFaqsForPage?.id,
    onSuccess: (data) => {
      setFaqs(data.map(faq => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
        isActive: faq.isActive
      })));
    }
  });

  const createPageMutation = useMutation({
    mutationFn: async (data: PageFormData) => {
      const sectionsObj = sections.reduce((acc, section) => {
        if (section.key && section.value) {
          acc[section.key] = section.value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      const payload = {
        ...data,
        sectionsJson: { sections: sectionsObj },
      };
      return apiRequest("POST", `/api/domains/${selectedDomainId}/pages`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", selectedDomainId, "pages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Page created successfully!" });
      setIsEditorOpen(false);
      setSections([]);
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
      const sectionsObj = sections.reduce((acc, section) => {
        if (section.key && section.value) {
          acc[section.key] = section.value;
        }
        return acc;
      }, {} as Record<string, string>);
      
      const payload = {
        ...data,
        sectionsJson: { sections: sectionsObj },
      };
      return apiRequest("PUT", `/api/pages/${editingPage?.id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", selectedDomainId, "pages"] });
      toast({ title: "Success", description: "Page updated successfully!" });
      setIsEditorOpen(false);
      setEditingPage(null);
      setSections([]);
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

  const { data: pageFaqs } = useQuery({
    queryKey: ["/api/pages", managingFaqsForPage?.id, "faqs"],
    queryFn: () => apiRequest("GET", `/api/pages/${managingFaqsForPage?.id}/faqs`),
    enabled: !!managingFaqsForPage?.id,
  });

  useEffect(() => {
    if (pageFaqs) {
      setFaqs(pageFaqs.map((faq: any) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
        isActive: faq.isActive
      })));
    } else {
      setFaqs([]);
    }
  }, [pageFaqs, managingFaqsForPage]);

  const toggleFaqsMutation = useMutation({
    mutationFn: async ({ pageId, enabled }: { pageId: number, enabled: boolean }) => {
      return apiRequest("PUT", `/api/pages/${pageId}/faqs-enabled`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", selectedDomainId, "pages"] });
      toast({ title: "Success", description: "FAQ setting updated successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update FAQ setting.",
        variant: "destructive"
      });
    },
  });

  const createFaqMutation = useMutation({
    mutationFn: async (data: FaqFormData) => {
      return apiRequest("POST", `/api/pages/${managingFaqsForPage?.id}/faqs`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", managingFaqsForPage?.id, "faqs"] });
      toast({ title: "Success", description: "FAQ added successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to add FAQ.",
        variant: "destructive"
      });
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<FaqFormData> }) => {
      return apiRequest("PUT", `/api/faqs/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", managingFaqsForPage?.id, "faqs"] });
      toast({ title: "Success", description: "FAQ updated successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update FAQ.",
        variant: "destructive"
      });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/faqs/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", managingFaqsForPage?.id, "faqs"] });
      toast({ title: "Success", description: "FAQ deleted successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete FAQ.",
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
      sectionsJson: {},
      metaTitle: "",
      metaDescription: "",
      status: "draft",
      faqsEnabled: false,
    },
  });



  const addSection = () => {
    setSections([...sections, { key: "", value: "" }]);
  };

  const updateSection = (index: number, field: 'key' | 'value', value: string) => {
    const newSections = [...sections];
    newSections[index][field] = value;
    setSections(newSections);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const onSubmit = (data: PageFormData) => {
    if (editingPage) {
      updatePageMutation.mutate(data);
    } else {
      createPageMutation.mutate(data);
    }
  };

  const selectedDomain = domains.find(d => d.id === selectedDomainId);

  const filteredPages = pages.filter(page => {
    const matchesSearch = page.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (page.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || page.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleEdit = (page: Page) => {
    setEditingPage(page);
    
    // Convert sectionsJson back to sections array for editing
    const sectionsData = page.sectionsJson as any;
    if (sectionsData?.sections && typeof sectionsData.sections === 'object') {
      const sectionsArray = Object.entries(sectionsData.sections).map(([key, value]) => ({
        key,
        value: value as string
      }));
      setSections(sectionsArray);
    } else {
      setSections([]);
    }
    
    form.reset({
      name: page.name,
      title: page.title || "",
      subtitle: page.subtitle || "",
      sectionsJson: page.sectionsJson || {},
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      status: page.status,
      faqsEnabled: page.faqsEnabled || false,
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

  const handleManageFaqs = (page: Page) => {
    setManagingFaqsForPage(page);
    setIsFaqDialogOpen(true);
  };

  const addFaq = () => {
    const newFaq = {
      question: "",
      answer: "",
      sortOrder: faqs.length,
      isActive: true
    };
    setFaqs([...faqs, newFaq]);
  };

  const updateFaq = (index: number, field: keyof FaqData, value: string | number | boolean) => {
    const newFaqs = [...faqs];
    newFaqs[index] = { ...newFaqs[index], [field]: value };
    setFaqs(newFaqs);
  };

  const removeFaq = (index: number) => {
    const faq = faqs[index];
    if (faq.id) {
      deleteFaqMutation.mutate(faq.id);
    }
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const saveFaqs = async () => {
    for (const faq of faqs) {
      if (faq.question && faq.answer) {
        if (faq.id) {
          await updateFaqMutation.mutateAsync({ 
            id: faq.id, 
            data: {
              question: faq.question,
              answer: faq.answer,
              sortOrder: faq.sortOrder,
              isActive: faq.isActive
            }
          });
        } else {
          await createFaqMutation.mutateAsync({
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
            isActive: faq.isActive
          });
        }
      }
    }
    setIsFaqDialogOpen(false);
    setManagingFaqsForPage(null);
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
                setSections([]);
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

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-slate-800">Page Sections</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addSection}
                      data-testid="add-section-button"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Section
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {sections.map((section, index) => (
                      <div key={index} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="flex-1">
                            <label className="text-sm font-medium text-slate-700 block mb-1">Key</label>
                            <Input
                              value={section.key}
                              onChange={(e) => updateSection(index, 'key', e.target.value)}
                              placeholder="e.g., title, hero, content"
                              className="border-2 border-slate-300"
                              data-testid={`section-key-${index}`}
                            />
                          </div>
                          <div className="flex-1">
                            <label className="text-sm font-medium text-slate-700 block mb-1">Value (HTML supported)</label>
                            <Textarea
                              value={section.value}
                              onChange={(e) => updateSection(index, 'value', e.target.value)}
                              placeholder="Enter content, HTML tags supported"
                              rows={3}
                              className="border-2 border-slate-300"
                              data-testid={`section-value-${index}`}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSection(index)}
                            data-testid={`remove-section-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {sections.length === 0 && (
                      <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-300 rounded-lg">
                        <p>No sections yet. Click "Add Section" to get started.</p>
                      </div>
                    )}
                  </div>
                </div>

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
                    <th className="text-left py-4 px-6 font-medium text-slate-700">FAQs</th>
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
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={page.faqsEnabled || false}
                              onChange={(e) => toggleFaqsMutation.mutate({
                                pageId: page.id,
                                enabled: e.target.checked
                              })}
                              className="sr-only peer"
                            />
                            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                          {page.faqsEnabled && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleManageFaqs(page)}
                              data-testid={`manage-faqs-${page.id}`}
                            >
                              <HelpCircle className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
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

      {/* FAQ Management Dialog */}
      <Dialog open={isFaqDialogOpen} onOpenChange={setIsFaqDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Manage FAQs for {managingFaqsForPage?.name}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-slate-800">Frequently Asked Questions</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFaq}
                data-testid="add-faq-button"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add FAQ
              </Button>
            </div>
            
            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-lg">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Question</label>
                      <Input
                        value={faq.question}
                        onChange={(e) => updateFaq(index, 'question', e.target.value)}
                        placeholder="Enter the frequently asked question"
                        className="border-2 border-slate-300"
                        data-testid={`faq-question-${index}`}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-700 block mb-1">Answer</label>
                      <Textarea
                        value={faq.answer}
                        onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                        placeholder="Enter the answer (HTML supported)"
                        rows={4}
                        className="border-2 border-slate-300"
                        data-testid={`faq-answer-${index}`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={faq.isActive}
                            onChange={(e) => updateFaq(index, 'isActive', e.target.checked)}
                            className="rounded"
                          />
                          <span className="text-sm text-slate-700">Active</span>
                        </label>
                        <div className="flex items-center space-x-2">
                          <label className="text-sm text-slate-700">Sort Order:</label>
                          <Input
                            type="number"
                            value={faq.sortOrder}
                            onChange={(e) => updateFaq(index, 'sortOrder', parseInt(e.target.value) || 0)}
                            className="w-20 border-2 border-slate-300"
                            min="0"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFaq(index)}
                        data-testid={`remove-faq-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {faqs.length === 0 && (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-300 rounded-lg">
                  <p>No FAQs yet. Click "Add FAQ" to get started.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFaqDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="button" 
                onClick={saveFaqs}
                disabled={createFaqMutation.isPending || updateFaqMutation.isPending}
              >
                Save FAQs
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
