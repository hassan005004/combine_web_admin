import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const { data: settings, isLoading } = useQuery<DomainSettings | null>({
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visible Sections */}
        <Card>
          <CardHeader>
            <CardTitle>Visible Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {availableSections.map((section) => {
                const Icon = section.icon;
                return (
                  <label
                    key={section.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    data-testid={`section-${section.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-slate-600" />
                      <span className="font-medium text-slate-800">{section.name}</span>
                    </div>
                    <Checkbox
                      checked={visibleSections.includes(section.id)}
                      onCheckedChange={(checked) => handleSectionToggle(section.id, checked as boolean)}
                      data-testid={`checkbox-${section.id}`}
                    />
                  </label>
                );
              })}
            </div>

            <Button
              onClick={handleSaveSectionSettings}
              disabled={updateSettingsMutation.isPending}
              className="w-full mt-6"
              data-testid="save-section-settings"
            >
              Save Section Settings
            </Button>
          </CardContent>
        </Card>

        {/* Navigation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Navigation Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Menu Style</label>
                <Select value={menuStyle} onValueChange={setMenuStyle}>
                  <SelectTrigger data-testid="menu-style-select">
                    <SelectValue placeholder="Select menu style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Menu Position</label>
                <Select value={menuPosition} onValueChange={setMenuPosition}>
                  <SelectTrigger data-testid="menu-position-select">
                    <SelectValue placeholder="Select menu position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top">Top</SelectItem>
                    <SelectItem value="side">Side</SelectItem>
                    <SelectItem value="bottom">Bottom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <Checkbox
                    checked={showSearchBar}
                    onCheckedChange={(checked) => setShowSearchBar(checked as boolean)}
                    data-testid="show-search-bar-checkbox"
                  />
                  <span className="text-slate-700">Show search bar</span>
                </label>
              </div>

              <div>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <Checkbox
                    checked={enableBreadcrumbs}
                    onCheckedChange={(checked) => setEnableBreadcrumbs(checked as boolean)}
                    data-testid="enable-breadcrumbs-checkbox"
                  />
                  <span className="text-slate-700">Enable breadcrumbs</span>
                </label>
              </div>
            </div>

            <Button
              onClick={handleSaveNavigationSettings}
              disabled={updateSettingsMutation.isPending}
              className="w-full mt-6 bg-accent hover:bg-emerald-700"
              data-testid="save-navigation-settings"
            >
              Save Navigation Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
