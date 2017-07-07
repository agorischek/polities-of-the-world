//App
var app = new Vue({
    el: "#app",
    data: {
        settings: {},
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
            this.applyFilter(limit);
        },
        applyFilter:function(limit){
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
                return d3.scale.linear().domain([min,max]).range([app.settings.colors.light, app.settings.colors.dark]);
            }
            else if(type == "rank"){
                return d3.scale.linear().domain([min,max]).range([app.settings.colors.dark, app.settings.colors.light]);
            }
            else if(TypeError == "singleSelect"){
                return d3.scale.category20b()
            }
            else if(type == "verbose" || type == "code"){
                return function(){
                    return app.settings.colors.medium;
                };
            }
            else if(type == "multipleSelect"){
                return function(){
                    return app.settings.colors.mediumDark;
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