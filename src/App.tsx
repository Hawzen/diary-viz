import "./App.css";
import React, { useEffect, useRef, FC } from "react";
import * as d3 from "d3";

// Import full_diary_revised_with_schema.json
import diaryData from "./full_diary_revised_with_schema_and_content.json";
console.log(diaryData);

// Type Definitions
interface Sentiment {
  category: string;
  sentiment_score: number;
  emotional_rationale: string;
}

interface Emotions {
  anger: number;
  disgust: number;
  fear: number;
  happiness: number;
  sadness: number;
  surprise: number;
}

interface SelfReflection {
  reflection_score: number;
  reason: string;
}

interface Significance {
  score: number;
  level: string;
  reason: string;
}

interface SocialInteraction {
  intensity: string;
  reason: string;
}

interface Entities {
  people: string[];
  organizations: string[];
  topics_concepts: string[];
}

interface Thought {
  name: string;
  description: string;
}

interface Event {
  event_name: string;
  date_time: string;
  refers_to: string;
}

interface TrendAnalysis {
  name: string;
  description: string;
}

interface MediaReference {
  name: string;
  type: string;
  description: string;
}

interface DiaryEntry {
  date: string;
  content: string;
  character_count: number,
  year: number,
  day_of_year: number,
  week_of_year: number,
  day_of_week: string,
  day_since_start: number,
  week_since_start: number,
  sentiment: Sentiment;
  emotions: Emotions;
  entry_summary: string;
  self_reflection: SelfReflection;
  significance: Significance;
  social_interaction: SocialInteraction;
  entities: Entities;
  thoughts: Thought[];
  events: Event[];
  trend_analysis: TrendAnalysis[];
  media_references: MediaReference[];
}

interface ProcessedDiaryEntry extends DiaryEntry {
  parsedDate: Date | null;
  formattedDate: string;
  formattedDateWithDay: string;
}

interface DiaryGridProps {
  diaryEntries: DiaryEntry[];
}

const App: FC = () => {
  return (
    <div className="App">
      <DiaryGrid diaryEntries={diaryData} />
    </div>
  );
};

const DiaryGrid: FC<DiaryGridProps> = ({ diaryEntries }) => {
    // I want to render the d3 grid irrespective of react's rendering
    const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const parseDate: (dateString: string) => Date | null = d3.timeParse(
      "%Y-%m-%d"
    );

    // Create a new processed diaryEntries array with immutable transformations
    const processedData: ProcessedDiaryEntry[] = diaryEntries.map(
      (entry, index) => ({
        ...entry,
        day_since_start: index + 1,
        parsedDate: parseDate(entry.date),
        formattedDate: d3.timeFormat("%B")(parseDate(entry.date)!),
        formattedDateWithDay: d3.timeFormat("%b %d")(parseDate(entry.date)!),
      })
    );

    // // Dimensions of the grid
    const columns: number = 30;
    const cellSize: number = window.innerWidth / columns;
    const width: number = cellSize * columns;
    const height: number = cellSize * Math.ceil(processedData.length / columns);

    // // Style 
    // Font size
    const fontSize = cellSize / 5;
    // Color of the grid
    // The grid color is determined by a metric [0, 1]. Here I define a function that extracts that metric
    // I defined it here so that it can be easily changed
    const getMetric = (entry: ProcessedDiaryEntry) => (entry.sentiment.sentiment_score + 1) / 2;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const svgGroup = svg.append("g");

    // Bind diaryEntries
    const cells = svgGroup
      .selectAll(".cell")
      .data(processedData)
      .enter()
      .append("g")
      .attr("class", "cell")
      .attr("transform", (d, i) => {
        const x = (i % columns) * cellSize;
        const y = Math.floor(i / columns) * cellSize;
        return `translate(${x}, ${y})`;
      });

    // Create the entries / grid cells
    cells
      .append("rect")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", (d) => d3.interpolateRdYlGn(getMetric(d)))
      .attr("stroke", (d) => d3.interpolateRdYlGn(getMetric(d)))
      // Hover effect
      .on("mouseover", function (_, d) {
        d3.select(this).classed("selectedEntry", true);
        document.documentElement.style.setProperty('--glow-color', d3.interpolateRdYlGn(getMetric(d) + 0.2));
      })
      .on("mouseout", function () {
        d3.select(this).classed("selectedEntry", false);
      })
      // Initilization transition effect 
      .attr("opacity", 0)
      .transition()
      .duration((d) => 200 + getMetric(d) * 1500)
      .attr("opacity", 1);

    // Add entry numbers
    cells
      .append("text")
      .attr("x", cellSize / 2)
      .attr("y", cellSize / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text((d) => {
        if (d.parsedDate?.getMonth() === 0 && d.parsedDate?.getDate() === 1) {
          return d.parsedDate?.getFullYear();
        }
        if (d.parsedDate?.getDate() === 1) {
          return d.formattedDate;
        }
        return d.formattedDateWithDay;
      })
      .style("fill", (d) => getMetric(d) > 0.6 ? "white" : "black")
      .style("font-size", fontSize + "px");

    // // Zoom
    // After zooming, the grid should display details of the entry 
    const zoomed = (event: any) => {
      svgGroup
        // .transition()
        // .duration(5)
        // .ease(d3.easeLinear)
        .attr("transform", event.transform);

      const zoomLevel: number = event.transform.k;
      cells.selectAll("text").style("display", zoomLevel > 5 ? "none" : "block");
      // cells.selectAll(".details").style("display", zoomLevel > 5 ? "block" : "none");
    };
    if (svgRef.current) {
      d3.select(svgRef.current)
      .call(
        d3.zoom<SVGSVGElement, unknown>()
        
        .on("zoom", zoomed)
        .scaleExtent([0.5, 25])
      );
    }


    // // Details section
    // When zoomed in, the grid should display details of the entry
    const detailsGroup = cells
      .append("g")
      .attr("class", "details");
        
    // Add the main content text
    detailsGroup
      .append("foreignObject")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", cellSize)
      .attr("height", cellSize)
      .append("xhtml:div")
      .style("font-size", fontSize / 20 + "px")
      .style("color", "black")
      .style("background-color", "#B5DFB2")
      .style("opacity", 0.8)
      .style("padding", "2px")
      .style("margin", "2px")
      .style("box-shadow", "0 1px 2px rgba(0, 0, 0, 0.3)")
      .style("max-height", `${cellSize}px`) // Set max height to cell size
      .style("overflow", "auto") 
      .html((d) => `<pre style="white-space: pre-wrap; margin: 0;">${d.content}</pre>`);    
    
    return () => {
      svg.selectAll("*").remove(); // Cleanup
    };
    
  }, [diaryEntries]);

  return <svg ref={svgRef}></svg>;
};


export default App;
