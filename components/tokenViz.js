function compressArray(arr, selectedIndices) {
    let n_tokens = arr[0].length
    if (selectedIndices === null ){
        selectedIndices = Array.from({length: arr.length}, (_, i) => i);
    }

    let result = new Array(n_tokens).fill(0);
    for (let i = 0; i < n_tokens; i++) {
        let sum = 0;
        for (let j = 0; j < selectedIndices.length; j++) {
            sum += arr[selectedIndices[j]][i];
        }
        result[i] = sum / selectedIndices.length;
    }
    return result;
}

function combineTokensWithImportance(tokens, importanceArray) {

    return tokens.map((token, index) => {
        return { token: token, importance: importanceArray[index] };
    });
}

class TokenViz {
    margin = {
        top: 10, right: 20, bottom: 10, left: 20
    }

    constructor(svg, width = 860, height = 110, sampleSize = 253) {
        this.svg = svg;
        this.width = width;
        this.height = height;
        this.handlers = {};
    }

    initialize(models) {
        this.svg = d3.select(this.svg);
        this.container = this.svg.append("g");
        this.container.attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);

        this.svg
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.z = d3.scaleOrdinal()
            .range(d3.schemeCategory10)
            .domain(models);

    }

    update(tokens, importance, selectedIndices, selectedModel) {
        const tokenHeight = 30;
        const tokenPadding = 5;

        let compressed_importance = compressArray(importance, selectedIndices);
        let tokens_importance = combineTokensWithImportance(tokens, compressed_importance);

        const self = this;

        let xOffset = 0;
        let y = self.margin.top;

        this.svg
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        this.container.selectAll("g").remove();
        this.container.selectAll("g")
            .data(tokens_importance)
            .join("g")
            .each(function (d){
                const g = d3.select(this);

                g.append('text')
                    .attr("x", self.margin.left + xOffset)
                    .attr("y",  y + tokenHeight/2)
                    .attr("dy", ".35em")
                    .attr("class", "token")
                    .text(d.token);

                const bbox = g.selectAll("text").node().getBBox();
                g.append("rect")
                    .attr("x", self.margin.left + xOffset )
                    .attr("y", y)
                    .attr("width", bbox.width)
                    .attr("height", tokenHeight)
                    .attr("class", "token-background")
                    .attr("fill-opacity", d.importance)
                    .attr('fill', self.z(selectedModel));

                g.selectAll("text").raise();

                xOffset += bbox.width + tokenPadding;
                if (xOffset > self.width-(self.margin.left+self.margin.right)) {
                    xOffset = 0;
                    y += (tokenHeight + tokenPadding*3);
                    self.svg.attr("height", +self.svg.attr("height") + (tokenHeight + (tokenPadding*3)));

                    g.selectAll("text").attr("x", self.margin.left + xOffset);
                    g.selectAll("text").attr("y", y + tokenHeight/2);
                    g.selectAll("rect").attr("x", self.margin.left + xOffset);
                    g.selectAll("rect").attr("y", y);

                    xOffset += bbox.width + tokenPadding;
                }


                g.on("mouseover", (event, d) => {
                    d3.select(".tooltip").select(".tooltip-inner")
                        .html(`${d.importance.toFixed(3)}`);
                    Popper.createPopper(event.target, d3.select(".tooltip").node(), {
                        placement: "bottom",
                        modifiers: [
                            {
                                name: "offset",
                                options: {
                                    offset: [0, 10],
                                },
                            }
                        ],
                    });
                    d3.select(".tooltip").style("display", "block");
                })
                .on("mouseout", (d) => {
                    d3.select(".tooltip").style("display", "none");
                });
            });
    }
    on(eventType, handler)
    {
        this.handlers[eventType] = handler;
    }
}