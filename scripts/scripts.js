//Begin
$(function(){
    getData();
    getSchema();
});

//Variables
var csv;
var mapDisplay;

//App
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
        currentLimit: null,
        currentFilter: null,
        showDebug: false,
        currentView: "map",
        firstStatSections: ["Naming","Demographics","Economy","Infrastructure"],
        actualStatSections: [],
        additionalStatSections: []
    },
    methods:{
        formatStatData: function(value,type){
        
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
                if(this.content[value]){
                    return this.content[value].name
                }
                else{
                    return value
                }
            }

            else{
                return value
            }

        },
        politySelect: function(polity){
            this.showPolityInfo(polity);
        },
        statSelect: function(stat){
            this.showStatsInfo(stat);
            this.removeFilter();
        },
        removeFilter: function(){
            this.currentLimit = null;
            this.currentFilter = null;
        },
        polityBack: function(){
            this.showPolitiesList(); 
        },
        statBack: function(){
            this.showStatsList();
        },
        statSelectWithLimit: function(stat, limit){
            this.showStatsInfo(stat);
            this.currentLimit = limit;
            this.changeFilter();
        },
        showPolitiesList: function(){
            this.currentPolity = null;
            scrollUp("#middle-left");            
        },
        showStatsList: function(){        
            this.currentStat = null;
            scrollUp("#middle-right");    
        },
        showPolityInfo: function(polity){
            this.currentPolity = polity;
            scrollUp("#middle-left");
        },
        showStatsInfo: function(stat){
            this.currentStat = stat;
            scrollUp("#middle-right");
        },
        hideDebug: function(){
            this.showDebug = false;
        },
        showDebug: function(){
            this.showDebug = true;
        },
        changeFilter: function(){
            if((app.currentFilterIndex + 1) >= app.currentPossibleFilters.length){
                    app.currentFilter = app.currentPossibleFilters[0];
                }
            else{
                app.currentFilter = app.currentPossibleFilters[(app.currentFilterIndex + 1)]
            }
        },
        filterStatItem: function(polity){
//            If there's no info for the polity, filter it out
            if(!this.currentStatsInfo[polity]){
                return false
            }
//            Otherwise, perform other logic to determine whether it should be shown
            else{
//                If there's no limit, show everything with info
                if(this.currentLimit == null){
                    return true;
                }
//                Else, and if the stat is numeric...
                else if(this.currentStatIsNumeric){
                    if(this.currentFilter=="greaterThanOrEqual" && this.currentStatsInfo[polity] >= this.currentLimit && this.currentLimit){
                        return true;
                    }
                    else if(this.currentFilter=="lessThanOrEqual" && this.currentStatsInfo[polity] <= this.currentLimit && this.currentLimit){
                        return true;
                    }
                    else{
                        return false;
                    }
                }
//                Else, and if the stat is not numeric...
                else{
                    if(this.currentFilter == "equal" && this.currentLimit == this.currentStatsInfo[polity]){
                        return true;
                    }
                    else if (this.currentFilter == "notEqual" && this.currentLimit != this.currentStatsInfo[polity]){
                        return true;
                    }
                    else{
                        return false;
                    }
                }
            }
        }
    },
    watch:{
      currentColors: function(){
          mapDisplay.updateChoropleth(this.currentColors, {reset: true});  

      }  
    },
    computed:{
        currentStatType: function(){
            if(this.schema[this.currentStat]){
                return this.schema[this.currentStat].type
            }
            else{
                return null;
            }
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
                info[key] = app.formatStatData(value,type)
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
        currentStatsInfoFiltered: function(){
            var info = {}
            each(this.currentStatsInfo, function(polity, value){
                if(app.filterStatItem(polity)){
                    info[polity] = value;
                }
            })
            return info;
        },
        currentStatsInfoFormatted: function(){
            var info = {};
            var type = this.currentStatType
            each(this.currentStatsInfo, function(key, value){
                info[key] = app.formatStatData(value,type)
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
        },
        currentLimitFormatted: function(){
            if (this.currentLimit == null){
                return null;
            }
            else{
                return app.formatStatData(this.currentLimit, this.currentStatType)
            }
        },
        currentStatIsNumeric: function(){
            if(this.currentStatType == null){
                return null;
            }
            else if(this.currentStatType == "index" || this.currentStatType == "number" || this.currentStatType == "percent" || this.currentStatType == "currency" || this.currentStatType == "rank"){
                return true;
            }
            else if (this.currentStatType == "singleSelect" || this.currentStatType == "verbose" || this.currentStatType == "code" || this.currentStatType == "multipleSelect"){
                return false;
            }
            else{
                return false;
            }
                
        },
        currentPossibleFilters: function(){
            if(!this.currentStat){
                return null
            }
            else if(this.currentStatIsNumeric){
                return ["greaterThanOrEqual","lessThanOrEqual"]
            }
            else if(!this.currentStatIsNumeric){
                return ["equal","notEqual"]
            }
            else{
                return null;
            }
        },
        currentFilterIndex: function(){
            if(!this.currentStat){
                return null;
            }
            else{
                return this.currentPossibleFilters.indexOf(this.currentFilter);
            }
        },
        currentStatArray: function(){
            var array = [] 
            each(this.currentStatsInfo,function(key,value){
                if(value && value != ""){
                    array.push(value)
                }
            });
            return array;
        },
        currentStatMin: function(){
            if(!this.currentStat){
                return null;
            }
            else{
                log(this.schema)
                log(this.currentStat)
                log(this.schema[this.currentStat])
                log(this.schema[this.currentStat].min)
                if(this.schema[this.currentStat].min != null && this.schema[this.currentStat].min != ""){
                    log("Returned the schema min")
                    return this.schema[this.currentStat].min
                }
                else{
                    log("Returned the array min")
                    return Math.min.apply(null, this.currentStatArray)
                };
            }
        },
        currentStatMax: function(){
            if(!this.currentStat){
                return null;
            }
            else{
                if(this.schema[this.currentStat].max != null && this.schema[this.currentStat].max != ""){
                    return this.schema[this.currentStat].max
                }
                else{
                    return Math.max.apply(null, this.currentStatArray)
                };
            }
        },
        currentSourceName: function(){
            if(!this.currentStat){
                return null;
            }
            else{
                return this.schema[this.currentStat].sourceName
            }
        },
        currentSourceURL: function(){
            if(!this.currentStat){
                return null;
            }
            else{
                return this.schema[this.currentStat].sourceURL
            }
        },
        filterApplied: function(){
            if(!this.currentStat){
                return null
            }
            else if(this.currentLimit){
                return true
            }
            else{
                return false;
            };
        },
        currentColorScale: function(){
            
            var type = this.currentStatType;
            var min = this.currentStatMin;
            var max = this.currentStatMax;
            
            if(!this.currentStat){
                return null;
            }
            else if(type == "index" || type == "number" || type == "percent" || type == "currency"){
                return d3.scale.linear().domain([min,max]).range([lightColor, darkColor]);
            }
            else if(type == "rank"){
                return d3.scale.linear().domain([min,max]).range([darkColor, lightColor]);
            }
            else if(TypeError == "singleSelect"){
                return d3.scale.category20b()
            }
            else if(type == "verbose" || type == "code"){
                return function(){
                    return mediumColor;
                };
            }
            else if(type == "multipleSelect"){
                return function(){
                    return mediumDarkColor;
                };
            }
            else{
                return d3.scale.category20b();
            }
        },
        currentColors: function(){
            if(!this.currentStat){
                return null
            }
            else{
                info = {}
                each(this.currentStatsInfoFiltered, function(polity, value){
                    info[polity] = app.currentColorScale(value)
                })
                return info;            
            }
        }
    }
})

//Sequencing
var gettingData = $.Deferred();

var gettingSchema = $.Deferred();

$.when(gettingData, gettingSchema).done(function(value) {
    processData();
    showMap();
});

var showingMap = $.Deferred().done(function(){
    enableZoom();
});

//Functions

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

function processData(){
    each(app.stats,function(index,stat){
        if(app.schema[stat]){
            
            each(app.content,function(polityCode,polityInfo){
                
                if(app.schema[stat].type == "multipleSelect" || app.schema[stat].type == "polities"){
                    if(polityInfo[stat]){
                        polityInfo[stat] = polityInfo[stat].split(",");
                    }  
                }
                
                else if(app.schema[stat].type == "percent"){
                    if(polityInfo[stat]){
                        Math.round(polityInfo[stat] = polityInfo[stat] / 100).toFixed(2)
                    }
                }
                
                else if(app.schema[stat].type == "number" || app.schema[stat].type == "currency"){
                    if(polityInfo[stat]){
                        polityInfo[stat] = numeral(polityInfo[stat]).value();
                    }   
                }
                  
            })
        }
    })  
}

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
            app.actualStatSections.push(value["section"])
        });

        app.actualStatSections = unique(app.actualStatSections);

        app.additionalStatSections = _.difference(app.actualStatSections, app.firstStatSections);

        app.orderedStatSections = app.firstStatSections.concat(app.additionalStatSections);

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
                app.showPolityInfo(geography.id)
            });
        }
});

// Draw a legend for this map
    mapDisplay.legend();

    showingMap.resolve();

};


function scrollUp(element){
//    $(element).scrollTop(0);
    $(element).animate({ scrollTop: 0 }, 00);

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