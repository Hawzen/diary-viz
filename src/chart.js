import React, { useRef, useEffect } from "react";
import * as d3 from "d3";

const Chart = ({ data }) => {
  const svgRef = useRef();

  useEffect(() => {
    const svg = d3.select(svgRef.current);
    const width = 300;
    const height = 150;

    svg.attr("width", width).attr("height", height);

    const xScale = d3
      .scaleBand()
      .domain(data.map((_, i) => i))
      .range([0, width])
      .padding(0.2);

    const yScale = d3
      .scaleLinear()
      .domain([0, d3.max(data)])
      .range([height, 0]);

    svg
      .selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (_, i) => xScale(i))
      .attr("y", d => yScale(d))
      .attr("width", xScale.bandwidth())
      .attr("height", d => height - yScale(d))
      .attr("fill", "steelblue");
  }, [data]);

  return <svg ref={svgRef}></svg>;
};

export default Chart;
