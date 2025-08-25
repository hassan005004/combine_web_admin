import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { JsonEditor } from "@/components/ui/json-editor";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSeoSettingsSchema, SeoSettings, Domain } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";

const seoFormSchema = insertSeoSettingsSchema.extend({
  googleAdsenseConfig: z.string().optional(),
});

type SeoFormData = z.infer<typeof seoFormSchema>;

interface SeoSettingsProps {
  selectedDomainId: number | null;
}

export default function SeoSettingsPage({ selectedDomainId }: SeoSettingsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const { data: settings, isLoading } = useQuery<SeoSettings | null>({
    queryKey: ["/api/domains", selectedDomainId, "seo"],
    enabled: !!selectedDomainId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: SeoFormData) => {
      const payload = {
        ...data,
        googleAdsenseConfig: data.googleAdsenseConfig ? JSON.parse(data.googleAdsenseConfig) : {},
      };
      return apiRequest("PUT", `/api/domains/${selectedDomainId}/seo`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains", selectedDomainId, "seo"] });
      toast({ title: "Success", description: "SEO settings saved successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to save SEO settings. Please try again.",
        variant: "destructive"
      });
    },
  });

  const form = useForm<SeoFormData>({
    resolver: zodResolver(seoFormSchema),
    defaultValues: {
      websiteTitle: "",
      metaDescription: "",
      metaKeywords: "",
      canonicalUrl: "",
      googleAnalyticsId: "",
      googleAdsenseConfig: "{}",
      ogTitle: "",
      ogDescription: "",
      ogImageUrl: "",
      twitterCardType: "summary",
    },
  });

  // Update form when settings data is loaded
  if (settings && !form.formState.isDirty) {
    form.reset({
      websiteTitle: settings.websiteTitle || "",
      metaDescription: settings.metaDescription || "",
      metaKeywords: settings.metaKeywords || "",
      canonicalUrl: settings.canonicalUrl || "",
      googleAnalyticsId: settings.googleAnalyticsId || "",
      googleAdsenseConfig: JSON.stringify(settings.googleAdsenseConfig || {}, null, 2),
      ogTitle: settings.ogTitle || "",
      ogDescription: settings.ogDescription || "",
      ogImageUrl: settings.ogImageUrl || "",
      twitterCardType: settings.twitterCardType || "summary",
    });
  }

  const selectedDomain = domains.find(d => d.id === selectedDomainId);

  const onSubmit = (data: SeoFormData) => {
    updateSettingsMutation.mutate(data);
  };

  if (!selectedDomainId) {
    return (
      <div className="text-center py-12" data-testid="no-domain-selected">
        <p className="text-slate-500">Please select a domain to configure SEO settings.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12" data-testid="seo-loading">
        <p className="text-slate-500">Loading SEO settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="seo-settings-content">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-slate-800">SEO & Analytics Settings</h3>
        <p className="text-slate-600">
          Configure SEO and analytics settings for <span className="font-medium">{selectedDomain?.name}</span>
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* General SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>General SEO Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="websiteTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter website title" 
                          {...field} 
                          data-testid="website-title-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="canonicalUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Canonical URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://example.com" 
                          {...field} 
                          data-testid="canonical-url-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metaDescription"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Meta Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter meta description..." 
                          rows={3} 
                          {...field} 
                          data-testid="meta-description-textarea"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="metaKeywords"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Meta Keywords</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="keyword1, keyword2, keyword3" 
                          {...field} 
                          data-testid="meta-keywords-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Google Analytics & AdSense */}
          <Card>
            <CardHeader>
              <CardTitle>Google Analytics & AdSense</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="googleAnalyticsId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Analytics ID</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="G-XXXXXXXXXX" 
                        {...field} 
                        data-testid="google-analytics-input"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="googleAdsenseConfig"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google AdSense Configuration (JSON)</FormLabel>
                    <FormControl>
                      <JsonEditor
                        value={field.value || "{}"}
                        onChange={field.onChange}
                        placeholder='{"clientId": "ca-pub-...", "ads": []}'
                        rows={8}
                        data-testid="adsense-config-editor"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Social Media & Open Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Social Media & Open Graph</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="ogTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OG Title</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Open Graph title" 
                          {...field} 
                          data-testid="og-title-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ogImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OG Image URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://example.com/og-image.jpg" 
                          {...field} 
                          data-testid="og-image-input"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ogDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>OG Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Open Graph description" 
                          rows={2} 
                          {...field} 
                          data-testid="og-description-textarea"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="twitterCardType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Twitter Card Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="twitter-card-select">
                            <SelectValue placeholder="Select card type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="summary">Summary</SelectItem>
                          <SelectItem value="summary_large_image">Summary Large Image</SelectItem>
                          <SelectItem value="app">App</SelectItem>
                          <SelectItem value="player">Player</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              type="submit" 
              disabled={updateSettingsMutation.isPending}
              className="px-8"
              data-testid="save-seo-settings"
            >
              Save SEO Settings
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
