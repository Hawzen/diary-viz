import "./App.css";
import React, { useEffect, useRef, FC } from "react";
import * as d3 from "d3";

// Import full_diary_revised_with_schema.json
import diaryData from "./full_diary_revised_with_schema.json";
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
  media_references:MediaReference[];
}

interface ProcessedDiaryEntry extends DiaryEntry {
  entryNumber: number;
  parsedDate: Date | null;
  formattedDate: string;
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
    const parseDate = d3.timeParse("%Y-%m-%d");

    // Create a new processed diaryEntries array with immutable transformations
    const processedData: ProcessedDiaryEntry[] = diaryEntries.map((entry, index) => ({
      ...entry,
      entryNumber: index + 1,
      parsedDate: parseDate(entry.date),
      formattedDate: d3.timeFormat("%b '%y")(parseDate(entry.date)!), // e.g., "Oct '22"
    }));

    const cellSize = 60; // Size of each cell
    const columns = 10; // Number of columns in the grid
    const width = cellSize * columns;
    const height = cellSize * Math.ceil(processedData.length / columns);

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height);

    const gridGroup = svg.append("g");

    // Bind diaryEntries
    const cells = gridGroup.selectAll(".cell")
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
    cells.append("rect")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("fill", (d) => {
        // If it's the first entry of the month, add a month label
        if (d.parsedDate?.getDate() === 1) {
          return "#efffef";
        }
        return "#e0e0e0";
      })
      .attr("stroke", "#aaa");

    // Add entry numbers
    cells.filter((d) => true)
      .append("text")
      .attr("x", cellSize / 2)
      .attr("y", cellSize / 2)
      .attr("dy", ".35em")
      .attr("text-anchor", "middle")
      .text((d) => {
        if (d.parsedDate?.getDate() === 1) {
          return d.formattedDate ;
        }
        return d.entryNumber
      })
      .style("fill", "#000")
      .style("font-size", "12px");

    return () => {
      svg.selectAll("*").remove(); // Cleanup
    };
  }, [diaryEntries]);

  return <svg ref={svgRef}></svg>;
};

export default App;
