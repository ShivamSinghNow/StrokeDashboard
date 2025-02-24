import { Card, CardContent } from "@/components/ui/card"
import { Activity, Heart, TrendingUp, Users } from "lucide-react"

interface HighlightsProps {
  stats: {
    averageRisk: number
    highRiskCases: number
    riskFactors: number
    totalPatients: number
  }
}

export default function Highlights({ stats }: HighlightsProps) {
  const statCards = [
    {
      title: "Average Risk Score",
      value: `${stats.averageRisk.toFixed(1)}%`,
      change: "+2.3%",
      icon: Activity,
      gradient: "gradient-1",
    },
    {
      title: "High Risk Cases",
      value: stats.highRiskCases.toLocaleString(),
      change: "-5.2%",
      icon: Heart,
      gradient: "gradient-2",
    },
    {
      title: "Risk Factors Identified",
      value: stats.riskFactors.toString(),
      change: "+1",
      icon: TrendingUp,
      gradient: "gradient-3",
    },
    {
      title: "Total Patients",
      value: stats.totalPatients.toLocaleString(),
      change: "+124",
      icon: Users,
      gradient: "gradient-1",
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={stat.title} className="card-hover-effect overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <div className="flex items-baseline space-x-2">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <span className={`text-sm ${stat.change.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className={`rounded-full p-2 ${stat.gradient}`}>
                <stat.icon className="h-4 w-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

