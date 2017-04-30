//                Begin
$(function(){
    getData();
    getSchema();
    enableNavBar();
});

//Variables
var csv;
//var stats = [];
var colors;
var polities = [];
var mapDisplay;

var app = new Vue({
  el: '#page',
  data: {
    content: {},
    schema: {},
    stats: [],
    statsPaneTitle: "Stats",
    polityPaneTitle: "Polities",
    polities: polities,
    orderedStatSections: [],
    currentPolity: "",
    currentStat: "",
    currentDirection: "",
  },
    methods:{
        politySelect: function(polity){
            showPolityInfo(polity)            
        },
        statSelect: function(stat){
            showStatsInfo(stat)
        },
        polityBack: function(){
            showPolitiesList(); 
        },
        statBack: function(){
            showStatsList();
            $("#stats-pane-modifier").hide();
        }
    }
})

//    The stat sections in their ideal order
var idealStatSections = ["Naming","Demographics","Economy","Infrastructure","Codes"]
//    The stat sections that actually exist in the data
var actualStatSections = []
//    The stat sections that exist in the data but aren't listed in the ideal list
var additionalStatSections = []
//    The full list of stat sections in the order they should be displayed
//var orderedStatSections = ["whattup"]

//Sequencing
var gettingData = $.Deferred();

var gettingSchema = $.Deferred();

$.when(gettingData, gettingSchema).done(function(value) {
    procesMultipleSelects();
    processPercentages();
    processNumbers();
    showMap();
    populateStatsList();
    showStatsList();
//    makeStatsInteractive("#stats-list");
    populatePolitiesList();
});

var showingMap = $.Deferred().done(function(){
    makePolitiesInteractive("#map-pane");
//    showDefaultPolity();
    enableZoom();
});


//Functions

function procesMultipleSelects(){
    each(app.stats,function(index,stat){
        
        if(app.schema[stat]){
      
            if(app.schema[stat].type == "multipleSelect" || app.schema[stat].type == "polities"){

                each(app.content,function(polityCode,polityInfo){

                    if(polityInfo[stat]){

                        polityInfo[stat] = polityInfo[stat].split(",");

                    }              
                })          
            }
        }
    })   
};

function processPercentages(){
    
    each(app.stats,function(index,stat){
        
        if(app.schema[stat]){
      
            if(app.schema[stat].type == "percent"){

                each(app.content,function(polityCode,polityInfo){

                    if(polityInfo[stat]){
                                                
                        Math.round(polityInfo[stat] = polityInfo[stat] / 100).toFixed(2)

                    }              
                })          
            }
        }
    })  
    
};

function processNumbers(){
    
    each(app.stats,function(index,stat){
        
        if(app.schema[stat]){
      
            if(app.schema[stat].type == "number" || app.schema[stat].type == "currency"){

                each(app.content,function(polityCode,polityInfo){

                    if(polityInfo[stat]){

                        polityInfo[stat] = numeral(polityInfo[stat]).value();
                        
                    }              
                })          
            }
        }
    })  
    
};

function chooseColors(min, max, type){

    if(type == "index" || type == "number" || type == "percent" || type == "currency"){
        colors = d3.scale.linear()
            .domain([min,max])
            .range([lightColor, darkColor]);
    }
    else if(type == "rank"){
        colors = d3.scale.linear()
            .domain([min,max])
            .range([darkColor, lightColor]);
    }
    else if(TypeError == "singleSelect"){
        colors = d3.scale.category20b()
    }
    else if(type == "verbose" || type == "code"){
        colors = function(){
            return mediumColor;
        };
    }
    else if(type == "multipleSelect"){
        colors = function(){
            return mediumDarkColor;
        };
    }
    else{
        colors = d3.scale.category20b();
        } 
}

