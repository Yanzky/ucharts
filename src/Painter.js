
/**
 * 使用canvas的context2d进行形状绘制
 */
export default class Painter {
    constructor(ctx) {
        this.ctx = ctx;
    }

    /**
     * 绘制多边形路径
     * @private
     * @param {Array}   points     - 多边形顶点数组，每个元素都是一个2元数据分别表示x,y坐标
     * @param {boolean} close=true - 是否关闭多边形
     */
    _drawPolygon(points, close=true) {
        const { ctx } = this;

        let [x, y] = points[0];

        ctx.beginPath();
        ctx.moveTo(x, y);
        points.slice(1).forEach(([x, y])=>{
            ctx.lineTo(x, y);
        });

        if (close) ctx.closePath();
    }

    /**
     * 绘制多边形
     * @param {Array} points - 多边形顶点数组，每个元素都是一个2元数据分别表示x,y坐标
     */
    drawPolygon(points, {close=true, fill=true, stroke=false}={}) {
        const { ctx } = this;

        this._drawPolygon(points, close);

        fill && ctx.fill();
        stroke && ctx.stroke();
    }


}
