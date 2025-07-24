import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Mail, Send, Eye, Users, TrendingUp, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function CampaignsPage() {
  const [selectedSurvey, setSelectedSurvey] = useState(null);
  const [campaignName, setCampaignName] = useState("");
  const [selectedAudience, setSelectedAudience] = useState([]);
  const queryClient = useQueryClient();

  // Fetch surveys
  const { data: surveys = [] } = useQuery({
    queryKey: ["/api/surveys"],
    queryFn: () => apiRequest("/api/surveys"),
  });

  // Fetch campaigns
  const { data: campaigns = [] } = useQuery({
    queryKey: ["/api/campaigns"],
    queryFn: () => apiRequest("/api/campaigns"),
  });

  // Fetch audience members
  const { data: audienceData } = useQuery({
    queryKey: ["/api/audience"],
    queryFn: () => apiRequest("/api/audience?limit=100"),
  });

  // Send campaign mutation
  const sendCampaignMutation = useMutation({
    mutationFn: async (data) => {
      return apiRequest(`/api/surveys/${data.surveyId}/send`, {
        method: "POST",
        body: JSON.stringify({
          campaignName: data.campaignName,
          selectedAudience: data.selectedAudience,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/campaigns"] });
      setSelectedSurvey(null);
      setCampaignName("");
      setSelectedAudience([]);
    },
  });

  const handleSendCampaign = () => {
    if (!selectedSurvey || !campaignName) return;

    sendCampaignMutation.mutate({
      surveyId: selectedSurvey.id,
      campaignName,
      selectedAudience,
    });
  };

  const getStatusBadge = (status) => {
    const variants = {
      draft: "secondary",
      sending: "default",
      completed: "default",
      partially_failed: "destructive",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Campaigns</h1>
          <p className="text-muted-foreground">
            Send surveys to your audience and track engagement
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Send className="w-4 h-4 mr-2" />
              New Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Email Campaign</DialogTitle>
              <DialogDescription>
                Send a survey to your audience members via email
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="survey">Select Survey</Label>
                <select
                  id="survey"
                  className="w-full p-2 border rounded-md"
                  value={selectedSurvey?.id || ""}
                  onChange={(e) => {
                    const survey = surveys.find((s) => s.id === e.target.value);
                    setSelectedSurvey(survey);
                  }}
                >
                  <option value="">Choose a survey...</option>
                  {surveys.map((survey) => (
                    <option key={survey.id} value={survey.id}>
                      {survey.title} ({survey.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Enter campaign name..."
                />
              </div>

              <div>
                <Label>Audience Selection</Label>
                <div className="max-h-40 overflow-y-auto border rounded-md p-2">
                  {audienceData?.data?.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center space-x-2 p-1"
                    >
                      <input
                        type="checkbox"
                        id={member.id}
                        checked={selectedAudience.includes(member.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAudience([
                              ...selectedAudience,
                              member.id,
                            ]);
                          } else {
                            setSelectedAudience(
                              selectedAudience.filter((id) => id !== member.id),
                            );
                          }
                        }}
                      />
                      <label htmlFor={member.id} className="text-sm">
                        {member.firstName} {member.lastName} ({member.email})
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Selected: {selectedAudience.length} members
                </p>
              </div>

              <Button
                onClick={handleSendCampaign}
                disabled={
                  !selectedSurvey ||
                  !campaignName ||
                  selectedAudience.length === 0 ||
                  sendCampaignMutation.isPending
                }
                className="w-full"
              >
                {sendCampaignMutation.isPending
                  ? "Sending..."
                  : "Send Campaign"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaign Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Campaigns
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaigns.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Sent</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.sent_count || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Emails Opened</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.reduce((sum, c) => sum + (c.opened_count || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Open Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {campaigns.length > 0
                ? Math.round(
                    campaigns.reduce((sum, c) => {
                      const rate =
                        c.sent_count > 0
                          ? (c.opened_count / c.sent_count) * 100
                          : 0;
                      return sum + rate;
                    }, 0) / campaigns.length,
                  )
                : 0}
              %
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
          <CardDescription>
            Track your email campaign performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign Name</TableHead>
                <TableHead>Survey</TableHead>
                <TableHead>Recipients</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Opened</TableHead>
                <TableHead>Open Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const openRate =
                  campaign.sent_count > 0
                    ? Math.round(
                        (campaign.opened_count / campaign.sent_count) * 100,
                      )
                    : 0;

                return (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      {campaign.campaign_name}
                    </TableCell>
                    <TableCell>
                      {surveys.find((s) => s.id === campaign.survey_id)
                        ?.title || "Unknown Survey"}
                    </TableCell>
                    <TableCell>{campaign.recipient_count}</TableCell>
                    <TableCell>{campaign.sent_count}</TableCell>
                    <TableCell>{campaign.opened_count}</TableCell>
                    <TableCell>{openRate}%</TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      {new Date(campaign.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {campaigns.length === 0 && (
            <div className="text-center py-8">
              <Mail className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No campaigns
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first email campaign.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
