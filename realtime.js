const { el, svg, mount, text, list, setChildren } = redom

dataset = []

/* Charting Components */
class Line {
    constructor() {
        this.el = svg("path", {style:"stroke-width:2;fill:none;stroke:black;"})
    }
    update(data) {
        this.el.setAttribute("d",data)
        //this.el.setAttribute("style","fill:none;stroke:"+data[1]+";")
    }
}

class XTicks {
    constructor() {
        this.line, this.text 
        this.lastValue = null, this.stepSize = 0, this.lastStep = 0
        this.el = svg("g.pathAnimate", {style:"opacity:1;"}) 
    }
    update(data) {
        if(data[1] != this.lastValue && this.lastValue != null) {
            this.el.classList.add("notransition")
            this.el.setAttribute("transform", "translate(" + (data[0] + this.stepSize) + ",0)")
            document.body.offsetHeight
            this.el.classList.remove("notransition")
            this.lastStep = data[0]
        }
        else {
            this.stepSize = this.lastStep - data[0]
            this.lastStep = data[0]
            this.lastValue = data[1]
        }
            this.el.setAttribute("transform", "translate(" + data[0] + ",0)")
        this.lastValue = data[1]
        this.line = svg("line", {style:"stroke:currentcolor;",y2:"6"}) 
        this.text = svg("text", {style:"fill:currentcolor;",y:9, dy:"0.71em"}, data[1])
        setChildren(this.el, [this.line, this.text])
    }
}

class YTicks {
    constructor() {
        this.line, this.text
        this.el = svg("g.pathAnimate", {style:"opacity:1;"}) 
    }
    update(data) {
        this.el.setAttribute("transform", "translate(0," + data[0] + ")")
        this.line = svg("line", {style:"stroke:currentcolor;",x2:"-6"}) 
        this.text = svg("text", {style:"fill:currentcolor;",x:-15, dy:"0.32em"}, data[1])
        setChildren(this.el, [this.line, this.text])
    }
}

class Axis {
    constructor(direction, offset, start, end) {
        this.isXaxis = direction == "x"
        this.ticks = this.isXaxis ? list(svg("g"), XTicks) : list(svg("g"), YTicks)
        if(this.isXaxis) {
            this.path = svg("path", {style:"fill:none;stroke:currentcolor;stroke-width:1;",d:"M" + start + ",0.5H" + end })
        }
        else {
            this.path = svg("path", {style:"fill:none;stroke:currentcolor;stroke-width:1;",d:"M0.5," + start + "V" + end })
        }
        this.el = svg("g" , {transform:(this.isXaxis?"translate(0,"+ offset+")":"translate("+ offset +",0)"),style:"text-anchor:middle"}, this.path, this.ticks)
    }
    update(data) {
        this.ticks.update(data)
    }

}

