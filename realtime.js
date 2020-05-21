const { el, svg, mount, text, list, setChildren } = redom

dataset = []

/* Charting Components */
class Line {
    constructor() {
        this.el = svg("path.", {style:"stroke-width:2;fill:none;stroke:black;"})
    }
    update(data) {
        this.el.setAttribute("clip-path", 'url(#clip)')
        this.el.setAttribute("d",data)
        //this.el.setAttribute("style","fill:none;stroke:"+data[1]+";")
    }
}

class XTicks {
    constructor() {
        this.line, this.text 
        this.lastValue = null, this.stepSize = 0, this.lastStep
        this.el = svg("g.pathAnimate", {style:"opacity:1;"}) 
    }
    update(data) {
        if(data[1] != this.lastValue && this.lastValue != null) {
            this.el.classList.add("notransition")
            console.log(data[0] + 14)
            this.el.setAttribute("transform", "translate(" + (data[0] + this.stepSize) + ",0)")
            this.lastStep = data[0]
        }
        else {
            this.stepSize = this.lastStep - data[0]
            this.lastStep = data[0]
            this.lastValue = data[1]
        }
        setTimeout(function () {
            this.el.classList.remove("notransition")
            this.el.setAttribute("transform", "translate(" + data[0] + ",0)")
            }.bind(this), 1)
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
    constructor(x, y, width, height) {
        this.el = svg("defs", svg("clipPath", {id:"clip"}, svg("rect",{x:x, y:y, width:width, height:height})))
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
        this.multiLine = list(svg("g.lineAnimate"), Line)
        this.xAxis = new Axis("x", xAxisOffset, (margin.left + 0.5), (width - margin.right - 0.5))
        this.x2Axis = new Axis("x", (height - margin.bottom +70), (margin.left + 0.5), (width - margin.right - 0.5))
        this.yAxis = new Axis("y", yAxisOffset, (height - margin.bottom+ 0.5), (margin.top - 0.5))
        this.clipPath = new ClipPath(this.margin().left, this.margin().top, this.width()-this.margin().left-this.margin().right, this.height()-this.margin().top-this.margin().bottom)
        this.el = svg("svg", {id:"graph", width:960, height:500})
        setChildren(this.el, [this.clipPath, this.multiLine, this.xAxis, this.yAxis, this.x2Axis])
    }
    update() {
        let xRange = dataset[dataset.length-1][0] - dataset[0][0]
        let length = dataset.length
        let yMax = d3.max(dataset, function(d){return d[1]})
        if(this.firstUpdate){
            this.firstupdate = false
            this.xScale.domain([dataset[0][0]-(50000 - xRange), dataset[length-1][0]])
            this.x2Scale.domain(this.xScale.domain())
            this.yScale.domain([0, yMax])
        }
        this.multiLine.el.classList.add("notransition")
        this.multiLine.el.setAttribute("transform","translate(0,0)")
        //Prepare scales and update SVG size
        this.multiLine.update([d3.line().x(d => this.xScale(d[0])).y(d => this.yScale(d[1]))(dataset)])
        this.multiLine.el.removeAttribute("transform")
        if(xRange < 50000) {
            this.xScale.domain([dataset[0][0]-(50000 - xRange), dataset[length-1][0]])
            this.x2Scale.domain(this.xScale.domain())
        }
        else {
            this.xScale.domain([dataset[length-1][0]-50000, dataset[length-1][0]])
            this.x2Scale.domain(this.xScale.domain())
        }
        this.yScale.domain([0, yMax])
        if (length > 1) {
            setTimeout(function () {
            this.multiLine.el.classList.remove("notransition")
           this.multiLine.el.setAttribute("transform", "translate(" + -(this.xScale(dataset[1][0]) - this.xScale(dataset[0][0])) + ",0)")
            }.bind(this), 1)
            
         }
        this.xAxis.update(this.xScale.ticks().map(function(d,i){return [this.xScale(d),d.toTimeString().split(' ')[0]]}.bind(this)))
        this.x2Axis.update(this.x2Scale.ticks().map(function(d){return [this.x2Scale(d),d.toTimeString().split(' ')[0]]}.bind(this)))
        this.yAxis.update(this.yScale.ticks().map(function(d){return [this.yScale(d) ,d]}.bind(this)))

    }
}


let graph = new LineChart()
let total = el("div", graph)

mount(document.body, total);

/* Random Data Generator */
setInterval( function() {
    dataset.push([Math.round((new Date()).getTime()), Math.floor(Math.random()*100 + 1)])
    graph.update()
    if(dataset.length >= 51) dataset.shift()
}, 1000)
/* End of Data Generator */