import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Globe, FileText, Eye, DollarSign } from "lucide-react";
import { Domain, Page } from "@shared/schema";

interface DashboardStats {
  domains: number;
  pages: number;
  views: string;
  revenue: string;
}

interface DashboardProps {
  selectedDomainId: number | null;
}

export default function Dashboard({ selectedDomainId }: DashboardProps) {
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: domains = [] } = useQuery<Domain[]>({
    queryKey: ["/api/domains"],
  });

  const { data: recentPages = [] } = useQuery<Page[]>({
    queryKey: ["/api/domains", selectedDomainId, "pages"],
    enabled: !!selectedDomainId,
  });

  const selectedDomain = domains.find(d => d.id === selectedDomainId);

  return (
    <div className="space-y-8" data-testid="dashboard-content">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="text-primary text-xl" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Domains</p>
                <p className="text-2xl font-bold text-slate-800" data-testid="stat-domains">
                  {statsLoading ? "..." : stats?.domains || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FileText className="text-accent text-xl" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Total Pages</p>
                <p className="text-2xl font-bold text-slate-800" data-testid="stat-pages">
                  {statsLoading ? "..." : stats?.pages || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Eye className="text-yellow-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-slate-600">Monthly Views</p>
                <p className="text-2xl font-bold text-slate-800" data-testid="stat-views">
                  {statsLoading ? "..." : stats?.views || "0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-purple-600 text-xl" />
              </div>
              <div>
                <p className="text-sm text-slate-600">AdSense Revenue</p>
                <p className="text-2xl font-bold text-slate-800" data-testid="stat-revenue">
                  {statsLoading ? "..." : stats?.revenue || "$0"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Recent Pages</h3>
            <div className="space-y-3">
              {recentPages.length === 0 ? (
                <div className="text-center py-8 text-slate-500" data-testid="no-recent-pages">
                  No pages found. Create your first page to get started.
                </div>
              ) : (
                recentPages.slice(0, 5).map((page) => (
                  <div
                    key={page.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                    data-testid={`recent-page-${page.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center">
                        <FileText className="text-slate-600 text-sm" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{page.title || page.name}</p>
                        <p className="text-sm text-slate-500">{selectedDomain?.name}</p>
                      </div>
                    </div>
                    <span className="text-sm text-slate-500">
                      {new Date(page.updatedAt!).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Domain Status</h3>
            <div className="space-y-3">
              {domains.length === 0 ? (
                <div className="text-center py-8 text-slate-500" data-testid="no-domains">
                  No domains found. Add your first domain to get started.
                </div>
              ) : (
                domains.map((domain) => (
                  <div
                    key={domain.id}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors"
                    data-testid={`domain-status-${domain.id}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${domain.isActive ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      <div>
                        <p className="font-medium text-slate-800">{domain.name}</p>
                        <p className="text-sm text-slate-500">{domain.description || "No description"}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-medium ${domain.isActive ? 'text-green-600' : 'text-yellow-600'}`}>
                      {domain.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