class ClipPath {
    constructor(id, x, y, width, height) {
        this.el = svg("defs", svg("clipPath", {id:id}, svg("rect",{x:x, y:y, width:width, height:height})))
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
        this.firstUpdate = true 
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
        //Prepare scale for graph
        this.xScale = d3.scaleTime().range([margin.left, width - margin.right])
        this.x2Scale = d3.scaleTime().range([margin.left, width - margin.right])
        this.yScale = d3.scaleLinear().range([this.height() - this.margin().bottom, this.margin().top])
        //import components for graph
        this.multiLine = list(svg("g.pathAnimate"), Line)
        this.xAxis = new Axis("x", xAxisOffset, (margin.left + 0.5), (width - margin.right - 0.5))
        this.x2Axis = new Axis("x", (height - margin.bottom +70), (margin.left + 0.5), (width - margin.right - 0.5))
        this.yAxis = new Axis("y", yAxisOffset, (height - margin.bottom+ 0.5), (margin.top - 0.5))
        this.clipPath = new ClipPath("lineClip", this.margin().left, this.margin().top, this.width()-this.margin().left-this.margin().right, this.height()-this.margin().top-this.margin().bottom)
        this.xAxisClip = new ClipPath("axisClip", this.margin().left, this.height()-this.margin().bottom, this.width()-this.margin().left-this.margin().right, this.margin().bottom)
        this.conatiner = svg("g", this.multiLine)
        this.xAxisConatiner = svg("g", this.xAxis, this.x2Axis)
        this.el = svg("svg", {id:"graph", width:960, height:500})
        this.brushRectangle = new BrushRectangle("X",this.height()-70,( this.xScale.range()[1] - this.xScale.range()[0]), 40, 50, this)
        this.lowerRange = 0, this.upperRange = this.xScale.range()[1] - this.xScale.range()[0]
        setChildren(this.el, [this.clipPath, this.xAxisClip,this.conatiner, this.xAxisConatiner, this.brushRectangle,this.yAxis,])
        this.conatiner.setAttribute("clip-path", 'url(#lineClip)')
        this.xAxisConatiner.setAttribute("clip-path", 'url(#axisClip)')
    }
    update() {
        let length = dataset.length
        //let yMax = d3.max(dataset, function(d){return d[1]})
        if(this.firstUpdate){
            this.firstUpdate = false
            this.xScale.domain([dataset[0][0]-51000, dataset[length-1][0]-1000])
            this.x2Scale.domain(this.xScale.domain())
            this.yScale.domain([0, 100])
        }
        this.multiLine.el.classList.add("notransition")
        this.multiLine.el.removeAttribute("transform","translate(0,0)")
        //Prepare scales and update SVG size
        this.multiLine.update([d3.line().x(d => this.xScale(d[0])).y(d => this.yScale(d[1]))(dataset)])
        this.multiLine.el.removeAttribute("transform")
        let xDomain = this.x2Scale.domain()
        this.x2Scale.domain([xDomain[0].getTime()+1000, xDomain[1].getTime()+1000])
        let lowerDomain = this.x2Scale.invert(this.lowerRange + this.margin().left)
        let upperDomain = this.x2Scale.invert(this.upperRange + this.margin().left)
        this.xScale.domain([lowerDomain, upperDomain])
        this.yScale.domain([0, 100])
        document.body.offsetHeight
        this.multiLine.el.classList.remove("notransition")
        let oneSecDisplacement = this.xScale(1000) - this.xScale(0)
        this.multiLine.el.setAttribute("transform", "translate(" + -(oneSecDisplacement) + ",0)")
        this.xAxis.update(this.xScale.ticks().map(function(d,i){return [this.xScale(d),d.toTimeString().split(' ')[0]]}.bind(this)))
        this.x2Axis.update(this.x2Scale.ticks().map(function(d){return [this.x2Scale(d),d.toTimeString().split(' ')[0]]}.bind(this)))
        this.yAxis.update(this.yScale.ticks().map(function(d){return [this.yScale(d) ,d]}.bind(this)))

    }
    zoom(lowerDomain,upperDomain, UpdateLineInstantly) {
        this.lowerRange = lowerDomain
        this.upperRange = upperDomain
        var margin = this.margin()
        lowerDomain = this.x2Scale.invert(lowerDomain + margin.left)
        upperDomain = this.x2Scale.invert(upperDomain + margin.left)
        this.xScale.domain([lowerDomain, upperDomain])
        if (UpdateLineInstantly) {
            this.multiLine.update([d3.line().x(d => this.xScale(d[0])).y(d => this.yScale(d[1]))(dataset)])
        }
        else {
            setTimeout(function(lower = lowerDomain, upper = upperDomain){
                if (lowerDomain == lower && upperDomain == upper) {
                    this.multiLine.update([d3.line().x(d => this.xScale(d[0])).y(d => this.yScale(d[1]))(dataset)])
                }
            }.bind(this) ,500)}
        this.xAxis.update(this.xScale.ticks().map(function(d,i){return [this.xScale(d),d.toTimeString().split(' ')[0]]}.bind(this)))
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

mount(document.body, total);

/* Random Data Generator */
setInterval( function() {
    dataset.push([Math.round((new Date()).getTime()), Math.floor(Math.random()*100 + 1)])
    graph.update()
    if(dataset.length >= 52) dataset.shift()
}, 1000)
/* End of Data Generator */