function getData(){

    $.ajax({
        url: "data/polities.csv"
    })

    .done(function(rawInput){

        app.stats = Papa.parse(rawInput,{
            delimiter: "",
            newline:"",
            dynamicTyping: true,
            preview:1
        }).data[0];

        parsed = Papa.parse(rawInput,{
            delimiter: "",
            newline:"",
            header: true,
            dynamicTyping: true,
            preview:0
        });
        
        var unsortedPolities = [];

        each(parsed.data, function(index, polityInfo) {
            app.content[polityInfo[iDColumnHeader]] = polityInfo;
            unsortedPolities.push([polityInfo["name"],polityInfo[iDColumnHeader]]);
        });
        
        unsortedPolities.sort(function(a, b){
            return a[0] - b[0];        
        });
                
        each(unsortedPolities, function(index,polityPair){
            polities.push(polityPair[1]);
        })
                
        gettingData.resolve();

    });  
};

function getSchema(){

    $.ajax({
        url: "data/schema.csv"
    })

    .done(function(data){

        parsed = Papa.parse(data,{
            delimiter: "",
            newline:"",
            header: true,
            dynamicTyping: true,
            preview:0
        });

        each(parsed.data, function( key, value ) {
            app.schema[value["stat"]] = value;
            actualStatSections.push(value["section"])
        });

        actualStatSections = unique(actualStatSections);

        additionalStatSections = _.difference(actualStatSections, idealStatSections);

        app.orderedStatSections = idealStatSections.concat(additionalStatSections);

        gettingSchema.resolve();

    });  
};

function showMap(){

    mapDisplay = new Datamap({

        element: document.getElementById('map'),

        projection: mapProjection,

        fills: {
            defaultFill: defaultFillColor
        },

        data: app.content,

        geographyConfig: {
            popupTemplate: function(geo, data) {
                return ['<div class="hoverinfo"><strong>',
                        data.name,
                        ': ' + data[setColorsByStat],
                        '</strong></div>'].join('');
            },
            highlightFillColor: highlightColor,
            highlightBorderColor: highlightBorderColor,
            highlightBorderWidth: 1,
            highlightBorderOpacity: 1
        },
        projectionConfig: {
            rotation: [0, 0]
        }
});

// Draw a legend for this map
    mapDisplay.legend();

    showingMap.resolve();

};

