const { el, svg, mount, text, list, setChildren, setStyle, setAttr } = redom

const model = {
    state: {
        updateGraph: true,
        visibility: [1,1]
    },
    data: {
        numOfCategories: 2,
        categories: ["Port 443", "Port 80"],
        dataset: [],
        pending: [],
    }
}

/* Charting Components */
class Line {
    constructor() {
        this.el = svg("path", {style:"stroke-width:2;fill:none;stroke:black;"})
        setStyle(this.el, {transition : "all 1s linear"}) 
    }
    update(data) {
        setAttr(this.el, {d:data[0]})
        setStyle(this.el,{fill:"none",stroke:data[1],"stroke-width":"1.5px"})
    }
}

class XTicks {
    constructor() {
        this.line, this.text 
        this.lastValue = null, this.stepSize = 0, this.lastStep = 0
        this.el = svg("g")
        setStyle(this.el, {transition : "all 1s linear"}) 
    }
    update(data) {
        this.stepSize = data[2]
        if(data[1] != this.lastValue && this.lastValue != null) {
            setStyle(this.el, {transition : "none"} )
            setAttr(this.el, {transform:"translate(" + (data[0] + this.stepSize) + ",0)"})
            document.body.offsetHeight
            setStyle(this.el, {transition : "all 1s linear"})
        }
        setAttr(this.el, {transform:"translate(" + data[0] + ",0)"})
        this.lastStep = data[0]
        this.lastValue = data[1]
        this.line = svg("line", {style:"stroke:currentcolor;",y2:"6"}) 
        this.text = svg("text.f7-ns", {style:"fill:currentcolor;",y:9, dy:"0.71em"}, data[1])
        setChildren(this.el, [this.line, this.text])
    }
}

class YTicks {
    constructor() {
        this.line, this.text
        this.el = svg("g.pathAnimate", {style:"opacity:1;"}) 
    }
    update(data) {
        setAttr(this.el, {transform: "translate(0," + data[0] + ")"})
        this.line = svg("line", {style:"stroke:currentcolor;",x2:"-6"}) 
        this.text = svg("text.f7-ns", {style:"fill:currentcolor;",x:-15, dy:"0.32em"}, data[1])
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
        this.rect = svg("rect",{x:x, y:y, width:width, height:height})
        this.el = svg("defs",  svg("clipPath", {id:id}, this.rect))
    }
}

class Legends {
    constructor(notifyParent) {
        this.index = null
        this.checkbox = svg("rect", {width:10,height:10})
        this.label = svg("text.f7-ns",{y:8,x:15}) 
        this.el = svg("g.legend", this.checkbox, this.label)
        this.checkbox.addEventListener("click", function() {notifyParent("toggelVisibility", this.index)}.bind(this))
    }
    update(data, index) {
        this.index = index
        this.label.textContent = data[2]
        setAttr(this.checkbox, {fill: data[1]})
        setAttr(this.el, {transform: "translate(" + data[0][0] + "," + data[0][1] + ")"})
    }
}

