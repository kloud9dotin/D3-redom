const { el, svg, mount, list, setChildren } = redom

var data = [
    {x: 0, y: 10}, 
    {x: 10, y: 40}, 
    {x: 20, y: 30}, 
    {x: 30, y: 70}, 
    {x: 40, y: 0}
  ]

class LineChart {
    constructor() {
        var margin = {top: 10, right: 20, bottom: 110, left: 30},
            margin2 = {top: 230, right: 20, bottom: 30, left: 30},
            width = 500,
            height = 300,
            height2 = 40,
            xaxis_offset = 280,
            yaxis_offset = 30,
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
        this.auto_resize = function(value) {
            if (!arguments.length) return auto_resize
            auto_resize = value
        }
        this.el = svg("svg", {id:"graph", width:0, height:0})
            
    }
    update() {
        if(this.auto_resize() > 0) {
        let width = this.el.parentElement.clientWidth
        this.width(width/2)
        this.height(width * 0.28)
        this.xaxis_offset(width * 0.28 - 110)
        this.margin2({top: this.height() - 70, right: 20, bottom: 30, left: 30})
        }

        //Prepare scales and update SVG size
        var x = d3.scaleLinear().domain([0, d3.max(data, d => d.x)]).range([this.margin().left, this.width() - this.margin().right])
        var x2 = d3.scaleLinear().domain([0, d3.max(data, d => d.x)]).range([this.margin().left, this.width() - this.margin().right])
        var y = d3.scaleLinear().domain([0, d3.max(data, d => d.y)]).range([this.height() - this.margin().bottom, this.margin().top])
        this.el.setAttribute("width", this.width())
        this.el.setAttribute("height", this.height())

        //Import components for Chart
        this.line = new Line()
        this.x_ticks = list(svg("g"), XTicks)
        this.x_ticks2 = list(svg("g"), XTicks)
        this.y_ticks = list(svg("g"), YTicks)
        this.brushRectangle = new BrushRectangle(this.height()-70,( x.range()[1] - x.range()[0]), 40, 30, this)

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
        this.line.update(d3.line().x(d => x(d.x)).y(d => y(d.y))(data))
        this.x_ticks.update(x.ticks().map(function(d){return [x(d),d]}))
        this.x_ticks2.update(x2.ticks().map(function(d){return [x2(d),d]}))
        this.y_ticks.update(y.ticks().map(function(d){return [y(d) ,d]}))
        setChildren(this.el, [svg("g", {style:"clip-path:inset(0px 0px 0px 0px)"}, this.line), this.x_axis, this.y_axis, this.brushRectangle, this.x_axis2])
    }
    zoom(data0, data1) {
        var x = d3.scaleLinear().domain([0, d3.max(data, d => d.x)]).range([this.margin().left, this.width() - this.margin().right])
        data0 = x.invert(data0 + 30)
        data1 = x.invert(data1 + 30)
        var x = d3.scaleLinear().domain([data0, data1]).range([this.margin().left, this.width() - this.margin().right])
        var y = d3.scaleLinear().domain([0, d3.max(data, d => d.y)]).range([this.height() - this.margin().bottom, this.margin().top])
        this.line.update(d3.line().x(d => x(d.x)).y(d => y(d.y))(data))
        this.x_ticks.update(x.ticks().map(function(d){return [x(d),d]}))
        this.y_ticks.update(y.ticks().map(function(d){return [y(d) ,d]}))

    }
}

