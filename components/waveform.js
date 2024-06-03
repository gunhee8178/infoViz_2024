function sampleData(audio, sampleSize) {
    const filteredData = [];
    const blockSize = Math.floor(audio.length / sampleSize); // 각 구간의 샘플 수

    for (let i = 0; i < sampleSize; i++) {
        const blockStart = blockSize * i; // 구간의 첫 샘플 위치
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(audio[blockStart + j]); // 구간의 모든 샘플의 합
        }
        filteredData.push(sum / blockSize); // 평균값 저장
    }
    return filteredData;
}

class Waveform {
    margin = {
        top: 30, right: 20, bottom: 50, left: 20
    }

    constructor(svg, width = 860, height = 110, sampleSize = 253) {
        this.svg = svg;
        this.width = width;
        this.height = height;
        this.sampleSize = sampleSize
        this.handlers = {};
    }

    initialize() {
        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.xAxis = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top + this.height})`);
        const x = d3.scaleLinear()
            .domain([0, 5])
            .range([0, this.width]);
        const xAxisCall = d3.axisBottom(x);
        this.xAxis.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width - this.margin.right-10)
            .attr("y", height- this.margin.bottom/3)
            .attr("text-anchor", "middle")
            .text("Time (seconds)");

        this.xAxis.call(xAxisCall);

        this.middle = this.height / 2; // 중간 라인
        this.barWidth = this.width / this.sampleSize;

        this.brush = d3.brushX()
            .extent([[this.margin.left, 0], [this.svg.attr("width")-this.margin.right, this.svg.attr("height")-this.margin.bottom]])
            .on("brush end", (event) => this.brushed(event));
    }

    update(audio) {
        this.data = sampleData(audio, this.sampleSize);

        const flattenedData = this.data.map((d, i) => ({value: d, index: i}));
        const y = d3.scaleLinear()
            .domain([0, d3.max(flattenedData, d => d.value)])
            .range([0, this.middle]);

        const self = this;

        this.container.selectAll("rect")
            .data(flattenedData)
            .join("rect")
            .each(function (d){
                d3.select(this)
                    .attr("x", self.margin.left + (d.index * self.barWidth))
                    .attr("y", self.margin.top + self.middle - y(d.value))
                    .attr("width", self.barWidth * 0.9)
                    .attr("height", y(d.value) * 2)
                    .attr("class", "audio_sequence selected")
            })
        this.container.call(this.brush);
    }

    isBrushed(d, selection)
    {
        const [x0, x1] = selection;
        const barWidth = this.width / this.sampleSize;
        const x = this.margin.left + d.index * barWidth;
        return x0 <= x && x <= x1;
    }

    brushed(event)
    {
        const selection = event.selection;
        if (selection === null) return;

        this.selectedIndices = [];

        this.container.selectAll(".audio_sequence").classed("selected", (d, i, nodes) => {
            const isSelected = this.isBrushed(d, selection);
            if (isSelected) {
                this.selectedIndices.push(d.index);
            }
            return isSelected;
        });

        if (this.handlers.brush) {
            this.handlers.brush(this.selectedIndices);
        }
    }
    on(eventType, handler)
    {
        this.handlers[eventType] = handler;
    }
}