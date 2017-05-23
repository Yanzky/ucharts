import { geoPath, geoProjection, geoAlbers } from 'd3-geo';
import { scaleOrdinal } from 'd3-scale';
import { select } from 'd3-selection';

import ChartBase from '../ChartBase';
import shanxi from './shanxi.geo.json';


export const DEFAULT_PROPS = {
    mapTopColor: '#d80152',
    mapBottomColor: '#611d87',
    mapEdgeColor: '#4c165b',
    taxColor: '#a8003f',
    peopleColor: '#662d91',
    perColor: '#0c5283',
    padding: 10
};

export default class SXShuiYuan extends ChartBase {
    constructor(container, props) {
        const p = Object.assign({}, DEFAULT_PROPS, props);
        super(container, p);

        const { ele, dataRoom: dr } = this;

        // 陕西地图元素
        dr.append(ele('shanxiGeo'));
//        // 税收收入
//        dr.append(ele('tax'));
//        // 户数
//        dr.append(ele('people'));
//        // 税收占比
//        dr.append(ele('taxPercent'));
    }

    bindData(data) {
        const { ctx, ele, drawTransition, wrapAttr, dataRoom: dr, props: p } = this;
        const { width, height, mapTopColor, mapBottomColor, mapEdgeColor } = this.props;

        // 圆圈直径
        let R = Math.min((width - p.padding * 2) / 4, (height - p.padding * 2) / 3);
        let startR = R * 10;
        let distance = 1.5 * R;

        let color = scaleOrdinal().range([p.taxColor, p.peopleColor, p.perColor]);
        let angle = scaleOrdinal().range([Math.PI, Math.PI / 4 * 7, Math.PI / 4.7]);
        let dis = scaleOrdinal().range([distance, 0.9 * distance, 0.95 * distance]);
        let lineDis = scaleOrdinal().range([distance / 6, distance / 3, distance / 2.5]);
        let rs = scaleOrdinal().range([R / 2, R * 0.9 / 2, R / 2]);


        dr.selectAll('shanxiGeo')
            .attr('R', startR)
        .transition()
            .duration(p.duration)
            .attr('R', R / 1.2)
        .call(drawTransition);

        let update = dr.selectAll('circle').interrupt().data(data);

        update.exit().remove();

        update.enter()
            .append(ele('circle'))
        .merge(update)
        .call(wrapAttr)
            .attr('R', d=>rs(d[0]))
            .attr('angle', 0)
            .attr('distance', 0)
            .attr('lineDistance', 0)
            .attr('color', d=>color(d[0]))
        .transition()
            .duration(p.duration)
            .attr('angle', d=>angle(d[0]))
            .attr('distance', d=>dis(d[0]))
            .attr('lineDistance', d=>lineDis(d[0]))
        .call(drawTransition);


        // 中心装饰元素
        this.bindCenterItems(R / 2);
    }

    bindCenterItems(R) {
        const { dataRoom: dr, drawTransition, wrapAttr, props: p } = this;
        const PI = Math.PI;
        const A = (s, e, c, dash)=>([Math.PI / 16 * s, Math.PI / 16 * e, c, dash]);

        let dash = R / 15;
        // let angles = [
        //     A(1, 2, '#f7941e'),
        //     A(3.5, 6, '#0d5882'),
        //     A(9, 14, '#ee2a7b', [dash, dash * 2]),
        //     A(17, 23, '#da1c5c'),
        //     A(25, 30, '#2b3990', [dash, dash * 2]),
        //     // 内部
        //     A(3, 10, '#ef4136'),
        //     A(24, 28, '#662d91')
        // ];
        let angles = [
            A(1, 2, '#0d5882'),
            A(3.5, 6, '#0d5882'),
            A(9, 14, '#0d5882', [dash, dash * 2]),
            A(17, 23, '#0d5882'),
            A(25, 30, '#0d5882', [dash, dash * 2]),
            // 内部
            A(3, 10, '#0d5882'),
            A(24, 28, '#0d5882')
        ];

        let r = (d, i) => i>4 ? R : 1.2 * R;

        let update = dr.selectAll('centerCircle').interrupt().data(angles);

        update.enter()
            .append('centerCircle')
        .merge(update)
        .call(wrapAttr)
            .attr('R', r)
            .attr('startAngle', 0)
            .attr('endAngle', 2 * Math.PI)
            .attr('fillStyle', d=>d[2])
            .attr('dashed', d=>d[3] ? 1 : 0)
            .attr('lineWidth', dash)
        .transition()
        .duration(p.duration)
        .call(wrapAttr)
            .attr('startAngle', d=>d[0])
            .attr('endAngle', d=>d[1])
        .call(drawTransition)
    }