class BrushRectangle {
    constructor(dy, width, height, dx, graph) {
        this.dy = dy
        this.maxWidth = width
        this.startX = 0
        this.drag = false
        this.selectionWidth, this.selectionX
        this.backgroundDrag = function(e) {
            this.drag = true
        }.bind(this)

        this.HandleLeftDrag = function(e) {
            e.preventDefault()
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
            e.preventDefault()
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
            console.log("here")
            if (this.selectionX + e.clientX - this.startX >= 0 && this.selectionWidth + e.clientX - this.startX + this.selectionX  <= this.maxWidth) {
                this.selectionX = this.selectionX + e.clientX - this.startX
            }
            this.selectionHandleLeft.setAttribute("x", this.selectionX - 5)
            this.selection.setAttribute("x", this.selectionX)
            this.selectionHandleRight.setAttribute("x", this.selectionX + this.selectionWidth - 5)
            this.startX = e.clientX
            graph.zoom(this.selectionX, this.selectionX + this.selectionWidth)
        }.bind(this)

        this.background = svg("rect", {width:this.maxWidth, height:40, y:dy, style:"fill:#e8e8e8",
            onmousedown:function(e){
                this.startX = e.clientX
                this.background.addEventListener("mousemove", this.backgroundDrag)
            }.bind(this),
            onmouseup:function(e) {
                this.background.removeEventListener("mousemove", this.backgroundDrag)
                if(this.drag) {
                    console.log(this.startX, e.clientX)
                    this.selectionWidth = Math.abs(this.startX - e.clientX)
                    this.selectionX = Math.min(this.startX, e.clientX) - 30
                    console.log(this.selectionWidth, this.selectionX)
                    this.update()
                    return
                } 
            }.bind(this)})
        this.el = svg("g",{transform:"translate(30,0)"}, this.background)

    }
    update() {
        this.selection = svg("rect", {style:"fill:#c8c8c8",x:this.selectionX,y:this.dy,width:this.selectionWidth, height:40,
            onmousedown:function(e){
                e.preventDefault()
                this.selection.addEventListener("mousemove", this.selectionDrag)
                this.startX = e.clientX
            }.bind(this),
            onmouseleave:function(e){
                e.preventDefault()
                this.selection.removeEventListener("mousemove", this.selectionDrag)
            }.bind(this),
            onmouseup:function(e){
                e.preventDefault()
                this.selection.removeEventListener("mousemove", this.selectionDrag)
                this.startX = e.clientX
            }.bind(this)})
        this.selectionHandleLeft = svg("rect", {x:this.selectionX - 5, y:this.dy - 3,width:10,dx:-5,height:46,style:"opacity:0;cursor: e-resize;",
            onmousedown:function(e){
                e.preventDefault()
                this.selectionHandleLeft.addEventListener("mousemove", this.HandleLeftDrag)
                this.startX = e.clientX
            }.bind(this),
            onmouseleave:function(e){
                e.preventDefault()
                this.selectionHandleLeft.removeEventListener("mousemove", this.HandleLeftDrag)
            }.bind(this),
            onmouseup:function(e){
                e.preventDefault()
                this.selectionHandleLeft.removeEventListener("mousemove", this.HandleLeftDrag)
                this.startX = e.clientX
            }.bind(this)})
        this.selectionHandleRight = svg("rect", {x:this.selectionX + this.selectionWidth - 5, y:this.dy - 3,width:10,dx:-5,height:46,style:"opacity:0;cursor: e-resize;",
        onmousedown:function(e){
            e.preventDefault()
            this.selectionHandleRight.addEventListener("mousemove", this.HandleRightDrag)
            this.startX = e.clientX
        }.bind(this),
        onmouseleave:function(e){
            e.preventDefault()
            console.log("leaving")
            this.selectionHandleRight.removeEventListener("mousemove", this.HandleRightDrag)
        }.bind(this),
        onmouseup:function(e){
            e.preventDefault()
            this.selectionHandleRight.removeEventListener("mousemove", this.HandleRightDrag)
            this.startX = e.clientX
        }.bind(this)})
        setChildren(this.el,[ this.background, this.selection, this.selectionHandleLeft, this.selectionHandleRight])
        graph.zoom(this.selectionX, this.selectionX + this.selectionWidth)
    }
}

class Line {
    constructor() {
        this.el = svg("path", {style:"fill:none;stroke:#33c7ff;stroke-width:2;"})
    }
    update(data) {
        this.el.setAttribute("d",data)
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
        this.text = svg("text", {style:"fill:currentcolor;",y:9, dy:"0.71em"}, data[1])
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


let graph = new LineChart()
let total = el("div.w-100", graph, el("div.pa2", el("br"), el("h3", "docs"), el("p", "Use graph.<property>() to get the height of the graph and graph.<property>(x) to set height to x."),
    el("p", "Properties available are height,width, xaxis_offset, yaxis_offset, auto_resize. margin is a read-only property."),
    el("p", "Use graph.update() to update graph"),
    el("p", "To change values of plotted point edit variable data"),
    el("p", "Set auto_resize > 0 to enable and auto_resize = 0 to disable.(default = enabled)")))

mount(document.body, total);

graph.update()


window.onresize = function() {
    graph.update()
}
