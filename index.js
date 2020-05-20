const { el, svg, mount, list, setChildren } = redom

var categories = ["Ageing","Aids","Animal Welfare","Bird Flu","BSE","Coal Pits","EU","Countryside","Crime","Defence","Drug Abuse","Economy","Education","Farming","German Reunification","GM foods","Housing","Inflation/Prices","Inner Cities","Local Govt","Low Pay","Morality","NHS","Northern Ireland","Nuclear Power","Nuclear Weapons","Pensions","Fuel Prices","Environment","The Pound","Poverty/Inequality","Privatisation","Public Services","Immigration","Scots/Welsh Assembly","Taxation","Trade Unions","Transport","Tsunami","Unemployment"]
var colors = ["#48A36D",  "#56AE7C",  "#64B98C", "#72C39B", "#80CEAA", "#80CCB3", "#7FC9BD", "#7FC7C6", "#7EC4CF", "#7FBBCF", "#7FB1CF", "#80A8CE", "#809ECE", "#8897CE", "#8F90CD", "#9788CD", "#9E81CC", "#AA81C5", "#B681BE", "#C280B7", "#CE80B0", "#D3779F", "#D76D8F", "#DC647E", "#E05A6D", "#E16167", "#E26962", "#E2705C", "#E37756", "#E38457", "#E39158", "#E29D58", "#E2AA59", "#E0B15B", "#DFB95C", "#DDC05E", "#DBC75F", "#E3CF6D", "#EAD67C", "#F2DE8A"]
var visibility = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1]

class Line {
    constructor() {
        this.el = svg("path.path-animate", {style:"stroke-width:2"})
    }
    update(data) {
        this.el.setAttribute("d",data[0])
        this.el.setAttribute("clip-path", 'url(#clip2)')
        this.el.setAttribute("style","fill:none;stroke:"+data[1]+";")
    }
}

class XTicks {
    constructor() {
        this.line
        this.text
        this.el = svg("g.animate", {style:"opacity:1;"}) 
    }
    update(data) {
        this.el.setAttribute("transform", "translate(" + data[0] + ",0)")
        this.line = svg("line", {style:"stroke:currentcolor;",y2:"6"}) 
        this.text = svg("text", {style:"fill:currentcolor;",y:9, dy:"0.71em"}, data[1])
        setChildren(this.el, [this.line, this.text])
    }
}

class YTicks {
    constructor() {
        this.line
        this.text
        this.el = svg("g.animate", {style:"opacity:1;"}) 
    }
    update(data) {
        this.el.setAttribute("transform", "translate(0," + data[0] + ")")
        this.line = svg("line", {style:"stroke:currentcolor;",x2:"-6"}) 
        this.text = svg("text", {style:"fill:currentcolor;",x:-9, dy:"0.32em"}, data[1])
        setChildren(this.el, [this.line, this.text])
    }
}

class legend {
    constructor() {
        this.checkbox = svg("rect", {width:10,height:10})
        this.label = svg("text",{y:8,x:15}) 
        this.el = svg("g.legend", this.checkbox, this.label)
    }
    update(data) {
        this.label.textContent = categories[data]
        this.checkbox.setAttribute("fill",(visibility[data] == 1?colors[data]: "#c8c8c8"))
        this.checkbox.addEventListener("click", function() {
            if(visibility[data] == 1) {
                visibility[data] = 0
                this.checkbox.setAttribute("fill", "#c8c8c8")
            }
            else {
                visibility[data] = 1
                this.checkbox.setAttribute("fill", colors[data])
            }
            graph.update()
        }.bind(this))
        this.el.setAttribute("transform", "translate(" + (graph.width() - graph.margin().left - graph.margin().right/3 - 30) + "," + (11.25+11.25*data) + ")")
    }
}

