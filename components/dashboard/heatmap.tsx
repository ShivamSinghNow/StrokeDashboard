"use client"

import { useMemo } from "react"

interface HeatmapProps {
  data: Array<{
    source: string
    target: string
    value: number
  }>
}

export function Heatmap({ data }: HeatmapProps) {
  const { cells, xLabels, yLabels } = useMemo(() => {
    const uniqueLabels = Array.from(new Set(data.map((d) => d.source))).sort()

    const cells = uniqueLabels.map((source) =>
      uniqueLabels.map((target) => {
        const cell = data.find((d) => d.source === source && d.target === target)
        return cell ? cell.value : 0
      }),
    )

    return {
      cells,
      xLabels: uniqueLabels,
      yLabels: uniqueLabels,
    }
  }, [data])

  const getColor = (value: number) => {
    // Color scale from blue to red
    const hue = ((1 - value) * 240).toString(10)
    return `hsl(${hue}, 70%, 50%)`
  }

  return (
    <div className="relative w-full overflow-auto">
      <div className="min-w-[600px]">
        {" "}
        {/* Minimum width to ensure readability */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: `auto ${xLabels.map(() => "minmax(60px, 1fr)").join(" ")}`,
            gap: "1px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
            padding: "1px",
          }}
        >
          {/* Empty top-left cell */}
          <div className="sticky left-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60" />

          {/* X-axis labels */}
          {xLabels.map((label) => (
            <div
              key={label}
              className="p-2 text-xs"
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)",
                height: "120px", // Fixed height for label column
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {label}
            </div>
          ))}

          {/* Y-axis labels and cells */}
          {cells.map((row, i) => (
            <>
              <div
                key={`label-${i}`}
                className="sticky left-0 z-10 flex items-center bg-background/95 p-2 text-xs backdrop-blur supports-[backdrop-filter]:bg-background/60"
              >
                {yLabels[i]}
              </div>
              {row.map((value, j) => (
                <div
                  key={`${i}-${j}`}
                  className="aspect-square transition-colors hover:opacity-80"
                  style={{
                    backgroundColor: getColor(value),
                  }}
                  title={`${yLabels[i]} → ${xLabels[j]}: ${(value * 100).toFixed(1)}%`}
                />
              ))}
            </>
          ))}
        </div>
      </div>
    </div>
  )
}