    drawData() {
        const { ctx, getAttrs, fetchAttrs, dataRoom: dr } = this;
        const { width, height, mapTopColor, mapBottomColor, mapEdgeColor } = this.props;
        let R, angle, distance, lineDistance, color;
        // 图表原点坐标
        let [oriX, oriY] = [width / 2, height / 2]
        ctx.translate(oriX, oriY);
        //--------------------
        let sxGeo = dr.selectAll('shanxiGeo');
        // 圆圈直径
        R = +sxGeo.attr('R');
        // 绘制地图
        let path = geoPath(null, ctx);
        let [[left, top], [right, bottom]] = path.bounds(shanxi);
        let [cx, cy] = [(left + right) / 2, (top + bottom) / 2]; //path.centroid(shanxi);
        let scale = Math.min(R / (right - left), R / (bottom - top)) / 1.1;
        let gradient = ctx.createLinearGradient(0, top, 0, bottom);
        gradient.addColorStop(0, mapTopColor);
        gradient.addColorStop(1, mapBottomColor);

        ctx.save();
        ctx.beginPath();
        // ctx.fillStyle = gradient;
        ctx.fillStyle = '#0d5882';
        ctx.strokeStyle = mapEdgeColor;
        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 0.1 / scale;
        ctx.scale(scale, -scale); // 地图的坐标Y轴与Canvas的坐标Y轴方向相反，所以取负值
        ctx.translate(-cx, -cy);
        path(shanxi);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
        // ----------------------

        dr.selectAll('circle').each(function(d){
            let cir = select(this);
            ({R, angle, distance, lineDistance, color} = fetchAttrs(cir));
            let [cx, cy] = [distance * Math.cos(angle), distance * Math.sin(angle)];
            let [lx, ly] = [lineDistance * Math.cos(angle), lineDistance * Math.sin(angle)];
            let fontSize = R / 3;
            let fontScale = 1;
            if (fontSize < 12) {
                fontScale = fontSize / 12;
                fontSize = 12;
            }
            // 连线
            ctx.save()
            // ctx.strokeStyle = color;
            ctx.strokeStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(cx, cy);
            ctx.stroke();
            ctx.restore();
            // 圆圈
            ctx.save();
            // ctx.fillStyle = color;
            ctx.fillStyle = "#0d5882";
            ctx.translate(cx, cy);
            ctx.beginPath();
            ctx.arc(0, 0, R, 0, 2 * Math.PI);
            ctx.fill();
            // 文字
            ctx.fillStyle = 'white';
            ctx.font = `${fontSize}px "Microsoft YaHei"`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            ctx.scale(fontScale, fontScale);
            ctx.fillText(d[0], 0, 0);
            // 数值
            ctx.textBaseline = 'top';
            // if(d[0] == "户数") {
            //     var value = d[1].toLocaleString() + "户"
            //     ctx.fillText(value, 0, 0);
            // } else if (d[0] == "税收收入") {
            //     var value = d[1].toLocaleString() + "亿"
            //     ctx.fillText(value, 0, 0);
            // } else {
            //     ctx.fillText(d[1], 0, 0);
            // }
            ctx.fillText(d[1], 0, 0);
            ctx.restore();
        });


        //-------------------
        // 中间装饰
        dr.selectAll('centerCircle').each(function(d){
            let circel = select(this);
            let attrs = fetchAttrs(circel);
            ctx.save();
            ctx.lineCap = 'round';
            attrs.dashed && ctx.setLineDash(d[3]);
            ctx.strokeStyle = attrs.fillStyle;
            ctx.lineWidth = attrs.lineWidth;
            ctx.beginPath();
            ctx.arc(0, 0, attrs.R, attrs.startAngle, attrs.endAngle);
            ctx.stroke();
            ctx.restore();
        });
    }
}