class LineChart {
    constructor() {
        var margin = {top: 20, right: 200, bottom: 100, left: 50},
            margin2 = {top: 230, right: 20, bottom: 30, left: 30},
            width = 960,
            height = 500,
            height2 = 40,
            xAxisOffset = 400,
            yAxisOffset = 50

        this.height = function(value) {
            if (!arguments.length) return height
                height = value
        }
        this.width = function(value) {
            if (!arguments.length) return width
                width = value
        }
        this.margin = function(value) {
            if (!arguments.length) return margin
        }
        this.xaxis_offset = function(value) {
            if (!arguments.length) return xaxis_offset
            xaxis_offset = value
        }
        this.yaxis_offset = function(value) {
            if (!arguments.length) return yaxis_offset
            yaxis_offset = value
        }
        //import components for graph
        this.xScale = d3.scaleTime().range([margin.left, width - margin.right])
        this.x2Scale = d3.scaleTime().range([margin.left, width - margin.right])
        this.yScale = d3.scaleLinear().range([this.height() - this.margin().bottom, this.margin().top])
        this.multiLine = list(svg("g"), Line)
        this.xTicks = list(svg("g"), XTicks)
        this.x2Ticks = list(svg("g"), XTicks)
        this.yTicks = list(svg("g"), YTicks)
        this.legends = list(svg("g"), legend)

        //initiate axes
        this.xAxis = svg("g.xaxis" , {transform:"translate(0,"+ xAxisOffset+")",style:"text-anchor:middle"}, 
        svg("path", {style:"fill:none;stroke:currentcolor;stroke-width:1;",d:"M" + (margin.left + 0.5) + ",0.5H" + (width - margin.right - 0.5) }),
        this.xTicks)
        this.xAxis2 = svg("g" , {transform:"translate(0,"+ (height - margin.bottom +70) +")",style:"text-anchor:middle"}, 
        svg("path", {style:"fill:none;stroke:currentcolor;stroke-width:1;",d:"M" + (margin.left + 0.5) + ",0.5H" + (width - margin.right - 0.5) }),
        this.x2Ticks)
        this.yAxis = svg("g", {transform:"translate("+ yAxisOffset +",0)",style:"text-anchor:end"}, 
        svg("path", {style:"fill:none;stroke:currentcolor;stroke-width:1;",d:"M0.5," + (height - margin.bottom+ 0.5) + "V" + (margin.top - 0.5) }),
        this.yTicks)

        this.brushRectangle = new BrushRectangle("X",this.height()-70,( this.xScale.range()[1] - this.xScale.range()[0]), 40, 50, this)
        this.clippath = svg("defs", svg("clipPath", {id:"clip2"}, svg("rect",{x:this.margin().left,y:this.margin().top,width:this.width()-this.margin().left-this.margin().right,height:this.height()-this.margin().top-this.margin().bottom})))
        this.el = svg("svg", {id:"graph", width:960, height:500})
    }
    update() {
        //get dimensions of graph
        var height = this.height(),
            width = this.width(),
            margin = this.margin()
        
        //Prepare scales and update SVG size
        this.xScale.domain(d3.extent(dataset, function(d) { return Date.parse(d.date) })).tickFormat(d3.timeFormat("%b"))
        this.x2Scale.domain(d3.extent(dataset, function(d) { return Date.parse(d.date) }))
        let activeCatagories = categories.filter(function(d,i){if (visibility[i] == 1) return d}) //To find only active categories
        let yMax = d3.max(dataset, function(d){   // Highest value on Y axis of active categories
            let test = []
            for(let i = 0;i< activeCatagories.length; i++) {test.push(d[activeCatagories[i]])}
            return parseInt(d3.max(test))
        })
        this.yScale.domain([0, yMax])
        let lineData = visibility.map(function(d,i){if(d == 1) { 
            return [d3.line().x(d => this.xScale(Date.parse(d.date))).y(d => this.yScale(d[categories[i]]))(dataset), colors[i]]
        } else return null
        }.bind(this)).filter(function(d){if (d != null) return d})
        lineData = lineData
        this.multiLine.update(lineData)
        let xtickformat = converScaleTicks(this.xScale.ticks())
        this.xTicks.update(this.xScale.ticks().map(function(d,i){return [this.xScale(d),xtickformat[i]]}.bind(this)))
        this.x2Ticks.update(this.x2Scale.ticks().map(function(d){console.log(d);return [this.x2Scale(d),1900 + d.getYear()]}.bind(this)))
        this.yTicks.update(this.yScale.ticks().map(function(d){return [this.yScale(d) ,d]}.bind(this)))
        setChildren(this.el, [this.legends, this.clippath, this.multiLine, this.xAxis, this.yAxis, this.brushRectangle, this.xAxis2])

    }
    //TO be used for resizing graph
    resize() {  
        let width = this.el.parentElement.clientWidth
        this.width(960)
        this.height(width * 0.56)
        this.xaxis_offset(width * 0.56 - 100)
        this.margin2({top: this.height() - 70, right: 20, bottom: 30, left: 30})
    }
    //To zoom and pan
    zoom(lowerDomain,upperDomain, UpdateLineInstantly) {
        var margin = this.margin()
        lowerDomain = this.x2Scale.invert(lowerDomain + margin.left)
        upperDomain = this.x2Scale.invert(upperDomain + margin.left)
        this.xScale.domain([lowerDomain, upperDomain])
        if (UpdateLineInstantly) {
            let lineData = visibility.map(function(d,i){if(d == 1) {
                return [d3.line().x(d => this.xScale(Date.parse(d.date))).y(d => this.yScale(d[categories[i]]))(dataset), colors[i]]
            } else return null
            }.bind(this)).filter(function(d){if (d != null) return d})
            this.multiLine.update(lineData)
        }
        else {
            setTimeout(function(lower = lowerDomain, upper = upperDomain){
                if (lowerDomain == lower && upperDomain == upper) {
                    let lineData = visibility.map(function(d,i){if(d == 1) {
                        return [d3.line().x(d => this.xScale(Date.parse(d.date))).y(d => this.yScale(d[categories[i]]))(dataset), colors[i]]
                    } else return null
                    }.bind(this)).filter(function(d){if (d != null) return d})
                    this.multiLine.update(lineData)
                }
            }.bind(this) ,500)}
        let xtickformat = converScaleTicks(this.xScale.ticks())
        this.xTicks.update(this.xScale.ticks().map(function(d,i){return [this.xScale(d),xtickformat[i]]}.bind(this)))
    }
}

