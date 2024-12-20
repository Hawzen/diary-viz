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
  entryNumber: number;
  parsedDate: Date | null;
  year: number;
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
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const parseDate: (dateString: string) => Date | null = d3.timeParse(
      "%Y-%m-%d"
    );

    // Create a new processed diaryEntries array with immutable transformations
    const processedData: ProcessedDiaryEntry[] = diaryEntries.map(
      (entry, index) => ({
        ...entry,
        entryNumber: index + 1,
        parsedDate: parseDate(entry.date),
        year: parseDate(entry.date)!.getFullYear(),
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
    // Font
    const fontSize = cellSize / 5;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const gridGroup = svg.append("g");

    // Bind diaryEntries
    const cells = gridGroup
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

    // Add rectangles
    cells
      .append("rect")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", (d) => d3.interpolateBuGn(d.significance.score))
      .attr("stroke", (d) => d3.interpolateBuGn(d.significance.score))
      .on("mouseover", function (_, d) {
        d3.select(this).classed("selectedEntry", true);
        document.documentElement.style.setProperty('--glow-color', d3.interpolateBuGn(d.significance.score + 0.2));
      })
      .on("mouseout", function () {
        d3.select(this).classed("selectedEntry", false);
      })
      // cool transition effect
      .attr("opacity", 0)
      .transition()
      // .duration(500 + Math.random() * 1000)
      // Make the transition duration proportional to the significance score
      .duration((d) => 500 + d.significance.score * 1000)
      .attr("opacity", 1);
      

    // Add entry numbers
    cells
      .filter((d) => true)
      .append("text")
      .attr("x", cellSize / 2)
      .attr("y", cellSize / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text((d) => {
        if (d.parsedDate?.getDate() === 1) {
          // Show the month name AND the year
          return d.formattedDate;
        }
        return d.formattedDateWithDay;
      })
      .style("fill", (d) => d.significance.score > 0.6 ? "white" : "black")
      .style("font-size", fontSize + "px");

    return () => {
      svg.selectAll("*").remove(); // Cleanup
    };
  }, [diaryEntries]);

  return <svg ref={svgRef}></svg>;
};

export default App;
