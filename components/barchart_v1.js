class Barchart {
    margin = {
        top: 30, right: 50, bottom: 50, left: 50
    }

    constructor(svg, data, width = 250, height = 250) {
        this.svg = svg;
        this.data = data;
        this.width = width;
        this.height = height;

        this.handlers = {};
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.xAxisGroup = this.container.append("g")
            .attr("transform", `translate(0, ${this.height})`);
        this.yAxisGroup = this.container.append("g");
    }

    update() {
        const x = d3.scaleBand()
            .domain(this.data.map(d => d.model))
            .range([0, this.width])
            .padding([0.2]);

        const y = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.average)])
            .range([this.height, 0]);

        const xAxisCall = d3.axisBottom(x);
        this.xAxisGroup.call(xAxisCall);

        const yAxisCall = d3.axisLeft(y);
        this.yAxisGroup.call(yAxisCall);

        this.rect = this.container.selectAll("rect")
            .data(this.data)
            .join("rect");

        this.rect
            .attr("x", d => x(d.model))
            .attr("y", d => y(d.average))
            .attr("width", x.bandwidth())
            .attr("height", d => this.height - y(d.average))
            .attr("fill", "steelblue")
            .attr("class", "bar");
    }

    on(eventType, handler) {
        this.handlers[eventType] = handler;
    }
}