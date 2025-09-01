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

export default function DomainSettingsPage({ selectedDomainId }: DomainSettingsProps) {
  const [visibleSections, setVisibleSections] = useState<string[]>([]);
  const [menuStyle, setMenuStyle] = useState("horizontal");
  const [menuPosition, setMenuPosition] = useState("top");
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [enableBreadcrumbs, setEnableBreadcrumbs] = useState(false);
  const [footerDescription, setFooterDescription] = useState<string>("");
  const [contactInfo, setContactInfo] = useState<any>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const { data, isLoading } = useQuery<DomainSettings | null>({
    queryKey: ["/api/domains", selectedDomainId, "settings"],
    enabled: !!selectedDomainId,
    onSuccess: (data) => {
      if (data) {
        setVisibleSections(data.visibleSections as string[] || []);
        const navSettings = data.navigationSettings as any || {};
        setMenuStyle(navSettings.menuStyle || "horizontal");
        setMenuPosition(navSettings.menuPosition || "top");
        setShowSearchBar(navSettings.showSearchBar !== false);
        setEnableBreadcrumbs(navSettings.enableBreadcrumbs || false);
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
    } else {
      setVisibleSections(prev => prev.filter(id => id !== sectionId));
    }
  };

  const handleSaveSectionSettings = () => {
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
    updateSettingsMutation.mutate({
      visibleSections,
      navigationSettings: {
        menuStyle,
        menuPosition,
        showSearchBar,
        enableBreadcrumbs,
      },
      footerDescription,
      contactInfo
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
                <Checkbox
                  id={section.id}
                  checked={visibleSections.includes(section.id)}
                  onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                />
                <label htmlFor={section.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {section.name}
                </label>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Logo Text</label>
              <Input
                value={navigationSettings.logoText || ""}
                onChange={(e) => setNavigationSettings({
                  ...navigationSettings,
                  logoText: e.target.value
                })}
                placeholder="Your logo text"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Menu Items (JSON)</label>
              <Textarea
                value={JSON.stringify(navigationSettings.menuItems || [], null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setNavigationSettings({
                      ...navigationSettings,
                      menuItems: parsed
                    });
                  } catch (error) {
                    // Invalid JSON, keep current value
                  }
                }}
                placeholder='["Home", "About", "Contact"]'
                rows={4}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="showLogo"
                checked={navigationSettings.showLogo || false}
                onCheckedChange={(checked) => setNavigationSettings({
                  ...navigationSettings,
                  showLogo: checked as boolean
                })}
              />
              <label htmlFor="showLogo" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Show Logo
              </label>
            </div>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Footer Description</label>
              <Textarea
                value={footerDescription || ""}
                onChange={(e) => setFooterDescription(e.target.value)}
                placeholder="Enter your footer description text"
                rows={4}
              />
            </div>
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                value={contactInfo.email || ""}
                onChange={(e) => setContactInfo({
                  ...contactInfo,
                  email: e.target.value
                })}
                placeholder="contact@example.com"
                type="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={contactInfo.phone || ""}
                onChange={(e) => setContactInfo({
                  ...contactInfo,
                  phone: e.target.value
                })}
                placeholder="+1-555-0123"
                type="tel"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Address</label>
              <Textarea
                value={contactInfo.address || ""}
                onChange={(e) => setContactInfo({
                  ...contactInfo,
                  address: e.target.value
                })}
                placeholder="123 Street Name, City, State 12345"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Social Media (JSON)</label>
              <Textarea
                value={JSON.stringify(contactInfo.socialMedia || {}, null, 2)}
                onChange={(e) => {
                  try {
                    const parsed = JSON.parse(e.target.value);
                    setContactInfo({
                      ...contactInfo,
                      socialMedia: parsed
                    });
                  } catch (error) {
                    // Invalid JSON, keep current value
                  }
                }}
                placeholder='{"twitter": "https://twitter.com/...", "facebook": "https://facebook.com/..."}'
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Button
        onClick={handleSaveAllSettings}
        disabled={updateSettingsMutation.isPending}
        className="w-full mt-6"
        data-testid="save-all-settings"
      >
        Save All Settings
      </Button>
    </div>
  );
}