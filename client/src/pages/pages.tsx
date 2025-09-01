import { useState, useEffect } from "react";
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
import { insertPageSchema, Page, Domain, Faq, insertFaqSchema, Post, insertPostSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus, Edit, Copy, Trash2, FileText, HelpCircle, BookOpen } from "lucide-react";
import { z } from "zod";

const pageFormSchema = insertPageSchema;
const faqFormSchema = insertFaqSchema.omit({ pageId: true });
const postFormSchema = insertPostSchema; // Add post form schema

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

// Add PostData interface
interface PostData {
  id?: number;
  title: string;
  slug: string;
  content: string;
  publishedAt?: Date | null;
  status: "draft" | "published" | "archived";
}

type PageFormData = z.infer<typeof pageFormSchema>;
type FaqFormData = z.infer<typeof faqFormSchema>;
type PostFormData = z.infer<typeof postFormSchema>; // Add PostFormData type

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
  const [isPostDialogOpen, setIsPostDialogOpen] = useState(false); // State for post dialog
  const [managingPostsForPage, setManagingPostsForPage] = useState<Page | null>(null); // State for managing posts
  const [posts, setPosts] = useState<PostData[]>([]); // State for posts

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const { data: pages = [], isLoading } = useQuery<Page[]>({
    queryKey: ["/api/domains", selectedDomainId, "pages"],
    enabled: !!selectedDomainId,
  });

  const { data: loadedFaqs } = useQuery({ // Renamed from pageFaqs to loadedFaqs
    queryKey: ["/api/pages", managingFaqsForPage?.id, "faqs"],
    queryFn: () => apiRequest("GET", `/api/pages/${managingFaqsForPage?.id}/faqs`),
    enabled: !!managingFaqsForPage?.id,
  });

  useEffect(() => {
    if (loadedFaqs && Array.isArray(loadedFaqs)) { // Use loadedFaqs
      setFaqs(loadedFaqs.map((faq: any) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
        isActive: faq.isActive
      })));
    } else {
      setFaqs([]);
    }
  }, [loadedFaqs, managingFaqsForPage]); // Use loadedFaqs

  // Mutation for creating a page
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

  // Mutation for updating a page
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

  // Mutation for toggling FAQs for a page
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

  // Mutation for creating a FAQ
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

  // Mutation for updating a FAQ
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

  // Mutation for deleting a FAQ
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

  // Mutation for deleting a page
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

  // Mutation for creating a post
  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      // Ensure `managingPostsForPage` is not null before proceeding
      if (!managingPostsForPage || managingPostsForPage.id === undefined) {
        throw new Error("Page ID is not available for creating post.");
      }
      return apiRequest("POST", `/api/pages/${managingPostsForPage.id}/posts`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", managingPostsForPage?.id, "posts"] });
      toast({ title: "Success", description: "Post created successfully!" });
      setIsPostDialogOpen(false);
      setPosts([]); // Clear current posts to refetch
      setEditingPost(null); // Clear editing state
      postForm.reset(initialPostFormState); // Reset form
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to create post. Please try again.",
        variant: "destructive"
      });
    },
  });

  // Mutation for updating a post
  const updatePostMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<PostFormData> }) => {
      return apiRequest("PUT", `/api/posts/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", managingPostsForPage?.id, "posts"] });
      toast({ title: "Success", description: "Post updated successfully!" });
      setIsPostDialogOpen(false);
      setEditingPost(null); // Clear editing state
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update post. Please try again.",
        variant: "destructive"
      });
    },
  });

  // Mutation for deleting a post
  const deletePostMutation = useMutation({
    mutationFn: async (postId: number) => {
      return apiRequest("DELETE", `/api/posts/${postId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pages", managingPostsForPage?.id, "posts"] });
      toast({ title: "Success", description: "Post deleted successfully!" });
      setPosts(prevPosts => prevPosts.filter(post => post.id !== postId)); // Remove from state immediately
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to delete post. Please try again.",
        variant: "destructive"
      });
    },
  });

  // Fetch posts for the current page
  const { data: loadedPosts, isLoading: isLoadingPosts } = useQuery<PostData[]>({
    queryKey: ["/api/pages", managingPostsForPage?.id, "posts"],
    queryFn: () => apiRequest("GET", `/api/pages/${managingPostsForPage?.id}/posts`),
    enabled: !!managingPostsForPage?.id,
  });

  // Effect to set posts state when data is loaded
  useEffect(() => {
    if (loadedPosts && Array.isArray(loadedPosts)) {
      setPosts(loadedPosts.map((post: any) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
        status: post.status,
      })));
    } else {
      setPosts([]);
    }
  }, [loadedPosts, managingPostsForPage]);

  // Dummy data for FAQs (example)
  const dummyFaqs: FaqData[] = [
    { id: 1, question: "What is this service?", answer: "This service helps you manage your website pages and content.", sortOrder: 0, isActive: true },
    { id: 2, question: "How do I create a new page?", answer: "Click the 'Add New Page' button and fill out the form.", sortOrder: 1, isActive: true },
    { id: 3, question: "Can I add FAQs?", answer: "Yes, you can manage FAQs for each page individually.", sortOrder: 2, isActive: false },
  ];

  // Dummy data for Posts (example)
  const dummyPosts: PostData[] = [
    { id: 1, title: "Getting Started with Your Website", slug: "getting-started-website", content: "Welcome to your new website! This post covers the basics.", publishedAt: new Date(), status: "published" },
    { id: 2, title: "Understanding Page Slugs", slug: "understanding-page-slugs", content: "Learn how slugs work and why they are important for SEO.", publishedAt: new Date(), status: "published" },
    { id: 3, title: "Advanced Content Management", slug: "advanced-content-management", content: "Explore advanced features for managing your content.", publishedAt: null, status: "draft" },
  ];

  const pageForm = useForm<PageFormData>({
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

  const postForm = useForm<PostFormData>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      status: "draft",
      publishedAt: null,
    },
  });

  const initialPostFormState = { // To reset post form
    title: "",
    slug: "",
    content: "",
    status: "draft",
    publishedAt: null,
  };

  const [editingPost, setEditingPost] = useState<PostData | null>(null);

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

  const onSubmitPage = (data: PageFormData) => {
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

  const handleEditPage = (page: Page) => { // Renamed from handleEdit
    setEditingPage(page);

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

    pageForm.reset({
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

  const handleDuplicatePage = (page: Page) => { // Renamed from handleDuplicate
    pageForm.reset({
      name: `${page.name}-copy`,
      title: page.title || "",
      subtitle: page.subtitle || "",
      sectionsJson: JSON.stringify(page.sectionsJson || {}, null, 2),
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      status: "draft",
      faqsEnabled: page.faqsEnabled || false,
    });
    setEditingPage(null);
    setIsEditorOpen(true);
  };

  const handleManageFaqs = (page: Page) => {
    setManagingFaqsForPage(page);
    // Load dummy FAQs if no FAQs are loaded for this page yet
    if (!loadedFaqs || loadedFaqs.length === 0) {
      setFaqs(dummyFaqs);
    } else {
      setFaqs(loadedFaqs.map((faq: any) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        sortOrder: faq.sortOrder,
        isActive: faq.isActive
      })));
    }
    setIsFaqDialogOpen(true);
  };

  const addFaq = () => {
    const newFaq: FaqData = {
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

  // Handler for opening the post dialog
  const handleManagePosts = (page: Page) => {
    setManagingPostsForPage(page);
    // Load dummy posts if no posts are loaded for this page yet
    if (!loadedPosts || loadedPosts.length === 0) {
      setPosts(dummyPosts);
    } else {
      setPosts(loadedPosts.map((post: any) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        content: post.content,
        publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
        status: post.status,
      })));
    }
    setIsPostDialogOpen(true);
  };

  // Handler for adding a new post
  const addPost = () => {
    const newPost: PostData = {
      title: "",
      slug: "",
      content: "",
      status: "draft",
      publishedAt: null,
    };
    setPosts([...posts, newPost]);
    setEditingPost(newPost); // Set the new post as editing
    postForm.reset({ ...newPost }); // Reset the form with new post data
  };

  // Handler for updating a post in the state
  const updatePost = (index: number, field: keyof PostData, value: string | number | Date | null) => {
    const newPosts = [...posts];
    newPosts[index] = { ...newPosts[index], [field]: value };
    setPosts(newPosts);
  };

  // Handler for removing a post
  const removePost = (index: number) => {
    const post = posts[index];
    if (post.id) {
      deletePostMutation.mutate(post.id);
    }
    setPosts(posts.filter((_, i) => i !== index));
  };

  // Handler for saving all posts
  const savePosts = async () => {
    for (const post of posts) {
      if (post.title && post.slug && post.content) {
        if (post.id) {
          await updatePostMutation.mutateAsync({
            id: post.id,
            data: {
              title: post.title,
              slug: post.slug,
              content: post.content,
              status: post.status,
              publishedAt: post.publishedAt,
            },
          });
        } else {
          await createPostMutation.mutateAsync({
            title: post.title,
            slug: post.slug,
            content: post.content,
            status: post.status,
            publishedAt: post.publishedAt,
          });
        }
      }
    }
    setIsPostDialogOpen(false);
    setManagingPostsForPage(null);
    setEditingPost(null); // Clear editing post state
  };

  // Handler for form submission for new/edited posts
  const onSubmitPost = (data: PostFormData) => {
    if (editingPost && editingPost.id !== undefined) { // Check if editing an existing post
      updatePostMutation.mutate({ id: editingPost.id, data });
    } else {
      createPostMutation.mutate(data);
    }
    // After submission, close the dialog if successful, or handle error
    // For now, let's assume we need to reset the editing state after submission
    setEditingPost(null);
    postForm.reset(initialPostFormState); // Reset form after submit
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
      <div className="flex flex-col sm:flex-col justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-xl font-semibold text-slate-800">Pages Management</h3>
          <p className="text-slate-600">
            Manage content pages for <span className="font-medium">{selectedDomain?.name}</span>
          </p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setEditingPage(null);
                  setSections([]);
                  pageForm.reset();
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
              <Form {...pageForm}>
                <form onSubmit={pageForm.handleSubmit(onSubmitPage)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={pageForm.control}
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
                      control={pageForm.control}
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
                    control={pageForm.control}
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
                      control={pageForm.control}
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
                      control={pageForm.control}
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
                    control={pageForm.control}
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

          {/* Button to open Post Management Dialog */}
          <Dialog open={isPostDialogOpen} onOpenChange={setIsPostDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => {
                  setManagingPostsForPage(selectedDomain); // Assuming posts are managed at domain level for now, or could be page specific
                  setPosts([]); // Clear existing posts when opening dialog for new page
                  setEditingPost(null); // Reset editing post
                  postForm.reset(initialPostFormState); // Reset post form
                }}
                data-testid="manage-posts-button"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Manage Posts
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Manage Posts for {managingPostsForPage?.name || "Selected Domain"}
                </DialogTitle>
              </DialogHeader>

              <Form {...postForm}>
                <form onSubmit={postForm.handleSubmit(onSubmitPost)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={postForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Post Title</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter post title" 
                              {...field} 
                              data-testid="post-title-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={postForm.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="e.g., my-first-post" 
                              {...field} 
                              data-testid="post-slug-input"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={postForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Content (HTML supported)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter post content" 
                            rows={6} 
                            {...field} 
                            data-testid="post-content-textarea"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={postForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="post-status-select">
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
                    <FormField
                      control={postForm.control}
                      name="publishedAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Published Date</FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              placeholder="Select publish date"
                              onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : null)}
                              value={field.value ? new Date(field.value).toISOString().slice(0, 16) : ""}
                              data-testid="post-publishedAt-input"
                              className="border-2 border-slate-300"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsPostDialogOpen(false);
                        setEditingPost(null); // Reset editing post
                        postForm.reset(initialPostFormState); // Reset form
                      }}
                      data-testid="cancel-post-button"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createPostMutation.isPending || updatePostMutation.isPending}
                      data-testid="save-post-button"
                    >
                      {editingPost && editingPost.id !== undefined ? "Update Post" : "Add Post"}
                    </Button>
                  </div>
                </form>
              </Form>

              {/* Display existing posts */}
              <div className="mt-8 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-slate-800">Existing Posts</h4>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPost}
                    data-testid="add-new-post-button"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add New Post
                  </Button>
                </div>

                {isLoadingPosts ? (
                  <div className="text-center py-8 text-slate-500">
                    <p>Loading posts...</p>
                  </div>
                ) : posts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-300 rounded-lg">
                    <p>No posts yet. Click "Add New Post" to get started.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {posts.map((post, index) => (
                      <div key={index} className="p-4 bg-slate-50 border-2 border-slate-200 rounded-lg flex justify-between items-center">
                        <div>
                          <p className="font-medium text-slate-800">{post.title}</p>
                          <p className="text-sm text-slate-600">Slug: {post.slug} | Status: {post.status}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingPost(post);
                              postForm.reset({
                                title: post.title,
                                slug: post.slug,
                                content: post.content,
                                status: post.status,
                                publishedAt: post.publishedAt,
                              });
                            }}
                            data-testid={`edit-post-${index}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePost(index)}
                            data-testid={`remove-post-${index}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
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
                    <th className="text-left py-4 px-6 font-medium text-slate-700">Posts</th> {/* Added Posts column */}
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
                      <td className="py-4 px-6"> {/* Posts count or manage button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleManagePosts(page)} // Navigate to manage posts for this page
                          data-testid={`manage-posts-${page.id}`}
                        >
                          Manage Posts ({posts.filter(p => p.id !== undefined).length}) {/* Display count */}
                        </Button>
                      </td>
                      <td className="py-4 px-6 text-slate-600">
                        {new Date(page.updatedAt!).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPage(page)}
                            data-testid={`edit-page-${page.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDuplicatePage(page)}
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