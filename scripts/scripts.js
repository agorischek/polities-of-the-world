//                Begin
$(function(){
    getData();
    getSchema();
});

//Variables
var csv;
var colors;
var mapDisplay;

var app = new Vue({
    el: "#app",
    data: {
        content: {},
        schema: {},
        stats: [],
        strings: strings,
        polities: [],
        orderedStatSections: [],
        currentPolity: null,
        currentStat: null,
        currentDirection: null,
        showDebug: true,
        currentView: "map"
    },
    methods:{
        politySelect: function(polity){
            showPolityInfo(polity);
        },
        statSelect: function(stat){
            showStatsInfo(stat);
        },
        polityBack: function(){
            showPolitiesList(); 
        },
        statBack: function(){
            showStatsList();
        }
    },
    computed:{
        currentStatType: function(){
            var type = "";
            if(this.schema[this.currentStat]){
                type = this.schema[this.currentStat].type
            }
            return type;
        },
        currentPolityInfo: function(){
            var info = {}
            if(this.currentPolity){
                info = this.content[this.currentPolity];
            }
            return info;
        },
        currentPolityInfoFormatted: function(){
            var info = {};
            each(this.currentPolityInfo, function(key, value){
                var type = "";
                if(app.schema[key]){
                    type = app.schema[key].type
                }
                info[key] = formatStatData(value,type)
            })
            return info;
        },
        currentStatsInfo: function(){
            var info = {}
            if(this.currentStat){
                each(this.polities, function(key, value){
                    info[value] = (app.content[value][app.currentStat])
                })
            }
            return info;
        },
        currentStatsInfoFormatted: function(){
            var info = {};
            var type = this.currentStatType
            each(this.currentStatsInfo, function(key, value){
                info[key] = formatStatData(value,type)
            })
            return info;
        },
        currentPolityName: function(){
            if(this.currentPolity){
                return this.currentPolityInfo.name;
            }
        },
        currentStatName: function(){
            if(this.schema[this.currentStat]){
                return this.schema[this.currentStat]["title"];
            }
        },
        polityPaneTitle: function(){
            if (!this.currentPolity){
                return this.strings.polityPaneTitle;
            }
            else{
                return this.currentPolityName;
            }
        },
        statsPaneTitle: function(){
            if (!this.currentStat){
                return this.strings.statsPaneTitle;
            }
            else{
                return this.currentStatName;
            }
        }
    }
})

//    The stat sections to display first
var firstStatSections = ["Naming","Demographics","Economy","Infrastructure"]
//    The stat sections that actually exist in the data
var actualStatSections = []
//    The stat sections that exist in the data but aren't listed in the first list
var additionalStatSections = []

//Sequencing
var gettingData = $.Deferred();

var gettingSchema = $.Deferred();

$.when(gettingData, gettingSchema).done(function(value) {
    procesMultipleSelects();
    processPercentages();
    processNumbers();
    showMap();
    showStatsList();
});

var showingMap = $.Deferred().done(function(){
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
            return (a[0] === b[0] ? 0 : (a[0] < b[0] ? -1 : 1));
        });
                        
        each(unsortedPolities, function(index,polityPair){
            app.polities.push(polityPair[1]);
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

        additionalStatSections = _.difference(actualStatSections, firstStatSections);

        app.orderedStatSections = firstStatSections.concat(additionalStatSections);

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
        },
        done: function(datamap) {
            datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
                showPolityInfo(geography.id)
            });
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

    function showStatsList(){
        
        app.currentStat = null;
        
        scrollUp("#middle-right");
        
        $("#stats-pane-modifier").hide();

//        $("#stats-back-text").hide();
        
        $("#stats-source").html("");
        
//        app.statsPaneTitle = "Stats";

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
    
    scrollUp("#middle-left");
    
    app.currentPolity = polity;
    
//    $("#polity-back-text").show();
    
//    app.polityPaneTitle = app.content[polity].name;
    
//    $("#polity-pane-title").html(data[polity].name);

//    each(app.content[polity], function(stat, statData){
//        
//        if(app.content[polity]){
//            
////            If a proper title is provided in the schema we use that; else we fall back to the variable name
//            var title
//            
//            if(app.schema[stat]){
//                title = app.schema[stat]["title"];
//            }
//            else{
//                title = "\"" + stat + "\""
//            };
//            
//            var target = "#polity-info"
//            
//            if(app.schema[stat]){
//
//                if(app.schema[stat].section != "Codes"){
//
//                    if(stat != "name"){
//
//                        if(statData){
//
//                            $(target).append("<h3 class='actionable stat-" + stat + "'>" + title + "</h3>");
//
//                            if(app.schema[stat].type == "multipleSelect" || app.schema[stat].type == "polities"){
//
//                                each(statData,function(index,value){
//
//                                    var prefix =""
//
//                                    if(index != 0){
//                                        prefix = ", "
//                                    }
//
//                                    displayStatItem({
//                                        target: target,
//                                        prefix: prefix,
//                                        actionable: true,
//                                        stat: stat,
//                                        data: statData,
//                                        type: app.schema[stat].type
//                                        
//                                    });                               
//                                });                            
//                            }
//
//                            else{
//
//                                displayStatItem({
//                                    target: target,
//                                    prefix: "",
//                                    actionable: true,
//                                    stat: stat,
//                                    data: statData,
//                                    type: app.schema[stat].type
//                                }); 
//
//                            };                            
//                        }
//                    }
//                }   
//            }
//        }        
//    })
    
//    $("#polity-pane").animate({ scrollTop: 0 }, 0);

}

