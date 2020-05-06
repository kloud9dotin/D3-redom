const { el, svg, router, mount, list, text, setChildren } = redom

var data = [
    {x: 0, y: 10}, 
    {x: 10, y: 40}, 
    {x: 20, y: 30}, 
    {x: 30, y: 70}, 
    {x: 40, y: 0}
  ]

var lineFunction = d3.svg.line()
  .x(function(d) { return d.x; })
  .y(function(d) { return d.y; })
  .interpolate("linear");

class LineChart {
    constructor() {
        var margin = {top: 10, right: 20, bottom: 20, left: 30},
            width = 500,
            height = 300,
            xaxis_offset = 280,
            yaxis_offset = 30
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
        this.el = svg("svg", {width:0, height:0})
            
    }
    update() {
        var x = d3.scale.linear().domain([0, d3.max(data, d => d.x)]).range([this.margin().left, this.width() - this.margin().right])
        var y = d3.scale.linear().domain([0, d3.max(data, d => d.y)]).range([this.height() - this.margin().bottom, this.margin().top])
        var x_axis = d3.svg.axis().orient("bottom").scale(x)
        var y_axis = d3.svg.axis().orient("left").scale(y)
        this.el.setAttribute("width", this.width())
        this.el.setAttribute("height", this.height())
        this.line = svg("path", {style:"fill:none;stroke:#33c7ff;stroke-width:2;",d:d3.svg.line().x(d => x(d.x)).y(d => y(d.y))(data)})
        this.x_axis = svg("g" , {transform:"translate(0,"+ this.xaxis_offset()+")"})
        this.y_axis = svg("g", {transform:"translate("+ this.yaxis_offset()+",0)"})
        setChildren(this.el, [this.line, this.x_axis, this.y_axis])
        d3.select(this.x_axis).call(x_axis)
        d3.select(this.y_axis).call(y_axis)
    }
}


let graph = new LineChart()
let total = el("div", graph, el("div.pa2", el("br"), el("h3", "docs"), el("p", "Use graph.<property>() to get the height of the graph and graph.<property>(x) to set height to x."),
    el("p", "Properties available are height,width, xaxis_offset, yaxis_offset. margin is a read-only property."),
    el("p", "Use graph.update() to update graph"),
    el("p", "To change values of plotted point edit variable data")))

mount(document.body, total);
graph.update()