class LineChart {
    constructor(refreshPeriod) {
        let margin = {top: 20, right: 100, bottom: 100, left: 30},
            width = 640,
            height = 360,
            xAxisOffset = 540,
            yAxisOffset = margin.left
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
        this.xAxisOffset = function(value) {
            if (!arguments.length) return xAxisOffset
            xAxisOffset = value
        }
        this.yAxisOffset = function(value) {
            if (!arguments.length) return yAxisOffset
            yAxisOffset = value
        }

        //initalize component variables
        this.lowerRange = 0 
        this.upperRange = width - margin.left - margin.right
        this.firstUpdate = true 
        this.refreshPeriod = refreshPeriod || 1000
        this.color = d3.scaleLinear().domain([0,model.data.numOfCategories - 1]).range(['#0000FF', '#FF0000']);

        //Prepare scale for graph
        this.xScale = d3.scaleTime().range([margin.left, width - margin.right])
        this.selectionScale = d3.scaleTime().range([margin.left, width - margin.right])
        this.yScale = d3.scaleLinear().range([this.height() - this.margin().bottom, this.margin().top])

        //import components for graph
        this.multiLine = list(svg("g", {style:"transition: all 1s linear"}), Line)
        this.xAxis = new Axis("x", xAxisOffset, (margin.left + 0.5), (width - margin.right - 0.5))
        this.selectionAxis = new Axis("x", (height - margin.bottom +70), (margin.left + 0.5), (width - margin.right - 0.5))
        this.yAxis = new Axis("y", yAxisOffset, (height - margin.bottom+ 0.5), (margin.top - 0.5))
        this.clipPath = new ClipPath("lineClip", this.margin().left, this.margin().top, this.width()-this.margin().left-this.margin().right, this.height()-this.margin().top-this.margin().bottom)
        this.xAxisClip = new ClipPath("axisClip", this.margin().left, this.height()-this.margin().bottom, this.width()-this.margin().left-this.margin().right, this.margin().bottom)
        this.conatiner = svg("g", {"clip-path": "url(#lineClip)"}, this.multiLine)
        this.xAxisConatiner = svg("g", {"clip-path": "url(#axisClip)"}, this.xAxis, this.selectionAxis)
        this.el = svg("svg")
        this.selectionRectangle = new SelectionRectangle("X",this.height()-70,( this.xScale.range()[1] - this.xScale.range()[0]), 40, 50, this.onChildEvent.bind(this)/*this.onChildEvent("zoom")*/)
        this.legends = list(svg("g"), Legends, null, this.onChildEvent.bind(this))

        //set children to the main component 
        setChildren(this.el, [this.clipPath, this.xAxisClip, this.conatiner, this.xAxisConatiner, this.selectionRectangle, this.yAxis, this.legends])

        let lastGraphUpdateTime = 0
        let updateGraph = function () {
            if (lastGraphUpdateTime != 0) {
                if(Math.round((new Date()).getTime()) - lastGraphUpdateTime > this.refreshPeriod) {
                    this.update()
                    lastGraphUpdateTime =  Math.round((new Date()).getTime()) 
                }
            }
            else lastGraphUpdateTime =  Math.round((new Date()).getTime()) 
            requestAnimationFrame(updateGraph)
        }.bind(this)
        
        requestAnimationFrame(updateGraph)
    }
    update() {
        let length = model.data.dataset.length
        if(length == 0 ) return

        //set scales if first update
        if(this.firstUpdate){
            this.resize()
            setAttr(this.el, {width: this.width(), height:this.height()})
            this.firstUpdate = false
            this.xScale.domain([model.data.dataset[0][0]-51000, model.data.dataset[length-1][0]-1000])
            this.selectionScale.domain(this.xScale.domain())
            this.yScale.domain([0, 100])
            this.lastDataTime = model.data.dataset[length-1][0]
        }

        //remove any transforms
        this.multiLine.el.style = "transition: none"
        this.multiLine.el.removeAttribute("transform","translate(0,0)")

        //Update line and legend
        let legendData = []
        let lineData = []
        let xPosition = this.width() - this.margin().right/3 - 30
        let Yposition = this.height() / 10
        for (let i = 0; i < model.data.numOfCategories; i++) {
            let index = i +1
            if (model.state.visibility[i]) {
                legendData.push([[xPosition, index * Yposition ],this.color(i),model.data.categories[i]])
                lineData.push([d3.line().x(d => this.xScale(d[0])).y(d => this.yScale(d[index]))(model.data.dataset), this.color(i)])
            }
            else {
                legendData.push([[xPosition, index * Yposition ],"#c8c8c8",model.data.categories[i]])
            }
        }
        this.legends.update(legendData)
        this.multiLine.update(lineData)
        this.multiLine.el.removeAttribute("transform")

        //update x-axis scales
        this.selectionScale.domain([model.data.dataset[length-1][0] - 50000, model.data.dataset[length-1][0]])
        let lowerDomain = this.selectionScale.invert(this.lowerRange + this.margin().left)
        let upperDomain = this.selectionScale.invert(this.upperRange + this.margin().left)
        this.xScale.domain([lowerDomain, upperDomain])
        
        
        //set up transistions and update axis
        document.body.offsetHeight
        setStyle(this.multiLine, {transition: "all 1s linear"})
        let updateDisplacement = this.xScale(model.data.dataset[length-1][0]) - this.xScale(this.lastDataTime)
        let selectionScaleDisplacement = this.selectionScale(model.data.dataset[length-1][0]) - this.selectionScale(this.lastDataTime)
        this.lastDataTime = model.data.dataset[length-1][0]
        setAttr(this.multiLine.el, {transform: "translate(" + -(updateDisplacement) + ",0)"})
        let tickData = tickFormatting(this.xScale.ticks())
        this.xAxis.update(this.xScale.ticks().map(function(d,i){return [this.xScale(d),tickData[i], updateDisplacement]}.bind(this)))
        this.selectionAxis.update(this.selectionScale.ticks().map(function(d){return [this.selectionScale(d),d.toTimeString().split(' ')[0], selectionScaleDisplacement]}.bind(this)))
        this.yAxis.update(this.yScale.ticks().map(function(d){return [this.yScale(d) ,d]}.bind(this)))
    }
    onChildEvent(type, data) {
        switch(type) {
            case "zoom":
                this.lowerRange = data[0]
                this.upperRange = data[1]
                if(data[2]) {
                    model.state.updateGraph = false
                } else model.state.updateGraph = true
                this.update()
                break
            case "toggelVisibility":
                model.state.visibility[data] = !model.state.visibility[data]
                break
        }
    }
    resize() {
        this.width(this.el.parentElement.clientWidth)
        this.height(this.width() * 9/16)
        this.xAxisOffset(this.height() - 100)
        setAttr(this.el, {width: this.width(), height: this.height()})
        let width = this.width()
        let margin = this.margin()
        let height = this.height()
        let xAxisOffset = this.xAxisOffset()
        this.upperRange = width - margin.left - margin.right
        this.xScale = d3.scaleTime().range([margin.left, width - margin.right])
        this.selectionScale = d3.scaleTime().range([margin.left, width - margin.right])
        this.yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]).domain([0,100])
        setAttr(this.xAxis, {transform: "translate(0," + xAxisOffset + ")"})
        setAttr(this.xAxis.path, {d: "M" + (margin.left + 0.5) + ",0.5H" + (width - margin.right - 0.5) })
        setAttr(this.selectionAxis, {transform:"translate(0," + (height - 30) + ")"})
        setAttr(this.selectionAxis.path, {d: "M" + (margin.left + 0.5) + ",0.5H" + (width - margin.right - 0.5) })
        setAttr(this.yAxis.path, {d: "M0.5," + (height - margin.bottom+ 0.5) + "V" + (margin.top - 0.5)})
        setAttr(this.clipPath.rect, {width: width - margin.left -margin.right, height: height - margin.top -margin.bottom})
        setAttr(this.xAxisClip.rect, {y: height - margin.bottom, width: width - margin.left - margin.right})
        this.selectionRectangle = new SelectionRectangle("X",this.height()-70,( this.xScale.range()[1] - this.xScale.range()[0]), 40, margin.left, this.onChildEvent.bind(this)/*this.onChildEvent("zoom")*/)
        setChildren(this.el, [this.clipPath, this.xAxisClip, this.conatiner, this.xAxisConatiner, this.selectionRectangle, this.yAxis, this.legends])
    }
}