function setColorsBy(stat, subset){  
    
        app.currentStat = stat;
    
//        Show or hide the modifier based on whether we're showing a subset
        if(subset){
            $("#stats-pane-modifier").show();
        }
        else{
            $("#stats-pane-modifier").hide();
        }
    
        var dataForColors = {}
        
        var values = []
        var minValue
        var maxValue
        
        var statType = app.schema[stat].type;
               
//      If the data type is verbose, there's no need to calculate anything about the data
        if(app.schema[stat]["type"] == "verbose"){
            
            if(subset){
                
                each(subset, function(index,pair){
                    
                    dataForColors[pair[1]] = colors(pair[0])
                    
                })
                
            }
            else{
    //            For each polity...
                each(app.content, function(polityCode, polityDetails) {

    //                If the relevant statistic exists...
                    if(polityDetails[stat]){

    //                    Push that polity into the dataForColors object
                        dataForColors[polityCode] = mediumColor;
                    };
                });
            }
        }
    
//    Otherwise, we need to know more about the data    
        else{

//            For each polity
            each(app.content, function(polityCode, polityDetails) {
                
//                If the relevant statistic exists
                if(polityDetails[stat]){
                    
//                    Push into the values array for further analysis
                    values.push(polityDetails[stat]);
                };
                
            });
            
//            Get a minimum and maximum for the stat
            if(app.schema[stat].min){
                minValue = app.schema[stat]["min"]
            }
            else{
                minValue = Math.min.apply(null, values)
            };

            if(app.schema[stat].max){
                maxValue = app.schema[stat]["max"]
            }
            else{
                maxValue = Math.max.apply(null, values);   
            };

//            Choose colors based on the min, max, and stat type
            chooseColors(minValue, maxValue, statType)   

            
            if(subset){
                
                each(subset, function(index,pair){
                    
                    dataForColors[pair[1]] = colors(pair[0])
                    
                })
                
            }
            else{            
            
    //            For each polity
                each(app.content, function(polityCode, polityDetails) {

    //                If the stat exists for the polity
                    if(polityDetails[stat]){

    //                    Add that color to the dataForColors object
                        dataForColors[polityCode] = colors(polityDetails[stat]);
                    };
                });
            }
            
        }
    
        mapDisplay.updateChoropleth(dataForColors, {reset: true});  

    };

    function clearMapColors(){
    
        var dataForColors = {}
        
        each(app.content, function(polityCode, polityInfo) {
            dataForColors[polityCode] = defaultFillColor;
        });
        
        mapDisplay.updateChoropleth(dataForColors, {reset: true});  

    }

    function populateStatsList(){
        
//        log(orderedStatSections)
                        
//        each(orderedStatSections, function(i,section){
//            
//            var headerAdded = false
//            
//            each(app.stats, function(index,stat) {
//                
//                if(app.schema[stat]){
//
//                    if(app.schema[stat]["section"] == section){
//
//                        if(headerAdded == false){
//                            var header = "<h3>" + section + "</h3>"
//                            $("#stats-list").append(header);
//                            headerAdded=true;                            
//                        }
//
//                        var title            
//
//                        if(app.schema[stat]){
//                            title = app.schema[stat]["title"];
//                        }
//                        else{
//                            title = "\"" + stat + "\""
//                        };
//
//
//                        var listItem = "<li class='actionable stat stat-" + stat + "'>" + title + "</li>"
//
//                        $("#stats-list").append(listItem);
//
//                        $(".stat-" + stat).click(function(){
//    //                        showStatsInfo(value);
//                        })
//                    }
//                }
//            });     
//        });
        
        makeStatsInteractive("#stats-list");
        
    }

    function showStatsList(){
        
        $("#stats-info").hide();

        $("#stats-list").show();

        $("#stats-back-text").hide();
        
        $("#stats-source").html("");
        
        app.statsPaneTitle = "Stats";

    };


function formatStatData(value,type){
        
    if(type == "percent"){
        return numeral(value).format('0[.]00%');
    }
    
    else if(type == "currency"){
        return numeral(value).format('$0,0[.]00');        
    }
    
    else if(type == "number"){  
        return numeral(value).format('0,0[.]00') 
    }
    
    else if(type == "polities"){
        if(app.content[value]){
            return app.content[value].name
        }
        else{
            return value
        }
    }
    
    else{
        return value
    }

}

function displayStatItem(statInfo){
    
    var formattedStatData = formatStatData(statInfo.data, statInfo.type)
    
    var classes = ""
    
    if(statInfo.actionable){
        classes = classes.concat("actionable ")
    }
    
    classes = classes.concat("stat-" + statInfo.stat + "-data");
        
//    $(statInfo.target).append(statInfo.prefix + "<span class='" + classes + "' data='" + statInfo.data + "'>" + formattedStatData + "</span>");
    
    $(statInfo.target).append(statInfo.prefix + element({
        tag:"span",
        content:formattedStatData,
        class:classes,
        data: statInfo.data
    }))
}

