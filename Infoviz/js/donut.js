function donut(data) {

    var donutDiv = $("#donut");

    var margin = { top: 0, right: 0, bottom: 0, left: 0 },
        width = donutDiv.width() - margin.right - margin.left,
        height = donutDiv.height() - margin.top - margin.bottom;

    radius = Math.min(width, height * 1.2) / 3;

    var legendRectSize = 18;
    var legendSpacing = 2;

    var pie = d3.layout.pie()
        .sort(null)
        .value(function(d) {
            return !isNaN(d.year) ? d.year : 0;
        });

    var arc = d3.svg.arc()
        .outerRadius(radius - 15)
        .innerRadius(radius - 80);

    var tip = d3.tip()
        .attr('class', 'd3-tip')
        .offset([15, -10]);

    var svg = d3.select("#donut").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 3 + "," + height / 2 + ")");

    svg.call(tip);

    donutGraficsRoot = svg.append('g')

    draw(getMunData(DEFAULTREGION, DEFAULTYEAR));

    function draw(data_arr) {

        var path = donutGraficsRoot.selectAll(".arc")
            .data(pie(data_arr))
            .enter()
            .append("g")
            .attr("class", "arc")

        path.append("path")
            .style("fill", function(d, i) {
                return COLOR.get(d.data.parti);
            })
            .attr("class", "arcPath")
            .attr("d", arc)
            .each(function(d) { this._current = d; })


        path.filter(function(d) {
                return d.endAngle - d.startAngle > .1;
            }).append("text")
            .attr('class', 'legendPartyProcent')
            .attr("dy", ".35em")
            .attr("transform", function(d) {
                return "translate(" + arc.centroid(d) + ")";
            })
            .attr("text-anchor", "middle")
            .style("opacity", 1)
            .style("font-weight", "bold")
            .text(function(d) {
                return d.data.year + "%";
            });

        path.on('mouseover', function(d) {
            var year = ELECTIONYEARSARRAY[$("#year").slider("value")];
            var mun;
            if ($("#searchfield").attr("placeholder") == "Sök kommun") {
                mun = DEFAULTREGION;
            } else {
                mun = $("#searchfield").attr("placeholder");
            }

            var munArray = getMunData(mun, year);

            var party;
            munArray.forEach(function(e) {

                if (d.data.parti == e.parti) {
                    party = e;
                }
            });

            tip.html(
                "<span style='color:" + COLOR.get(party.parti) + "'>" + party.parti + "<strong>:</strong> <span style='color:white'>" + party.year + "%" + "</span>"
            );
            tip.show();
        })

        path.on('mouseout', tip.hide);

        var partyArray = [];
        data_arr.forEach(function(d) {
            if (!isNaN(d.year)) {
                partyArray.push(d.parti);
            }
        });

        var legend = svg.selectAll('.legend')
            .data(partyArray)
            .enter()
            .append('g')
            .attr('class', 'legendParty')
            .attr('transform', function(d, i) {
                var height = legendRectSize + legendSpacing;
                var offset = height * COLOR.size / 2;
                var horz = radius + 10;
                var vert = i * height - offset;
                return 'translate(' + horz + ',' + vert + ')';
            });

        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', function(d) {
                return COLOR.get(d);
            })
            .style('stroke', function(d) {
                return COLOR.get(d);
            });

        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function(d) {
                return d;
            });

        var legendMun = svg.selectAll('.legendname')
            .data([{DEFAULTREGION}])
            .enter()
            .append('g')
            .attr('transform', 'translate(' + 0 + ',' + 0 + ')');

        legendMun.append('text')
            .attr('class', 'legendReg')
            .transition()
            .duration(500)
            .style("opacity", 0)
            .transition().duration(200)
            .style("opacity", 1)
            .attr("text-anchor", "middle")
            .style("font-size", function(d) {
                var len = Math.min(2 * (radius - 80), ((2 * (radius - 80)) / d.DEFAULTREGION.length ) );
                return len + "px";
            })
            .attr("dy", ".35em")
            .style("font-weight", "bold")
            .text(function(d) {
                if ($("#searchfield").attr("placeholder") == "Sök kommun") {
                    return DEFAULTREGION;
                } else {
                    return $("#searchfield").attr("placeholder");
                }

            });
    }

    function getMunData(mun, electionYear) {

        var year = electionYear;

        var nested_data = d3.nest()
            .key(function(d) {
                return d.region;
            })
            .sortValues(function(a, b) {
                return b.parti - a.parti;
            })
            .entries(data);
        nested_data = nested_data.filter(function(d) {
            return d.key == mun;
        })

        var munData = [];

        var obj = nested_data[0].values;

        for (var i = 0; i < obj.length; ++i) {
            munData.push({ parti: obj[i].parti, year: obj[i][year] });
        }

        return munData;
    }

    // Sends the name of the mun to other .js-files
    this.drawMun = function(mun, electionYear) {

        // Temporary fix
        //var electionYear = ELECTIONYEARSARRAY[$("#year").slider("value")];

        var filteredData = getMunData(mun, electionYear);


        var redrawdount = d3.selectAll(".arc")
            .data(pie(filteredData));

        d3.selectAll("text.legendPartyProcent").style("opacity", 0);

        redrawdount.select("path")
            .attr("d", arc)
            .transition().duration(750).attrTween("d", arcTween)
            .call(checkEndAll, function() { // redraw the arcs

                redrawdount.filter(function(d) {
                        return d.endAngle - d.startAngle > .15;
                    })
                    .select("text")
                    .attr("transform", function(d) {
                        return "translate(" + arc.centroid(d) + ")";
                    })
                    .style("opacity", 1)
                    .text(function(d) {
                        return d.data.year + "%";
                    });
            });

        d3.selectAll(".legendParty").remove();

        filteredData = filteredData.filter(isYearNaN);

        var legend = svg.selectAll('.legend')
            .data(filteredData)
            .enter()
            .append('g')
            .attr('class', 'legendParty')

        .attr('transform', function(d, i) {
            var height = legendRectSize + legendSpacing;
            var offset = height * COLOR.size / 2;
            var horz = radius + 10;
            var vert = i * height - offset;
            return 'translate(' + horz + ',' + vert + ')';
        });

        legend.append('rect')
            .attr('width', legendRectSize)
            .attr('height', legendRectSize)
            .style('fill', function(d) {
                return COLOR.get(d.parti);
            })
            .style('stroke', function(d) {
                return COLOR.get(d.parti);
            });

        legend.append('text')
            .attr('x', legendRectSize + legendSpacing)
            .attr('y', legendRectSize - legendSpacing)
            .text(function(d) {
                return d.parti;
            });

        d3.selectAll('text.legendReg')
            .style("opacity", 1)
            .style("font-size", function(d) {
                var len = Math.min(2 * (radius - 80), ((2 * (radius - 80)) / d.DEFAULTREGION.length ) );
                return len + "px";
            })
            .style("font-weight", "bold")
            .text(mun)
    }

    function arcTween(a) {

        var i = d3.interpolate(this._current, a);
        this._current = i(0);

        return function(t) {
            return arc(i(t));
        };
    }

    //http://javascript.tutorialhorizon.com/2015/03/05/creating-an-animated-ring-or-pie-chart-in-d3js/
    function checkEndAll(transition, callback) {
        var n = 0;
        transition
            .each(function() {++n; })
            .each("end", function() {
                if (!--n) callback.apply(this, arguments);
            });
    }

    function isYearNaN(element, index, array) {
        return !isNaN(element.year);
    }

}