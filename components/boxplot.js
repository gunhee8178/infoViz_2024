class Boxplot {
    margin = {
        top: 30, right: 50, bottom: 50, left: 50
    }

    constructor(svg, data, width = 250, height = 250) {
        var stdColumns = data.columns.filter(col => col.includes('std'));
        var kl_std = stdColumns.map(col => {
            return {
                model: col.replace('_std', ''),
                values: data.map(d => +d[col])
            };
        });

        this.svg = svg;
        this.data = kl_std;
        this.width = width;
        this.height = height;
        this.handlers = {};
    }

    initialize(order) {
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

        this.x = d3.scaleBand()
            .domain(order)
            .range([0, this.width])
            .padding([0.2]);

        this.y = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d3.max(d.values))])
            .range([this.height, 0]);

        this.z = d3.scaleOrdinal()
            .range(d3.schemeCategory10)
            .domain([...new Set(this.data.map(d => d.model))])

        const xAxisCall = d3.axisBottom(this.x);
        this.xAxisGroup.call(xAxisCall);

        const yAxisCall = d3.axisLeft(this.y);
        this.yAxis.call(yAxisCall);

        const boxWidth = this.x.bandwidth();

        const self = this
        this.container.selectAll("g")
            .data(this.data)
            .join("g")
            .attr("transform", d => `translate(${this.x(d.model)},0)`)
            .each(function(d) {
                const g = d3.select(this);
                const q1 = d3.quantile(d.values, 0.25);
                const median = d3.median(d.values);
                const q3 = d3.quantile(d.values, 0.75);
                const interQuantileRange = q3 - q1;
                const min = d3.min(d.values);
                const max = d3.max(d.values);

                // Draw the box
                g.append("rect")
                    .attr("class", "box")
                    .attr("x", boxWidth * 0.2)
                    .attr("y", self.y(q3))
                    .attr("width", boxWidth * 0.6)
                    .attr("height", self.y(q1) - self.y(q3))
                    .attr("fill", self.z(d.model));

                // Draw the median line
                g.append("line")
                    .attr("class", "median")
                    .attr("x1", boxWidth * 0.2)
                    .attr("x2", boxWidth * 0.8)
                    .attr("y1", self.y(median))
                    .attr("y2", self.y(median))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);

                // Draw the min and max lines
                g.append("line")
                    .attr("class", "whisker")
                    .attr("x1", boxWidth / 2)
                    .attr("x2", boxWidth / 2)
                    .attr("y1", self.y(min))
                    .attr("y2", self.y(max))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);

                // Draw the lines connecting to whiskers
                g.append("line")
                    .attr("class", "whisker")
                    .attr("x1", boxWidth * 0.2)
                    .attr("x2", boxWidth * 0.8)
                    .attr("y1", self.y(min))
                    .attr("y2", self.y(min))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);

                g.append("line")
                    .attr("class", "whisker")
                    .attr("x1", boxWidth * 0.2)
                    .attr("x2", boxWidth * 0.8)
                    .attr("y1", self.y(max))
                    .attr("y2", self.y(max))
                    .attr("stroke", "black")
                    .attr("stroke-width", 1);

            });
    }

    update(highlightIndex) {
        this.container.selectAll(".highlight").remove(); // Remove previous highlights

        const boxWidth = this.x.bandwidth();
        const self = this;

        this.container.selectAll("g")
            .data(this.data)
            .join("g")
            .attr("transform", d => `translate(${this.x(d.model)},0)`)
            .each(function(d) {
                const g = d3.select(this);
                const min = d3.min(d.values);
                const max = d3.max(d.values);

                g.on("mouseover", (event, d) => {
                    d3.select(".tooltip").select(".tooltip-inner")
                        .html(`max : ${max.toFixed(3)} <br> min : ${min.toFixed(3)}` + (highlightIndex!=undefined ? `<br> ${d.model} : ${d.values[highlightIndex].toFixed(3)}` : ``) );
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
                        const pointValue = d.values[highlightIndex];
                        if (pointValue !== undefined) {
                            g.append("circle")
                                .attr("class", "highlight")
                                .attr("cx", boxWidth / 2)
                                .attr("cy", self.y(pointValue))
                                .attr("r", 5)
                                .attr("fill", self.z(d.model))
                                .attr("stroke", "black")
                                .attr("stroke-width", 2);
                        }
                    }
                }catch (err) {
                    console.log(err);
                }
            });

    }

    on(eventType, handler) {
        this.handlers[eventType] = handler;
    }
}