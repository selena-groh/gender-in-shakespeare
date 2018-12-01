(function () {

const itemPrefix = 'timeline-';
const playPrefix = 'play-';

const tooltip = d3.select('#plays').append('div')
  .attr('class', 'tooltip');

const legendMargin = {top: 30, right: 0, bottom: 0, left: 25};

const charsvg = d3.select('#characters svg'),
    charmargin = {top: 0, right: 0, bottom: 0, left: 25},
    charwidth = +charsvg.attr('width') - charmargin.left - charmargin.right,
    charheight = +charsvg.attr('height') - charmargin.top - charmargin.bottom;

const mapGenreToColor = {'Comedy': '#BDDD73', 'History': '#AF4DA4', 'Tragedy': '#7484C9'};
const genres = [{'genre': 'Comedy', 'color': '#BDDD73'}, {'genre': 'History', 'color': '#AF4DA4'}, {'genre': 'Tragedy', 'color': '#7484C9'}];

const colorM = '#66C4BF',
  colorW = '#DD5478';

let genreFocused = '';

let currentActivePlay = undefined;

let shouldContinueLooping = false;

d3.json('data/shakes-plays-chars.json', function(error, data) {
  if (error) throw error;

  const timeline = d3.select('#timeline'),
    plays = d3.select('#plays');

  makeTimeline(timeline);
  initPlays(plays);
  togglePlays('pcp', plays);
  initShuffle();
  initLoop();
  loadRandomPlay();

  function makeTimeline(parent) {

    const circleRadius = 4;
    const timelineOffset = 35;

    const svg = parent.select('svg'),
      margin = {top: 50, right: 30, bottom: 20, left: 25};

    svg.selectAll("*").remove();
    svg.attr('width', '235');
    svg.attr('height', parent.node().clientHeight);

    const width = svg.attr('width') - margin.left - margin.right,
      height = svg.attr('height') - margin.top - margin.bottom;

    makeLegend(svg, 'hidden-mobile');
    makeLine(svg);

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

      timeline.selectAll('.year')
        .data(data)
        .enter()
        .append('text')
          .attr('class', 'year')
          .attr('x', function(d) { return timelineOffset - 40; })
          .attr('y', function(d, i) { return y(i) + 4.5; })
          .attr('visibility', function(d, i) { return data[i-1] && data[i-1].year === d.year ? 'hidden' : 'visible'; })
          .text(function(d, i) { return d.year; });

      const item = timeline.selectAll('.item')
        .data(data)
        .enter()
        .append('g')
          .attr('class', function(d) { return 'item ' + d.genre })
          .attr('id', function(d) { return itemPrefix + d.id; })
          .on('mouseover', handleMouseover)
          .on('mouseout', handleMouseout)
          .on('click', loadPlay);

      item.append('circle')
        .attr('class', 'time-circle')
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
  }

  function makePlaysPCP(parent) {

    d3.select('.pcp')
      .style('color', 'black');

    const svg = parent.select('svg'),
      margin = {top: 10, right: 20, bottom: 30, left: 20};

    svg.selectAll("*").remove();

    let side = parent.node().clientWidth < parent.node().clientHeight ? parent.node().clientWidth : parent.node().clientHeight;
    side -= 3;
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

    var y = d3.scaleLinear()
      .domain([-100, 100])
      .range(padExtent([domainheight, 0]));

    const totalAxisX = domainwidth * 0.25,
      aveAxisX = domainwidth * 0.75;

    makeLegend(g, '', domainwidth * 0.5, height - 25, 'center');
    makeAxes(g, totalAxisX, aveAxisX);

    function makeAxes(parent, a1X, a2X) {
      makeTotalAxis(parent, a1X);
      makeAverageAxis(parent, a2X);

      function makeTotalAxis(parent, x) {
        parent.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + x + ', 0)')
          .call(d3.axisLeft(y).ticks(10).tickFormat(function(d) { return d === 0 ? '' : Math.abs(d) + '%'; }));

        parent.append('text')
          .attr('class', 'axis-label')
          .attr('transform',
                'translate(' + (x - 75) + ' ,' + y(1) + ')')
          .style('text-anchor', 'middle')
          .text('Difference in');

        parent.append('text')
          .attr('class', 'axis-label')
          .attr('transform',
                'translate(' + (x - 75) + ' ,' + y(-4) + ')')
          .style('text-anchor', 'middle')
          .text('Total Words for All Roles');

        parent.append('text')
          .attr('class', 'axis-direction female')
          .attr('transform',
                'translate(' + (x - 75) + ' ,' + (y(60) - 10) + ')')
          .style('text-anchor', 'middle')
          .text('\u2B06');

        parent.append('text')
          .attr('class', 'axis-direction female')
          .attr('transform',
                'translate(' + (x - 75) + ' ,' + (y(60) + 10) + ')')
          .style('text-anchor', 'middle')
          .text('more female');

        parent.append('text')
          .attr('class', 'axis-direction male')
          .attr('transform',
                'translate(' + (x - 75) + ' ,' + (y(-60) - 10) + ')')
          .style('text-anchor', 'middle')
          .text('more male');

        parent.append('text')
          .attr('class', 'axis-direction male')
          .attr('transform',
                'translate(' + (x - 75) + ' ,' + (y(-60) + 10) + ')')
          .style('text-anchor', 'middle')
          .text('\u2B07');
      }

      function makeAverageAxis(parent, x) {
        parent.append('g')
          .attr('class', 'y axis')
          .attr('transform', 'translate(' + x + ', 0)')
          .call(d3.axisRight(y).ticks(10).tickFormat(function(d) { return d === 0 ? '' : Math.abs(d) + '%'; }));

        parent.append('text')
          .attr('class', 'axis-label')
          .attr('transform',
                'translate(' + (x + 75) + ' ,' + y(1) + ')')
          .style('text-anchor', 'middle')
          .text('Difference in');

        parent.append('text')
          .attr('class', 'axis-label')
          .attr('transform',
                'translate(' + (x + 75) + ' ,' + y(-4) + ')')
          .style('text-anchor', 'middle')
          .text('Average Words per Role');

        parent.append('text')
          .attr('class', 'axis-direction female')
          .attr('transform',
                'translate(' + (x + 75) + ' ,' + (y(60) - 10) + ')')
          .style('text-anchor', 'middle')
          .text('\u2B06');

        parent.append('text')
          .attr('class', 'axis-direction female')
          .attr('transform',
                'translate(' + (x + 75) + ' ,' + (y(60) + 10) + ')')
          .style('text-anchor', 'middle')
          .text('more female');

        parent.append('text')
          .attr('class', 'axis-direction male')
          .attr('transform',
                'translate(' + (x + 75) + ' ,' + (y(-60) - 10) + ')')
          .style('text-anchor', 'middle')
          .text('more male');

        parent.append('text')
          .attr('class', 'axis-direction male')
          .attr('transform',
                'translate(' + (x + 75) + ' ,' + (y(-60) + 10) + ')')
          .style('text-anchor', 'middle')
          .text('\u2B07');
      }

      parent.selectAll('.tick text')
        .attr('fill', colorValue);

      parent.selectAll('.tick line')
        .attr('stroke', colorValue);

      function colorValue(d) {
        if (d === 0) { return '#999'; }
        return d < 0 ? colorM : colorW;
      };
    }

    g.selectAll('line.data-line')
      .data(data)
      .enter().append('line')
        .attr('class', function(d) { return 'data-line ' + d.genre })
        .attr('id', function(d) { return playPrefix + d.id + '-line'; })
        .attr('diffAvg', function(d) { return d.diffAvg; })
        .attr('diffSum', function(d) { return d.diffSum; })
        .attr('x1', function(d) { return totalAxisX; })
        .attr('x2', function(d) { return aveAxisX; })
        .attr('y1', function(d) { return y(d.diffSum); })
        .attr('y2', function(d) { return y(d.diffAvg); })
        .style('stroke', function(d) { return mapGenreToColor[d.genre]; })
        .style('stroke-width', '2.5px')
        .style('cursor', 'pointer')
        .on('mouseover', handleMouseover)
        .on('mouseout', handleMouseout)
        .on('click', loadPlay);

    g.selectAll('circle.total')
      .data(data)
      .enter().append('circle')
        .attr('class', function(d) { return 'dot total ' + d.genre })
        .attr('id', function(d) { return playPrefix + d.id; })
        .attr('diffAvg', function(d) { return d.diffAvg; })
        .attr('diffSum', function(d) { return d.diffSum; })
        .attr('r', side / 150)
        .attr('cx', function(d) { return totalAxisX; })
        .attr('cy', function(d) { return y(d.diffSum); })
        .style('stroke', 'white')
        .style('stroke-width', '0.5px')
        .style('fill', function(d) { return mapGenreToColor[d.genre]; })
        .style('cursor', 'pointer')
        .on('mouseover', handleMouseover)
        .on('mouseout', handleMouseout)
        .on('click', loadPlay);

    g.selectAll('circle.average')
      .data(data)
      .enter().append('circle')
        .attr('class', function(d) { return 'dot average ' + d.genre })
        .attr('id', function(d) { return playPrefix + d.id + '-ave'; })
        .attr('diffAvg', function(d) { return d.diffAvg; })
        .attr('diffSum', function(d) { return d.diffSum; })
        .attr('r', side / 150)
        .attr('cx', function(d) { return aveAxisX; })
        .attr('cy', function(d) { return y(d.diffAvg); })
        .style('stroke', 'white')
        .style('stroke-width', '0.5px')
        .style('fill', function(d) { return mapGenreToColor[d.genre]; })
        .style('cursor', 'pointer')
        .on('mouseover', handleMouseover)
        .on('mouseout', handleMouseout)
        .on('click', loadPlay);

    function padExtent(e, p) {
        if (p === undefined) p = 1;
        return ([e[0] - p, e[1] + p]);
    }

    function percentDifference(a, b) {
      return (a - b) / (a + b) * 100;
    }
  }

  function makePlaysQuad(parent) {

    d3.select('.quadrant')
      .style('color', 'black');

    const svg = parent.select('svg'),
      margin = {top: 40, right: 20, bottom: 50, left: 20};

    svg.selectAll("*").remove();

    let side = parent.node().clientWidth < parent.node().clientHeight ? parent.node().clientWidth : parent.node().clientHeight;
    side -= 3;
    parent.attr('width', side);
    parent.attr('height', side);
    parent.classed('noflex', true);
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

    makeLegend(g, '', x(0), height - 55, 'center');
    makeAxes(g);

    function makeAxes(parent) {
      makeYAxis(parent);
      makeXAxis(parent);
      makeQuadrantLabels(parent);

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
          .text('Difference in Average Words per Role');

        parent.append('text')
          .attr('class', 'axis-direction male')
          .attr('transform',
                'translate(' + x(-100) + ' ,' + (y(0) + 35) + ')')
          .style('text-anchor', 'start')
          .text('\u27F5 more words per male role');

        parent.append('text')
          .attr('class', 'axis-direction female')
          .attr('transform',
                'translate(' + x(100) + ' ,' + (y(0) + 35) + ')')
          .style('text-anchor', 'end')
          .text('more words per female role \u27F6');
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
          .text('Difference in Total Words Overall');

        parent.append('text')
          .attr('class', 'axis-direction female')
          .attr('transform',
                'translate(' + x(-5) + ' ,' + y(100) + ') rotate(-90)')
          .style('text-anchor', 'end')
          .text('more female words total \u27F6');

        parent.append('text')
          .attr('class', 'axis-direction male')
          .attr('transform',
                'translate(' + x(-5) + ' ,' + y(-100) + ') rotate(-90)')
          .style('text-anchor', 'start')
          .text('\u27F5 more male words total');
      }

      function makeQuadrantLabels(parent) {
        parent.append('text')
          .attr('class', 'axis-direction')
          .attr('transform',
                'translate(' + x(-60) + ' ,' + y(-45) + ')')
          .style('text-anchor', 'middle')
          .text('Males have');

        parent.append('text')
          .attr('class', 'axis-direction')
          .attr('transform',
                'translate(' + x(-60) + ' ,' + y(-50) + ')')
          .style('text-anchor', 'middle')
          .text('more words total and');

        parent.append('text')
          .attr('class', 'axis-direction')
          .attr('transform',
                'translate(' + x(-60) + ' ,' + y(-55) + ')')
          .style('text-anchor', 'middle')
          .text('more words per role');

        parent.append('text')
          .attr('class', 'axis-direction')
          .attr('transform',
                'translate(' + x(60) + ' ,' + y(55) + ')')
          .style('text-anchor', 'middle')
          .text('Females have');

        parent.append('text')
          .attr('class', 'axis-direction')
          .attr('transform',
                'translate(' + x(60) + ' ,' + y(50) + ')')
          .style('text-anchor', 'middle')
          .text('more words total and');

        parent.append('text')
          .attr('class', 'axis-direction')
          .attr('transform',
                'translate(' + x(60) + ' ,' + y(45) + ')')
          .style('text-anchor', 'middle')
          .text('more words per role');
      }

      parent.selectAll('.tick text')
        .attr('fill', function(d) { return d < 0 ? colorM : colorW; });

      parent.selectAll('.tick line')
        .attr('stroke', function(d) { if (d === 0) { return 'none'; } return d < 0 ? colorM : colorW; });
    }

    g.selectAll('circle.dot')
      .data(data)
      .enter().append('circle')
        .attr('class', function(d) { return 'dot ' + d.genre })
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
        .on('click', loadPlay);

    function padExtent(e, p) {
        if (p === undefined) p = 1;
        return ([e[0] - p, e[1] + p]);
    }

    function percentDifference(a, b) {
      return (a - b) / (a + b) * 100;
    }
  }

  function makeChars(parent) {

    parent.selectAll("*").remove();

    if (currentActivePlay === undefined) { return; }

    var myplay = data.find(x => x.id === currentActivePlay.id);

    var charset = myplay.characters;
    charset = charset.sort(function (a, b) {
      return d3.descending(a.wc, b.wc);
    });

    var numchars = myplay.characters.length;

    var gap = 0;

    var barChart = charsvg.append("g")
      .attr("transform", "translate(0, 0)");

    let yScaler = d3.scaleBand()
      .rangeRound([0, charheight])
      .padding(gap)
      .domain(charset.map(function(d) { return d.who; }));

    var y_axis = barChart.append("g")
      .attr('class', 'char-axis-y')
      .call(d3.axisLeft(yScaler).tickSize(0))

    let currMaxTextLength = 0;
    y_axis.selectAll('.tick > text')
      .each(function (d) {
        const textLength = this.getComputedTextLength();
        if (textLength > currMaxTextLength) {
          currMaxTextLength = textLength;
        }
      });

    let maxBarWidth = charwidth - Math.ceil(currMaxTextLength + 10);

    barChart.attr("transform", "translate(" + Math.ceil(currMaxTextLength + 10) + ", 0)");

    // delete y-axis -- it is only added for measurement purposes
    barChart.select('g.char-axis-y').remove();

    let xScaler = d3.scaleLinear()
      // minimum is 4 to prevent bars from disappearing entirely
      .rangeRound([4, maxBarWidth])
      .domain([0, d3.max(charset.map(function(d) { return d.wc; }))]);

    var bar = barChart.selectAll("g.bar-group")
      .data(charset)
      .enter()
      .append("g")
        .attr("class", "bar-group")
        .on("mouseover", handleMouseover)
        .on("mouseout", handleMouseout);

    bar.append("rect")
      .attr("transform", function(d) { return "translate(" + (-Math.ceil(currMaxTextLength + 10)) + ", " + yScaler(d.who) + ")"; })
      .attr("height", yScaler.bandwidth())
      .attr("width", charwidth)
      .attr("fill", "white");

    bar.append("rect")
      .attr("class", "databar")
      .attr("y", function(d) { return yScaler(d.who); })
      .attr("height", yScaler.bandwidth())
      .attr("fill", function(d) { return d.gender == 'male' ? colorM : colorW; })
      .attr("stroke", "white")
      .attr("stroke-width", "1")
      .attr("end-width", function(d) { return xScaler(+d.wc); })
      .transition()
        .duration(500)
        .attr("width", function(d) { return xScaler(+d.wc); });

    var fontsize = Math.min(yScaler.bandwidth() * 0.85, 16);

    bar.append("text")
      .attr("class", "nums")
      .attr("y", function(d) { return yScaler(d.who) + (.5 * yScaler.bandwidth()); })
      .style("font-size", fontsize)
      .style("alignment-baseline", "central")
      .text(function(d) { return numWithCommas(d.wc); })
      .style("fill", function(d) {
        var rlength = d3.selectAll("rect.databar")
          .filter(function(n) { return n === d; })
          .attr("end-width");
        var textlength = this.getComputedTextLength();

        // if ((textlength + 10) < (maxBarWidth - rlength)) {
        // to have text outside bars unless impossible

        // to have text inside bars unless impossible
        if ((textlength + 10) >= rlength) {
          return d.gender == 'male' ? colorM : colorW;
        }
        return 'white';
      })
      .style("opacity", 0)
      .transition()
        .duration(500)
        .attr("x", function(d) {
          var rlength = d3.selectAll("rect.databar")
            .filter(function(n) { return n === d; })
            .attr("end-width");
          var textlength = this.getComputedTextLength();

          // to have text inside bars unless impossible
          return (textlength + 10) >= rlength ? xScaler(+d.wc) + 5 : xScaler(+d.wc) - (textlength) - 5;

          // to have text outside bars unless impossible
          // return ((textlength + 10) < (maxBarWidth - rlength)) ? xScaler(+d.wc) + 5 : xScaler(+d.wc) - (textlength) - 5;
        });

    bar.append("text")
      .attr('class', 'databar-label')
      .style('font-size', 10)
      .attr('text-anchor', 'end')
      .attr('y', function(d) { return yScaler(d.who) + (.5 * yScaler.bandwidth()); })
      .attr('x', -3)
      .attr('dy', '0.32em')
      .text(function(d) { return d.who; })

    //THINGS TO NOTE
    // 1) hovering over the text hides the text
    // 2) character names are still getting cut off
    // 3) listing the numbers doesn't scale well when there are a lot of characters

    function handleMouseover(d) {
      barChart.selectAll("rect.databar")
        .attr("opacity", .5);

      d3.selectAll(".nums")
        .style("opacity", 0);

      d3.selectAll("rect.databar")
        .filter(function(n) { return n === d; })
        .attr("opacity", 1);

      d3.selectAll(".nums")
        .filter(function(n) { return n === d; })
        .style("opacity", 1);
    }

    function handleMouseout(d) {
      barChart.selectAll("rect.databar")
        .attr("opacity", 1);
      barChart.selectAll(".nums")
        .style("opacity", 0);
    }
  }

  function initPlays(parent) {
    d3.select('.pcp')
      .on('click', function(){ togglePlays('pcp', parent); });

    d3.select('.quadrant')
      .on('click', function(){ togglePlays('quadrant', parent); });
  }

  function togglePlays(plot, parent) {
    d3.selectAll('.play-graph-label')
      .style('color', '#999');

    if (plot === 'pcp') {
      makePlaysPCP(parent);
    } else if (plot === 'quadrant') {
      makePlaysQuad(parent);
    }

    resetGenre();
  }

  function initShuffle() {
    d3.selectAll('.shuffle')
      .style('cursor', 'pointer')
      .on('click', loadRandomPlay);
  }

  function initLoop() {
    d3.selectAll('.loop')
      .style('cursor', 'pointer')
      .on('click', function() {
        d3.select(this)
          .classed('play', function(d) { return !d3.select(this).classed('play'); });

        shouldContinueLooping = !shouldContinueLooping;

        if (shouldContinueLooping) {
          loadPlay(data[0]);
        }
        (function loop(i) {
          setTimeout(function () {
            if (shouldContinueLooping) {
              loadPlay(data[i]);
              loop((i + 1) % 38);
            }
          }, 2000);
        })(1);
      });
  }

  function loadRandomPlay() {
    const i = getRandomInt(0, data.length - 1);
    loadPlay(data[i]);
  }

  function handleMouseover(d) {
    makeActive(d);
  }

  function handleMouseout(d) {
    makeInactive(d);
  }

  function makeActive(d) {
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

    d3.selectAll(".dot.total, .dot.average")
      .style("fill", function(n) { return n === d ? mapGenreToColor[d.genre] : '#D4D8DA'; });
    d3.selectAll(".dot.average")
      .style("stroke", function (n) { return n === d ? 'black' : 'none'; })
      .style("stroke-width", function(n) { return n === d? '1px' : '0px'; });
    d3.selectAll("line.data-line")
      .style("stroke", function(n) { return n === d ? mapGenreToColor[d.genre] : '#999'; })
      .style("opacity", function(n) { return n === d ? 1 :.3});
    d3.selectAll(".time-circle")
      .style("fill", function(n) { return n === d ? mapGenreToColor[d.genre] : '#D4D8DA'; })
      .style('stroke', function(n) { return n === d ? 'black' : 'none'; })
      .style('stroke-width', function(n) { return n === d ? '1px' : '0px'; });

    const offset = getOffset(playNode.node());

    if (tooltip.style('opacity') < 0.85) {
      tooltip.transition()
        .duration(100)
        .style('opacity', 0)
        .on('end', loadTooltip);
    } else {
      loadTooltip();
    }

    function loadTooltip() {
      fadeIn(tooltip, 100, 0.85);
      tooltip.html(tooltipText(d))
        .style('left', (offset.left - 140) + 'px')
        .style('top', (offset.top - 70) + 'px');
    }
  }

  function makeInactive(d) {
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

    d3.selectAll(".dot.total, .dot.average")
      .style("fill", function(n) { return mapGenreToColor[n.genre]; });
    d3.selectAll(".dot.average").style("stroke", 'none');
    d3.selectAll("line.data-line")
      .style("opacity", 1)
      .style("stroke", function(n) { return mapGenreToColor[n.genre]; });
    d3.selectAll(".time-circle")
      .style("fill", function(n) { return mapGenreToColor[n.genre]; })
      .style('stroke', 'none');

    fadeOut(tooltip, 200);
  }

  function loadPlay(d) {
    currentActivePlay = d;
    d3.select('#instructions').remove();
    d3.select('#characters').classed('hidden', false);
    d3.select('#playTitle').html(d.title);
    d3.select('#playInfo').html(d.year + ' - ' + d.genre);
    d3.select('#playSummary').html('<strong>Summary:</strong> ' + d.summary);
    const count = countByGender(d.characters);
    d3.select('#playCharBreakdown').html(d.characters.length + ' characters (' + count.chars.male + ' male, ' + count.chars.female + ' female)');
    d3.select('#playWordsBreakdown').html(numWithCommas(count.wc.male + count.wc.female) + ' words (' + numWithCommas(count.wc.male) + ' male, ' + numWithCommas(count.wc.female) + ' female)');
    makeChars(charsvg);
  }

  function countByGender(chars) {
    let charsM = 0, charsF = 0, wcM = 0, wcF = 0;
    for (var i = 0; i < chars.length; i++) {
      if (chars[i].gender === 'male') { charsM += 1; } else { charsF += 1; }
      if (chars[i].gender === 'male') { wcM += chars[i].wc; } else { wcF += chars[i].wc; }
    }

    return {
      chars: {
        male: charsM,
        female: charsF
      },
      wc: {
        male: wcM,
        female: wcF
      }
    }
  }

  function numWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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

    // text += statSummary(d.diffAvg, 'on average');
    text += aveSummary(d.diffAvg);
    text += '<br/>';
    // text += statSummary(d.diffSum, 'a total of');
    text += totalSummary(d.diffSum);

    text += '</span>';

    return text;
  }

  function statSummary(n, w) {
    const greaterGender = n < 0 ? 'male' : 'female';
    let text = n < 0 ? 'Male' : 'Female';
    text += ' roles have ' + w + ' <span class="' + greaterGender + '">' + printPercent(n) + ' more</span> words than ';
    text += n < 0 ? 'female' : 'male';
    text += ' roles';
    return text;
  }

  function aveSummary(n) {
    const greaterGender = n < 0 ? 'male' : 'female';
    let text = 'Average of <span class="' + greaterGender + '">' + printPercent(n) + ' more</span> words per ';
    text += n < 0 ? 'male' : 'female';
    text += ' role';
    return text;
  }

  function totalSummary(n) {
    const greaterGender = n < 0 ? 'male' : 'female';
    let text = 'Total of <span class="' + greaterGender + '">' + printPercent(n) + ' more</span> words for ';
    text += n < 0 ? 'males' : 'females';
    text += ' overall';
    return text;
  }

  function printPercent(a) {
    return Math.round(Math.abs(a)) + '%';
  }

  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function fade(e, speed, attr, val) {
    e.transition()
      .duration(speed)
      .style(attr, val);
  }

  function fadeIn(e, speed, opacity) {
    e.style('display', 'block');
    e.transition()
      .duration(speed)
      .style('opacity', opacity);
  }

  function fadeOut(e, speed) {
    e.transition()
      .duration(speed)
      .style('opacity', 0)
      .on('end', function() {
        e.style('display', 'none');
      });
  }

  function makeLegend(parent, classes, x = legendMargin.left, y = legendMargin.top, alignment = 'left') {
    const legend = parent.append('g')
      .attr('class', 'legend ' + classes);

    const legendItem = legend.selectAll('g')
      .data(genres)
      .enter().append('g')
        .attr('class', 'legend-item')
        .style('cursor', 'pointer')
        .on('click', toggleGenre);

    legendItem.append('circle')
      .attr('r', 5)
      .attr('cx', function(d, i) { return i * 75; })
      .attr('cy', function(d, i) { return 0; })
      .style('cursor', 'pointer')
      .attr('fill', function(d) { return mapGenreToColor[d.genre]; });

    legendItem.append('text')
      .attr('class', function(d) { return 'legend-item-text ' + d.genre; })
      .attr('x', function(d, i) { return i * 75 + 10; })
      .attr('y', function(d) { return 5; })
      .text(function(d) { return d.genre });

    if (alignment === 'center') {
      x -= legend.node().getBoundingClientRect().width / 2;
    } else if (alignment === 'right') {
      x -= legend.node().getBoundingClientRect().width;
    }

    legend.attr('transform', 'translate(' + x + ', ' + y + ')');
  }

  function toggleGenre(d) {
    if (genreFocused === d.genre) {
      resetGenre();
    } else {
      d3.selectAll('.' + Object.keys(mapGenreToColor).join(',.'))
        .each(function(e) {
          const node = d3.select(this);

          if (node.classed('legend-item-text')) {
            if (d.genre === e.genre) {
              fade(node, 500, 'fill', 'black');
            } else {
              fade(node, 300, 'fill', '#999');
            }
          } else {
            d.genre === e.genre ? fadeIn(node, 500, 1) : fadeOut(node, 300);
          }

        });
      genreFocused = d.genre;
    }
  }

  function resetGenre() {
    d3.selectAll('.' + Object.keys(mapGenreToColor).join(',.'))
      .each(function() {
        const node = d3.select(this);
        if (node.classed('legend-item-text')) {
          fade(node, 500, 'fill', 'black');
        } else {
          fadeIn(node, 500, 1);
        }
      });
      genreFocused = '';
  }

});

})();