class BrushRectangle {
    constructor(dim, dy, width, height, dx, graph) {
        this.dim = dim
        this.width = width
        this.height = height
        this.graph = graph
        this.touchending
        this.cursor = {overlay: "crosshair", selection:"move", n: "ns-resize", e: "ew-resize", s: "ns-resize", w: "ew-resize", nw: "nwse-resize", ne: "nesw-resize", se: "nwse-resize", sw: "nesw-resize"}
        this.signsX = {overlay: +1, selection: +1, n: null, e: +1, s: null, w: -1, nw: -1, ne: +1, se: +1,sw: -1}
        this.signsY = { overlay: +1, selection: +1, n: -1, e: null, s: +1, w: null, nw: -1, ne: -1, se: +1, sw: +1}
        this.extent = [[0,0],[this.width,this.height]]
        this.selectionExtent = null
        let started = function(event) {
            if (this.touchending && !event.touches) return;
            var type = event.target.getAttribute("data"),
                mode  =  (type === "selection"? "drag" : "handle"),
                dim = this.dim,
                signX = dim === "Y" ? null : this.signsX[type],
                signY = dim === "X" ? null : signsY[type],
                extent = this.extent,
                selection = this.selectionExtent,
                W = extent[0][0], w0, w1,
                N = extent[0][1], n0, n1,
                E = extent[1][0], e0, e1,
                S = extent[1][1], s0, s1,
                dx = 0,
                dy = 0,
                moving,
                point0
                if (event.touches) {
                    point0 = [event.changedTouches[0].clientX,event.changedTouches[0].clientY]
                }
                else {
                    point0 = [event.clientX, event.clientY]
                }
            var point = point0
            if (type === "overlay") {
                if (selection) moving = true;
                this.selectionExtent = selection = [
                    [w0 = dim === "Y" ? W : point0[0] - 50, n0 = dim === "X" ? N : point0[1] - 50],
                    [e0 = dim === "Y" ? E : w0, s0 = dim === "X" ? S : n0]
                ];
            } else {
                w0 = selection[0][0];
                n0 = selection[0][1];
                e0 = selection[1][0];
                s0 = selection[1][1];
            }
            w1 = w0;
            n1 = n0;
            e1 = e0;
            s1 = s0;
            this.el.setAttribute("style", "pointer-events:none")
            this.overlay.setAttribute("cursor", this.cursor[type])
            var moved = function(event) {
                let point1
                if (event.type == "touchmove") {
                    point1 = [event.changedTouches[0].clientX,event.changedTouches[0].clientY]
                }
                else {
                    point1 = [event.clientX, event.clientY]
                }
                point = point1
                moving = true
                event.preventDefault();
                event.stopImmediatePropagation();
                let obj = this
                move.bind(this)()
            }.bind(this)

            var ended = function(event) {
                if (event.type == "touchend" ) {
                    event.preventDefault()
                }
                event.stopImmediatePropagation();
                this.overlay.removeEventListener("mousemove", moved, true)
                this.overlay.removeEventListener("mouseup", ended, true)
                this.overlay.removeEventListener("mouseleave", ended, true)
                this.el.removeEventListener("touchmove", moved, true)
                this.el.removeEventListener("touchend", ended, true)
                this.el.setAttribute("style", "pointer-events:all")
                if(selection[0][0] - selection[1][0] == 0) this.selectionExtent = null
                if(this.selectionExtent) {
                    this.graph.zoom(this.selectionExtent[0][0], this.selectionExtent[0][0] + (this.selectionExtent[1][0] - this.selectionExtent[0][0]), 1)
                }
                else {
                    this.graph.zoom(0,this.width, 1)
                }
                this.overlay.setAttribute("cursor", this.cursor["overlay"])
            }.bind(this)

            this.overlay.addEventListener("mousemove", moved, true)
            this.overlay.addEventListener("mouseup", ended, true)
            this.overlay.addEventListener("mouseleave", ended, true)
            this.el.addEventListener("touchmove", moved, true)
            this.el.addEventListener("touchend", ended, true)
            if (event.cancelable) event.preventDefault()
            event.stopImmediatePropagation()
            this.update()

            function move() {
                var t;
                dx = point[0] - point0[0];
                dy = point[1] - point0[1];
                switch (mode) {
                    case "drag": {
                      if (signX) dx = Math.max(W - w0, Math.min(E - e0, dx)), w1 = w0 + dx, e1 = e0 + dx;
                      if (signY) dy = Math.max(N - n0, Math.min(S - s0, dy)), n1 = n0 + dy, s1 = s0 + dy;
                      break;
                    }
                    case "handle": {
                      if (signX < 0) dx = Math.max(W - w0, Math.min(E - w0, dx)), w1 = w0 + dx, e1 = e0;
                      else if (signX > 0) dx = Math.max(W - e0, Math.min(E - e0, dx)), w1 = w0, e1 = e0 + dx;
                      if (signY < 0) dy = Math.max(N - n0, Math.min(S - n0, dy)), n1 = n0 + dy, s1 = s0;
                      else if (signY > 0) dy = Math.max(N - s0, Math.min(S - s0, dy)), n1 = n0, s1 = s0 + dy;
                      break;
                    }
                  }

                  if (e1 < w1) {
                    signX *= -1;
                    t = w0, w0 = e0, e0 = t;
                    t = w1, w1 = e1, e1 = t;
                  }
            
                  if (s1 < n1) {
                    signY *= -1;
                    t = n0, n0 = s0, s0 = t;
                    t = n1, n1 = s1, s1 = t;
                    if (type in flipY) overlay.attr("cursor", cursors[type = flipY[type]]);
                  }
                  if (this.selectionExtent) selection = this.selectionExtent;
            
                  if (selection[0][0] !== w1
                      || selection[0][1] !== n1
                      || selection[1][0] !== e1
                      || selection[1][1] !== s1) {
                    this.selectionExtent = [[w1, n1], [e1 , s1]];
                    this.update()
                  }

            }


        }.bind(this)

        this.overlay = svg("rect", {data:"overlay",x:0,y:0,width:this.width,height:this.height,cursor:this.cursor["overlay"],fill:"#E6E7E8",style:"pointer-events:all",onmousedown: started, ontouchstart: started})
        this.selection = svg("rect", {data:"selection",height:40,cursor:this.cursor["selection"],fill:"#fff","fill-opacity":0.3,stroke:"#fff",style:"display:none",onmousedown: started, ontouchstart: started})
        this.handleLeft = svg("rect.handle", {data:"w",height:40,cursor:this.cursor["w"],fill:"",style:"display:none",onmousedown: started, ontouchstart: started})
        this.handleRight = svg("rect.handle", {data:"e",height:40,cursor:this.cursor["e"],fill:"",style:"display:none",onmousedown: started, ontouchstart: started})
        this.el = svg("g",{transform:"translate("+ dx +"," + dy +")",style:"pointer-events:all"}, this.overlay, this.selection, this.handleRight, this.handleLeft)
    }
    update() {
        if(this.selectionExtent) {
            this.selection.setAttribute("style", "display:null")
            this.selection.setAttribute("x", this.selectionExtent[0][0])
            this.selection.setAttribute("y", this.selectionExtent[0][1])
            this.selection.setAttribute("width", this.selectionExtent[1][0] - this.selectionExtent[0][0])
            this.selection.setAttribute("height", this.selectionExtent[1][1] - this.selectionExtent[0][1])

            this.handleLeft.setAttribute("style", "display:null")
            this.handleLeft.setAttribute("x", this.selectionExtent[0][0] - 3)
            this.handleLeft.setAttribute("y", 0)
            this.handleLeft.setAttribute("width", 6)
            this.handleLeft.setAttribute("height", this.height)

            this.handleRight.setAttribute("style", "display:null")
            this.handleRight.setAttribute("x", this.selectionExtent[1][0] - 3)
            this.handleRight.setAttribute("y", 0)
            this.handleRight.setAttribute("width", 6)
            this.handleRight.setAttribute("height", this.height)
            this.graph.zoom(this.selectionExtent[0][0], this.selectionExtent[0][0] + (this.selectionExtent[1][0] - this.selectionExtent[0][0]), 0)
        }
        else {
            this.selection.setAttribute("style","display:none")
            this.handleRight.setAttribute("style","display:none")
            this.handleLeft.setAttribute("style","display:none")
            this.graph.zoom(0,this.width, 0)
        }
    }
}

let graph = new LineChart()
let total = el("div", graph)

mount(document.getElementById("Redom-render"), total);
graph.update()
let listData = []
        for (let i=0;i<40;i++) {
            listData.push(i)
        }
graph.legends.update(listData)

function converScaleTicks(data)  {
    let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    let prev = 0
    let temp
    if ( data[data.length - 1].getYear() - data[0].getYear() < 4){
        temp = data.map(function(k,i) {
            if( i == 0 || i == (data.length -1) ) {
                prev =  k.getYear()
                return 1900 + prev
            }
            console.log(prev)
            if ( k.getYear() == prev) return months[k.getMonth()]    
            else {
                prev = k.getYear()
                return (1900+k.getYear())
            }
        })
        console.log(temp)
    }
    else {
        temp = data.map(function(k){
            return 1900 + k.getYear()
        })

    }
    return temp
}