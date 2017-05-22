import { scaleBand, scaleOrdinal } from 'd3-scale';
import ChartBase from '../ChartBase';


export const DEFAULT_PROPS = {
    paddingInner: 0.12,
    paddingOuter: 0.12,
    // backgroundColor: '#0d1327',
    // backgroundColor: 'transparent',
    headHeight: 15
};

/**
 * 折叠效果的标签
 */
export default class BeautyLabel extends ChartBase {
    constructor(container, props) {
        const p = Object.assign({}, DEFAULT_PROPS, props);

        super(container, p);
        // 左侧高度比例尺
        this.band = scaleBand()
                .paddingInner(p.paddingInner)
                .paddingOuter(p.paddingOuter)
                ;
        // 右侧高度比例尺
        this.band2 = scaleBand()
                .paddingInner(p.paddingInner)
                .paddingOuter(p.paddingOuter)
                ;


        this.color = scaleOrdinal().range(['#56c6ff', '#5c2cb9', 'steelblue']);

    }

    _makeGradient(start, end) {
        const { ctx } = this;
        const { width, height } = this.props;

        let gd = ctx.createLinearGradient(start, 0, end, 0);
        gd.addColorStop(0, 'rgba(0, 0, 0, 0.2)');
        gd.addColorStop(2 / 6, 'rgba(0, 0, 0, 0.01)');
        gd.addColorStop(2 / 6 + 0.001, 'rgba(0, 0, 0, 0.4)');
        gd.addColorStop(3 / 6, 'rgba(0, 0, 0, 0.3)');
        gd.addColorStop(3 / 6 + 0.001, 'rgba(0, 0, 0, 0.4)');
        gd.addColorStop(0.9, 'rgba(0, 0, 0, 0)');

        return gd;
    }

    bindData(data) {
        const { dataRoom: dr } = this;

        let update = dr.selectAll('mylabel').data(data);

        update.exit().remove();

        update.enter()
            .append('mylabel')
        .merge(update)
            .attr('label', d=>d[0])
            .attr('value', d=>d[1])
            ;
    }

    drawData() {
        const { ctx, band, band2, color, painter, dataRoom: dr } = this;
        let { width, height, headHeight, paddingOuter} = this.props;

        let labels = dr.selectAll('mylabel');
        band.domain(labels.data())
            .range([headHeight, height])
            ;
        // let h = band.bandwidth();
        let h = band.bandwidth()*2/3;

        band2.domain(labels.data())
            .range([headHeight + h / 3, height - h / 8])

        // let h2 = band2.bandwidth();
        let h2 = band2.bandwidth()*2/3;
        let x = paddingOuter * h;
        let w = width - x;
        let s = (width - 2 * x) / 6;
        let gradient = this._makeGradient(x, w);
        let y, y2;

        ctx.font = `${h/4}px "Microsoft YaHei"`;
        ctx.textBaseline = 'middle';

        labels.each(function(d){
            y = band(d);
            y2 = band2(d);
            ctx.fillStyle = color(d[0]);
            painter.drawPolygon([
                [x, y],
                [x + 2*s, y],
                [x + 3*s, y2],
                [w - h2/3, y2],
                [w, y2 + h2/2],
                [w - h2/3, y2 + h2],
                [x + 3*s, y2 + h2],
                [x + 2*s, y + h],
                [x, y + h]
            ]);
            // 填充渐变
            ctx.fillStyle = gradient;
            ctx.fill();
            // 绘制文字
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.fillText(d[0], x + s, y + h/2);
            ctx.textAlign = 'start';
            ctx.fillText(d[1].toLocaleString() + '户', x + 3.4 * s, y2 + h2/2);
        });
    }
}
