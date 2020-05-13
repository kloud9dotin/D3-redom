const { el, svg, mount, list, setChildren } = redom

var categories = ["Ageing","Aids","Animal Welfare","Bird Flu","BSE","Coal Pits","EU","Countryside","Crime","Defence","Drug Abuse","Economy","Education","Farming","German Reunification","GM foods","Housing","Inflation/Prices","Inner Cities","Local Govt","Low Pay","Morality","NHS","Northern Ireland","Nuclear Power","Nuclear Weapons","Pensions","Fuel Prices","Environment","The Pound","Poverty/Inequality","Privatisation","Public Services","Immigration","Scots/Welsh Assembly","Taxation","Trade Unions","Transport","Tsunami","Unemployment"]
var colors = ["#48A36D",  "#56AE7C",  "#64B98C", "#72C39B", "#80CEAA", "#80CCB3", "#7FC9BD", "#7FC7C6", "#7EC4CF", "#7FBBCF", "#7FB1CF", "#80A8CE", "#809ECE", "#8897CE", "#8F90CD", "#9788CD", "#9E81CC", "#AA81C5", "#B681BE", "#C280B7", "#CE80B0", "#D3779F", "#D76D8F", "#DC647E", "#E05A6D", "#E16167", "#E26962", "#E2705C", "#E37756", "#E38457", "#E39158", "#E29D58", "#E2AA59", "#E0B15B", "#DFB95C", "#DDC05E", "#DBC75F", "#E3CF6D", "#EAD67C", "#F2DE8A"]
var visibility = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1]

class Line {
    constructor() {
        this.el = svg("path", {style:"stroke-width:2"})
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
        this.el = svg("g", {style:"opacity:1;"}) 
    }
    update(data) {
        this.el.setAttribute("transform", "translate(" + data[0] + ",0)")
        this.line = svg("line", {style:"stroke:currentcolor;",y2:"6"}) 
        this.text = svg("text", {style:"fill:currentcolor;",y:9, dy:"0.71em"},   data[1].getMonth()+1 + "/" + (1900 + data[1].getYear()))
        setChildren(this.el, [this.line, this.text])
    }
}

