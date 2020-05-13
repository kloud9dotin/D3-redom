const { el, svg, mount, list, setChildren } = redom

var categories = ["Ageing","Aids","Animal Welfare","Bird Flu","BSE","Coal Pits","EU","Countryside","Crime","Defence","Drug Abuse","Economy","Education","Farming","German Reunification","GM foods","Housing","Inflation/Prices","Inner Cities","Local Govt","Low Pay","Morality","NHS","Northern Ireland","Nuclear Power","Nuclear Weapons","Pensions","Fuel Prices","Environment","The Pound","Poverty/Inequality","Privatisation","Public Services","Immigration","Scots/Welsh Assembly","Taxation","Trade Unions","Transport","Tsunami","Unemployment"]
var colors = ["#48A36D",  "#56AE7C",  "#64B98C", "#72C39B", "#80CEAA", "#80CCB3", "#7FC9BD", "#7FC7C6", "#7EC4CF", "#7FBBCF", "#7FB1CF", "#80A8CE", "#809ECE", "#8897CE", "#8F90CD", "#9788CD", "#9E81CC", "#AA81C5", "#B681BE", "#C280B7", "#CE80B0", "#D3779F", "#D76D8F", "#DC647E", "#E05A6D", "#E16167", "#E26962", "#E2705C", "#E37756", "#E38457", "#E39158", "#E29D58", "#E2AA59", "#E0B15B", "#DFB95C", "#DDC05E", "#DBC75F", "#E3CF6D", "#EAD67C", "#F2DE8A"]
var visibility = [1,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,1]
class Line {
    constructor() {
        this.el = svg("path", {style:"fill:none;stroke:#33c7ff;stroke-width:2"})
    }
    update(data) { 
        if(data == null) {
            this.el.removeAttribute("d")
            return
        }
        this.el.setAttribute("d",data[0])
        this.el.setAttribute("clip-path", 'url(#clip2)')
        this.el.setAttribute("style","fill:none;stroke:"+data[1]+";")
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

class LineChart {
    constructor() {
        var margin = {top: 20, right: 200, bottom: 100, left: 50},
            margin2 = {top: 230, right: 20, bottom: 30, left: 30},
            width = 500,
            height = 300,
            height2 = 40,
            xaxis_offset = 280,
            yaxis_offset = 50,
            auto_resize = 1

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
        this.margin2 = function(value) {
            if (!arguments.length) return margin2
            margin2 = value
        }
        this.xaxis_offset = function(value) {
            if (!arguments.length) return xaxis_offset
            xaxis_offset = value
        }
        this.yaxis_offset = function(value) {
            if (!arguments.length) return yaxis_offset
            yaxis_offset = value
        }
        this.el = svg("svg", {id:"graph", width:0, height:0})
    }
    update() {
        let width = this.el.parentElement.clientWidth
        this.width(960)
        this.height(500/*width * 0.28*/)
        this.xaxis_offset(/*width * 0.28*/500 - 100)
        this.margin2({top: this.height() - 70, right: 20, bottom: 30, left: 30})
        
        //Prepare scales and update SVG size
        var x = d3.scaleTime().domain(d3.extent(dataset, function(d) { return Date.parse(d.date) })).range([this.margin().left, this.width() - this.margin().right])
        var x2 = d3.scaleTime().domain(d3.extent(dataset, function(d) { return Date.parse(d.date) })).range([this.margin().left, this.width() - this.margin().right])
        let activeCatagories = categories.filter(function(d,i){
            if (visibility[i] == 1) return d
        })
        
        let yMax = d3.max(dataset, function(d){
            let test = []
            for(let i = 0;i< activeCatagories.length; i++) {
                test.push(d[activeCatagories[i]])
            }
            return parseInt(d3.max(test))
        })
        var y = d3.scaleLinear().domain([0, yMax]).range([this.height() - this.margin().bottom, this.margin().top])
        this.el.setAttribute("width", this.width())
        this.el.setAttribute("height", this.height())

        //Import components for Chart
        this.multiLine = list(svg("g"), Line)
        this.x_ticks = list(svg("g"), XTicks)
        this.x_ticks2 = list(svg("g"), XTicks)
        this.y_ticks = list(svg("g"), YTicks)
        this.brushRectangle = new BrushRectangle(this.height()-70,( x.range()[1] - x.range()[0]), 40, 30, this)
        this.clippath = svg("defs", svg("clipPath", {id:"clip2"}, svg("rect",{x:this.margin().left,y:this.margin().top,width:this.width()-this.margin().left-this.margin().right,height:this.height()-this.margin().top-this.margin().bottom})))

        //Axis for chart
        this.x_axis = svg("g" , {transform:"translate(0,"+ this.xaxis_offset()+")",style:"text-anchor:middle"}, 
        svg("path", {style:"fill:none;stroke:currentcolor;stroke-width:1;",d:"M" + (this.margin().left + 0.5) + ",0.5H" + (this.width() - this.margin().right-0.5) }),
        this.x_ticks)
        this.x_axis2 = svg("g" , {transform:"translate(0,"+ (this.height() - this.margin2().bottom) +")",style:"text-anchor:middle"}, 
        svg("path", {style:"fill:none;stroke:currentcolor;stroke-width:1;",d:"M" + (this.margin().left + 0.5) + ",0.5H" + (this.width() - this.margin().right-0.5) }),
        this.x_ticks2)
        this.y_axis = svg("g", {transform:"translate("+ this.yaxis_offset()+",0)",style:"text-anchor:end"}, 
        svg("path", {style:"fill:none;stroke:currentcolor;stroke-width:1;",d:"M0.5," + (this.height() - this.margin().bottom+ 0.5) + "V" + (this.margin().top - 0.5) }),
        this.y_ticks)

        //Update line and ticks
        let lineData = visibility.map(function(d,i){if(d == 1) { 
            return [d3.line().x(d => x(Date.parse(d.date))).y(d => y(d[categories[i]]))(dataset), colors[i]]
        } else return null
        })
        this.multiLine.update(lineData)
        this.x_ticks.update(x.ticks().map(function(d){return [x(d),d]}))
        this.x_ticks2.update(x2.ticks().map(function(d){return [x2(d),d]}))
        this.y_ticks.update(y.ticks().map(function(d){return [y(d) ,d]}))
        this.legends = list(svg("g"), legend)
        let listData = []
        for (let i=0;i<40;i++) {
            listData.push(i)
        }
        this.legends.update(listData)
        setChildren(this.el, [this.legends, this.clippath, this.multiLine, this.x_axis, this.y_axis, this.brushRectangle, this.x_axis2])
    }
    zoom(data0, data1) {
        var x = d3.scaleTime().domain(d3.extent(dataset, function(d) { return Date.parse(d.date) })).range([this.margin().left, this.width() - this.margin().right])
        data0 = x.invert(data0 + 50)
        data1 = x.invert(data1 + 50)
        var x = d3.scaleLinear().domain([data0, data1]).range([this.margin().left, this.width() - this.margin().right])
        let activeCatagories = categories.filter(function(d,i){
            if (visibility[i] == 1) return d
        })
        
        let yMax = d3.max(dataset, function(d){
            let test = []
            for(let i = 0;i< activeCatagories.length; i++) {
                test.push(d[activeCatagories[i]])
            }
            return parseInt(d3.max(test))
        })
        var y = d3.scaleLinear().domain([0, yMax]).range([this.height() - this.margin().bottom, this.margin().top])
        let lineData = visibility.map(function(d,i){if(d == 1) {
            return [d3.line().x(d => x(Date.parse(d.date))).y(d => y(d[categories[i]]))(dataset), colors[i]]
        }else return null
        }) 
        this.multiLine.update(lineData)
        this.x_ticks.update(x.ticks().map(function(d){return [x(d),new Date(d)]}))
        this.y_ticks.update(y.ticks().map(function(d){return [y(d) ,d]}))
    }
}

class BrushRectangle {
    constructor(dy, width, height, dx, graph) {
        this.dy = dy
        this.maxWidth = width
        this.selectionDisplayed = false
        this.backgroundStartX = null
        this.startX = 0
        this.drag = false
        this.containerDrag = false
        this.selectionWidth = 0, this.selectionX = 0
        this.handleClicked = false
        this.backgroundDrag = function(e) {
            this.drag = true
            this.containerDrag = true
            this.selectionWidth = Math.abs(this.startX - e.clientX-5)
            this.selectionX = Math.min(this.startX, e.clientX) - 30
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
                this.drag = false
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
window.onresize = function() {
    graph.update()
}