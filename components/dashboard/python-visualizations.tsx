"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import Plot from "react-plotly.js"
import { Loader2, AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PythonVisualizationsProps {
  selectedSymptom: string
  ageRange: [number, number]
}

export default function PythonVisualizations({ selectedSymptom, ageRange }: PythonVisualizationsProps) {
  const [plots, setPlots] = useState<{
    comparativeBoxPlot: any
    scatterPlot: any
    symptomDistribution: any
    correlationHeatmap: any
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchVisualizations = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check if Python API is running
        const healthCheck = await fetch("http://localhost:8000/health").catch(() => {
          throw new Error("Cannot connect to Python API. Make sure it's running on http://localhost:8000")
        })

        const response = await fetch(
          `http://localhost:8000/api/visualizations?selected_symptom=${encodeURIComponent(
            selectedSymptom,
          )}&age_min=${ageRange[0]}&age_max=${ageRange[1]}`,
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
        }

        const data = await response.json()

        if (!data.comparativeBoxPlot || !data.scatterPlot || !data.symptomDistribution || !data.correlationHeatmap) {
          throw new Error("Missing plot data in response")
        }

        const parsedPlots = {
          comparativeBoxPlot: JSON.parse(data.comparativeBoxPlot),
          scatterPlot: JSON.parse(data.scatterPlot),
          symptomDistribution: JSON.parse(data.symptomDistribution),
          correlationHeatmap: JSON.parse(data.correlationHeatmap),
        }

        setPlots(parsedPlots)
      } catch (error) {
        console.error("Failed to fetch visualizations:", error)
        setError(error instanceof Error ? error.message : "Failed to load visualizations")
      } finally {
        setLoading(false)
      }
    }

    fetchVisualizations()
  }, [selectedSymptom, ageRange])

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error}
          <div className="mt-2 text-sm">
            Make sure:
            <ul className="list-disc pl-4">
              <li>The Python API is running on http://localhost:8000</li>
              <li>You have installed all required Python packages</li>
              <li>The dataset file exists in the correct location</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <Card key={i} className="glass card-hover-effect">
              <CardHeader>
                <CardTitle className="animate-pulse bg-muted rounded h-6 w-32" />
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="glass card-hover-effect">
              <CardHeader>
                <CardTitle className="animate-pulse bg-muted rounded h-6 w-32" />
              </CardHeader>
              <CardContent className="h-[500px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!plots) {
    return (
      <div className="rounded-lg border border-muted p-4 text-center text-muted-foreground">
        No visualization data available
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass card-hover-effect">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Risk Distribution Comparison</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Compare risk distributions for patients with and without the selected symptom</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>Analysis for {selectedSymptom}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Plot
                data={plots.comparativeBoxPlot.data}
                layout={{
                  ...plots.comparativeBoxPlot.layout,
                  autosize: true,
                  width: undefined,
                  height: undefined,
                  margin: { t: 30, r: 20, b: 30, l: 40 },
                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                config={{ responsive: true }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass card-hover-effect">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Age vs Stroke Risk</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Scatter plot showing the relationship between age and stroke risk</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <CardDescription>
              Age range: {ageRange[0]} - {ageRange[1]} years
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Plot
                data={plots.scatterPlot.data}
                layout={{
                  ...plots.scatterPlot.layout,
                  autosize: true,
                  width: undefined,
                  height: undefined,
                  margin: { t: 30, r: 20, b: 30, l: 40 },
                }}
                useResizeHandler={true}
                style={{ width: "100%", height: "100%" }}
                config={{ responsive: true }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass card-hover-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Symptom Distribution</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Distribution of symptoms across high and low risk patients</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>Percentage breakdown by risk category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[600px]">
            <Plot
              data={plots.symptomDistribution.data}
              layout={{
                ...plots.symptomDistribution.layout,
                autosize: true,
                width: undefined,
                height: undefined,
                margin: { t: 30, r: 20, b: 30, l: 200 },
              }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
              config={{ responsive: true }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass card-hover-effect">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Symptom Correlations</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Heatmap showing correlations between symptoms and stroke risk</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <CardDescription>Red indicates positive correlation, purple indicates negative correlation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[800px]">
            <Plot
              data={plots.correlationHeatmap.data}
              layout={{
                ...plots.correlationHeatmap.layout,
                autosize: true,
                width: undefined,
                height: undefined,
                margin: { t: 30, r: 20, b: 120, l: 120 },
              }}
              useResizeHandler={true}
              style={{ width: "100%", height: "100%" }}
              config={{ responsive: true }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

