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

  function getBrightness(color: string) {
    // Convert color to RGB
    const rgb = d3.rgb(color);
    // Calculate perceived brightness
    return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
  }


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
      .style("fill", (d) => {
        const backgroundColor = d3.interpolateRdYlGn(getMetric(d));
        const brightness = getBrightness(backgroundColor);
        return brightness > 0.5 ? "black" : "white"; // Invert text color based on brightness
      })    
      .style("font-size", fontSize + "px");

    // // Zoom
    // After zooming, the grid should display details of the entry 
    const zoomed = (event: any) => {
      svgGroup
        .transition()
        .duration(20)
        .ease(d3.easeLinear)
        .attr("transform", event.transform);

      const zoomLevel: number = event.transform.k;
      cells.selectAll("text").style("display", zoomLevel > 5 ? "none" : "block");
      cells.selectAll(".details").style("display", zoomLevel > 5 ? "block" : "none");
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
  .attr("width", cellSize) // Adjusted width for a smaller size
  .attr("height", cellSize) // Adjusted height for a smaller size
  .append("xhtml:div")
  .style("font-size", fontSize / 10 + "px") // Reduced font size
  .style("opacity", 1)
  .style("padding", "8px") // Slightly smaller padding
  .style("margin", "2px")
  .style("box-shadow", "0 4px 8px rgba(0, 0, 0, 0.2)") // Stronger shadow
  .style("border-radius", "10px") // More rounded corners
  .style("max-width", `${cellSize / 1.2}px`) // Smaller max height
  .style("max-height", `${cellSize / 1.2}px`) // Smaller max height
  .style("overflow-y", "auto") // Scrollable content
  .style("overflow-x", "hidden")
  .style("word-wrap", "break-word") // Ensure text wraps within the container
  .html((d) => `
  <div style="font-family: 'Roboto', 'Open Sans', Arial, sans-serif; margin-bottom: 500em; width: ${cellSize / 1.4}px; height: ${cellSize / 1.3}px; word-wrap: break-word">
    <h2 style="font-size: 1.2em; margin-bottom: 0.6em; font-weight: bold">${d.formattedDateWithDay}</h2>
    ${d.entry_summary ? `<p style="font-style: italic; font-size: 1em; margin-bottom: 1.2em">${d.entry_summary}</p>` : ""}
    
    ${d.sentiment || d.self_reflection || d.significance || d.social_interaction ? `
    <div style="margin-bottom: 1.5em;">
      <h3 style="font-size: 1em; margin-bottom: 0.5em; font-weight: 600">Metrics</h3>
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9em">
        ${d.sentiment ? `<li><strong>Sentiment:</strong> ${d.sentiment.sentiment_score}</li> <li><strong>Emotional Rationale:</strong> ${d.sentiment.emotional_rationale}</li>` : ""}
        ${d.self_reflection ? `<li><strong>Self Reflection:</strong> ${d.self_reflection.reflection_score}</li> <li><strong>Reason:</strong> ${d.self_reflection.reason}</li>` : ""}
        ${d.significance ? `<li><strong>Significance:</strong> ${d.significance.score}</li> <li><strong>Level:</strong> ${d.significance.level}</li> <li><strong>Reason:</strong> ${d.significance.reason}</li>` : ""}
        ${d.social_interaction ? `<li><strong>Social Interaction:</strong> ${d.social_interaction.intensity}</li> <li><strong>Reason:</strong> ${d.social_interaction.reason}</li>` : ""}
      </ul>
    </div>` : ""}
    
    ${d.entities && (d.entities.people.length || d.entities.organizations.length || d.entities.topics_concepts.length) ? `
    <div style="margin-bottom: 1.5em;">
      <h3 style="font-size: 1em; margin-bottom: 0.5em; font-weight: 600">Entities</h3>
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9em">
        ${d.entities.people.length ? `<li><strong>People:</strong> ${d.entities.people.join(", ")}</li>` : ""}
        ${d.entities.organizations.length ? `<li><strong>Organizations:</strong> ${d.entities.organizations.join(", ")}</li>` : ""}
        ${d.entities.topics_concepts.length ? `<li><strong>Topics & Concepts:</strong> ${d.entities.topics_concepts.join(", ")}</li>` : ""}
      </ul>
    </div>` : ""}
    
    ${d.thoughts && d.thoughts.length ? `
    <div style="margin-bottom: 1.5em;">
      <h3 style="font-size: 1em; margin-bottom: 0.5em; font-weight: 600">Thoughts</h3>
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9em">
        ${d.thoughts.map(t => `<li><strong>${t.name}:</strong> ${t.description}</li>`).join("")}
      </ul>
    </div>` : ""}
    
    ${d.events && d.events.length ? `
    <div style="margin-bottom: 1.5em;">
      <h3 style="font-size: 1em; margin-bottom: 0.5em; font-weight: 600">Events</h3>
      <ul style="list-style: none; padding: 0; margin: 0; font-size: 0.9em">
        ${d.events.map(e => `<li><strong>${e.event_name}:</strong> ${e.refers_to}</li>`).join("")}
      </ul>
    </div>` : ""}
    ${d.content ? `
    <h3 style="font-size: 1em; margin-bottom: 0.5em; font-weight: 600">Content</h3>
    <pre style="font-size: 0.9em; width: ${cellSize / 1.4}px; word-wrap: break-word; white-space: pre-wrap">${d.content}</pre>` : ""}

  </div>
`);


      
    return () => {
      svg.selectAll("*").remove(); // Cleanup
    };
    
  }, [diaryEntries]);

  return <svg ref={svgRef}></svg>;
};


export default App;
