import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { insertDomainSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Plus } from "lucide-react";
import { z } from "zod";

const domainFormSchema = insertDomainSchema;
type DomainFormData = z.infer<typeof domainFormSchema>;

export function DomainCreator() {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createDomainMutation = useMutation({
    mutationFn: async (data: DomainFormData) => {
      return apiRequest("POST", "/api/domains", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/domains"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({ title: "Success", description: "Domain created successfully!" });
      setIsOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create domain. Please try again.",
        variant: "destructive"
      });
    },
  });

  const form = useForm<DomainFormData>({
    resolver: zodResolver(domainFormSchema),
    defaultValues: {
      name: "",
      title: "",
      description: "",
      isActive: true,
    },
  });

  const onSubmit = (data: DomainFormData) => {
    createDomainMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
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
              control={form.control}
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
              control={form.control}
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
                onClick={() => setIsOpen(false)}
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
  );
}