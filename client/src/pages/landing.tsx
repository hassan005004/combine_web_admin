import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Globe, Shield, Zap } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4" data-testid="landing-page">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <Globe className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-slate-800">DomainHub</h1>
              <p className="text-xl text-slate-600">Multi-Domain Admin Panel</p>
            </div>
          </div>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Manage multiple websites from one powerful interface. Control content, settings, and SEO across all your domains with ease.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="text-center">
              <Globe className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Multi-Domain Management</CardTitle>
              <CardDescription>
                Manage unlimited domains from a single, unified dashboard
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>Dynamic Content</CardTitle>
              <CardDescription>
                Create and manage pages with flexible JSON-based content structure
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle>SEO Optimization</CardTitle>
              <CardDescription>
                Built-in SEO tools and Google Analytics integration for better visibility
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Login Card */}
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Sign in to access your admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleLogin} 
              className="w-full"
              size="lg"
              data-testid="login-button"
            >
              Sign In to Admin Panel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
