import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/health');
      const data = await response.json();
      console.log('Health check response:', data);
    } catch (error) {
      console.error('Connection test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4">
            Survey Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Create, distribute, and analyze surveys with ease
          </p>
          <Badge variant="secondary" className="mb-8">
            Powered by Express.js & React
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📊 Dashboard
              </CardTitle>
              <CardDescription>
                View analytics and survey insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track response rates, completion times, and detailed analytics for all your surveys.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📝 Survey Management
              </CardTitle>
              <CardDescription>
                Create and manage surveys
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Design custom surveys with multiple question types and distribute them to your audience.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                👥 Audience Management
              </CardTitle>
              <CardDescription>
                Manage your survey recipients
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Import, organize, and segment your audience for targeted survey campaigns.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <Button 
            onClick={testConnection} 
            disabled={isLoading}
            size="lg"
          >
            {isLoading ? "Testing..." : "Test API Connection"}
          </Button>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4">
            Click to verify the backend connection is working
          </p>
        </div>
      </div>
    </div>
  );
}