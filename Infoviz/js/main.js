var map1;
var donut1;


d3.csv("data/Swedish_Election.csv", function(data) {

    parseData(data);

    setAutoCompleteData(data);

    map1 = new map(data);
    donut1 = new donut(data);

});

function parseData(electionData) {

    electionData.forEach(function(data) {

        data.region = data.region.slice(5);
        for (var i = 0; i < ELECTIONYEARSARRAY.length; ++i) {

            if (data[ELECTIONYEARSARRAY[i]] != "..") {
                data[ELECTIONYEARSARRAY[i]] = +data[ELECTIONYEARSARRAY[i].toString()];
            };
        };
    });
};

function setAutoCompleteData(data) {

    var nested_data = d3.nest()
        .key(function(d) {
            return d.region;
        })
        .sortKeys(d3.ascending)
        .entries(data);

    nested_data.forEach(function(d) {
        REGIONARRAY.push(d.values[0].region);
    });
};