function scrollUp(element){
//    $(element).scrollTop(0);
    $(element).animate({ scrollTop: 0 }, 00);

}

function showStatsInfo(stat,limit,direction){
    
    app.currentStat = stat;
    
    scrollUp("#middle-right");
    
    setColorsBy(stat);
    
//    $("#stats-back-text").show();
    
    app.statsPaneTitle = app.schema[stat].title;    
    
//    $("#stats-pane-title").html(app.schema[stat].title);
    
////    For each polity...
//    each(app.content, function(polityCode, polityInfo){
//                
////        If that polity has info for the stat...
//        if(polityInfo[stat]){
//            
//            var formattedStatData = formatStatData(polityInfo[stat], app.schema[stat].type);
//            
//            if(limit){
//                            
//                if(direction=="greater" && polityInfo[stat]>=limit){
//
//                   $("#stats-info").append("<h3 class='header actionable " + polityCode + "'>" + polityInfo["name"] + "</h3><div>" + formattedStatData + "</div>");
//
//                }
//                else if(direction=="lesser" && polityInfo[stat]<=limit){
//
//                   $("#stats-info").append("<h3 class='header actionable " + polityCode + "'>" + polityInfo["name"] + "</h3><div>" + formattedStatData + "</div>");
//                }
//                else if(direction=="same" && containsOrEquals(polityInfo[stat],limit)){
//                    
//                   $("#stats-info").append("<h3 class='header actionable " + polityCode + "'>" + polityInfo["name"] + "</h3><div>" + formattedStatData + "</div>"); 
//                }
//            }
//            else{
////            Display that info
//            $("#stats-info").append("<h3 class='header actionable " + polityCode + "'>" + polityInfo["name"] + "</h3><div>" + formattedStatData + "</div>");
//
//        }
//        }
//    })   
    
//    $("#stats-pane").animate({ scrollTop: 0 }, 0);
    showStatsSource(stat);

}

function showPolitiesList(){
     
    app.currentPolity = "yo";
    
    scrollUp("#middle-left");
    
//    $("#polity-back-text").hide();
        
}

function showDefaultPolity(){

    if(defaultPolity){

        if(defaultPolity == "random"){
            var polity = pick(app.polities);
            showPolityInfo(polity);
        }
        else{
            showPolityInfo(defaultPolity);
        }

    }
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
                    
        each(app.polities, function(index,polity){

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

            each(app.polities, function(index,polity){

    //            If the stat isn't blank and is less than the limit
                if(app.content[polity][stat] != "" && app.content[polity][stat] <= limit){
                    subset.push([app.content[polity][stat],polity])
                };

            app.currentDirection = "lesser";
            $("#stats-pane-modifier").html("&le; " + formattedLimit);

            });       
        }        
        else{

            each(app.polities, function(index,polity){            

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

function showStatsSource(stat){

//    $("#lower-right").show();
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

function showDebug(){
    app.showDebug = true;
}

function hideDebug(){
    app.showDebug = false;
}

$(".debugX").click(function(){
    hideDebug();
})