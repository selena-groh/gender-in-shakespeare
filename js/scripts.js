(function () {

const itemPrefix = 'timeline-';
const playPrefix = 'play-';

const tooltip = d3.select('#plays').append('div')
  .attr('class', 'tooltip');

const charsvg = d3.select('#characters svg'),
    charmargin = {top: 0, right: 30, bottom: 0, left: 25},
    charwidth = +charsvg.attr('width') - charmargin.left - charmargin.right,
    charheight = +charsvg.attr('height') - charmargin.top - charmargin.bottom;

const mapGenreToColor = {'Comedy': '#4CB944', 'History': '#AF4DA4', 'Tragedy': '#F47835'};
const genres = [{'genre': 'Comedy', 'color': '#4CB944'}, {'genre': 'History', 'color': '#AF4DA4'}, {'genre': 'Tragedy', 'color': '#F47835'}];
const colorM = '#08B2E3',
  colorW = '#EC3E5B';

let currentPlayId = '';

d3.json('data/shakes-plays-chars.json', function(error, data) {
  if (error) throw error;

  makeTimeline();

  function makeTimeline() {
    const circleRadius = 4;
    const timelineOffset = 35;

    const timeline = d3.select('#timeline'),
        svg = timeline.select('svg'),
        legendMargin = {top: 30, right: 0, bottom: 0, left: 25},
        margin = {top: 50, right: 30, bottom: 20, left: 25};

    svg.attr('width', '260');
    svg.attr('height', timeline.node().clientHeight);

    const width = svg.attr('width') - margin.left - margin.right,
        height = svg.attr('height') - margin.top - margin.bottom;

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
          .attr('cx', function(d, i) { return i * 75; })
          .attr('cy', function(d, i) { return 0; })
          .attr('fill', function(d) { return mapGenreToColor[d.genre]; });

      legendItem.append('text')
          .attr('x', function(d, i) { return i * 75 + 10; })
          .attr('y', function(d) { return 5; })
          .text(function(d) { return d.genre });
    }

    function makeLine(parent) {
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
          .on('mouseover', handleMouseover)
          .on('mouseout', handleMouseout)
          .on('click', handleClick);

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

    const plays = d3.select('#plays'),
      svg = plays.select('svg'),
      margin = {top: 40, right: 20, bottom: 30, left: 20};


    const side = plays.node().clientWidth < plays.node().clientHeight ? plays.node().clientWidth : plays.node().clientHeight;
    svg.attr('width', side);
    svg.attr('height', side);

    const width = +svg.attr('width'),
      height = +svg.attr('height'),
      domainwidth = width - margin.left - margin.right,
      domainheight = height - margin.top - margin.bottom;

    data.forEach(function(d) {
      d.diffSum = percentDifference(d.sumW, d.sumM);
      d.diffAvg = percentDifference(d.avgW, d.avgM);
    });

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
                'translate(' + x(-100) + ' ,' + y(5) + ')')
          .style('text-anchor', 'start')
          .text('Average Word Count Difference');

        parent.append('text')
          .attr('class', 'axis-direction male')
          .attr('transform',
                'translate(' + x(-100) + ' ,' + (y(0) + 35) + ')')
          .style('text-anchor', 'start')
          .text('\u27F5 more male');

        parent.append('text')
          .attr('class', 'axis-direction female')
          .attr('transform',
                'translate(' + x(100) + ' ,' + (y(0) + 35) + ')')
          .style('text-anchor', 'end')
          .text('more female \u27F6');
      }

      function makeYAxis(parent) {
        parent.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + x(0) + ', 0)')
          .call(d3.axisRight(y).ticks(10).tickFormat(function(d) { return d === 0 ? '' : Math.abs(d) + '%'; }));

        parent.append('text')
          .attr('class', 'axis-label')
          .attr('transform',
                'translate(' + x(0) + ' ,' + y(105) + ')')
          .style('text-anchor', 'middle')
          .text('Total Word Count Difference');

        parent.append('text')
          .attr('class', 'axis-direction female')
          .attr('transform',
                'translate(' + x(-5) + ' ,' + y(100) + ') rotate(-90)')
          .style('text-anchor', 'end')
          .text('more female \u27F6');

        parent.append('text')
          .attr('class', 'axis-direction male')
          .attr('transform',
                'translate(' + x(-5) + ' ,' + y(-100) + ') rotate(-90)')
          .style('text-anchor', 'start')
          .text('\u27F5 more male');
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
        .attr('r', side / 100)
        .attr('cx', function(d) { return x(d.diffAvg); })
        .attr('cy', function(d) { return y(d.diffSum); })
        .style('stroke', 'white')
        .style('stroke-width', '0.5px')
        .style('fill', function(d) { return mapGenreToColor[d.genre]; })
        .style('cursor', 'pointer')
        .on('mouseover', handleMouseover)
        .on('mouseout', handleMouseout)
        .on('click', handleClick);

    function padExtent(e, p) {
        if (p === undefined) p = 1;
        return ([e[0] - p, e[1] + p]);
    }

    function percentDifference(a, b) {
      return (a - b) / (a + b) * 100;
    }
  }

  function handleMouseover(d) {
    d3.selectAll('.timeline .title')
      .transition()
        .style('fill', '#999')
        .style('font-weight', '300')
        .duration(70);

    d3.select('#' + itemPrefix + d.id + ' .title')
      .transition()
        .style('fill', '#000')
        .style('font-weight', '700')
        .duration(70);

    const playNode = d3.select('#' + playPrefix + d.id);
    playNode.transition()
        .duration(100)
        .style('stroke', 'black')
        .style('stroke-width', '1px');

    const offset = getOffset(playNode.node());

    if (tooltip.style('opacity') < 0.8) {
      tooltip.transition()
        .duration(100)
        .style('opacity', 0)
        .on('end', loadTooltip);
    } else {
      loadTooltip();
    }

    function loadTooltip() {
      tooltip.style('display', 'block');
      tooltip.transition()
        .duration(100)
        .style('opacity', 0.8);
      tooltip.html(tooltipText(d))
        .style('left', (offset.left - 150) + 'px')
        .style('top', (offset.top - 70) + 'px');
    }
  }

  function handleMouseout(d) {
    d3.selectAll('.timeline .title')
      .transition()
        .style('fill', '#000')
        .style('font-weight', '300')
        .duration(70);

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

  function handleClick(d) {
    currentPlayId = d.id;
    d3.select('#instructions').remove();
    d3.select('#characters').classed('hidden', false);
    d3.select('#playTitle').html(d.title);
    d3.select('#playInfo').html(d.year + ' - ' + d.genre);
    d3.select('#playSummary').html('<strong>Summary:</strong> ' + d.summary);
    const count = countByGender(d.characters);
    d3.select('#playCharBreakdown').html(d.characters.length + ' characters (' + count.male + ' male, ' + count.female + ' female)');
    makechars(charsvg);
  }

  function countByGender(chars) {
    let m = 0, f = 0;
    for (var i = 0; i < chars.length; i++) {
      if (chars[i].gender === 'male') { m += 1; } else { f += 1; }
    }

    return { male: m, female: f }
  }

  function getOffset(element) {
      var bound = element.getBoundingClientRect();
      var html = document.documentElement;

      return {
          top: bound.top + window.pageYOffset - html.clientTop,
          left: bound.left + window.pageXOffset - html.clientLeft
      };
  }

  function tooltipText(d) {
    let text = '<span class="title">' + d.title + '</span><span class="avgVsSum">';

    text += statSummary(d.diffAvg, 'on average');
    text += '<br/>';
    text += statSummary(d.diffSum, 'a total of');

    text += '</span>';

    return text;
  }

  function statSummary(n, w) {
    const greaterGender = n < 0 ? 'male' : 'female';
    let text = n < 0 ? 'Males' : 'Females';
    text += ' have ' + w + ' <span class="' + greaterGender + '">' + printPercent(n) + ' more</span> words than ';
    text += n < 0 ? 'females' : 'males';
    return text;
  }

  function printPercent(a) {
    return Math.round(Math.abs(a)) + '%';
  }

  //This is where I start working on the right svg
  function makechars(parent) {

  parent.selectAll("*").remove();

  if (currentPlayId === '') { return; }

	var myplay = data.find(x => x.id === currentPlayId);

	var charset = myplay.characters;
	charset = charset.sort(function (a, b) {
		return d3.descending(a.wc, b.wc);
	 });

	var numchars = myplay.characters.length;

	//var barPadding = 5;
	//var barWidth = (charsvg.attr("width") / numchars);
	//console.log("the width is " + barWidth);


	var gap = 0.2;

	let yScaler = d3.scaleBand()
	        .rangeRound([0, charheight])
		.padding(gap)
		.domain(charset.map(function(d){ return d.who;
		 }));
	let xScaler = d3.scaleLinear()
		.rangeRound([0, charwidth])
		.domain([0, d3.max(charset.map(function(d){ return d.wc;
		 }))]);

        var barChart = charsvg.append("g")
                        .attr("transform", "translate(50, 0)");

	barChart.selectAll("rect")
	    .data(charset)
	    .enter()
	    .append("rect")
	    //.attr("x", function(d) {
	    //    return yScaler(d.who);
	    // })
	    .attr("y", function(d) {
	        return yScaler(d.who);
  	     })
	    .attr("height", yScaler.bandwidth())
	    .attr("width", function(d) {
	        return xScaler(+d.wc);
	     })
	    .attr("fill", function(d) {
		if (d.gender == 'male') {
		    return colorM;
 		} else {
		    return colorW;
		}
	      });

	//var x_axis = barChart.append("g")
	  //  		.attr("transform", "translate(0, " + charheight + ")")
	    //		.call(d3.axisBottom(xScaler));

	var y_axis = barChart.append("g")
			.call(d3.axisLeft(yScaler).tickSize(0));
	y_axis.select(".domain").remove();
    }
});

})();
