import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Domain } from "@shared/schema";
import { DomainCreator } from "./domain-creator";

interface DomainSelectorProps {
  selectedDomainId: number | null;
  onDomainChange: (domainId: number) => void;
}

export function DomainSelector({ selectedDomainId, onDomainChange }: DomainSelectorProps) {
  const { data: domains = [], isLoading } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  if (isLoading) {
    return (
      <div className="p-4 border-b border-slate-200">
        <label className="text-sm font-medium text-slate-700 mb-2 block">Current Domain</label>
        <div className="w-full p-3 border border-slate-300 rounded-lg bg-slate-100 animate-pulse">
          Loading domains...
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 border-b border-slate-200">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700">Current Domain</label>
        <DomainCreator />
      </div>
      <Select
        value={selectedDomainId?.toString() || ""}
        onValueChange={(value) => onDomainChange(parseInt(value))}
        data-testid="domain-selector"
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a domain" />
        </SelectTrigger>
        <SelectContent>
          {domains.map((domain) => (
            <SelectItem key={domain.id} value={domain.id.toString()}>
              {domain.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
