import ChartBase from '../ChartBase';
import { select } from 'd3-selection';
import { scaleBand, scaleOrdinal } from 'd3-scale';
import { arc } from 'd3-shape';
import 'd3-transition';


export const DEFAULT_PROPS = {
    startRadian: Math.PI,
    endRadian: 2 * Math.PI,
    padding: 40,
    colors: ['#f26522', '#f7941e', '#f9d132', '#709c34', '#006cae']
};

/**
 * 颜色鲜艳的扇形图
 */
export default class ColorFan extends ChartBase {
    constructor(container, props) {
        const p = Object.assign({}, DEFAULT_PROPS, props);
        super(container, p);

        this.radian = scaleBand()
                .range([p.startRadian, p.endRadian])
        ;
        this.color = scaleOrdinal().range(p.colors);
    }

    bindData(data) {
        const { radian, color, ctx, ele, wrapAttr, dataRoom: dr, props: p } = this;
        const { width, height, padding, startRadian, endRadian } = this.props;

        let fanRd;

        radian.domain(data.map(d=>d[0]));
        fanRd = radian.bandwidth();

        let update = dr.selectAll('myFan').interrupt().data(data);

        update.exit().remove();
        update.enter()
            .append(ele('myFan'))
        .merge(update)
            .call(wrapAttr)
            .attr('startAngle', startRadian) //(startRadian + endRadian) / 2)
            .attr('endAngle', startRadian) //(startRadian + endRadian) / 2)
            .attr('label', d=>d[0])
            .attr('value', d=>d[1])
        .transition()
            .call(wrapAttr)
            .duration(p.duration)
            .attr('startAngle', d=>radian(d[0]))
            .attr('endAngle', d=>radian(d[0]) + fanRd)
            .attr('fillStyle', d=>color(d[0]))
            .attr('fanRd', fanRd)
        .call(this.drawTransition)
        ;
    }

    drawData() {
        const { ctx, dataRoom: dr, getAttrs, fetchAttrs } = this;
        const { width, height, padding } = this.props;
        // 每个大扇叶的整体半径  to-do根据角度范围计算高度值
        let R = (Math.min((width - 2 * padding) / 2, height - 2 * padding))*0.7;
        // 整体半径分为小段
        let r = R / 16;
        let innerR = 6 * r;
        let outerStart = innerR + 1.5 * r;
        let cornerR = 1 * r;
        let cornerRd = Math.asin(cornerR / R) * 2;
        let fans = dr.selectAll('myFan');
        // 内部小扇形
        let arcShape = arc()
                .context(ctx)
                .innerRadius(0)
                .outerRadius(innerR);

        // 移动原点坐标  to-do根据角度范围计算垂直方向的移动
        ctx.translate(width / 2, height - 2*padding);

        fans.each(function(d, i, dlist){
            let fan = select(this), attrs, startAngle, endAngle;
            attrs = fetchAttrs(fan);
            ctx.fillStyle = attrs.fillStyle;
            ctx.strokeStyle = attrs.fillStyle;
            ctx.lineWidth = r * 0.6;
            ([startAngle, endAngle] = [+attrs.startAngle, +attrs.endAngle]);

            // 绘制中心扇形
            ctx.save();
            // 向外移动一点小距离，使扇形分离
            ctx.rotate((startAngle + endAngle) / 2);

            ctx.translate(r, 0);
            ctx.rotate(-(startAngle + endAngle) / 2);
            // 消除d3起始角度为-Math.PI/2的影响
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            arcShape(attrs);
            ctx.fill();
            ctx.restore();

            // 绘制外层扇形线条
            ctx.save();
            ctx.rotate(startAngle);
            ctx.beginPath();
            ctx.moveTo(outerStart, 0);
            ctx.lineTo(R - cornerR, 0);
            ctx.arc(R - cornerR, cornerR, cornerR, -Math.PI / 2, 0, false);
            ctx.arc(0, 0, R, cornerRd, +attrs.fanRd - cornerRd / 2, false);
            ctx.stroke();
            // 绘制最后一根线
            if (i == dlist.length - 1) {
                ctx.rotate(attrs.fanRd);
                ctx.beginPath();
                ctx.moveTo(outerStart, 0);
                ctx.lineTo(R - cornerR, 0);
                ctx.stroke();
            }
            ctx.restore();

            // 绘制标题
            let fontSize = r * 4 / 3;
            let fontScale = 1;
            // Chrome浏览器最小字体是12px，通过缩放手段解决
            if (fontSize < 12) {
                fontScale = fontSize / 12;
                fontSize = 12;
            }
            ctx.save();
            ctx.textAlign = "center";
            // ctx.textBaseline = "bottom";
            ctx.font = `${fontSize}px "Microsoft YaHei"`;
            ctx.rotate((startAngle + endAngle) / 2);
            ctx.translate(R + cornerR, 0);
            ctx.rotate(Math.PI/2);
            ctx.scale(fontScale, fontScale);
            ctx.fillText(attrs.label, 0, 0);
            ctx.restore();

            // 绘制数值
            let [cx, cy] = arc().centroid({
                startAngle,
                endAngle,
                innerRadius: outerStart,
                outerRadius: R
            });
            fontSize = r * 5 / 4;
            fontScale = 1;
            // Chrome浏览器最小字体是12px，通过缩放手段解决
            if (fontSize < 12) {
                fontScale = fontSize / 12;
                fontSize = 12;
            }
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.font = `${fontSize}px "Microsoft YaHei"`;
            // 消除d3起始角度为-Math.PI/2的影响
            ctx.rotate(Math.PI / 2);
            ctx.translate(cx, cy);
            ctx.rotate(-Math.PI / 2);
            ctx.scale(fontScale, fontScale);
            // if(attrs.label == "实现税款") {
            //     var value = (attrs.value).toFixed(2) + "亿元"
            //     writeTextOnCanvas(ctx,20,8,value,0,0)
            // } else {
            //     ctx.fillText(attrs.value, 0, 0);
            // }
            ctx.fillText(attrs.value, 0, 0);
            ctx.restore();
        });
    }
}

function writeTextOnCanvas(ctx_2d, lineheight, bytelength, text ,startleft, starttop){
    function getTrueLength(str){//获取字符串的真实长度（字节长度）
        var len = str.length, truelen = 0;
        for(var x = 0; x < len; x++){
            if(str.charCodeAt(x) > 128){
                truelen += 2;
            }else{
                truelen += 1;
            }
        }
        return truelen;
    }
    function cutString(str, leng){//按字节长度截取字符串，返回substr截取位置
        var len = str.length, tlen = len, nlen = 0;
        for(var x = 0; x < len; x++){
            if(str.charCodeAt(x) > 128){
                if(nlen + 2 < leng){
                    nlen += 2;
                }else{
                    tlen = x;
                    break;
                }
            }else{
                if(nlen + 1 < leng){
                    nlen += 1;
                }else{
                    tlen = x;
                    break;
                }
            }
        }
        return tlen;
    }
    for(var i = 1; getTrueLength(text) > 0; i++){
        var tl = cutString(text, bytelength);
        ctx_2d.fillText(text.substr(0, tl).replace(/^\s+|\s+$/, ""), startleft, (i-1) * lineheight + starttop);
        text = text.substr(tl);
    }
}
