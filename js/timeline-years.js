// This is a timeline based on the year
// I chose instead to go with one based on sequential sorted order

var svg = d3.select('#timeline-years svg'),
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = +svg.attr('width') - margin.left - margin.right,
    height = +svg.attr('height') - margin.top - margin.bottom;

var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([0, height]);

var line = d3.line()
    .x(function(d) { return x(0); })
    .y(function(d) { return y(d.year); });

var g = svg.append('g')
    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

d3.json('data/shakes-plays-chars.json', function(error, data) {
    if (error) throw error;

    x.domain([0, 0]);
    y.domain([d3.min(data, function(d) { return d.year; }) - 1, d3.max(data, function(d) { return d.year; }) + 1]);

    g.append('g')
        .attr('class', 'axis axis--y')
        .call(d3.axisLeft(y).ticks(10).tickFormat(function(d) { return d; }));

    var play = svg.selectAll('g.play')
      .data(data)
      .enter().append('g')
        .attr('class', 'play')
        .attr('transform', function(d) { return 'translate(' + margin.left + ',' + margin.top + ')'; });

    play.append('circle')
        .attr('data', function(d) { return d.year; })
        .attr('r', 5)
        .attr('cx', function(d) { return x(0) + (Math.random() * 150); })
        .attr('cy', function(d) { return y(d.year); });

    play.append('text')
        .attr('x', function(d) { return x(0) + 150;})
        .attr('y', function(d) { return y(d.year) + 5;})
        .text(function(d) {return d.title});
});
