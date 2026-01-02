'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  generateSalesReportWithInsights,
  type GenerateSalesReportWithInsightsOutput,
} from '@/ai/flows/generate-sales-report-with-insights';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const mockSalesData = `Date,Product,Category,Units Sold,Revenue
2024-05-01,Pisco Sour,Cocktails,30,S/750
2024-05-01,Ceviche,Food,20,S/900
2024-05-02,Lomo Saltado,Food,25,S/1375
2024-05-02,Cusqueña,Beers,50,S/600
2024-05-03,Pisco Sour,Cocktails,40,S/1000
2024-05-03,Ceviche,Food,15,S/675
2024-05-04,Lomo Saltado,Food,30,S/1650
2024-05-04,Cusqueña,Beers,60,S/720`;

export default function SalesReport() {
  const [reportData, setReportData] =
    useState<GenerateSalesReportWithInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setReportData(null);
    try {
      const result = await generateSalesReportWithInsights({
        salesData: mockSalesData,
      });
      setReportData(result);
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: 'Error Generating Report',
        description:
          'There was a problem generating the sales report. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          AI Sales Insights
        </CardTitle>
        <CardDescription>
          Generate a sales report and get AI-powered insights into your
          business performance.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Generating insights...</p>
          </div>
        )}

        {reportData && (
          <div className="grid gap-6">
            <div>
              <h3 className="font-semibold mb-2">Generated Report</h3>
              <div className="text-sm p-4 bg-muted rounded-lg border">
                <pre className="whitespace-pre-wrap font-sans">
                  {reportData.report}
                </pre>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">AI Insights</h3>
              <div className="text-sm p-4 bg-muted rounded-lg border">
                <pre className="whitespace-pre-wrap font-sans">
                  {reportData.insights}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleGenerateReport}
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="mr-2 h-4 w-4" />
          )}
          Generate Report & Insights
        </Button>
      </CardFooter>
    </Card>
  );
}
