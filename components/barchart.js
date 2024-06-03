class Barchart {
    margin = {
        top: 30, right: 50, bottom: 50, left: 50
    }

    constructor(svg, data, width = 250, height = 250) {
        var meanColumns = data.columns.filter(col => col.includes('mean'));
        var data = meanColumns.map(col => {
            return {
                model: col.replace('_mean', ''),
                values: data.map(d => +d[col])
            };
        });

        this.svg = svg;
        this.data = data;
        this.width = width;
        this.height = height;

        this.handlers = {};
    }

    initialize(order) {
        var kl_mean = this.data.map(item => {
            var meanValue = d3.mean(item.values);
            return {
                model: item.model,
                average: meanValue
            };
        });

        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        this.xAxisGroup = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`);
        this.yAxis = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

                // Add X axis
        this.x = d3.scaleBand()
            .domain(order)
            .range([0, this.width])
            .padding([0.2]);

        this.y = d3.scaleLinear()
            .domain([0, d3.max(kl_mean, d => d.average) * 1.8])
            .range([this.height, 0]);

        this.z = d3.scaleOrdinal()
            .range(d3.schemeCategory10)
            .domain([...new Set(this.data.map(d => d.model))])

        const self = this

        const xAxisCall = d3.axisBottom(self.x);
        this.xAxisGroup.call(xAxisCall);

        const yAxisCall = d3.axisLeft(self.y);
        this.yAxis.call(yAxisCall);

        var height = this.height;
        this.container.selectAll("g")
            .data(kl_mean)
            .join("g")
            .each(function(d) {

                d3.select(this)
                    .append("rect")
                    .attr("x", self.x(d.model))
                    .attr("y", self.y(d.average))
                    .attr("width", self.x.bandwidth())
                    .attr("height", height - self.y(d.average))
                    .attr("fill", self.z(d.model))
                    .attr("class", "bar")
                    .attr("average", d.average);
            });
    }

    update(highlightIndex) {
        var self = this;
        this.container.selectAll(".highlight").remove(); // Remove previous highlights

        this.container.selectAll("g")
            .data(this.data)
            .join("g")
            .each(function(d) {
                const g = d3.select(this);

                g.on("mouseover", (event, val) => {
                    d3.select(".tooltip").select(".tooltip-inner")
                        .html((`Average: ${(+g.select('rect').attr('average')).toFixed(3)}`) + (highlightIndex!=undefined ? `<br> ${d.model} : ${d.values[highlightIndex].toFixed(3)}` : ``));
                    Popper.createPopper(event.target, d3.select(".tooltip").node(), {
                        placement: "top",
                        modifiers: [
                            {
                                name: "offset",
                                options: {
                                    offset: [0, self.margin.bottom],
                                },
                            }
                        ],
                    });
                    d3.select(".tooltip").style("display", "block");
                })
                .on("mouseout", (d) => {
                    d3.select(".tooltip").style("display", "none");
                });


                try{
                    if (highlightIndex !== undefined) {
                        var pointValue = d.values[highlightIndex];
                        if (pointValue !== undefined) {
                            if(pointValue < 0){
                                pointValue = 0;
                            }
                            else if(pointValue > self.y.domain()[1]){
                                pointValue =  self.y.domain()[1];
                            }
                            else {
                                pointValue = pointValue;
                            }

                            g.append("circle")
                                .attr("class", "highlight")
                                .attr("cx", self.x(d.model) + self.x.bandwidth() / 2)
                                .attr("cy", self.y(pointValue))
                                .attr("r", 5)
                                .attr("fill", self.z(d.model))
                                .attr("stroke", "black")
                                .attr("stroke-width", 2);
                        }
                    }
                }catch (err) {}
            });

    }

    on(eventType, handler) {
        this.handlers[eventType] = handler;
    }
}