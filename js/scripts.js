(function () {

<<<<<<< HEAD
const circleRadius = 4;
const timelineOffset = 35;
const mapGenreToColor = {'Comedy': '#4CB944', 'History': '#246EB9', 'Tragedy': '#F06543'};
const genres = [{'genre': 'Comedy', 'color': '#4CB944'}, {'genre': 'History', 'color': '#246EB9'}, {'genre': 'Tragedy', 'color': '#F06543'}];

const svg = d3.select('#timeline svg'),
    legendMargin = {top: 30, right: 0, bottom: 0, left: 25},
    margin = {top: 50, right: 30, bottom: 30, left: 25},
    width = +svg.attr('width') - margin.left - margin.right,
    height = +svg.attr('height') - margin.top - margin.bottom;

const charsvg = d3.select('#characters svg'),
    charmargin = {top: 50, right: 30, bottom: 30, left: 25},
    charwidth = +charsvg.attr('width') - charmargin.left - charmargin.right,
    charheight = +charsvg.attr('height') - charmargin.top - charmargin.bottom;



const y = d3.scaleLinear().range([-1, height]);
=======
const mapGenreToColor = {'Comedy': '#4CB944', 'History': '#AF4DA4', 'Tragedy': '#F47835'};
const genres = [{'genre': 'Comedy', 'color': '#4CB944'}, {'genre': 'History', 'color': '#AF4DA4'}, {'genre': 'Tragedy', 'color': '#F47835'}];
const colorM = '#08B2E3',
  colorW = '#EC3E5B';
>>>>>>> aa1656107d8aab0a1ab32ab5c71f251a3e97c205


d3.json('data/shakes-plays-chars.json', function(error, data) {
    if (error) throw error;

    makeTimeline();

    function makeTimeline() {
      const circleRadius = 4;
      const timelineOffset = 35;

      const svg = d3.select('#timeline svg'),
          legendMargin = {top: 30, right: 0, bottom: 0, left: 25},
          margin = {top: 50, right: 30, bottom: 20, left: 25},
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

    makePlays();

    function makePlays() {
      const playPrefix = 'play-';

      const plays = d3.select('#plays'),
        svg = plays.select('svg'),
        margin = {top: 40, right: 30, bottom: 30, left: 30},
        width = +svg.attr('width'),
        height = +svg.attr('height'),
        domainwidth = width - margin.left - margin.right,
        domainheight = height - margin.top - margin.bottom;

      data.forEach(function(d) {
        d.diffSum = percentDifference(d.sumW, d.sumM);
        d.diffAvg = percentDifference(d.avgW, d.avgM);
      });

      var tooltip = plays.append('div')
        .attr('class', 'tooltip');

      var g = svg.append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      g.append('rect')
        .attr('width', width - margin.left - margin.right)
        .attr('height', height - margin.top - margin.bottom)
        .attr('fill', 'none');

      var x = d3.scaleLinear()
        .domain([-100, 100])
        .range(padExtent([0, domainwidth]));
      var y = d3.scaleLinear()
        .domain([-100, 100])
        .range(padExtent([domainheight, 0]));

      makeAxes(g);
      function makeAxes(parent) {
        makeYAxis(parent);
        makeXAxis(parent);

        function makeXAxis(parent) {
          parent.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + y(0) + ')')
            .call(d3.axisBottom(x).ticks(10).tickFormat(function(d) { return d === 0 ? '' : Math.abs(d) + '%'; }));

          parent.append('text')
            .attr('class', 'axis-label')
            .attr('transform',
                  'translate(' + x(-100) + ' ,' +
                                 y(5) + ')')
            .style('text-anchor', 'Left')
            .text('Average Word Count Difference');
        }

        function makeYAxis(parent) {
          parent.append('g')
            .attr('class', 'y axis')
            .attr('transform', 'translate(' + x(0) + ', 0)')
            .call(d3.axisRight(y).ticks(10).tickFormat(function(d) { return d === 0 ? '' : Math.abs(d) + '%'; }));

          parent.append('text')
            .attr('class', 'axis-label')
            .attr('transform',
                  'translate(' + x(0) + ' ,' +
                                 y(105) + ')')
            .style('text-anchor', 'middle')
            .text('Total Word Count Difference');
        }

        parent.selectAll('.tick text')
          .attr('fill', function(d) { return d < 0 ? colorM : colorW; });

        parent.selectAll('.tick line')
          .attr('stroke', function(d) { if (d === 0) { return 'none'; } return d < 0 ? colorM : colorW; });
      }

      g.selectAll('circle')
          .data(data)
        .enter().append('circle')
          .attr('class', 'dot')
          .attr('id', function(d) { return playPrefix + d.id; })
          .attr('diffAvg', function(d) { return d.diffAvg; })
          .attr('diffSum', function(d) { return d.diffSum; })
          .attr('r', 6)
          .attr('cx', function(d) { return x(d.diffAvg); })
          .attr('cy', function(d) { return y(d.diffSum); })
          .style('stroke', 'white')
          .style('stroke-width', '0.5px')
          .style('fill', function(d) { return mapGenreToColor[d.genre]; })
          .style('cursor', 'pointer')
          .on('mouseover', handleMouseover)
          .on('mouseout', handleMouseout);

      function handleMouseover(d) {
        d3.select('#' + playPrefix + d.id)
          .transition()
            .duration(100)
            .style('stroke', 'black')
            .style('stroke-width', '1px');

        tooltip.style('display', 'block');
        tooltip.transition()
          .duration(100)
          .style('opacity', 0.8);
        tooltip.html(tooltipText(d))
          .style('left', (d3.event.pageX - 115) + 'px')
          .style('top', (d3.event.pageY - 60) + 'px');
      }

      function handleMouseout(d) {
        d3.select('#' + playPrefix + d.id)
          .transition()
            .duration(200)
            .style('stroke', 'white')
            .style('stroke-width', '0.5px');

        tooltip.transition()
          .duration(200)
          .style('opacity', 0)
          .on('end', function() {
            tooltip.style('display', 'none');
          });
      }

      function padExtent(e, p) {
          if (p === undefined) p = 1;
          return ([e[0] - p, e[1] + p]);
      }

      function percentDifference(a, b) {
        return (a - b) / (a + b) * 100;
      }

      function tooltipText(d) {
        let text = '<span class="title">' + d.title + '</span><span class="avgVsSum">';

        text += statSummary(d.diffAvg, 'on average');
        text += '<br/>';
        text += statSummary(d.diffSum, 'total');

        text += '</span>';

        return text;
      }

      function statSummary(n, w) {
        const greaterGender = n < 0 ? 'male' : 'female';
        let text = n < 0 ? 'Males' : 'Females';
        text += ' have <span class="' + greaterGender + '">' + printPercent(n) + ' more</span> words ' + w + ' than ';
        text += n < 0 ? 'females' : 'males';
        return text;
      }

      function printPercent(a) {
        return Math.round(Math.abs(a)) + '%';
      }
    }

  //This is where I start working on the right svg
    function makechars(parent) {
	console.log("makin' charssss");
    }
    makechars(charsvg);
});

})();