class SelectionRectangle {
    constructor(dim, dy, width, height, dx, zoomFn) {
        this.dim = dim
        this.width = width
        this.height = height
        this.notifyParent = zoomFn
        this.touchending
        this.cursor = {overlay: "crosshair", selection:"move", n: "ns-resize", e: "ew-resize", s: "ns-resize", w: "ew-resize", nw: "nwse-resize", ne: "nesw-resize", se: "nwse-resize", sw: "nesw-resize"}
        this.signsX = {overlay: +1, selection: +1, n: null, e: +1, s: null, w: -1, nw: -1, ne: +1, se: +1,sw: -1}
        this.signsY = { overlay: +1, selection: +1, n: -1, e: null, s: +1, w: null, nw: -1, ne: -1, se: +1, sw: +1}
        this.extent = [[0,0],[this.width,this.height]]
        this.selectionExtent = null
        let started = function(event) {
            if (this.touchending && !event.touches) return;
            let type = event.target.getAttribute("data"),
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
            let point = point0
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
            setStyle(this.el, {"pointer-events":"none"})
            setAttr(this.overlay, {cursor: this.cursor[type]})
            let moved = function(event) {
                let point1
                if (event.type == "touchmove") {
                    point1 = [event.changedTouches[0].clientX,event.changedTouches[0].clientY]
                }
                else {
                    point1 = [event.clientX, event.clientY]
                }
                point = point1
                moving = true
                if (event.cancelable) event.preventDefault();
                event.stopImmediatePropagation();
                let obj = this
                move.bind(this)()
            }.bind(this)

            let ended = function(event) {
                if (event.type == "touchend" ) {
                    event.preventDefault()
                }
                event.stopImmediatePropagation();
                this.overlay.removeEventListener("mousemove", moved, true)
                this.overlay.removeEventListener("mouseup", ended, true)
                this.overlay.removeEventListener("mouseleave", ended, true)
                this.el.removeEventListener("touchmove", moved, true)
                this.el.removeEventListener("touchend", ended, true)
                setStyle(this.el, {"pointer-events":"all"})
                if(selection[0][0] - selection[1][0] == 0) this.selectionExtent = null
                if(this.selectionExtent) {
                    this.notifyParent("zoom",[this.selectionExtent[0][0], this.selectionExtent[0][0] + (this.selectionExtent[1][0] - this.selectionExtent[0][0]),1])
                }
                else {
                    this.notifyParent("zoom",[0,this.width, 0])
                }
                setAttr(this.overlay, {cursor:this.cursor["overlay"]})
                this.update()
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
                let t;
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

        this.overlay = svg("rect", {data:"overlay",x:0,y:0,width:this.width,height:this.height,cursor:this.cursor["overlay"],fill:"#E6E7E8",style:"pointer-events:all",onmousedown: started})
        this.selection = svg("rect", {data:"selection",height:40,cursor:this.cursor["selection"],fill:"#fff","fill-opacity":0.3,stroke:"#fff",style:"display:none",onmousedown: started})
        this.handleLeft = svg("rect.handle", {data:"w",height:40,cursor:this.cursor["w"],fill:"",style:"display:none",onmousedown: started})
        this.handleRight = svg("rect.handle", {data:"e",height:40,cursor:this.cursor["e"],fill:"",style:"display:none;",onmousedown: started})
        this.el = svg("g",{transform:"translate("+ dx +"," + dy +")",style:"pointer-events:all"}, this.overlay, this.selection, this.handleRight, this.handleLeft)
        this.overlay.addEventListener("touchstart", started, {passive: true})
        this.selection.addEventListener("touchstart", started, {passive: true})
        this.handleLeft.addEventListener("touchstart", started, {passive: true})
        this.handleRight.addEventListener("touchstart", started, {passive: true})
    }
    update() {
        if(this.selectionExtent) {
            setStyle(this.selection,{display:null})
            setAttr(this.selection, {x:this.selectionExtent[0][0], y:this.selectionExtent[0][1], width: this.selectionExtent[1][0] - this.selectionExtent[0][0], height: this.selectionExtent[1][1] - this.selectionExtent[0][1]})

            setStyle(this.handleLeft,{display:null, opacity: 0})
            setAttr(this.handleLeft, {x:this.selectionExtent[0][0] - 3, y:0, width: 6, height: this.height})

            setStyle(this.handleRight,{display:null, opacity: 0})
            setAttr(this.handleRight, {x:this.selectionExtent[1][0] - 3, y:0, width: 6, height: this.height})

            this.notifyParent("zoom",[this.selectionExtent[0][0], this.selectionExtent[0][0] + (this.selectionExtent[1][0] - this.selectionExtent[0][0]), 1])
        }
        else {
            setStyle(this.selection,{display:"none"})
            setStyle(this.handleLeft,{display:"none"})
            setStyle(this.handleRight,{display:"none"})
            this.notifyParent("zoom",[0,this.width, 0])
        }
    }
}

class DataGenerator {
    constructor() {
        this.animationId = null //ID to start and stop data generation 
        this.button = el("button.w-100.h2.f7", {onclick:function(e) {
            model.state.updateGraph = !model.state.updateGraph
        }.bind(this)}, "Pause")
        this.el = el("div.w-100", this.button)

        let lastDataUpdateTime = 0
        this.GenerateData = function() {
            this.button.textContent = model.state.updateGraph ? "Pause" : "Play"
            if (lastDataUpdateTime != 0) {
                if(Math.round((new Date()).getTime()) - lastDataUpdateTime > 1000) {
                    if (model.state.updateGraph) {
                        if (model.data.pending.length) {
                            model.data.dataset.push(...model.data.pending)
                            model.data.pending = []
                        }
                        model.data.dataset.push([Math.round((new Date()).getTime()), Math.floor(Math.random()*100 + 1), Math.floor(Math.random()*100 + 1)])
                    }
                    else {
                        model.data.pending.push([Math.round((new Date()).getTime()), Math.floor(Math.random()*100 + 1), Math.floor(Math.random()*100 + 1)])
                    }
                    lastDataUpdateTime =  Math.round((new Date()).getTime()) 
                }
            }
            else{
                lastDataUpdateTime =  Math.round((new Date()).getTime()) 
            }
            this.animationId = requestAnimationFrame(this.GenerateData)
            }.bind(this)
        this.start()
    }
    start() {
        this.animationId = requestAnimationFrame(this.GenerateData)
    }
    stop() {
        cancelAnimationFrame(this.animationId)
        this.animationId = null
    }
}

let graph = new LineChart()
let dataGenerator = new DataGenerator()

let total = el("div.w-100", dataGenerator, graph)

document.body.classList.add("w-100","h-100","fs7")
setStyle(document.body, {font: "6px sans-serif", margin: 0, padding: 0, "box-sizing": "border-box"})
setStyle(document.documentElement, {height:"100%", width:"100%", margin: 0, padding: 0, "box-sizing": "border-box"})
mount(document.body, total);

function tickFormatting(data) {
    let lastHour = null
    let lastMin = null
    let temp
    temp = data.map(function(k){
        d = k.toTimeString().split(' ')[0].split(":")
        if (d[0] == lastHour) {
            if (d[1] == lastMin) {
                return "::" + d[2]
            }
            else {
                lastMin = d[1]
                return ":" + d[1] + ":" + d[2]
            }
        }
        else {
            lastHour = d[0]
            return k.toTimeString().split(" ")[0]
        }
    })
    return temp
}

window.onresize = function(e) {
    graph.resize()
}