function showPolityInfo(polity){
    
    $("#polity-list").hide();
    
    $("#polity-info").empty();
    
    $("#polity-info").show();
    
    $("#polity-back-text").show();
    
    app.polityPaneTitle = app.content[polity].name;
    
//    $("#polity-pane-title").html(data[polity].name);

    each(app.content[polity], function(stat, statData){
        
        if(app.content[polity]){
            
//            If a proper title is provided in the schema we use that; else we fall back to the variable name
            var title
            
            if(app.schema[stat]){
                title = app.schema[stat]["title"];
            }
            else{
                title = "\"" + stat + "\""
            };
            
            var target = "#polity-info"
            
            if(app.schema[stat]){

                if(app.schema[stat].section != "Codes"){

                    if(stat != "name"){

                        if(statData){

                            $(target).append("<h3 class='actionable stat-" + stat + "'>" + title + "</h3>");

                            if(app.schema[stat].type == "multipleSelect" || app.schema[stat].type == "polities"){

                                each(statData,function(index,value){

                                    var prefix =""

                                    if(index != 0){
                                        prefix = ", "
                                    }

                                    displayStatItem({
                                        target: target,
                                        prefix: prefix,
                                        actionable: true,
                                        stat: stat,
                                        data: statData,
                                        type: app.schema[stat].type
                                        
                                    });                               
                                });                            
                            }

                            else{

                                displayStatItem({
                                    target: target,
                                    prefix: "",
                                    actionable: true,
                                    stat: stat,
                                    data: statData,
                                    type: app.schema[stat].type
                                }); 

                            };                            
                        }
                    }
                }   
            }
        }        
    })   
    
    makePolitiesInteractive("#polity-info");
    
    makeStatsInteractive("#polity-info");
    
    $("#polity-pane").animate({ scrollTop: 0 }, 0);

}

function showStatsInfo(stat,limit,direction){
        
    $("#stats-list").hide();
    
    $("#stats-info").empty();
    
    $("#stats-info").show();
    
    $("#stats-back-text").show();
    
    app.statsPaneTitle = app.schema[stat].title;    
    
//    $("#stats-pane-title").html(app.schema[stat].title);
    
//    For each polity...
    each(app.content, function(polityCode, polityInfo){
                
//        If that polity has info for the stat...
        if(polityInfo[stat]){
            
            var formattedStatData = formatStatData(polityInfo[stat], app.schema[stat].type);
            
            if(limit){
                            
                if(direction=="greater" && polityInfo[stat]>=limit){

                   $("#stats-info").append("<h3 class='header actionable " + polityCode + "'>" + polityInfo["name"] + "</h3><div>" + formattedStatData + "</div>");

                }
                else if(direction=="lesser" && polityInfo[stat]<=limit){

                   $("#stats-info").append("<h3 class='header actionable " + polityCode + "'>" + polityInfo["name"] + "</h3><div>" + formattedStatData + "</div>");
                }
                else if(direction=="same" && containsOrEquals(polityInfo[stat],limit)){
                    
                   $("#stats-info").append("<h3 class='header actionable " + polityCode + "'>" + polityInfo["name"] + "</h3><div>" + formattedStatData + "</div>"); 
                }
            }
            else{
//            Display that info
            $("#stats-info").append("<h3 class='header actionable " + polityCode + "'>" + polityInfo["name"] + "</h3><div>" + formattedStatData + "</div>");

        }
        }
    })   
    
    makeStatsInteractive("#stats-info");
    makePolitiesInteractive("#stats-info");
    $("#stats-pane").animate({ scrollTop: 0 }, 0);
    showStatsSource(stat);

}

function populatePolitiesList(){
    
    app.polities = polities;
    
//    each(polities, function(index, polityCode){
//        
//        $("#polity-list").append("<li class='polity actionable " + polityCode + "'>" + data[polityCode]["name"] + "</li>");
//        
//    })
    
    makePolitiesInteractive("#polity-list");
    
}

function showPolitiesList(){
        
    $("#polity-info").hide();
        
    $("#polity-list").show();
    
    $("#polity-back-text").hide();
    
    app.polityPaneTitle = "Polities";
    
//    $("#polity-pane-title").html("Polities");

    
}

function showDefaultPolity(){

    if(defaultPolity){

        if(defaultPolity == "random"){
            var polity = pick(polities);
            showPolityInfo(polity);
        }
        else{
            showPolityInfo(defaultPolity);
        }

    }
}

function makePolitiesInteractive(selector){
    
//    var scope = "";
//    
//    if(selector){
//        scope = selector + " ";
//    };
//
//    each(polities, function(index, polity){
//                
//        $(scope + "." + polity).click(function(){
//            showPolityInfo(polity);
//        })
//        
//        $(scope + "." + polity).hover(function(){
//            $("#display").html(element({
//                tag:"h2",
//                content:app.content[polity].name
//            }))
//        })
//        
//    });
};

