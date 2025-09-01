import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { DomainSettings, Domain } from "@shared/schema";
import { Home, Info, ShoppingCart, Newspaper, Mail } from "lucide-react";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface DomainSettingsProps {
  selectedDomainId: number | null;
}

const availableSections = [
  { id: "homepage", name: "Homepage", icon: Home },
  { id: "about", name: "About Page", icon: Info },
  { id: "products", name: "Products", icon: ShoppingCart },
  { id: "blog", name: "Blog", icon: Newspaper },
  { id: "contact", name: "Contact", icon: Mail },
];

const domainSettingsFormSchema = z.object({
  name: z.string().min(1, "Domain name is required"),
  description: z.string().optional(),
  footerDescription: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  contactAddress: z.string().optional(),
  visibleSections: z.array(z.string()),
  menuStyle: z.enum(["horizontal", "vertical"]).default("horizontal"),
  menuPosition: z.enum(["top", "bottom", "side"]).default("top"),
  showSearchBar: z.boolean().default(true),
  enableBreadcrumbs: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export default function DomainSettingsPage({ selectedDomainId }: DomainSettingsProps) {
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const [menuStyle, setMenuStyle] = useState("horizontal");
  const [menuPosition, setMenuPosition] = useState("top");
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [enableBreadcrumbs, setEnableBreadcrumbs] = useState(false);
  const [footerDescription, setFooterDescription] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<any>({});

  const form = useForm<z.infer<typeof domainSettingsFormSchema>>({
    resolver: async (values, context, options) => {
      const result = await zodResolver(domainSettingsFormSchema)(values, context, options);
      if (result.errors.fieldErrors.visibleSections) {
        result.errors.fieldErrors.visibleSections = undefined;
      }
      if (result.errors.fieldErrors.menuStyle) {
        result.errors.fieldErrors.menuStyle = undefined;
      }
      if (result.errors.fieldErrors.menuPosition) {
        result.errors.fieldErrors.menuPosition = undefined;
      }
      if (result.errors.fieldErrors.showSearchBar) {
        result.errors.fieldErrors.showSearchBar = undefined;
      }
      if (result.errors.fieldErrors.enableBreadcrumbs) {
        result.errors.fieldErrors.enableBreadcrumbs = undefined;
      }
      return result;
    },
    defaultValues: {
      name: "",
      description: "",
      footerDescription: "",
      contactEmail: "",
      contactPhone: "",
      contactAddress: "",
      visibleSections: [],
      menuStyle: "horizontal",
      menuPosition: "top",
      showSearchBar: true,
      enableBreadcrumbs: false,
      isActive: true,
    },
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const { data: domainSettings, isLoading } = useQuery<DomainSettings | null>({
    queryKey: ["/api/domains", selectedDomainId, "settings"],
    enabled: !!selectedDomainId,
    onSuccess: (data) => {
      if (data) {
        form.reset({
          name: data.name,
          description: data.description || "",
          footerDescription: data.footerDescription || "",
          contactEmail: data.contactInfo?.email || "",
          contactPhone: data.contactInfo?.phone || "",
          contactAddress: data.contactInfo?.address || "",
          visibleSections: data.visibleSections as string[] || [],
          menuStyle: data.navigationSettings?.menuStyle || "horizontal",
          menuPosition: data.navigationSettings?.menuPosition || "top",
          showSearchBar: data.navigationSettings?.showSearchBar !== false,
          enableBreadcrumbs: data.navigationSettings?.enableBreadcrumbs || false,
          isActive: data.isActive,
        });
        setVisibleSections(data.visibleSections as string[] || []);
        setMenuStyle(data.navigationSettings?.menuStyle || "horizontal");
        setMenuPosition(data.navigationSettings?.menuPosition || "top");
        setShowSearchBar(data.navigationSettings?.showSearchBar !== false);
        setEnableBreadcrumbs(data.navigationSettings?.enableBreadcrumbs || false);
        setFooterDescription(data.footerDescription || "");
        setContactInfo(data.contactInfo || {});
      }
    },
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PUT", `/api/domains/${selectedDomainId}/settings`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", selectedDomainId, "settings"] });
      toast({ title: "Success", description: "Settings saved successfully!" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive"
      });
    },
  });

  const selectedDomain = domains.find(d => d.id === selectedDomainId);

  const handleSectionToggle = (sectionId: string, checked: boolean) => {
    if (checked) {
      setVisibleSections(prev => [...prev, sectionId]);
      form.setValue("visibleSections", [...visibleSections, sectionId]);
    } else {
      setVisibleSections(prev => prev.filter(id => id !== sectionId));
      form.setValue("visibleSections", visibleSections.filter(id => id !== sectionId));
    }
  };

  const handleSaveNavigationSettings = () => {
    updateSettingsMutation.mutate({
      visibleSections,
      navigationSettings: {
        menuStyle,
        menuPosition,
        showSearchBar,
        enableBreadcrumbs,
      },
    });
  };

  const handleSaveAllSettings = () => {
    const formData = form.getValues();
    updateSettingsMutation.mutate({
      ...formData,
      contactInfo: {
        email: formData.contactEmail,
        phone: formData.contactPhone,
        address: formData.contactAddress,
        socialMedia: JSON.parse(localStorage.getItem('socialMedia') || '{}')
      }
    });
  };


  if (!selectedDomainId) {
    return (
      <div className="text-center py-12" data-testid="no-domain-selected">
        <p className="text-slate-500">Please select a domain to configure settings.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12" data-testid="settings-loading">
        <p className="text-slate-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="domain-settings-content">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-800">Domain Settings</h3>
        <p className="text-slate-600">
          Configure which sections and features are visible for <span className="font-medium">{selectedDomain?.name}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSaveAllSettings)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Visible Sections */}
            <Card>
              <CardHeader>
                <CardTitle>Visible Sections</CardTitle>
                <CardDescription>
                  Choose which sections to display on your website
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableSections.map((section) => (
                  <div key={section.id} className="flex items-center space-x-2">
                    <FormField
                      control={form.control}
                      name="visibleSections"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Checkbox
                              id={section.id}
                              checked={field.value?.includes(section.id) || false}
                              onCheckedChange={(checked) => {
                                const value = field.value || [];
                                if (checked) {
                                  field.onChange([...value, section.id]);
                                } else {
                                  field.onChange(value.filter((item: string) => item !== section.id));
                                }
                              }}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                            {section.name}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Navigation Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Navigation Settings</CardTitle>
                <CardDescription>
                  Configure your website navigation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="menuStyle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Menu Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select menu style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="horizontal">Horizontal</SelectItem>
                          <SelectItem value="vertical">Vertical</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="menuPosition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Menu Position</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select menu position" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                          <SelectItem value="side">Side</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="showSearchBar"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Show Search Bar</FormLabel>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="enableBreadcrumbs"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal">Enable Breadcrumbs</FormLabel>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Footer Settings</CardTitle>
                <CardDescription>
                  Configure your website footer content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="footerDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Description to show in website footer"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
                <CardDescription>
                  Manage your contact details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="contact@example.com"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="123 Main St, City, State 12345"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactInfo.socialMedia" // Assuming socialMedia will be handled here
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Media (JSON)</FormLabel>
                      <FormControl>
                        <Textarea
                          value={JSON.stringify(field.value || {}, null, 2)}
                          onChange={(e) => {
                            try {
                              const parsed = JSON.parse(e.target.value);
                              field.onChange(parsed);
                              localStorage.setItem('socialMedia', e.target.value); // Store in localStorage for persistence
                            } catch (error) {
                              // Invalid JSON, keep current value or handle error
                            }
                          }}
                          placeholder='{"twitter": "https://twitter.com/...", "facebook": "https://facebook.com/..."}'
                          rows={4}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>

          <Button
            type="submit"
            disabled={updateSettingsMutation.isPending}
            className="w-full mt-6"
            data-testid="save-all-settings"
          >
            Save All Settings
          </Button>
        </form>
      </Form>
    </div>
  );
}