import ChartBase from '../ChartBase';

import { scaleLinear, scaleOrdinal, scalePoint } from 'd3-scale';
import { extent } from 'd3-array';
import { select } from 'd3-selection';
import { arc as Arc } from 'd3-shape';
import { easeLinear } from 'd3-ease';


export const DEFAULT_PROPS = {
    padding: 10,
    minCenterRadius: 10, // 彩虹圆环空心半径最小值
    startRadian: 1.5*Math.PI,
    endRadian: 0.5*Math.PI,
    colors: ['#cdbd13', '#004cd7', '#b627d0', 'steelblue', 'pink'],
};

/**
 * 彩虹J图表
 * 所需数据格式：
 *   data类型：数组
 *   数组元素：两个元素的数组，这两个元素分别为label与value
 *   example: []
 */
export default class RainbowJ extends ChartBase {
    constructor(container, props) {
        let p = Object.assign({}, DEFAULT_PROPS, props);
        super(container, p);

        this.scale = scaleLinear();
        this.color = scaleOrdinal().range(p.colors)
    }

    bindData(data) {
        const { ele, wrapAttr, minCenterRadius, drawTransition, scale, color, dataRoom: dr } = this;
        const { duration, width, height, padding, startRadian, endRadian } = this.props;

        let R = (height*1.2 - 2 * padding) / 4; // 彩虹圆环空心半径
        let r = R / (data.length + 1);
        let cr = r;
        if ( cr < minCenterRadius) {
            cr = minCenterRadius;
            r = (R - cr) / data.length;
        }
        let w = width - 2 * padding;
        let top = Math.min(1.2 * R, w / 2);
        let head = Math.min(1.2 * cr, w / 4);
        // let h = height - 2 * padding;
        // let top = Math.min(1.2 * R, h / 2);
        // let head = Math.min(1.2 * cr, h / 4);
        scale.domain(extent(data.map(d=>d[1])))
            .range([head, top]);

        data.sort((a, b)=>a[1] - b[1]);
        let textScale = scalePoint().domain(data.map(d=>d[0])).range([head * 1.2, top]);

        let update = dr.selectAll('rainbow').interrupt().data(data);

        update.exit().remove();

        update.enter()
            .append(ele('rainbow'))
        .call(wrapAttr)
            .attr('startAngle', startRadian)
            .attr('endAngle', startRadian)
        .merge(update)
        .call(wrapAttr)
            .attr('label', d=>d[0])
            .attr('fillStyle', d=>color(d[0]))
            .attr('width', r)
            .attr('R', R)
        .transition()
        .call(wrapAttr)
            .duration(duration / 2)
            .ease(easeLinear)
            .attr('innerRadius', (d, i)=>(i * r + cr))
            .attr('outerRadius', (d, i)=>(i * r + cr + r))
            .attr('value', d=>d[1])
            .attr('endAngle', endRadian)
            .attr('textY', (d, i)=>textScale(d[0]))
            // .attr('textX', (d, i)=>-1.5 * R + i * r + width)
            .attr('textX', (d, i)=>1.5 * R + i * r)
        .call(drawTransition)
        .transition()
        .call(wrapAttr)
            .duration(duration / 2)
            .attr('height', d=>scale(d[1]))
        .call(drawTransition)
        ;
    }

    drawData() {
        const { ctx, dataRoom: dr, fetchAttrs, getAttrs } = this;
        const { startRadian, endRadian, width, height } = this.props;

        let arc = Arc().context(ctx);

        ctx.translate(width/4, height / 2);
        // ctx.translate(width / 2, height / 2);

        dr.selectAll('rainbow').each(function(d){
            let rainbow = select(this);
            let attrs = fetchAttrs(rainbow);
            ctx.fillStyle = attrs.fillStyle;

            // 绘制半圆环
            ctx.save();
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            arc(attrs);
            ctx.fill();
            ctx.restore();

            // 绘制柱形
            ctx.save();
            ctx.beginPath();
            ctx.rect(0, attrs.innerRadius, attrs.height, attrs.width);
            ctx.fill();
            ctx.restore();

            // 绘制文字
            let fontSize = attrs.width / 5 * 4;
            let fontScale = 1;
            if (fontSize < 12) {
                fontScale = fontSize / 12;
                fontSize = 12;
            }
            // let [px, py] = [(attrs.innerRadius + attrs.outerRadius) / 2, -attrs.height + attrs.width];
            let [px, py] = [attrs.height, (attrs.innerRadius + attrs.outerRadius) / 2];
            ctx.save();
            ctx.font = `${fontSize}px "Microsoft YaHei"`;
            ctx.textAlign = 'end';
            ctx.textBaseline = 'bottom';
            ctx.translate(attrs.textX, attrs.textY);
            ctx.scale(fontScale, fontScale);
            ctx.fillStyle = 'white';
            let tm1 = ctx.measureText((attrs.value));
            ctx.fillText(attrs.label, attrs.textX + tm1.width*1.5, 0);
            let tm = ctx.measureText(attrs.label);
            ctx.font = ctx.font = `${fontSize * 1.5}px "Microsoft YaHei"`;
//            ctx.textBaseline = 'middle';
//             ctx.fillText(attrs.value, -tm.width, 0);
            let value = attrs.value.toLocaleString() + "户"
            ctx.fillText(value, attrs.textX, 0);
            ctx.restore();
            //  文字连线
            // let lineY = attrs.textY - fontSize * fontScale / 2;
            let lineY = attrs.textY - fontSize * fontScale;
            ctx.save();
            ctx.strokeStyle = 'white';
            ctx.fillStyle = 'white';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(attrs.textX, lineY);
            ctx.lineTo(attrs.textX - 1.5 * attrs.R, lineY);
            ctx.lineTo(0, py);
            ctx.stroke();
            // 小圆点
            ctx.beginPath();
            ctx.arc(0, py, attrs.width / 10, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        });

    }
}