function makeStatsInteractive(selector){
    
//    var scope = "";
//        
//    if(selector){
//        scope = selector + " ";
//    }
//    
//    each(app.stats, function(index, stat){ 
//        
//        $(scope + ".stat-" + stat).click(function(){
//            setColorsBy(stat);
//            showStatsInfo(stat);
//        });  
//         
//    })
//    
//    each(app.stats, function(index,stat){
//       
//       $(scope + ".stat-" + stat + "-data").click(function(){
//            var statValue = $(this).attr("data")
//            setColorsBySubset(stat,statValue);
//           
//       }) 
//        
//    });

}

function enableZoom(){
    var zoom = d3.behavior.zoom()
    .scaleExtent([1, 20])
    .on("zoom", zoomed);
    d3.select(".datamap").call(zoom);    
}

function zoomed() {
  d3.select(".datamaps-subunits").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function setColorsBySubset(stat,limit){
     
    var subset = [];
        
    if(app.schema[stat].type == "multipleSelect" || app.schema[stat].type == "singleSelect"){
                    
        each(polities, function(index,polity){

    //            If the stat isn't blank and is less than the limit
                if(containsOrEquals(app.content[polity][stat], limit)){
                    subset.push([app.content[polity][stat],polity])
                };

            app.currentDirection = "same";
            
            $("#stats-pane-modifier").html(limit);

            });   
        
        setColorsBy(stat, subset);

        showStatsInfo(stat,limit,app.currentDirection);
        
    }
    
    else{
        
        limit = numeral(limit).value();
        
        formattedLimit = formatStatData(limit, app.schema[stat].type)

    //    This allows us to toggle between the two filters
        if(stat == app.currentStat && app.currentDirection == "greater"){

            each(polities, function(index,polity){

    //            If the stat isn't blank and is less than the limit
                if(app.content[polity][stat] != "" && app.content[polity][stat] <= limit){
                    subset.push([app.content[polity][stat],polity])
                };

            app.currentDirection = "lesser";
            $("#stats-pane-modifier").html("&le; " + formattedLimit);

            });       
        }        
        else{

            each(polities, function(index,polity){            

    //            If the stat isn't blank and is greater than the limit
                if(app.content[polity][stat] != "" && app.content[polity][stat] >= limit){
                    subset.push([app.content[polity][stat],polity])                
                };

                app.currentDirection = "greater"; 
                $("#stats-pane-modifier").html("&ge; " + formattedLimit);

            })          
        };

        subset.sort(function(a, b)
            {
                return a[0] - b[0];

            });

        setColorsBy(stat, subset);

        showStatsInfo(stat,limit,app.currentDirection);
    };
}

function enableNavBar(){
    $("#polities-nav").click(function(){
        $(".nav-item").removeClass("current-nav");
        $(this).addClass("current-nav");
        $("#left").removeClass("narrow-hide");
        $("#center").addClass("narrow-hide");
        $("#right").addClass("narrow-hide");
    })
    $("#map-nav").click(function(){
        $(".nav-item").removeClass("current-nav");
        $(this).addClass("current-nav");
        $("#left").addClass("narrow-hide");
        $("#center").removeClass("narrow-hide");
        $("#right").addClass("narrow-hide");
    })
    $("#stats-nav").click(function(){
        $(".nav-item").removeClass("current-nav");
        $(this).addClass("current-nav");
        $("#left").addClass("narrow-hide");
        $("#center").addClass("narrow-hide");
        $("#right").removeClass("narrow-hide");
    })
}

function showStatsSource(stat){

    $("#lower-right").show();
    var sourceName = app.schema[stat].sourceName
    var sourceURL = app.schema[stat].sourceURL
    $("#stats-source").html("Source: " + element({
        tag:"a",
        content:sourceName,
        target:"_blank",
        class:"actionable",
        href:sourceURL
    }))
}