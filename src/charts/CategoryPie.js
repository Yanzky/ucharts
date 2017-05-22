import ChartBase from '../ChartBase';

import { pie as Pie, arc as Arc } from 'd3-shape';
import { scaleOrdinal } from 'd3-scale';
import { select } from 'd3-selection';
import 'd3-transition';


export const DEFAULT_PROPS = {
    padding: 10,
    colors: ['#3791d0', '#3dd5ae', 'steelblue']
};

/**
 * 具有类别汇总功能的饼状图
 *
 * 所需数据格式：
 *   data类型：数组
 *   数组元素：三个元素的数据，三个元素分别为指标名、数值、所属分类
 */
export default class CategoryPie extends ChartBase {
    constructor(container, props) {
        const p = Object.assign({}, DEFAULT_PROPS, props);
        super(container, p);

        const { ele, dataRoom: dr } = this;
        const { colors } = this.props;

        this.outerPies = dr.append(ele('outerPies'));
        this.innerPies = dr.append(ele('innerPies'));

        this.outerShape = Pie()
                .value(d=>d[1])
                .sort((a, b)=>a[2].localeCompare(b[2]))
                ;
        this.innerShape = Pie()
                .value(d=>d[1])
                .sort((a, b)=>a[0].localeCompare(b[0]))
                ;

        this.color = scaleOrdinal().range(colors);
    }

    bindData(data) {
        const { outerShape, innerShape, outerPies, innerPies } = this;
        // 外部形状数据
        let opies = outerShape(data);
        // 内部分类汇总数据
        let category = data.reduce((p, n)=>{
            let [name, value, cate] = n;
            console.log(cate);
            p[cate] || (p[cate] = 0);
            p[cate] += +((value/10000).toFixed(2));
            // p[cate] += +value;
            return p;
        }, {});
        category = Object.entries(category);
        let ipies = innerShape(category);

        this.bindOuterData(opies);
        this.bindInnerData(ipies);
    }

    /**
     * 绑定外部形状数据
     * @param {Array} data - 外部形状数据
     */
    bindOuterData(data) {
        const { outerPies, color, wrapAttr, props: p } = this;
        let update = outerPies.selectAll('pies')
            .interrupt()
            .data(data);

        update.exit().remove();
        update.enter()
            .append('pies')
        .call(wrapAttr)
            .attr('startAngle', d=>d.startAngle)
            .attr('endAngle', d=>d.startAngle)
        .merge(update)
        .call(wrapAttr)
            .attr('label', d=>d.data[0])
            .attr('value', d=>d.value)
        .transition()
        .call(wrapAttr)
            .duration(p.duration)
            .attr('fillStyle', d=>color(d.data[2]))
            .attr('startAngle', d=>d.startAngle)
            .attr('endAngle', d=>d.endAngle)
        .call(this.drawTransition)
        ;
    }

    /**
     * 绑定内部形状数据
     * @param {Array} data - 外部形状数据列表
     */
    bindInnerData(data) {
        const { innerPies, color, wrapAttr, props: p } = this;

        let update = innerPies.selectAll('pies').data(data);

        update.exit().remove();
        update.enter()
            .append('pies')
        .call(wrapAttr)
            .attr('startAngle', d=>d.startAngle)
            .attr('endAngle', d=>d.startAngle)
        .merge(update)
        .call(wrapAttr)
            .attr('label', d=>d.data[0])
            .attr('value', d=>d.value)
        .interrupt()
        .transition()
            .duration(p.duration)
        .call(wrapAttr)
            .attr('fillStyle', d=>color(d.data[0]))
            .attr('startAngle', d=>d.startAngle)
            .attr('endAngle', d=>d.endAngle)
        .call(this.drawTransition)
        ;
    }

    drawData() {
        const { outerPies, innerPies, fetchAttrs, getAttrs, ctx } = this;
        const { width, height, padding } = this.props;
        // 绘制形状
        const drawPie = function(pie, attrs){
            ctx.save();
            ctx.fillStyle = attrs.fillStyle;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            arcShape(attrs);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        };

        let R = Math.min(width - 2*padding, height - 2 * padding) / 2.5;
        let r = R/3;
        // 内部图形半径
        let iEndR = 2.5 * r;
        let oStartR = 4 * r;
        let arcShape = Arc().context(ctx);
        let [centerX, centerY] = [width / 2, height / 2];
        let fontSize = r / 3,
            fontScale = 1;
        // Chrome浏览器最小字体是12px，通过缩放手段解决
        if (fontSize < 12) {
            fontScale = fontSize / 12;
            fontSize = 14;
        }

        ctx.translate(centerX, centerY);
        ctx.strokeStyle = 'white';


//         // 绘制外部形状
//         arcShape
//             .innerRadius(oStartR)
//             .outerRadius(R);
//         outerPies.selectAll('pies').each(function(d){
//             let pie = select(this);
//             let attrs = fetchAttrs(pie);
//             drawPie.call(this, pie, attrs);
//
//             // 绘制文字
//             let arc = Arc();
//             let [x, y] = arc.centroid(Object.assign({}, attrs, {
//                 innerRadius: R,
//                 outerRadius: R + r
//             }));
//             let [edgex, edgey] = arc.centroid(Object.assign({}, attrs, {
//                 innerRadius: R,
//                 outerRadius: R
//             }));
//             let tx, ty, mtext;
//
//             // 计算文字位置
//             ctx.save();
//             if (x > 0) {
//                 ctx.textAlign = 'start';
//                 tx = x + r/2;
//             } else {
//                 ctx.textAlign = 'end';
//                 tx = x - r/2;
//             }
//
//             ty = y;
//
//             ctx.textBaseline = 'middle';
//             ctx.fillStyle = 'white';
//             ctx.font = `${fontSize}px "Microsoft YaHei"`;
//             ctx.translate(tx, ty);
//             ctx.scale(fontScale, fontScale);
// //            mtext = ctx.measureText(attrs.label);
// //            if (tx + mtext.width > width / 2 || tx - mtext.width < -width / 2) {
// //                ctx.textAlign = 'center';
// //                tx = edgex;
// //                x = edgex;
// //            }
//             ctx.fillText(attrs.label, 0, 0);
//             ctx.restore();
//
//             // 绘制连线
//             ctx.save()
//             ctx.beginPath();
//             ctx.moveTo(tx, ty);
//             ctx.lineTo(x, y);
//             ctx.lineTo(edgex, edgey);
//             ctx.stroke();
//             ctx.restore();
//         });

        // 绘制内部形状
        arcShape.innerRadius(0).outerRadius(iEndR);
        innerPies.selectAll('pies').each(function(d){
            let pie = select(this);
            let attrs = fetchAttrs(pie);
            drawPie.call(this, pie, attrs);

            let [cx, cy] = arcShape.centroid(attrs);

            ctx.save();
            ctx.fillStyle = 'white';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = `${fontSize}px "Microsoft YaHei"`;
            ctx.translate(cx, cy);
            ctx.scale(fontScale, fontScale);
            ctx.fillText(attrs.label + '(亿)', 20, 0);
            ctx.fillText(attrs.value, 0, fontSize);
            ctx.restore();
        });
    }
}
