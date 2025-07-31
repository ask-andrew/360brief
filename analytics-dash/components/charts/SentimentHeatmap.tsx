import React, { useEffect, useRef } from 'react';
import {
    select,
    scaleBand,
    axisBottom,
    axisLeft,
    scaleSequential,
    interpolateRdYlGn
} from 'd3';
import type { HeatmapDataPoint } from '../../types';

interface SentimentHeatmapProps {
  data: HeatmapDataPoint[];
}

export const SentimentHeatmap: React.FC<SentimentHeatmapProps> = ({ data }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!svgRef.current || !wrapperRef.current) return;
        
        const svg = select(svgRef.current);
        
        if (!data || data.length === 0) {
            svg.html(''); // Clear SVG if no data
            return;
        }

        const { width, height: containerHeight } = wrapperRef.current.getBoundingClientRect();
        
        if (containerHeight === 0 || width === 0) return; // Don't render if not visible

        const margin = { top: 20, right: 20, bottom: 50, left: 40 }; // Adjusted bottom margin for legend
        const height = containerHeight;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        if (chartHeight <= 0) { // Not enough space to render
            svg.html('');
            return;
        };

        svg.attr('width', width)
            .attr('height', height)
            .html(''); // Clear previous render

        const chart = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);
        
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const hours = Array.from({length: 10}, (_, i) => `${i + 8}:00`); // 8am to 5pm

        const x = scaleBand<string>().range([0, chartWidth]).domain(hours).padding(0.05);
        chart.append('g')
            .style('font-size', 10)
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(axisBottom(x).tickSize(0))
            .select('.domain').remove();

        const y = scaleBand<string>().range([chartHeight, 0]).domain(days).padding(0.05);
        chart.append('g')
            .style('font-size', 12)
            .call(axisLeft(y).tickSize(0))
            .select('.domain').remove();

        const myColor = scaleSequential(interpolateRdYlGn).domain([-1, 1]);

        chart.selectAll()
            .data(data, (d: any) => `${d.day}:${d.hour}`)
            .enter()
            .append('rect')
            .attr('x', d => x(`${d.hour}:00`)!)
            .attr('y', d => y(d.day)!)
            .attr('rx', 4)
            .attr('ry', 4)
            .attr('width', x.bandwidth())
            .attr('height', y.bandwidth())
            .style('fill', d => myColor(d.value))
            .style('stroke-width', 4)
            .style('stroke', 'none')
            .style('opacity', 0.8)
            .append('title')
            .text(d => `Avg Sentiment: ${d.value.toFixed(2)}\nEmails: ${d.count}`);
        
        // Legend
        const legendGroup = svg.append('g')
          .attr('transform', `translate(${margin.left}, ${height - margin.bottom + 10})`); // Position in bottom margin

        const defs = svg.append('defs');
        const linearGradient = defs.append('linearGradient').attr('id', 'linear-gradient');
        
        linearGradient.selectAll('stop')
          .data([
              { offset: '0%', color: myColor(-1) },
              { offset: '50%', color: myColor(0) },
              { offset: '100%', color: myColor(1) }
          ])
          .enter().append('stop')
          .attr('offset', d => d.offset)
          .attr('stop-color', d => d.color);

        legendGroup.append('rect')
          .attr('x', 0)
          .attr('y', 0)
          .attr('width', chartWidth)
          .attr('height', 15)
          .style('fill', 'url(#linear-gradient)');
          
        legendGroup.append('text')
            .attr('x', 0)
            .attr('y', 30)
            .style('fill', '#94a3b8')
            .style('font-size', '12px')
            .text('Negative');
            
        legendGroup.append('text')
            .attr('x', chartWidth)
            .attr('y', 30)
            .attr('text-anchor', 'end')
            .style('fill', '#94a3b8')
            .style('font-size', '12px')
            .text('Positive');

    }, [data, wrapperRef.current?.getBoundingClientRect().width, wrapperRef.current?.getBoundingClientRect().height]);

    return (
        <div ref={wrapperRef} className="h-full w-full flex flex-col overflow-hidden">
            {data.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400">
                    No data available
                </div>
            ) : (
                <svg ref={svgRef}></svg>
            )}
        </div>
    );
};