class YTicks {
    constructor() {
        this.line
        this.text
        this.el = svg("g", {style:"opacity:1;"}) 
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

        this.brushRectangle = new BrushRectangle(this.height()-70,( this.xScale.range()[1] - this.xScale.range()[0]), 40, 30, this)
        this.clippath = svg("defs", svg("clipPath", {id:"clip2"}, svg("rect",{x:this.margin().left,y:this.margin().top,width:this.width()-this.margin().left-this.margin().right,height:this.height()-this.margin().top-this.margin().bottom})))
        this.el = svg("svg", {id:"graph", width:960, height:500})
    }
    update() {
        //get dimensions of graph
        var height = this.height(),
            width = this.width(),
            margin = this.margin()
        
        //Prepare scales and update SVG size
        this.xScale.domain(d3.extent(dataset, function(d) { return Date.parse(d.date) }))
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
        this.xTicks.update(this.xScale.ticks().map(function(d){return [this.xScale(d),d]}.bind(this)))
        this.x2Ticks.update(this.x2Scale.ticks().map(function(d){return [this.x2Scale(d),d]}.bind(this)))
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
    zoom(lowerDomain,upperDomain) {
        var margin = this.margin()
        lowerDomain = this.x2Scale.invert(lowerDomain + margin.left)
        upperDomain = this.x2Scale.invert(upperDomain + margin.left)
        this.xScale.domain([lowerDomain, upperDomain])
        let lineData = visibility.map(function(d,i){if(d == 1) {
            return [d3.line().x(d => this.xScale(Date.parse(d.date))).y(d => this.yScale(d[categories[i]]))(dataset), colors[i]]
        } else return null
        }.bind(this)).filter(function(d){if (d != null) return d})
        this.multiLine.update(lineData)
        this.xTicks.update(this.xScale.ticks().map(function(d){return [this.xScale(d),d]}.bind(this)))
    }
}

class BrushRectangle {
    constructor(dy, width, height, dx, graph) {
        this.dy = dy
        this.maxWidth = width
        this.selectionDisplayed = false
        this.startX = 0
        this.containerDrag = false
        this.selectionWidth = 0, this.selectionX = 0
        this.backgroundDrag = function(e) {
            this.selectionWidth = Math.abs(this.startX - e.clientX-5)
            this.selectionX = Math.min(this.startX, e.clientX) - 30
            this.containerDrag = true
            this.update()
        }.bind(this)

        this.HandleLeftDrag = function(e) {
            if (this.selectionX + e.clientX - this.startX >= 0 ) {
                this.selectionX = this.selectionX + e.clientX - this.startX
                this.selectionWidth = this.selectionWidth - e.clientX + this.startX
            }
            else {
                this.selectionX = 0
            }
            this.selection.setAttribute("width", this.selectionWidth)
            this.selectionHandleLeft.setAttribute("x", this.selectionX - 5)
            this.selection.setAttribute("x", this.selectionX)
            this.selectionHandleRight.setAttribute("x", this.selectionX + this.selectionWidth - 5)
            this.startX = e.clientX
            graph.zoom(this.selectionX, this.selectionX + this.selectionWidth)
        }.bind(this)

        this.HandleRightDrag = function(e) {
            if (this.selectionWidth + e.clientX - this.startX + this.selectionX  <= this.maxWidth) {
                this.selectionWidth = this.selectionWidth + e.clientX - this.startX
            }
            else {
                this.selectionWidth = this.maxWidth - this.selectionX
            }
            this.selection.setAttribute("width", this.selectionWidth)
            this.selectionHandleRight.setAttribute("x", this.selectionX + this.selectionWidth - 5)
            this.startX = e.clientX
            graph.zoom(this.selectionX, this.selectionX + this.selectionWidth)
        }.bind(this)

        this.selectionDrag = function(e) {
            e.preventDefault()
            if (this.selectionX + e.clientX - this.startX >= 0 && this.selectionWidth + e.clientX - this.startX + this.selectionX  <= this.maxWidth) {
                this.selectionX = this.selectionX + e.clientX - this.startX
            }
            this.selectionHandleLeft.setAttribute("x", this.selectionX - 5)
            this.selection.setAttribute("x", this.selectionX)
            this.selectionHandleRight.setAttribute("x", this.selectionX + this.selectionWidth - 5)
            this.startX = e.clientX
            graph.zoom(this.selectionX, this.selectionX + this.selectionWidth)
        }.bind(this)
        this.background = svg("rect", {width:this.maxWidth, height:40, y:dy, style:"fill:#e8e8e8"})
        this.container = svg("g.crosshair", {
            onmousedown:function(e){
                this.startX = e.clientX
                this.selectionX = e.clientX
                this.selectionWidth = 0
                this.selectionDisplayed = false
                this.container.addEventListener("mousemove", this.backgroundDrag)
                this.update()
            }.bind(this),
            onmouseleave:function(e) {
                this.container.removeEventListener("mousemove", this.HandleLeftDrag)
                this.container.removeEventListener("mousemove", this.HandleRightDrag)
            }.bind(this),
            ontouchend:function(e) {
                this.container.removeEventListener("touchmove", this.backgroundDrag)
                if(this.containerDrag) {
                    this.selectionDisplayed = true
                    this.containerDrag = false
                    this.update()
                    return
                } 
                else {
                    setChildren(this.el,[ this.container])
                     graph.zoom(0, this.maxWidth)
                }
            }.bind(this),
            onmouseup:function(e) {
                this.container.removeEventListener("mousemove", this.backgroundDrag)
                if(this.containerDrag) {
                    this.selectionDisplayed = true
                    this.containerDrag = false
                    this.update()
                    return
                } 
                else {
                    setChildren(this.el,[ this.container])
                     graph.zoom(0, this.maxWidth)
                }
            }.bind(this)}, this.background)
        this.el = svg("g",{transform:"translate(50,0)"}, this.container)
    }
    update() {
        this.selection = svg("rect"+(this.selectionDisplayed?".move":""), {style:"fill:#c8c8c8",x:this.selectionX,y:this.dy,width:this.selectionWidth, height:40,
            onmousedown:function(e){
                console.log(e.type)
                e.stopPropagation()
                this.selection.addEventListener("mousemove", this.selectionDrag)
                this.startX = e.clientX
            }.bind(this),
            onmouseleave:function(e){
                e.stopPropagation()
                this.selection.removeEventListener("mousemove", this.selectionDrag)
            }.bind(this),
            onmouseup:function(e){
                if(!this.containerDrag) e.stopPropagation()  
                this.selection.removeEventListener("mousemove", this.selectionDrag)
                this.container.removeEventListener("mousemove", this.backgroundDrag)
                this.selectionDisplayed = true
                this.update()
            }.bind(this)})
        this.selectionHandleLeft = svg("rect", {x:this.selectionX - 5, y:this.dy - 3,width:10,dx:-5,height:46,style:"opacity:0;cursor: e-resize;",
            onmousedown:function(e){
                e.stopPropagation()
                this.container.addEventListener("mousemove", this.HandleLeftDrag)
                this.startX = e.clientX
            }.bind(this),
            onmouseup:function(e){
                e.stopPropagation()
                this.container.removeEventListener("mousemove", this.HandleLeftDrag)
                this.startX = e.clientX
            }.bind(this)})
        this.selectionHandleRight = svg("rect", {x:this.selectionX + this.selectionWidth - 5, y:this.dy - 3,width:10,dx:-5,height:46,style:"opacity:0;cursor: e-resize;",
        onmousedown:function(e){
            e.stopPropagation()
            this.container.addEventListener("mousemove", this.HandleRightDrag)
            this.startX = e.clientX
        }.bind(this),
        onmouseup:function(e){
            e.preventDefault()
            this.container.removeEventListener("mousemove", this.HandleRightDrag)
            this.startX = e.clientX
        }.bind(this)})
        if(this.selectionDisplayed) {
            setChildren(this.container, [this.background, this.selection, this.selectionHandleLeft, this.selectionHandleRight])
            setChildren(this.el,[this.container])
            // setChildren(this.el,[ this.background, this.selection, this.selectionHandleLeft, this.selectionHandleRight])
        }
        else {
            setChildren(this.container, [this.background, this.selection])
            setChildren(this.el,[this.container])
        }
        graph.zoom(this.selectionX, this.selectionX + this.selectionWidth)
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
