(function () {

const mapGenreToColor = {'Comedy': '#4CB944', 'History': '#246EB9', 'Tragedy': '#F06543'};
const genres = [{'genre': 'Comedy', 'color': '#4CB944'}, {'genre': 'History', 'color': '#246EB9'}, {'genre': 'Tragedy', 'color': '#F06543'}];

d3.json('data/shakes-plays-chars.json', function(error, data) {
    if (error) throw error;

    function makeTimeline() {
      const circleRadius = 4;
      const timelineOffset = 35;

      const svg = d3.select('#timeline svg'),
          legendMargin = {top: 30, right: 0, bottom: 0, left: 25},
          margin = {top: 50, right: 30, bottom: 30, left: 25},
          width = +svg.attr('width') - margin.left - margin.right,
          height = +svg.attr('height') - margin.top - margin.bottom;

      function makeLegend(parent) {
        const legend = parent.append('g')
          .attr('class', 'legend')
          .attr('transform', 'translate(' + legendMargin.left + ',' + legendMargin.top + ')');

        const legendItem = legend.selectAll('g')
          .data(genres)
          .enter().append('g')
            .attr('class', 'legend-item');

        legendItem.append('circle')
            .attr('r', circleRadius + 1)
            .attr('cx', function(d, i) { return i * 90; })
            .attr('cy', function(d, i) { return 0; })
            .attr('fill', function(d) { return mapGenreToColor[d.genre]; });

        legendItem.append('text')
            .attr('x', function(d, i) { return i * 90 + 10; })
            .attr('y', function(d) { return 5; })
            .text(function(d) { return d.genre });
      }

      function makeLine(parent) {
        var itemPrefix = 'timeline-';

        // sort by year then by title
        data = data.sort(function(a,b) { return a.year === b.year ? a.title.localeCompare(b.title) : +a.year - +b.year; });

        const y = d3.scaleLinear()
          .domain([-1, data.length])
          .range([-1, height]);

        const timeline = parent.append('g')
          .attr('class', 'timeline')
          .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
          .style('cursor', 'pointer');

        timeline.append('g')
          .attr('class', 'axis axis--y')
          .attr('transform', 'translate(' + timelineOffset + ', 0)')
          .call(d3.axisLeft(y).ticks(0).tickSizeOuter(0));

        const item = timeline.selectAll('.item')
          .data(data)
          .enter().append('g')
            .attr('class', 'item')
            .attr('id', function(d) { return itemPrefix + d.id; })
            .on('mouseover', function(d) {
              const node = d3.select('#' + itemPrefix + d.id + ' .title')
                .transition()
                  .style('fill', function(d) { return mapGenreToColor[d.genre]; })
                  .duration(70);
            })
            .on('mouseout', function(d) {
              const node = d3.select('#' + itemPrefix + d.id + ' .title')
                .transition()
                  .style('fill', 'black')
                  .duration(70);
            });

        item.append('text')
            .attr('class', 'year')
            .attr('x', function(d) { return timelineOffset - 40; })
            .attr('y', function(d, i) { return y(i) + 4.5; })
            .attr('visibility', function(d, i) { return data[i-1] && data[i-1].year === d.year ? 'hidden' : 'visible'; })
            .text(function(d, i) { return d.year; });

        item.append('circle')
            .attr('data', function(d) { return d.year; })
            .attr('r', circleRadius)
            .attr('cx', function(d) { return timelineOffset; })
            .attr('cy', function(d, i) { return y(i); })
            .attr('fill', function(d) { return mapGenreToColor[d.genre]; });

        item.append('text')
            .attr('class', 'title')
            .attr('x', function(d) { return timelineOffset + 10; })
            .attr('y', function(d, i) { return y(i) + 5.5; })
            .text(function(d) { return d.title; });
      }

      makeLegend(svg);
      makeLine(svg);
    }

    makeTimeline();

    function makePlays() {
      const svg = d3.select('#plays svg'),
          margin = {top: 20, right: 20, bottom: 30, left: 50},
          width = +svg.attr('width'),
          height = +svg.attr('height'),
          domainwidth = width - margin.left - margin.right,
          domainheight = height - margin.top - margin.bottom;

      var x = d3.scaleLinear()
          .domain([-100, 100])
          .range(padExtent([0, domainwidth]));
      var y = d3.scaleLinear()
          .domain([-100, 100])
          .range(padExtent([domainheight, 0]));

      var g = svg.append("g")
          .attr("transform", "translate(" + margin.top + "," + margin.top + ")");

      g.append("rect")
          .attr("width", width - margin.left - margin.right)
          .attr("height", height - margin.top - margin.bottom)
          .attr("fill", "none");

      data.forEach(function(d) {
          d.consequence = +d.consequence;
          d.value = +d.value;
          d.deltaSum = percentDifference(d.sumW, d.sumM);
          d.deltaAvg = percentDifference(d.avgW, d.avgM);
      });

      g.append("g")
          .attr("class", "x axis")
          .attr("transform", "translate(0," + y(0) + ")")
          .call(d3.axisBottom(x).ticks(10).tickFormat(function(d) { return d === 0 ? '' : Math.abs(d) + '%'; }));

      g.append("g")
          .attr("class", "y axis")
          .attr("transform", "translate(" + x(0) + ", 0)")
          .call(d3.axisRight(y).ticks(10).tickFormat(function(d) { return d === 0 ? '' : Math.abs(d) + '%'; }));

      g.selectAll("circle")
          .data(data)
        .enter().append("circle")
          .attr("class", "dot")
          .attr('id', function(d) { return d.id; })
          .attr('deltaAvg', function(d) { return d.deltaAvg; })
          .attr('deltaSum', function(d) { return d.deltaSum; })
          .attr("r", 4)
          .attr("cx", function(d) { return x(d.deltaAvg); })
          .attr("cy", function(d) { return y(d.deltaSum); })
          .attr('fill', function(d) { return mapGenreToColor[d.genre]; });

      function padExtent(e, p) {
          if (p === undefined) p = 1;
          return ([e[0] - p, e[1] + p]);
      }

      function percentDifference(a, b) {
        return (a - b) / (a + b) * 100;
      }
    }

    makePlays();

});

})();
